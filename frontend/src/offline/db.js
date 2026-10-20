import Dexie from 'dexie';

export const db = new Dexie('MediGuardDB');

db.version(1).stores({
  // Stores accepted schedules for offline reminder execution
  schedules: 'id, schedule_version, patient_id, status, type',
  
  // Local queue for events (taken/missed/voice)
  sync_queue: 'client_event_id, sync_status, timestamp',
  
  // Cached generic data
  cache: 'key' 
});
