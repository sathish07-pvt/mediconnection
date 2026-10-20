import { useState, useEffect } from 'react';
import { Pill, CheckCircle, XCircle } from 'lucide-react';
import { db } from '../../offline/db';

export default function ScheduleAcceptance() {
  const [pendingSchedules, setPendingSchedules] = useState([]);

  useEffect(() => {
    // In reality, this fetches from API
    // Mocking an incoming schedule for demonstration
    setPendingSchedules([
      {
        id: 'SCH-10045',
        version: 1,
        medicine_name: 'Metformin',
        dosage: '1 Tablet',
        instructions: 'After breakfast',
        scheduled_time: '09:00:00',
        start_date: '2026-08-20',
        type: 'MEDICINE'
      }
    ]);
  }, []);

  const handleAccept = async (schedule) => {
    // Store in IndexedDB for offline access
    await db.schedules.add({
      ...schedule,
      status: 'ACCEPTED',
      patient_id: 1 // Mock patient ID
    });
    
    // In reality, notify backend API
    console.log("Schedule accepted and cached locally.");
    
    // Remove from pending list
    setPendingSchedules(pendingSchedules.filter(s => s.id !== schedule.id));
    alert('Schedule accepted and cached for offline reminders.');
  };

  if (pendingSchedules.length === 0) return null;

  return (
    <div className="bg-primary-50 border-2 border-primary-200 rounded-3xl p-6 mb-8 shadow-sm">
      <h2 className="text-xl font-bold text-primary-900 mb-2 flex items-center">
        <div className="w-2 h-2 bg-primary-500 rounded-full mr-2 animate-pulse"></div>
        New Schedule Received
      </h2>
      <p className="text-primary-700 mb-4">Your caretaker has created a new medicine schedule.</p>
      
      {pendingSchedules.map(schedule => (
        <div key={schedule.id} className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100">
          <div className="flex items-start">
            <div className="bg-primary-100 p-3 rounded-full text-primary-600 mr-4 mt-1">
              <Pill size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{schedule.medicine_name}</h3>
              <p className="text-gray-600 text-lg mb-1">{schedule.dosage} • {schedule.instructions}</p>
              <p className="text-primary-600 font-bold text-lg mb-6">Time: {schedule.scheduled_time.substring(0,5)}</p>
              
              <div className="flex space-x-4">
                <button 
                  onClick={() => handleAccept(schedule)}
                  className="flex-1 bg-primary-500 text-white font-bold py-4 rounded-xl flex items-center justify-center text-lg shadow-soft hover:bg-primary-600 transition"
                >
                  <CheckCircle className="mr-2" /> ACCEPT
                </button>
                <button className="flex-1 bg-white text-gray-600 font-bold py-4 rounded-xl border-2 border-gray-200 flex items-center justify-center text-lg hover:bg-gray-50 transition">
                  <XCircle className="mr-2" /> DECLINE
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
