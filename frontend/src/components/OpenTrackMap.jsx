import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Kochi Metro Stations List with Station Metadata (Point 4)
const KOCHI_METRO_STATIONS = [
  { id: 1, name: "Aluva Terminal", coords: [10.1098, 76.3496], type: "Terminal", platforms: 2 },
  { id: 2, name: "Pulinchodu Station", coords: [10.0982, 76.3461], type: "Standard", platforms: 2 },
  { id: 3, name: "Companypady Station", coords: [10.0894, 76.3421], type: "Standard", platforms: 2 },
  { id: 4, name: "Ambattukavu Station", coords: [10.0792, 76.3355], type: "Standard", platforms: 2 },
  { id: 5, name: "Muttom Central Depot", coords: [10.0725, 76.3318], type: "Depot Interchange", platforms: 4 },
  { id: 6, name: "Kalamassery Station", coords: [10.0551, 76.3218], type: "Standard", platforms: 2 },
  { id: 7, name: "CUSAT Station", coords: [10.0461, 76.3172], type: "Standard", platforms: 2 },
  { id: 8, name: "Pathadipalam Station", coords: [10.0354, 76.3129], type: "Standard", platforms: 2 },
  { id: 9, name: "Edapally Junction", coords: [10.0252, 76.3082], type: "High Demand", platforms: 2 },
  { id: 10, name: "Changampuzha Park", coords: [10.0151, 76.3031], type: "Standard", platforms: 2 },
  { id: 11, name: "Palarivattom Station", coords: [10.0053, 76.2991], type: "Standard", platforms: 2 },
  { id: 12, name: "JLN Stadium Station", coords: [9.9972, 76.2952], type: "High Demand", platforms: 2 },
  { id: 13, name: "Kaloor Station", coords: [9.9902, 76.2901], type: "Standard", platforms: 2 },
  { id: 14, name: "Lissie Station", coords: [9.9861, 76.2852], type: "Standard", platforms: 2 },
  { id: 15, name: "M.G. Road (Ernakulam)", coords: [9.9782, 76.2801], type: "Commercial Hub", platforms: 2 },
  { id: 16, name: "Maharajas College Station", coords: [9.9702, 76.2825], type: "Standard", platforms: 2 },
  { id: 17, name: "Ernakulam South Station", coords: [9.9631, 76.2882], type: "Railway Interchange", platforms: 2 },
  { id: 18, name: "Kadavanthra Station", coords: [9.9612, 76.2991], type: "Standard", platforms: 2 },
  { id: 19, name: "Elamkulam Station", coords: [9.9632, 76.3102], type: "Standard", platforms: 2 },
  { id: 20, name: "Vytilla Mobility Hub", coords: [9.9672, 76.3212], type: "Multi-Modal Hub", platforms: 2 },
  { id: 21, name: "Petta Station", coords: [9.9571, 76.3321], type: "Standard", platforms: 2 },
  { id: 22, name: "SN Junction Station", coords: [9.9532, 76.3431], type: "Standard", platforms: 2 },
  { id: 23, name: "Tripunithura Terminal", coords: [9.9482, 76.3501], type: "Terminal", platforms: 2 }
];

const ROUTE_LINE = KOCHI_METRO_STATIONS.map((s) => s.coords);

