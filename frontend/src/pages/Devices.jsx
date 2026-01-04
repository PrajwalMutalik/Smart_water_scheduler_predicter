import React from 'react';
import { MonitorSmartphone, Wifi } from 'lucide-react';

const Devices = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 text-center">
      <div className="w-24 h-24 bg-gradient-to-tr from-slate-800 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/5 relative">
        <div className="absolute inset-0 bg-neon-blue/20 blur-xl rounded-full"></div>
        <MonitorSmartphone className="w-10 h-10 text-white relative z-10" />
      </div>
      
      <h1 className="text-3xl font-display font-bold text-white mb-3">Device Management</h1>
      <p className="text-slate-400 max-w-lg mx-auto mb-10 text-lg">
        No active controllers found. The platform is ready to pair with supported MQTT irrigation valves.
      </p>
      
      <button className="px-8 py-3 bg-slate-800 text-slate-500 font-semibold rounded-xl border border-white/5 cursor-not-allowed flex items-center gap-3 mx-auto">
        <Wifi className="w-5 h-5" /> Scan for Gateway
      </button>
    </div>
  );
};

export default Devices;
