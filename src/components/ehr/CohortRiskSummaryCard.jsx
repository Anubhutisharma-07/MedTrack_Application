import React from 'react';
import { Users, TrendingUp, AlertTriangle, Activity } from 'lucide-react';

export const CohortRiskSummaryCard = ({ cohortName, patientCount, riskScore, trend }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{cohortName}</span>
        <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <Users className="w-4 h-4" />
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold text-white">{patientCount.toLocaleString()} Patients</p>
        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> {trend}
        </span>
      </div>
      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs flex justify-between">
        <span className="text-slate-400">Predicted 30-Day Readmission Risk:</span>
        <span className="text-indigo-400 font-bold">{riskScore}%</span>
      </div>
    </div>
  );
};

export default CohortRiskSummaryCard;
