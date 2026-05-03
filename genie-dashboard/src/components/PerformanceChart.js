import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PerformanceChart = ({ events }) => {
  // Use 'health' from your consumer payload for the chart data
  const data = events.slice(0, 10).reverse().map((e, i) => ({
    name: e.timestamp,
    val: parseInt(e.health)
  }));

  return (
    <div className="card p-6 min-h-[400px]">
      <h4 className="text-slate-400 text-sm uppercase mb-6">System Performance (Health %)</h4>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1d8cf8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#1d8cf8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2b3553" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9a9a9a', fontSize: 10}} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#9a9a9a', fontSize: 10}} />
            <Tooltip contentStyle={{backgroundColor: '#27293d', border: 'none'}} />
            <Area type="monotone" dataKey="val" stroke="#1d8cf8" strokeWidth={3} fill="url(#colorHealth)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;