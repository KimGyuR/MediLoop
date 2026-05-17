package com.mediloop.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediloop.backend.dto.AnalyzeFillBagRequest;
import com.mediloop.backend.dto.AnalyzeHospitalRequest;
import com.mediloop.backend.dto.AnalyzeHomeRequest;
import com.mediloop.backend.dto.AnalysisResponse;
import com.mediloop.backend.dto.DiseaseScoreResponse;
import com.mediloop.backend.dto.FillBagAnalysisResponse;
import com.mediloop.backend.dto.HospitalCardResponse;
import com.mediloop.backend.dto.LocationRequest;
import com.mediloop.backend.dto.SummaryResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class AnalysisService {
  private static final int AI_MAX_ATTEMPTS = 3;

  private final OpenAiChatClient openAiChatClient;
  private final NearbyHospitalService nearbyHospitalService;
  private final ObjectMapper objectMapper;
  private final String model;

  public AnalysisService(
      OpenAiChatClient openAiChatClient,
      NearbyHospitalService nearbyHospitalService,
      ObjectMapper objectMapper,
      @Value("${openai.model:gpt-4.1-mini}") String model) {
    this.openAiChatClient = openAiChatClient;
    this.nearbyHospitalService = nearbyHospitalService;
    this.objectMapper = objectMapper;
    this.model = model;
  }

  public AnalysisResponse analyzeHome(AnalyzeHomeRequest request) {
    AnalysisResponse diagnosis = analyzeDiagnosisOnly(buildHomePrompt(request), true, request.imageBase64(), request.imageMimeType());
    return buildLocationAwareRecommendation(
        diagnosis,
        safe(request.symptomText()),
        "",
        safeCoordinate(request.latitude()),
        safeCoordinate(request.longitude()));
  }

  public AnalysisResponse analyzeHospital(AnalyzeHospitalRequest request) {
    AnalysisResponse diagnosis = analyzeDiagnosisOnly(buildHospitalPrompt(request), false, request.imageBase64(), request.imageMimeType());
    return buildLocationAwareRecommendation(
        diagnosis,
        safe(request.symptomText()),
        safe(request.conditionText()),
        safeCoordinate(request.latitude()),
        safeCoordinate(request.longitude()));
  }

  public AnalysisResponse recommendByLocation(LocationRequest request) {
    return nearbyHospitalService.recommend(safeCoordinate(request.latitude()), safeCoordinate(request.longitude()));
  }

  public FillBagAnalysisResponse analyzeFillBag(AnalyzeFillBagRequest request) {
    try {
      String content = requestAiWithRetry(
          "fillbag",
          buildFillBagPrompt(request),
          request.imageBase64(),
          request.imageMimeType());
      JsonNode root = objectMapper.readTree(content);
      return mapFillBagResponse(root);
    } catch (AiAnalysisUnavailableException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new AiAnalysisUnavailableException("AI fill bag analysis failed.", ex);
    }
  }

  private AnalysisResponse buildLocationAwareRecommendation(
      AnalysisResponse diagnosis,
      String symptomText,
      String conditionText,
      double latitude,
      double longitude) {
    NearbyHospitalService.PublicHospitalSearch rawSearch = nearbyHospitalService.searchPublicHospitals(latitude, longitude);
    NearbyHospitalService.PublicHospitalSearch search = curateHospitalCandidates(
        diagnosis,
        symptomText,
        conditionText,
        rawSearch);
    HospitalSelection selection = rerankHospitalsWithAi(diagnosis, symptomText, conditionText, search);

    List<HospitalCardResponse> rankedHospitals = new ArrayList<>();
    for (Integer index : selection.hospitalIndexes()) {
      if (index >= 0 && index < search.hospitals().size()) {
        rankedHospitals.add(search.hospitals().get(index));
      }
    }

    HospitalCardResponse emergencyHospital = null;
    if (selection.emergencyIndex() != null
        && selection.emergencyIndex() >= 0
        && selection.emergencyIndex() < search.emergencyHospitals().size()) {
      emergencyHospital = search.emergencyHospitals().get(selection.emergencyIndex());
    }

    if (rankedHospitals.isEmpty()) {
      throw new AiAnalysisUnavailableException("AI hospital ranking produced no usable hospital results.");
    }

    return new AnalysisResponse(diagnosis.summary(), rankedHospitals, emergencyHospital);
  }

  private NearbyHospitalService.PublicHospitalSearch curateHospitalCandidates(
      AnalysisResponse diagnosis,
      String symptomText,
      String conditionText,
      NearbyHospitalService.PublicHospitalSearch rawSearch) {
    List<HospitalCardResponse> candidatePool = filterNearbyHospitalCards(rawSearch);
    if (candidatePool.isEmpty()) {
      candidatePool = rawSearch.hospitals();
    }

    if (candidatePool.size() <= 25) {
      return new NearbyHospitalService.PublicHospitalSearch(candidatePool, rawSearch.emergencyHospitals());
    }

    List<HospitalCardResponse> curatedHospitals = candidatePool.stream()
        .sorted((left, right) -> Double.compare(
            scoreHospitalCandidate(right, diagnosis, symptomText, conditionText),
            scoreHospitalCandidate(left, diagnosis, symptomText, conditionText)))
        .limit(25)
        .toList();

    return new NearbyHospitalService.PublicHospitalSearch(curatedHospitals, rawSearch.emergencyHospitals());
  }

  private List<HospitalCardResponse> filterNearbyHospitalCards(NearbyHospitalService.PublicHospitalSearch rawSearch) {
    Set<String> emergencyKeys = new LinkedHashSet<>();
    for (HospitalCardResponse emergencyHospital : rawSearch.emergencyHospitals()) {
      emergencyKeys.add(hospitalKey(emergencyHospital));
    }

    return rawSearch.hospitals().stream()
        .filter(hospital -> !emergencyKeys.contains(hospitalKey(hospital)))
        .filter(hospital -> !isLargeGeneralHospital(hospital))
        .toList();
  }

  private boolean isLargeGeneralHospital(HospitalCardResponse hospital) {
    String specialty = extractSpecialtyHint(hospital).toLowerCase(Locale.ROOT);
    String facility = extractFacilityType(hospital).toLowerCase(Locale.ROOT);
    String name = safe(hospital.name()).toLowerCase(Locale.ROOT);

    return specialty.contains("\uC885\uD569\uC9C4\uB8CC")
        || facility.contains("\uB300\uD615\uBCD1\uC6D0")
        || name.contains("\uB300\uD559\uBCD1\uC6D0")
        || name.contains("\uC885\uD569\uBCD1\uC6D0")
        || name.contains("\uC758\uB8CC\uC6D0");
  }

  private String hospitalKey(HospitalCardResponse hospital) {
    return safe(hospital.name()).trim().toLowerCase(Locale.ROOT) + "|"
        + safe(hospital.address()).trim().toLowerCase(Locale.ROOT);
  }

  private double scoreHospitalCandidate(
      HospitalCardResponse hospital,
      AnalysisResponse diagnosis,
      String symptomText,
      String conditionText) {
    String text = (safe(diagnosis.summary().topDisease()) + " " + safe(symptomText) + " " + safe(conditionText))
        .toLowerCase(Locale.ROOT);
    String specialty = extractSpecialtyHint(hospital).toLowerCase(Locale.ROOT);
    String facility = extractFacilityType(hospital).toLowerCase(Locale.ROOT);
    double distance = parseDistanceMeters(hospital.distance());

    double score = 0.0;

    if (isSkinLike(text)) {
      if (specialty.contains("\uD53C\uBD80\uACFC")) score += 300;
      if (facility.contains("\uB300\uD615") || facility.contains("\uBCD1\uC6D0")) score += 90;
      if (specialty.contains("\uC548\uACFC")) score -= 220;
    }

    if (isHairLike(text)) {
      if (specialty.contains("\uD53C\uBD80\uACFC")) score += 320;
      if (facility.contains("\uB300\uD615") || facility.contains("\uBCD1\uC6D0")) score += 80;
      if (specialty.contains("\uC548\uACFC")) score -= 240;
    }

    if (isEyeLike(text)) {
      if (specialty.contains("\uC548\uACFC")) score += 320;
      if (facility.contains("\uB300\uD615") || facility.contains("\uBCD1\uC6D0")) score += 70;
      if (specialty.contains("\uD53C\uBD80\uACFC")) score -= 220;
    }

    if (isEntLike(text)) {
      if (specialty.contains("\uC774\uBE44\uC778\uD6C4\uACFC")) score += 260;
      if (specialty.contains("\uB0B4\uACFC") || specialty.contains("\uAC00\uC815\uC758\uD559\uACFC")) score += 180;
    }

    if (isInternalLike(text)) {
      if (specialty.contains("\uB0B4\uACFC") || specialty.contains("\uAC00\uC815\uC758\uD559\uACFC")) score += 230;
      if (facility.contains("\uB300\uD615") || facility.contains("\uBCD1\uC6D0")) score += 70;
    }

    if (isLegVascularLike(text)) {
      if (facility.contains("\uB300\uD615") || facility.contains("\uBCD1\uC6D0")) score += 260;
      if (specialty.contains("\uC678\uACFC") || specialty.contains("\uC815\uD615\uC678\uACFC") || specialty.contains("\uC21C\uD658")) score += 210;
      if (specialty.contains("\uC548\uACFC")) score -= 260;
    }

    if (score == 0.0) {
      if (facility.contains("\uB300\uD615") || facility.contains("\uBCD1\uC6D0")) score += 50;
      if (specialty.contains("\uB0B4\uACFC") || specialty.contains("\uAC00\uC815\uC758\uD559\uACFC")) score += 40;
    }

    return score - Math.min(distance / 100.0, 200.0);
  }

  private boolean isSkinLike(String text) {
    return text.contains("\uBC1C\uC9C4")
        || text.contains("\uAC00\uB824")
        || text.contains("\uB450\uB4DC\uB7EC\uAE30")
        || text.contains("\uC218\uD3EC")
        || text.contains("\uD53C\uBD80\uC5FC")
        || text.contains("\uC811\uCD09\uC131");
  }

  private boolean isHairLike(String text) {
    return text.contains("\uD0C8\uBAA8")
        || text.contains("\uB450\uD53C")
        || text.contains("\uBE44\uB4EC")
        || text.contains("\uBA38\uB9AC\uCE74\uB77D")
        || text.contains("\uC9C0\uB8E8\uC131");
  }

  private boolean isEyeLike(String text) {
    return text.contains("\uB208")
        || text.contains("\uCDA9\uD608")
        || text.contains("\uB208\uACF1")
        || text.contains("\uACB0\uB9C9")
        || text.contains("\uC2DC\uC57C");
  }

  private boolean isEntLike(String text) {
    return text.contains("\uBAA9")
        || text.contains("\uCF54")
        || text.contains("\uC778\uD6C4")
        || text.contains("\uD3B8\uB3C4")
        || text.contains("\uCDA9\uB18D")
        || text.contains("\uBE44\uC5FC");
  }

  private boolean isInternalLike(String text) {
    return text.contains("\uAE30\uCE68")
        || text.contains("\uBC1C\uC5F4")
        || text.contains("\uAC10\uAE30")
        || text.contains("\uB3C5\uAC10")
        || text.contains("\uBCF5\uD1B5")
        || text.contains("\uC124\uC0AC")
        || text.contains("\uAD6C\uD1A0");
  }

  private boolean isLegVascularLike(String text) {
    return text.contains("\uB2E4\uB9AC")
        || text.contains("\uD558\uC9C0")
        || text.contains("\uBD80\uC885")
        || text.contains("\uD608\uC804")
        || text.contains("\uC815\uB9E5")
        || text.contains("\uCCAD\uC0C9");
  }

  private HospitalSelection rerankHospitalsWithAi(
      AnalysisResponse diagnosis,
      String symptomText,
      String conditionText,
      NearbyHospitalService.PublicHospitalSearch search) {
    if (search.hospitals().isEmpty()) {
      throw new AiAnalysisUnavailableException("Public hospital API returned no hospital candidates.");
    }

    try {
      boolean urgentHint = needsEmergencyCandidate(diagnosis, symptomText, conditionText);
      System.err.println("[MediLoop][HospitalRank] urgentHint=" + urgentHint
          + ", hospitalCandidates=" + search.hospitals().size()
          + ", emergencyCandidates=" + search.emergencyHospitals().size());
      String content = requestAiWithRetry(
          "hospital-rank",
          buildHospitalRankingPrompt(diagnosis, symptomText, conditionText, search, urgentHint),
          null,
          null);
      JsonNode root = objectMapper.readTree(content);
      HospitalSelection selection = parseHospitalSelection(root, search.hospitals().size(), search.emergencyHospitals().size());
      System.err.println("[MediLoop][HospitalRank] initial selection hospitals=" + selection.hospitalIndexes()
          + ", emergency=" + selection.emergencyIndex());
      if (selection.hospitalIndexes().isEmpty() || (!search.emergencyHospitals().isEmpty() && selection.emergencyIndex() == null)) {
        String repaired = requestAiWithRetry(
            "hospital-rank-repair",
            buildHospitalRankingRepairPrompt(diagnosis, symptomText, conditionText, search, urgentHint),
            null,
            null);
        root = objectMapper.readTree(repaired);
        selection = parseHospitalSelection(root, search.hospitals().size(), search.emergencyHospitals().size());
        System.err.println("[MediLoop][HospitalRank] repaired selection hospitals=" + selection.hospitalIndexes()
            + ", emergency=" + selection.emergencyIndex());
      }
      if (selection.hospitalIndexes().isEmpty() || (!search.emergencyHospitals().isEmpty() && selection.emergencyIndex() == null)) {
        throw new AiAnalysisUnavailableException("AI returned an invalid hospital ranking payload.");
      }
      return selection;
    } catch (AiAnalysisUnavailableException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new AiAnalysisUnavailableException("AI hospital ranking failed.", ex);
    }
  }

  private AnalysisResponse analyzeDiagnosisOnly(String prompt, boolean homeMode, String imageBase64, String imageMimeType) {
    try {
      String content = requestAiWithRetry(homeMode ? "home" : "hospital", prompt, imageBase64, imageMimeType);
      JsonNode root = objectMapper.readTree(content);
      if (needsDiagnosisRepair(root)) {
        String repairedContent = requestAiWithRetry(
            (homeMode ? "home" : "hospital") + "-repair",
            buildDiagnosisRepairPrompt(prompt),
            imageBase64,
            imageMimeType);
        root = objectMapper.readTree(repairedContent);
      }
      if (needsDiagnosisRepair(root)) {
        throw new AiAnalysisUnavailableException("AI returned an invalid diagnosis payload.");
      }
      return mapDiagnosisResponse(root, homeMode);
    } catch (AiAnalysisUnavailableException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new AiAnalysisUnavailableException(
          homeMode ? "AI home analysis failed." : "AI hospital analysis failed.",
          ex);
    }
  }

  private String requestAiWithRetry(String stage, String prompt, String imageBase64, String imageMimeType) throws Exception {
    Exception lastException = null;
    for (int attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt++) {
      try {
        return openAiChatClient.requestJson(model, prompt, imageBase64, imageMimeType);
      } catch (Exception ex) {
        lastException = ex;
        System.err.println("[MediLoop][AI] " + stage + " attempt " + attempt + " failed: "
            + ex.getClass().getSimpleName() + " - " + ex.getMessage());
        if (attempt < AI_MAX_ATTEMPTS) {
          try {
            Thread.sleep(1200L * attempt);
          } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            throw new AiAnalysisUnavailableException("AI retry interrupted.", interruptedException);
          }
        }
      }
    }
    throw new AiAnalysisUnavailableException("AI request failed after retries.", lastException);
  }

  private String buildDiagnosisRepairPrompt(String originalPrompt) {
    return originalPrompt + """

        Rewrite the JSON so that:
        - summary.topDisease is a real disease name
        - summary.confidence is an integer from 0 to 100
        - summary.diseases contains exactly 3 real disease names
        - each disease entry has fields: label, value
        - no placeholders like "disease", "condition", or "possible disease"
        - return JSON only
        """;
  }

  private String buildHospitalRankingRepairPrompt(
      AnalysisResponse diagnosis,
      String symptomText,
      String conditionText,
      NearbyHospitalService.PublicHospitalSearch search,
      boolean urgentHint) throws Exception {
    return buildHospitalRankingPrompt(diagnosis, symptomText, conditionText, search, urgentHint) + """

        Rewrite the JSON so that:
        - hospitalIndexes contains 1 to 3 unique integer indexes from hospitalCandidates
        - emergencyIndex is either null or a valid integer index from emergencyCandidates
        - choose only from the provided candidates
        - return JSON only
        """;
  }

  private AnalysisResponse mapDiagnosisResponse(JsonNode root, boolean homeMode) {
    JsonNode summaryNode = root.path("summary");
    List<DiseaseScoreResponse> diseases = readDiseases(summaryNode.path("diseases"));
    if (diseases.size() < 3) {
      throw new AiAnalysisUnavailableException("AI returned too few disease candidates.");
    }

    String topDisease = nonBlank(summaryNode.path("topDisease").asText(null), diseases.get(0).label());
    int confidence = summaryNode.path("confidence").asInt(diseases.get(0).value());
    if (confidence <= 0) {
      confidence = diseases.get(0).value();
    }

    SummaryResponse summary = new SummaryResponse(
        topDisease,
        confidence,
        nonBlank(summaryNode.path("subtitle").asText(null), homeMode ? "AI symptom analysis result." : "AI hospital analysis result."),
        nonBlank(summaryNode.path("advice").asText(null), "Review this result with a clinician."),
        diseases);

    return new AnalysisResponse(summary, List.of(), null);
  }

  private HospitalSelection parseHospitalSelection(JsonNode root, int hospitalCount, int emergencyCount) {
    List<Integer> hospitalIndexes = new ArrayList<>();
    JsonNode hospitalsNode = root.path("hospitalIndexes");
    if (hospitalsNode.isArray()) {
      for (JsonNode item : hospitalsNode) {
        int index = item.asInt(-1);
        if (index >= 0 && index < hospitalCount && !hospitalIndexes.contains(index)) {
          hospitalIndexes.add(index);
        }
      }
    }

    Integer emergencyIndex = null;
    JsonNode emergencyNode = root.get("emergencyIndex");
    if (emergencyNode != null && !emergencyNode.isNull()) {
      int index = emergencyNode.asInt(-1);
      if (index >= 0 && index < emergencyCount) {
        emergencyIndex = index;
      }
    }

    return new HospitalSelection(hospitalIndexes, emergencyIndex);
  }

  private boolean needsDiagnosisRepair(JsonNode root) {
    JsonNode diseases = root.path("summary").path("diseases");
    if (!diseases.isArray() || diseases.size() < 3) {
      return true;
    }
    for (JsonNode item : diseases) {
      String label = nonBlank(
          item.path("label").asText(null),
          item.path("name").asText(null),
          item.path("disease").asText(null));
      if (label.isBlank() || isGenericDiseaseLabel(label)) {
        return true;
      }
    }
    return false;
  }

  private boolean isGenericDiseaseLabel(String label) {
    String normalized = cleanDiseaseLabel(label)
        .toLowerCase(Locale.ROOT)
        .replaceAll("[^a-z0-9\uAC00-\uD7A3]", "");
    return normalized.isBlank()
        || normalized.equals("disease")
        || normalized.equals("condition")
        || normalized.equals("symptom")
        || normalized.equals("\uC9C8\uD658")
        || normalized.equals("\uBCD1\uBA85")
        || normalized.equals("\uC99D\uC0C1")
        || normalized.startsWith("possibledisease")
        || normalized.startsWith("\uCD94\uC815\uC9C8\uD658")
        || normalized.startsWith("\uC608\uC0C1\uC9C8\uD658");
  }
  private String cleanDiseaseLabel(String value) {
    return value == null ? "" : value.trim();
  }

  private List<DiseaseScoreResponse> readDiseases(JsonNode node) {
    List<DiseaseScoreResponse> results = new ArrayList<>();
    if (node != null && node.isArray()) {
      for (JsonNode item : node) {
        String label = nonBlank(
            item.path("label").asText(null),
            item.path("name").asText(null),
            item.path("disease").asText(null));
        int value = item.path("value").asInt(item.path("confidence").asInt(0));
        if (!label.isBlank() && !isGenericDiseaseLabel(label)) {
          results.add(new DiseaseScoreResponse(cleanDiseaseLabel(label), Math.max(1, value)));
        }
      }
    }
    results.sort((a, b) -> Integer.compare(b.value(), a.value()));
    if (results.size() > 3) {
      return new ArrayList<>(results.subList(0, 3));
    }
    return results;
  }

  private FillBagAnalysisResponse mapFillBagResponse(JsonNode root) {
    List<String> habits = readStringList(root.path("recommendedHabits"));
    List<String> avoidFoods = readStringList(root.path("avoidFoods"));
    String criticalWarning = nonBlank(root.path("criticalWarning").asText(null), "No critical warning.");
    String aiSummary = nonBlank(root.path("aiSummary").asText(null), "No AI summary.");
    if (habits.isEmpty() || avoidFoods.isEmpty()) {
      throw new AiAnalysisUnavailableException("AI returned an incomplete fill bag payload.");
    }
    return new FillBagAnalysisResponse(habits, avoidFoods, criticalWarning, aiSummary);
  }

  private List<String> readStringList(JsonNode node) {
    List<String> values = new ArrayList<>();
    if (node != null && node.isArray()) {
      for (JsonNode item : node) {
        String value = nonBlank(item.asText(null));
        if (!value.isBlank()) {
          values.add(value);
        }
      }
    }
    return values;
  }

  private String buildHomePrompt(AnalyzeHomeRequest request) {
    return """
        You are MediLoop's diagnosis assistant.
        Read the user's symptom text and optional photo, then return JSON only.

      Requirements:
      - Output JSON only
      - summary.topDisease must be the most likely disease in Korean
      - summary.confidence must be an integer 0-100
      - summary.subtitle must be one short Korean sentence
      - summary.advice must be one short Korean sentence
      - summary.diseases must contain exactly 3 items sorted by confidence
      - each disease item must use: {"label":"...","value":number}
      - do not include hospital recommendations in the response
      - Use symptom-driven reasoning, not random disease labels.
      - 피부 발진, 가려움, 두드러기, 수포, 접촉 후 악화 -> 피부과 계열 질환(접촉성 피부염, 아토피 피부염, 두드러기 등)을 우선 고려하세요.
      - 머리카락 빠짐, 두피 가려움, 비듬, 두피 염증 -> 지루성 두피염, 원형탈모, 휴지기 탈모 등 두피/피부과 계열 질환을 우선 고려하세요.
      - 눈 충혈, 눈곱, 눈 통증, 시야 불편 -> 결막염, 각막염, 안구건조증 등 안과 계열 질환을 우선 고려하세요.
      - 기침, 콧물, 인후통, 발열 -> 감기, 독감, 인후염, 기관지염 등 호흡기 계열 질환을 우선 고려하세요.
      - 다리 붓기, 다리 통증, 청색증, 갑작스런 호흡곤란, 흉통 -> 심부정맥혈전증, 하지정맥류, 폐색전증 등 혈관/응급 계열 질환을 우선 고려하세요.
      - 복통, 설사, 구토 -> 급성 위장염, 식중독, 장염 등 소화기 계열 질환을 우선 고려하세요.

      User symptom text:
      %s

        User has photo attached:
        %s
        """.formatted(safe(request.symptomText()), request.imageBase64() != null && !request.imageBase64().isBlank());
  }

  private String buildHospitalPrompt(AnalyzeHospitalRequest request) {
    return """
        You are MediLoop's diagnosis assistant for hospital selection.
        Read the user's symptom text, condition text, and optional photo, then return JSON only.

      Requirements:
      - Output JSON only
      - summary.topDisease must be the most likely disease in Korean
      - summary.confidence must be an integer 0-100
      - summary.subtitle must be one short Korean sentence
      - summary.advice must be one short Korean sentence
      - summary.diseases must contain exactly 3 items sorted by confidence
      - each disease item must use: {"label":"...","value":number}
      - do not include hospital recommendations in the response
      - Use symptom-driven reasoning, not random disease labels.
      - 피부 발진, 가려움, 두드러기, 수포, 접촉 후 악화 -> 피부과 계열 질환(접촉성 피부염, 아토피 피부염, 두드러기 등)을 우선 고려하세요.
      - 머리카락 빠짐, 두피 가려움, 비듬, 두피 염증 -> 지루성 두피염, 원형탈모, 휴지기 탈모 등 두피/피부과 계열 질환을 우선 고려하세요.
      - 눈 충혈, 눈곱, 눈 통증, 시야 불편 -> 결막염, 각막염, 안구건조증 등 안과 계열 질환을 우선 고려하세요.
      - 기침, 콧물, 인후통, 발열 -> 감기, 독감, 인후염, 기관지염 등 호흡기 계열 질환을 우선 고려하세요.
      - 다리 붓기, 다리 통증, 청색증, 갑작스런 호흡곤란, 흉통 -> 심부정맥혈전증, 하지정맥류, 폐색전증 등 혈관/응급 계열 질환을 우선 고려하세요.
      - 복통, 설사, 구토 -> 급성 위장염, 식중독, 장염 등 소화기 계열 질환을 우선 고려하세요.

      User symptom text:
      %s

        User condition text:
        %s

        User has photo attached:
        %s
        """.formatted(
        safe(request.symptomText()),
        safe(request.conditionText()),
        request.imageBase64() != null && !request.imageBase64().isBlank());
  }

    private String buildHospitalRankingPrompt(
      AnalysisResponse diagnosis,
      String symptomText,
      String conditionText,
      NearbyHospitalService.PublicHospitalSearch search,
      boolean urgentHint) throws Exception {
    List<Object> hospitalCandidates = new ArrayList<>();
    for (int i = 0; i < search.hospitals().size(); i++) {
      HospitalCardResponse hospital = search.hospitals().get(i);
      hospitalCandidates.add(java.util.Map.of(
          "index", i,
          "name", hospital.name(),
          "specialtyHint", extractSpecialtyHint(hospital),
          "facilityType", extractFacilityType(hospital),
          "meta", hospital.meta(),
          "address", hospital.address(),
          "hours", hospital.hours(),
          "phone", hospital.phone(),
          "distance", hospital.distance(),
          "distanceMeters", parseDistanceMeters(hospital.distance())));
    }

    List<Object> emergencyCandidates = new ArrayList<>();
    for (int i = 0; i < search.emergencyHospitals().size(); i++) {
      HospitalCardResponse hospital = search.emergencyHospitals().get(i);
      emergencyCandidates.add(java.util.Map.of(
          "index", i,
          "name", hospital.name(),
          "specialtyHint", "emergency",
          "facilityType", "emergency",
          "meta", hospital.meta(),
          "address", hospital.address(),
          "hours", hospital.hours(),
          "phone", hospital.phone(),
          "distance", hospital.distance(),
          "distanceMeters", parseDistanceMeters(hospital.distance())));
    }

    String payload = objectMapper.writeValueAsString(java.util.Map.of(
        "symptomText", symptomText,
        "conditionText", conditionText,
        "topDisease", diagnosis.summary().topDisease(),
        "diseases", diagnosis.summary().diseases(),
        "urgentHint", urgentHint,
        "hospitalCandidates", hospitalCandidates,
        "emergencyCandidates", emergencyCandidates));

    return """
        You are MediLoop's hospital selection assistant.
        Use the disease prediction plus the public hospital candidate list to choose the most appropriate nearby hospitals.

        Rules:
        - Use only the hospitals provided in hospitalCandidates and emergencyCandidates.
        - Choose hospitals that best match the likely disease and appropriate specialty.
        - Also consider distance, but do not pick the nearest hospital if the specialty is clearly wrong.
        - Prefer a direct specialty match over a generic clinic.
        - Use general internal medicine only when there is no clearly better specialty candidate.
        - Do not choose pediatrics unless the disease is pediatric or the candidate list has no better adult specialty option.
        - Skin, rash, hives, blisters, scalp itching, hair loss, acne, dermatitis -> prefer dermatology or a larger general hospital if dermatology is unavailable.
        - Eye redness, eye pain, discharge, blurred vision -> prefer ophthalmology.
        - Ear, nose, throat, tonsil, sinus, common cold -> prefer ENT or internal/family medicine.
        - Fever, cough, flu, abdominal pain, diarrhea, fatigue -> prefer internal medicine or family medicine.
        - Leg swelling, thrombosis, severe limb pain, chest pain, shortness of breath, stroke-like symptoms -> prefer larger hospitals and set emergencyIndex when urgency is high.
        - If a hospital name or specialtyHint clearly signals the right department, score it strongly.
        - Never choose an obviously unrelated specialty when a generic hospital or larger hospital is available.
        - If emergencyCandidates is not empty, you must always set emergencyIndex to the single best matching emergency candidate.
        - urgentHint tells you whether the emergency recommendation should be treated as especially important.
        - Return 2 to 3 hospital indexes when possible, sorted from best to next-best match.
        - Return JSON only.

        Output schema:
        {
          "hospitalIndexes": [0, 1, 2],
          "emergencyIndex": 0 or null
        }

        Candidate payload:
        %s
        """.formatted(payload);
  }
  private boolean needsEmergencyCandidate(AnalysisResponse diagnosis, String symptomText, String conditionText) {
    String text = (safe(diagnosis.summary().topDisease()) + " " + safe(symptomText) + " " + safe(conditionText)).toLowerCase(Locale.ROOT);
    return text.contains("\uD608\uC804")
        || text.contains("\uCCAD\uC0C9")
        || text.contains("\uACBD\uB828")
        || text.contains("\uC800\uB9BC")
        || text.contains("\uC911\uC99D")
        || text.contains("\uD638\uD761\uACE4\uB780")
        || text.contains("\uD749\uD1B5")
        || text.contains("\uB9C8\uBE44")
        || text.contains("\uC5B8\uC5B4\uC7A5\uC560")
        || text.contains("\uC2DC\uC57C\uC7A5\uC560")
        || text.contains("\uACE0\uC5F4")
        || text.contains("\uC2E4\uC2E0")
        || text.contains("\uC2EC\uD55C \uD1B5\uC99D");
  }

  private String extractSpecialtyHint(HospitalCardResponse hospital) {
    String meta = safe(hospital.meta());
    String[] parts = meta.split(" \u00B7 ");
    if (parts.length >= 3) {
      return parts[1].trim();
    }
    String name = safe(hospital.name());
    if (name.contains("\uD53C\uBD80\uACFC")) {
      return "\uD53C\uBD80\uACFC";
    }
    if (name.contains("\uC548\uACFC")) {
      return "\uC548\uACFC";
    }
    if (name.contains("\uC774\uBE44\uC778\uD6C4\uACFC")) {
      return "\uC774\uBE44\uC778\uD6C4\uACFC";
    }
    if (name.contains("\uC815\uD615\uC678\uACFC")) {
      return "\uC815\uD615\uC678\uACFC";
    }
    if (name.contains("\uC18C\uC544\uCCAD\uC18C\uB144\uACFC") || name.contains("\uC18C\uC544\uACFC")) {
      return "\uC18C\uC544\uCCAD\uC18C\uB144\uACFC";
    }
    if (name.contains("\uAC00\uC815\uC758\uD559\uACFC")) {
      return "\uAC00\uC815\uC758\uD559\uACFC";
    }
    if (name.contains("\uB0B4\uACFC")) {
      return "\uB0B4\uACFC";
    }
    if (name.contains("\uBCD1\uC6D0") || name.contains("\uC758\uB8CC\uC6D0")) {
      return "\uC885\uD569\uC9C4\uB8CC";
    }
    return "\uC77C\uBC18\uC758\uC6D0";
  }

  private String extractFacilityType(HospitalCardResponse hospital) {
    String name = safe(hospital.name());
    if (name.contains("\uB300\uD559\uBCD1\uC6D0") || name.contains("\uC758\uB8CC\uC6D0") || name.contains("\uC885\uD569\uBCD1\uC6D0")) {
      return "\uB300\uD615\uBCD1\uC6D0";
    }
    if (name.contains("\uBCD1\uC6D0")) {
      return "\uBCD1\uC6D0";
    }
    return "\uC758\uC6D0";
  }

  private double parseDistanceMeters(String distance) {
    if (distance == null || distance.isBlank()) {
      return Double.MAX_VALUE;
    }
    String trimmed = distance.trim().toLowerCase(Locale.ROOT);
    try {
      if (trimmed.endsWith("km")) {
        return Double.parseDouble(trimmed.replace("km", "").trim()) * 1000.0;
      }
      if (trimmed.endsWith("m")) {
        return Double.parseDouble(trimmed.replace("m", "").trim());
      }
    } catch (Exception ignored) {
      return Double.MAX_VALUE;
    }
    return Double.MAX_VALUE;
  }

  private String buildFillBagPrompt(AnalyzeFillBagRequest request) {
    return """
        You are MediLoop's medication aftercare assistant.
        Read the doctor's note and optional prescription image, then return JSON only.

        Return format:
        {
          "recommendedHabits": ["...", "..."],
          "avoidFoods": ["...", "..."],
          "criticalWarning": "...",
          "aiSummary": "..."
        }

        Requirements:
        - recommendedHabits: 2 to 4 short Korean items
        - avoidFoods: 2 to 4 short Korean items
        - criticalWarning: one short Korean sentence
        - aiSummary: one or two short Korean sentences
        - Output JSON only

        Doctor note:
        %s

        Prescription image attached:
        %s
        """.formatted(safe(request.doctorNote()), request.imageBase64() != null && !request.imageBase64().isBlank());
  }

  private double safeCoordinate(Double value) {
    return value == null ? 37.5665d : value;
  }

  private String safe(String value) {
    return value == null ? "" : value.trim();
  }

  private String nonBlank(String... values) {
    for (String value : values) {
      if (value != null && !value.isBlank()) {
        return value.trim();
      }
    }
    return "";
  }

  private record HospitalSelection(List<Integer> hospitalIndexes, Integer emergencyIndex) {
  }
}

