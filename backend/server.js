const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

const syncController = require('./controllers/syncController');
const authController = require('./controllers/authController');

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MediGuard API is running with WebSockets' });
});

// Offline Sync API
app.post('/api/sync', syncController.processSync);

// Auth Routes
app.post('/api/auth/login', authController.login);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.get('/api/auth/me', authController.getMe);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Socket.IO real-time connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins a room named after their ID (e.g. 'PT1001', 'CT1001', 'DR1001')
  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Global Unified Multi-Role Chat Routing (Patient, Caretaker, Doctor)
  socket.on('send_chat_message', (data) => {
    console.log('Chat message from:', data.senderName, 'Target:', data.target, 'Content:', data.text);
    
    // Broadcast message to everyone or specific target rooms
    if (data.target === 'both' || data.target === 'all') {
      io.emit('chat_message_received', data);
    } else if (data.target === 'patient') {
      io.to('PT1001').emit('chat_message_received', data);
      socket.emit('chat_message_received', data); // ack to sender
    } else if (data.target === 'caretaker') {
      io.to('CT1001').emit('chat_message_received', data);
      socket.emit('chat_message_received', data);
    } else if (data.target === 'doctor') {
      io.to('DR1001').emit('chat_message_received', data);
      socket.emit('chat_message_received', data);
    } else {
      io.emit('chat_message_received', data);
    }
  });

  // Backward compatibility for legacy patient_message
  socket.on('patient_message', (data) => {
    io.emit('chat_message_received', {
      id: Date.now(),
      senderRole: data.senderRole || 'patient',
      senderName: data.patientName || 'Vicky (Patient)',
      senderId: data.patientId || 'PT1001',
      target: data.target || 'both',
      text: data.message,
      time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hasAudio: data.hasAudio !== undefined ? data.hasAudio : (data.message?.includes('🎤') || data.message?.includes('Voice'))
    });
  });

  // Schedule updates
  socket.on('schedule_updated', (data) => {
    io.emit('schedule_received', data);
  });

  socket.on('schedule_deleted', (data) => {
    io.emit('schedule_deleted', data);
  });

  // Medication confirmation
  socket.on('medicine_taken', (data) => {
    io.emit('patient_update', {
      type: 'MEDICINE_TAKEN',
      message: `${data.patientName || 'Vicky'} took ${data.medicine} at ${new Date().toLocaleTimeString()}`,
      data
    });
  });

  socket.on('medicine_missed', (data) => {
    io.emit('patient_update', {
      type: 'MEDICINE_MISSED',
      message: `${data.patientName || 'Vicky'} did not take ${data.medicine}. Reason: ${data.reason}`,
      data
    });
  });

  // Emergency Alert & Auto-escalation
  socket.on('emergency_alert', (data) => {
    console.log('🚨 EMERGENCY ALERT TRIGGERED:', data);
    io.emit('emergency_received', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`MediGuard Server running on port ${PORT}`);
});
