package com.mediloop.backend.dto;

import java.util.List;

public record FillBagAnalysisResponse(
    List<String> recommendedHabits,
    List<String> avoidFoods,
    String criticalWarning,
    String aiSummary) {
}
