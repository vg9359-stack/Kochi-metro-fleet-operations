import React, { useState } from 'react';
import OpenTrackMap from './components/OpenTrackMap';
import PredictiveMaintenancePanel from './components/PredictiveMaintenancePanel';
import DepotOptimizerPanel from './components/DepotOptimizerPanel';

// Realistic Initial Fleet Generator (25 Trains with mixed current bays)
const INITIAL_FLEET = [
  // Maintenance Blocked trains (Some already in pit bays 1-5, some elsewhere)
  { id: 'TS-01', train_number: 'TS-01', stabling_bay: 1, displayStatus: 'MAINTENANCE_BLOCKED', mileage_km: 42000, hvac_hours: 3100, brake_wear_pct: 92, motor_temp_c: 82, branding_sla_hours_needed: 5.0, reason_code: 'Brake Disc Wear Defect' },
  { id: 'TS-02', train_number: 'TS-02', stabling_bay: 2, displayStatus: 'MAINTENANCE_BLOCKED', mileage_km: 38000, hvac_hours: 2900, brake_wear_pct: 88, motor_temp_c: 79, branding_sla_hours_needed: 12.0, reason_code: 'HVAC Compressor Failure' },
  { id: 'TS-03', train_number: 'TS-03', stabling_bay: 14, displayStatus: 'MAINTENANCE_BLOCKED', mileage_km: 44000, hvac_hours: 3200, brake_wear_pct: 95, motor_temp_c: 84, branding_sla_hours_needed: 2.0, reason_code: 'Brake Disc Wear Defect' },
  { id: 'TS-04', train_number: 'TS-04', stabling_bay: 19, displayStatus: 'MAINTENANCE_BLOCKED', mileage_km: 39500, hvac_hours: 2800, brake_wear_pct: 91, motor_temp_c: 81, branding_sla_hours_needed: 8.5, reason_code: 'Traction Motor Overheat' },

  // Express / High Priority Ready Trains (Some in express bays 16-25, some in main lines)
  { id: 'TS-05', train_number: 'TS-05', stabling_bay: 16, displayStatus: 'INDUCTION_READY', mileage_km: 15000, hvac_hours: 1200, brake_wear_pct: 25, motor_temp_c: 64, branding_sla_hours_needed: 28.0, reason_code: null },
  { id: 'TS-06', train_number: 'TS-06', stabling_bay: 17, displayStatus: 'INDUCTION_READY', mileage_km: 18000, hvac_hours: 1400, brake_wear_pct: 30, motor_temp_c: 65, branding_sla_hours_needed: 24.5, reason_code: null },
  { id: 'TS-07', train_number: 'TS-07', stabling_bay: 18, displayStatus: 'INDUCTION_READY', mileage_km: 16500, hvac_hours: 1300, brake_wear_pct: 28, motor_temp_c: 63, branding_sla_hours_needed: 22.0, reason_code: null },
  { id: 'TS-08', train_number: 'TS-08', stabling_bay: 7, displayStatus: 'INDUCTION_READY', mileage_km: 21000, hvac_hours: 1600, brake_wear_pct: 35, motor_temp_c: 66, branding_sla_hours_needed: 20.0, reason_code: null },

  // Standard Main Stabling Line Trains (Bays 6-15)
  { id: 'TS-09', train_number: 'TS-09', stabling_bay: 6, displayStatus: 'INDUCTION_READY', mileage_km: 25000, hvac_hours: 1900, brake_wear_pct: 42, motor_temp_c: 68, branding_sla_hours_needed: 10.0, reason_code: null },
  { id: 'TS-10', train_number: 'TS-10', stabling_bay: 7, displayStatus: 'INDUCTION_READY', mileage_km: 27000, hvac_hours: 2000, brake_wear_pct: 45, motor_temp_c: 69, branding_sla_hours_needed: 8.0, reason_code: null },
  { id: 'TS-11', train_number: 'TS-11', stabling_bay: 8, displayStatus: 'INDUCTION_READY', mileage_km: 22000, hvac_hours: 1700, brake_wear_pct: 38, motor_temp_c: 67, branding_sla_hours_needed: 12.0, reason_code: null },
  { id: 'TS-12', train_number: 'TS-12', stabling_bay: 9, displayStatus: 'INDUCTION_READY', mileage_km: 23500, hvac_hours: 1800, brake_wear_pct: 40, motor_temp_c: 67, branding_sla_hours_needed: 6.0, reason_code: null },
  { id: 'TS-13', train_number: 'TS-13', stabling_bay: 10, displayStatus: 'INDUCTION_READY', mileage_km: 29000, hvac_hours: 2100, brake_wear_pct: 48, motor_temp_c: 70, branding_sla_hours_needed: 14.0, reason_code: null },
  { id: 'TS-14', train_number: 'TS-14', stabling_bay: 11, displayStatus: 'INDUCTION_READY', mileage_km: 31000, hvac_hours: 2300, brake_wear_pct: 52, motor_temp_c: 71, branding_sla_hours_needed: 4.0, reason_code: null },
  { id: 'TS-15', train_number: 'TS-15', stabling_bay: 12, displayStatus: 'INDUCTION_READY', mileage_km: 28000, hvac_hours: 2050, brake_wear_pct: 46, motor_temp_c: 69, branding_sla_hours_needed: 9.0, reason_code: null },
  { id: 'TS-16', train_number: 'TS-16', stabling_bay: 13, displayStatus: 'INDUCTION_READY', mileage_km: 30000, hvac_hours: 2200, brake_wear_pct: 50, motor_temp_c: 70, branding_sla_hours_needed: 11.0, reason_code: null },

  // Remaining Standby & Secondary Units
  { id: 'TS-17', train_number: 'TS-17', stabling_bay: 5, displayStatus: 'STANDBY', mileage_km: 19000, hvac_hours: 1500, brake_wear_pct: 32, motor_temp_c: 65, branding_sla_hours_needed: 15.0, reason_code: null },
  { id: 'TS-18', train_number: 'TS-18', stabling_bay: 15, displayStatus: 'STANDBY', mileage_km: 20000, hvac_hours: 1550, brake_wear_pct: 33, motor_temp_c: 65, branding_sla_hours_needed: 13.0, reason_code: null },
  { id: 'TS-19', train_number: 'TS-19', stabling_bay: 20, displayStatus: 'INDUCTION_READY', mileage_km: 17500, hvac_hours: 1350, brake_wear_pct: 29, motor_temp_c: 64, branding_sla_hours_needed: 26.0, reason_code: null },
  { id: 'TS-20', train_number: 'TS-20', stabling_bay: 21, displayStatus: 'INDUCTION_READY', mileage_km: 16000, hvac_hours: 1250, brake_wear_pct: 27, motor_temp_c: 63, branding_sla_hours_needed: 21.0, reason_code: null },
  { id: 'TS-21', train_number: 'TS-21', stabling_bay: 22, displayStatus: 'INDUCTION_READY', mileage_km: 14000, hvac_hours: 1100, brake_wear_pct: 23, motor_temp_c: 62, branding_sla_hours_needed: 18.0, reason_code: null },
  { id: 'TS-22', train_number: 'TS-22', stabling_bay: 23, displayStatus: 'STANDBY', mileage_km: 26000, hvac_hours: 1950, brake_wear_pct: 44, motor_temp_c: 68, branding_sla_hours_needed: 7.0, reason_code: null },
  { id: 'TS-23', train_number: 'TS-23', stabling_bay: 24, displayStatus: 'INDUCTION_READY', mileage_km: 33000, hvac_hours: 2400, brake_wear_pct: 55, motor_temp_c: 72, branding_sla_hours_needed: 3.0, reason_code: null },
  { id: 'TS-24', train_number: 'TS-24', stabling_bay: 25, displayStatus: 'INDUCTION_READY', mileage_km: 35000, hvac_hours: 2600, brake_wear_pct: 58, motor_temp_c: 74, branding_sla_hours_needed: 1.0, reason_code: null },
  { id: 'TS-25', train_number: 'TS-25', stabling_bay: 3, displayStatus: 'STANDBY', mileage_km: 24000, hvac_hours: 1850, brake_wear_pct: 41, motor_temp_c: 67, branding_sla_hours_needed: 5.0, reason_code: null }
];

export default function App() {
  const [fleetData, setFleetData] = useState(INITIAL_FLEET);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [activeTab, setActiveTab] = useState('MAP'); // 'MAP' | 'MAINTENANCE' | 'OPTIMIZER'

  // Handler: Selecting a train in any component highlights it everywhere
  const handleSelectTrain = (train) => {
    setSelectedTrain(train);
  };

  // Safe Handler: Applying optimization results updates global bay assignments
  const handleApplyOptimization = (optimizationResult) => {
    if (!optimizationResult || !Array.isArray(optimizationResult.assignments)) return;

    setFleetData((prevFleet) =>
      prevFleet.map((train) => {
        const match = optimizationResult.assignments.find((a) => a.trainId === train.id);
        if (match) {
          return {
            ...train,
            stabling_bay: match.bayNumber || match.recommendedBay
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