import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { LineChart, LayoutDashboard, Brain, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const Insights = () => {
  const [farmsData, setFarmsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await api.get('/farms/');
      const farms = response.data;
      
      const insights = await Promise.all(farms.map(async (farm) => {
         const id = farm._id || farm.id;
         try {
           const res = await api.get(`/farms/${id}/analytics`);
           return { name: farm.name, ...res.data };
         } catch (e) { return null; }
      }));
      setFarmsData(insights.filter(i => i !== null));
    } catch (error) {
      console.error(error);
    } finally {
       setLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading Intelligence...</div>;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-display font-bold text-white mb-2">System Intelligence</h1>
        <p className="text-slate-400">Real-time calibration status for your monitored locations.</p>
      </div>

      {farmsData.length === 0 ? (
         <div className="text-center p-12 glass-panel rounded-3xl border-dashed border-slate-700">
           <p className="text-slate-500">No active systems to analyze.</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {farmsData.map((data, idx) => (
             <div key={idx} className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-neon-blue/30 transition-all">
               <div className="absolute top-0 right-0 p-32 bg-neon-blue/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-neon-blue/10 transition-all"></div>
               
               <div className="flex justify-between items-center mb-6 relative z-10">
                  <h3 className="font-bold text-xl text-white">{data.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                     data.system_state.calibration_status === 'Calibrated' 
                     ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                     : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {data.system_state.calibration_status}
                  </span>
               </div>
               
               <div className="space-y-4 relative z-10">
                 <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-sm text-slate-400 flex items-center gap-2">
                       <Brain className="w-4 h-4 text-neon-blue" /> Confidence Model
                    </span>
                    <span className="font-bold text-white">{data.system_state.confidence_level}</span>
                 </div>
                 
                 <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-sm text-slate-400 flex items-center gap-2">
                       <LayoutDashboard className="w-4 h-4 text-neon-green" /> Data Points
                    </span>
                    <span className="font-bold text-white">{data.system_state.data_points} events</span>
                 </div>

                 <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400 flex items-center gap-2">
                       <Activity className="w-4 h-4 text-neon-amber" /> Learning Trend
                    </span>
                    <span className="text-xs text-slate-500 italic">
                      {data.system_state.confidence_level > 0.8 ? 'Stable & Optimized' : 
                       data.system_state.confidence_level > 0.3 ? 'improving accuracy' : 
                       'Insufficient Data'}
                    </span>
                 </div>
               </div>
             </div>
           ))}
         </div>
      )}
    </div>
  );
};

export default Insights;
