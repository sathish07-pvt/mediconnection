import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Phone, Activity, CheckCircle } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = (e) => {
    e.preventDefault();
    // Simulate generic registration logic
    // By default, backend might assign a generic 'user' role or default 'patient'
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-neumorphic border border-primary-50 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase mb-4">Account Created Successfully</h2>
          <p className="text-gray-500 font-medium mb-10">Your MediGuard account has been created. Please sign in to continue.</p>
          <Link to="/" className="w-full inline-block py-5 bg-primary-500 hover:bg-primary-600 text-white font-black rounded-xl shadow-soft uppercase tracking-wide">
            GO TO SIGN IN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-neumorphic border border-primary-50">
        
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="flex items-center space-x-2 text-primary-600 mb-6">
            <div className="p-3 bg-primary-50 rounded-2xl shadow-inner">
              <Activity size={40} strokeWidth={2.5} />
            </div>
            <span className="text-3xl font-black tracking-tight text-gray-900 uppercase">MediGuard</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight text-center">Create Your Account</h2>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User size={20} className="text-gray-400" /></div>
              <input type="text" required className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 font-medium" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
          </div>

          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={20} className="text-gray-400" /></div>
              <input type="email" required className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 font-medium" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>

          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Phone size={20} className="text-gray-400" /></div>
              <input type="tel" required className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 font-medium" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={20} className="text-gray-400" /></div>
              <input type="password" required className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 font-medium" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>

          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={20} className="text-gray-400" /></div>
              <input type="password" required className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 font-medium" placeholder="Confirm Password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="w-full py-5 bg-primary-500 hover:bg-primary-600 text-white font-black rounded-xl shadow-soft uppercase tracking-wide mt-2">
            CREATE ACCOUNT
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-gray-600 pt-6 border-t border-gray-100">
          Already have an account? <Link to="/" className="font-black text-primary-600 hover:text-primary-700 uppercase tracking-wide ml-1">SIGN IN</Link>
        </div>
      </div>
    </div>
  );
}
