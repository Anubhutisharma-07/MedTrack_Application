import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Activity, AlertTriangle, Cpu, Wrench, Shield, ArrowRight, Clock, Zap, MapPin } from 'lucide-react';
import { calculateCBRS } from '../../services/DynamicRiskScoringService';
import { getClinicalCriticality } from '../../services/ClinicalCriticalityService';

export default function DynamicRiskDashboard() {
  const [simulatorConfig, setSimulatorConfig] = useState({
    deviceType: 'MRI',
    timeDeviation: 0,
    velocityDeviation: 0,
    contextDeviation: 0
  });

  const [result, setResult] = useState(null);

  useEffect(() => {
    const calcResult = calculateCBRS(simulatorConfig);
    setResult(calcResult);
  }, [simulatorConfig]);

  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    setSimulatorConfig(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleDeviceChange = (e) => {
    setSimulatorConfig(prev => ({ ...prev, deviceType: e.target.value }));
  };

  if (!result) return null;

  const getDecisionColor = (decision) => {
    switch(decision) {
      case 'NORMAL_ACCESS': return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
      case 'RESTRICTED': return 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20';
      case 'STEP_UP_AUTH': return 'text-orange-400 bg-orange-400/10 border-orange-500/20';
      case 'REVOKE_SESSION': return 'text-red-400 bg-red-400/10 border-red-500/20 animate-pulse';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
            <Shield className="text-blue-500" />
            Behavioral Analytics Risk Engine
          </h1>
          <p className="text-slate-400 max-w-3xl">
            This dashboard demonstrates the Computational Behavioral Risk Score (CBRS) model.
            Adjust the software telemetry variables below to see how operational deviations (like rapid bulk configurations)
            impact the real-time access policy.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls / Inputs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Cpu size={20} className="text-indigo-400" />
                Software Telemetry
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target Equipment (Clinical Impact)</label>
                  <select 
                    value={simulatorConfig.deviceType}
                    onChange={handleDeviceChange}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                  >
                    <option value="Ventilator">Ventilator (Life-Support, Impact = 1.5x)</option>
                    <option value="Infusion Pump">Infusion Pump (Critical Monitor, Impact = 1.2x)</option>
                    <option value="MRI">MRI Scanner (Diagnostic, Impact = 1.0x)</option>
                    <option value="Hospital Bed">Smart Hospital Bed (General, Impact = 0.8x)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Clock size={16} className="text-amber-400"/> Time-of-Day Deviation
                    </label>
                    <span className="text-amber-400 font-mono">{simulatorConfig.timeDeviation}%</span>
                  </div>
                  <input 
                    type="range" name="timeDeviation" 
                    min="0" max="100" value={simulatorConfig.timeDeviation} onChange={handleSliderChange}
                    className="w-full accent-amber-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Severity of off-hours access (e.g. 3 AM login)</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Zap size={16} className="text-rose-400"/> Configuration Velocity
                    </label>
                    <span className="text-rose-400 font-mono">{simulatorConfig.velocityDeviation}%</span>
                  </div>
                  <input 
                    type="range" name="velocityDeviation" 
                    min="0" max="100" value={simulatorConfig.velocityDeviation} onChange={handleSliderChange}
                    className="w-full accent-rose-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Speed of data modification (e.g. 50 changes/sec)</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <MapPin size={16} className="text-fuchsia-400"/> Location / Context Anomaly
                    </label>
                    <span className="text-fuchsia-400 font-mono">{simulatorConfig.contextDeviation}%</span>
                  </div>
                  <input 
                    type="range" name="contextDeviation" 
                    min="0" max="100" value={simulatorConfig.contextDeviation} onChange={handleSliderChange}
                    className="w-full accent-fuchsia-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Accessing from unusual IPs or remote subnets</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results / Mathematics */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Score Card */}
            <div className={`bg-slate-800 rounded-2xl p-8 border-2 shadow-2xl transition-all duration-300 ${getDecisionColor(result.decision)}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium opacity-80 uppercase tracking-wider">Behavioral Risk Score</h3>
                  <div className="text-6xl font-black mt-2 font-mono">
                    {result.score.toFixed(1)} <span className="text-2xl opacity-50">/ 100</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm uppercase tracking-widest opacity-70 mb-1">Policy Enforcement</div>
                  <div className="text-2xl font-bold">{result.action}</div>
                  <div className="text-sm opacity-80 mt-1 font-mono">STATE: {result.decision}</div>
                </div>
              </div>
              
              {result.decision === 'REVOKE_SESSION' && (
                <div className="mt-6 bg-red-900/40 p-4 rounded-lg flex items-start gap-3 border border-red-500/30">
                  <AlertTriangle className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">
                    <strong>Insider Threat Detected!</strong> Session revoked immediately. The combined velocity and temporal deviations indicate a high probability of compromised credentials.
                  </p>
                </div>
              )}
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                <div className="text-slate-400 text-sm mb-1 uppercase tracking-wide">Base Deviation ($\Delta$)</div>
                <div className="text-2xl font-bold font-mono text-amber-300">{result.breakdown.baseDeviation.toFixed(1)}</div>
                <p className="text-xs text-slate-500 mt-2">Weighted sum of telemetry anomalies</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                <div className="text-slate-400 text-sm mb-1 uppercase tracking-wide">C-Impact (Clinical Multiplier)</div>
                <div className="text-2xl font-bold font-mono text-blue-300">{result.breakdown.clinicalImpact}x</div>
                <p className="text-xs text-slate-500 mt-2">Based on target equipment risk</p>
              </div>
            </div>

            {/* Math Explanation */}
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30 text-sm text-slate-400 font-mono">
              <h4 className="text-slate-300 font-bold mb-3 flex items-center gap-2">
                <Activity size={16} /> Formula Execution Trace
              </h4>
              <p>CBRS = C_impact * ((W_time * $\Delta_t$) + (W_vel * $\Delta_v$) + (W_ctx * $\Delta_c$))</p>
              <div className="my-2 border-l-2 border-slate-700 pl-4 space-y-1">
                <p>W_time = 0.30, W_vel = 0.40, W_ctx = 0.30</p>
                <p>CBRS = {result.breakdown.clinicalImpact} * ((0.30 * {result.breakdown.timeDeviation}) + (0.40 * {result.breakdown.velocityDeviation}) + (0.30 * {result.breakdown.contextDeviation}))</p>
              </div>
              <p className="text-blue-400 flex items-center gap-1">
                <ArrowRight size={14} /> Result = {result.score.toFixed(2)}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
