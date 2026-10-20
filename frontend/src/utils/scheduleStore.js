// Shared Real-Time Schedule Store for Patient, Caretaker & Doctor
import { socket } from '../socket';

export const DEFAULT_SCHEDULES = [
  {
    id: 'SCH-1',
    name: 'Metformin Hydrochloride',
    type: 'Tablet',
    dosage: '500mg (1 Tablet)',
    time: '09:50',
    timeFormatted: '09:50 AM',
    when: 'After Breakfast',
    duration: 'Daily Routine',
    purpose: 'Controls blood glucose & enhances natural insulin action.',
    instructions: 'Take with full glass of water after breakfast.',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'SCH-2',
    name: 'Glimepiride',
    type: 'Tablet',
    dosage: '1mg (1 Tablet)',
    time: '13:30',
    timeFormatted: '01:30 PM',
    when: 'Before Lunch (15 mins prior)',
    duration: 'Daily Routine',
    purpose: 'Stimulates pancreas to release natural insulin during meals.',
    instructions: 'Take 15 minutes before lunch.',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'SCH-3',
    name: 'Telmisartan',
    type: 'Tablet',
    dosage: '40mg (1 Tablet)',
    time: '20:00',
    timeFormatted: '08:00 PM',
    when: 'After Dinner',
    duration: 'Daily Routine',
    purpose: 'Protects cardiovascular health and regulates blood pressure.',
    instructions: 'Take after dinner.',
    image: 'https://images.unsplash.com/photo-1550572017-ed200f545dec?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'SCH-4',
    name: 'Cough & Multivitamin Syrup',
    type: 'Syrup / Drops',
    dosage: '10ml (20 Drops)',
    time: '21:00',
    timeFormatted: '09:00 PM',
    when: 'Before Bed with Warm Water',
    duration: '5 Days Course',
    purpose: 'Soothes throat, supplements essential vitamins and calcium.',
    instructions: 'Take 10ml before going to sleep.',
    image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=300&auto=format&fit=crop&q=80'
  }
];

// Format HH:MM 24h to 12h AM/PM
export function formatTime12h(timeStr) {
  if (!timeStr) return '09:00 AM';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // '0' becomes '12'
  const hDisplay = h < 10 ? '0' + h : h;
  return `${hDisplay}:${m} ${ampm}`;
}

export function getStoredSchedules() {
  try {
    const raw = localStorage.getItem('mediguard_schedules');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error reading schedules from localStorage", e);
  }
  return DEFAULT_SCHEDULES;
}

export function saveSchedules(schedules, broadcast = true) {
  try {
    localStorage.setItem('mediguard_schedules', JSON.stringify(schedules));
    window.dispatchEvent(new CustomEvent('MEDIGUARD_SCHEDULES_SYNC', { detail: schedules }));
    
    if (broadcast) {
      socket.emit('schedule_updated', {
        patientId: 'PT1001',
        schedules
      });
    }
  } catch (e) {
    console.error("Error saving schedules to localStorage", e);
  }
}

export function addScheduleItem(newMed) {
  const current = getStoredSchedules();
  const timeFormatted = formatTime12h(newMed.time);
  
  const item = {
    id: `SCH-${Date.now()}`,
    name: newMed.name,
    type: newMed.type || 'Tablet',
    dosage: newMed.dosage || '1 Tablet',
    time: newMed.time || '09:00',
    timeFormatted: timeFormatted,
    when: newMed.when || 'After Food',
    duration: newMed.duration || 'Daily',
    purpose: newMed.purpose || newMed.instructions || 'Prescribed health maintenance.',
    instructions: newMed.instructions || 'Take with water as directed.',
    image: newMed.image || (newMed.type === 'Syrup / Drops' 
      ? 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=300&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80')
  };

  const updated = [item, ...current.filter(c => c.name.toLowerCase() !== item.name.toLowerCase())];
  saveSchedules(updated);
  return updated;
}

export function deleteScheduleItem(medicineName) {
  const current = getStoredSchedules();
  const updated = current.filter(c => c.name.toLowerCase() !== medicineName.toLowerCase());
  saveSchedules(updated);
  
  socket.emit('schedule_deleted', {
    patientId: 'PT1001',
    medicine: medicineName
  });
  return updated;
}

// Calculate the Next Upcoming / Going to take medicine based on clock time
export function getNextUpcomingMedicine(schedules = []) {
  if (!schedules || schedules.length === 0) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Convert each medicine's time to minutes from midnight
  const parsed = schedules.map(m => {
    let [h, min] = (m.time || '09:00').split(':').map(n => parseInt(n, 10));
    // If format is like '09:50 AM'
    if (m.timeFormatted && (m.timeFormatted.includes('AM') || m.timeFormatted.includes('PM'))) {
      const parts = m.timeFormatted.split(' ');
      const [ph, pmin] = parts[0].split(':').map(n => parseInt(n, 10));
      h = ph;
      if (parts[1] === 'PM' && h !== 12) h += 12;
      if (parts[1] === 'AM' && h === 12) h = 0;
      min = pmin;
    }
    const totalMinutes = (isNaN(h) ? 9 : h) * 60 + (isNaN(min) ? 0 : min);
    return { ...m, totalMinutes };
  });

  // Sort ascending by time
  parsed.sort((a, b) => a.totalMinutes - b.totalMinutes);

  // Find the next one that is >= currentMinutes
  const next = parsed.find(m => m.totalMinutes >= currentMinutes);

  // If all doses for today have passed, loop back to the first dose of the day!
  return next || parsed[0];
}
