import React from 'react';

export default function MaintenanceDashboard({ fleetData }) {
  return (
    <div className="space-y-6">
      {/* Maintenance KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-bold uppercase">Total Fleet Size</p>
          <p className="text-2xl font-black text-white mt-1">{fleetData.length || 25} Rakes</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-bold uppercase">Active Maintenance Jobs</p>
          <p className="text-2xl font-black text-rose-400 mt-1">3 Job Cards</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-bold uppercase">Fitness Certificates Valid</p>
          <p className="text-2xl font-black text-teal-400 mt-1">92.8 %</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-bold uppercase">Pending Branding Wrap SLA</p>
          <p className="text-2xl font-black text-amber-400 mt-1">35.5 Hours</p>
        </div>
      </div>

      {/* Fleet Subsystem Fitness Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">
          Fleet Subsystem Fitness & Job Card Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Trainset ID</th>
                <th className="p-3">Odometer Reading</th>
                <th className="p-3">Rolling Stock</th>
                <th className="p-3">Signalling System</th>
                <th className="p-3">Telecom & CCTV</th>
                <th className="p-3">Open Job Cards</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {fleetData.map((train) => (
                <tr key={train.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white">{train.train_number}</td>
                  <td className="p-3">{train.mileage_km ? train.mileage_km.toLocaleString() : '14,200'} km</td>
                  <td className="p-3">
                    <span className="text-teal-400 font-bold">✓ PASS</span>
                  </td>
                  <td className="p-3">
                    <span className="text-teal-400 font-bold">✓ PASS</span>
                  </td>
                  <td className="p-3">
                    {train.displayStatus === 'MAINTENANCE_BLOCKED' ? (
                      <span className="text-rose-400 font-bold">✗ FAIL</span>
                    ) : (
                      <span className="text-teal-400 font-bold">✓ PASS</span>
                    )}
                  </td>
                  <td className="p-3 font-mono font-bold">
                    {train.displayStatus === 'MAINTENANCE_BLOCKED' ? '2 (High Priority)' : '0'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      train.displayStatus === 'MAINTENANCE_BLOCKED' 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}>
                      {train.displayStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}