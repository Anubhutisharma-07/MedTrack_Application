import React from 'react';
import { Activity, Clock, ShieldCheck } from 'lucide-react';

export const LongitudinalTimelineNode = ({ date, title, details, provider, category }) => {
  return (
    <div className="flex gap-4 items-start relative pl-6 border-l-2 border-slate-800 pb-6">
      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-2 border-slate-950" />
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono text-indigo-400">{date}</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">{category}</span>
        </div>
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800">{details}</p>
        <p className="text-[11px] text-slate-400">Attending: {provider}</p>
      </div>
    </div>
  );
};

export default LongitudinalTimelineNode;
