import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, User, Activity, Menu, X, 
  Home, Pill, Calendar, FileText, AlertCircle, MessageSquare, HeartPulse, Globe
} from 'lucide-react';
import { socket, connectSocket } from '../socket';
import { translations } from '../utils/translations';
import logoImg from '../assets/logo.jpg';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  
  // Language state (en or ta)
  const [lang, setLang] = useState(localStorage.getItem('mediguard_lang') || 'en');
  const t = translations[lang] || translations.en;

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    if (!u) {
      navigate('/');
      return;
    }
    setUser(u);
    connectSocket(u.user_id);
  }, [navigate]);

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('mediguard_lang', newLang);
    window.dispatchEvent(new CustomEvent('LANGUAGE_CHANGED', { detail: newLang }));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  if (!user) return null;

  // Patient Navigation Links (Profile is FIRST as explicitly requested!)
  const patientLinks = [
    { name: t.profile, icon: User, path: '/patient/profile' },
    { name: t.dashboard, icon: Home, path: '/patient/dashboard' },
    { name: t.medicines, icon: Pill, path: '/patient/medicines' },
    { name: t.schedule, icon: Calendar, path: '/patient/schedule' },
    { name: t.reports, icon: FileText, path: '/patient/reports' },
    { name: t.activity, icon: HeartPulse, path: '/patient/activity' },
    { name: t.messages, icon: MessageSquare, path: '/patient/messages' },
  ];

  // Caretaker Navigation Links
  const caretakerLinks = [
    { name: t.dashboard, icon: Home, path: '/caretaker/dashboard' },
    { name: t.myPatient, icon: User, path: '/caretaker/patient' },
    { name: t.schedule, icon: Calendar, path: '/caretaker/schedule' },
    { name: t.messages, icon: MessageSquare, path: '/caretaker/messages' },
    { name: t.reports, icon: FileText, path: '/caretaker/reports' },
    { name: t.profile, icon: User, path: '/caretaker/profile' },
  ];

  // Doctor Navigation Links
  const doctorLinks = [
    { name: 'Dashboard', icon: Home, path: '/doctor/dashboard' },
    { name: '10 Monitored Patients', icon: User, path: '/doctor/patients' },
    { name: 'Prescribe Medicine', icon: Pill, path: '/doctor/prescribe' },
    { name: 'Patient Messages & Audio', icon: MessageSquare, path: '/doctor/messages' },
    { name: 'Reports & Vitals', icon: FileText, path: '/doctor/reports' },
  ];

  const links = user.role === 'patient' 
    ? patientLinks 
    : user.role === 'caretaker' 
      ? caretakerLinks 
      : doctorLinks;

  const roleBadges = {
    patient: 'bg-pink-100 text-pink-800 border-pink-200',
    caretaker: 'bg-orange-100 text-orange-800 border-orange-200',
    doctor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* LEFT-SIDE COLLAPSIBLE SIDEBAR */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-white shadow-xl z-30 transform transition-transform duration-300 w-72 flex flex-col border-r border-slate-100 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand Logo & Portal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 p-1 bg-white rounded-xl border border-pink-100 shadow-sm flex items-center justify-center">
              <img src={logoImg} alt="MediGuard Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div>
              <span className="text-xl font-black uppercase tracking-tight text-slate-900">MediGuard</span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-pink-600">
                {user.role} console
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
            title="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Item List */}
        <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-1.5">
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <button 
                key={link.name}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 ${
                  isActive 
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20' 
                    : 'text-slate-600 hover:bg-pink-50/50 hover:text-pink-700'
                }`}
              >
                <link.icon size={19} className={`mr-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{link.name}</span>
              </button>
            );
          })}

          {/* Emergency Shortcut (Only for Patient) */}
          {user.role === 'patient' && (
            <div className="pt-3 mt-3 border-t border-slate-100">
              <button 
                onClick={() => navigate('/patient/emergency')}
                className={`w-full flex items-center px-4 py-3.5 rounded-xl font-black text-sm transition-all duration-150 ${
                  location.pathname.includes('/emergency')
                    ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/60'
                }`}
              >
                <AlertCircle size={19} className="mr-3.5 text-red-600" />
                <span>{t.emergency}</span>
              </button>
            </div>
          )}

          {/* Logout Button */}
          <div className="pt-3 mt-2 border-t border-slate-100">
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center px-4 py-3.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
            >
              <LogOut size={19} className="mr-3.5 text-slate-400 hover:text-red-500" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-72' : 'ml-0'}`}>
        
        {/* CLEAN TOP HEADER WITH LANGUAGE SWITCHER (NO BELL, NO NAME/PROFILE TOP RIGHT) */}
        <header className="bg-white shadow-sm py-3 px-6 flex justify-between items-center z-10 sticky top-0 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-slate-700 border border-slate-200 shadow-sm"
              title="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
            
            <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-slate-500">
              <span className="text-pink-600">MediGuard</span>
              <span>/</span>
              <span className="text-slate-900 capitalize">{location.pathname.split('/')[2] || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* MULTI-LANGUAGE TOGGLE (TAMIL & ENGLISH) */}
            {(user.role === 'patient' || user.role === 'caretaker') && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <Globe size={14} className="text-slate-500 ml-1.5 mr-1" />
                <button 
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2.5 py-1 rounded-lg transition ${lang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  English
                </button>
                <button 
                  onClick={() => handleLanguageChange('ta')}
                  className={`px-2.5 py-1 rounded-lg transition ${lang === 'ta' ? 'bg-white text-pink-700 shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  தமிழ்
                </button>
              </div>
            )}

            <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border ${roleBadges[user.role] || 'bg-slate-100 text-slate-700'}`}>
              {user.role}
            </span>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-8 w-full max-w-6xl mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
