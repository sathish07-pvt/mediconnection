import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, FileText, Calendar, Activity, AlertCircle, Phone, Stethoscope, 
  MessageSquare, Send, CheckCircle2, Pill, Plus, Play, User, Search, Clock, Mic, Check
} from 'lucide-react';
import { socket, connectSocket } from '../../socket';
import { addScheduleItem, formatTime12h } from '../../utils/scheduleStore';
import { 
  getStoredMessages, 
  saveChatMessage, 
  emitChatMessage, 
  playAudioMessage, 
  startVoiceSpeech 
} from '../../utils/chatStore';

export default function DoctorDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const currentPath = location.pathname;
  let activeTab = 'dashboard';
  if (currentPath.includes('/patients')) activeTab = 'patients';
  else if (currentPath.includes('/prescribe')) activeTab = 'prescribe';
  else if (currentPath.includes('/messages')) activeTab = 'messages';
  else if (currentPath.includes('/reports')) activeTab = 'reports';

  // 10 Full Realistic Patients List
  const [patientsList, setPatientsList] = useState([
    { id: 'PT1001', name: 'Vicky (Rajaraman)', age: 68, blood: 'B+', condition: 'Type 2 Diabetes & Mild BP', lastVisit: '18 Aug 2026', nextVisit: '25 Aug 2026', adherence: '98.4%', phone: '+91 98401 11223', caretaker: 'Priya (7305879007)', status: 'Active Monitoring' },
    { id: 'PT1002', name: 'Kamala Devi', age: 72, blood: 'O+', condition: 'Hypertension & Osteoarthritis', lastVisit: '15 Aug 2026', nextVisit: '28 Aug 2026', adherence: '92.0%', phone: '+91 98401 22334', caretaker: 'Ramesh (+91 98402 44556)', status: 'Stable' },
    { id: 'PT1003', name: 'Suresh Kumar', age: 61, blood: 'A+', condition: 'Post-CABG Cardiac Recovery', lastVisit: '19 Aug 2026', nextVisit: '22 Aug 2026', adherence: '95.5%', phone: '+91 98401 33445', caretaker: 'Ananya (+91 98402 55667)', status: 'High Priority' },
    { id: 'PT1004', name: 'Lakshmi Narayanan', age: 65, blood: 'B-', condition: 'Diabetic Nephropathy Stage 1', lastVisit: '12 Aug 2026', nextVisit: '30 Aug 2026', adherence: '89.0%', phone: '+91 98401 44556', caretaker: 'Karthik (+91 98402 66778)', status: 'Stable' },
    { id: 'PT1005', name: 'Meenakshi Sundaram', age: 70, blood: 'AB+', condition: 'Chronic Bronchitis & Asthma', lastVisit: '16 Aug 2026', nextVisit: '26 Aug 2026', adherence: '94.2%', phone: '+91 98401 55667', caretaker: 'Sangeetha (+91 98402 77889)', status: 'Stable' },
    { id: 'PT1006', name: 'Ramasamy Govind', age: 74, blood: 'O-', condition: 'Parkinson\'s & Hypertension', lastVisit: '14 Aug 2026', nextVisit: '27 Aug 2026', adherence: '88.7%', phone: '+91 98401 66778', caretaker: 'Mani (+91 98402 88990)', status: 'Active Monitoring' },
    { id: 'PT1007', name: 'Anitha Rajendran', age: 58, blood: 'A-', condition: 'Hyperlipidemia & Fatty Liver', lastVisit: '17 Aug 2026', nextVisit: '01 Sep 2026', adherence: '96.8%', phone: '+91 98401 77889', caretaker: 'Deepak (+91 98402 99001)', status: 'Stable' },
    { id: 'PT1008', name: 'Balaji Krishnan', age: 63, blood: 'B+', condition: 'Arrhythmia & Sleep Apnea', lastVisit: '20 Aug 2026', nextVisit: '24 Aug 2026', adherence: '91.3%', phone: '+91 98401 88990', caretaker: 'Radhika (+91 98403 00112)', status: 'High Priority' },
    { id: 'PT1009', name: 'Saravanan Muthu', age: 67, blood: 'O+', condition: 'Type 2 Diabetes & Neuropathy', lastVisit: '10 Aug 2026', nextVisit: '29 Aug 2026', adherence: '93.0%', phone: '+91 98401 99001', caretaker: 'Vijay (+91 98403 11223)', status: 'Stable' },
    { id: 'PT1010', name: 'Revathi Shankar', age: 69, blood: 'AB-', condition: 'Thyroiditis & Hypertension', lastVisit: '13 Aug 2026', nextVisit: '02 Sep 2026', adherence: '97.1%', phone: '+91 98402 00112', caretaker: 'Ganesh (+91 98403 22334)', status: 'Stable' }
  ]);

  const [selectedPatient, setSelectedPatient] = useState(patientsList[0]);
  const [patientSearch, setPatientSearch] = useState('');

  // Prescription Form
  const [rxForm, setRxForm] = useState({
    patient_id: 'PT1001',
    medicine_name: 'Metformin Hydrochloride',
    type: 'Tablet',
    dosage: '500mg (1 Tablet)',
    syrup_drops: '5ml (10 Drops)',
    time: '09:50',
    when: 'After Breakfast',
    instructions: 'Take with warm water. Avoid refined carbohydrates.'
  });

  // Real-Time Chat State
  const [chatMessages, setChatMessages] = useState(getStoredMessages());
  const [doctorText, setDoctorText] = useState('');
  const [sendTarget, setSendTarget] = useState('both');
  const [isRecordingDoctor, setIsRecordingDoctor] = useState(false);
  const [notificationToast, setNotificationToast] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user')) || {
      name: 'Dr. Arun',
      user_id: 'DR1001',
      role: 'doctor',
      phone: '6379730327'
    };
    setUser(u);
    connectSocket(u.user_id);

    // Cross-tab chat sync
    const handleChatSync = (e) => {
      if (e.detail) setChatMessages(e.detail);
    };
    window.addEventListener('MEDIGUARD_CHAT_SYNC', handleChatSync);

    // Socket real-time message receiver
    socket.on('chat_message_received', (msg) => {
      if (!msg.target || msg.target === 'both' || msg.target === 'all' || msg.target === 'doctor' || msg.senderRole === 'doctor') {
        setChatMessages(prev => saveChatMessage(msg));
      }
    });

    socket.on('emergency_received', (data) => {
      alert(`🚨 EMERGENCY ALERT DISPATCHED FROM PATIENT ${data.patientName || 'Vicky'}: ${data.reason || 'Immediate care needed!'}`);
    });

    return () => {
      window.removeEventListener('MEDIGUARD_CHAT_SYNC', handleChatSync);
      socket.off('chat_message_received');
      socket.off('emergency_received');
    };
  }, []);

  // Prescribe Medicine
  const handlePrescribeMedicine = (e) => {
    e.preventDefault();
    const dosageFormatted = rxForm.type === 'Syrup / Drops' ? rxForm.syrup_drops : rxForm.dosage;

    const newMedPayload = {
      name: rxForm.medicine_name,
      type: rxForm.type,
      dosage: dosageFormatted,
      time: rxForm.time,
      when: rxForm.when,
      purpose: rxForm.instructions,
      instructions: rxForm.instructions
    };

    addScheduleItem(newMedPayload);

    setNotificationToast(`✓ Rx Prescribed! "${newMedPayload.name}" synced to ${rxForm.patient_id} and Caretaker.`);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // Speak Doctor Message via Voice-to-Text
  const handleSpeakDoctorChat = () => {
    setIsRecordingDoctor(true);
    startVoiceSpeech(
      (transcript) => {
        setDoctorText(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecordingDoctor(false);
      },
      () => setIsRecordingDoctor(false),
      'en'
    );
  };

  // Send Doctor Message / Clinical Advice
  const handleSendDoctorAdvice = (e) => {
    e.preventDefault();
    if (!doctorText.trim()) return;

    emitChatMessage({
      senderRole: 'doctor',
      senderName: 'Dr. Arun (Cardiologist)',
      senderId: 'DR1001',
      target: sendTarget,
      text: doctorText,
      hasAudio: isRecordingDoctor || doctorText.length > 0
    });

    setDoctorText('');
  };

  if (!user) return <div className="p-8 text-center text-slate-500 font-bold">Loading Doctor Console...</div>;

  const filteredPatients = patientsList.filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
    p.id.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.condition.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="pb-16 max-w-6xl mx-auto space-y-6 font-sans relative">

      {/* TOAST NOTIFICATION */}
      {notificationToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-2 font-bold text-xs animate-bounce">
          <Check size={18} />
          <span>{notificationToast}</span>
        </div>
      )}
      
      {/* Clinical Top Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-3xl p-6 lg:p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-black uppercase px-3 py-1 rounded-full border border-white/20">
            Doctor ID: {user.user_id} • Phone: 6379730327
          </span>
          <h1 className="text-3xl font-black mt-2 tracking-tight">{user.name} — Physician Console</h1>
          <p className="text-emerald-100 text-sm mt-0.5">Senior Cardiologist & Diabetologist • 10 Active Monitored Patients</p>
        </div>

        <button 
          onClick={() => navigate('/doctor/prescribe')}
          className="bg-white text-emerald-800 font-black text-xs px-5 py-3 rounded-2xl shadow-md flex items-center hover:bg-emerald-50 transition self-start"
        >
          <Plus size={16} className="mr-1.5" /> Prescribe Medicine
        </button>
      </div>

      {/* =========================================================================
          VIEW 1: DASHBOARD HOME (Cleaned: Removed Live Symptom Logs)
          ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Patients</span>
              <p className="text-3xl font-black text-slate-900 mt-1">10</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-xs font-bold text-slate-400 uppercase">Active Monitoring</span>
              <p className="text-3xl font-black text-emerald-600 mt-1">10</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-xs font-bold text-slate-400 uppercase">Average Adherence</span>
              <p className="text-3xl font-black text-primary-600 mt-1">94.2%</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-xs font-bold text-slate-400 uppercase">Appointments Today</span>
              <p className="text-3xl font-black text-orange-600 mt-1">3</p>
            </div>
          </div>

          {/* Priority Patient Summary Card (Vicky PT1001) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-black text-2xl">
                  V
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-black text-slate-900">Vicky (PT1001)</h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">Active Monitoring</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Type 2 Diabetes & Mild BP • Last Visit: 18 Aug 2026 • Next Visit: 25 Aug 2026</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <a href="tel:+919840111223" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center border border-emerald-200">
                  <Phone size={14} className="mr-1.5" /> Call Vicky
                </a>
                <a href="tel:7305879007" className="bg-orange-50 text-orange-700 hover:bg-orange-100 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center border border-orange-200">
                  <Phone size={14} className="mr-1.5" /> Call Caretaker Priya (7305879007)
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-center">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold uppercase">HbA1c Sugar</span>
                <p className="text-base font-black text-slate-900 mt-1">6.4% (Controlled)</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold uppercase">Blood Pressure</span>
                <p className="text-base font-black text-slate-900 mt-1">124 / 82 mmHg</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold uppercase">Walking Activity</span>
                <p className="text-base font-black text-slate-900 mt-1">4,250 Steps Today</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold uppercase">Med Adherence</span>
                <p className="text-base font-black text-emerald-600 mt-1">98.4% (Stable)</p>
              </div>
            </div>
          </div>

          {/* Real-time Patient & Caretaker Communication Stream */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center">
                <MessageSquare size={18} className="text-emerald-600 mr-2" /> Real-Time Clinical Communication & Voice Stream
              </h3>
              <span className="bg-green-100 text-green-700 text-[10px] font-black px-2.5 py-0.5 rounded-full">Socket Active</span>
            </div>

            {/* Recipient Filter */}
            <div className="flex items-center space-x-2 text-xs font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 uppercase">Send Target:</span>
              <button 
                type="button" 
                onClick={() => setSendTarget('both')}
                className={`px-3 py-1 rounded-lg transition ${sendTarget === 'both' ? 'bg-emerald-600 text-white font-black shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Both (Patient & Caretaker)
              </button>
              <button 
                type="button" 
                onClick={() => setSendTarget('patient')}
                className={`px-3 py-1 rounded-lg transition ${sendTarget === 'patient' ? 'bg-pink-600 text-white font-black shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Patient Only
              </button>
              <button 
                type="button" 
                onClick={() => setSendTarget('caretaker')}
                className={`px-3 py-1 rounded-lg transition ${sendTarget === 'caretaker' ? 'bg-orange-600 text-white font-black shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Caretaker Only
              </button>
            </div>

            {/* Live Chat Stream */}
            <div className="bg-slate-50 rounded-2xl p-4 min-h-[220px] max-h-[300px] overflow-y-auto space-y-3 border border-slate-100 text-xs">
              {chatMessages.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-center">
                  <MessageSquare size={28} className="mb-1 opacity-50" />
                  <p className="font-bold">No active clinical messages.</p>
                  <p className="text-[11px] mt-0.5">Use the input below or voice mic to send real-time clinical notes to Vicky & Priya.</p>
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isDoctor = msg.senderRole === 'doctor' || msg.senderId === 'DR1001';
                  return (
                    <div key={msg.id} className={`p-3 bg-white rounded-xl border border-slate-200 shadow-sm ${isDoctor ? 'border-emerald-200 bg-emerald-50/20' : ''}`}>
                      <div className="flex justify-between items-center text-[11px] font-bold mb-1">
                        <span className={`font-black ${isDoctor ? 'text-emerald-800' : 'text-pink-700'}`}>
                          {msg.senderName} • To {msg.target || 'Both'}
                        </span>
                        <span className="font-mono text-slate-400">{msg.time}</span>
                      </div>
                      <p className="text-slate-800 font-medium">{msg.text}</p>

                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100">
                        <button 
                          onClick={() => playAudioMessage(msg.text)}
                          className="px-3 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-black flex items-center space-x-1.5 transition"
                        >
                          <Play size={13} />
                          <span>Play Audio Note</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Doctor Input Form */}
            <form onSubmit={handleSendDoctorAdvice} className="flex gap-2">
              <input 
                type="text" 
                value={doctorText}
                onChange={(e) => setDoctorText(e.target.value)}
                placeholder="Type clinical advice or medication instructions..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <button 
                type="button"
                onClick={handleSpeakDoctorChat}
                className={`p-3 rounded-xl transition ${
                  isRecordingDoctor ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
                title="Speak clinical advice into mic"
              >
                <Mic size={16} />
              </button>

              <button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center shadow-md"
              >
                <Send size={14} className="mr-1" /> Send Note
              </button>
            </form>

            {isRecordingDoctor && (
              <p className="text-xs text-red-600 font-bold animate-pulse">🎤 Doctor Mic Listening... Speak clinical advice now!</p>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: 10 PATIENTS LIST (Full Interactive 10 Patient Directory)
          ========================================================================= */}
      {activeTab === 'patients' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Clinical Registry</span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">10 Monitored Patients</h2>
              </div>

              <div className="relative max-w-xs w-full">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input 
                  type="text" 
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search patient by name or ID..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Patient ID</th>
                    <th className="pb-3">Full Name</th>
                    <th className="pb-3">Age / Blood</th>
                    <th className="pb-3">Medical Problem / Condition</th>
                    <th className="pb-3">Last Visited</th>
                    <th className="pb-3">Next Coming</th>
                    <th className="pb-3">Adherence</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map(pat => (
                    <tr key={pat.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 font-mono font-black text-emerald-800">{pat.id}</td>
                      <td className="py-3.5 font-bold text-slate-900">{pat.name}</td>
                      <td className="py-3.5 text-slate-600">{pat.age} yrs • {pat.blood}</td>
                      <td className="py-3.5 text-slate-700 font-semibold">{pat.condition}</td>
                      <td className="py-3.5 text-slate-500">{pat.lastVisit}</td>
                      <td className="py-3.5 font-bold text-emerald-700">{pat.nextVisit}</td>
                      <td className="py-3.5 font-mono font-bold text-slate-900">{pat.adherence}</td>
                      <td className="py-3.5">
                        <button 
                          onClick={() => {
                            setSelectedPatient(pat);
                            alert(`Patient: ${pat.name} (${pat.id})\nProblem: ${pat.condition}\nLast Visited: ${pat.lastVisit}\nNext Due: ${pat.nextVisit}\nCaretaker: ${pat.caretaker}`);
                          }}
                          className="bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: PRESCRIBE MEDICINE
          ========================================================================= */}
      {activeTab === 'prescribe' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Clinical E-Prescription</span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">Prescribe Medicine (Live Sync to Patient & Caretaker)</h2>
            </div>

            <form onSubmit={handlePrescribeMedicine} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Select Patient</label>
                  <select 
                    value={rxForm.patient_id}
                    onChange={(e) => setRxForm({...rxForm, patient_id: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none"
                  >
                    {patientsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id}) — {p.condition}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Medicine Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Metformin / Glimepiride" 
                    value={rxForm.medicine_name}
                    onChange={(e) => setRxForm({...rxForm, medicine_name: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Form / Type</label>
                  <select 
                    value={rxForm.type}
                    onChange={(e) => setRxForm({...rxForm, type: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none"
                  >
                    <option value="Tablet">Tablet / Pill</option>
                    <option value="Syrup / Drops">Syrup / Drops</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Injection">Injection</option>
                  </select>
                </div>

                {rxForm.type === 'Syrup / Drops' ? (
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Syrup Drops / Quantity</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. 5ml (10 Drops)" 
                      value={rxForm.syrup_drops}
                      onChange={(e) => setRxForm({...rxForm, syrup_drops: e.target.value})}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Pills Count & Dosage</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. 500mg (1 Tablet)" 
                      value={rxForm.dosage}
                      onChange={(e) => setRxForm({...rxForm, dosage: e.target.value})}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Scheduled Time (HH:MM)</label>
                  <input 
                    type="time" 
                    required 
                    value={rxForm.time}
                    onChange={(e) => setRxForm({...rxForm, time: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">When to Take (Meal Instructions)</label>
                <select 
                  value={rxForm.when}
                  onChange={(e) => setRxForm({...rxForm, when: e.target.value})}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none"
                >
                  <option value="After Breakfast">After Breakfast</option>
                  <option value="Before Lunch">Before Lunch</option>
                  <option value="After Dinner">After Dinner</option>
                  <option value="Before Bed with Warm Water">Before Bed with Warm Water</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Clinical Instructions & Purpose</label>
                <textarea 
                  rows="2"
                  value={rxForm.instructions}
                  onChange={(e) => setRxForm({...rxForm, instructions: e.target.value})}
                  placeholder="Instructions for patient and caretaker..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium outline-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md uppercase tracking-wider text-xs"
              >
                PRESCRIBE & SYNC TO PATIENT + CARETAKER
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: REPORTS & VITALS
          ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Diagnostic Vitals</span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">Patient Lab Results & Scans</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              {[
                { name: 'Vicky (PT1001) - HbA1c Lab Report', val: '6.4% (Controlled)', date: '18 Aug 2026', status: 'Stable' },
                { name: 'Kamala Devi (PT1002) - BP Chart', val: '138/88 mmHg', date: '15 Aug 2026', status: 'Review Needed' },
                { name: 'Suresh Kumar (PT1003) - Post-Op ECG', val: 'Sinus Tachycardia (Resolving)', date: '19 Aug 2026', status: 'Priority' },
                { name: 'Lakshmi (PT1004) - Serum Creatinine', val: '1.2 mg/dL', date: '12 Aug 2026', status: 'Stable' }
              ].map(rep => (
                <div key={rep.name} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-900">{rep.name}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full">{rep.status}</span>
                  </div>
                  <p className="text-emerald-700 font-bold text-sm">{rep.val}</p>
                  <span className="text-[10px] text-slate-400 block">{rep.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 5: PATIENT MESSAGES & AUDIO TAB
          ========================================================================= */}
      {activeTab === 'messages' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Clinical Communication</span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">Patient Messages & Audio Notes</h2>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-black px-3 py-1 rounded-full flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-ping"></span> Live Relay Active
              </span>
            </div>

            {/* Recipient Filter */}
            <div className="flex items-center space-x-2 text-xs font-bold bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 uppercase">Send Target:</span>
              <button 
                type="button" 
                onClick={() => setSendTarget('both')}
                className={`px-3 py-1 rounded-lg transition ${sendTarget === 'both' ? 'bg-emerald-600 text-white font-black shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Both (Patient & Caretaker)
              </button>
              <button 
                type="button" 
                onClick={() => setSendTarget('patient')}
                className={`px-3 py-1 rounded-lg transition ${sendTarget === 'patient' ? 'bg-pink-600 text-white font-black shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Patient Only
              </button>
              <button 
                type="button" 
                onClick={() => setSendTarget('caretaker')}
                className={`px-3 py-1 rounded-lg transition ${sendTarget === 'caretaker' ? 'bg-orange-600 text-white font-black shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Caretaker Only
              </button>
            </div>

            {/* Chat Stream */}
            <div className="bg-slate-50 rounded-2xl p-4 min-h-[260px] max-h-[380px] overflow-y-auto space-y-3 border border-slate-100 text-xs">
              {chatMessages.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-center">
                  <MessageSquare size={32} className="mb-2 opacity-50" />
                  <p className="font-bold">No messages recorded yet.</p>
                  <p className="text-[11px] mt-1">Messages and voice notes sent between Patient, Caretaker, and Doctor appear here in real time.</p>
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isDoctor = msg.senderRole === 'doctor' || msg.senderId === 'DR1001';
                  return (
                    <div key={msg.id} className={`p-4 bg-white rounded-xl border border-slate-200 shadow-sm ${isDoctor ? 'border-emerald-200 bg-emerald-50/20' : ''}`}>
                      <div className="flex justify-between items-center text-[11px] font-bold mb-1">
                        <span className={`font-black ${isDoctor ? 'text-emerald-800' : 'text-pink-700'}`}>
                          {msg.senderName} • To {msg.target || 'Both'}
                        </span>
                        <span className="font-mono text-slate-400">{msg.time}</span>
                      </div>
                      <p className="text-slate-800 font-medium text-sm">{msg.text}</p>

                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
                        <button 
                          onClick={() => playAudioMessage(msg.text)}
                          className="px-3 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-black flex items-center space-x-1.5 transition"
                        >
                          <Play size={13} />
                          <span>Play Audio Note</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendDoctorAdvice} className="flex gap-2">
              <input 
                type="text" 
                value={doctorText}
                onChange={(e) => setDoctorText(e.target.value)}
                placeholder="Send clinical advice or prescription guidance..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <button 
                type="button"
                onClick={handleSpeakDoctorChat}
                className={`p-3 rounded-xl transition ${
                  isRecordingDoctor ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
                title="Speak clinical advice into mic"
              >
                <Mic size={16} />
              </button>

              <button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center shadow-md"
              >
                <Send size={14} className="mr-1" /> Send Advice
              </button>
            </form>

            {isRecordingDoctor && (
              <p className="text-xs text-red-600 font-bold animate-pulse">🎤 Doctor Mic Listening... Speak clinical advice now!</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
