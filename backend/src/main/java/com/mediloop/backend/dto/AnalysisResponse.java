package com.mediloop.backend.dto;

import java.util.List;

public record AnalysisResponse(
    SummaryResponse summary,
    List<HospitalCardResponse> hospitals,
    HospitalCardResponse emergencyHospital) {
}
