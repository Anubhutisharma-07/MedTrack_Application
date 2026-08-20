package com.medtrack.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai-assistant")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AiAssistantController {

    @PostMapping("/chat")
    public ResponseEntity<String> chat(@RequestBody String prompt) {
        // Proxy to Python service would go here.
        return ResponseEntity.ok("AI Assistant Response");
    }
}
