package com.mediloop.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
public class OpenAiChatClient {
  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(15))
      .build();
  private final ObjectMapper objectMapper;
  private final String apiKey;
  private final String baseUrl;

  public OpenAiChatClient(
      ObjectMapper objectMapper,
      @Value("${openai.api-key:}") String apiKey,
      @Value("${openai.base-url:https://api.openai.com/v1}") String baseUrl) {
    this.objectMapper = objectMapper;
    this.apiKey = apiKey == null ? "" : apiKey.trim();
    this.baseUrl = baseUrl;
  }

  public String requestJson(String model, String prompt) throws Exception {
    return requestJson(model, prompt, null, null);
  }

  public String requestJson(String model, String prompt, String imageBase64, String imageMimeType) throws Exception {
    if (apiKey.isBlank()) {
      throw new IllegalStateException("OpenAI API key is empty");
    }

    Object userContent;
    if (imageBase64 != null && !imageBase64.isBlank()) {
      String mimeType = (imageMimeType == null || imageMimeType.isBlank()) ? "image/jpeg" : imageMimeType.trim();
      userContent = List.of(
          Map.of(
              "type", "text",
              "text", prompt),
          Map.of(
              "type", "image_url",
              "image_url", Map.of(
                  "url", "data:" + mimeType + ";base64," + imageBase64)));
    } else {
      userContent = prompt;
    }

    Map<String, Object> payload = Map.of(
        "model", model,
        "temperature", 0.2,
        "response_format", Map.of("type", "json_object"),
        "messages", List.of(
            Map.of(
                "role", "system",
                "content", "You are MediLoop's medical triage assistant. Return only valid JSON, no markdown."),
            Map.of(
                "role", "user",
                "content", userContent)));

    String body = objectMapper.writeValueAsString(payload);
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(baseUrl + "/chat/completions"))
        .timeout(Duration.ofSeconds(30))
        .header("Authorization", "Bearer " + apiKey)
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
        .build();

    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
    if (response.statusCode() >= 300) {
      throw new IllegalStateException("OpenAI error: " + response.statusCode() + " " + response.body());
    }

    JsonNode root = objectMapper.readTree(response.body());
    JsonNode content = root.path("choices").path(0).path("message").path("content");
    if (content.isMissingNode() || content.asText().isBlank()) {
      throw new IllegalStateException("OpenAI response missing content");
    }
    return content.asText();
  }
}
