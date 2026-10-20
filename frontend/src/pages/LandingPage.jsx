import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Activity, Stethoscope, ArrowRight, ShieldCheck } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

export default function LandingPage() {
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(true);

  const handleQuickLogin = (role, id) => {
    if (rememberMe) {
      localStorage.setItem('saved_role', role);
      localStorage.setItem('saved_id', id);
    }
    navigate(`/login/${role}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-12 min-h-[580px] border border-slate-100">
        
        {/* LEFT COLUMN: Clean Slogan & Official Project Logo */}
        <div className="lg:col-span-6 bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-8 lg:p-14 flex flex-col justify-between items-center text-center relative border-b lg:border-b-0 lg:border-r border-pink-100">
          
          {/* Top subtle badge */}
          <div className="inline-flex items-center space-x-2 bg-pink-100/80 text-pink-800 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <span>Healthcare Platform</span>
          </div>

          {/* Centered Logo & Slogan */}
          <div className="my-auto py-8 flex flex-col items-center">
            {/* Logo from user upload */}
            <div className="w-48 sm:w-56 mb-6 p-2 rounded-2xl bg-white shadow-sm border border-pink-100/60">
              <img 
                src={logoImg} 
                alt="MediGuard Official Logo" 
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>

            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-3">
              “Monitor Today.<br />
              <span className="text-pink-600">Protect Tomorrow.”</span>
            </h1>
            <p className="text-slate-600 text-sm font-semibold max-w-sm">
              Smart Patient, Caretaker & Doctor Monitoring System
            </p>
          </div>

          {/* Bottom Security Assurance */}
          <div className="flex items-center text-xs font-semibold text-slate-500">
            <ShieldCheck size={16} className="text-emerald-500 mr-1.5" />
            <span>Encrypted & Offline-First Healthcare</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean Sign In & 3 Dedicated Role Login Portals */}
        <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Sign In</h2>
              <Link to="/register" className="text-xs font-bold text-pink-600 hover:text-pink-700 bg-pink-50 px-3 py-1.5 rounded-xl transition">
                Create Account
              </Link>
            </div>

            {/* THREE CLEAN ROLE LOGINS */}
            <div className="space-y-4 mb-6">
              
              {/* Patient Login Card */}
              <button 
                onClick={() => handleQuickLogin('patient', 'PT1001')}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-100 hover:border-pink-500 hover:bg-pink-50/40 transition-all duration-200 group flex items-center justify-between shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-pink-100 text-pink-700 rounded-2xl flex items-center justify-center font-bold group-hover:scale-105 transition">
                    <User size={24} />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-base block">Patient Login</span>
                    <span className="text-xs text-slate-500 font-medium">Tamil & English • Elderly Friendly</span>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-pink-600 group-hover:translate-x-1 transition" />
              </button>

              {/* Caretaker Login Card */}
              <button 
                onClick={() => handleQuickLogin('caretaker', 'CT1001')}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-100 hover:border-orange-500 hover:bg-orange-50/40 transition-all duration-200 group flex items-center justify-between shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 text-orange-700 rounded-2xl flex items-center justify-center font-bold group-hover:scale-105 transition">
                    <Activity size={24} />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-base block">Caretaker Login</span>
                    <span className="text-xs text-slate-500 font-medium">Schedule Medicines & Real-Time Monitoring</span>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition" />
              </button>

              {/* Doctor Login Card */}
              <button 
                onClick={() => handleQuickLogin('doctor', 'DR1001')}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all duration-200 group flex items-center justify-between shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold group-hover:scale-105 transition">
                    <Stethoscope size={24} />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-base block">Doctor Login</span>
                    <span className="text-xs text-slate-500 font-medium">Patient Lists, Prescriptions & Reports</span>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
              </button>
            </div>

            {/* Remember Me */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between mb-4">
              <label className="flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-pink-600 rounded border-slate-300 focus:ring-pink-500 cursor-pointer"
                />
                <span className="ml-2.5 text-xs font-bold text-slate-700">Remember Me & Save Login</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-400">1-Click Access</span>
            </div>
          </div>

          {/* Clean Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>New user? <Link to="/register" className="font-bold text-pink-600 hover:text-pink-700 underline">Register here</Link></span>
            <span className="text-slate-400 font-mono text-[11px]">MediGuard v2.5</span>
          </div>
        </div>

      </div>
    </div>
  );
}
