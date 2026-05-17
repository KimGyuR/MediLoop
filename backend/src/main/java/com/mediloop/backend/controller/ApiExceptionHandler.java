package com.mediloop.backend.controller;

import com.mediloop.backend.service.AiAnalysisUnavailableException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(AiAnalysisUnavailableException.class)
  public ResponseEntity<Map<String, Object>> handleAiAnalysisUnavailable(AiAnalysisUnavailableException ex) {
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
        .body(Map.of(
            "error", "AI_ANALYSIS_UNAVAILABLE",
            "message", ex.getMessage()));
  }
}
