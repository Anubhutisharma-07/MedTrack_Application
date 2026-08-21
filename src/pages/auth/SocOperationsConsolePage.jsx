import React from "react";
import SocOperationsConsolePanel from "../../components/auth/SocOperationsConsolePanel";
import { buildHref } from "../../routes/routeRegistry";
import { ArrowLeft, Radio, Shield } from "lucide-react";
import "./auth.css";

/**
 * SocOperationsConsolePage Component
 *
 * Standalone Security Operations Center (SOC) Command Console Page for MedTrack.
 */
export default function SocOperationsConsolePage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate ? onNavigate("dashboard") : (window.location.href = buildHref("dashboard"))}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Application Dashboard
          </button>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-sky-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              UNIFIED SOC COMMAND HUB
            </span>
            <span>•</span>
            <span className="font-mono font-bold text-emerald-400">NIST SP 800-61 / ISO 27035</span>
          </div>
        </div>

        {/* Main SOC Console Panel */}
        <SocOperationsConsolePanel />

      </div>
    </div>
  );
}
