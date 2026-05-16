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
import org.w3c.dom.Node;
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
import java.util.Objects;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NearbyHospitalService {
  private static final double SEARCH_RADIUS_METERS = 30_000.0;
  private static final double EMERGENCY_SEARCH_RADIUS_METERS = 50_000.0;
  private static final URI HOSPITAL_API = URI.create("https://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire");
  private static final URI EMERGENCY_API = URI.create("https://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulSckbdInfoInqire");
  private static final URI NOMINATIM_REVERSE = URI.create("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1");
  private static final URI NOMINATIM_SEARCH = URI.create("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1");
  private static final String USER_AGENT = "MediLoop/1.0 (support@mediloop.local)";
  private static final List<String> KNOWN_SPECIALTY_MARKERS = List.of(
      "이비인후과", "안과", "피부과", "정형외과", "치과", "산부인과", "신경과", "내과",
      "외과", "비뇨의학과", "비뇨기과", "소아청소년과", "가정의학과", "응급", "재활의학과",
      "마취통증", "통증의학과",
      "순환기", "심장", "신장", "호흡기", "소화기", "vascular", "cardio", "renal",
      "ent", "ophthalm", "derma", "ortho", "dental", "obgyn", "urology", "pediatrics", "painclinic");

  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(20))
      .build();
  private final ObjectMapper objectMapper;
  private final Map<String, RegionInfo> regionCache = new ConcurrentHashMap<>();
  private final Map<String, GeoPoint> geocodeCache = new ConcurrentHashMap<>();

  @Value("${mediloop.public-api.service-key:}")
  private String hospitalServiceKey;

  @Value("${mediloop.public-api.emergency-service-key:}")
  private String emergencyServiceKey;

  public NearbyHospitalService(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public AnalysisResponse recommend(double latitude, double longitude) {
    return recommend(latitude, longitude, List.of());
  }

  public AnalysisResponse recommend(double latitude, double longitude, List<String> diseaseHints) {
    List<String> hints = normalizeHints(diseaseHints);
    RegionInfo region = resolveRegion(latitude, longitude);

    List<HospitalCandidate> general = new ArrayList<>();
    general.addAll(fetchOfficialHospitals(region, latitude, longitude, hints, "B"));
    general.addAll(fetchOfficialHospitals(region, latitude, longitude, hints, "C"));
    general = dedupe(general);

    if (general.isEmpty()) {
      general.addAll(fetchFallbackHospitals(latitude, longitude, hints));
      general = dedupe(general);
    }

    general.sort(candidateComparator());
    general = enrichTopDistances(general, latitude, longitude, 8);
    general.sort(candidateComparator());

    List<HospitalCandidate> hospitals = general.stream()
        .filter(candidate -> candidate.distanceMeters <= SEARCH_RADIUS_METERS)
        .limit(3)
        .toList();

    HospitalCandidate emergency = fetchOfficialEmergency(region, latitude, longitude, hints);
    if (emergency == null) {
      emergency = general.stream().filter(HospitalCandidate::emergency).findFirst().orElse(null);
    }
    if (emergency == null && !general.isEmpty()) {
      emergency = general.get(0).withEmergencyTone();
    }

    if (emergency != null && !Double.isNaN(emergency.latitude) && !Double.isNaN(emergency.longitude)) {
      double emergencyDistance = distanceMeters(latitude, longitude, emergency.latitude, emergency.longitude);
      emergency = emergency.withDistance(emergencyDistance, emergency.latitude, emergency.longitude);
    }

    if (emergency != null) {
      String emergencyName = emergency.name;
      hospitals = hospitals.stream()
          .filter(candidate -> !candidate.name.equalsIgnoreCase(emergencyName))
          .toList();
    }

    if (hospitals.isEmpty()) {
      hospitals = List.of(new HospitalCandidate(
          "Nearby hospital",
          "No hospital result",
          false,
          false,
          "",
          "09:00 ~ 18:00",
          "No phone",
          "0m",
          "Nearby hospital",
          "Nearby hospital",
          0,
          Double.NaN,
          Double.NaN,
          "normal",
          "fallback",
          1));
    }

    SummaryResponse summary = new SummaryResponse(
        "Nearby hospital recommendation",
        100,
        region.description.isBlank() ? "Results based on current location." : region.description + " based results.",
        "This result reflects disease hints and current location.",
        buildDiseaseScores(hints));

    List<HospitalCardResponse> hospitalCards = hospitals.stream().map(HospitalCandidate::toCard).toList();
    HospitalCardResponse emergencyCard = emergency == null ? null : emergency.toCard();
    return new AnalysisResponse(summary, hospitalCards, emergencyCard);
  }

  private List<DiseaseScoreResponse> buildDiseaseScores(List<String> hints) {
    if (hints.isEmpty()) {
      return List.of(
          new DiseaseScoreResponse("Nearby hospital", 100),
          new DiseaseScoreResponse("Internal medicine", 80),
          new DiseaseScoreResponse("Emergency room", 60));
    }
    List<DiseaseScoreResponse> scores = new ArrayList<>();
    int value = 100;
    for (String hint : hints) {
      scores.add(new DiseaseScoreResponse(hint, Math.max(10, value)));
      value -= 20;
      if (scores.size() == 3) {
        break;
      }
    }
    while (scores.size() < 3) {
      scores.add(new DiseaseScoreResponse("Nearby hospital", Math.max(10, value)));
      value -= 20;
    }
    return scores;
  }

  private List<String> normalizeHints(List<String> diseaseHints) {
    if (diseaseHints == null || diseaseHints.isEmpty()) {
      return List.of();
    }
    return diseaseHints.stream()
        .filter(value -> value != null && !value.isBlank())
        .map(value -> normalize(value.trim()))
        .distinct()
        .toList();
  }

  private List<HospitalCandidate> fetchOfficialHospitals(RegionInfo region, double userLat, double userLon, List<String> hints, String instituteType) {
    try {
      Map<String, String> params = new LinkedHashMap<>();
      if (!region.q0.isBlank()) {
        params.put("Q0", region.q0);
      }
      if (!region.q1.isBlank()) {
        params.put("Q1", region.q1);
      }
      params.put("QZ", instituteType);
      params.put("pageNo", "1");
      params.put("numOfRows", "100");
      String xml = invokeXml(HOSPITAL_API, hospitalServiceKey, params);
      return parseOfficialItems(xml, userLat, userLon, hints, false);
    } catch (Exception ex) {
      System.err.println("[MediLoop][Hospital] official hospital API failed: " + ex.getMessage());
      return List.of();
    }
  }

  private HospitalCandidate fetchOfficialEmergency(RegionInfo region, double userLat, double userLon, List<String> hints) {
    HospitalCandidate fallback = fetchFallbackEmergency(userLat, userLon, hints);
    if (fallback != null) {
      return fallback;
    }
    try {
      Map<String, String> params = new LinkedHashMap<>();
      if (!region.q0.isBlank()) {
        params.put("STAGE1", region.q0);
      }
      if (!region.q1.isBlank()) {
        params.put("STAGE2", region.q1);
      }
      params.put("pageNo", "1");
      params.put("numOfRows", "20");
      String xml = invokeXml(EMERGENCY_API, emergencyServiceKey, params);
      List<HospitalCandidate> candidates = parseOfficialItems(xml, userLat, userLon, hints, true);
      HospitalCandidate nearestOfficial = candidates.stream()
          .filter(candidate -> !Double.isNaN(candidate.distanceMeters))
          .min(
              Comparator.comparingDouble((HospitalCandidate c) -> c.distanceMeters)
                  .thenComparingInt(c -> -c.score))
          .orElse(null);
      if (nearestOfficial != null && nearestOfficial.address.isBlank() && !Double.isNaN(nearestOfficial.latitude) && !Double.isNaN(nearestOfficial.longitude)) {
        String resolvedAddress = resolveAddress(nearestOfficial.latitude, nearestOfficial.longitude);
        if (!resolvedAddress.isBlank()) {
          nearestOfficial = nearestOfficial.withAddress(resolvedAddress);
        }
      }
      return nearestOfficial;
    } catch (Exception ex) {
      System.err.println("[MediLoop][Hospital] official emergency API failed: " + ex.getMessage());
      return null;
    }
  }

  private List<HospitalCandidate> parseOfficialItems(String xml, double userLat, double userLon, List<String> hints, boolean emergencyMode) throws Exception {
    List<HospitalCandidate> result = new ArrayList<>();
    for (Element item : parseItems(xml)) {
      String name = firstNonBlank(text(item, "dutyName"), text(item, "name"), text(item, "yadmNm"));
      if (name.isBlank()) {
        continue;
      }
      String address = firstNonBlank(text(item, "dutyAddr"), text(item, "address"), text(item, "addr"));
      String phone = firstNonBlank(text(item, "dutyTel1"), text(item, "phone"), text(item, "telno"), "No phone");
      String specialty = firstNonBlank(text(item, "dutyDivNam"), text(item, "department"), text(item, "clCdNm"));
      String hours = firstNonBlank(extractHours(item), emergencyMode ? "24 hours" : "09:00 ~ 18:00");
      Double lat = parseCoordinate(text(item, "wgs84Lat"), text(item, "lat"), text(item, "YPos"));
      Double lon = parseCoordinate(text(item, "wgs84Lon"), text(item, "lon"), text(item, "XPos"));
      double dist = lat != null && lon != null ? distanceMeters(userLat, userLon, lat, lon) : Double.NaN;
      int score = diseaseScore(joinText(name, address, specialty, phone), hints);
      if (emergencyMode) {
        score += 10;
      }
      if (!Double.isNaN(dist) && dist < 1000) {
        score += 10;
      } else if (!Double.isNaN(dist)) {
        score += Math.max(0, 30 - (int) (dist / 2000.0));
      }
      String distance = Double.isNaN(dist) ? "distance unavailable" : formatDistance(dist);
      String meta = distance + " · " + (address.isBlank() ? "address unavailable" : address) + " · " + hours;
      result.add(new HospitalCandidate(
          name,
          meta,
          emergencyMode,
          true,
          address,
          hours,
          phone,
          distance,
          name,
          name,
          dist,
          lat == null ? Double.NaN : lat,
          lon == null ? Double.NaN : lon,
          emergencyMode ? "danger" : "normal",
          "official",
          score));
    }
    return result;
  }

  private List<HospitalCandidate> fetchFallbackHospitals(double userLat, double userLon, List<String> hints) {
    try {
      String query = """
          [out:json][timeout:25];
          (
            node(around:%1$.0f,%2$.6f,%3$.6f)["amenity"~"hospital|clinic|doctors"];
            way(around:%1$.0f,%2$.6f,%3$.6f)["amenity"~"hospital|clinic|doctors"];
            relation(around:%1$.0f,%2$.6f,%3$.6f)["amenity"~"hospital|clinic|doctors"];
            node(around:%1$.0f,%2$.6f,%3$.6f)["healthcare"~"hospital|clinic|doctor"];
            way(around:%1$.0f,%2$.6f,%3$.6f)["healthcare"~"hospital|clinic|doctor"];
            relation(around:%1$.0f,%2$.6f,%3$.6f)["healthcare"~"hospital|clinic|doctor"];
          );
          out center tags;
          """.formatted(SEARCH_RADIUS_METERS, userLat, userLon);

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://overpass-api.de/api/interpreter"))
          .timeout(Duration.ofSeconds(30))
          .header("User-Agent", USER_AGENT)
          .header("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
          .POST(HttpRequest.BodyPublishers.ofString("data=" + URLEncoder.encode(query, StandardCharsets.UTF_8)))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
      if (response.statusCode() >= 300) {
        return List.of();
      }
      JsonNode root = objectMapper.readTree(response.body());
      JsonNode elements = root.path("elements");
      List<HospitalCandidate> result = new ArrayList<>();
      if (elements.isArray()) {
        for (JsonNode element : elements) {
          HospitalCandidate candidate = parseFallbackItem(element, userLat, userLon, hints);
          if (candidate != null) {
            result.add(candidate);
          }
        }
      }
      return result;
    } catch (Exception ex) {
      System.err.println("[MediLoop][Hospital] fallback OSM failed: " + ex.getMessage());
      return List.of();
    }
  }

  private HospitalCandidate fetchFallbackEmergency(double userLat, double userLon, List<String> hints) {
    try {
      String query = """
          [out:json][timeout:25];
          (
            node(around:%1$.0f,%2$.6f,%3$.6f)["amenity"="hospital"]["emergency"];
            way(around:%1$.0f,%2$.6f,%3$.6f)["amenity"="hospital"]["emergency"];
            relation(around:%1$.0f,%2$.6f,%3$.6f)["amenity"="hospital"]["emergency"];
            node(around:%1$.0f,%2$.6f,%3$.6f)["healthcare"="hospital"]["emergency"];
            way(around:%1$.0f,%2$.6f,%3$.6f)["healthcare"="hospital"]["emergency"];
            relation(around:%1$.0f,%2$.6f,%3$.6f)["healthcare"="hospital"]["emergency"];
          );
          out center tags;
          """.formatted(EMERGENCY_SEARCH_RADIUS_METERS, userLat, userLon);

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://overpass-api.de/api/interpreter"))
          .timeout(Duration.ofSeconds(30))
          .header("User-Agent", USER_AGENT)
          .header("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
          .POST(HttpRequest.BodyPublishers.ofString("data=" + URLEncoder.encode(query, StandardCharsets.UTF_8)))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
      if (response.statusCode() >= 300) {
        return null;
      }
      JsonNode root = objectMapper.readTree(response.body());
      JsonNode elements = root.path("elements");
      HospitalCandidate best = null;
      if (elements.isArray()) {
        for (JsonNode element : elements) {
          HospitalCandidate candidate = parseEmergencyFallbackItem(element, userLat, userLon, hints);
          if (candidate == null) {
            continue;
          }
          if (best == null
              || candidate.distanceMeters < best.distanceMeters
              || (candidate.distanceMeters == best.distanceMeters && candidate.score > best.score)) {
            best = candidate;
          }
        }
      }
      if (best != null && best.address.isBlank()) {
        String resolvedAddress = resolveAddress(best.latitude, best.longitude);
        if (!resolvedAddress.isBlank()) {
          best = best.withAddress(resolvedAddress);
        }
      }
      return best;
    } catch (Exception ex) {
      System.err.println("[MediLoop][Hospital] fallback emergency lookup failed: " + ex.getMessage());
      return null;
    }
  }

  private HospitalCandidate parseFallbackItem(JsonNode element, double userLat, double userLon, List<String> hints) {
    JsonNode tags = element.path("tags");
    String name = firstNonBlank(tags.path("name").asText(""), tags.path("operator").asText(""), tags.path("brand").asText(""));
    if (name.isBlank()) {
      return null;
    }
    double lat = element.path("lat").asDouble(Double.NaN);
    double lon = element.path("lon").asDouble(Double.NaN);
    if (Double.isNaN(lat) || Double.isNaN(lon)) {
      lat = element.path("center").path("lat").asDouble(Double.NaN);
      lon = element.path("center").path("lon").asDouble(Double.NaN);
    }
    if (Double.isNaN(lat) || Double.isNaN(lon)) {
      return null;
    }
    String address = buildAddress(tags);
    String phone = firstNonBlank(tags.path("phone").asText(""), tags.path("contact:phone").asText(""), "No phone");
    String hours = firstNonBlank(tags.path("opening_hours").asText(""), "09:00 ~ 18:00");
    double dist = distanceMeters(userLat, userLon, lat, lon);
    if (dist > SEARCH_RADIUS_METERS) {
      return null;
    }
    boolean emergency = isEmergency(tags, name);
    int score = diseaseScore(joinText(name, address, tags.path("healthcare:speciality").asText("")), hints);
    if (emergency) {
      score += 10;
    }
    if (dist < 1000) {
      score += 10;
    } else {
      score += Math.max(0, 20 - (int) (dist / 2500.0));
    }
    String distance = formatDistance(dist);
    String meta = distance + " · " + (address.isBlank() ? "address unavailable" : address) + " · " + hours;
    return new HospitalCandidate(
        name,
        meta,
        emergency,
        true,
        address,
        hours,
        phone,
        distance,
        name,
        name,
        dist,
        lat,
        lon,
        emergency ? "danger" : "normal",
        "osm",
        score);
  }

  private HospitalCandidate parseEmergencyFallbackItem(JsonNode element, double userLat, double userLon, List<String> hints) {
    JsonNode tags = element.path("tags");
    String name = firstNonBlank(tags.path("name").asText(""), tags.path("operator").asText(""), tags.path("brand").asText(""));
    if (name.isBlank() || !isEmergency(tags, name)) {
      return null;
    }
    double lat = element.path("lat").asDouble(Double.NaN);
    double lon = element.path("lon").asDouble(Double.NaN);
    if (Double.isNaN(lat) || Double.isNaN(lon)) {
      lat = element.path("center").path("lat").asDouble(Double.NaN);
      lon = element.path("center").path("lon").asDouble(Double.NaN);
    }
    if (Double.isNaN(lat) || Double.isNaN(lon)) {
      return null;
    }
    double dist = distanceMeters(userLat, userLon, lat, lon);
    if (dist > EMERGENCY_SEARCH_RADIUS_METERS) {
      return null;
    }
    String address = buildAddress(tags);
    String phone = firstNonBlank(tags.path("phone").asText(""), tags.path("contact:phone").asText(""), "No phone");
    String hours = firstNonBlank(tags.path("opening_hours").asText(""), "24 hours");
    int score = diseaseScore(joinText(name, address, tags.path("healthcare:speciality").asText("")), hints) + 20;
    String distance = formatDistance(dist);
    String meta = distance + " · " + (address.isBlank() ? "address unavailable" : address) + " · " + hours;
    return new HospitalCandidate(
        name,
        meta,
        true,
        true,
        address,
        hours,
        phone,
        distance,
        name,
        name,
        dist,
        lat,
        lon,
        "danger",
        "osm",
        score);
  }

  private List<HospitalCandidate> enrichTopDistances(List<HospitalCandidate> candidates, double userLat, double userLon, int limit) {
    List<HospitalCandidate> enriched = new ArrayList<>();
    for (int i = 0; i < candidates.size(); i++) {
      HospitalCandidate candidate = candidates.get(i);
      if (i < limit && Double.isNaN(candidate.distanceMeters)) {
        GeoPoint point = resolveGeoPoint(candidate.name, candidate.address);
        if (point.valid()) {
          double dist = distanceMeters(userLat, userLon, point.latitude, point.longitude);
          enriched.add(candidate.withDistance(dist, point.latitude, point.longitude));
        } else {
          enriched.add(candidate);
        }
      } else {
        enriched.add(candidate);
      }
    }
    return enriched;
  }

  private List<HospitalCandidate> dedupe(List<HospitalCandidate> candidates) {
    Map<String, HospitalCandidate> deduped = new LinkedHashMap<>();
    for (HospitalCandidate candidate : candidates) {
      String key = candidate.name.toLowerCase(Locale.ROOT) + "|" + candidate.address.toLowerCase(Locale.ROOT);
      HospitalCandidate current = deduped.get(key);
      if (current == null
          || candidate.score > current.score
          || (candidate.score == current.score && candidate.distanceMeters < current.distanceMeters)) {
        deduped.put(key, candidate);
      }
    }
    return new ArrayList<>(deduped.values());
  }

  private Comparator<HospitalCandidate> candidateComparator() {
    return Comparator
        .comparingInt((HospitalCandidate c) -> c.score).reversed()
        .thenComparing(c -> Double.isNaN(c.distanceMeters))
        .thenComparing(c -> c.address.isBlank())
        .thenComparingDouble(c -> c.distanceMeters);
  }

  private List<Element> parseItems(String xml) throws Exception {
    Document document = DocumentBuilderFactory.newInstance()
        .newDocumentBuilder()
        .parse(new InputSource(new StringReader(xml)));
    NodeList nodeList = document.getElementsByTagName("item");
    List<Element> items = new ArrayList<>();
    for (int i = 0; i < nodeList.getLength(); i++) {
      Node node = nodeList.item(i);
      if (node instanceof Element element) {
        items.add(element);
      }
    }
    return items;
  }

  private RegionInfo resolveRegion(double latitude, double longitude) {
    String key = String.format(Locale.US, "%.6f,%.6f", latitude, longitude);
    return regionCache.computeIfAbsent(key, ignored -> {
      try {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(NOMINATIM_REVERSE + "&lat=" + latitude + "&lon=" + longitude))
            .timeout(Duration.ofSeconds(15))
            .header("User-Agent", USER_AGENT)
            .GET()
            .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() >= 300) {
          return RegionInfo.empty();
        }
        JsonNode root = objectMapper.readTree(response.body());
        JsonNode address = root.path("address");
        String q0 = firstNonBlank(address.path("state").asText(""), address.path("province").asText(""), address.path("region").asText(""));
        String q1 = firstNonBlank(address.path("county").asText(""), address.path("city").asText(""), address.path("city_district").asText(""), address.path("town").asText(""), address.path("village").asText(""), address.path("suburb").asText(""));
        return new RegionInfo(q0, q1, joinWithSpace(q0, q1));
      } catch (Exception ex) {
        return RegionInfo.empty();
      }
    });
  }

  private GeoPoint resolveGeoPoint(String name, String address) {
    String key = normalize(name + "|" + address);
    return geocodeCache.computeIfAbsent(key, ignored -> {
      try {
        String query = joinWithSpace(name, address);
        if (query.isBlank()) {
          return GeoPoint.empty();
        }
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(NOMINATIM_SEARCH + "&q=" + URLEncoder.encode(query, StandardCharsets.UTF_8)))
            .timeout(Duration.ofSeconds(15))
            .header("User-Agent", USER_AGENT)
            .GET()
            .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() >= 300) {
          return GeoPoint.empty();
        }
        JsonNode root = objectMapper.readTree(response.body());
        if (root.isArray() && !root.isEmpty()) {
          JsonNode first = root.get(0);
          return new GeoPoint(first.path("lat").asDouble(Double.NaN), first.path("lon").asDouble(Double.NaN));
        }
      } catch (Exception ignoredEx) {
        // keep empty
      }
      return GeoPoint.empty();
    });
  }

  private String resolveAddress(double latitude, double longitude) {
    if (Double.isNaN(latitude) || Double.isNaN(longitude)) {
      return "";
    }
    return resolveReverseDisplayName(latitude, longitude);
  }

  private String resolveReverseDisplayName(double latitude, double longitude) {
    try {
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(NOMINATIM_REVERSE + "&lat=" + latitude + "&lon=" + longitude))
          .timeout(Duration.ofSeconds(15))
          .header("User-Agent", USER_AGENT)
          .GET()
          .build();
      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
      if (response.statusCode() >= 300) {
        return "";
      }
      JsonNode root = objectMapper.readTree(response.body());
      String displayName = root.path("display_name").asText("");
      if (!displayName.isBlank()) {
        return displayName;
      }
      JsonNode address = root.path("address");
      return firstNonBlank(
          address.path("road").asText(""),
          address.path("neighbourhood").asText(""),
          address.path("suburb").asText(""),
          address.path("city").asText(""),
          address.path("county").asText(""),
          address.path("state").asText(""));
    } catch (Exception ex) {
      return "";
    }
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

  private String invokeXml(URI uri, String serviceKey, Map<String, String> params) throws Exception {
    StringBuilder query = new StringBuilder();
    if (serviceKey != null && !serviceKey.isBlank()) {
      query.append("serviceKey=").append(URLEncoder.encode(serviceKey, StandardCharsets.UTF_8));
    }
    for (Map.Entry<String, String> entry : params.entrySet()) {
      if (query.length() > 0) {
        query.append('&');
      }
      query.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8))
          .append('=')
          .append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
    }

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(uri.toString() + "?" + query))
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

  private int diseaseScore(String text, List<String> hints) {
    if (hints == null || hints.isEmpty()) {
      return 1;
    }
    int score = 0;
    for (String hint : hints) {
      score += diseaseScoreForHint(text, hint);
    }
    if (score <= 0) {
      return score;
    }
    return score;
  }

  private int diseaseScoreForHint(String hospitalText, String diseaseHint) {
    String text = normalize(hospitalText);
    String hint = normalize(diseaseHint);
    if (hint.isBlank()) {
      return 0;
    }
    if (containsAny(hint, "하지부종", "부종", "다리붓기", "발붓기", "legswelling", "edema", "swelling")) {
      return scoreSpecialty(text,
          List.of("내과", "순환기", "심장", "신장", "혈관", "외과", "가정의학과", "internalmedicine", "cardio", "renal", "vascular", "surgery"),
          List.of("이비인후과", "안과", "피부과", "치과", "산부인과", "정형외과", "마취통증", "통증의학과", "ent", "ophthalm", "dental", "obgyn", "ortho", "painclinic"));
    }
    if (containsAny(hint, "흉통", "가슴통증", "호흡곤란", "숨참", "심계항진", "chestpain", "palpitation")) {
      return scoreSpecialty(text,
          List.of("응급", "내과", "순환기", "심장", "호흡기", "emergency", "internalmedicine", "cardio", "respiratory"),
          List.of("안과", "피부과", "치과", "ophthalm", "derma", "dental"));
    }
    if (containsAny(hint, "\uC704\uC5FC", "\uC7A5\uC5FC", "\uBCF5\uD1B5", "\uC124\uC0AC", "\uAD6C\uD1A0", "\uC18C\uD654", "\uC704\uC7A5")) {
      return scoreSpecialty(text,
          List.of("내과", "소화기", "가정의학과", "internalmedicine", "medicine", "digestive"),
          List.of("이비인후과", "안과", "정형외과", "치과", "ent", "ophthalm", "ortho", "dental"));
    }
    if (containsAny(hint, "\uAC10\uAE30", "\uBE44\uC5FC", "\uBAA9\uC544\uD504", "\uC778\uD6C4", "\uAE30\uCE68", "\uC0C1\uAE30\uB3C4", "\uD3B8\uB3C4")) {
      return scoreSpecialty(text,
          List.of("이비인후과", "내과", "호흡기", "가정의학과", "ent", "internalmedicine", "respiratory"),
          List.of("안과", "피부과", "정형외과", "치과", "ophthalm", "derma", "ortho", "dental"));
    }
    if (containsAny(hint, "\uAE30\uAD00\uC9C0", "\uCC9C\uC2DD", "\uD638\uD761", "\uD3D0\uB834", "\uAC00\uB798")) {
      return scoreSpecialty(text,
          List.of("호흡기", "내과", "응급", "respiratory", "internalmedicine", "emergency"),
          List.of("안과", "피부과", "치과", "ophthalm", "derma", "dental"));
    }
    if (containsAny(hint, "\uBC1C\uC9C4", "\uAC00\uB824\uC6C0", "\uD53C\uBD80", "\uB450\uB450\uB984", "\uC2B5\uC9C4")) {
      return scoreSpecialty(text,
          List.of("피부과", "dermatology", "derma"),
          List.of("이비인후과", "안과", "정형외과", "치과", "ent", "ophthalm", "ortho", "dental"));
    }
    if (containsAny(hint, "\uB208", "\uCDA9\uD608", "\uC2DC\uC57C", "\uACB0\uB9C9")) {
      return scoreSpecialty(text,
          List.of("안과", "ophthalmology", "ophthalm"),
          List.of("이비인후과", "피부과", "정형외과", "치과", "ent", "derma", "ortho", "dental"));
    }
    if (containsAny(hint, "\uBA65", "\uD0C0\uBC15", "\uACE8\uC808", "\uC5FC\uC88C", "\uAD00\uC808", "\uADFC\uC721", "\uD5C8\uB9AC")) {
      return scoreSpecialty(text,
          List.of("정형외과", "재활의학과", "응급", "orthopedic", "ortho", "rehab", "emergency"),
          List.of("이비인후과", "안과", "피부과", "치과", "ent", "ophthalm", "derma", "dental"));
    }
    if (containsAny(hint, "\uCE58\uD1B5", "\uC787\uC5C4", "\uCDA9\uCE58")) {
      return scoreSpecialty(text,
          List.of("치과", "dental"),
          List.of("이비인후과", "안과", "피부과", "정형외과", "ent", "ophthalm", "derma", "ortho"));
    }
    if (containsAny(hint, "\uC784\uC2E0", "\uC0DD\uB9AC", "\uC0B0\uBD80\uC778\uACFC", "\uCD9C\uD608")) {
      return scoreSpecialty(text,
          List.of("산부인과", "obstetrics", "gynecology", "obgyn"),
          List.of("이비인후과", "안과", "피부과", "정형외과", "치과", "ent", "ophthalm", "derma", "ortho", "dental"));
    }
    if (containsAny(hint, "\uB450\uD1B5", "\uC5B4\uC9C8\uB7EC\uC6C0", "\uB9C8\uBE44", "\uD3B8\uB450\uD1B5", "\uB204\uB984")) {
      return scoreSpecialty(text,
          List.of("신경과", "내과", "응급", "neurology", "internalmedicine", "emergency"),
          List.of("안과", "피부과", "치과", "ophthalm", "derma", "dental"));
    }
    return scoreSpecialty(text,
        List.of("내과", "가정의학과", "응급", "internalmedicine", "familymedicine", "emergency", "hospital", "clinic"),
        List.of());
  }

  private int scoreSpecialty(String text, List<String> positives, List<String> negatives) {
    int score = scoreByKeywords(text, positives.toArray(String[]::new));
    boolean matchedPositive = containsKeyword(text, positives);
    boolean matchedNegative = containsKeyword(text, negatives);
    boolean hasKnownSpecialty = containsKeyword(text, KNOWN_SPECIALTY_MARKERS);
    if (matchedNegative) {
      score -= 45;
    }
    if (!matchedPositive && hasKnownSpecialty) {
      score -= 20;
    }
    if (matchedPositive) {
      score += 25;
    }
    return score;
  }

  private int scoreByKeywords(String text, String... keywords) {
    String normalized = normalize(text);
    int score = 0;
    for (String keyword : keywords) {
      if (normalized.contains(normalize(keyword))) {
        score += switch (normalize(keyword)) {
          case "emergency" -> 50;
          case "internalmedicine", "medicine", "ent", "ophthalmology", "dermatology", "orthopedic", "dental", "obstetrics", "gynecology", "neurology", "respiratory" -> 40;
          case "hospital", "clinic" -> 10;
          default -> 20;
        };
      }
    }
    return score;
  }

  private boolean containsKeyword(String text, List<String> keywords) {
    String normalized = normalize(text);
    for (String keyword : keywords) {
      if (normalized.contains(normalize(keyword))) {
        return true;
      }
    }
    return false;
  }

  private boolean containsAny(String text, String... keywords) {
    for (String keyword : keywords) {
      if (text.contains(keyword)) {
        return true;
      }
    }
    return false;
  }

  private boolean isEmergency(JsonNode tags, String name) {
    String amenity = tags.path("amenity").asText("").toLowerCase(Locale.ROOT);
    String emergency = tags.path("emergency").asText("").toLowerCase(Locale.ROOT);
    String healthcare = tags.path("healthcare").asText("").toLowerCase(Locale.ROOT);
    String combined = normalize(name + " " + tags.path("name").asText("") + " " + tags.path("operator").asText(""));
    return combined.contains("emergency")
        || combined.contains(normalize("\uC751\uAE09"))
        || "yes".equals(emergency)
        || "designated".equals(emergency)
        || "emergency".equals(healthcare)
        || ("hospital".equals(amenity) && ("yes".equals(emergency) || "designated".equals(emergency)));
  }

  private String joinWithSpace(String... values) {
    StringBuilder builder = new StringBuilder();
    for (String value : values) {
      if (value != null && !value.isBlank()) {
        if (builder.length() > 0) {
          builder.append(' ');
        }
        builder.append(value.trim());
      }
    }
    return builder.toString().trim();
  }

  private String buildAddress(JsonNode tags) {
    String full = firstNonBlank(tags.path("addr:full").asText(""), tags.path("addr").asText(""));
    if (!full.isBlank()) {
      return full;
    }
    List<String> parts = new ArrayList<>();
    addIfNotBlank(parts, tags.path("addr:province").asText(""));
    addIfNotBlank(parts, tags.path("addr:city").asText(""));
    addIfNotBlank(parts, tags.path("addr:district").asText(""));
    addIfNotBlank(parts, tags.path("addr:town").asText(""));
    addIfNotBlank(parts, tags.path("addr:suburb").asText(""));
    addIfNotBlank(parts, tags.path("addr:village").asText(""));
    String street = tags.path("addr:street").asText("");
    String house = tags.path("addr:housenumber").asText("");
    if (!street.isBlank()) {
      parts.add(street + (house.isBlank() ? "" : " " + house));
    }
    return String.join(" ", parts).trim();
  }

  private String extractHours(Element item) {
    String[] keys = {
        "dutyTime1s", "dutyTime2s", "dutyTime3s", "dutyTime4s", "dutyTime5s", "dutyTime6s", "dutyTime7s",
        "dutyTime1c", "dutyTime2c", "dutyTime3c", "dutyTime4c", "dutyTime5c", "dutyTime6c", "dutyTime7c",
        "trmtWeek", "wtime"
    };
    for (String key : keys) {
      String value = text(item, key);
      if (!value.isBlank()) {
        return value;
      }
    }
    return "";
  }

  private String text(Element item, String name) {
    NodeList nodes = item.getElementsByTagName(name);
    if (nodes == null || nodes.getLength() == 0) {
      return "";
    }
    Node node = nodes.item(0);
    return node == null ? "" : Objects.toString(node.getTextContent(), "").trim();
  }

  private String joinText(String... values) {
    StringBuilder builder = new StringBuilder();
    for (String value : values) {
      if (value != null && !value.isBlank()) {
        if (builder.length() > 0) {
          builder.append(' ');
        }
        builder.append(value.trim());
      }
    }
    return builder.toString().trim();
  }

  private String normalize(String text) {
    if (text == null) {
      return "";
    }
    return text.toLowerCase(Locale.ROOT).replaceAll("[\\s\\p{Punct}]+", "");
  }

  private String firstNonBlank(String... values) {
    for (String value : values) {
      if (value != null && !value.isBlank()) {
        return value.trim();
      }
    }
    return "";
  }

  private void addIfNotBlank(List<String> parts, String value) {
    if (value != null && !value.isBlank()) {
      parts.add(value.trim());
    }
  }

  private record RegionInfo(String q0, String q1, String description) {
    static RegionInfo empty() {
      return new RegionInfo("", "", "");
    }
  }

  private record GeoPoint(double latitude, double longitude) {
    static GeoPoint empty() {
      return new GeoPoint(Double.NaN, Double.NaN);
    }

    boolean valid() {
      return !Double.isNaN(latitude) && !Double.isNaN(longitude);
    }
  }

  private record HospitalCandidate(
      String name,
      String meta,
      boolean emergency,
      boolean hospitalLike,
      String address,
      String hours,
      String phone,
      String distance,
      String directionQuery,
      String reserveQuery,
      double distanceMeters,
      double latitude,
      double longitude,
      String tone,
      String source,
      int score) {
    HospitalCandidate withEmergencyTone() {
      return new HospitalCandidate(
          name,
          meta,
          true,
          hospitalLike,
          address,
          hours,
          phone,
          distance,
          directionQuery,
          reserveQuery,
          distanceMeters,
          latitude,
          longitude,
          "danger",
          source,
          score + 20);
    }

    HospitalCandidate withDistance(double distanceMeters, double latitude, double longitude) {
      return new HospitalCandidate(
          name,
          buildMeta(distanceMeters, address, hours),
          emergency,
          hospitalLike,
          address,
          hours,
          phone,
          formatDistance(distanceMeters),
          directionQuery,
          reserveQuery,
          distanceMeters,
          latitude,
          longitude,
          tone,
          source,
          score);
    }

    HospitalCandidate withAddress(String address) {
      return new HospitalCandidate(
          name,
          buildMeta(distanceMeters, address, hours),
          emergency,
          hospitalLike,
          address,
          hours,
          phone,
          distance,
          directionQuery,
          reserveQuery,
          distanceMeters,
          latitude,
          longitude,
          tone,
          source,
          score);
    }

    HospitalCardResponse toCard() {
      return new HospitalCardResponse(
          name,
          meta,
          tone == null ? (emergency ? "danger" : "normal") : tone,
          address,
          hours,
          phone,
          distance,
          directionQuery,
          reserveQuery);
    }
  }

  private static String buildMeta(double distanceMeters, String address, String hours) {
    String distance = Double.isNaN(distanceMeters) ? "distance unavailable" : NearbyHospitalService.formatDistance(distanceMeters);
    return distance + " · " + (address == null || address.isBlank() ? "address unavailable" : address) + " · " + hours;
  }

  private static String formatDistance(double meters) {
    if (meters < 1000) {
      return Math.round(meters) + "m";
    }
    return String.format(Locale.US, "%.1fkm", meters / 1000.0);
  }

  private static double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
    final double earthRadius = 6_371_000.0;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
