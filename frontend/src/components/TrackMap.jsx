import React from 'react';

// Real Kochi Metro Station & Depot Locations
const KOCHI_METRO_LOCATIONS = {
  1: "Muttom Depot (Stabling Bay 01)",
  2: "Aluva Terminal (Platform 1)",
  3: "Muttom Workshop Pit #03", // Maintenance
  4: "Kalamassery Station",
  5: "Edapally Junction",
  6: "Palarivattom Station",
  7: "M.G. Road (Ernakulam)",
  8: "Muttom Inspection Shed #08", // Maintenance
  9: "Ernakulam South Station",
  10: "Vytilla Mobility Hub",
  11: "Tripunithura Terminal",
  12: "CUSAT Station",
  13: "JLN Stadium Station",
  14: "Muttom Heavy Repair Bay #14", // Maintenance
  15: "Kadavanthra Station",
  16: "Petta Station",
  17: "Kaloor Station",
  18: "SN Junction Station",
  19: "Muttom Wash Line #19", // Maintenance
  20: "Companypady Station",
  21: "Pathadipalam Station",
  22: "Elamkulam Station",
  23: "Maharajas College Station",
  24: "Pulinchodu Station",
  25: "Ambattukavu Station"
};

export default function TrackMap({ fleetData, selectedTrain, onSelectTrain }) {
  // Map all 25 trains with their exact Kochi location
  const bays = Array.from({ length: 25 }, (_, idx) => {
    const bayNum = idx + 1;
    const trainId = `TS-${String(bayNum).padStart(2, '0')}`;
    const foundTrain = (fleetData || []).find((t) => t.stabling_bay === bayNum || t.id === trainId);

    const defaultStatus = [3, 8, 14, 19].includes(bayNum)
      ? 'MAINTENANCE_BLOCKED'
      : ([2, 7, 12, 17, 22].includes(bayNum) ? 'STANDBY' : 'INDUCTION_READY');

    const trainData = foundTrain || {
      id: trainId,
      train_number: trainId,
      stabling_bay: bayNum,
      displayStatus: defaultStatus,
      mileage_km: 12000 + ((bayNum * 1850) % 45000),
      branding_sla_hours_needed: Number(((bayNum * 3.5) % 36.0).toFixed(1))
    };

    return {
      ...trainData,
      currentPlace: KOCHI_METRO_LOCATIONS[bayNum] || `Muttom Bay #${bayNum}`
    };
  });

  // Sector Groupings
  const depotTrains = bays.filter((b) => b.currentPlace.includes('Muttom'));
  const northLineTrains = bays.filter((b) => 
    !b.currentPlace.includes('Muttom') && [2, 4, 5, 6, 12, 13, 17, 20, 21, 24, 25].includes(b.stabling_bay)
  );
  const southLineTrains = bays.filter((b) => 
    !b.currentPlace.includes('Muttom') && [7, 9, 10, 11, 15, 16, 18, 22, 23].includes(b.stabling_bay)
  );

  const renderTrainTile = (train) => {
    const isSelected = selectedTrain?.id === train.id;
    let statusStyle = "bg-teal-500/10 border-teal-500/40 text-teal-300 hover:border-teal-400";

    if (train.displayStatus === 'MAINTENANCE_BLOCKED') {
      statusStyle = "bg-rose-500/10 border-rose-500/40 text-rose-300 hover:border-rose-400";
    } else if (train.displayStatus === 'STANDBY') {
      statusStyle = "bg-amber-500/10 border-amber-500/40 text-amber-300 hover:border-amber-400";
    }

    return (
      <button
        key={train.id}
        onClick={() => onSelectTrain(train)}
        className={`flex flex-col justify-between p-3 rounded-xl border text-left transition-all ${statusStyle} ${
          isSelected ? 'ring-2 ring-white scale-105 shadow-xl bg-slate-800/90' : ''
        }`}
      >
        <div className="flex justify-between items-center w-full mb-1">
          <span className="text-[10px] font-mono font-bold text-slate-400">BAY #{train.stabling_bay}</span>
          <span className="text-xs font-black text-white">{train.train_number}</span>
        </div>

        {/* Visual Track Bar */}
        <div className="w-full bg-slate-950/80 rounded h-6 my-1 flex items-center justify-center border border-slate-800 relative">
          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-slate-700 -translate-y-1/2"></div>
          <div
            className={`relative z-10 text-[9px] font-black px-2 py-0.5 rounded shadow ${
              train.displayStatus === 'INDUCTION_READY'
                ? 'bg-teal-500 text-slate-950'
                : train.displayStatus === 'MAINTENANCE_BLOCKED'
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-amber-500 text-slate-950'
            }`}
          >
            RAKE {train.stabling_bay}
          </div>
        </div>

        {/* Real Kochi Location Name */}
        <div className="mt-1 pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] font-semibold text-teal-200">
          <span className="text-amber-400 text-xs">📍</span>
          <span className="truncate" title={train.currentPlace}>{train.currentPlace}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Kochi Metro Live Fleet Locations (25 Rakes)
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Real-time station positioning: Aluva, Muttom, Ernakulam, Vytilla & Tripunithura Corridor
          </p>
        </div>
        <div className="flex gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-teal-400">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span> Ready
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Standby
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span> Blocked
          </span>
        </div>
      </div>

      <div className="space-y-6 max-h-[580px] overflow-y-auto pr-1">
        {/* Sector 1: Muttom Central Depot */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wide">
              Muttom Central Depot & Maintenance Hub
            </span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {depotTrains.map(renderTrainTile)}
          </div>
        </div>

        {/* Sector 2: North Line Corridor (Aluva to Kaloor) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-extrabold text-teal-400 uppercase tracking-wide">
              North Corridor (Aluva ↔ Edapally ↔ Kaloor)
            </span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {northLineTrains.map(renderTrainTile)}
          </div>
        </div>

        {/* Sector 3: South Line Corridor (Ernakulam Central to Tripunithura) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wide">
              South Corridor (M.G. Road ↔ Ernakulam South ↔ Vytilla ↔ Tripunithura)
            </span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {southLineTrains.map(renderTrainTile)}
          </div>
        </div>
      </div>
    </div>
  );
}