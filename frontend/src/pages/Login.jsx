import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Sprout, ArrowRight, Lock, Mail } from 'lucide-react';
import api from '../api/axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {

      const response = await api.post('/auth/login', 
        new URLSearchParams({ username: email, password }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const data = response.data;
      login(data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-obsidian-950 font-sans">
      {/* Visual Side */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-obsidian-900 relative overflow-hidden">
         <div className="absolute inset-0 bg-hero-glow opacity-20 blur-3xl animate-pulse-slow"></div>
         <div className="relative z-10">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-neon-green rounded-xl flex items-center justify-center">
                 <Sprout className="text-obsidian-950 w-6 h-6" />
              </div>
              <span className="text-2xl font-display font-bold text-white tracking-tight">AgriFlow</span>
           </div>
           
           <h1 className="text-5xl font-display font-bold text-white leading-tight mb-4">
             Precision Intelligence <br /> for <span className="text-neon-blue">Modern Farming</span>
           </h1>
           <p className="text-slate-400 text-lg max-w-md">
             Monitor soil health, automate irrigation, and maximize crop yields with satellite-driven insights.
           </p>
         </div>
         
         <div className="relative z-10 flex gap-4 text-sm text-slate-500 font-medium">
            <span>© 2024 AgriFlow Systems</span>
            <span>v2.0 Pro</span>
         </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-display font-bold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400">Enter your credentials to access the command center.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-neon-rose/10 border border-neon-rose/20 text-neon-rose rounded-xl text-sm font-medium flex items-center gap-2">
                 <Lock className="w-4 h-4" /> {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-neon-blue transition-colors" />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-obsidian-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none transition-all"
                  placeholder="name@farm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
              <div className="relative group">
                 <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-neon-blue transition-colors" />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-obsidian-900/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-neon-blue hover:bg-neon-blue/90 text-white font-bold rounded-xl shadow-lg shadow-neon-blue/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-neon-blue font-semibold hover:text-neon-blue/80 transition-colors">
              Create Field Profile
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
