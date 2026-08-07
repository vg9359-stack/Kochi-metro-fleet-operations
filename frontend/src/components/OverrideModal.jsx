import React, { useState } from 'react';

// Helper function to resolve Priority Level and Target Status based on Reason Code
const getStatusAndPriority = (reasonCode) => {
  switch (reasonCode) {
    case 'UNFORESEEN_DEFECT':
      return { 
        status: 'MAINTENANCE_BLOCKED', 
        priority: 'HIGH_CRITICAL', 
        color: 'RED' 
      };
    case 'SHUNTING_OBSTRUCTION':
      return { 
        status: 'MAINTENANCE_BLOCKED', 
        priority: 'HIGH_OBSTRUCTION', 
        color: 'RED' 
      };
    case 'BRANDING_SLA':
      return { 
        status: 'STANDBY', 
        priority: 'MODERATE_COMMERCIAL', 
        color: 'AMBER' 
      };
    case 'PASSENGER_SURGE':
      return { 
        status: 'STANDBY', 
        priority: 'MODERATE_OPERATIONAL', 
        color: 'AMBER' 
      };
    case 'OTHER_DISCRETION':
    default:
      return { 
        status: 'STANDBY', 
        priority: 'LOW_ADMINISTRATIVE', 
        color: 'AMBER' 
      };
  }
};

export default function OverrideModal({ isOpen, onClose, train, onConfirmSuccess }) {
  const [reasonCode, setReasonCode] = useState('UNFORESEEN_DEFECT');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !train) return null;

  // Resolve current selection priority details for dynamic UI badges
  const currentMeta = getStatusAndPriority(reasonCode);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const { status: targetStatus, priority } = getStatusAndPriority(reasonCode);

    const payload = {
      train_id: train.id,
      stabling_bay: train.stabling_bay,
      previous_status: train.displayStatus,
      new_status: targetStatus,
      reason_code: reasonCode,
      priority_level: priority,
      notes: notes
    };

    fetch('http://localhost:8000/api/override-dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then(() => {
        setLoading(false);
        onConfirmSuccess(payload);
        onClose();
      })
      .catch((err) => {
        console.error('Error logging override:', err);
        setLoading(false);
        onConfirmSuccess(payload);
        onClose();
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${currentMeta.color === 'RED' ? 'bg-rose-500 animate-ping' : 'bg-amber-400'}`}></span>
            Dispatch Manual Override SOP
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
          <p><span className="text-slate-400">Rake ID:</span> <strong className="text-white">{train.train_number}</strong></p>
          <p><span className="text-slate-400">Current Bay:</span> <strong className="text-white">Bay #{train.stabling_bay}</strong></p>
          <p><span className="text-slate-400">Current Status:</span> <span className="text-teal-400 font-bold">{train.displayStatus}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Standard Reason Code</label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:border-teal-500 focus:outline-none"
            >
              <option value="UNFORESEEN_DEFECT">🔴 Unforeseen Mechanical/Electrical Defect (High Priority)</option>
              <option value="SHUNTING_OBSTRUCTION">🔴 Depot Track / Shunting Line Obstruction (High Priority)</option>
              <option value="PASSENGER_SURGE">🟡 Peak Hour Passenger Surge / Special Event (Moderate)</option>
              <option value="BRANDING_SLA">🟡 Priority Commercial Branding SLA Fulfillment (Moderate)</option>
              <option value="OTHER_DISCRETION">🟡 Chief Controller Operational Discretion (Low)</option>
            </select>
          </div>

          {/* Dynamic Impact Preview Indicator */}
          <div className={`p-2.5 rounded-lg border text-[11px] font-bold flex justify-between items-center ${
            currentMeta.color === 'RED' 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <span>New Status Output:</span>
            <span className="uppercase tracking-wider font-extrabold">{currentMeta.status}</span>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Controller Notes (Shift Log)</label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide mandatory context for safety audit log..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:border-teal-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg font-extrabold"
            >
              {loading ? 'Logging Audit...' : 'Confirm & Log Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}