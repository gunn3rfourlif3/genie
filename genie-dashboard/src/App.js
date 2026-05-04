import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Activity, Shield, Cpu, AlertTriangle, CheckCircle } from 'lucide-react';
import PerformanceChart from './components/PerformanceChart';
import SupportQueue from './components/SupportQueue';
import EventStream from './components/EventStream';
import './App.css';

const socket = io('http://localhost:4001', { transports: ['websocket'] });


const App = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ total: 0, reliability: '100%', critical: 0 });
  const [timeRange, setTimeRange] = useState('week'); // Default toggle state
  
  const [priorityQueue, setPriorityQueue] = useState(() => {
    const saved = localStorage.getItem('genie_priority_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const reliability = parseFloat(stats.reliability || 0);
const queueDepth = priorityQueue.length;
const aiFlags = stats.critical || 0;

  useEffect(() => {
    localStorage.setItem('genie_priority_queue', JSON.stringify(priorityQueue));
  }, [priorityQueue]);

  useEffect(() => {
    socket.on('telemetry', (data) => handleNewEvent(data));
    return () => socket.off('telemetry');
  }, []);

    const handleNewEvent = (data) => {
  setEvents(prev => {
    const newEvents = [data, ...prev].slice(0, 100);
    
    // Calculate Fleet Reliability (Average Health of last 100 events)
    const totalHealth = newEvents.reduce((sum, event) => sum + parseInt(event.health || 0), 0);
    const avgHealth = newEvents.length > 0 ? (totalHealth / newEvents.length).toFixed(1) : 100;

    setStats(prevStats => ({
      ...prevStats,
      total: prevStats.total + 1,
      reliability: `${avgHealth}%`, // Update the reliability string
      critical: data.prediction === "CRITICAL" ? prevStats.critical + 1 : prevStats.critical
    }));

    return newEvents;
  });

  // Keep your existing Priority Queue logic here
  const healthValue = parseInt(data.health);
  if (healthValue < 50) {
    setPriorityQueue(prev => {
      if (prev.find(item => item.device_id === data.device_id)) {
        return [data, ...prev.filter(item => item.device_id !== data.device_id)];
      }
      return [data, ...prev];
    });
  }
};

  const resolveRecord = (id) => {
  setPriorityQueue(prev => prev.filter(item => item.device_id !== id));
};

// Inside the App component, before the return statement
const getFilteredChartData = () => {
  const data = [...events].reverse(); // Oldest to newest
  
  if (timeRange === 'week') {
    // 1:1 Scale - Show the last 20 pulses exactly as they happened
    return data.slice(-20);
  } 
  
  if (timeRange === 'month') {
    // 1:2 Scale - Take every 2nd pulse from the last 40 pulses
    // This makes the line look "longer" and more compressed
    return data.slice(-40).filter((_, i) => i % 2 === 0);
  } 
  
  if (timeRange === 'year') {
    // 1:5 Scale - Take every 5th pulse from the entire 100-pulse buffer
    // This creates a "Historical" look even with limited local data
    return data.filter((_, i) => i % 5 === 0);
  }

  return data.slice(-20);
};

const getNetworkStatus = () => {
 const reliability = parseFloat(stats.reliability); // Current dynamic reliability
  const queueDepth = priorityQueue.length; // Number of items < 65 health
  const aiFlags = stats.critical; // Count of 'CRITICAL' predictions

  // 1. CRITICAL: AI-detected failure or dangerously low reliability
  if (aiFlags > 0 || reliability < 50) return "CRITICAL"; 
  
  // 2. DEGRADED: Significant queue or dropping reliability
  if (reliability < 75 || queueDepth > 50) return "DEGRADED"; 
  
  // 3. STABLE: Active processing with manageable queue
  if (queueDepth > 0) return "STABLE"; 
  
  // 4. OPTIMAL: Clean slate, high reliability
  return "OPTIMAL";
};

  const totalPages = Math.ceil(priorityQueue.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentCriticalRows = priorityQueue.slice(indexOfFirstRow, indexOfLastRow);

  return (
    <div className="dashboard-wrapper w-full">
      <div className="main-panel w-full">
        <div className="content w-full px-4">
          <div className="row mb-4">
            <div className="col-12 text-left">
              <h5 className="card-category text-info uppercase tracking-widest text-[11px]">Genie AI Pipeline v1</h5>
              <h2 className="card-title text-white font-light text-3xl uppercase">PROJECT GENIE</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 w-full">
            <StatCard label="Total Records" val={stats.total} icon={Cpu} color="primary" />
            <StatCard label="Fleet Reliability" val={stats.reliability} icon={Activity} color="info" />
            <StatCard label="AI Flagged" val={stats.critical} icon={Shield} color="success" />
            <StatCard label="System State" val={getNetworkStatus()} icon={Cpu} color={aiFlags > 0 || reliability < 50 ? "pink-500" : (reliability < 75 ? "warning" : (queueDepth > 0 ? "info" : "success"))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8 w-full">
            <div className="row mt-8 w-full">
              <div className="card shadow-lg p-5 w-full min-h-[400px]">
                <SupportQueue events={currentCriticalRows} onResolve={resolveRecord} />
                {priorityQueue.length > 0 ? (
  totalPages > 1 && (
    /* Changed justify-between to justify-center and flex-col for better vertical alignment */
    <div className="flex flex-col items-center justify-center mt-6 px-4 text-slate-400 text-sm gap-3">
      <div className="flex gap-4 items-center">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
          disabled={currentPage === 1} 
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <span className="font-mono tracking-widest text-info">
          PAGE {currentPage} / {totalPages}
        </span>

        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
          disabled={currentPage === totalPages} 
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">
        Priority Support Records: {priorityQueue.length}
      </p>
    </div>
  )
                ) : (
                  <div className="text-center py-20 border-t border-gray-800">
                    <CheckCircle className="mx-auto mb-4 text-success w-12 h-12 opacity-50" />
                    <h3 className="text-white text-xl font-light">All Systems Clear</h3>
                    <p className="text-slate-500 text-sm">No critical priority events requiring attention.</p>
                  </div>
                )}
              </div>
            </div> 
          </div>
        
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full mt-8">
            <div className="lg:col-span-2 card shadow-lg p-5">
  <div className="flex justify-between items-center mb-4">
    <h4 className="text-white font-light uppercase tracking-wider text-sm">Network Performance</h4>
    <div className="flex bg-gray-900 rounded-lg p-1 gap-1">
      {['week', 'month', 'year'].map((range) => (
        <button
          key={range}
          onClick={() => setTimeRange(range)}
          className={`px-3 py-1 text-[10px] uppercase rounded-md transition-all ${
            timeRange === range ? 'bg-info text-white' : 'text-slate-500 hover:text-white'
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  </div>
  
  {/* The 'key' prop here is the secret sauce for fixing the toggle */}
  <PerformanceChart 
    key={`chart-${timeRange}`} 
    events={getFilteredChartData()} 
    range={timeRange} 
  />
</div>
            <div className="lg:col-span-1">
              {/* Force EventStream to only show 8 rows despite larger events state */}
              <EventStream events={events.slice(0, 8)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, val, icon: Icon, color }) => (
  <div className="card shadow-lg p-5">
    <div className="flex justify-between items-start">
      <div className="text-left">
        <p className="card-category text-[10px] text-slate-500 uppercase font-bold">{label}</p>
        <h3 className="card-title text-white text-2xl font-light">{val}</h3>
      </div>
      <div className={`icon-circle bg-${color} p-2 rounded-md bg-opacity-10`}>
        <Icon className={`text-${color} w-6 h-6`} />
      </div>
    </div>
  </div>
);

export default App;