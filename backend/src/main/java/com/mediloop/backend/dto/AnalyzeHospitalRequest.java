package com.mediloop.backend.dto;

import jakarta.validation.constraints.Size;

public record AnalyzeHospitalRequest(
    @Size(max = 5000) String symptomText,
    @Size(max = 5000) String conditionText,
    String imageBase64,
    String imageMimeType,
    Double latitude,
    Double longitude) {
}
