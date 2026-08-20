import { getClinicalCriticality } from './ClinicalCriticalityService';
import { triggerPlaybook } from './SoarService';

/**
 * Computational Behavioral Risk Scoring Engine (CBRSE)
 * 
 * Computes a dynamic risk score based on software/application telemetry,
 * evaluating technician access patterns, workflow velocities, and context deviations.
 */

// Behavioral feature weights
const WEIGHTS = {
  W_TIME: 0.30,      // Weight for accessing outside normal shift hours
  W_VELOCITY: 0.40,  // Weight for anomalous action velocity (e.g., bulk approvals)
  W_CONTEXT: 0.30    // Weight for unusual IP/Location access
};

/**
 * The core CBRS algorithm to calculate the Computational Behavioral Risk Score
 * @param {Object} telemetry 
 * @param {string} telemetry.deviceType - e.g., "Infusion Pump", "MRI"
 * @param {number} telemetry.timeDeviation - Score 0-100 indicating out-of-shift access severity
 * @param {number} telemetry.velocityDeviation - Score 0-100 indicating impossibly fast workflows
 * @param {number} telemetry.contextDeviation - Score 0-100 indicating unusual network/location context
 * @returns {Object} { score: number, decision: string, breakdown: Object }
 */
export const calculateCBRS = (telemetry) => {
  const { 
    deviceType, 
    timeDeviation = 0, 
    velocityDeviation = 0, 
    contextDeviation = 0 
  } = telemetry;

  // 1. Clinical Impact Multiplier (C_impact)
  const cImpact = getClinicalCriticality(deviceType);

  // 2. Base Behavioral Deviation
  const baseDeviation = 
    (WEIGHTS.W_TIME * timeDeviation) + 
    (WEIGHTS.W_VELOCITY * velocityDeviation) + 
    (WEIGHTS.W_CONTEXT * contextDeviation);

  // 3. Mathematical Fusion: Apply equipment impact multiplier
  // CBRS = sum(weights * deviations) * (1 + (C_impact - 1))  --> simplifies to multiplying by C_impact
  let cbrs = baseDeviation * cImpact;

  // Cap score at 100
  cbrs = Math.min(100, Math.max(0, cbrs));
  
  // 4. Policy Decision Matrix
  let decision = "NORMAL_ACCESS";
  let action = "Allow Session";
  
  if (cbrs >= 85) {
    decision = "REVOKE_SESSION";
    action = "Block & Terminate";
    // Trigger automated SOAR response for insider threat containment. SoarService
    // exposes this as triggerPlaybook with a { playbookId, triggerSource,
    // affectedResource } payload (POST /api/auth/soar/execute); the previous
    // executeSoarPlaybook(name, data) shape was dropped in a service refactor,
    // which left this import missing and broke the production build.
    triggerPlaybook({
      playbookId: "insider_threat_containment",
      triggerSource: "SIEM_ALERT",
      affectedResource: deviceType,
    });
  } else if (cbrs >= 60) {
    decision = "STEP_UP_AUTH";
    action = "Require MFA Challenge";
  } else if (cbrs >= 30) {
    decision = "RESTRICTED";
    action = "Read-Only Workflow";
  }

  return {
    score: Math.round(cbrs * 10) / 10,
    decision,
    action,
    breakdown: {
      clinicalImpact: cImpact,
      baseDeviation: Math.round(baseDeviation * 10) / 10,
      timeDeviation,
      velocityDeviation,
      contextDeviation
    }
  };
};
