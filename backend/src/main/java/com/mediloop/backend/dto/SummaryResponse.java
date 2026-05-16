package com.mediloop.backend.dto;

import java.util.List;

public record SummaryResponse(
    String topDisease,
    int confidence,
    String subtitle,
    String advice,
    List<DiseaseScoreResponse> diseases) {
}
