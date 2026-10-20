const db = require('../config/db');

exports.processSync = async (req, res) => {
  const { events } = req.body;
  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    for (const event of events) {
      const { client_event_id, event_type, patient_id, timestamp, payload } = event;
      
      // Check for duplicate sync
      const [existing] = await connection.query('SELECT id FROM medicine_logs WHERE id = ?', [client_event_id]);
      if (existing.length > 0) continue; // Skip duplicate

      if (event_type === 'MEDICINE_TAKEN' || event_type === 'MEDICINE_MISSED') {
        const status = event_type === 'MEDICINE_TAKEN' ? 'taken' : 'missed';
        
        await connection.query(`
          INSERT INTO medicine_logs (id, schedule_id, patient_id, scheduled_time, actual_time, status, reason, sync_status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, 'synced')
        `, [
          client_event_id,
          payload.schedule_id,
          patient_id || 1, // Defaulting for demo
          payload.scheduled_time || timestamp,
          timestamp,
          status,
          payload.reason || null
        ]);

        // Generate Caretaker Notification
        const [schedule] = await connection.query('SELECT created_by, medicine_name FROM medicine_schedules WHERE id = ?', [payload.schedule_id]);
        if (schedule.length > 0) {
          const caretaker_id = schedule[0].created_by;
          const msg = status === 'taken' 
            ? `Vicky took ${schedule[0].medicine_name}` 
            : `Vicky missed ${schedule[0].medicine_name}. Reason: ${payload.reason || 'None'}`;
            
          await connection.query(`
            INSERT INTO notifications (user_id, title, message, type) 
            VALUES (?, ?, ?, ?)
          `, [caretaker_id, 'Medication Update', msg, 'HIGH']);
        }
      }
    }

    await connection.commit();
    res.json({ status: 'synced', processed: events.length });

  } catch (error) {
    await connection.rollback();
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  } finally {
    connection.release();
  }
};
