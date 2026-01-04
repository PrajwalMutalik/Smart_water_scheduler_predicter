import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Sprout, Wind, ArrowRight, 
  MapPin, CloudRain, CheckCircle2, AlertOctagon
} from 'lucide-react';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { weather } = useOutletContext() || { weather: { temp: '--', condition: 'Data Unavailable', humidity: '--', wind: '--' } };
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await api.get('/farms/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-12 text-slate-400">Loading system summary...</div>;
  }

  if (!summary) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-7xl mx-auto">
      
      {/* 1. Real-Time Environment Summary (Hero) */}
      <section className="relative rounded-3xl overflow-hidden p-8 border border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-hero-glow opacity-30 blur-3xl animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian-900/90 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 text-neon-blue font-medium mb-2">
               <MapPin className="w-4 h-4" /> <span>Local Environment (GPS)</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">
              {weather.condition}
            </h1>
            <p className="text-slate-400">Real-time analysis based on satellite telemetry.</p>
          </div>

          <div className="flex items-center gap-8 bg-obsidian-950/40 backdrop-blur-md p-4 rounded-2xl border border-white/5">
             <div className="text-center px-4 border-r border-white/10">
                <p className="text-3xl font-bold text-white mb-1">{weather.temp}°</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Temp</p>
             </div>
             <div className="text-center px-4 border-r border-white/10">
                <div className="flex items-center justify-center gap-1 text-neon-blue mb-1">
                   <CloudRain className="w-5 h-5" />
                   <span className="text-xl font-bold">{weather.humidity}%</span>
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Humidity</p>
             </div>
             <div className="text-center px-4">
                <div className="flex items-center justify-center gap-1 text-neon-green mb-1">
                   <Wind className="w-5 h-5" />
                   <span className="text-xl font-bold">{weather.wind}</span>
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Wind (km/h)</p>
             </div>
          </div>
        </div>
      </section>

      {/* 2. System Status & Alerts */}
      <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-6">
              <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4">System Health</h3>
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green">
                      <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-white font-bold text-lg">{summary.system_status}</p>
                      <p className="text-slate-500 text-sm">Monitoring {summary.active_farms} active farms</p>
                  </div>
              </div>
          </div>

          <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-6">
              <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4">Pending Actions</h3>
              <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${summary.pending_actions > 0 ? 'bg-neon-rose/10 text-neon-rose' : 'bg-slate-800 text-slate-500'}`}>
                      <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-white font-bold text-lg">{summary.pending_actions} Events Needing Review</p>
                      <p className="text-slate-500 text-sm">Farms awaiting daily acknowledgement</p>
                  </div>
              </div>
          </div>
      </div>

      {/* 3. Farms Needing Action Today */}
      <section>
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-display font-bold text-white">Action Required Today</h2>
             {summary.pending_actions === 0 && (
                 <span className="text-neon-green text-sm font-bold flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4" /> All caught up
                 </span>
             )}
          </div>

          {summary.farms_needing_action.length === 0 ? (
              <div className="bg-obsidian-900/50 border border-white/5 border-dashed rounded-2xl p-12 text-center">
                  <Sprout className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-400">No pending actions for today. Check back tomorrow!</p>
                  <button 
                    onClick={() => navigate('/farms')}
                    className="mt-4 text-neon-blue hover:text-white transition-colors text-sm font-bold"
                  >
                    View All Farms
                  </button>
              </div>
          ) : (
              <div className="grid gap-4">
                  {summary.farms_needing_action.map(farm => (
                      <div 
                        key={farm.id}
                        onClick={() => navigate(`/farms/${farm.id}`)}
                        className="group flex items-center justify-between bg-obsidian-900 border-l-4 border-neon-rose p-6 rounded-r-2xl cursor-pointer hover:bg-slate-800 transition-colors"
                      >
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-neon-rose/10 text-neon-rose rounded-xl">
                                  <AlertOctagon className="w-6 h-6" />
                              </div>
                              <div>
                                  <h3 className="text-lg font-bold text-white">{farm.name}</h3>
                                  <p className="text-slate-500 text-sm">{farm.location} • {farm.status}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 group-hover:text-neon-rose transition-colors">
                              <span className="text-sm font-medium">Review Advice</span>
                              <ArrowRight className="w-4 h-4" />
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </section>

    </div>
  );
};

export default Dashboard;
