import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, CloudRain, Thermometer, Droplets, Clock, 
  AlertTriangle, CheckCircle, Wind, Layers, BarChart3, Navigation
} from 'lucide-react';


const FarmDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdvice();
  }, [id]);

  const fetchAdvice = async () => {
    try {
      const [adviceRes, analyticsRes] = await Promise.all([
        api.get(`/farms/${id}/advice`),
        api.get(`/farms/${id}/analytics`)
      ]);
      setData({ ...adviceRes.data, analytics: analyticsRes.data });
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian-950">
      <div className="w-10 h-10 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!data || !data.advice) return <div className="text-white p-12 text-center">Data Unavailable</div>;

  const { advice, analytics } = data;
  const history = analytics?.history || [];
  
  const weather = advice.weather || { temperature: '--', rain_probability: '--', wind: '--' };
  const soil = advice.soil || { type: 'Unknown', source: 'Unavailable' };
  const rec = advice.recommendation || { action: 'UNKNOWN', reason: 'Analyzing...' };
  const schedule = advice.schedule || { duration_minutes: 0, volume_liters: 0 };
  const location = advice.location || { lat: 0, lon: 0 };
  
  const isIrrigate = rec.action === 'IRRIGATE';

  const handleComplete = async () => {
    if (!window.confirm("Confirm irrigation completion?")) return;
    try {
      await api.post(`/farms/${id}/acknowledge_irrigation`, null, {
          params: { volume: schedule.volume_liters || 0 }
      });
      fetchAdvice(); // Refresh state
    } catch (e) {
      console.error(e);
      alert("Failed to update");
    }
  };

  const handleSkip = async () => {
    if (!window.confirm("Skip irrigation for today? This will increase water demand for tomorrow.")) return;
    try {
      await api.post(`/farms/${id}/skip_irrigation`);
      fetchAdvice(); // Refresh state (will likely show Monitor or same state but we treat as handled)
    } catch (e) {
      console.error(e);
      alert("Failed to skip");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Command Center</span>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs text-slate-400">
           <Navigation className="w-3 h-3 text-neon-blue" />
           {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
        </div>
      </div>

      {/* Hero: Action Center */}
      <section className={`
        relative rounded-3xl p-8 lg:p-12 overflow-hidden border transition-all duration-500
        ${isIrrigate ? 'border-neon-blue/40 shadow-[0_0_50px_-12px_rgba(14,165,233,0.3)]' : 'border-neon-green/30 shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)]'}
      `}>
          <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${isIrrigate ? 'from-neon-blue to-transparent' : 'from-neon-green to-transparent'}`}></div>
          <div className="absolute inset-0 bg-obsidian-900/80 backdrop-blur-sm"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
             <div>
                <div className="flex items-center gap-3 mb-3">
                   {isIrrigate ? <Droplets className="w-8 h-8 text-neon-blue animate-bounce" /> : <CheckCircle className="w-8 h-8 text-neon-green" />}
                   <span className={`text-sm font-bold tracking-widest uppercase ${isIrrigate ? 'text-neon-blue' : 'text-neon-green'}`}>
                     System Recommendation
                   </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                  {rec.action.replace('_', ' ')}
                </h1>
                <p className="text-lg text-slate-300 max-w-xl border-l-2 border-white/20 pl-4 py-1">
                  {advice?.water_demand?.reason}
                </p>
                
                {isIrrigate && (
                   <div className="flex gap-4 mt-6">
                     <button 
                       onClick={handleComplete}
                       className="px-6 py-3 bg-neon-blue text-white font-bold rounded-xl shadow-lg shadow-neon-blue/20 hover:bg-neon-blue/90 transition-all flex items-center gap-2"
                     >
                       <CheckCircle className="w-5 h-5" /> Mark as Completed
                     </button>
                     <button 
                       onClick={handleSkip}
                       className="px-6 py-3 bg-transparent border border-white/20 text-slate-300 font-bold rounded-xl hover:bg-white/5 transition-all flex items-center gap-2"
                     >
                        Skip Today <ArrowRight className="w-4 h-4 ml-1" />
                     </button>
                   </div>
                )}
             </div>

             {isIrrigate && (
                <div className="bg-obsidian-950/80 border border-neon-blue/30 rounded-2xl p-6 min-w-[240px] text-center shadow-2xl">
                   <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Target Duration</p>
                   <div className="text-5xl font-display font-bold text-white mb-1">
                      {Math.floor(schedule.duration_minutes / 60) > 0 
                        ? <>{Math.floor(schedule.duration_minutes / 60)}<span className="text-xl text-slate-500 ml-1">h</span> {schedule.duration_minutes % 60}<span className="text-xl text-slate-500 ml-1">m</span></>
                        : <>{schedule.duration_minutes}<span className="text-xl text-slate-500 ml-1">m</span></>
                      }
                   </div>
                   <div className="h-px w-20 bg-white/10 mx-auto my-3"></div>
                   <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-500">Volume</span>
                      <span className="font-bold text-neon-blue">{schedule.volume_liters} L</span>
                   </div>
                   
                   {schedule.start_time && (
                     <div className="bg-slate-900/50 rounded-lg p-2 mt-3 text-left">
                        <div className="flex justify-between items-center text-sm mb-1">
                             <span className="text-slate-400">Start</span>
                             <span className="text-white font-mono">{schedule.start_time}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                             <span className="text-slate-400">End</span>
                             <span className="text-white font-mono">{schedule.end_time}</span>
                        </div>
                        {schedule.strategy && (
                             <div className="text-[10px] text-center mt-2 text-neon-amber uppercase font-bold tracking-wider">
                                 Strategy: {schedule.strategy}
                             </div>
                        )}
                     </div>
                   )}
                </div>
             )}
          </div>
      </section>

      {/* HUD Grid: Environmental Telemetry */}
      <h2 className="text-xl font-display font-semibold text-white mt-8 pl-2 border-l-4 border-neon-blue">Live Telemetry</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
             label="Temperature" 
             value={`${weather.temperature}°C`} 
             sub="Open-Meteo" 
             icon={Thermometer} 
             color="text-neon-amber"
          />
          <MetricCard 
             label="Rain Probability" 
             value={`${weather.rain_probability}%`} 
             sub="Next 24 Hours" 
             icon={CloudRain} 
             color="text-neon-blue"
          />
           <MetricCard 
             label={weather.soil_moisture_index !== undefined ? "Soil Moisture" : "Soil Texture"} 
             value={weather.soil_moisture_index !== undefined ? `${(weather.soil_moisture_index * 100).toFixed(0)}%` : soil.type} 
             sub={weather.soil_moisture_index !== undefined ? "Real-Time (depth 3-9cm)" : "ISRIC Grids"} 
             icon={Layers} 
             color="text-emerald-400"
          />
           <MetricCard 
             label="Wind Speed" 
             value={`${weather.wind} km/h`} 
             sub="Gusts < 20km/h" 
             icon={Wind} 
             color="text-slate-400"
          />
      </div>

      {/* Verification & Trust */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
         <div className="glass-panel rounded-2xl p-6 border border-white/5 bg-slate-900/40">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Why this recommendation?</h3>
            <p className="text-lg text-white leading-relaxed">
               {advice?.water_demand?.reason || "System is processing daily variables."}
            </p>
         </div>

         <div className="glass-panel rounded-2xl p-6 border border-white/5 bg-slate-900/40 flex flex-col justify-center text-center">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">System Confidence</div>
            <div className="text-4xl font-display font-bold text-white mb-1">
               {((rec.confidence_score || 0) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-slate-500">Based on {analytics?.system_state?.data_points || 0} validated events</div>
         </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40">
      <div className="flex justify-between items-start mb-2">
         <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">{label}</span>
         <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-2xl font-display font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-500 font-medium">{sub}</div>
  </div>
);

export default FarmDetail;
