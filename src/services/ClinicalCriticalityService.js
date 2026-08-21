/**
 * Clinical Criticality Engine (CCE)
 * 
 * Part of the LA-RAZT Research Framework.
 * This service maps medical device categories to a mathematical "Clinical Criticality Multiplier" (Ccrit).
 * It classifies devices based on their immediate impact on human life and patient safety.
 */

export const DEVICE_CRITICALITY_TIERS = {
  LIFE_SUPPORT: {
    multiplier: 1.5,
    description: "Devices whose failure directly and immediately threatens patient life.",
    categories: ["Ventilator", "Defibrillator", "Pacemaker", "Anesthesia Machine"]
  },
  CRITICAL_MONITORING: {
    multiplier: 1.2,
    description: "Devices that monitor critical patient vitals or deliver automated care.",
    categories: ["Infusion Pump", "Patient Monitor", "Fetal Monitor", "ECG Machine"]
  },
  DIAGNOSTIC_IMAGING: {
    multiplier: 1.0,
    description: "High-value diagnostic tools where failure delays care but isn't immediately fatal.",
    categories: ["MRI", "CT Scanner", "X-Ray", "Ultrasound"]
  },
  GENERAL_CLINICAL: {
    multiplier: 0.8,
    description: "General clinical devices used for routine care and diagnostics.",
    categories: ["Thermometer", "Blood Pressure Monitor", "Pulse Oximeter", "Hospital Bed"]
  },
  NON_CLINICAL: {
    multiplier: 0.5,
    description: "Devices not directly involved in patient care (IT, HVAC, administrative).",
    categories: ["Workstation", "HVAC Sensor", "Printer", "Network Switch"]
  }
};

/**
 * Calculates the C_crit multiplier for a given device type.
 * @param {string} deviceType - The category or type of the biomedical device.
 * @returns {number} The criticality multiplier (0.5 to 1.5)
 */
export const getClinicalCriticality = (deviceType) => {
  if (!deviceType) return 1.0; // Default to neutral multiplier
  
  for (const [tier, data] of Object.entries(DEVICE_CRITICALITY_TIERS)) {
    if (data.categories.some(cat => deviceType.toLowerCase().includes(cat.toLowerCase()))) {
      return data.multiplier;
    }
  }
  
  // Default for unknown clinical devices
  return 1.0; 
};

export const getAllCriticalityTiers = () => {
  return Object.values(DEVICE_CRITICALITY_TIERS);
};
