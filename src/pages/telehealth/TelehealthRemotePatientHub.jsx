import React, { useState, useEffect, useMemo } from 'react';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Activity,
  Heart,
  Thermometer,
  ShieldCheck,
  Search,
  Filter,
  Users,
  MessageSquare,
  Share2,
  Settings,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Sliders,
  Maximize2,
  Minimize2,
  Radio,
  Clock,
  FileText
} from 'lucide-react';

const TelehealthRemotePatientHub = () => {
  const [activeTab, setActiveTab] = useState('live_consult');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [activeConsultations, setActiveConsultations] = useState([
    {
      id: 'TELE-901',
      patientName: 'Clara Oswald',
      patientId: 'PT-9921',
      age: 44,
      physicianName: 'Dr. Sarah Connor',
      specialty: 'Cardiology',
      vitals: { hr: 78, bp: '122/80', spo2: 98, temp: 36.9 },
      sessionStatus: 'ACTIVE_WEBRTC',
      duration: '14:22',
      riskScore: 'Low Risk',
      remoteDeviceMesh: '4 Sensors Paired (Apple Health / Wearable)',
      encryption: 'End-to-End AES-256'
    },
    {
      id: 'TELE-902',
      patientName: 'George Hammond',
      patientId: 'PT-4102',
      age: 69,
      physicianName: 'Dr. Aris Thorne',
      specialty: 'Pulmonology',
      vitals: { hr: 92, bp: '138/88', spo2: 93, temp: 37.4 },
      sessionStatus: 'ACTIVE_WEBRTC',
      duration: '06:15',
      riskScore: 'Moderate Alert',
      remoteDeviceMesh: '3 Sensors Paired (Pulse Oximeter IoT)',
      encryption: 'End-to-End AES-256'
    },
    {
      id: 'TELE-903',
      patientName: 'Hannah Abbott',
      patientId: 'PT-1039',
      age: 31,
      physicianName: 'Dr. Marcus Holloway',
      specialty: 'Neurology',
      vitals: { hr: 64, bp: '118/74', spo2: 99, temp: 36.6 },
      sessionStatus: 'WAITING_ROOM',
      duration: '00:00',
      riskScore: 'Low Risk',
      remoteDeviceMesh: '2 Sensors Paired',
      encryption: 'End-to-End AES-256'
    }
  ]);

  const filteredConsultations = useMemo(() => {
    return activeConsultations.filter(c => {
      const matchesSearch =
        c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.physicianName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || c.sessionStatus.toLowerCase().includes(statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [activeConsultations, searchTerm, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-600/20 rounded-xl border border-teal-500/30 text-teal-400">
            <Video className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Telehealth & Remote Patient Management Hub
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-medium">
                WebRTC E2EE Encrypted
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Encrypted HD video consult overwatch, remote wearable vital sensor telemetry streams & AI clinical transcript synthesis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-teal-600/20">
            <Radio className="w-4 h-4" />
            Launch Virtual Waiting Room
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Video Consults</p>
            <p className="text-2xl font-bold text-white mt-1">2 Active Sessions</p>
            <span className="text-xs text-teal-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> WebRTC E2EE Secure
            </span>
          </div>
          <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg">
            <Video className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Remote Wearable Mesh</p>
            <p className="text-2xl font-bold text-white mt-1">384 Wearables</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <Activity className="w-3 h-3" /> Realtime Vitals Streaming
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Heart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Waiting Room Queue</p>
            <p className="text-2xl font-bold text-white mt-1">1 Patient</p>
            <span className="text-xs text-amber-400 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" /> Avg Wait Time 1.2 mins
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">AI Clinical Summaries</p>
            <p className="text-2xl font-bold text-white mt-1">100% Generated</p>
            <span className="text-xs text-indigo-400 flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3" /> Auto EHR Transcript Sync
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl mb-6">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search patient, physician or consult ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active WebRTC</option>
              <option value="waiting">Waiting Room</option>
            </select>
          </div>
        </div>
      </div>

      {/* Consultations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredConsultations.map(c => (
          <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-teal-400 bg-teal-950/50 px-2 py-0.5 rounded border border-teal-800">
                {c.id}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  c.sessionStatus === 'ACTIVE_WEBRTC'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
              >
                {c.sessionStatus}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-white text-lg">{c.patientName} ({c.age} y/o)</h3>
              <p className="text-xs text-slate-400 mt-1">Physician: <strong className="text-slate-200">{c.physicianName}</strong> ({c.specialty})</p>
            </div>

            {/* Live Remote Vitals Card */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Heart Rate:</span>
                <span className="text-emerald-400 font-bold">{c.vitals.hr} BPM</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Blood Pressure:</span>
                <span className="text-slate-200 font-mono">{c.vitals.bp}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SpO2 Oxygen:</span>
                <span className="text-teal-400 font-bold">{c.vitals.spo2}%</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedSession(c)}
              className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-teal-600/20"
            >
              Enter Video Consultation Overwatch
            </button>
          </div>
        ))}
      </div>

      {/* Modal Video Consult Overwatch */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-teal-400" />
                  Live Consult Overwatch: {selectedSession.id}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{selectedSession.patientName} ↔ {selectedSession.physicianName}</p>
              </div>
              <button onClick={() => setSelectedSession(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Placeholder Frame */}
            <div className="relative bg-slate-950 rounded-xl border border-slate-800 h-64 flex items-center justify-center overflow-hidden">
              <div className="text-center space-y-2">
                <Radio className="w-10 h-10 text-teal-400 animate-pulse mx-auto" />
                <p className="text-sm font-semibold text-slate-200">WebRTC Encrypted Stream Active</p>
                <p className="text-xs text-slate-500">{selectedSession.encryption}</p>
              </div>

              <div className="absolute bottom-4 left-4 flex gap-2">
                <button
                  onClick={() => setIsAudioOn(!isAudioOn)}
                  className={`p-2 rounded-lg ${isAudioOn ? 'bg-slate-800 text-slate-200' : 'bg-rose-600 text-white'}`}
                >
                  {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-2 rounded-lg ${isVideoOn ? 'bg-slate-800 text-slate-200' : 'bg-rose-600 text-white'}`}
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-sm font-medium"
              >
                Close Stream
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelehealthRemotePatientHub;
