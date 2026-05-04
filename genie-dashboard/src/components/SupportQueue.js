import React from 'react';

const SupportQueue = ({ events, onResolve }) => (
  <div className="card p-6">
    <div className="card-header mb-6">
       <h4 className="text-slate-400 text-sm uppercase mb-6">Priority Support Queue</h4>
    </div>
    <div className="table-responsive">
      <table className="w-full text-left">
        <thead className="text-primary text-[10px] uppercase font-bold border-b border-slate-700/50">
          <tr>
            <th className="pb-4">Device ID</th>
            <th className="pb-4">Health</th>
            <th className="pb-4">Severity</th>
            <th className="pb-4">Leading Indicator</th>
            <th className="pb-4">MTTR</th>
            <th className="pb-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {events.map((event, i) => (
  <tr key={i} className="border-b border-slate-700/20 hover:bg-white/5 transition-all">
    <td className="py-4 text-slate-400 font-mono">{event.device_id}</td>
    <td className="py-4">
      <div className="flex flex-col">
        <span className={`text-[10px] mb-1 font-bold ${parseInt(event.health) < 40 ? 'text-pink-500' : 'text-orange-400'}`}>
          {event.health}% RISK
        </span>
        <div className="w-32 h-1 bg-slate-800 rounded-full">
          {/* Ensure width is mapped to health percentage */}
          <div className="h-full bg-primary" style={{ width: `${event.health}%` }}></div>
        </div>
      </div>
    </td>
    {/* Mapping Urgency */}
    <td className={`py-4 font-bold text-[10px] ${event.urgency === 'URGENT' ? 'text-pink-500' : 'text-warning'}`}>
      {event.urgency}
    </td>
    {/* Mapping Leading Indicator */}
    <td className="py-4 text-info font-mono text-xs">
      {event.leading_indicator || 'N/A'}
    </td>
    {/* Mapping MTTR[cite: 2] */}
    <td className="py-4 text-slate-500 font-mono text-xs">
      {event.mttr || '0h'}
    </td>
    <td className="py-4 text-right">
      <button 
        onClick={() => onResolve(event.device_id)}
        className="btn-resolve text-[10px] uppercase font-bold border border-success text-success px-4 py-1 rounded hover:bg-success hover:text-white transition-all"
      >
        Resolve
      </button>
    </td>
  </tr>
))}
        </tbody>
      </table>
    </div>
  </div>
);

export default SupportQueue;