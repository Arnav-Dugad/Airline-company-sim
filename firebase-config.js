/* ============================================================
   Firebase configuration — Arnav Game Studios / SkyTycoon
   ------------------------------------------------------------
   HOW TO ENABLE REAL FIREBASE (optional — the game already
   works fully in offline "Demo Mode" using your browser):

   1. Go to https://console.firebase.google.com  → Add project
   2. Add a Web App, copy its config values below.
   3. In the console enable:
        - Authentication → Sign-in method → Email/Password  ✔
        - Authentication → Sign-in method → Google          ✔
        - Firestore Database → Create database (production)  ✔
   4. Paste your keys into firebaseConfig below and save.

   While the apiKey is left as "DEMO_MODE", the app automatically
   falls back to localStorage so nothing breaks.
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyCw_oNynDpLYMOWH-M8rMpySSZJdmQyuGs",
  authDomain: "airline-sim-32b76.firebaseapp.com",
  projectId: "airline-sim-32b76",
  storageBucket: "airline-sim-32b76.firebasestorage.app",
  messagingSenderId: "738132857497",
  appId: "1:738132857497:web:211b0f577523d5d2379e08",
  measurementId: "G-WHBY0DE7C7"
};

/* True when the developer has plugged in real Firebase keys. */
const FIREBASE_ENABLED = firebaseConfig.apiKey !== "DEMO_MODE";

/* Lazily initialised handles (filled in by storage.js). */
let fbApp = null, fbAuth = null, fbDB = null;
