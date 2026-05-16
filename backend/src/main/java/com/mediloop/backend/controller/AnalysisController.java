package com.mediloop.backend.controller;

import com.mediloop.backend.dto.AnalyzeHospitalRequest;
import com.mediloop.backend.dto.AnalyzeFillBagRequest;
import com.mediloop.backend.dto.AnalyzeHomeRequest;
import com.mediloop.backend.dto.AnalysisResponse;
import com.mediloop.backend.dto.FillBagAnalysisResponse;
import com.mediloop.backend.dto.LocationRequest;
import com.mediloop.backend.service.AnalysisService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AnalysisController {
  private final AnalysisService analysisService;

  public AnalysisController(AnalysisService analysisService) {
    this.analysisService = analysisService;
  }

  @PostMapping("/home/analyze")
  public AnalysisResponse analyzeHome(@Valid @RequestBody AnalyzeHomeRequest request) {
    return analysisService.analyzeHome(request);
  }

  @PostMapping("/hospital/analyze")
  public AnalysisResponse analyzeHospital(@Valid @RequestBody AnalyzeHospitalRequest request) {
    return analysisService.analyzeHospital(request);
  }

  @PostMapping("/fillbag/analyze")
  public FillBagAnalysisResponse analyzeFillBag(@Valid @RequestBody AnalyzeFillBagRequest request) {
    return analysisService.analyzeFillBag(request);
  }

  @PostMapping("/location/recommend")
  public AnalysisResponse recommendByLocation(@Valid @RequestBody LocationRequest request) {
    return analysisService.recommendByLocation(request);
  }
}
