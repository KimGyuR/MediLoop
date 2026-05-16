package com.mediloop.backend.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DownloadController {

  @GetMapping("/api/download/apk")
  public ResponseEntity<Resource> downloadApk() {
    ClassPathResource resource = new ClassPathResource("static/apk/mediloop-debug.apk");
    if (!resource.exists()) {
      return ResponseEntity.notFound().build();
    }

    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("application/vnd.android.package-archive"))
        .header(HttpHeaders.CONTENT_DISPOSITION,
            ContentDisposition.attachment().filename("mediloop-debug.apk").build().toString())
        .body(resource);
  }
}