// Helper function to create custom status-colored SVG DivIcons (Point 2)
const createCustomTrainIcon = (status, trainNumber, isDwelling) => {
  let colorHex = '#14b8a6'; 
  let pulseColor = 'rgba(20, 184, 166, 0.4)';

  if (status === 'MAINTENANCE_BLOCKED') {
    colorHex = '#f43f5e'; 
    pulseColor = 'rgba(244, 63, 94, 0.4)';
  } else if (status === 'STANDBY') {
    colorHex = '#f59e0b'; 
    pulseColor = 'rgba(245, 158, 11, 0.4)';
  } else if (isDwelling) {
    colorHex = '#3b82f6'; 
    pulseColor = 'rgba(59, 130, 246, 0.5)';
  }

  const svgHtml = `
    <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: ${pulseColor};
        animation: ping ${isDwelling ? '0.8s' : '1.8s'} cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: relative;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${colorHex};
        border: 2px solid #ffffff;
        box-shadow: 0 0 10px ${colorHex};
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 8px;
        font-weight: 900;
        font-family: sans-serif;
      ">
        ${trainNumber.replace('TS-', '')}
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-train-marker-wrapper',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

export default function OpenTrackMap({ fleetData, onSelectTrain, selectedTrain }) {
  const [trainPositions, setTrainPositions] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL'); // Point 5 State
  const animFrameRef = useRef(null);

  // Initialize dynamic train state (Point 1 & Point 3)
  const initialTrainsRef = useRef(
    Array.from({ length: 25 }, (_, idx) => {
      const bayNum = idx + 1;
      const trainId = `TS-${String(bayNum).padStart(2, '0')}`;
      const liveTrain = (fleetData || []).find((t) => t.id === trainId || t.stabling_bay === bayNum);

      const status = liveTrain?.displayStatus || (
        [3, 8, 14, 19].includes(bayNum) ? 'MAINTENANCE_BLOCKED' : 
        [2, 7, 12, 17, 22].includes(bayNum) ? 'STANDBY' : 'INDUCTION_READY'
      );

      const startStationIndex = (bayNum - 1) % (KOCHI_METRO_STATIONS.length - 1);

      let reasonText = null;
      if (status === 'MAINTENANCE_BLOCKED') {
        reasonText = liveTrain?.reason_code || (
          bayNum % 2 === 0 
            ? "Unforeseen Mechanical/Electrical Defect" 
            : "Depot Track / Shunting Line Obstruction"
        );
      } else if (status === 'STANDBY') {
        reasonText = liveTrain?.reason_code || (
          bayNum % 2 === 0 
            ? "Peak Hour Passenger Surge Reserve" 
            : "Priority Commercial Branding SLA Fulfillment"
        );
      }

      return {
        id: trainId,
        train_number: trainId,
        stabling_bay: bayNum,
        mileage_km: liveTrain?.mileage_km || 12000 + ((bayNum * 1850) % 45000),
        branding_sla_hours_needed: liveTrain?.branding_sla_hours_needed || Number(((bayNum * 3.5) % 36.0).toFixed(1)),
        displayStatus: status,
        reason_code: reasonText,
        
        // Motion parameters
        currentSegIndex: startStationIndex,
        progress: 0,
        direction: bayNum % 2 === 0 ? 1 : -1,
        baseSpeedKm: status === 'INDUCTION_READY' ? 35 + (bayNum % 15) : 0,
        currentCoords: KOCHI_METRO_STATIONS[startStationIndex].coords,
        currentStation: KOCHI_METRO_STATIONS[startStationIndex].name,
        
        // Station Dwell State
        isDwelling: false,
        dwellTimer: 0
      };
    })
  );

  useEffect(() => {
    let lastTime = performance.now();

    const animateGpsMovement = (time) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      setTrainPositions(() => {
        return initialTrainsRef.current.map((train) => {
          if (train.displayStatus !== 'INDUCTION_READY') {
            return {
              ...train,
              speedDisplay: '0 km/h (Holding/Pit)'
            };
          }

          if (train.isDwelling) {
            train.dwellTimer -= delta;
            if (train.dwellTimer <= 0) {
              train.isDwelling = false;
              train.dwellTimer = 0;
            } else {
              return {
                ...train,
                speedDisplay: '0 km/h (Station Dwell 2s)'
              };
            }
          }

          const speedFactor = 0.08; 
          let newProgress = train.progress + speedFactor * delta * (train.baseSpeedKm / 30);
          let newSegIndex = train.currentSegIndex;
          let newDirection = train.direction;

          if (newProgress >= 1) {
            newProgress = 0;
            newSegIndex += newDirection;

            if (newSegIndex >= KOCHI_METRO_STATIONS.length - 1) {
              newSegIndex = KOCHI_METRO_STATIONS.length - 2;
              newDirection = -1;
            } else if (newSegIndex < 0) {
              newSegIndex = 0;
              newDirection = 1;
            }

            train.isDwelling = true;
            train.dwellTimer = 2.0;
            train.progress = 0;
            train.currentSegIndex = newSegIndex;
            train.direction = newDirection;
            train.currentCoords = KOCHI_METRO_STATIONS[newSegIndex].coords;
            train.currentStation = KOCHI_METRO_STATIONS[newSegIndex].name;

            return {
              ...train,
              speedDisplay: '0 km/h (Boarding/Dwell)'
            };
          }

          train.progress = newProgress;
          train.currentSegIndex = newSegIndex;
          train.direction = newDirection;

          const startStation = KOCHI_METRO_STATIONS[newSegIndex];
          const nextIndex = newDirection === 1 ? newSegIndex + 1 : Math.max(0, newSegIndex - 1);
          const endStation = KOCHI_METRO_STATIONS[nextIndex];

          const lat = startStation.coords[0] + (endStation.coords[0] - startStation.coords[0]) * newProgress;
          const lng = startStation.coords[1] + (endStation.coords[1] - startStation.coords[1]) * newProgress;

          const calculatedSpeed = Math.round(train.baseSpeedKm + Math.sin(time / 400) * 3);

          return {
            ...train,
            currentCoords: [lat, lng],
            currentStation: startStation.name,
            speedDisplay: `${calculatedSpeed} km/h`
          };
        });
      });

      animFrameRef.current = requestAnimationFrame(animateGpsMovement);
    };

    animFrameRef.current = requestAnimationFrame(animateGpsMovement);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Bidirectional Selection Handler (Point 3)
  const handleMarkerClick = (train) => {
    if (onSelectTrain) {
      onSelectTrain(train);
    }
  };

  // Instant Filter Logic (Point 5)
  const filteredTrains = trainPositions.filter((t) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'DWELLING') return t.isDwelling;
    return t.displayStatus === filterStatus;
  });

  const getCount = (statusKey) => {
    if (statusKey === 'ALL') return trainPositions.length;
    if (statusKey === 'DWELLING') return trainPositions.filter(t => t.isDwelling).length;
    return trainPositions.filter(t => t.displayStatus === statusKey).length;
  };

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
      {/* Header & Point 5 Instant Filter Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-slate-800 pb-4 gap-4">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
            Geospatial Fleet Tracking Map
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Real-time GPS Animation • Interactive Nodes • Filterable Status Control
          </p>
        </div>

        {/* Point 5: Quick Filter Toggle Pills */}
        <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1 rounded-lg border transition-all ${
              filterStatus === 'ALL'
                ? 'bg-slate-200 text-slate-950 border-white font-extrabold shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            All ({getCount('ALL')})
          </button>
          <button
            onClick={() => setFilterStatus('INDUCTION_READY')}
            className={`px-3 py-1 rounded-lg border transition-all ${
              filterStatus === 'INDUCTION_READY'
                ? 'bg-teal-500 text-slate-950 border-teal-400 font-extrabold shadow-sm'
                : 'bg-slate-950 text-teal-400 border-slate-800 hover:bg-teal-500/10'
            }`}
          >
            Ready ({getCount('INDUCTION_READY')})
          </button>
          <button
            onClick={() => setFilterStatus('DWELLING')}
            className={`px-3 py-1 rounded-lg border transition-all ${
              filterStatus === 'DWELLING'
                ? 'bg-blue-500 text-white border-blue-400 font-extrabold shadow-sm'
                : 'bg-slate-950 text-blue-400 border-slate-800 hover:bg-blue-500/10'
            }`}
          >
            Dwelling ({getCount('DWELLING')})
          </button>
          <button
            onClick={() => setFilterStatus('STANDBY')}
            className={`px-3 py-1 rounded-lg border transition-all ${
              filterStatus === 'STANDBY'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                : 'bg-slate-950 text-amber-400 border-slate-800 hover:bg-amber-500/10'
            }`}
          >
            Standby ({getCount('STANDBY')})
          </button>
          <button
            onClick={() => setFilterStatus('MAINTENANCE_BLOCKED')}
            className={`px-3 py-1 rounded-lg border transition-all ${
              filterStatus === 'MAINTENANCE_BLOCKED'
                ? 'bg-rose-500 text-white border-rose-400 font-extrabold shadow-sm'
                : 'bg-slate-950 text-rose-400 border-slate-800 hover:bg-rose-500/10'
            }`}
          >
            Blocked ({getCount('MAINTENANCE_BLOCKED')})
          </button>
        </div>
      </div>

      {/* Map View */}
      <div className="h-[520px] w-full rounded-xl overflow-hidden border border-slate-800">
        <MapContainer
          center={[10.0151, 76.3100]}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Route Line */}
          <Polyline
            positions={ROUTE_LINE}
            color="#2dd4bf"
            weight={4}
            opacity={0.8}
            dashArray="6, 8"
          />

          {/* Point 4: Interactive Route Station Nodes */}
          {KOCHI_METRO_STATIONS.map((station) => {
            const trainsAtStation = trainPositions.filter(t => t.currentStation === station.name);

            return (
              <CircleMarker
                key={`station-node-${station.id}`}
                center={station.coords}
                radius={station.type === 'Terminal' || station.type === 'Depot Interchange' ? 7 : 5}
                pathOptions={{
                  color: station.type === 'Terminal' ? '#f59e0b' : '#38bdf8',
                  fillColor: '#0f172a',
                  fillOpacity: 1,
                  weight: 2
                }}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={0.9}>
                  <span className="font-bold text-xs text-slate-900">
                    Station #{station.id}: {station.name}
                  </span>
                </Tooltip>

                <Popup>
                  <div className="p-1 space-y-2 text-slate-900 min-w-[200px]">
                    <div className="border-b pb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Kochi Metro Node</span>
                      <strong className="text-sm font-extrabold text-slate-900">{station.name}</strong>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Node Type:</span>
                        <span className="font-bold">{station.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Platforms:</span>
                        <span className="font-bold">{station.platforms} Active</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="text-slate-500">Nearby/Dwelling Trains:</span>
                        <span className="font-black text-teal-700">{trainsAtStation.length} Trains</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Point 1 & Point 2: Animated Dynamic Train Markers */}
          {filteredTrains.map((train) => {
            const isSelected = selectedTrain?.id === train.id;

            return (
              <Marker
                key={train.id}
                position={train.currentCoords}
                icon={createCustomTrainIcon(train.displayStatus, train.id, train.isDwelling)}
                eventHandlers={{
                  click: () => handleMarkerClick(train)
                }}
              >
                {/* Point 3: Bidirectional Popup Sync */}
                <Popup className="custom-popup">
                  <div className="p-1 space-y-2 text-slate-900 min-w-[220px]">
                    <div className="flex justify-between items-center border-b pb-1">
                      <span className="font-extrabold text-sm text-teal-950">{train.id}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {isSelected ? 'SELECTED' : `Bay #${train.stabling_bay}`}
                      </span>
                    </div>

                    <div className="bg-slate-100 border border-slate-300 p-1.5 rounded text-xs">
                      <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">Nearest Station Node</span>
                      <strong className="text-slate-900">{train.currentStation}</strong>
                    </div>

                    <div className={`p-1.5 rounded text-xs border ${
                      train.isDwelling
                        ? 'bg-blue-100 border-blue-300 text-blue-900'
                        : train.displayStatus === 'MAINTENANCE_BLOCKED'
                        ? 'bg-rose-100 border-rose-300 text-rose-900'
                        : train.displayStatus === 'STANDBY'
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : 'bg-teal-100 border-teal-300 text-teal-900'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-bold tracking-wider">Status:</span>
                        <strong className="font-extrabold text-[10px]">
                          {train.isDwelling ? 'BOARDING / DWELLING' : train.displayStatus}
                        </strong>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-600 pt-1">
                      <span><strong>GPS Speed:</strong> {train.speedDisplay}</span>
                      <button
                        onClick={() => handleMarkerClick(train)}
                        className="bg-slate-900 text-white hover:bg-teal-600 px-2 py-0.5 rounded font-bold transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}