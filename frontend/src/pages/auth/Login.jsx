import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import logoImg from '../../assets/logo.jpg';

export default function Login() {
  const navigate = useNavigate();
  const { role: routeRole } = useParams();
  
  const [selectedRole, setSelectedRole] = useState(routeRole || 'patient');
  const [formData, setFormData] = useState({ id: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const role = routeRole || 'patient';
    setSelectedRole(role);

    const defaultIds = {
      patient: 'PT1001',
      caretaker: 'CT1001',
      doctor: 'DR1001'
    };

    const savedId = localStorage.getItem('saved_id');
    const savedRole = localStorage.getItem('saved_role');

    if (savedRole === role && savedId) {
      setFormData({ id: savedId, password: '123' });
    } else {
      setFormData({ id: defaultIds[role] || '', password: '123' });
    }
  }, [routeRole]);

  const mockUsers = {
    'PT1001': { id: 1, user_id: 'PT1001', role: 'patient', name: 'Vicky' },
    'CT1001': { id: 2, user_id: 'CT1001', role: 'caretaker', name: 'Priya' },
    'DR1001': { id: 3, user_id: 'DR1001', role: 'doctor', name: 'Dr. Arun' }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        id: formData.id,
        password: formData.password
      });

      if (rememberMe) {
        localStorage.setItem('saved_id', formData.id);
        localStorage.setItem('saved_role', res.data.user.role);
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate(`/${res.data.user.role}/dashboard`);
    } catch (err) {
      // Prototype fallback
      const uppercaseId = formData.id.trim().toUpperCase();
      const mockUser = mockUsers[uppercaseId];

      if (mockUser && (formData.password.includes('123') || formData.password.length > 0)) {
        if (selectedRole && mockUser.role !== selectedRole) {
          setError(`User ${uppercaseId} is registered as ${mockUser.role.toUpperCase()}, not ${selectedRole.toUpperCase()}. Please choose ${mockUser.role.toUpperCase()} login.`);
          setIsLoading(false);
          return;
        }

        if (rememberMe) {
          localStorage.setItem('saved_id', mockUser.user_id);
          localStorage.setItem('saved_role', mockUser.role);
        }

        localStorage.setItem('token', 'mock_token_' + mockUser.user_id);
        localStorage.setItem('user', JSON.stringify(mockUser));
        navigate(`/${mockUser.role}/dashboard`);
      } else {
        setError('Invalid credentials. Please check your ID or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setMessage(`Password reset instructions sent to ${email}.`);
  };

  const roleTitles = {
    patient: { title: 'Patient Login', btnColor: 'bg-pink-600 hover:bg-pink-700' },
    caretaker: { title: 'Caretaker Login', btnColor: 'bg-orange-600 hover:bg-orange-700' },
    doctor: { title: 'Doctor Login', btnColor: 'bg-emerald-600 hover:bg-emerald-700' }
  };

  const currentRole = roleTitles[selectedRole] || roleTitles.patient;

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
          <button onClick={() => setIsForgotPassword(false)} className="text-slate-500 hover:text-pink-600 mb-6 font-bold flex items-center text-xs transition">
            <ArrowLeft size={16} className="mr-1.5" /> Back to Sign In
          </button>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-slate-900">Forgot Password</h2>
          </div>

          {message && <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold text-center">{message}</div>}

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Registered Email</label>
              <input 
                type="email" 
                required 
                className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-pink-500 outline-none" 
                placeholder="e.g. user@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
            <button type="submit" className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white font-extrabold rounded-xl shadow-lg transition uppercase tracking-wider text-xs">
              SEND RESET LINK
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8">
      <div className="max-w-md w-full bg-white p-8 lg:p-10 rounded-3xl shadow-2xl border border-slate-100 relative">
        
        {/* Top Back and Role Switcher */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <Link to="/" className="text-slate-500 hover:text-pink-600 font-bold flex items-center text-xs transition">
            <ArrowLeft size={14} className="mr-1" /> Home
          </Link>
          <div className="flex space-x-1">
            {['patient', 'caretaker', 'doctor'].map(r => (
              <button
                key={r}
                onClick={() => {
                  setSelectedRole(r);
                  navigate(`/login/${r}`);
                }}
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg transition ${selectedRole === r ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Logo & Heading */}
        <div className="text-center mb-6">
          <div className="w-40 mx-auto mb-4 p-1.5 rounded-2xl bg-white border border-pink-100">
            <img src={logoImg} alt="MediGuard Logo" className="w-full h-auto object-contain rounded-xl" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{currentRole.title}</h2>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200 shadow-sm text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">User ID / Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input 
                type="text" 
                required 
                className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 bg-slate-50 text-slate-900 text-sm font-semibold outline-none" 
                placeholder="User ID or Email"
                value={formData.id} 
                onChange={(e) => setFormData({...formData, id: e.target.value})} 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                required 
                className="w-full pl-10 pr-11 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 bg-slate-50 text-slate-900 text-sm font-semibold outline-none" 
                placeholder="Password" 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
              />
              <button 
                type="button" 
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded border-slate-300 focus:ring-pink-500 cursor-pointer" 
              />
              <span className="ml-2 text-xs font-bold text-slate-700">Remember Me</span>
            </label>
            <button 
              type="button" 
              onClick={() => setIsForgotPassword(true)} 
              className="text-xs font-bold text-pink-600 hover:text-pink-700 transition"
            >
              Forgot Password?
            </button>
          </div>

          {/* Sign In Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-4 ${currentRole.btnColor} text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all uppercase tracking-wider text-xs flex justify-center items-center mt-2`}
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'SIGN IN'}
          </button>
        </form>

        {/* Register Footer */}
        <div className="mt-6 text-center text-xs font-medium text-slate-500 pt-4 border-t border-slate-100">
          Need an account? <Link to="/register" className="font-extrabold text-pink-600 hover:text-pink-700 uppercase tracking-wide ml-1 underline">CREATE ACCOUNT</Link>
        </div>

      </div>
    </div>
  );
}
