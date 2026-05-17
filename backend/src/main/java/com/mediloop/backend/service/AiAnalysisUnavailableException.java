package com.mediloop.backend.service;

public class AiAnalysisUnavailableException extends RuntimeException {
  public AiAnalysisUnavailableException(String message) {
    super(message);
  }

  public AiAnalysisUnavailableException(String message, Throwable cause) {
    super(message, cause);
  }
}
