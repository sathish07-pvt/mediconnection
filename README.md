# MEDIGUARD — Smart Patient Monitoring & Digital Health Platform
> **Tagline:** “Monitor Today. Protect Tomorrow.”

---

## 📋 Overview
MediGuard is an offline-first, real-time connected healthcare web platform connecting **Patients**, **Caretakers**, and **Doctors**.

### Key System Highlights:
1. **Split Landing Page (`/`)**:
   - Modern healthcare preview on the left.
   - Dedicated 3-Role Login (**Patient**, **Caretaker**, **Doctor**) on the right with "Remember Me" auto-save.
2. **Elderly-Friendly Patient Portal**:
   - **Dashboard**: Caretaker & Doctor info cards with direct dial, Next Medicine highlight, Quick access navigation.
   - **Profile**: Full patient details, photo, DOB, Aadhar, Relative contacts, Height, Weight, and Call 100 Emergency.
   - **Reports**: Ongoing problem summary, Doctor clinical reports, and lifestyle advice.
   - **Medicines**: Doctor prescriptions, dosages, schedules, meal relations, and purpose.
   - **Schedule**: Timeline countdown and simple plain-language **Tablet Guide**.
   - **Messages**: Type or **Speak through Mic** (Speech-to-Text) sending live updates to Doctor & Caretaker consoles.
   - **Activity**: Daily walking steps (4,250), distance, calories, active time, and monthly step history (98,400).
   - **Follow-up**: Symptom logging with 1-10 severity slider and real-time alert dispatch.
   - **Emergency**: Dual-stage auto-dial protocol (Calls Doctor first, then Relative).
3. **Audible Beep Alarm & 3-Step Escalation**:
   - Web Audio API synthesizer for hospital monitor beep alarms.
   - SpeechSynthesis voice reminders (*"Medicine Time! Please take your Metformin"*).
   - 3-Round Escalation: If unconfirmed, automatically triggers an Emergency Phone Call to the relative.
4. **Real-time WebSockets (`Socket.IO`)**:
   - Cross-role live synchronization for medicines, emergency alerts, messages, and symptoms.
5. **Offline First Architecture**:
   - IndexedDB caching (`Dexie.js`) for reliable offline operation on patient devices.

---

## 🚀 How to Run the Project

### Prerequisites:
- [Node.js](https://nodejs.org/) (v18+)
- MySQL (Optional for persistent DB, default fallback memory/proxy mode enabled)

### Step 1: Install Dependencies
```bash
# In backend folder:
cd backend
npm install

# In frontend folder:
cd ../frontend
npm install
```

### Step 2: Start the Backend Server (Port 5000)
```bash
cd backend
node server.js
```

### Step 3: Start the Frontend Vite Dev Server (Port 5173)
```bash
cd frontend
npm run dev -- --host --port 5173
```

### Step 4: Open in Browser
- **URL:** `http://localhost:5173/`

---

## 🔑 Demo Login Accounts

| Role | User ID | Password | Portal Features |
| :--- | :--- | :--- | :--- |
| **Patient** | `PT1001` | `123` | Elderly-friendly Dashboard, Alarms, Voice/Text Messages, Profile, Reports, Activity |
| **Caretaker** | `CT1001` | `123` | Patient Monitoring, Add/Edit/Delete Schedules, Live Feed, Patient Voice/Text Notes |
| **Doctor** | `DR1001` | `123` | Clinical Dashboard, 3-Day Summary, Symptom Review, Rx Advice |

---

## 📁 Project Directory Structure
```
mediguard/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── server.js             # Express API + Socket.IO WebSockets
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx  # Collapsible Sidebar Layout
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx      # Split Landing Screen
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx        # Role-Tailored Login
│   │   │   │   └── Register.jsx     # Account Registration
│   │   │   ├── patient/
│   │   │   │   └── Dashboard.jsx    # Complete 9-Tab Patient Portal
│   │   │   ├── caretaker/
│   │   │   │   └── Dashboard.jsx    # Monitoring Console
│   │   │   └── doctor/
│   │   │       └── Dashboard.jsx    # Clinical Review Console
│   │   ├── offline/                 # Dexie IndexedDB & Sync Queue
│   │   ├── voice/
│   │   │   └── audioManager.js      # Web Audio Beep Synthesizer & Speech
│   │   ├── socket.js                # Socket.IO Client Configuration
│   │   ├── App.jsx                  # Main Router
│   │   └── main.jsx
│   └── package.json
└── database/
    ├── schema.sql                   # Relational MySQL Schema
    └── init.js                      # DB Migration & Seeding
```
