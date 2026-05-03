import React from 'react';

const EventStream = ({ events }) => (
  <div className="card p-6 h-full">
    <h3 className="text-[11px] font-bold text-white uppercase tracking-widest mb-6">Device Event Stream</h3>
    <div className="space-y-3 font-mono text-[11px]">
      {events.map((log, i) => (
        <div key={i} className="flex justify-between items-center border-b border-slate-800 pb-2">
          <div className="flex gap-2">
            <span className="text-slate-600">[{log.timestamp}]</span>
            <span className="text-purple-400 font-bold">{log.device_id}</span>
            <span className={log.prediction === 'CRITICAL' ? 'text-pink-500' : 'text-emerald-500'}>
              {log.prediction}
            </span>
          </div>
          <span className="text-blue-500/80">{log.health}</span>
        </div>
      ))}
    </div>
  </div>
);

export default EventStream;