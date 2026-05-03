import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Activity, Shield, Cpu, AlertTriangle } from 'lucide-react';
import PerformanceChart from './components/PerformanceChart';
import SupportQueue from './components/SupportQueue';
import EventStream from './components/EventStream';
import './App.css';

const socket = io('http://localhost:4001', { transports: ['websocket'] });

const App = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ total: 0, reliability: '100%', critical: 0 });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    socket.on('telemetry', (data) => handleNewEvent(data));
    return () => socket.off('telemetry');
  }, []);

  const handleNewEvent = (data) => {
    // Limits the event stream to the 8 most recent rows
    setEvents(prev => [data, ...prev].slice(0, 8));
    
    setStats(prev => ({
      total: prev.total + 1,
      reliability: data.reliability,
      critical: data.prediction === "CRITICAL" ? prev.critical + 1 : prev.critical
    }));
  };

  // Pagination Logic
  const criticalEvents = events.filter(e => e.prediction === "CRITICAL");
  const totalPages = Math.ceil(criticalEvents.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentCriticalRows = criticalEvents.slice(indexOfFirstRow, indexOfLastRow);

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
            <StatCard label="System Status" val={stats.critical > 0 ? "ATTENTION" : "STABLE"} icon={AlertTriangle} color="warning" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8 w-full">
            <div className="row mt-8 w-full">
              <div className="card shadow-lg p-5 w-full">
                <SupportQueue events={currentCriticalRows} />
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 px-4 text-slate-400 text-sm">
                    <span>Page {currentPage} of {totalPages}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-800 rounded disabled:opacity-30"
                      >
                        Previous
                      </button>
                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-gray-800 rounded disabled:opacity-30"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div> 
          </div>
        
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
            <div className="lg:col-span-2">
              <PerformanceChart events={events} />
            </div>
            <div className="lg:col-span-1">
              <EventStream events={events} />
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