import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client'; 
import { Activity, Shield, Cpu, CheckCircle } from 'lucide-react';
import PerformanceChart from './components/PerformanceChart';
import SupportQueue from './components/SupportQueue';
import EventStream from './components/EventStream';
import './App.css';

// Socket configuration for local and remote environments
const hostname = window.location.hostname || 'localhost';
const socketUrl = hostname === 'localhost' ? 'http://localhost:4001' : `http://${hostname}:4001`;

const App = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ total: 0, reliability: '100%', critical: 0 });
  const [timeRange, setTimeRange] = useState('week');
  
  const [priorityQueue, setPriorityQueue] = useState(() => {
    const saved = localStorage.getItem('genie_priority_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    localStorage.setItem('genie_priority_queue', JSON.stringify(priorityQueue));
  }, [priorityQueue]);

  const handleNewEvent = useCallback((data) => {
    setEvents(prev => {
      // Normalize data to ensure both EventStream and PerformanceChart find their keys[cite: 6]
      const healthVal = data.health_score || data.health || 0;
      const normalizedData = {
        ...data,
        health_score: Number(healthVal),
        health: Number(healthVal),
        value: Number(healthVal),
        timestamp: data.timestamp || new Date().toLocaleTimeString()
      };

      const newEvents = [normalizedData, ...prev].slice(0, 100);
      
      const totalHealth = newEvents.reduce((sum, event) => sum + (event.health_score || 0), 0);
      const avgHealth = newEvents.length > 0 ? (totalHealth / newEvents.length).toFixed(1) : 100;

      setStats(prevStats => ({
        ...prevStats,
        total: prevStats.total + 1,
        reliability: `${avgHealth}%`, // Restored % suffix
        critical: data.prediction === "CRITICAL" ? prevStats.critical + 1 : prevStats.critical
      }));

      return newEvents;
    });

    if (Number(data.health_score || data.health) < 50) {
      setPriorityQueue(prev => {
        if (prev.find(item => item.device_id === data.device_id)) {
          return [data, ...prev.filter(item => item.device_id !== data.device_id)];
        }
        return [data, ...prev];
      });
    }
  }, []);

  useEffect(() => {
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socket.on('telemetry', (data) => data && handleNewEvent(data));
    return () => socket.disconnect();
  }, [handleNewEvent]);

  const resolveRecord = (id) => {
    setPriorityQueue(prev => prev.filter(item => item.device_id !== id));
  };

  const getFilteredChartData = () => {
    return [...events].reverse().slice(-20);
  };

  const getNetworkStatus = () => {
    const rel = parseFloat(stats.reliability);
    if (stats.critical > 0 || rel < 50) return "CRITICAL"; 
    if (rel < 70) return "DEGRADED"; 
    return "OPTIMAL";
  };

  const totalPages = Math.ceil(priorityQueue.length / rowsPerPage);
  const currentCriticalRows = priorityQueue.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="dashboard-wrapper w-full">
      <div className="main-panel w-full">
        <div className="content w-full px-4">
          
          {/* Header with Project Genie styling[cite: 4] */}
          <header className="py-8 text-left">
            <h5 className="text-info uppercase tracking-[0.3em] text-[10px] font-bold">Fault forecasting Pipeline v1</h5>
            <h2 className="text-white font-extralight text-4xl tracking-tighter uppercase">PROJECT <span className="font-bold text-info">GENIE</span></h2>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard label="Total Records" val={stats.total} icon={Cpu} color="primary" />
            <StatCard label="Fleet Reliability" val={stats.reliability} icon={Activity} color="info" />
            <StatCard label="AI Flagged" val={stats.critical} icon={Shield} color="success" />
            <StatCard label="Network State" val={getNetworkStatus()} icon={Cpu} color={getNetworkStatus() === "CRITICAL" ? "pink-500" : "info"} />
          </div>

          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="card shadow-lg p-5 min-h-[300px]">
              <SupportQueue events={currentCriticalRows} onResolve={resolveRecord} />
              
              {priorityQueue.length > 0 ? (
                totalPages > 1 && (
                  <div className="flex items-center justify-center mt-6 gap-4">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                      disabled={currentPage === 1} 
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md disabled:opacity-20"
                    >
                      Previous
                    </button>
                    <span className="font-mono tracking-widest text-info uppercase text-sm">
                      PAGE {currentPage} / {totalPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                      disabled={currentPage === totalPages} 
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md disabled:opacity-20"
                    >
                      Next
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center py-10 border-t border-gray-800">
                  <CheckCircle className="mx-auto mb-2 text-green-500 opacity-50 w-12 h-12" />
                  <h3 className="text-white text-xl font-light">All Systems Clear</h3>
                  <p className="text-slate-500 text-sm">No critical priority events requiring attention.</p>
                </div>
              )}
            </div>
          </div>
        
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
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
              <div className="h-[350px]">
                <PerformanceChart 
                  key={`chart-render-${events.length}`} 
                  events={getFilteredChartData()} 
                />    
              </div>
            </div>
            <div className="lg:col-span-1">
              <EventStream events={events.slice(0, 10)} />
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
        <p className="text-[10px] text-slate-500 uppercase font-bold">{label}</p>
        <h3 className="text-white text-2xl font-light">{val}</h3>
      </div>
      <div className={`icon-circle bg-${color} p-2 rounded-md bg-opacity-10`}>
        <Icon className={`text-${color} w-6 h-6`} />
      </div>
    </div>
  </div>
);

export default App;