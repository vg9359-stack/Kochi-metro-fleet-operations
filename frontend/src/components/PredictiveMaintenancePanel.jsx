import React, { useState } from 'react';
import { calculateTrainHealthMetrics } from '../utils/mlRiskModel';

export default function PredictiveMaintenancePanel({ fleetData, onSelectTrain, selectedTrain }) {
  const [filterLevel, setFilterLevel] = useState('ALL');

  // Enrich fleet data with dynamic ML metrics
  const analyzedFleet = (fleetData || []).map((train) => ({
    ...train,
    analytics: calculateTrainHealthMetrics(train)
  }));

  // Filter fleet based on risk level toggle
  const filteredFleet = analyzedFleet.filter((item) => {
    if (filterLevel === 'ALL') return true;
    return item.analytics.riskLevel === filterLevel;
  });

  // Summary Counters
  const criticalCount = analyzedFleet.filter((t) => t.analytics.riskLevel === 'CRITICAL').length;
  const moderateCount = analyzedFleet.filter((t) => t.analytics.riskLevel === 'MODERATE').length;
  const lowCount = analyzedFleet.filter((t) => t.analytics.riskLevel === 'LOW').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 text-slate-100">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Predictive Maintenance & ML Failure Forecasting
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-variable regression scoring for component failure and remaining useful life (RUL).
          </p>
        </div>

        {/* Risk Level Filters */}
        <div className="flex gap-2 text-xs font-bold">
          <button
            onClick={() => setFilterLevel('ALL')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterLevel === 'ALL'
                ? 'bg-slate-100 text-slate-900 border-white'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            All ({analyzedFleet.length})
          </button>
          <button
            onClick={() => setFilterLevel('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterLevel === 'CRITICAL'
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-slate-950 text-rose-400 border-slate-800 hover:bg-rose-500/10'
            }`}
          >
            Critical ({criticalCount})
          </button>
          <button
            onClick={() => setFilterLevel('MODERATE')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterLevel === 'MODERATE'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-950 text-amber-400 border-slate-800 hover:bg-amber-500/10'
            }`}
          >
            Moderate ({moderateCount})
          </button>
          <button
            onClick={() => setFilterLevel('LOW')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterLevel === 'LOW'
                ? 'bg-teal-500 text-slate-950 border-teal-400'
                : 'bg-slate-950 text-teal-400 border-slate-800 hover:bg-teal-500/10'
            }`}
          >
            Optimal ({lowCount})
          </button>
        </div>
      </div>

      {/* Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[580px] overflow-y-auto pr-1">
        {filteredFleet.map((train) => {
          const { analytics } = train;
          const isSelected = selectedTrain?.id === train.id;

          return (
            <div
              key={train.id}
              onClick={() => onSelectTrain && onSelectTrain(train)}
              className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                isSelected
                  ? 'bg-slate-800 border-teal-400 ring-2 ring-teal-400/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <div>
                  <span className="text-base font-extrabold text-white">{train.id}</span>
                  <span className="text-xs text-slate-400 ml-2">Bay #{train.stabling_bay}</span>
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded border ${analytics.badgeColor}`}
                >
                  {analytics.riskLevel} RISK
                </span>
              </div>

              {/* Progress Bar Gauge */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Failure Risk Index</span>
                  <span
                    className={
                      analytics.riskScore >= 75
                        ? 'text-rose-400'
                        : analytics.riskScore >= 45
                        ? 'text-amber-400'
                        : 'text-teal-400'
                    }
                  >
                    {analytics.riskScore}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      analytics.riskScore >= 75
                        ? 'bg-rose-500'
                        : analytics.riskScore >= 45
                        ? 'bg-amber-500'
                        : 'bg-teal-400'
                    }`}
                    style={{ width: `${analytics.riskScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Key Diagnostic Telemetry */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Est. RUL</span>
                  <span className="font-extrabold text-slate-200">{analytics.remainingHours} Hrs</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Brake Pad Wear</span>
                  <span className="font-extrabold text-slate-200">{analytics.brakeWearPct}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Motor Temp</span>
                  <span className="font-extrabold text-slate-200">{analytics.motorTempC}°C</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Mileage</span>
                  <span className="font-extrabold text-slate-200">
                    {analytics.mileage.toLocaleString()} km
                  </span>
                </div>
              </div>

              {/* Top Failure Concern */}
              <div className="text-[11px] text-slate-400 flex justify-between items-center pt-1">
                <span>Top Risk Factor:</span>
                <span className="font-bold text-slate-200">{analytics.topRiskFactor}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}