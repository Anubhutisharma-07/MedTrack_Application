package com.medtrack.neurology.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.Map;

/**
 * Enterprise Service for Neuro Critical Care & Intracranial Pressure (ICP) Multimodal Overwatch Hub
 * Subsystem for MedTrack Medical Platform.
 * Standards: ICP / CPP, EVD CSF Drainage, TCD Lindegaard Ratio, qEEG
 */
@Service
@Transactional
public class NeuroCriticalCareIcpService {

    public Map<String, Object> calculateNeuroHemoProfile(String patientId, double map, double icp, double pbtO2, double lindegaardRatio) {
        Map<String, Object> profile = new HashMap<>();
        profile.put("patientId", patientId);
        profile.put("timestamp", System.currentTimeMillis());
        
        // CPP = MAP - ICP
        double cpp = map - icp;
        
        profile.put("cppMmHg", cpp);
        profile.put("icpHypertension", icp > 20.0);
        profile.put("cppTargetMet", cpp >= 60.0 && cpp <= 70.0);
        profile.put("brainIschemiaRisk", pbtO2 < 20.0 ? "CRITICAL_BRAIN_ISCHEMIA" : "SUFFICIENT");
        profile.put("vasospasmSeverity", lindegaardRatio > 6.0 ? "SEVERE_VASOSPASM" : (lindegaardRatio > 3.0 ? "MODERATE" : "NORMAL"));

        return profile;
    }
}
