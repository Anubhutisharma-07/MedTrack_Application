package com.medtrack.emergency.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

/**
 * Enterprise Service for Emergency Triage & Mass Casualty Incident (MCI) Command Hub
 * Subsystem for MedTrack Medical Platform.
 * Standards: START / JumpSTART Triage, NIMS ICS-204, MTP 1:1:1 PRBC/FFP
 */
@Service
@Transactional
public class EmergencyTriageDisasterService {

    public Map<String, Object> calculateMassCasualtyTriageSummary(String incidentId, List<Map<String, Object>> patientList) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("incidentId", incidentId);
        summary.put("timestamp", System.currentTimeMillis());
        
        int redCount = 0;
        int yellowCount = 0;
        int greenCount = 0;
        int blackCount = 0;

        if (patientList != null) {
            for (Map<String, Object> p : patientList) {
                String tag = (String) p.getOrDefault("triageTag", "YELLOW");
                switch (tag) {
                    case "RED":
                        redCount++;
                        break;
                    case "YELLOW":
                        yellowCount++;
                        break;
                    case "GREEN":
                        greenCount++;
                        break;
                    case "BLACK":
                        blackCount++;
                        break;
                    default:
                        yellowCount++;
                }
            }
        }

        summary.put("totalPatients", patientList != null ? patientList.size() : 0);
        summary.put("triageRedCount", redCount);
        summary.put("triageYellowCount", yellowCount);
        summary.put("triageGreenCount", greenCount);
        summary.put("triageBlackCount", blackCount);
        summary.put("surgeStatus", redCount > 5 ? "CRITICAL_SURGE_CODE_RED" : "NORMAL_OPERATIONS");
        summary.put("mtpProtocolRecommended", redCount >= 3);

        return summary;
    }
}
