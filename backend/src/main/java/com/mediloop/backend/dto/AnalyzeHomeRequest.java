package com.mediloop.backend.dto;

import jakarta.validation.constraints.Size;

public record AnalyzeHomeRequest(
    @Size(max = 5000) String symptomText,
    boolean hasPhoto,
    String imageBase64,
    String imageMimeType,
    Double latitude,
    Double longitude) {
}
