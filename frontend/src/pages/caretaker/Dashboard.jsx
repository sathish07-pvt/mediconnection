import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Pill, Activity, Mic, AlertCircle, Plus, CheckCircle, Clock, Calendar, 
  MessageSquare, Phone, User, Send, FileText, Footprints, Play, Square, Info, Check
} from 'lucide-react';
import { socket, connectSocket } from '../../socket';
import { translations } from '../../utils/translations';
import { 
  getStoredSchedules, 
  addScheduleItem, 
  deleteScheduleItem, 
  getNextUpcomingMedicine, 
  formatTime12h 
} from '../../utils/scheduleStore';
import { 
  getStoredMessages, 
  saveChatMessage, 
  emitChatMessage, 
  playAudioMessage, 
  startVoiceSpeech 
} from '../../utils/chatStore';

export default function CaretakerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Multi-language state
  const [lang, setLang] = useState(localStorage.getItem('mediguard_lang') || 'en');
  const t = translations[lang] || translations.en;

  const currentPath = location.pathname;
  let activeTab = 'dashboard';
  if (currentPath.includes('/patient')) activeTab = 'patient';
  else if (currentPath.includes('/schedule')) activeTab = 'schedule';
  else if (currentPath.includes('/messages')) activeTab = 'messages';
  else if (currentPath.includes('/reports')) activeTab = 'reports';
  else if (currentPath.includes('/profile')) activeTab = 'profile';

  // Live Schedules Store
  const [schedulesList, setSchedulesList] = useState(getStoredSchedules());
  const [nextMedicine, setNextMedicine] = useState(getNextUpcomingMedicine(schedulesList));

  // State: Schedule creation modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    medicine_name: '',
    type: 'Tablet',
    pills_count: '1 Tablet',
    syrup_drops: '5ml (10 Drops)',
    time: '09:50',
    when: 'After Breakfast',
    duration: '3 Days Course',
    instructions: 'Take with warm water'
  });

  // Live Updates
  const [updates, setUpdates] = useState([]);

  // Real-Time Chat State
  const [chatMessages, setChatMessages] = useState(getStoredMessages());
  const [replyText, setReplyText] = useState('');
  const [sendTarget, setSendTarget] = useState('both');
  const [isRecordingCaretaker, setIsRecordingCaretaker] = useState(false);
  const [notificationToast, setNotificationToast] = useState(null);

  // Update Next Medicine whenever schedules change
  useEffect(() => {
    setNextMedicine(getNextUpcomingMedicine(schedulesList));
  }, [schedulesList]);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user')) || {
      name: 'Priya',
      user_id: 'CT1001',
      role: 'caretaker',
      phone: '7305879007'
    };
    setUser(u);
    connectSocket(u.user_id);

    const handleLangChange = (e) => setLang(e.detail);
    window.addEventListener('LANGUAGE_CHANGED', handleLangChange);

    // Sync schedules across tabs
    const handleSchedulesSync = (e) => {
      if (e.detail) setSchedulesList(e.detail);
    };
    window.addEventListener('MEDIGUARD_SCHEDULES_SYNC', handleSchedulesSync);

    // Sync chat across tabs
    const handleChatSync = (e) => {
      if (e.detail) setChatMessages(e.detail);
    };
    window.addEventListener('MEDIGUARD_CHAT_SYNC', handleChatSync);

    // Live socket listeners
    socket.on('patient_update', (data) => {
      setUpdates(prev => [{
        id: Date.now(),
        type: data.type,
        message: data.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }, ...prev]);
    });

    socket.on('chat_message_received', (msg) => {
      if (!msg.target || msg.target === 'both' || msg.target === 'all' || msg.target === 'caretaker' || msg.senderRole === 'caretaker') {
        setChatMessages(prev => saveChatMessage(msg));
      }
    });

    socket.on('emergency_received', (data) => {
      alert(`🚨 EMERGENCY ALERT FROM VICKY (PT1001): ${data.reason || 'Immediate care required!'}`);
      setUpdates(prev => [{
        id: Date.now(),
        type: 'EMERGENCY',
        message: `🚨 EMERGENCY ALERT FROM ${data.patientName || 'Vicky'} - Reason: ${data.reason || 'Manual SOS'}`,
        time: data.time || new Date().toLocaleTimeString()
      }, ...prev]);
    });

    return () => {
      window.removeEventListener('LANGUAGE_CHANGED', handleLangChange);
      window.removeEventListener('MEDIGUARD_SCHEDULES_SYNC', handleSchedulesSync);
      window.removeEventListener('MEDIGUARD_CHAT_SYNC', handleChatSync);
      socket.off('patient_update');
      socket.off('chat_message_received');
      socket.off('emergency_received');
    };
  }, []);

  // Create & Sync Schedule
  const handleCreateSchedule = (e) => {
    e.preventDefault();
    const dosageFormatted = scheduleForm.type === 'Syrup / Drops' 
      ? scheduleForm.syrup_drops 
      : scheduleForm.pills_count;

    const newMedPayload = {
      name: scheduleForm.medicine_name,
      type: scheduleForm.type,
      dosage: dosageFormatted,
      time: scheduleForm.time,
      when: scheduleForm.when,
      duration: scheduleForm.duration,
      instructions: scheduleForm.instructions
    };

    const updated = addScheduleItem(newMedPayload);
    setSchedulesList(updated);
    setShowScheduleModal(false);

    setNotificationToast(`✓ Schedule for "${newMedPayload.name}" synced to Patient Vicky and Doctor console.`);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  const handleDeleteSchedule = (name) => {
    if (window.confirm(`Delete "${name}" from patient schedule?`)) {
      const updated = deleteScheduleItem(name);
      setSchedulesList(updated);
    }
  };

  // Speak Caretaker Message via Voice-to-Text
  const handleSpeakCaretakerChat = () => {
    setIsRecordingCaretaker(true);
    startVoiceSpeech(
      (transcript) => {
        setReplyText(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecordingCaretaker(false);
      },
      () => setIsRecordingCaretaker(false),
      lang
    );
  };

  // Send Caretaker Message / Voice Note
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    emitChatMessage({
      senderRole: 'caretaker',
      senderName: 'Priya (Caretaker)',
      senderId: 'CT1001',
      target: sendTarget,
      text: replyText,
      hasAudio: isRecordingCaretaker || replyText.length > 0
    });

    setReplyText('');
  };

  if (!user) return <div className="p-8 text-center text-slate-500 font-bold">Loading Caretaker Portal...</div>;

  const nextDisplayMed = nextMedicine || schedulesList[0] || {
    name: 'Metformin',
    timeFormatted: '09:50 AM'
  };

  return (
    <div className="pb-16 max-w-6xl mx-auto space-y-6 font-sans relative">

      {/* TOAST NOTIFICATION */}
      {notificationToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-2 font-bold text-xs animate-bounce">
          <Check size={18} />
          <span>{notificationToast}</span>
        </div>
      )}
      
      {/* Top Banner with Caretaker Info */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-700 rounded-3xl p-6 lg:p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-black uppercase px-3 py-1 rounded-full border border-white/20">
            {t.caretakerId}: {user.user_id} • Phone: 7305879007
          </span>
          <h1 className="text-3xl font-black mt-2 tracking-tight">{user.name} — Caretaker Console</h1>
          <p className="text-orange-100 text-sm mt-0.5">Monitoring Active Patient: Vicky (PT1001)</p>
        </div>

        <button 
          onClick={() => setShowScheduleModal(true)} 
          className="bg-white text-orange-700 hover:bg-orange-50 font-black text-sm px-5 py-3 rounded-2xl shadow-lg transition flex items-center space-x-2 self-start"
        >
          <Plus size={18} />
          <span>SCHEDULE MEDICINE</span>
        </button>
      </div>

      {/* =========================================================================
          VIEW 1: DASHBOARD
          ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Patient Overview Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-pink-100 text-pink-700 rounded-2xl flex items-center justify-center font-black text-2xl">
                  V
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-black text-slate-900">Vicky (Rajaraman)</h2>
                    <span className="bg-pink-100 text-pink-800 text-[10px] font-black px-2 py-0.5 rounded-full">PT1001</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Type 2 Diabetes • Age: 68 • Blood: B+</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a href="tel:8531830253" className="bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center transition border border-orange-200">
                  <Phone size={14} className="mr-1.5" /> Call Relative 1 (8531830253)
                </a>
                <a href="tel:6379730327" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center transition border border-emerald-200">
                  <Phone size={14} className="mr-1.5" /> Call Doctor (6379730327)
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-center text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold uppercase">Latest Status</span>
                <p className="text-base font-black text-emerald-600 mt-1 flex items-center justify-center">
                  <CheckCircle size={16} className="mr-1" /> Active Monitored
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold uppercase">Next Dose</span>
                <p className="text-base font-black text-slate-900 mt-1">
                  {nextDisplayMed.name} ({nextDisplayMed.timeFormatted || formatTime12h(nextDisplayMed.time)})
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold uppercase">Walking Steps</span>
                <p className="text-base font-black text-primary-600 mt-1">4,250 Steps</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-bold uppercase">Adherence</span>
                <p className="text-base font-black text-slate-900 mt-1">98.4% (Stable)</p>
              </div>
            </div>
          </div>

          {/* Main 2-Column Monitoring Grid */}
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Active Medication Schedules (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Live Medication Updates Feed */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center">
                    <Activity size={18} className="text-orange-500 mr-2" /> Live Patient Medication Logs
                  </h3>
                  <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full">Socket Active</span>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {updates.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium py-3 text-center">Live medication confirmation updates from Patient Vicky will appear here.</p>
                  ) : (
                    updates.map(upd => (
                      <div 
                        key={upd.id} 
                        className={`p-3.5 rounded-2xl border flex items-start space-x-3 text-xs ${
                          upd.type === 'EMERGENCY' 
                            ? 'bg-red-50 border-red-300 text-red-900 font-black animate-pulse' 
                            : 'bg-slate-50 border-slate-100 text-slate-800'
                        }`}
                      >
                        <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold">{upd.message}</p>
                          <span className="text-[10px] opacity-60 font-mono mt-0.5 block">{upd.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Scheduled Medicines */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center">
                    <Pill size={18} className="text-pink-600 mr-2" /> Active Medication Schedules ({schedulesList.length})
                  </h3>
                  <button 
                    onClick={() => setShowScheduleModal(true)}
                    className="text-xs font-black text-orange-600 hover:text-orange-700"
                  >
                    + Add New
                  </button>
                </div>

                <div className="space-y-2.5">
                  {schedulesList.map(item => (
                    <div key={item.id || item.name} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-900 text-sm block">{item.name}</strong>
                        <span className="text-slate-500">{item.timeFormatted || formatTime12h(item.time)} • {item.when} ({item.dosage})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleDeleteSchedule(item.name)}
                          className="text-red-600 hover:text-red-700 font-bold px-2.5 py-1 bg-white rounded-lg border border-slate-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Patient & Doctor Real-Time Chat (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center">
                    <MessageSquare size={18} className="text-rose-500 mr-2" /> Real-Time Messages & Voice Notes
                  </h3>
                </div>

                {/* Recipient Selector */}
                <div className="flex items-center space-x-1.5 text-xs font-bold bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 uppercase text-[10px]">Send To:</span>
                  <button 
                    type="button" 
                    onClick={() => setSendTarget('both')}
                    className={`px-2.5 py-1 rounded-lg transition ${sendTarget === 'both' ? 'bg-orange-600 text-white font-black shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    Both
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSendTarget('patient')}
                    className={`px-2.5 py-1 rounded-lg transition ${sendTarget === 'patient' ? 'bg-pink-600 text-white font-black shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    Patient
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSendTarget('doctor')}
                    className={`px-2.5 py-1 rounded-lg transition ${sendTarget === 'doctor' ? 'bg-emerald-600 text-white font-black shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    Doctor
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 min-h-[220px] max-h-[300px] overflow-y-auto space-y-3 border border-slate-100 text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-center">
                      <p className="font-bold">No messages yet.</p>
                      <p className="text-[11px] mt-0.5">Use mic or type below to send notes to Vicky and Dr. Arun.</p>
                    </div>
                  ) : (
                    chatMessages.map(msg => (
                      <div key={msg.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 mb-1">
                          <span className="text-orange-700 font-black">{msg.senderName} • To {msg.target || 'Both'}</span>
                          <span className="font-mono">{msg.time}</span>
                        </div>
                        <p className="text-slate-800 font-medium">{msg.text}</p>

                        <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100">
                          <button 
                            onClick={() => playAudioMessage(msg.text)}
                            className="px-2.5 py-0.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-xs font-black flex items-center space-x-1 transition"
                          >
                            <Play size={12} />
                            <span>Play Audio</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Form with Mic and Text */}
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Send note to Vicky or Doctor..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                  />

                  <button 
                    type="button"
                    onClick={handleSpeakCaretakerChat}
                    className={`p-2.5 rounded-xl transition ${
                      isRecordingCaretaker ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                    }`}
                    title="Speak into mic"
                  >
                    <Mic size={16} />
                  </button>

                  <button 
                    type="submit" 
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center shadow-md"
                  >
                    <Send size={14} className="mr-1" /> Send
                  </button>
                </form>

                {isRecordingCaretaker && (
                  <p className="text-xs text-red-600 font-bold animate-pulse">🎤 Listening to speech... Speak now!</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: MY PATIENT TAB
          ========================================================================= */}
      {activeTab === 'patient' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Caretaker Full Access</span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">Patient Complete Profile: Vicky (PT1001)</h2>
              </div>
              <a href="tel:+919840111223" className="bg-pink-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center">
                <Phone size={14} className="mr-1.5" /> Call Vicky
              </a>
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase">Identity & Health</h3>
                <div className="flex justify-between"><span className="text-slate-500">Age:</span><span className="font-bold">68 Years</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Date of Birth:</span><span className="font-bold">15 August 1958</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Aadhar:</span><span className="font-mono font-bold">XXXX-XXXX-4589</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Height & Weight:</span><span className="font-bold">172 cm • 68 kg</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Condition:</span><span className="font-bold text-pink-700">Type 2 Diabetes & Mild BP</span></div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase">Connected Emergency Numbers</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">Relative 1: Rajesh (Son)</p>
                    <p className="text-xs font-mono text-slate-600 font-bold">8531830253</p>
                  </div>
                  <a href="tel:8531830253" className="bg-orange-500 text-white p-2 rounded-xl"><Phone size={14}/></a>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <div>
                    <p className="font-bold text-slate-900">Relative 2: Meena (Daughter)</p>
                    <p className="text-xs font-mono text-slate-600 font-bold">9487253863</p>
                  </div>
                  <a href="tel:9487253863" className="bg-pink-500 text-white p-2 rounded-xl"><Phone size={14}/></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCHEDULE CREATION MODAL
          ========================================================================= */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 lg:p-8 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 uppercase">Schedule Medicine for Patient</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Medicine Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Paracetamol / Cough Syrup" 
                  value={scheduleForm.medicine_name} 
                  onChange={e => setScheduleForm({...scheduleForm, medicine_name: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Medicine Type</label>
                  <select 
                    value={scheduleForm.type}
                    onChange={e => setScheduleForm({...scheduleForm, type: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none"
                  >
                    <option value="Tablet">Tablet / Pill</option>
                    <option value="Syrup / Drops">Syrup / Drops</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Injection">Injection</option>
                  </select>
                </div>

                {scheduleForm.type === 'Syrup / Drops' ? (
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Syrup Drops / Quantity</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. 5ml (10 Drops)" 
                      value={scheduleForm.syrup_drops} 
                      onChange={e => setScheduleForm({...scheduleForm, syrup_drops: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Pills Count</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. 1 Tablet (500mg)" 
                      value={scheduleForm.pills_count} 
                      onChange={e => setScheduleForm({...scheduleForm, pills_count: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Scheduled Time (HH:MM)</label>
                  <input 
                    type="time" 
                    required 
                    value={scheduleForm.time} 
                    onChange={e => setScheduleForm({...scheduleForm, time: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">When to Take</label>
                  <select 
                    value={scheduleForm.when}
                    onChange={e => setScheduleForm({...scheduleForm, when: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none"
                  >
                    <option value="After Breakfast">After Breakfast</option>
                    <option value="Before Lunch">Before Lunch</option>
                    <option value="After Dinner">After Dinner</option>
                    <option value="Before Bed with Water">Before Bed with Water</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Duration & Notes</label>
                <input 
                  type="text" 
                  placeholder="e.g. Daily / 3 Days Course" 
                  value={scheduleForm.instructions} 
                  onChange={e => setScheduleForm({...scheduleForm, instructions: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md"
                >
                  Save & Sync to Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
