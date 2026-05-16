package com.mediloop.backend.dto;

import jakarta.validation.constraints.Size;

public record AnalyzeFillBagRequest(
    @Size(max = 5000) String doctorNote,
    String imageBase64,
    String imageMimeType) {
}
