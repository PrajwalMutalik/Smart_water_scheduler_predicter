import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Sprout, BarChart3, Settings, LogOut, 
  Menu, X, MapPin, Droplets, Calendar 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/farms', label: 'Farms', icon: Sprout },
    { to: '/history', label: 'History', icon: Calendar },
    { to: '/insights', label: 'Insights', icon: BarChart3 },
    { to: '/devices', label: 'Devices', icon: Settings },
    { to: '/how-it-works', label: 'How It Works', icon: Menu },
  ];

  return (
    <div className="flex h-screen bg-obsidian-950 text-slate-200 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-obsidian-900 border-r border-white/5 
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center gap-3 border-b border-white/5 h-20">
          <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-green rounded-xl flex items-center justify-center shadow-lg shadow-neon-blue/20">
            <Droplets className="text-white w-6 h-6" />
          </div>
          <div>
             <h1 className="font-display font-bold text-xl text-white tracking-tight">AgriFlow</h1>
             <p className="text-xs text-slate-500 font-medium">Pro Intelligence</p>
          </div>
        </div>

        <nav className="p-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-gradient-to-r from-neon-blue/20 to-transparent text-neon-blue border-l-4 border-neon-blue' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <item.icon className="w-5 h-5 transition-colors group-hover:text-neon-blue" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-obsidian-900/50 backdrop-blur-md">
           <button 
             onClick={handleLogout}
             className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:text-neon-rose hover:bg-neon-rose/10 transition-all font-medium"
           >
             <LogOut className="w-5 h-5" />
             <span>Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-96 bg-neon-blue/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>

        {/* Topbar */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-white/5 bg-obsidian-950/80 backdrop-blur-sm z-30">
          <button 
             onClick={() => setSidebarOpen(true)}
             className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Breadcrumb / Context */}
          <div className="hidden lg:block">
            <h2 className="text-lg font-display font-semibold text-white">
              {navItems.find(i => location.pathname.startsWith(i.to))?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-slate-400">
               <MapPin className="w-3.5 h-3.5 text-neon-green" />
               <span>Karnataka, IN</span>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border-2 border-obsidian-950 ring-2 ring-white/10"></div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-obsidian-950 p-4 lg:p-8 scroll-smooth relative z-10">
           <Outlet context={{ weather: { temp: 28, condition: 'Sunny', humidity: 45, wind: 12 } }} /> 
           {/* Passing mock context for now, will connect real one from Layout if needed or keep existing OutletContext flow */}
        </main>
      </div>
    </div>
  );
};

export default Layout;
