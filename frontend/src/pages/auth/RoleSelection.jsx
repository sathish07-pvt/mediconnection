import { Link } from 'react-router-dom';
import { User, Heart, Stethoscope } from 'lucide-react';

export default function RoleSelection() {
  const roles = [
    {
      id: 'patient',
      title: 'PATIENT',
      description: 'Manage your health routine.',
      icon: <User size={48} className="text-primary-500 group-hover:scale-110 transition-transform duration-300" />,
      color: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'caretaker',
      title: 'CARETAKER',
      description: 'Monitor and support your patient.',
      icon: <Heart size={48} className="text-primary-500 group-hover:scale-110 transition-transform duration-300" />,
      color: 'bg-rose-50',
      borderColor: 'border-rose-200'
    },
    {
      id: 'doctor',
      title: 'DOCTOR',
      description: 'Review patient progress.',
      icon: <Stethoscope size={48} className="text-primary-500 group-hover:scale-110 transition-transform duration-300" />,
      color: 'bg-teal-50',
      borderColor: 'border-teal-200'
    }
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Welcome to MediGuard</h1>
        <p className="text-xl text-gray-600">Who are you?</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
        {roles.map((role) => (
          <Link 
            key={role.id}
            to={`/login/${role.id}`}
            className={`group bg-white rounded-3xl p-8 flex flex-col items-center text-center shadow-neumorphic hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:${role.borderColor}`}
          >
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-primary-50 shadow-inner`}>
              {role.icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-wide">{role.title}</h2>
            <p className="text-gray-500 mb-8 flex-grow">{role.description}</p>
            <div className="w-full py-3 bg-primary-50 text-primary-600 font-bold rounded-xl group-hover:bg-primary-500 group-hover:text-white transition-colors">
              Continue
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
