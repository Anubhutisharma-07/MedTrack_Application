import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Thermometer, 
  ShieldAlert, 
  Zap, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Package, 
  Globe,
  Database
} from 'lucide-react';

const ColdchainPharmaceuticalSupplyHub = () => {
  const [selectedShipment, setSelectedShipment] = useState('SHIP-VAC-901');
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [protocolStatus, setProtocolStatus] = useState({
    tempOverride: false,
    rfidQuarantine: false,
    cryptoLedgerExport: false,
    refrigerationBoost: false
  });

  // Cold Chain Telemetry Metrics State
  const [coldMetrics, setColdMetrics] = useState({
    activeShipments: 18,
    ambientTemp: -72.4, // °C Ultra-Low Freezer
    tempDeviationMinutes: 0,
    humidityPercent: 42,
    rfidAuthenticity: 100,
    gdpComplianceScore: 99.9
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setColdMetrics(prev => ({
        ...prev,
        ambientTemp: Math.round((-72.8 + Math.random() * 0.8) * 10) / 10,
        humidityPercent: Math.floor(41 + Math.random() * 3)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const shipmentList = [
    { id: 'SHIP-VAC-901', payload: 'mRNA COVID-19 / mRNA-1273 Vaccines', temp: '-72.4 °C', carrier: 'CryoTransport Express Bay 02', status: 'IN_TRANSIT_OPTIMAL', rfid: 'RFID-SEC-9901' },
    { id: 'SHIP-BIO-442', payload: 'Monoclonal Antibodies / Pembrolizumab', temp: '+4.2 °C', carrier: 'Refrigerated Transport Van 08', status: 'IN_TRANSIT_OPTIMAL', rfid: 'RFID-SEC-4412' },
    { id: 'SHIP-BLD-881', payload: 'Packed Red Blood Cells (PRBC) Units', temp: '+3.8 °C', carrier: 'Blood Bank Cold Vault 01', status: 'STATIONARY_SECURE', rfid: 'RFID-SEC-8810' },
    { id: 'SHIP-GEN-302', payload: 'AAV9 Gene Therapy Vectors', temp: '-81.1 °C', carrier: 'Ultra-Low Freezer Unit 04', status: 'WARNING_TEMP_EXCURSION', rfid: 'RFID-SEC-3029' }
  ];

  const supplyAlerts = [
    { id: 'ALT-COLD01', time: '15:32:05', type: 'CRITICAL', title: 'Ultra-Low Temperature Excursion Warning', desc: 'Freezer Unit 04 temperature rose from -81.1 °C to -74.2 °C (+6.9 °C Delta in 10 min). Secondary liquid nitrogen cooling engaged.', standard: 'WHO Good Distribution Practice (GDP) / FDA 21 CFR Part 211' },
    { id: 'ALT-COLD02', time: '15:10:44', type: 'WARNING', title: 'RFID Tamper-Evident Seal Alert', desc: 'Shipment SHIP-BIO-442 container latch sensor registered brief vibration pulse. Cryptographic seal verified intact.', standard: 'DSCSA Supply Chain Security Standard' },
    { id: 'ALT-COLD03', time: '14:25:00', type: 'INFO', title: 'Immutable Supply Chain Audit Log Committed', desc: 'GPS & Telemetry stream hashed to audit ledger. 2,400 sensor frames validated.', standard: 'FDA 21 CFR Part 11 / HL7 FHIR Supply' }
  ];

  const toggleProtocol = (proto) => {
    setProtocolStatus(prev => ({
      ...prev,
      [proto]: !prev[proto]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 mb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Truck className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">
                Pharmaceutical Cold-Chain Supply & Telemetry Overwatch
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                FDA DSCSA Supply Chain Traceability, Ultra-Low Cryogenic Temperature Monitoring & GDP Audit Engine
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => toggleProtocol('refrigerationBoost')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.refrigerationBoost 
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-600/50 animate-bounce' 
                : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/40'
            }`}
          >
            <Thermometer className="w-4 h-4" />
            BOOST LN2 COOLING
          </button>

          <button 
            onClick={() => toggleProtocol('rfidQuarantine')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.rfidQuarantine 
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/50' 
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            QUARANTINE EXCURSION LOT
          </button>

          <button 
            onClick={() => toggleProtocol('cryptoLedgerExport')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              protocolStatus.cryptoLedgerExport 
                ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/50' 
                : 'bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/40'
            }`}
          >
            <Database className="w-4 h-4" />
            EXPORT DSCSA PROVENANCE
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Shipment Roster */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                Active Cold-Chain Shipments
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full font-mono">
                {coldMetrics.activeShipments} Monitored
              </span>
            </div>

            <div className="space-y-2">
              {shipmentList.map(sh => (
                <div 
                  key={sh.id}
                  onClick={() => setSelectedShipment(sh.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedShipment === sh.id ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10' : 'bg-slate-950/60 border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{sh.payload}</p>
                      <p className="text-xs text-slate-400 font-mono">{sh.id} • {sh.rfid}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      sh.status === 'WARNING_TEMP_EXCURSION' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {sh.temp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2"><strong className="text-slate-400">Carrier:</strong> {sh.carrier}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Sensor Telemetry Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-purple-400" />
              Environmental Sensor Array
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Freezer Chamber Temp:</span>
                <span className="font-mono text-cyan-400">{coldMetrics.ambientTemp} °C</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span>Relative Humidity:</span>
                <span className="font-mono text-purple-400">{coldMetrics.humidityPercent}% RH</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span>GDP Compliance Score:</span>
                <span className="font-mono text-emerald-400">{coldMetrics.gdpComplianceScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Telemetry Monitor Dashboard */}
        <div className="lg:col-span-6 space-y-6">
          {/* Shipment Header Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">mRNA COVID-19 / mRNA-1273 Vaccines</h2>
                <span className="px-2.5 py-0.5 text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-semibold">
                  CRYOGENIC STABLE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Shipment ID: SHIP-VAC-901 | Lot: #mRNA-99402 | Carrier: CryoTransport Express | Destination: Central Pharmacy Vault
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700">
                DSCSA Track & Trace
              </span>
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-cyan-400 mb-1">FREEZER TEMP</div>
              <div className="text-3xl font-black font-mono text-cyan-400">{coldMetrics.ambientTemp} <span className="text-xs font-normal text-slate-400">°C</span></div>
              <div className="text-[10px] text-slate-400 mt-1">Target -80°C to -60°C</div>
            </div>

            <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-purple-400 mb-1">RELATIVE HUMIDITY</div>
              <div className="text-3xl font-black font-mono text-purple-400">{coldMetrics.humidityPercent}%</div>
              <div className="text-[10px] text-slate-400 mt-1">Chamber Humidity</div>
            </div>

            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-emerald-400 mb-1">RFID AUTHENTICITY</div>
              <div className="text-3xl font-black font-mono text-emerald-400">100%</div>
              <div className="text-[10px] text-slate-400 mt-1">Cryptographic Tag</div>
            </div>

            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4">
              <div className="text-xs font-bold text-amber-400 mb-1">EXCURSION TIME</div>
              <div className="text-3xl font-black font-mono text-amber-400">0 <span className="text-xs font-normal text-slate-400">min</span></div>
              <div className="text-[10px] text-slate-400 mt-1">Zero Temp Breach</div>
            </div>
          </div>

          {/* Temperature Continuous Stream */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                ULTRA-LOW CRYOGENIC TEMPERATURE STREAM (-80 °C THRESHOLD)
              </h3>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
                <span>REAL-TIME SENSOR</span>
              </div>
            </div>
            
            <div className="h-32 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-center p-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <svg className="w-full h-full text-cyan-400 stroke-current fill-none" viewBox="0 0 500 100" preserveAspectRatio="none">
                <path 
                  strokeWidth="2" 
                  d="M 0,50 L 50,52 L 100,48 L 150,51 L 200,49 L 250,53 L 300,47 L 350,50 L 400,52 L 450,48 L 500,50" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Supply Chain Alerts */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Supply Chain Bulletins
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full font-mono">
                {supplyAlerts.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {supplyAlerts.map(alt => (
                <div 
                  key={alt.id}
                  onClick={() => { setSelectedAlert(alt); setShowModal(true); }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                    alt.type === 'CRITICAL' ? 'bg-rose-950/40 border-rose-800/80' :
                    alt.type === 'WARNING' ? 'bg-amber-950/40 border-amber-800/80' :
                    'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                    <span className="font-mono">{alt.time}</span>
                    <span className={`font-bold ${alt.type === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}`}>{alt.type}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{alt.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{alt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Badge */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Regulatory GDP Compliance
            </h3>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="flex justify-between"><span>FDA DSCSA Track:</span> <span className="text-emerald-400 font-semibold">Verified</span></p>
              <p className="flex justify-between"><span>WHO GDP Guidelines:</span> <span className="text-emerald-400 font-semibold">Compliant</span></p>
              <p className="flex justify-between"><span>FDA 21 CFR Part 11:</span> <span className="text-emerald-400 font-semibold">Audit Passed</span></p>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Inspector */}
      {showModal && selectedAlert && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800 rounded-md">
                  {selectedAlert.type} SUPPLY ALERT
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-2">{selectedAlert.title}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200 font-mono text-xl">×</button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{selectedAlert.desc}</p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <p><strong className="text-slate-200">Standard Framework:</strong> {selectedAlert.standard}</p>
              <p><strong className="text-slate-200">Action Required:</strong> Engage auxiliary liquid nitrogen backup compressor. Isolate affected pharmaceutical batch into quarantine status pending stability testing.</p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold">Dismiss</button>
              <button onClick={() => { alert('Liquid Nitrogen Backup Activated & Quarantine Logged'); setShowModal(false); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/40">Activate LN2 Backup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColdchainPharmaceuticalSupplyHub;
