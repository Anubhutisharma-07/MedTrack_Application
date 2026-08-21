import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Brain,
  Cpu,
  Database,
  Search,
  Filter,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Sliders,
  ShieldCheck,
  Tag,
  Stethoscope,
  BookOpen,
  Activity,
  Terminal,
  Share2,
  RefreshCw,
  Clock,
  ExternalLink,
  Code,
  ShieldAlert,
  GitBranch,
  Settings,
  HelpCircle,
  Layers3
} from 'lucide-react';

const ClinicalNlpSubsystemHub = () => {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [ontologyFilter, setOntologyFilter] = useState('all');
  const [selectedNote, setSelectedNote] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [rawClinicalText, setRawClinicalText] = useState(
    'Patient is a 64-year-old female presenting with acute onset retrosternal chest tightness radiating to left arm. Past medical history significant for type 2 diabetes mellitus and dyslipidemia. Currently taking Metformin 1000mg BID and Atorvastatin 40mg daily. Troponin I elevated at 2.4 ng/mL.'
  );

  const [extractedEntities, setExtractedEntities] = useState([
    {
      id: 'ENT-101',
      text: 'retrosternal chest tightness',
      category: 'Symptom / Clinical Finding',
      ontology: 'SNOMED-CT',
      code: '29857009',
      assertion: 'Present',
      confidence: 99.2,
      phiMasked: false
    },
    {
      id: 'ENT-102',
      text: 'type 2 diabetes mellitus',
      category: 'Disorder / Disease',
      ontology: 'ICD-10-CM',
      code: 'E11.9',
      assertion: 'Present (Chronic)',
      confidence: 98.7,
      phiMasked: false
    },
    {
      id: 'ENT-103',
      text: 'Metformin 1000mg',
      category: 'Medication',
      ontology: 'RxNorm',
      code: '860975',
      assertion: 'Active Usage',
      confidence: 99.8,
      phiMasked: false
    },
    {
      id: 'ENT-104',
      text: 'Troponin I elevated',
      category: 'Laboratory Result',
      ontology: 'LOINC',
      code: '10839-9',
      assertion: 'Abnormal High',
      confidence: 96.4,
      phiMasked: false
    }
  ]);

  const [clinicalNotes, setClinicalNotes] = useState([
    {
      id: 'NOTE-9901',
      patientId: 'PT-88219',
      patientName: 'Eleanor Vance',
      noteType: 'Emergency Physician Consult',
      date: '2026-08-17 02:40',
      status: 'PROCESSED_SAFE_HARBOR',
      entitiesExtracted: 14,
      phiRedactedCount: 3,
      avgConfidence: 98.6
    },
    {
      id: 'NOTE-9902',
      patientId: 'PT-41023',
      patientName: 'Marcus Holloway',
      noteType: 'ICU Progress Note',
      date: '2026-08-17 02:15',
      status: 'PROCESSED_SAFE_HARBOR',
      entitiesExtracted: 22,
      phiRedactedCount: 5,
      avgConfidence: 97.4
    },
    {
      id: 'NOTE-9903',
      patientId: 'PT-19204',
      patientName: 'Sophia Rodriguez',
      noteType: 'Discharge Summary',
      date: '2026-08-17 01:50',
      status: 'PROCESSED_SAFE_HARBOR',
      entitiesExtracted: 31,
      phiRedactedCount: 8,
      avgConfidence: 99.1
    }
  ]);

  const filteredEntities = useMemo(() => {
    return extractedEntities.filter(ent => {
      const matchesSearch =
        ent.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ent.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ent.code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesOntology =
        ontologyFilter === 'all' || ent.ontology.toLowerCase().includes(ontologyFilter.toLowerCase());

      return matchesSearch && matchesOntology && ent.confidence >= confidenceThreshold;
    });
  }, [extractedEntities, searchTerm, ontologyFilter, confidenceThreshold]);

  const handleRunNlpInference = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      alert('Clinical NLP Parsing Complete! Entities mapped to SNOMED-CT, RxNorm & LOINC ontologies.');
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 rounded-xl border border-blue-500/30 text-blue-400">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Clinical NLP & Medical Narrative Extraction Subsystem
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">
                SNOMED / RxNorm / LOINC
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Unstructured clinical narrative parsing, automated PHI Safe-Harbor de-identification & ontology assertion mapping engine.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunNlpInference}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Executing Transformer Pipeline...' : 'Parse Clinical Narrative'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Processed Notes (24h)</p>
            <p className="text-2xl font-bold text-white mt-1">4,820 Notes</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> 100% Pipeline Throughput
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Extracted Medical Entities</p>
            <p className="text-2xl font-bold text-white mt-1">42,910 Entities</p>
            <span className="text-xs text-blue-400 flex items-center gap-1 mt-1">
              <BookOpen className="w-3 h-3" /> Mapped to Standard Ontologies
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">PHI De-Identification</p>
            <p className="text-2xl font-bold text-white mt-1">100% Safe Harbor</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3 h-3" /> Zero Leak Guarantee
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Model Inference Latency</p>
            <p className="text-2xl font-bold text-white mt-1">42ms / Note</p>
            <span className="text-xs text-purple-400 flex items-center gap-1 mt-1">
              <Cpu className="w-3 h-3" /> BioBERT-v3 Optimized
            </span>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 mb-6">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
            activeTab === 'pipeline'
              ? 'text-blue-400 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-4 h-4" />
          Live NLP Parsing Sandbox
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
            activeTab === 'history'
              ? 'text-blue-400 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Processed Clinical Notes Registry
        </button>
      </div>

      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Narrative Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Unstructured Narrative Stream
              </h3>
              <span className="text-xs text-slate-500">Safe Harbor Active</span>
            </div>

            <textarea
              value={rawClinicalText}
              onChange={e => setRawClinicalText(e.target.value)}
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
            />

            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Length: {rawClinicalText.length} characters</span>
              <button
                onClick={handleRunNlpInference}
                className="px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg font-semibold transition-all border border-blue-500/30"
              >
                Re-Analyze Entities
              </button>
            </div>
          </div>

          {/* Extracted Entities List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Ontology Entity Mappings
              </h3>
              <span className="text-xs text-emerald-400 font-mono">
                {filteredEntities.length} Entities Found
              </span>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {filteredEntities.map(ent => (
                <div key={ent.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-100 text-sm">{ent.text}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {ent.ontology}: {ent.code}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                    <span>Category: <strong className="text-slate-300">{ent.category}</strong></span>
                    <span className="text-emerald-400 font-semibold">{ent.confidence}% Confidence</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Note ID</th>
                <th className="px-6 py-4">Patient Name</th>
                <th className="px-6 py-4">Consult Type</th>
                <th className="px-6 py-4">Entities Extracted</th>
                <th className="px-6 py-4">PHI Redactions</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {clinicalNotes.map(n => (
                <tr key={n.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-blue-400 text-xs">{n.id}</td>
                  <td className="px-6 py-4 font-bold text-white">{n.patientName}</td>
                  <td className="px-6 py-4 text-slate-300">{n.noteType}</td>
                  <td className="px-6 py-4 font-mono text-indigo-400">{n.entitiesExtracted} Entities</td>
                  <td className="px-6 py-4 font-mono text-emerald-400">{n.phiRedactedCount} Items</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      {n.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClinicalNlpSubsystemHub;
