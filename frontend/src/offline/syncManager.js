import { db } from './db';

// Adds an event to the local sync queue
export async function queueSyncEvent(eventType, payload) {
  const event = {
    client_event_id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    event_type: eventType,
    payload: payload,
    timestamp: new Date().toISOString(),
    sync_status: 'PENDING',
    retry_count: 0
  };

  await db.sync_queue.add(event);
  
  // Try to sync immediately if online
  if (navigator.onLine) {
    processSyncQueue();
  }
  
  return event.client_event_id;
}

// Processes the queue
export async function processSyncQueue() {
  if (!navigator.onLine) return;

  const pendingEvents = await db.sync_queue
    .where('sync_status')
    .equals('PENDING')
    .toArray();

  if (pendingEvents.length === 0) return;

  console.log(`Syncing ${pendingEvents.length} events to backend...`);

  try {
    const response = await fetch('http://localhost:5000/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ events: pendingEvents })
    });

    if (response.ok) {
      // Mark as synced
      for (const event of pendingEvents) {
        await db.sync_queue.update(event.client_event_id, { sync_status: 'SYNCED' });
      }
      console.log('Sync complete.');
    } else {
      console.error('Server rejected sync payload');
    }
  } catch (error) {
    console.error('Sync failed, will retry later:', error);
  }
}

// Listen for network reconnect
window.addEventListener('online', processSyncQueue);
