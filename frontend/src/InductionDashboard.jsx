import React, { useState, useEffect } from 'react';
import TrackMap from './components/TrackMap';
import OpenTrackMap from './components/OpenTrackMap';
import MaintenanceDashboard from './components/MaintenanceDashboard';
import OverrideModal from './components/OverrideModal';

const generate25FleetData = () => {
  return Array.from({ length: 25 }, (_, idx) => {
    const i = idx + 1;
    const trainId = `TS-${String(i).padStart(2, '0')}`;
    const isMaintenance = [3, 8, 14, 19].includes(i);
    const isStandby = [2, 7, 12, 17, 22].includes(i);

    return {
      id: trainId,
      train_number: trainId,
      stabling_bay: i,
      displayStatus: isMaintenance
        ? 'MAINTENANCE_BLOCKED'
        : isStandby
        ? 'STANDBY'
        : 'INDUCTION_READY',
      mileage_km: 12000 + ((i * 1850) % 45000),
      branding_sla_hours_needed: Number(((i * 3.5) % 36.0).toFixed(1))
    };
  });
};

export default function InductionDashboard() {
  const [activeTab, setActiveTab] = useState('depot');
  const [fleetData, setFleetData] = useState(generate25FleetData());
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/api/optimize-induction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ required_trains: 15 })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.induction_schedule)) {
          setFleetData(data.induction_schedule);
        }
      })
      .catch((err) => {
        console.warn('Backend offline or unreachable, using local mock fleet:', err);
      });
  }, []);

  const handleOverrideSuccess = (auditRecord) => {
    // Update main fleet array state
    setFleetData((prev) =>
      (prev || []).map((item) =>
        item.id === auditRecord.train_id
          ? { 
              ...item, 
              displayStatus: auditRecord.new_status,
              reason_code: auditRecord.reason_code,
              priority_level: auditRecord.priority_level 
            }
          : item
      )
    );

    // Synchronize currently selected train details
    if (selectedTrain && selectedTrain.id === auditRecord.train_id) {
      setSelectedTrain((prev) => ({ 
        ...prev, 
        displayStatus: auditRecord.new_status,
        reason_code: auditRecord.reason_code,
        priority_level: auditRecord.priority_level 
      }));
    }
  };

  // Status Badge Color Helper
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'MAINTENANCE_BLOCKED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'STANDBY':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'INDUCTION_READY':
      default:
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-teal-400 inline-block animate-pulse"></span>
            MetroMind Operations Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kochi Metro Automated Train Allocation & Stabling Management System
          </p>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('depot')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'depot' ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Depot Vector Map
          </button>
          <button
            onClick={() => setActiveTab('open-map')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'open-map' ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            2. OpenStreetMap Track Route
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'maintenance' ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            3. Maintenance & Fitness
          </button>
        </div>
      </header>

      {/* TAB 1: DEPOT VECTOR MAP */}
      {activeTab === 'depot' && (
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TrackMap
              fleetData={fleetData || []}
              selectedTrain={selectedTrain}
              onSelectTrain={(train) => setSelectedTrain(train)}
            />
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                Stabling Bay Control Panel
              </h2>
              {selectedTrain ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-black text-white">{selectedTrain.train_number}</span>
                    <span className={`px-2.5 py-1 text-[11px] rounded-md font-extrabold border ${getStatusBadgeStyle(selectedTrain.displayStatus)}`}>
                      {selectedTrain.displayStatus}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bay Assignment:</span>
                      <span className="font-bold">Bay #{selectedTrain.stabling_bay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Odometer Reading:</span>
                      <span className="font-bold">{selectedTrain.mileage_km?.toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Branding SLA Needed:</span>
                      <span className="font-bold text-amber-400">{selectedTrain.branding_sla_hours_needed} hrs</span>
                    </div>
                    {selectedTrain.reason_code && (
                      <div className="flex flex-col pt-1 border-t border-slate-800">
                        <span className="text-slate-400 text-[10px]">Override Reason:</span>
                        <span className="font-semibold text-rose-300 text-[11px] mt-0.5">{selectedTrain.reason_code}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Click any train on the layout map or OpenStreetMap to view details & options.
                </div>
              )}
            </div>

            {selectedTrain && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-lg"
              >
                Confirm Dispatch Override
              </button>
            )}
          </div>
        </main>
      )}

      {/* TAB 2: OPENSTREETMAP TRACK ROUTE */}
      {activeTab === 'open-map' && (
        <main>
          <OpenTrackMap
            fleetData={fleetData}
            selectedTrain={selectedTrain}
            onSelectTrain={(train) => setSelectedTrain(train)}
          />
        </main>
      )}

      {/* TAB 3: MAINTENANCE & FITNESS */}
      {activeTab === 'maintenance' && (
        <main>
          <MaintenanceDashboard fleetData={fleetData || []} />
        </main>
      )}

      {/* OVERRIDE MODAL */}
      <OverrideModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        train={selectedTrain}
        onConfirmSuccess={handleOverrideSuccess}
      />
    </div>
  );
}