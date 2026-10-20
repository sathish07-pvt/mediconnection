import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Activity, Stethoscope } from 'lucide-react';

export default function SelectRole() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      navigate('/');
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  const handleRoleSelection = (selectedRole) => {
    setError('');
    
    // Backend/Token Role Validation
    if (user.role.toLowerCase() !== selectedRole.toLowerCase()) {
      setError(`This account is not registered as a ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}.`);
      return;
    }

    // Role is validated
    navigate(`/${selectedRole.toLowerCase()}/dashboard`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-neumorphic border border-primary-50 text-center">
        
        <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase mb-2">WHO ARE YOU?</h2>
        <p className="text-gray-500 font-medium mb-10">Select your role to continue.</p>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-200 shadow-sm animate-pulse">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={() => handleRoleSelection('patient')}
            className="w-full flex items-center p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition shadow-sm group"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-6 group-hover:scale-110 transition">
              <User size={32} />
            </div>
            <span className="text-2xl font-black text-gray-800 tracking-wide">PATIENT</span>
          </button>

          <button 
            onClick={() => handleRoleSelection('caretaker')}
            className="w-full flex items-center p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition shadow-sm group"
          >
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mr-6 group-hover:scale-110 transition">
              <Activity size={32} />
            </div>
            <span className="text-2xl font-black text-gray-800 tracking-wide">CARETAKER</span>
          </button>

          <button 
            onClick={() => handleRoleSelection('doctor')}
            className="w-full flex items-center p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition shadow-sm group"
          >
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-6 group-hover:scale-110 transition">
              <Stethoscope size={32} />
            </div>
            <span className="text-2xl font-black text-gray-800 tracking-wide">DOCTOR</span>
          </button>
        </div>

      </div>
    </div>
  );
}
