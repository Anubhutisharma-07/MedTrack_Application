package com.medtrack.triage;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

/**
 * Controller exposing the Triage endpoints.
 */
@RestController
@RequestMapping("/api/triage")
public class TriageController {
    
    @Autowired
    private ClinicalTriageService triageService;
    
    @PostMapping("/summarize")
    public ResponseEntity<TriageDTO.TriageResponse> summarizePatientIntake(@RequestBody TriageDTO request) {
        if (request.getRawClinicalText() == null || request.getRawClinicalText().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            TriageDTO.TriageResponse response = triageService.processTriage(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Triage LLM Service is operational.");
    }
}
