import { db } from './db';
import { generateVoiceMessage, playLocalAlarm } from '../voice/audioManager';

// Runs locally on the patient's device
export async function checkOfflineReminders() {
  const now = new Date();
  const currentTimeString = now.toTimeString().split(' ')[0].substring(0, 5); // "09:00"

  // Fetch accepted active schedules
  const activeSchedules = await db.schedules
    .filter(schedule => schedule.status === 'ACCEPTED' && schedule.type === 'MEDICINE')
    .toArray();

  for (const schedule of activeSchedules) {
    if (schedule.scheduled_time.substring(0,5) === currentTimeString) {
      const occurrenceId = `${schedule.id}_${now.toISOString().split('T')[0]}`;
      
      // Check if we already handled this occurrence to prevent duplicate alarms
      const existing = await db.sync_queue.where('client_event_id').startsWith(occurrenceId).first();
      
      if (!existing) {
        triggerReminderSequence(schedule, occurrenceId);
      }
    }
  }
}

function triggerReminderSequence(schedule, occurrenceId) {
  // 1. Long Alert Sound
  playLocalAlarm();
  
  // 2. Voice Reminder (dynamically generated based on schedule)
  setTimeout(() => {
    generateVoiceMessage(`It is time to take your medicine. Please take ${schedule.dosage} ${schedule.medicine_name} ${schedule.instructions}.`);
  }, 2000); // 2 second delay after alarm

  // 3. Dispatch an event to the React UI to show the full-screen modal
  const event = new CustomEvent('SHOW_REMINDER_UI', { 
    detail: { schedule, occurrenceId }
  });
  window.dispatchEvent(event);
}

// Set up polling (In a real PWA on Android, this would use the Notification / Alarm API via service worker, but for web we poll)
export function startReminderEngine() {
  console.log('Starting offline reminder engine...');
  // Check every minute
  setInterval(checkOfflineReminders, 60000);
}
