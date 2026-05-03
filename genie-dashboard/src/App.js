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
  
  const [priorityQueue, setPriorityQueue] = useState(() => {
    const saved = localStorage.getItem('genie_priority_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    localStorage.setItem('genie_priority_queue', JSON.stringify(priorityQueue));
  }, [priorityQueue]);

  useEffect(() => {
    socket.on('telemetry', (data) => handleNewEvent(data));
    return () => socket.off('telemetry');
  }, []);

  const handleNewEvent = (data) => {
    setEvents(prev => [data, ...prev].slice(0, 8));
    
    if (data.prediction === "CRITICAL") {
      setPriorityQueue(prev => {
        if (prev.find(item => item.id === data.id)) return prev;
        return [data, ...prev];
      });
    }

    setStats(prev => ({
      total: prev.total + 1,
      reliability: data.reliability,
      critical: data.prediction === "CRITICAL" ? prev.critical + 1 : prev.critical
    }));
  };

  const resolveRecord = (id) => {
    setPriorityQueue(prev => prev.filter(item => item.id !== id));
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
              <h5 className="card-category text-info uppercase tracking-widest text-[11px]">FAULT FORECASTER - v1</h5>
              <h2 className="card-title text-white font-light text-3xl uppercase">PROJECT GENIE</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 w-full">
            <StatCard label="Total Records" val={stats.total} icon={Cpu} color="primary" />
            <StatCard label="Fleet Reliability" val={stats.reliability} icon={Activity} color="info" />
            <StatCard label="AI Flagged" val={stats.critical} icon={Shield} color="success" />
            <StatCard label="System Status" val={priorityQueue.length > 0 ? "ATTENTION" : "STABLE"} icon={AlertTriangle} color="warning" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8 w-full">
            <div className="row mt-8 w-full">
              <div className="card shadow-lg p-5 w-full min-h-[400px]">
                {/* Always display the component; internal logic should handle the headers */}
                <SupportQueue events={currentCriticalRows} onResolve={resolveRecord} />
                
                {priorityQueue.length > 0 ? (
                  totalPages > 1 && (
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