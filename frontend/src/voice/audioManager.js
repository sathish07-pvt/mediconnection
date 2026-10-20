// Robust Web Audio API Synthesizer + SpeechSynthesis for MediGuard Patient Alarms

let audioCtx = null;
let activeBeepInterval = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Plays a single or rapid sequence of medical alarm beeps
export function playMedicalBeep(frequency = 880, duration = 0.25, type = 'sine') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Beep envelope
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn("Could not play medical beep:", err);
  }
}

// Repeated alarm pattern: High-urgency hospital / reminder beep
export function startUrgentAlarm(round = 1) {
  stopUrgentAlarm();
  const baseFreq = round === 1 ? 880 : round === 2 ? 1046 : 1318; // Frequency increases with round

  // Play double beep immediately
  playDoubleBeep(baseFreq);

  // Repeat every 1.5 seconds
  activeBeepInterval = setInterval(() => {
    playDoubleBeep(baseFreq);
  }, 1500);
}

function playDoubleBeep(frequency) {
  playMedicalBeep(frequency, 0.15, 'square');
  setTimeout(() => {
    playMedicalBeep(frequency * 1.15, 0.2, 'square');
  }, 200);
}

export function stopUrgentAlarm() {
  if (activeBeepInterval) {
    clearInterval(activeBeepInterval);
    activeBeepInterval = null;
  }
}

// Voice synthesis reminder for elderly patients
export function speakReminder(text) {
  if (!('speechSynthesis' in window)) {
    console.warn("Speech synthesis not supported in this browser.");
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Clear any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Pick clear English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 0.88; // Slower, clearer cadence for elderly patients
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Speech synthesis error:", e);
  }
}

// Backward compatible aliases for offline reminder engine
export const generateVoiceMessage = speakReminder;
export const playLocalAlarm = () => {
  playDoubleBeep(880);
};
