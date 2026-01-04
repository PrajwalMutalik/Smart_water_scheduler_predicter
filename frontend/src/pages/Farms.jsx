import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
    Plus, MapPin, Droplets, ArrowRight, X, Sprout, Trash2, Loader, AlertTriangle 
} from 'lucide-react';

const Farms = () => {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Form State
    const [newFarm, setNewFarm] = useState({
        name: '', 
        lat: '', 
        lon: '', 
        crop: '', 
        region: '',
        plot_area: '', 
        pump_flow: ''
    });

    useEffect(() => {
        fetchFarms();
    }, []);

    const fetchFarms = async () => {
        setLoading(true);
        try {
            const response = await api.get('/farms/');
            setFarms(response.data);
            setError('');
        } catch (error) {
            console.error("Failed to fetch farms", error);
            setError('Failed to load farms. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddFarm = async (e) => {
        e.preventDefault();
        try {
             const payload = {
                ...newFarm,
                lat: parseFloat(newFarm.lat),
                lon: parseFloat(newFarm.lon),
                plot_area: parseFloat(newFarm.plot_area),
                pump_flow: parseFloat(newFarm.pump_flow)
             };
             await api.post('/farms/', payload);
             setShowModal(false);
             setNewFarm({ name: '', lat: '', lon: '', crop: '', region: '', plot_area: '', pump_flow: '' });
             fetchFarms();
        } catch (error) {
             console.error("Failed to add farm", error);
             alert("Failed to add farm. Please check your inputs.");
        }
    };

    const handleDeleteFarm = async (e, farmId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this farm? This action cannot be undone.")) return;
        
        try {
            const id = farmId; // Handle both _id and id if needed
            await api.delete(`/farms/${id}`);
            fetchFarms();
        } catch (error) {
            console.error("Failed to delete farm", error);
            alert("Failed to delete farm.");
        }
    };

    // Auto-fill location
    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setNewFarm(prev => ({
                        ...prev,
                        lat: position.coords.latitude.toFixed(6),
                        lon: position.coords.longitude.toFixed(6)
                    }));
                },
                (error) => {
                    alert("Unable to retrieve location. Please enter manually.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white">My Fields</h1>
                    <p className="text-slate-400">Manage your active monitoring locations</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-neon-green text-obsidian-950 px-5 py-3 rounded-xl font-bold hover:bg-neon-green/90 transition-colors shadow-lg shadow-neon-green/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add New Farm</span>
                </button>
            </div>

            {error && (
                <div className="bg-neon-rose/10 border border-neon-rose/20 text-neon-rose p-4 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                     <Loader className="w-8 h-8 text-slate-500 animate-spin" />
                </div>
            ) : farms.length === 0 ? (
                <div className="bg-obsidian-900/50 border border-white/5 border-dashed rounded-3xl p-16 text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500 mb-4">
                        <Sprout className="w-10 h-10" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">No farms configured</h3>
                        <p className="text-slate-400 max-w-md mx-auto text-lg">
                            Add a farm to initialize the decision engine. We'll start tracking local weather and soil conditions immediately.
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="text-neon-blue font-bold hover:underline flex items-center justify-center gap-2 mx-auto"
                    >
                        Register your first field <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {farms.map((farm) => (
                        <div 
                            key={farm._id || farm.id}
                            onClick={() => navigate(`/farms/${farm._id || farm.id}`)}
                            className="group relative bg-obsidian-900 border border-white/5 rounded-2xl p-6 cursor-pointer hover:border-neon-blue/30 transition-all hover:bg-slate-800/50 hover:-translate-y-1"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => handleDeleteFarm(e, farm._id || farm.id)}
                                    className="p-2 text-slate-500 hover:text-neon-rose transition-colors bg-obsidian-950 rounded-lg border border-white/10"
                                    title="Delete Farm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-neon-green">
                                    <Sprout className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg leading-tight mb-1">{farm.name}</h3>
                                    <div className="flex items-center gap-1 text-slate-400 text-sm">
                                        <MapPin className="w-3 h-3" />
                                        {farm.region || 'Unknown Region'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-obsidian-950/50 p-3 rounded-xl border border-white/5">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Crop</p>
                                    <p className="text-white font-medium">{farm.crop}</p>
                                </div>
                                <div className="bg-obsidian-950/50 p-3 rounded-xl border border-white/5">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Area</p>
                                    <p className="text-white font-medium">{farm.plot_area} ac</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <span className="text-sm font-bold text-slate-500 group-hover:text-neon-blue transition-colors">
                                    Open Dashboard
                                </span>
                                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-neon-blue group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))}
                 </div>
            )}

            {/* Add Farm Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                   <div className="bg-obsidian-900 border border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-fade-in relative overflow-hidden">
                       <div className="flex justify-between items-center mb-6">
                          <div>
                              <h3 className="text-2xl font-display font-bold text-white">Add New Field</h3>
                              <p className="text-slate-400 text-sm">Configure parameters for the AI engine.</p>
                          </div>
                          <button onClick={() => setShowModal(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                          </button>
                       </div>
                       
                       <form onSubmit={handleAddFarm} className="space-y-4 relative z-10">
                          <div className="space-y-1">
                             <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Field Name</label>
                             <input 
                               className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none transition-all placeholder:text-slate-600"
                               placeholder="e.g. North Sector A"
                               required
                               value={newFarm.name}
                               onChange={e => setNewFarm({...newFarm, name: e.target.value})}
                             />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                               <div className="flex justify-between items-center mb-1">
                                   <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Latitude</label>
                                   <button type="button" onClick={handleGetLocation} className="text-[10px] text-neon-blue hover:underline cursor-pointer">
                                       Get Current
                                   </button>
                               </div>
                               <input type="number" step="any" required className="glass-input w-full rounded-xl px-4 py-3 bg-slate-800/50 border border-slate-700 text-white" placeholder="12.9" value={newFarm.lat} onChange={e => setNewFarm({...newFarm, lat: e.target.value})} />
                             </div>
                             <div>
                               <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1 block">Longitude</label>
                               <input type="number" step="any" required className="glass-input w-full rounded-xl px-4 py-3 bg-slate-800/50 border border-slate-700 text-white" placeholder="77.5" value={newFarm.lon} onChange={e => setNewFarm({...newFarm, lon: e.target.value})} />
                             </div>
                          </div>
        
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1 block">Crop Type</label>
                               <select 
                                 className="glass-input w-full rounded-xl px-4 py-3 bg-slate-800/50 border border-slate-700 text-white appearance-none" 
                                 required
                                 value={newFarm.crop}
                                 onChange={e => setNewFarm({...newFarm, crop: e.target.value})}
                               >
                                 <option value="">Select...</option>
                                 <option value="Wheat">Wheat</option>
                                 <option value="Rice">Rice</option>
                                 <option value="Corn">Corn</option>
                                 <option value="Tomato">Tomato</option>
                                 <option value="Potato">Potato</option>
                                 <option value="Sugarcane">Sugarcane</option>
                               </select>
                             </div>
                             <div>
                               <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1 block">Region</label>
                               <input required className="glass-input w-full rounded-xl px-4 py-3 bg-slate-800/50 border border-slate-700 text-white" placeholder="Karnataka" value={newFarm.region} onChange={e => setNewFarm({...newFarm, region: e.target.value})} />
                             </div>
                          </div>
        
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1 block">Area (Acres)</label>
                               <input type="number" step="0.1" required className="glass-input w-full rounded-xl px-4 py-3 bg-slate-800/50 border border-slate-700 text-white" placeholder="5.0" value={newFarm.plot_area} onChange={e => setNewFarm({...newFarm, plot_area: e.target.value})} />
                             </div>
                             <div>
                               <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1 block">Pump (L/min)</label>
                               <input type="number" required className="glass-input w-full rounded-xl px-4 py-3 bg-slate-800/50 border border-slate-700 text-white" placeholder="100" value={newFarm.pump_flow} onChange={e => setNewFarm({...newFarm, pump_flow: e.target.value})} />
                             </div>
                          </div>
        
                          <button type="submit" className="w-full py-4 bg-neon-blue hover:bg-neon-blue/90 text-white font-bold rounded-xl mt-4 shadow-lg shadow-neon-blue/20 transition-all">
                            Register Field
                          </button>
                       </form>
                   </div>
                </div>
            )}
        </div>
    );
};

export default Farms;
