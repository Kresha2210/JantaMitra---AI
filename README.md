# 🤝 JantaMitra AI — AI-Powered Civic Grievance & Resolution Platform

JantaMitra AI is a AI-Powered Civic Grievance & Resolution Platform designed to bridge the gap between citizens and local municipal authorities. By leveraging Generative AI, gamified community rankings, and a crowdsourced double-check verification pipeline, it streamlines civic problem reporting, tracking, and resolution.

---

**Live Deployed Link**: https://jantamitra-ai-248847840525.asia-southeast1.run.app

---
> **🏆 Vibe2ship Hackathon Project**
> 
> * **Developer**: Kresha Vora
> * **Project Type**: Community Hero - Hyperlocal Problem Solver
> * **Vibe Coding & AI Tools**: Google AI Studio, Gemini 2.5 Flash API, Gemini Code Assist, and Antigravity IDE (Gemini-driven coding assistant).

---

## 🌟 Why JantaMitra AI is Best for Local Communities

Traditional municipal grievance portals are often slow, non-transparent, and lack civic engagement. JantaMitra AI is built differently:

1. **Bridges Regional Language Barriers**: Local citizens can submit complaints in their native languages (Hindi, Bengali, Tamil, Telugu, Marathi, etc.). The built-in Google Gemini engine translates and summarizes descriptions into clean English for official municipal records.
2. **Community-Driven Prioritization**: Citizens can upvote or downvote local issues. High-priority complaints automatically bubble up to the top of authority dashboards, ensuring resources are directed where they are needed most.
3. **Gamification & Civic Pride**: Citizens earn **JantaPoints** when their submitted complaints are officially accepted by municipal officers. A live leaderboards system fosters positive competition and encourages community vigilance.
4. **Absolute Transparency & Accountability**: Authorities cannot unilaterally mark an issue resolved. The system uses a strict **Crowdsourced Verification Rule** to confirm resolutions before a case is officially closed.

---

## 🛠️ The Crowdsourced Citizen Verification Feature

To prevent fraudulent or incomplete work closures by contractors/authorities, JantaMitra AI implements a **Physical Verification Double-Check**:

1. **Resolution Proof Submission**: When an authority solves a problem (e.g., fills a pothole, fixes a streetlamp), they must upload a **resolution photo proof** and submit a summary note explaining the fix.
2. **State Transition**: The issue transitions to the `Waiting Verification` status.
3. **Citizen Voting**: 
   - Neighboring citizens inspect the fix in person and cast verification votes directly on the card.
   - **Confirm Fix**: Upvoting validates that the issue is successfully resolved.
   - **Reopen Issue**: Downvoting flags that the problem persists or was poorly resolved.
4. **Final Closure logic**:
   - **5 Upvotes**: The issue transitions to `Resolved` (final closure).
   - **5 Downvotes**: The issue is automatically reopened and sent back to the `In Progress` status, clearing verification counters to initiate rework.

---

## ⚡ Key Product Features

### 👤 Citizen Portal
- **Raise Local Issues**: Easily submit a complaint by upload proof (photo/video), naming the issue, and adding a localized description.
- **GPS Location Detection**: Capture geographic coordinates using HTML5 Geolocation. The system automatically performs high-fidelity reverse-geocoding (via OpenStreetMap) to fill in the exact ward, street area, city, and PIN code.
- **Interactive Issue Feed**:
   - **Track My Issues**: Monitor your filed complaints, view status milestones, and cast verification votes.
   - **Explore Nearby Issues**: Check nearby community issues and upvote to alert officials.
- **Sorting & Filtering**: Find problems easily by category, status, priority, or sort by upvotes/downvotes.
- **Civic Leaderboard**: View active top citizen standings, points, and accepted complaint counts.

### 👮 Authority Portal
- **Consolidated Dashboard**: View total registered complaints, resolution metrics, and issues categories.
- **Real-Time Priority Queue**: Sort the issue queue to view most upvoted issues first, ensuring critical safety hazards are addressed immediately.
- **Google Maps Navigation**: View 1-click **"📍 View on Map"** links on every card to open exact latitude/longitude coordinates directly in Google Maps.
- **Lifecycle Management**: Accept complaints (submitting points to citizen), mark as in-progress, or reject with a detailed note.

---

## 💻 Tech Stack & Architecture

JantaMitra AI is built on a modern, lightweight, and high-performance stack:

* **Frontend**: React 18, Vite (Development Server & Packager), TailwindCSS (Modern, responsive utility styling), Lucide React (Sleek UI icons).
* **Backend**: Node.js, Express (API routes).
* **AI Engine**: Google Gemini API SDK (`@google/genai` npm library), utilizing the state-of-the-art **gemini-2.5-flash** model for real-time translation, classification, and priority/risk assessment.
* **Database & Synchronization**: 
  - **Firebase Firestore**: Real-time cloud sync for production deployments.
  - **In-Memory Cache & File-System Backup**: Uses a custom memory-cached JSON loader (`database.json`) to return reads in under `<1ms` and syncs writes to Firestore asynchronously in the background. This ensures **zero latency** during voting.
* **Geocoding**: OpenStreetMap Nominatim API (Free, open reverse-geocoding).
* **OTP SMS Gateway**: Twilio SDK / Textbelt API with developer console log fallbacks for local test verification.

---

## 🔐 Environment Configuration & API Keys

To run the application locally, you must configure a `.env` file in the root directory. Copy the contents of `.env.example` and set up the following keys:

```ini
# Server Config
PORT=3000

# Google Gemini API (Required for AI categorization & translation)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Admin SDK Credentials (Optional - Falls back to database.json if omitted)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"..."}
# OR set individual credentials:
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# SMS OTP Configurations (Optional - Prints OTP codes to console if omitted)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_FROM_NUMBER=your_twilio_sender_number
```

---

## 🚀 Local Installation & Run Guide

Follow these steps to run the JantaMitra AI portal locally:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 2. Clone and Install Dependencies
```bash
# Install package dependencies
npm install
```

### 3. Setup Environment variables
Create a `.env` file in the root directory and insert your `GEMINI_API_KEY` and optionals (Firebase/Twilio keys).

### 4. Run Developer Environment
```bash
# Start the local Express backend and Vite development middleware
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Citizen Test Accounts**: Register any new phone number with verification OTP (available in the server terminal console).
- **Authority Test Accounts**: Use government login credentials:
  - **Government ID**: `GOVT-1234` | **Password**: `authority`
  - **Government ID**: `GOVT-5678` | **Password**: `authority`
 
