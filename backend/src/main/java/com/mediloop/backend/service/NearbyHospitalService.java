package com.mediloop.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediloop.backend.dto.AnalysisResponse;
import com.mediloop.backend.dto.DiseaseScoreResponse;
import com.mediloop.backend.dto.HospitalCardResponse;
import com.mediloop.backend.dto.SummaryResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class NearbyHospitalService {
  private static final URI HOSPITAL_API = URI.create("https://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire");
  private static final URI EMERGENCY_API = URI.create("https://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulSckbdInfoInqire");
  private static final URI NOMINATIM_REVERSE = URI.create("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1");
  private static final double SEARCH_RADIUS_METERS = 30000.0;
  private static final String USER_AGENT = "MediLoop/1.0 (support@mediloop.local)";

  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(20))
      .build();
  private final ObjectMapper objectMapper;

  @Value("${mediloop.public-api.service-key:}")
  private String hospitalServiceKey;

  @Value("${mediloop.public-api.emergency-service-key:}")
  private String emergencyServiceKey;

  public NearbyHospitalService(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public AnalysisResponse recommend(double latitude, double longitude) {
    PublicHospitalSearch search = searchPublicHospitals(latitude, longitude);
    List<HospitalCardResponse> hospitals = search.hospitals().stream()
        .sorted(Comparator.comparingDouble(card -> parseDistanceMeters(card.distance())))
        .limit(3)
        .toList();
    HospitalCardResponse emergency = search.emergencyHospitals().stream().findFirst().orElse(null);

    SummaryResponse summary = new SummaryResponse(
        "媛源뚯슫 蹂묒썝",
        100,
        "?꾩옱 ?꾩튂 湲곗??쇰줈 媛源뚯슫 蹂묒썝??遺덈윭?붿뒿?덈떎.",
        "怨듦났 API ?곗씠?곕? ?ъ슜???꾩튂 湲곕컲 蹂묒썝 紐⑸줉?낅땲??",
        List.of(
            new DiseaseScoreResponse("媛源뚯슫 蹂묒썝", 100),
            new DiseaseScoreResponse("怨듦났 API 湲곕컲", 80),
            new DiseaseScoreResponse("?꾩튂 諛섏쁺", 60)));

    return new AnalysisResponse(summary, hospitals, emergency);
  }

  public PublicHospitalSearch searchPublicHospitals(double latitude, double longitude) {
    RegionInfo region = resolveRegion(latitude, longitude);
    List<HospitalCardResponse> allHospitals = new ArrayList<>();
    allHospitals.addAll(fetchOfficialHospitals(region, latitude, longitude, "A"));
    allHospitals.addAll(fetchOfficialHospitals(region, latitude, longitude, "B"));
    allHospitals.addAll(fetchOfficialHospitals(region, latitude, longitude, "C"));
    allHospitals = dedupeByNameAndAddress(allHospitals).stream()
        .filter(card -> parseDistanceMeters(card.distance()) <= SEARCH_RADIUS_METERS)
        .sorted(Comparator.comparingDouble(card -> parseDistanceMeters(card.distance())))
        .toList();

    List<HospitalCardResponse> hospitals = allHospitals.stream()
        .limit(60)
        .toList();

    List<String> emergencyNames = fetchEmergencyHospitalNames(region);
    List<HospitalCardResponse> emergencyHospitals = matchEmergencyHospitals(allHospitals, emergencyNames).stream()
        .sorted(Comparator.comparingDouble(card -> parseDistanceMeters(card.distance())))
        .limit(5)
        .toList();

    return new PublicHospitalSearch(hospitals, emergencyHospitals);
  }

  private List<HospitalCardResponse> fetchOfficialHospitals(
      RegionInfo region,
      double latitude,
      double longitude,
      String instituteType) {
    try {
      Map<String, String> params = new LinkedHashMap<>();
      if (!region.stage1().isBlank()) {
        params.put("Q0", region.stage1());
      }
      if (!region.stage2().isBlank()) {
        params.put("Q1", region.stage2());
      }
      params.put("QZ", instituteType);
      params.put("pageNo", "1");
      params.put("numOfRows", "300");

      String xml = invokeXml(HOSPITAL_API, hospitalServiceKey, params);
      List<HospitalCardResponse> cards = new ArrayList<>();
      for (Element item : parseItems(xml)) {
        String name = firstNonBlank(text(item, "dutyName"), text(item, "name"), text(item, "yadmNm"));
        if (name.isBlank()) {
          continue;
        }

        String address = firstNonBlank(text(item, "dutyAddr"), text(item, "address"), text(item, "addr"));
        String specialty = firstNonBlank(text(item, "dutyDivNam"), text(item, "department"), text(item, "clCdNm"));
        String displaySpecialty = chooseSpecialtyLabel(name, specialty);
        String phone = firstNonBlank(text(item, "dutyTel1"), text(item, "phone"), text(item, "telno"), "\uC804\uD654\uBC88\uD638 \uC5C6\uC74C");
        String hours = normalizeHours(firstNonBlank(extractHours(item), "09:00 ~ 18:00"));
        Double lat = parseCoordinate(text(item, "wgs84Lat"), text(item, "lat"), text(item, "YPos"));
        Double lon = parseCoordinate(text(item, "wgs84Lon"), text(item, "lon"), text(item, "XPos"));
        if (lat == null || lon == null) {
          continue;
        }

        String distance = formatDistance(distanceMeters(latitude, longitude, lat, lon));
        String meta = distance + " \u00B7 " + displaySpecialty + " \u00B7 " + address;
        cards.add(new HospitalCardResponse(
            name,
            meta,
            "normal",
            address,
            hours,
            phone,
            distance,
            name,
            name));
      }
      return cards;
    } catch (Exception ex) {
      System.err.println("[MediLoop][Hospital] official hospital API failed: " + ex.getMessage());
      return List.of();
    }
  }

  private List<String> fetchEmergencyHospitalNames(RegionInfo region) {
    try {
      Map<String, String> params = new LinkedHashMap<>();
      if (!region.stage1().isBlank()) {
        params.put("STAGE1", region.stage1());
      }
      if (!region.stage2().isBlank()) {
        params.put("STAGE2", region.stage2());
      }
      params.put("pageNo", "1");
      params.put("numOfRows", "50");

      String xml = invokeXml(EMERGENCY_API, emergencyServiceKey, params);
      List<String> names = new ArrayList<>();
      for (Element item : parseItems(xml)) {
        String name = firstNonBlank(text(item, "dutyName"), text(item, "name"), text(item, "yadmNm"));
        if (name.isBlank()) {
          continue;
        }
        names.add(name.trim());
      }
      return names;
    } catch (Exception ex) {
      System.err.println("[MediLoop][Hospital] official emergency API failed: " + ex.getMessage());
      return List.of();
    }
  }

  private List<HospitalCardResponse> matchEmergencyHospitals(List<HospitalCardResponse> hospitals, List<String> emergencyNames) {
    if (emergencyNames.isEmpty() || hospitals.isEmpty()) {
      return List.of();
    }

    Map<String, HospitalCardResponse> byName = new LinkedHashMap<>();
    for (HospitalCardResponse hospital : hospitals) {
      byName.put(normalize(hospital.name()), hospital);
    }

    List<HospitalCardResponse> matches = new ArrayList<>();
    for (String emergencyName : emergencyNames) {
      String normalizedEmergencyName = normalize(emergencyName);
      HospitalCardResponse exact = byName.get(normalizedEmergencyName);
      if (exact != null) {
        matches.add(toEmergencyCard(exact));
        continue;
      }

      HospitalCardResponse fuzzy = hospitals.stream()
          .filter(card -> {
            String normalizedHospitalName = normalize(card.name());
            return normalizedHospitalName.contains(normalizedEmergencyName)
                || normalizedEmergencyName.contains(normalizedHospitalName);
          })
          .findFirst()
          .orElse(null);
      if (fuzzy != null) {
        matches.add(toEmergencyCard(fuzzy));
      }
    }
    return dedupeByNameAndAddress(matches);
  }

  private HospitalCardResponse toEmergencyCard(HospitalCardResponse base) {
    return new HospitalCardResponse(
        base.name(),
        base.distance() + " \u00B7 \uC751\uAE09 \u00B7 " + base.address(),
        "danger",
        base.address(),
        "24 hours",
        base.phone(),
        base.distance(),
        base.reserveQuery(),
        base.directionQuery());
  }

  private RegionInfo resolveRegion(double latitude, double longitude) {
    try {
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(NOMINATIM_REVERSE + "&lat=" + latitude + "&lon=" + longitude))
          .timeout(Duration.ofSeconds(20))
          .header("User-Agent", USER_AGENT)
          .GET()
          .build();
      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
      if (response.statusCode() >= 300) {
        return RegionInfo.empty();
      }
      JsonNode root = objectMapper.readTree(response.body());
      JsonNode address = root.path("address");
      String stage1 = firstNonBlank(
          address.path("state").asText(""),
          address.path("province").asText(""),
          address.path("region").asText(""));
      String stage2 = firstNonBlank(
          address.path("city").asText(""),
          address.path("county").asText(""),
          address.path("district").asText(""));
      return new RegionInfo(stage1, stage2);
    } catch (Exception ex) {
      return RegionInfo.empty();
    }
  }

  private String invokeXml(URI uri, String serviceKey, Map<String, String> params) throws Exception {
    StringBuilder query = new StringBuilder();
    query.append("serviceKey=").append(URLEncoder.encode(serviceKey == null ? "" : serviceKey, StandardCharsets.UTF_8));
    for (Map.Entry<String, String> entry : params.entrySet()) {
      query.append('&')
          .append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8))
          .append('=')
          .append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
    }

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(uri + "?" + query))
        .timeout(Duration.ofSeconds(30))
        .header("User-Agent", USER_AGENT)
        .GET()
        .build();
    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
    if (response.statusCode() >= 300) {
      throw new IllegalStateException("HTTP " + response.statusCode() + ": " + response.body());
    }
    return response.body();
  }
  private List<Element> parseItems(String xml) throws Exception {
    Document document = DocumentBuilderFactory.newInstance()
        .newDocumentBuilder()
        .parse(new InputSource(new StringReader(xml)));
    NodeList items = document.getElementsByTagName("item");
    List<Element> result = new ArrayList<>();
    for (int i = 0; i < items.getLength(); i++) {
      result.add((Element) items.item(i));
    }
    return result;
  }

  private String text(Element item, String tagName) {
    NodeList nodes = item.getElementsByTagName(tagName);
    if (nodes == null || nodes.getLength() == 0) {
      return "";
    }
    return nodes.item(0).getTextContent().trim();
  }

  private String extractHours(Element item) {
    return firstNonBlank(
        text(item, "dutyTime1s"),
        text(item, "dutyTime1c"),
        text(item, "trmtWeek"),
        text(item, "wtime"));
  }

  private List<HospitalCardResponse> dedupeByNameAndAddress(List<HospitalCardResponse> cards) {
    Map<String, HospitalCardResponse> byKey = new LinkedHashMap<>();
    for (HospitalCardResponse card : cards) {
      String key = normalize(card.name()) + "|" + normalize(card.address());
      HospitalCardResponse existing = byKey.get(key);
      if (existing == null || parseDistanceMeters(card.distance()) < parseDistanceMeters(existing.distance())) {
        byKey.put(key, card);
      }
    }
    return new ArrayList<>(byKey.values());
  }

  private String chooseSpecialtyLabel(String hospitalName, String apiSpecialty) {
    String cleaned = apiSpecialty == null ? "" : apiSpecialty.trim();
    if (!cleaned.isBlank() && !isGenericFacilityLabel(cleaned)) {
      return cleaned;
    }
    return inferSpecialtyFromName(hospitalName);
  }

  private boolean isGenericFacilityLabel(String value) {
    String normalized = normalize(value);
    return normalized.equals(normalize("\uC758\uC6D0"))
        || normalized.equals(normalize("\uBCD1\uC6D0"))
        || normalized.equals(normalize("\uC885\uD569\uBCD1\uC6D0"))
        || normalized.equals(normalize("\uB300\uD559\uBCD1\uC6D0"))
        || normalized.equals(normalize("\uC694\uC591\uBCD1\uC6D0"))
        || normalized.equals(normalize("\uC758\uB8CC\uC6D0"));
  }

  private String inferSpecialtyFromName(String hospitalName) {
    String normalized = normalize(hospitalName);
    if (normalized.contains(normalize("\uD53C\uBD80\uACFC"))) {
      return "\uD53C\uBD80\uACFC";
    }
    if (normalized.contains(normalize("\uC548\uACFC"))) {
      return "\uC548\uACFC";
    }
    if (normalized.contains(normalize("\uC774\uBE44\uC778\uD6C4\uACFC"))) {
      return "\uC774\uBE44\uC778\uD6C4\uACFC";
    }
    if (normalized.contains(normalize("\uC815\uD615\uC678\uACFC"))) {
      return "\uC815\uD615\uC678\uACFC";
    }
    if (normalized.contains(normalize("\uC18C\uC544\uCCAD\uC18C\uB144\uACFC")) || normalized.contains(normalize("\uC18C\uC544\uACFC"))) {
      return "\uC18C\uC544\uCCAD\uC18C\uB144\uACFC";
    }
    if (normalized.contains(normalize("\uAC00\uC815\uC758\uD559\uACFC"))) {
      return "\uAC00\uC815\uC758\uD559\uACFC";
    }
    if (normalized.contains(normalize("\uC7AC\uD65C\uC758\uD559\uACFC"))) {
      return "\uC7AC\uD65C\uC758\uD559\uACFC";
    }
    if (normalized.contains(normalize("\uC678\uACFC"))) {
      return "\uC678\uACFC";
    }
    if (normalized.contains(normalize("\uBE44\uB1E8\uC758\uD559\uACFC")) || normalized.contains(normalize("\uBE44\uB1E8\uAE30\uACFC"))) {
      return "\uBE44\uB1E8\uC758\uD559\uACFC";
    }
    if (normalized.contains(normalize("\uC2E0\uACBD\uC678\uACFC")) || normalized.contains(normalize("\uC2E0\uACBD\uACFC"))) {
      return "\uC2E0\uACBD\uACFC";
    }
    if (normalized.contains(normalize("\uC815\uC2E0\uAC74\uAC15\uC758\uD559\uACFC")) || normalized.contains(normalize("\uC815\uC2E0\uACFC"))) {
      return "\uC815\uC2E0\uAC74\uAC15\uC758\uD559\uACFC";
    }
    if (normalized.contains(normalize("\uCE58\uACFC"))) {
      return "\uCE58\uACFC";
    }
    if (normalized.contains(normalize("\uB0B4\uACFC"))) {
      return "\uB0B4\uACFC";
    }
    if (normalized.contains(normalize("\uC2EC\uC7A5")) || normalized.contains(normalize("\uC21C\uD658")) || normalized.contains(normalize("\uD749\uBD80\uC678\uACFC"))) {
      return "\uC21C\uD658\uAE30 \uACC4\uC5F4";
    }
    if (normalized.contains(normalize("\uC0B0\uBD80\uC778\uACFC"))) {
      return "\uC0B0\uBD80\uC778\uACFC";
    }
    if (normalized.contains(normalize("\uBCD1\uC6D0")) || normalized.contains(normalize("\uC758\uB8CC\uC6D0")) || normalized.contains(normalize("\uBA54\uB514\uCEEC"))) {
      return "\uC885\uD569\uC9C4\uB8CC";
    }
    return "\uC77C\uBC18\uC758\uC6D0";
  }

  private String normalizeHours(String raw) {
    if (raw == null || raw.isBlank()) {
      return "09:00 ~ 18:00";
    }
    String trimmed = raw.trim();
    if (trimmed.matches("\\d{4}")) {
      return trimmed.substring(0, 2) + ":" + trimmed.substring(2);
    }
    return trimmed;
  }

  private String formatDistance(double distanceMeters) {
    if (distanceMeters < 1000) {
      return Math.round(distanceMeters) + "m";
    }
    return String.format(Locale.US, "%.1fkm", distanceMeters / 1000.0);
  }

  private Double parseCoordinate(String... values) {
    for (String value : values) {
      if (value == null || value.isBlank()) {
        continue;
      }
      try {
        return Double.parseDouble(value.trim());
      } catch (Exception ignored) {
        // continue
      }
    }
    return null;
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
      // fall through
    }
    return Double.MAX_VALUE;
  }

  private double distanceMeters(double latitude1, double longitude1, double latitude2, double longitude2) {
    double earthRadius = 6371000.0;
    double dLat = Math.toRadians(latitude2 - latitude1);
    double dLon = Math.toRadians(longitude2 - longitude1);
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(Math.toRadians(latitude1))
        * Math.cos(Math.toRadians(latitude2))
        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  private String normalize(String value) {
    return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[\\s\\p{Punct}]+", "");
  }

  private String firstNonBlank(String... values) {
    for (String value : values) {
      if (value != null && !value.isBlank()) {
        return value.trim();
      }
    }
    return "";
  }

  public record PublicHospitalSearch(
      List<HospitalCardResponse> hospitals,
      List<HospitalCardResponse> emergencyHospitals) {
  }

  private record RegionInfo(String stage1, String stage2) {
    private static RegionInfo empty() {
      return new RegionInfo("", "");
    }
  }
}
