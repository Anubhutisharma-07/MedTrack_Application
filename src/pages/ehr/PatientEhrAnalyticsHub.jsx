import React, { useState, useMemo } from 'react';
import {
  Activity,
  Users,
  Search,
  Filter,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Database,
  BarChart3,
  Calendar,
  Sparkles,
  Zap,
  Sliders,
  XCircle,
  Eye,
  Layers,
  Heart,
  Stethoscope,
  Clock,
  ShieldCheck,
  RefreshCw,
  Share2,
  ChevronRight,
  UserCheck,
  Brain,
  Microscope,
  Terminal,
  Layers3,
  HelpCircle,
  Settings,
  FileCode,
  ShieldAlert,
  HardDrive
} from 'lucide-react';
import CohortRiskSummaryCard from '../../components/ehr/CohortRiskSummaryCard';
import LongitudinalTimelineNode from '../../components/ehr/LongitudinalTimelineNode';

const PatientEhrAnalyticsHub = () => {
  const [activeTab, setActiveTab] = useState('longitudinal');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [riskThreshold, setRiskThreshold] = useState(20);

  const [cohortsData, setCohortsData] = useState([
    { cohortName: 'Type 2 Diabetes Cohort', patientCount: 3420, riskScore: 18.4, trend: '-2.1%' },
    { cohortName: 'Heart Failure Stage II/III', patientCount: 1280, riskScore: 34.2, trend: '-1.4%' },
    { cohortName: 'Post-Op Surgical Followup', patientCount: 890, riskScore: 12.8, trend: '-4.8%' },
    { cohortName: 'Chronic Kidney Disease Stage 3', patientCount: 640, riskScore: 28.9, trend: '+0.4%' }
  ]);

  const [patients, setPatients] = useState([
    {
      id: 'PT-88219',
      name: 'Eleanor Vance',
      age: 64,
      gender: 'Female',
      primaryDx: 'Non-Small Cell Lung Cancer',
      readmissionRisk: 'Critical (42%)',
      lastVisit: '2026-08-14',
      attendingPhysician: 'Dr. Aris Thorne',
      bmi: '24.2',
      bpHistory: '138/84 mmHg',
      primaryLabs: 'Troponin I: 0.04 ng/mL, HbA1c: 6.8%',
      timelineEvents: [
        { date: '2026-08-14', title: 'Oncology Follow-up Consult', details: 'CT Thorax revealed stable focal opacity right upper lobe (2.4cm). Spiculation monitored.', provider: 'Dr. Aris Thorne', category: 'Outpatient' },
        { date: '2026-06-20', title: 'Chemotherapy Cycle #4 Administered', details: 'Infusion completed without hypersensitivity reactions. ANC within target window.', provider: 'Dr. Elena Rostova', category: 'Infusion' },
        { date: '2026-04-10', title: 'Initial PET-CT Staging Scan', details: 'Focal FDG avidity noted in right hilar node. No distal metastases.', provider: 'Dr. Marcus Holloway', category: 'Radiology' }
      ]
    },
    {
      id: 'PT-41023',
      name: 'Marcus Holloway',
      age: 42,
      gender: 'Male',
      primaryDx: 'Paroxysmal Atrial Fibrillation',
      readmissionRisk: 'Moderate (18%)',
      lastVisit: '2026-08-16',
      attendingPhysician: 'Dr. Sarah Connor',
      bmi: '27.8',
      bpHistory: '142/90 mmHg',
      primaryLabs: 'BNP: 180 pg/mL, INR: 2.3',
      timelineEvents: [
        { date: '2026-08-16', title: 'ECG 12-Lead Holter Sync', details: 'Paroxysmal AFib episode resolved spontaneously after 14 mins. Rate controlled.', provider: 'Dr. Sarah Connor', category: 'Telemetry' },
        { date: '2026-05-12', title: 'Cardiology Medication Adjustment', details: 'Increased Flecainide to 100mg BID. Continued Apixaban 5mg BID.', provider: 'Dr. Sarah Connor', category: 'Outpatient' }
      ]
    },
    {
      id: 'PT-19204',
      name: 'Sophia Rodriguez',
      age: 29,
      gender: 'Female',
      primaryDx: 'Multiple Sclerosis (RRMS)',
      readmissionRisk: 'Low (6%)',
      lastVisit: '2026-08-10',
      attendingPhysician: 'Dr. Marcus Holloway',
      bmi: '21.5',
      bpHistory: '118/74 mmHg',
      primaryLabs: 'CSF Oligoclonal Bands: Positive',
      timelineEvents: [
        { date: '2026-08-10', title: 'Brain MRI T2-FLAIR Evaluation', details: 'No new active demyelinating lesions detected. Disease stability confirmed.', provider: 'Dr. Marcus Holloway', category: 'Neurology' }
      ]
    }
  ]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.primaryDx.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.attendingPhysician.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRisk =
        riskFilter === 'all' || p.readmissionRisk.toLowerCase().includes(riskFilter.toLowerCase());

      return matchesSearch && matchesRisk;
    });
  }, [patients, searchTerm, riskFilter]);

  const handleRecalculateRisk = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setIsRecalculating(false);
      alert('ML Risk Profiler Executed: Evaluated 14,200 longitudinal clinical telemetry points across active EHR cohorts.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Patient EHR Analytics & Population Risk Profiler
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                Predictive Risk Engine v4.8
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Longitudinal patient health timelines, ML-driven 30-day readmission scoring & population disease cohort stratifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRecalculateRisk}
            disabled={isRecalculating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Recalculating Risk Models...' : 'Recalculate ML Risk Profiles'}
          </button>
        </div>
      </div>

      {/* Cohort Summary Cards Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        {cohortsData.map((c, idx) => (
          <CohortRiskSummaryCard key={idx} {...c} />
        ))}
      </div>

      {/* Analytics Tabs */}
      <div className="flex border-b border-slate-800 gap-6 mb-6">
        <button
          onClick={() => setActiveTab('longitudinal')}
          className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
            activeTab === 'longitudinal'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Longitudinal Health Timelines
        </button>
        <button
          onClick={() => setActiveTab('cohorts')}
          className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
            activeTab === 'cohorts'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Population Cohort Matrix
        </button>
      </div>

      {activeTab === 'longitudinal' && (
        <div className="space-y-6">
          {/* Search & Controls */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search patient, ID, diagnosis or physician..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Risk Level:</span>
                <select
                  value={riskFilter}
                  onChange={e => setRiskFilter(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="critical">Critical Risk</option>
                  <option value="moderate">Moderate Risk</option>
                  <option value="low">Low Risk</option>
                </select>
              </div>
            </div>
          </div>

          {/* Patients Longitudinal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map(p => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-lg transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-lg">{p.name} ({p.age} {p.gender})</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{p.id} • {p.primaryDx}</p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                      p.readmissionRisk.includes('Critical')
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : p.readmissionRisk.includes('Moderate')
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    {p.readmissionRisk}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Attending Doctor:</span>
                    <span className="text-slate-200 font-medium">{p.attendingPhysician}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>BMI Baseline:</span>
                    <span className="text-slate-200 font-mono">{p.bmi}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Recent BP:</span>
                    <span className="text-slate-200 font-mono">{p.bpHistory}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Longitudinal Medical Events</h4>
                  {p.timelineEvents.map((evt, idx) => (
                    <LongitudinalTimelineNode key={idx} {...evt} />
                  ))}
                </div>

                <button
                  onClick={() => setSelectedPatient(p)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-700"
                >
                  Inspect Full Predictive Payload
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'cohorts' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Cohort Name</th>
                <th className="px-6 py-4">Enrolled Population</th>
                <th className="px-6 py-4">30-Day Readmission Risk</th>
                <th className="px-6 py-4">Risk Trend</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {cohortsData.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{c.cohortName}</td>
                  <td className="px-6 py-4 font-mono text-slate-300">{c.patientCount.toLocaleString()} Patients</td>
                  <td className="px-6 py-4 font-mono text-indigo-400 font-semibold">{c.riskScore}%</td>
                  <td className="px-6 py-4 font-mono text-emerald-400 text-xs">{c.trend}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-all">
                      Export Cohort Data
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Popup */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  Predictive EHR Payload: {selectedPatient.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1">Patient Record: {selectedPatient.id}</p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-slate-400">Primary Diagnosis: <strong className="text-slate-200">{selectedPatient.primaryDx}</strong></p>
              <p className="text-slate-400">Primary Labs: <strong className="text-indigo-300">{selectedPatient.primaryLabs}</strong></p>
              <p className="text-slate-400">Attending Physician: <strong className="text-slate-200">{selectedPatient.attendingPhysician}</strong></p>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-sm font-medium"
              >
                Close Payload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientEhrAnalyticsHub;
