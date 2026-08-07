import React, { useState } from 'react';
import OpenTrackMap from './components/OpenTrackMap';
import PredictiveMaintenancePanel from './components/PredictiveMaintenancePanel';
import DepotOptimizerPanel from './components/DepotOptimizerPanel';

// Initial Master Fleet Generator (25 Trains)
const INITIAL_FLEET = Array.from({ length: 25 }, (_, idx) => {
  const bayNum = idx + 1;
  const trainId = `TS-${String(bayNum).padStart(2, '0')}`;
  
  const status = [3, 8, 14, 19].includes(bayNum) 
    ? 'MAINTENANCE_BLOCKED' 
    : [2, 7, 12, 17, 22].includes(bayNum) 
    ? 'STANDBY' 
    : 'INDUCTION_READY';

  return {
    id: trainId,
    train_number: trainId,
    stabling_bay: bayNum,
    displayStatus: status,
    mileage_km: 12000 + ((bayNum * 1850) % 45000),
    hvac_hours: Math.round(800 + ((bayNum * 140) % 3200)),
    brake_wear_pct: Math.min(95, Math.round(((12000 + ((bayNum * 1850) % 45000)) / 60000) * 100)),
    motor_temp_c: 62 + (bayNum % 22),
    branding_sla_hours_needed: Number(((bayNum * 3.5) % 36.0).toFixed(1)),
    reason_code: status === 'MAINTENANCE_BLOCKED' ? 'Brake Pad / Disc Wear Defect' : null
  };
});

export default function App() {
  const [fleetData, setFleetData] = useState(INITIAL_FLEET);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [activeTab, setActiveTab] = useState('MAP'); // 'MAP' | 'MAINTENANCE' | 'OPTIMIZER'

  // Handler: Selecting a train in any component highlights it everywhere
  const handleSelectTrain = (train) => {
    setSelectedTrain(train);
  };

  // Handler: Applying the Stabling Optimizer results updates global bay assignments
  const handleApplyOptimization = (optimizedAssignments) => {
    setFleetData((prevFleet) =>
      prevFleet.map((train) => {
        const match = optimizedAssignments.find((a) => a.trainId === train.id);
        if (match) {
          return {
            ...train,
            stabling_bay: match.recommendedBay
          };
        }
        return train;
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 space-y-6">
      {/* Top Application Navigation Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-400 animate-pulse"></span>
            <h1 className="text-xl font-black tracking-wider uppercase text-white">
              Metro Fleet Operations & Logistics Command
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-Time GPS Tracking • ML Predictive Maintenance • Automated Depot Dispatch
          </p>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('MAP')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'MAP'
                ? 'bg-teal-500 text-slate-950 font-extrabold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🗺️ Live Geospatial Map
          </button>
          <button
            onClick={() => setActiveTab('MAINTENANCE')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'MAINTENANCE'
                ? 'bg-rose-500 text-white font-extrabold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🤖 ML Predictive Maintenance
          </button>
          <button
            onClick={() => setActiveTab('OPTIMIZER')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'OPTIMIZER'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Stabling Bay Optimizer
          </button>
        </div>
      </header>

      {/* Selected Unit Cross-Module Alert Bar */}
      {selectedTrain && (
        <div className="bg-slate-900 border border-teal-500/40 p-3 rounded-xl flex justify-between items-center text-xs">
          <div className="flex items-center gap-3">
            <span className="bg-teal-500/20 text-teal-400 border border-teal-500/30 font-bold px-2.5 py-1 rounded-lg">
              SELECTED UNIT: {selectedTrain.id}
            </span>
            <span className="text-slate-300">
              Assigned Track: <strong>Bay #{selectedTrain.stabling_bay}</strong> | Status: <strong>{selectedTrain.displayStatus}</strong>
            </span>
          </div>
          <button
            onClick={() => setSelectedTrain(null)}
            className="text-slate-400 hover:text-white font-bold text-xs"
          >
            ✕ Clear Selection
          </button>
        </div>
      )}

      {/* Main Active View Renderer */}
      <main>
        {activeTab === 'MAP' && (
          <OpenTrackMap
            fleetData={fleetData}
            selectedTrain={selectedTrain}
            onSelectTrain={handleSelectTrain}
          />
        )}

        {activeTab === 'MAINTENANCE' && (
          <PredictiveMaintenancePanel
            fleetData={fleetData}
            selectedTrain={selectedTrain}
            onSelectTrain={handleSelectTrain}
          />
        )}

        {activeTab === 'OPTIMIZER' && (
          <DepotOptimizerPanel
            fleetData={fleetData}
            onApplyOptimization={handleApplyOptimization}
          />
        )}
      </main>
    </div>
  );
}