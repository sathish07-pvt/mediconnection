import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Pill, FileText, Calendar, User, Mic, MicOff, AlertCircle, 
  Activity, Stethoscope, Phone, Clock, CheckCircle2, 
  Info, Send, ShieldAlert, Footprints, AlertTriangle, Volume2, Play, Square, Check
} from 'lucide-react';
import { socket, connectSocket } from '../../socket';
import { startUrgentAlarm, stopUrgentAlarm, speakReminder } from '../../voice/audioManager';
import { translations } from '../../utils/translations';
import { 
  getStoredSchedules, 
  saveSchedules, 
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

export default function PatientDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Multi-Language state
  const [lang, setLang] = useState(localStorage.getItem('mediguard_lang') || 'en');
  const t = translations[lang] || translations.en;

  // Active Tab determined from URL (No follow-up tab)
  const currentPath = location.pathname;
  let activeTab = 'dashboard';
  if (currentPath.includes('/profile')) activeTab = 'profile';
  else if (currentPath.includes('/dashboard')) activeTab = 'dashboard';
  else if (currentPath.includes('/medicines')) activeTab = 'medicines';
  else if (currentPath.includes('/schedule')) activeTab = 'schedule';
  else if (currentPath.includes('/reports')) activeTab = 'reports';
  else if (currentPath.includes('/activity')) activeTab = 'activity';
  else if (currentPath.includes('/messages')) activeTab = 'messages';
  else if (currentPath.includes('/emergency')) activeTab = 'emergency';

  // Live Schedules Store
  const [schedules, setSchedules] = useState(getStoredSchedules());
  const [nextMedicine, setNextMedicine] = useState(getNextUpcomingMedicine(schedules));

  // State: Alarm & 15-sec 3-Cycle Escalation (45s total)
  const [alarmActive, setAlarmActive] = useState(false);
  const [alarmRound, setAlarmRound] = useState(1);
  const [alarmTimer, setAlarmTimer] = useState(15);
  const [alarmMedicine, setAlarmMedicine] = useState(nextMedicine || schedules[0]);
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [isRecordingReason, setIsRecordingReason] = useState(false);
  const [confirmedToast, setConfirmedToast] = useState(null);
  const lastTriggeredRef = useRef({});

  // State: Real-Time Chat & Voice
  const [messagesList, setMessagesList] = useState(getStoredMessages());
  const [messageText, setMessageText] = useState('');
  const [sendTarget, setSendTarget] = useState('both');
  const [isRecordingChat, setIsRecordingChat] = useState(false);

  // Update Next Medicine whenever schedules change
  useEffect(() => {
    const next = getNextUpcomingMedicine(schedules);
    setNextMedicine(next);
    if (next && !alarmActive) {
      setAlarmMedicine(next);
    }
  }, [schedules, alarmActive]);

  // Load User, Sockets & Chat Listeners
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user')) || {
      name: 'Vicky',
      user_id: 'PT1001',
      role: 'patient',
      phone: '+91 98401 11223'
    };
    setUser(u);
    connectSocket(u.user_id);

    // Language listener
    const handleLangChange = (e) => setLang(e.detail);
    window.addEventListener('LANGUAGE_CHANGED', handleLangChange);

    // Sync schedules across tabs
    const handleSchedulesSync = (e) => {
      if (e.detail) setSchedules(e.detail);
    };
    window.addEventListener('MEDIGUARD_SCHEDULES_SYNC', handleSchedulesSync);

    // Sync chat across tabs
    const handleChatSync = (e) => {
      if (e.detail) setMessagesList(e.detail);
    };
    window.addEventListener('MEDIGUARD_CHAT_SYNC', handleChatSync);

    // Real-Time Socket Schedule updates
    socket.on('schedule_received', (data) => {
      if (data?.schedules) {
        setSchedules(data.schedules);
        saveSchedules(data.schedules, false);
      } else if (data?.schedule) {
        const item = data.schedule;
        setSchedules(prev => {
          const updated = [item, ...prev.filter(p => p.name.toLowerCase() !== item.name.toLowerCase())];
          saveSchedules(updated, false);
          return updated;
        });
      }
    });

    socket.on('schedule_deleted', (data) => {
      setSchedules(prev => {
        const updated = prev.filter(m => m.name.toLowerCase() !== data.medicine.toLowerCase());
        saveSchedules(updated, false);
        return updated;
      });
    });

    // Real-Time Socket Chat Messages
    socket.on('chat_message_received', (msg) => {
      // Show message if intended for patient or both
      if (!msg.target || msg.target === 'both' || msg.target === 'all' || msg.target === 'patient' || msg.senderRole === 'patient') {
        setMessagesList(prev => saveChatMessage(msg));
      }
    });

    return () => {
      stopUrgentAlarm();
      window.removeEventListener('LANGUAGE_CHANGED', handleLangChange);
      window.removeEventListener('MEDIGUARD_SCHEDULES_SYNC', handleSchedulesSync);
      window.removeEventListener('MEDIGUARD_CHAT_SYNC', handleChatSync);
      socket.off('schedule_received');
      socket.off('schedule_deleted');
      socket.off('chat_message_received');
    };
  }, []);

  // AUTOMATIC MEDICINE ALARM CLOCK CHECKER
  useEffect(() => {
    const clockInterval = setInterval(() => {
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      
      const pad = (n) => (n < 10 ? '0' + n : n);
      const currentTime24 = `${pad(currentH)}:${pad(currentM)}`;
      const todayKey = now.toISOString().split('T')[0];

      schedules.forEach(med => {
        let medTime24 = med.time || '09:50';
        if (medTime24.length === 5 && medTime24 === currentTime24) {
          const triggerKey = `${med.name}_${todayKey}_${currentTime24}`;
          if (!lastTriggeredRef.current[triggerKey] && !alarmActive) {
            lastTriggeredRef.current[triggerKey] = true;
            setAlarmMedicine(med);
            setAlarmActive(true);
            setAlarmRound(1);
            setAlarmTimer(15);
            startUrgentAlarm(1);
            speakReminder(lang === 'ta'
              ? `மருந்து எடுக்கும் நேரம்! தயவுசெய்து ${med.name} ${med.dosage} உட்கொள்ளவும்.`
              : `Medicine Time! Please take your ${med.name} ${med.dosage}.`);
          }
        }
      });
    }, 3000);

    return () => clearInterval(clockInterval);
  }, [schedules, alarmActive, lang]);

  // Alarm 15-second timer per round (3 rounds = 45s total)
  useEffect(() => {
    let interval = null;
    if (alarmActive) {
      interval = setInterval(() => {
        setAlarmTimer(prev => {
          if (prev <= 1) {
            if (alarmRound < 3) {
              const nextRound = alarmRound + 1;
              setAlarmRound(nextRound);
              startUrgentAlarm(nextRound);
              speakReminder(lang === 'ta' 
                ? `அவசர எச்சரிக்கை சுற்று ${nextRound}. உங்கள் மருந்தை உட்கொள்ளவும்.` 
                : `Urgent reminder round ${nextRound}. Please take your medicine ${alarmMedicine.name}.`);
              return 15;
            } else {
              // 3rd Round expired (45s total) -> Instant direct emergency call
              handleAutoCallRelative();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      stopUrgentAlarm();
    }
    return () => clearInterval(interval);
  }, [alarmActive, alarmRound, alarmMedicine, lang]);

  // Trigger manual test alarm
  const triggerManualTestAlarm = () => {
    const medToTest = nextMedicine || schedules[0] || {
      name: 'Metformin Hydrochloride',
      dosage: '500mg (1 Tablet)',
      instructions: 'Take after breakfast with warm water',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80'
    };
    setAlarmMedicine(medToTest);
    setAlarmActive(true);
    setAlarmRound(1);
    setAlarmTimer(15);
    startUrgentAlarm(1);
    speakReminder(lang === 'ta' 
      ? `மருந்து எடுக்கும் நேரம்! தயவுசெய்து ${medToTest.name} உட்கொள்ளவும்.` 
      : `Medicine Time! Please take your ${medToTest.name} ${medToTest.dosage}.`);
  };

  // Confirm medicine taken (Instantly closes modal & stops beeping without blocking alert!)
  const handleConfirmMedicineTaken = () => {
    stopUrgentAlarm();
    setAlarmActive(false);
    setShowRejectReasonModal(false);

    socket.emit('medicine_taken', {
      patientId: user?.user_id || 'PT1001',
      patientName: user?.name || 'Vicky',
      medicine: alarmMedicine.name,
      dosage: alarmMedicine.dosage,
      caretakerId: 'CT1001',
      doctorId: 'DR1001',
      time: new Date().toLocaleTimeString()
    });

    setConfirmedToast(`✓ Confirmed: ${alarmMedicine.name} taken at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!`);
    setTimeout(() => setConfirmedToast(null), 4000);
  };

  // Send Refusal reason (Instantly closes modal and transmits)
  const handleSendRefusalReason = (reasonText) => {
    stopUrgentAlarm();
    setAlarmActive(false);
    setShowRejectReasonModal(false);
    setIsRecordingReason(false);

    const payload = {
      patientId: user?.user_id || 'PT1001',
      patientName: user?.name || 'Vicky',
      medicine: alarmMedicine.name,
      reason: reasonText,
      time: new Date().toLocaleTimeString(),
      caretakerId: 'CT1001',
      doctorId: 'DR1001'
    };

    socket.emit('medicine_missed', payload);

    // Send as message to both doctor & caretaker
    emitChatMessage({
      senderRole: 'patient',
      senderName: 'Vicky (Patient)',
      senderId: 'PT1001',
      target: 'both',
      text: `⚠️ [Medicine Missed - ${alarmMedicine.name}]: ${reasonText}`,
      hasAudio: true
    });

    setConfirmedToast(`✓ Missed reason sent to Doctor & Caretaker: "${reasonText}"`);
    setTimeout(() => setConfirmedToast(null), 4000);
  };

  // Speak Refusal Reason Voice input
  const handleSpeakReason = () => {
    setIsRecordingReason(true);
    startVoiceSpeech(
      (transcript) => {
        setIsRecordingReason(false);
        handleSendRefusalReason(`Spoken Reason: ${transcript}`);
      },
      () => setIsRecordingReason(false),
      lang
    );
  };

  // Auto-Call Relative after 3 missed rounds (45s total)
  const handleAutoCallRelative = () => {
    stopUrgentAlarm();
    setAlarmActive(false);

    socket.emit('emergency_alert', {
      patientId: user?.user_id || 'PT1001',
      patientName: user?.name || 'Vicky',
      reason: `Patient did not respond to 3 consecutive medicine alarm rounds (15s each = 45s total) for ${alarmMedicine.name}`,
      time: new Date().toLocaleTimeString(),
      caretakerId: 'CT1001',
      doctorId: 'DR1001'
    });

    const directDialAnchor = document.createElement('a');
    directDialAnchor.href = "tel:8531830253";
    document.body.appendChild(directDialAnchor);
    directDialAnchor.click();
    document.body.removeChild(directDialAnchor);

    window.location.href = "tel:8531830253";
  };

  // Speak Message in Chat
  const handleSpeakChatMessage = () => {
    setIsRecordingChat(true);
    startVoiceSpeech(
      (transcript) => {
        setMessageText(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecordingChat(false);
      },
      () => setIsRecordingChat(false),
      lang
    );
  };

  // Send Message / Voice Note
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    emitChatMessage({
      senderRole: 'patient',
      senderName: 'Vicky (Patient)',
      senderId: user?.user_id || 'PT1001',
      target: sendTarget,
      text: messageText,
      hasAudio: isRecordingChat || messageText.length > 0
    });

    setMessageText('');
  };

  if (!user) return <div className="p-8 text-center text-slate-500 font-bold">Loading MediGuard...</div>;

  const currentDisplayMed = nextMedicine || schedules[0] || {
    name: 'Metformin Hydrochloride',
    dosage: '500mg (1 Tablet)',
    timeFormatted: '09:50 AM',
    when: 'After Breakfast',
    purpose: 'Controls blood glucose levels & enhances natural insulin action.',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80'
  };

  return (
    <div className="pb-16 max-w-5xl mx-auto font-sans relative">

      {/* NON-BLOCKING CONFIRMATION TOAST */}
      {confirmedToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-2 font-bold text-xs animate-bounce">
          <Check size={18} />
          <span>{confirmedToast}</span>
        </div>
      )}

      {/* =========================================================================
          TAB 1: PROFILE (FIRST IN SIDEBAR AS REQUESTED)
          ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-pink-100 shadow-sm">
            
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-slate-100">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-pink-600 to-purple-600 text-white flex items-center justify-center font-black text-3xl shadow-lg border-4 border-white">
                V
              </div>
              <div className="text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <h2 className="text-2xl font-black text-slate-900">Vicky (Rajaraman)</h2>
                  <span className="bg-pink-100 text-pink-800 text-xs font-black px-2.5 py-0.5 rounded-full">PT1001</span>
                </div>
                <p className="text-slate-500 text-sm font-medium mt-0.5">Senior Patient • Monitored under MediGuard</p>
                <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                  <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg">Age: 68 Years</span>
                  <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg">Blood: B+ Positive</span>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg">Condition: Type 2 Diabetes</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-6">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">{t.personalInfo}</h3>
                
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">{t.dob}:</span>
                    <span className="font-bold text-slate-900">15 August 1958</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">{t.age}:</span>
                    <span className="font-bold text-slate-900">68 Years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">{t.aadhar}:</span>
                    <span className="font-mono font-bold text-slate-900">XXXX-XXXX-4589</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">{t.primaryContact}:</span>
                    <span className="font-mono font-bold text-slate-900">+91 98401 11223</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">{t.heightWeight}:</span>
                    <span className="font-bold text-slate-900">172 cm • 68 kg</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">{t.emergencyContacts}</h3>
                
                <div className="space-y-3">
                  <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-orange-700 uppercase">{t.relative1}</span>
                      <p className="font-bold text-slate-900 text-sm">Rajesh</p>
                      <p className="text-xs font-mono text-slate-600 font-bold">8531830253</p>
                    </div>
                    <a href="tel:8531830253" className="bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-xl shadow-sm transition">
                      <Phone size={18} />
                    </a>
                  </div>

                  <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-pink-700 uppercase">{t.relative2}</span>
                      <p className="font-bold text-slate-900 text-sm">Meena</p>
                      <p className="text-xs font-mono text-slate-600 font-bold">9487253863</p>
                    </div>
                    <a href="tel:9487253863" className="bg-pink-500 hover:bg-pink-600 text-white p-2.5 rounded-xl shadow-sm transition">
                      <Phone size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-red-50 p-6 rounded-2xl border border-red-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md">
                  100
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">{t.call100}</h4>
                  <p className="text-xs text-slate-600 font-medium">Immediate national police and medical ambulance hotline.</p>
                </div>
              </div>
              <a 
                href="tel:100" 
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-black text-sm px-6 py-3.5 rounded-xl shadow-md transition text-center uppercase tracking-wider"
              >
                {t.call} 100
              </a>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DASHBOARD
          ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          <div className="bg-gradient-to-r from-pink-600 to-purple-700 rounded-3xl p-6 lg:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-white/20 text-white text-xs font-black uppercase px-3 py-1 rounded-full border border-white/20">
                {t.patientId}: {user.user_id}
              </span>
              <h1 className="text-3xl lg:text-4xl font-black mt-2 tracking-tight">{t.welcome}, {user.name}</h1>
              <p className="text-pink-100 text-sm mt-1 font-medium">{t.tagline}</p>
            </div>

            <button 
              onClick={triggerManualTestAlarm}
              className="bg-white text-pink-700 hover:bg-pink-50 font-black text-sm px-5 py-3.5 rounded-2xl shadow-lg transition flex items-center space-x-2"
            >
              <Volume2 size={18} className="text-red-500 animate-bounce" />
              <span>{t.testAlarm}</span>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-bold">
                  <User size={26} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.caretakerContact}</span>
                    <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center">
                      {t.connected} <CheckCircle2 size={10} className="ml-1" />
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Priya (Caretaker)</h3>
                  <p className="text-sm text-slate-600 font-mono font-bold">7305879007</p>
                </div>
              </div>
              <a 
                href="tel:7305879007" 
                className="bg-orange-50 hover:bg-orange-100 text-orange-700 p-3.5 rounded-xl transition border border-orange-200 shadow-sm"
              >
                <Phone size={22} />
              </a>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
                  <Stethoscope size={26} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.doctorContact}</span>
                    <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center">
                      {t.connected} <CheckCircle2 size={10} className="ml-1" />
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Dr. Arun (Cardiologist)</h3>
                  <p className="text-sm text-slate-600 font-mono font-bold">6379730327</p>
                </div>
              </div>
              <a 
                href="tel:6379730327" 
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-3.5 rounded-xl transition border border-emerald-200 shadow-sm"
              >
                <Phone size={22} />
              </a>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 lg:p-8 border-2 border-pink-200 shadow-md">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-pink-700 font-bold uppercase text-xs tracking-wider">
                <Pill size={20} className="text-pink-600" />
                <span>{t.nextMedicine}</span>
              </div>
              <span className="bg-pink-100 text-pink-800 font-black text-xs px-3 py-1 rounded-full uppercase">
                {currentDisplayMed.when || 'Upcoming Dose'}
              </span>
            </div>

            <div className="pt-6 grid md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 flex items-center space-x-5">
                <img 
                  src={currentDisplayMed.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80'} 
                  alt={currentDisplayMed.name} 
                  className="w-24 h-24 object-cover rounded-2xl border border-slate-200 shadow-sm shrink-0"
                />
                <div>
                  <h2 className="text-2xl lg:text-3xl font-black text-slate-900">{currentDisplayMed.name}</h2>
                  <p className="text-base font-bold text-pink-600 mt-1">{currentDisplayMed.dosage} • {currentDisplayMed.when}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{currentDisplayMed.purpose}</p>
                </div>
              </div>

              <div className="md:col-span-4 bg-pink-50/80 p-5 rounded-2xl text-center border border-pink-100">
                <span className="text-xs font-bold text-slate-500 uppercase">{t.scheduledTime}</span>
                <p className="text-3xl font-black text-pink-700 mt-1">{currentDisplayMed.timeFormatted || formatTime12h(currentDisplayMed.time)}</p>
                <span className="text-[11px] font-bold text-slate-400 mt-1 block">Scheduled for Today</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
                <Footprints size={28} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.todaySteps}</span>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">4,250 {t.steps}</h3>
                <p className="text-xs text-emerald-600 font-bold">✓ 70% of Daily 6,000 Step Goal</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/patient/activity')}
              className="text-xs font-black text-pink-600 hover:text-pink-700 bg-pink-50 px-4 py-2.5 rounded-xl transition"
            >
              {t.activity} →
            </button>
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 3: MEDICINES
          ========================================================================= */}
      {activeTab === 'medicines' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Active Prescriptions</span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{t.medicines}</h2>
            </div>

            <div className="space-y-4">
              {schedules.map(med => (
                <div key={med.id || med.name} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col md:flex-row gap-5 items-start md:items-center">
                  <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                    <img 
                      src={med.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80'} 
                      alt={med.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                      <h3 className="text-lg font-black text-slate-900">{med.name}</h3>
                      <span className="bg-pink-100 text-pink-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                        {med.type || 'Tablet'}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3 pt-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold uppercase">{t.dosage}:</span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{med.dosage}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase">{t.whenToTake}:</span>
                        <p className="font-bold text-pink-600 text-sm mt-0.5">{med.timeFormatted || formatTime12h(med.time)} • {med.when}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase">{t.purpose}:</span>
                        <p className="text-slate-600 font-medium mt-0.5">{med.purpose || med.instructions}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SCHEDULE
          ========================================================================= */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{t.schedule}</span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">Daily Schedule & Tablet Guide</h2>
            </div>

            <div className="space-y-3">
              {schedules.map((s) => {
                const isNext = nextMedicine?.name === s.name;
                return (
                  <div 
                    key={s.id || s.name} 
                    className={`p-4 rounded-2xl border flex items-center justify-between ${
                      isNext ? 'bg-pink-50 border-pink-300 shadow-sm' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="font-mono font-black text-slate-900 text-base">{s.timeFormatted || formatTime12h(s.time)}</span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.when} ({s.dosage})</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      isNext ? 'bg-pink-600 text-white font-black' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isNext ? 'Next Dose' : 'Scheduled'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">
                {t.tabletGuide}
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <h4 className="font-extrabold text-blue-900 text-sm mb-1 flex items-center">
                    <Info size={16} className="mr-1.5 text-blue-600" /> Metformin (Blood Sugar Tablet)
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    Helps your body handle insulin better and prevents sugar spikes after eating. Always take <strong>after your morning meal</strong>.
                  </p>
                </div>

                <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100">
                  <h4 className="font-extrabold text-purple-900 text-sm mb-1 flex items-center">
                    <Info size={16} className="mr-1.5 text-purple-600" /> Telmisartan (Blood Pressure Tablet)
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    Gently relaxes blood vessels to keep blood pressure in the healthy range and protect kidney function.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: REAL-TIME CHAT & VOICE (No static predefined messages)
          ========================================================================= */}
      {activeTab === 'messages' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{t.messages}</span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">{t.sendMessage}</h2>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-black px-3 py-1 rounded-full flex items-center w-fit">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-ping"></span> Live Connected
              </span>
            </div>

            {/* Recipient Selector */}
            <div className="flex items-center space-x-3 text-xs font-bold bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-slate-500 uppercase">{t.sendTo}:</span>
              <button 
                type="button" 
                onClick={() => setSendTarget('both')}
                className={`px-3.5 py-1.5 rounded-xl transition ${sendTarget === 'both' ? 'bg-pink-600 text-white font-black shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                {t.both} (Doctor & Caretaker)
              </button>
              <button 
                type="button" 
                onClick={() => setSendTarget('doctor')}
                className={`px-3.5 py-1.5 rounded-xl transition ${sendTarget === 'doctor' ? 'bg-emerald-600 text-white font-black shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                {t.doctorOnly}
              </button>
              <button 
                type="button" 
                onClick={() => setSendTarget('caretaker')}
                className={`px-3.5 py-1.5 rounded-xl transition ${sendTarget === 'caretaker' ? 'bg-orange-600 text-white font-black shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                {t.caretakerOnly}
              </button>
            </div>

            {/* Live Chat Stream */}
            <div className="bg-slate-50 rounded-2xl p-4 min-h-[280px] max-h-[400px] overflow-y-auto space-y-3 border border-slate-100 text-xs">
              {messagesList.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-center">
                  <Mic size={32} className="mb-2 opacity-50" />
                  <p className="font-bold">No messages yet.</p>
                  <p className="text-[11px] mt-1">Speak into the mic or type below to send to Caretaker and Doctor in real-time!</p>
                </div>
              ) : (
                messagesList.map(msg => {
                  const isMine = msg.senderRole === 'patient' || msg.senderId === 'PT1001';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-md p-4 rounded-2xl text-sm font-medium shadow-sm ${
                        isMine 
                          ? 'bg-pink-600 text-white rounded-br-none' 
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                      }`}>
                        <div className={`text-[10px] font-black uppercase mb-1 ${isMine ? 'text-pink-200' : 'text-slate-500'}`}>
                          {msg.senderName} • To {msg.target || 'Both'}
                        </div>
                        <p className="leading-relaxed">{msg.text}</p>

                        <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-white/20">
                          {/* Play Audio Button for all messages */}
                          <button 
                            onClick={() => playAudioMessage(msg.text)}
                            className={`px-3 py-1 rounded-lg text-xs font-black flex items-center space-x-1.5 transition ${
                              isMine ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                            }`}
                          >
                            <Play size={13} />
                            <span>{t.playAudio}</span>
                          </button>

                          <span className="text-[10px] opacity-80 font-mono">{msg.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form with Voice Mic & Text */}
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t.typeOrSpeak}
                  className="w-full pl-5 pr-28 py-4 border border-slate-200 rounded-2xl text-sm font-medium bg-slate-50 text-slate-900 focus:ring-2 focus:ring-pink-500 outline-none"
                />

                <div className="absolute right-2.5 flex items-center space-x-2">
                  <button 
                    type="button"
                    onClick={handleSpeakChatMessage}
                    className={`p-3 rounded-xl transition ${
                      isRecordingChat 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                    }`}
                    title="Speak into mic (Voice to Text)"
                  >
                    <Mic size={18} />
                  </button>

                  <button 
                    type="submit"
                    className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-xl shadow-md transition"
                    title={t.send}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>

              {isRecordingChat && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center justify-between animate-pulse">
                  <span className="flex items-center"><Mic size={16} className="mr-2" /> Listening to your speech... Speak now!</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: REPORTS
          ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Clinical Medical Record</span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{t.reports}</h2>
            </div>

            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
              <div className="flex items-center space-x-2 text-amber-800 font-black text-sm uppercase mb-2">
                <AlertTriangle size={18} />
                <span>Ongoing Patient Problem & Medical Condition</span>
              </div>
              <p className="text-slate-800 text-sm font-semibold leading-relaxed">
                Type 2 Diabetes Mellitus with mild hypertension. Under regular monitoring by Dr. Arun (6379730327) and Caretaker Priya (7305879007).
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { name: 'HbA1c Blood Sugar Report', value: '6.4% (Controlled)', date: '18 Aug 2026', status: 'Good' },
                { name: 'Blood Pressure Log', value: '124 / 82 mmHg', date: '20 Aug 2026', status: 'Stable' },
                { name: 'Kidney Function (Creatinine)', value: '0.9 mg/dL (Normal)', date: '15 Aug 2026', status: 'Good' },
                { name: 'Resting ECG Scan', value: 'Normal Sinus Rhythm', date: '10 Aug 2026', status: 'Stable' }
              ].map(rep => (
                <div key={rep.name} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-slate-900 text-sm">{rep.name}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">{rep.status}</span>
                  </div>
                  <p className="text-pink-600 font-bold text-sm mt-1">{rep.value}</p>
                  <span className="text-[11px] text-slate-400 font-medium mt-1 block">Recorded on: {rep.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: ACTIVITY
          ========================================================================= */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{t.activity}</span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">Walking & Physical Activity</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-6 rounded-3xl text-white shadow-lg">
                <span className="text-xs font-bold text-pink-100 uppercase tracking-wider">{t.todaySteps}</span>
                <h3 className="text-4xl font-black mt-2">4,250 <span className="text-lg font-medium text-pink-200">{t.steps}</span></h3>
                <p className="text-xs text-pink-100 mt-1">Target: 6,000 Steps (70% Completed)</p>

                <div className="w-full bg-white/20 rounded-full h-3 mt-4 overflow-hidden">
                  <div className="bg-white h-full rounded-full" style={{ width: '70%' }}></div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/20 text-center text-xs">
                  <div>
                    <span className="text-pink-200 block">Distance</span>
                    <strong className="text-sm">2.9 km</strong>
                  </div>
                  <div>
                    <span className="text-pink-200 block">Active Time</span>
                    <strong className="text-sm">38 mins</strong>
                  </div>
                  <div>
                    <span className="text-pink-200 block">Calories</span>
                    <strong className="text-sm">185 kcal</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{t.monthlySteps}</span>
                  <h3 className="text-4xl font-black text-slate-900 mt-2">98,400 <span className="text-lg font-medium text-slate-500">{t.steps}</span></h3>
                  <p className="text-xs text-emerald-600 font-bold mt-1">✓ Monthly walking consistency is 94%</p>
                </div>

                <div className="mt-6 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Week 1 (1 - 7 Aug):</span>
                    <span>24,500 steps</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Week 2 (8 - 14 Aug):</span>
                    <span>25,100 steps</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Week 3 (15 - 20 Aug):</span>
                    <span>26,800 steps</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: EMERGENCY
          ========================================================================= */}
      {activeTab === 'emergency' && (
        <div className="space-y-6">
          <div className="bg-red-50 rounded-3xl p-6 lg:p-10 border-2 border-red-200 text-center space-y-6">
            <div className="w-20 h-20 bg-red-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl animate-pulse">
              <ShieldAlert size={40} />
            </div>

            <div>
              <h2 className="text-3xl font-black text-red-900 uppercase tracking-tight">{t.emergency} SOS</h2>
              <p className="text-sm text-red-700 font-medium max-w-md mx-auto mt-2">
                Instant calling to your Doctor (6379730327) and Emergency Relatives (8531830253 & 9487253863).
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-3">
              <a 
                href="tel:6379730327"
                className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-red-600/30 transition flex items-center justify-center space-x-2 uppercase"
              >
                <Phone size={22} />
                <span>Call Doctor (6379730327)</span>
              </a>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-bold">
                <a href="tel:8531830253" className="bg-white p-3.5 rounded-xl border border-red-200 text-slate-800 flex items-center justify-center space-x-1.5 shadow-sm">
                  <Phone size={14} className="text-orange-600" />
                  <span>Relative 1 (8531830253)</span>
                </a>
                <a href="tel:9487253863" className="bg-white p-3.5 rounded-xl border border-red-200 text-slate-800 flex items-center justify-center space-x-1.5 shadow-sm">
                  <Phone size={14} className="text-pink-600" />
                  <span>Relative 2 (9487253863)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FULL-WINDOW MEDICINE ALARM MODAL (15-SEC PER CYCLE, 3 CYCLES = 45S TOTAL)
          ========================================================================= */}
      {alarmActive && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-950/95 backdrop-blur-xl z-[99999] flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-10 text-center shadow-2xl border-4 border-red-500 my-auto animate-pulse">
            
            <div className="flex items-center justify-center space-x-2 mb-4">
              {[1, 2, 3].map(round => (
                <div 
                  key={round}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase flex items-center space-x-1 border ${
                    alarmRound === round 
                      ? 'bg-red-600 text-white border-red-600 animate-bounce' 
                      : alarmRound > round 
                        ? 'bg-slate-200 text-slate-500 border-slate-300' 
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  <Volume2 size={14} className={alarmRound === round ? 'animate-spin' : ''} />
                  <span>Cycle {round} (15s)</span>
                </div>
              ))}
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 uppercase tracking-tight mb-2">
              {t.medicineTime}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-bold uppercase tracking-wider mb-6">
              {t.alarmAlert}
            </p>

            <div className="bg-pink-50/80 p-5 sm:p-6 rounded-3xl border-2 border-pink-200 text-left mb-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <img 
                src={alarmMedicine.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80'} 
                alt={alarmMedicine.name} 
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border border-slate-200 shadow-md shrink-0"
              />
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-pink-950">{alarmMedicine.name}</h3>
                  <span className="bg-pink-600 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-sm">
                    {alarmMedicine.dosage}
                  </span>
                </div>
                <p className="text-sm font-bold text-pink-700 mt-1.5">{alarmMedicine.when || 'Scheduled Time: ' + alarmMedicine.time}</p>
                <p className="text-xs text-slate-600 font-medium mt-1">{alarmMedicine.instructions || alarmMedicine.purpose}</p>
              </div>
            </div>

            <div className="bg-red-50 p-3.5 rounded-2xl border border-red-200 mb-6">
              <p className="text-xs sm:text-sm font-black text-red-700">
                ⚠️ Cycle {alarmRound} / 3: {alarmTimer} seconds left | Total time: 45s
              </p>
              <p className="text-[11px] text-red-600 font-semibold mt-0.5">
                {alarmRound === 3 ? '🚨 Final Cycle! Auto-calling Emergency Relative 8531830253 directly if unconfirmed!' : 'Direct emergency relative calling upon 3rd cycle expiry.'}
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleConfirmMedicineTaken}
                className="w-full py-5 sm:py-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-lg sm:text-xl rounded-2xl shadow-xl shadow-emerald-600/30 transition flex items-center justify-center space-x-3 uppercase tracking-wider"
              >
                <CheckCircle2 size={26} />
                <span>{t.iTookIt}</span>
              </button>

              <button 
                onClick={() => setShowRejectReasonModal(true)}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition uppercase tracking-wider"
              >
                {t.iDidNotTake}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFUSAL REASON MODAL WITH INSTANT VOICE TO TEXT */}
      {showRejectReasonModal && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/90 z-[999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase">{t.whyRefuse}</h3>
            
            <div className="space-y-2">
              <button 
                onClick={() => handleSendRefusalReason("I was sleeping.")}
                className="w-full p-3.5 bg-slate-50 hover:bg-pink-50 border border-slate-200 rounded-xl text-left font-bold text-xs text-slate-800 transition"
              >
                😴 {t.sleeping}
              </button>
              <button 
                onClick={() => handleSendRefusalReason("I feel dizzy and unwell.")}
                className="w-full p-3.5 bg-slate-50 hover:bg-pink-50 border border-slate-200 rounded-xl text-left font-bold text-xs text-slate-800 transition"
              >
                🤒 {t.unwell}
              </button>
              <button 
                onClick={() => handleSendRefusalReason("Stomach upset / nausea.")}
                className="w-full p-3.5 bg-slate-50 hover:bg-pink-50 border border-slate-200 rounded-xl text-left font-bold text-xs text-slate-800 transition"
              >
                🤢 {t.stomachUpset}
              </button>
            </div>

            {/* Live Mic Voice Button */}
            <button 
              type="button"
              onClick={handleSpeakReason}
              className={`w-full py-4 rounded-xl font-black text-xs shadow-md flex items-center justify-center space-x-2 transition ${
                isRecordingReason 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : 'bg-pink-600 hover:bg-pink-700 text-white'
              }`}
            >
              <Mic size={18} />
              <span>{isRecordingReason ? 'Listening... Speak your reason now!' : t.sendVoiceReason}</span>
            </button>

            <button 
              type="button" 
              onClick={() => setShowRejectReasonModal(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 block mx-auto pt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
