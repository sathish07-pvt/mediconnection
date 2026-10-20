// Real-time Multi-Role Chat Store for Patient, Caretaker & Doctor
import { socket } from '../socket';
import { speakReminder } from '../voice/audioManager';

const CHAT_STORAGE_KEY = 'mediguard_chat_history_v2';

export function getStoredMessages() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error reading chat history", e);
  }
  return []; // Clean empty start (no predefined static messages)
}

export function saveChatMessage(msg) {
  try {
    const current = getStoredMessages();
    // Avoid duplicates by id
    const exists = current.some(m => m.id === msg.id);
    const updated = exists ? current : [...current, msg];
    
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('MEDIGUARD_CHAT_SYNC', { detail: updated }));
    return updated;
  } catch (e) {
    console.error("Error saving chat message", e);
    return getStoredMessages();
  }
}

export function emitChatMessage(msgData) {
  const newMsg = {
    id: msgData.id || `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    senderRole: msgData.senderRole, // 'patient' | 'caretaker' | 'doctor'
    senderName: msgData.senderName, // 'Vicky', 'Priya', 'Dr. Arun'
    senderId: msgData.senderId,     // 'PT1001', 'CT1001', 'DR1001'
    target: msgData.target || 'both', // 'both' | 'doctor' | 'caretaker' | 'patient'
    text: msgData.text,
    time: msgData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    hasAudio: !!msgData.hasAudio
  };

  saveChatMessage(newMsg);
  socket.emit('send_chat_message', newMsg);
  return newMsg;
}

export function playAudioMessage(text) {
  if (!text) return;
  const cleanText = text.replace(/🎤|\[Voice Note\]|\[Audio Note\]/g, '').trim();
  speakReminder(cleanText || text);
}

// Voice-to-Text helper with browser SpeechRecognition
export function startVoiceSpeech(onResult, onEnd, lang = 'en') {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this browser. You can type your message directly.");
    if (onEnd) onEnd();
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang === 'ta' ? 'ta-IN' : 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if (onEnd) onEnd();
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    recognition.start();
    return recognition;
  } catch (err) {
    console.error("Failed to start speech recognition:", err);
    if (onEnd) onEnd();
    return null;
  }
}
