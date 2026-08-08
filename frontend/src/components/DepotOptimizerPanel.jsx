import React, { useState } from 'react';
import { runStablingOptimization } from '../utils/stablingOptimizer';

export default function DepotOptimizerPanel({ fleetData, onApplyOptimization }) {
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleRunAlgorithm = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const result = runStablingOptimization(fleetData || []);
      setOptimizationResult(result);
      setIsOptimizing(false);
      if (onApplyOptimization) {
        onApplyOptimization(result);
      }
    }, 600); // Simulated processing delay
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 text-slate-100">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping"></span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Depot Stabling Track & Shunting Optimizer
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated track allocation based on maintenance dependencies, dispatch SLA, and shunting minimization.
          </p>
        </div>

        <button
          onClick={handleRunAlgorithm}
          disabled={isOptimizing}
          className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-teal-500/20 disabled:opacity-50"
        >
          {isOptimizing ? 'Running Optimization Engine...' : '⚡ Run Auto-Stabling Algorithm'}
        </button>
      </div>

      {/* Results View */}
      {optimizationResult ? (
        <div className="space-y-4">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Efficiency Rating</span>
              <strong className="text-xl text-teal-400 font-black">{optimizationResult.optimizationScore}%</strong>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Required Shunting Movements</span>
              <strong className="text-xl text-amber-400 font-black">{optimizationResult.shuntingCount} Moves</strong>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Capacity Bottlenecks</span>
              <strong className="text-xl text-rose-400 font-black">{optimizationResult.warnings.length} Alerts</strong>
            </div>
          </div>

          {/* Allocation Table */}
          <div className="max-h-[420px] overflow-y-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold sticky top-0 border-b border-slate-800 z-10">
                <tr>
                  <th className="p-3">Rec. Bay</th>
                  <th className="p-3">Train ID</th>
                  <th className="p-3">Current Bay</th>
                  <th className="p-3">Target Depot Zone</th>
                  <th className="p-3">Allocation Logic / Reason</th>
                  <th className="p-3 text-right">Shunting Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {optimizationResult.assignments.map((item) => (
                  <tr key={item.trainId} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 font-extrabold text-white">
                      {item.recommendedBay.startsWith('Bay') ? item.recommendedBay : `Bay #${item.recommendedBay}`}
                    </td>
                    <td className="p-3 font-bold text-teal-400">{item.trainId}</td>
                    <td className="p-3 text-slate-400">
                      {item.currentBay.startsWith('Bay') ? item.currentBay : `Bay #${item.currentBay}`}
                    </td>
                    <td className="p-3">
                      <span className={`border text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                        item.zone === 'MAINTENANCE_PITS'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : item.zone === 'EXPRESS_INDUCTION'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {item.zone}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{item.reason}</td>
                    <td className="p-3 text-right">
                      {item.requiresShunting ? (
                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-1 rounded-md">
                          Shunt Required
                        </span>
                      ) : (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-md">
                          In Position
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-2">
          <p className="text-xs text-slate-400">
            No optimization simulation currently active. Click above to auto-assign all fleet units to depot tracks.
          </p>
        </div>
      )}
    </div>
  );
}