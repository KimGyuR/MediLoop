package com.mediloop.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediloop.backend.dto.AnalyzeHospitalRequest;
import com.mediloop.backend.dto.AnalyzeFillBagRequest;
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
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class AnalysisService {
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
    CompletableFuture<AnalysisResponse> homeFuture =
        CompletableFuture.supplyAsync(() -> callAiOrRepair(buildHomePrompt(request), true, request.imageBase64(), request.imageMimeType()));
    AnalysisResponse homeResult = homeFuture.completeOnTimeout(fallbackResponse(true), 28, TimeUnit.SECONDS).join();
    AnalysisResponse locationResult = nearbyHospitalService.recommend(
        request.latitude(),
        request.longitude(),
        extractRecommendationHints(homeResult, request.symptomText(), null));
    return mergeWithLocation(homeResult, locationResult, true);
  }

  public AnalysisResponse analyzeHospital(AnalyzeHospitalRequest request) {
    CompletableFuture<AnalysisResponse> hospitalFuture =
        CompletableFuture.supplyAsync(() -> callAiOrRepair(buildHospitalPrompt(request), false, request.imageBase64(), request.imageMimeType()));
    AnalysisResponse hospitalResult = hospitalFuture.completeOnTimeout(fallbackResponse(false), 28, TimeUnit.SECONDS).join();
    AnalysisResponse locationResult = nearbyHospitalService.recommend(
        request.latitude(),
        request.longitude(),
        extractRecommendationHints(hospitalResult, request.symptomText(), request.conditionText()));
    return mergeWithLocation(hospitalResult, locationResult, false);
  }

  public AnalysisResponse recommendByLocation(LocationRequest request) {
    return nearbyHospitalService.recommend(request.latitude(), request.longitude());
  }

  public FillBagAnalysisResponse analyzeFillBag(AnalyzeFillBagRequest request) {
    try {
      String content = openAiChatClient.requestJson(
          model,
          buildFillBagPrompt(request),
          request.imageBase64(),
          request.imageMimeType());
      JsonNode root = objectMapper.readTree(content);
      return mapFillBagResponse(root, request.doctorNote());
    } catch (Exception ex) {
      System.err.println("[MediLoop][AI] fillbag fallback: " + ex.getClass().getSimpleName() + " - " + ex.getMessage());
      return fallbackFillBagResponse(request.doctorNote());
    }
  }

  private AnalysisResponse callAiOrRepair(String prompt, boolean homeMode, String imageBase64, String imageMimeType) {
    try {
      String content = openAiChatClient.requestJson(model, prompt, imageBase64, imageMimeType);
      JsonNode root = objectMapper.readTree(content);
      if (needsRepair(root)) {
        String repairPrompt = prompt + """

        이전 응답에 placeholder 또는 빈 질환명이 포함되어 있다.
        반드시 summary.diseases에 정확히 3개의 실제 질환명을 넣고, 각 항목에 0~100 정수 확률을 넣어라.
        label은 반드시 질환명만 써라. "질환", "병명", "추정 질환", "관련 질환", "의심 질환", "예상 질환" 같은 표현은 절대 쓰지 마라.
        summary.topDisease는 summary.diseases[0].label과 동일한 가장 가능성이 높은 실제 질환명 1개로 맞춰라.
        JSON 외 텍스트는 금지한다.
        """;
        String repaired = openAiChatClient.requestJson(model, repairPrompt, imageBase64, imageMimeType);
        root = objectMapper.readTree(repaired);
      }
      return mapResponse(root, homeMode);
    } catch (Exception ex) {
      System.err.println("[MediLoop][AI] " + (homeMode ? "home" : "hospital") + " fallback: " + ex.getClass().getSimpleName() + " - " + ex.getMessage());
      return fallbackResponse(homeMode);
    }
  }

  private AnalysisResponse mapResponse(JsonNode root, boolean homeMode) {
    String topDisease = text(root, "summary", "topDisease", homeMode ? "단순 감기" : "감기");
    List<DiseaseScoreResponse> diseases = readDiseases(root.path("summary").path("diseases"), topDisease, homeMode);
    if (topDisease.isBlank() || topDisease.equals("질환")) {
      topDisease = diseases.get(0).label();
    }

    int confidence = intValue(root, "summary", "confidence", diseases.isEmpty() ? (homeMode ? 56 : 85) : diseases.get(0).value());
    if (confidence <= 0 && !diseases.isEmpty()) {
      confidence = diseases.get(0).value();
    }
    if (confidence <= 0) {
      confidence = homeMode ? 56 : 85;
    }

    SummaryResponse summary = new SummaryResponse(
        topDisease,
        confidence,
        text(root, "summary", "subtitle", homeMode ? "증상과 사진을 바탕으로 추정한 결과입니다." : "입력 내용을 바탕으로 추정한 결과입니다."),
        text(root, "summary", "advice", "참고용 추정 결과입니다."),
        diseases);

    List<HospitalCardResponse> hospitals = new ArrayList<>();
    JsonNode hospitalNodes = root.path("hospitals");
    if (hospitalNodes.isArray()) {
      for (JsonNode node : hospitalNodes) {
        hospitals.add(readHospital(node));
      }
    }

    HospitalCardResponse emergencyHospital = root.has("emergencyHospital") && !root.path("emergencyHospital").isMissingNode()
        ? readHospital(root.path("emergencyHospital"))
        : null;

    HospitalCardResponse resolvedEmergencyHospital = emergencyHospital;

    if (homeMode && resolvedEmergencyHospital == null) {
      resolvedEmergencyHospital = hospitals.stream()
          .filter(card -> "danger".equalsIgnoreCase(card.tone()))
          .findFirst()
          .orElse(null);
    }

    if (resolvedEmergencyHospital != null) {
      String emergencyName = resolvedEmergencyHospital.name();
      hospitals = hospitals.stream()
          .filter(card -> !card.name().equalsIgnoreCase(emergencyName))
          .toList();
    }

    return new AnalysisResponse(summary, hospitals, resolvedEmergencyHospital);
  }

  private AnalysisResponse mergeWithLocation(
      AnalysisResponse primary,
      AnalysisResponse location,
      boolean homeMode) {
    List<HospitalCardResponse> hospitals = new ArrayList<>();
    HospitalCardResponse emergencyHospital = null;

    if (location != null && location.hospitals() != null && !location.hospitals().isEmpty()) {
      hospitals.addAll(location.hospitals());
      emergencyHospital = location.emergencyHospital();
    }

    if (primary != null && primary.hospitals() != null && hospitals.isEmpty()) {
      hospitals.addAll(primary.hospitals());
    }

    if (emergencyHospital == null && primary != null) {
      emergencyHospital = primary.emergencyHospital();
    }

    if (emergencyHospital == null && !hospitals.isEmpty()) {
      emergencyHospital = hospitals.stream()
          .filter(card -> "danger".equalsIgnoreCase(card.tone()))
          .findFirst()
          .orElse(null);
    }

    if (emergencyHospital != null) {
      String emergencyName = emergencyHospital.name();
      hospitals = hospitals.stream()
          .filter(card -> !card.name().equalsIgnoreCase(emergencyName))
          .toList();
    }

    if (primary != null && primary.summary() != null) {
      return new AnalysisResponse(primary.summary(), hospitals, emergencyHospital);
    }

    AnalysisResponse fallback = fallbackResponse(homeMode);
    return new AnalysisResponse(fallback.summary(), hospitals.isEmpty() ? fallback.hospitals() : hospitals, emergencyHospital != null ? emergencyHospital : fallback.emergencyHospital());
  }

  private List<String> extractDiseaseHints(AnalysisResponse analysis) {
    List<String> hints = new ArrayList<>();
    if (analysis == null || analysis.summary() == null) {
      return hints;
    }
    if (analysis.summary().topDisease() != null && !analysis.summary().topDisease().isBlank()) {
      hints.add(analysis.summary().topDisease());
    }
    if (analysis.summary().diseases() != null) {
      for (DiseaseScoreResponse disease : analysis.summary().diseases()) {
        if (disease != null && disease.label() != null && !disease.label().isBlank()) {
          hints.add(disease.label());
        }
      }
    }
    return hints.stream().distinct().toList();
  }

  private List<String> extractRecommendationHints(AnalysisResponse analysis, String symptomText, String conditionText) {
    List<String> hints = new ArrayList<>(extractDiseaseHints(analysis));
    if (symptomText != null && !symptomText.isBlank()) {
      hints.add(symptomText.trim());
    }
    if (conditionText != null && !conditionText.isBlank()) {
      hints.add(conditionText.trim());
    }
    return hints.stream()
        .filter(value -> value != null && !value.isBlank())
        .distinct()
        .toList();
  }

  private String topDisease(AnalysisResponse analysis) {
    if (analysis == null || analysis.summary() == null) {
      return "";
    }
    String disease = analysis.summary().topDisease();
    if (disease != null && !disease.isBlank()) {
      return disease.trim();
    }
    if (analysis.summary().diseases() != null && !analysis.summary().diseases().isEmpty()) {
      DiseaseScoreResponse first = analysis.summary().diseases().get(0);
      if (first != null && first.label() != null) {
        return first.label().trim();
      }
    }
    return "";
  }

  private List<DiseaseScoreResponse> readDiseases(JsonNode diseasesNode, String topDisease, boolean homeMode) {
    List<DiseaseScoreResponse> parsed = new ArrayList<>();
    if (diseasesNode != null && diseasesNode.isArray()) {
      for (JsonNode node : diseasesNode) {
        String label = firstNonBlank(
            node.path("label").asText(""),
            node.path("name").asText(""),
            node.path("disease").asText(""),
            node.path("title").asText(""),
            node.path("diagnosis").asText(""),
            node.path("diseaseName").asText(""));
        int value = firstPositiveInt(node, "value", "confidence", "probability", "score", "percent", "pct");
        if (value == 0) {
          value = parsePercent(firstNonBlank(
              node.path("value").asText(""),
              node.path("confidence").asText(""),
              node.path("probability").asText(""),
              node.path("score").asText(""),
              node.path("percent").asText(""),
              node.path("pct").asText("")));
        }
        if (!isGenericDiseaseLabel(label)) {
          parsed.add(new DiseaseScoreResponse(cleanDiseaseLabel(label), value > 0 ? value : 0));
        }
      }
    }

    parsed.sort(Comparator.comparingInt(DiseaseScoreResponse::value).reversed());
    List<DiseaseScoreResponse> normalized = parsed.stream()
        .filter(disease -> disease.label() != null && !disease.label().isBlank())
        .distinct()
        .toList();

    if (normalized.size() > 3) {
      normalized = normalized.subList(0, 3);
    }
    return normalized;
  }

  private boolean isGenericDiseaseLabel(String label) {
    String normalized = label == null ? "" : label.trim();
    return normalized.equals("질환")
        || normalized.equals("병명")
        || normalized.equals("증상")
        || normalized.equals("질병")
        || normalized.equals("추정 질환")
        || normalized.equals("추정질환")
        || normalized.equals("관련 질환")
        || normalized.equals("의심 질환")
        || normalized.equals("예상 질환")
        || normalized.matches("^질환\\s*\\d*$")
        || normalized.matches("^추정\\s*질환\\s*\\d*$")
        || normalized.matches("^추정질환\\s*\\d*$")
        || normalized.matches("^관련\\s*질환\\s*\\d*$")
        || normalized.matches("^의심\\s*질환\\s*\\d*$")
        || normalized.matches("^예상\\s*질환\\s*\\d*$");
  }

  private boolean needsRepair(JsonNode root) {
    JsonNode diseasesNode = root.path("summary").path("diseases");
    if (diseasesNode == null || !diseasesNode.isArray() || diseasesNode.size() < 3) {
      return true;
    }
    for (JsonNode node : diseasesNode) {
      String label = firstNonBlank(
          node.path("label").asText(""),
          node.path("name").asText(""),
          node.path("disease").asText(""),
          node.path("title").asText(""),
          node.path("diagnosis").asText(""),
          node.path("diseaseName").asText(""));
      if (label.isBlank() || isGenericDiseaseLabel(label)) {
        return true;
      }
    }
    return false;
  }

  private String cleanDiseaseLabel(String label) {
    if (label == null) {
      return "";
    }
    String cleaned = label.trim();
    cleaned = cleaned.replaceAll("\\s*\\(.*?\\)\\s*$", "").trim();
    cleaned = cleaned.replaceAll("\\s*\\d+\\s*$", "").trim();
    cleaned = cleaned.replaceAll("\\s*[:：-]\\s*$", "").trim();
    return cleaned;
  }

  private String firstNonBlank(String... values) {
    for (String value : values) {
      if (value != null && !value.isBlank()) {
        return value.trim();
      }
    }
    return "";
  }

  private int firstPositiveInt(JsonNode node, String... keys) {
    for (String key : keys) {
      JsonNode child = node.path(key);
      if (!child.isMissingNode() && !child.isNull()) {
        int value = child.asInt(Integer.MIN_VALUE);
        if (value > 0) {
          return value;
        }
      }
    }
    return 0;
  }

  private int parsePercent(String value) {
    if (value == null || value.isBlank()) {
      return 0;
    }
    try {
      return Integer.parseInt(value.replace("%", "").trim());
    } catch (Exception ex) {
      return 0;
    }
  }

  private boolean containsAny(String text, String... keywords) {
    for (String keyword : keywords) {
      if (text.contains(keyword)) {
        return true;
      }
    }
    return false;
  }

  private HospitalCardResponse readHospital(JsonNode node) {
    String name = node.path("name").asText("병원");
    String meta = node.path("meta").asText("");
    String address = node.path("address").asText(meta);
    String hours = node.path("hours").asText("09:00 ~ 18:00");
    String phone = node.path("phone").asText("02-0000-0000");
    String distance = node.path("distance").asText("500m");
    String directionQuery = node.path("directionQuery").asText(name);
    String reserveQuery = node.path("reserveQuery").asText(name);

    return new HospitalCardResponse(
        name,
        meta,
        node.path("tone").asText("normal"),
        address,
        hours,
        phone,
        distance,
        directionQuery,
        reserveQuery);
  }

  private AnalysisResponse fallbackResponse(boolean homeMode) {
    List<DiseaseScoreResponse> diseases = homeMode
        ? List.of(
            new DiseaseScoreResponse("단순 감기", 56),
            new DiseaseScoreResponse("상기도 감염", 31),
            new DiseaseScoreResponse("편두통", 13))
        : List.of(
            new DiseaseScoreResponse("감기", 85),
            new DiseaseScoreResponse("편두통", 10),
            new DiseaseScoreResponse("위장염", 5));

    List<HospitalCardResponse> hospitals = List.of(
        new HospitalCardResponse(
            "가천의료센터",
            "500m · 서울시 강남구 123 45번지 · 09:00 ~ 18:00",
            "normal",
            "서울시 강남구 123 45번지",
            "09:00 ~ 18:00",
            "02-1234-5678",
            "500m",
            "가천의료센터",
            "가천의료센터"),
        new HospitalCardResponse(
            "삼성 의료 센터",
            "1.2km · 서울시 강남구 456 78번지 · 08:00 ~ 20:00",
            "normal",
            "서울시 강남구 456 78번지",
            "08:00 ~ 20:00",
            "02-2345-6789",
            "1.2km",
            "삼성 의료 센터",
            "삼성 의료 센터"),
        new HospitalCardResponse(
            "강남성모종합병원 응급실",
            "응급실 · 1.5km · 24시간",
            "danger",
            "서울시 강남구 789 01번지",
            "24시간",
            "02-3456-7890",
            "1.5km",
            "강남성모종합병원 응급실",
            "강남성모종합병원 응급실"));

    SummaryResponse summary = new SummaryResponse(
        diseases.get(0).label(),
        diseases.get(0).value(),
        homeMode ? "증상과 사진을 바탕으로 추정한 결과입니다." : "입력 내용을 바탕으로 추정한 결과입니다.",
        "참고용 추정 결과입니다.",
        diseases);

    return new AnalysisResponse(summary, hospitals.subList(0, 2), hospitals.get(2));
  }

  private String buildHomePrompt(AnalyzeHomeRequest request) {
    Map<String, Object> input = new LinkedHashMap<>();
    input.put("symptomText", safe(request.symptomText()));
    input.put("hasPhoto", request.hasPhoto());
    input.put("imageAttached", request.imageBase64() != null && !request.imageBase64().isBlank());
    input.put("latitude", request.latitude());
    input.put("longitude", request.longitude());

    return """
        너는 MediLoop 홈 화면용 의료 분류 보조 AI다.
        사용자의 증상, 사진 여부, 현재 위치를 바탕으로 아래 형식의 JSON만 반환해라.

        입력 JSON:
        %s

        추가 규칙:
        - imageAttached가 true이면 사진에서 보이는 증상도 함께 고려해라.
        - symptomText가 있으면 사진과 텍스트를 함께 보고 우선순위를 정해라.

        반환 규칙:
        - summary.topDisease: 가장 가능성이 높은 질환명 1개
        - summary.confidence: 0~100 정수
        - summary.subtitle: 짧은 설명
        - summary.advice: 참고용 안내 문구
        - summary.diseases: 확률이 높은 순서대로 정확히 3개
        - hospitals: 현재 위치 기준으로 가까운 일반 병원 1개 이상
        - emergencyHospital: 현재 위치 기준으로 가장 가까운 응급실 1개
        - 각 병원은 name, meta, tone, address, hours, phone, distance, directionQuery, reserveQuery 포함
        - tone은 normal 또는 danger
        - JSON 외 텍스트 금지
        """.formatted(objectMapper.valueToTree(input).toPrettyString());
  }

  private String buildHospitalPrompt(AnalyzeHospitalRequest request) {
    Map<String, Object> input = new LinkedHashMap<>();
    input.put("symptomText", safe(request.symptomText()));
    input.put("conditionText", safe(request.conditionText()));
    input.put("imageAttached", request.imageBase64() != null && !request.imageBase64().isBlank());
    input.put("latitude", request.latitude());
    input.put("longitude", request.longitude());

    return """
        너는 MediLoop의 병원 화면용 의료 분류 보조 AI다.
        사용자의 증상, 기저질환, 현재 위치를 바탕으로 홈 화면과 같은 형태의 JSON만 반환해라.

        입력:
        %s

        추가 규칙:
        - imageAttached가 true이면 사진에서 보이는 증상도 함께 고려해라.
        - symptomText와 conditionText가 모두 있으면 둘 다 반영해라.

        규칙:
        - summary.topDisease: 가장 가능성이 높은 질환명 1개
        - summary.confidence: 0~100 정수
        - summary.subtitle: 짧은 설명
        - summary.advice: 참고용 안내
        - summary.diseases: 가장 가능성이 높은 질환 3개를 확률 순으로 정렬
        - hospitals: 현재 위치 기준으로 가까운 일반 병원 2개 이상
        - emergencyHospital: 현재 위치 기준으로 가장 가까운 응급실 1개
        - 각 병원은 name, meta, tone, address, hours, phone, distance, directionQuery, reserveQuery 포함
        - 반드시 JSON만 출력
        
        예시 형태:
        {
          "summary": {
            "topDisease": "급성 위장염",
            "confidence": 85,
            "subtitle": "증상과 기저질환을 바탕으로 추정한 결과입니다.",
            "advice": "참고용 결과입니다.",
            "diseases": [
              {"label": "급성 위장염", "value": 85},
              {"label": "과민성 대장증후군", "value": 10},
              {"label": "장염", "value": 5}
            ]
          },
          "hospitals": [
            {
              "name": "서울중앙병원",
              "meta": "800m · 서울특별시 중구 세종대로 110 · 09:00 ~ 18:00",
              "tone": "normal",
              "address": "서울특별시 중구 세종대로 110",
              "hours": "09:00 ~ 18:00",
              "phone": "02-1234-5678",
              "distance": "800m",
              "directionQuery": "서울중앙병원",
              "reserveQuery": "서울중앙병원"
            }
          ],
          "emergencyHospital": {
            "name": "서울시립병원 응급실",
            "meta": "응급실 · 2.0km · 24시간",
            "tone": "danger",
            "address": "서울특별시 중구 을지로 100",
            "hours": "24시간",
            "phone": "02-3456-7890",
            "distance": "2.0km",
            "directionQuery": "서울시립병원 응급실",
            "reserveQuery": "서울시립병원 응급실"
          }
        }
        """.formatted(objectMapper.valueToTree(input).toPrettyString());
  }

  private String buildFillBagPrompt(AnalyzeFillBagRequest request) {
    Map<String, Object> input = new LinkedHashMap<>();
    input.put("doctorNote", safe(request.doctorNote()));
    input.put("imageAttached", request.imageBase64() != null && !request.imageBase64().isBlank());

    return """
        너는 MediLoop의 복약/처방전 사후관리 분석 보조 AI다.
        처방전 사진과 의사 소견을 함께 보고 생활 습관, 피해야 할 음식, 위험 경고, 요약을 JSON으로만 반환해라.

        입력:
        %s

        규칙:
        - 처방전 사진이 있으면 약 이름, 복용 주의사항, 금기사항을 최대한 반영해라.
        - doctorNote가 있으면 의사의 생활지도, 금식/식후/음주금지/카페인제한 등의 표현을 우선 반영해라.
        - recommendedHabits: 2~4개 생활 습관 문구 배열
        - avoidFoods: 2~4개 음식/음료 주의 문구 배열
        - criticalWarning: 치명적이거나 꼭 강조해야 하는 주의사항 1문장
        - aiSummary: 사용자가 이해하기 쉬운 1~2문장 요약
        - 모든 문장은 한국어
        - JSON 외 텍스트 금지

        예시:
        {
          "recommendedHabits": ["충분한 수면", "수분 섭취 1.5L 이상", "실내 습도 50% 유지"],
          "avoidFoods": ["자극적인 음식", "카페인", "음주"],
          "criticalWarning": "아세트아미노펜 복용 중 음주는 간 손상의 치명적인 원인이 될 수 있습니다.",
          "aiSummary": "처방전과 의사 소견을 바탕으로 복약 후 관리 포인트를 정리했습니다."
        }
        """.formatted(objectMapper.valueToTree(input).toPrettyString());
  }

  private FillBagAnalysisResponse mapFillBagResponse(JsonNode root, String doctorNote) {
    List<String> habits = readStringList(root.path("recommendedHabits"));
    List<String> avoidFoods = readStringList(root.path("avoidFoods"));
    String criticalWarning = root.path("criticalWarning").asText("").trim();
    String aiSummary = root.path("aiSummary").asText("").trim();

    FillBagAnalysisResponse fallback = fallbackFillBagResponse(doctorNote);
    return new FillBagAnalysisResponse(
        habits.isEmpty() ? fallback.recommendedHabits() : habits,
        avoidFoods.isEmpty() ? fallback.avoidFoods() : avoidFoods,
        criticalWarning.isBlank() ? fallback.criticalWarning() : criticalWarning,
        aiSummary.isBlank() ? fallback.aiSummary() : aiSummary);
  }

  private List<String> readStringList(JsonNode node) {
    List<String> values = new ArrayList<>();
    if (node != null && node.isArray()) {
      for (JsonNode item : node) {
        String value = item.asText("").trim();
        if (!value.isBlank()) {
          values.add(value);
        }
      }
    }
    return values.stream().distinct().limit(4).toList();
  }

  private FillBagAnalysisResponse fallbackFillBagResponse(String doctorNote) {
    String note = normalizeFillBag(safe(doctorNote));

    List<String> habits = new ArrayList<>(List.of("충분한 수면", "실내 습도 50% 유지", "수분 섭취 1.5L 이상"));
    List<String> avoidFoods = new ArrayList<>(List.of("자극적인 음식", "카페인", "음주"));
    String criticalWarning = "복약 중 이상 반응이 생기면 즉시 복용을 중단하고 전문의와 상담하세요.";
    String aiSummary = "처방전과 의사 소견을 바탕으로 복약 후 생활 관리 포인트를 정리했습니다.";

    if (containsAnyNormalized(note, "기침", "인후", "목", "편도", "호흡기")) {
      habits = new ArrayList<>(List.of("충분한 수면", "실내 습도 50% 유지", "미지근한 물 자주 마시기"));
      avoidFoods = new ArrayList<>(List.of("자극적인 음식", "카페인", "음주"));
      aiSummary = "호흡기 증상 완화에 도움이 되는 생활 습관과 피해야 할 자극 요소를 정리했습니다.";
    }

    if (containsAnyNormalized(note, "위염", "속쓰림", "장염", "소화", "위장")) {
      habits = new ArrayList<>(List.of("규칙적인 식사", "미음이나 부드러운 음식 위주 섭취", "수분 충분히 보충하기"));
      avoidFoods = new ArrayList<>(List.of("매운 음식", "기름진 음식", "카페인"));
      aiSummary = "위장 자극을 줄이고 회복을 돕는 식습관 중심으로 정리했습니다.";
    }

    if (containsAnyNormalized(note, "혈압", "고혈압")) {
      habits = new ArrayList<>(List.of("염분 줄이기", "가벼운 유산소 운동", "정해진 시간에 꾸준히 복약하기"));
      avoidFoods = new ArrayList<>(List.of("짠 음식", "과도한 카페인", "음주"));
      aiSummary = "혈압 관리를 위해 식이와 복약 리듬을 함께 맞추는 방향으로 정리했습니다.";
    }

    if (containsAnyNormalized(note, "아세트아미노펜", "타이레놀", "acetaminophen", "paracetamol")) {
      criticalWarning = "아세트아미노펜 복용 중 음주는 간 손상의 치명적인 원인이 될 수 있습니다.";
      if (!avoidFoods.contains("음주")) {
        avoidFoods.add("음주");
      }
    } else if (containsAnyNormalized(note, "항생제", "amoxicillin", "antibiotic")) {
      criticalWarning = "항생제는 임의로 복용을 중단하면 재발이나 내성 위험이 커질 수 있으니 처방 기간을 지켜주세요.";
    }

    return new FillBagAnalysisResponse(
        habits.stream().distinct().limit(4).toList(),
        avoidFoods.stream().distinct().limit(4).toList(),
        criticalWarning,
        aiSummary);
  }

  private boolean containsAnyNormalized(String text, String... keywords) {
    for (String keyword : keywords) {
      if (text.contains(normalizeFillBag(keyword))) {
        return true;
      }
    }
    return false;
  }

  private String normalizeFillBag(String value) {
    return value == null ? "" : value.toLowerCase().replace(" ", "");
  }

  private String safe(String value) {
    return value == null ? "" : value.replace("\n", " ").trim();
  }

  private String text(JsonNode root, String parent, String child, String fallback) {
    JsonNode node = root.path(parent).path(child);
    return node.isMissingNode() || node.isNull() || node.asText().isBlank() ? fallback : node.asText();
  }

  private int intValue(JsonNode root, String parent, String child, int fallback) {
    JsonNode node = root.path(parent).path(child);
    return node.isMissingNode() || node.isNull() ? fallback : node.asInt(fallback);
  }
}
