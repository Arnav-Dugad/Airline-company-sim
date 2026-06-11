/* ============================================================
   Storage + Auth abstraction layer
   ------------------------------------------------------------
   One simple API (AppAuth / AppStore) backed by either:
     • Firebase Auth + Firestore   (when FIREBASE_ENABLED)
     • localStorage Demo Mode      (out-of-the-box default)
   This keeps the rest of the app identical in both modes.
   ============================================================ */

const DEMO_USERS_KEY = "skytycoon_demo_users";
const DEMO_SESSION_KEY = "skytycoon_session";
const SAVE_PREFIX = "skytycoon_save_";

/* ---------- Initialise Firebase if configured ---------- */
(function initFirebase() {
  if (!FIREBASE_ENABLED) return;
  try {
    fbApp  = firebase.initializeApp(firebaseConfig);
    fbAuth = firebase.auth();
    fbDB   = firebase.firestore();
  } catch (e) {
    console.warn("Firebase init failed, using Demo Mode:", e);
  }
})();

/* ============================================================
   AppAuth — authentication
   ============================================================ */
const AppAuth = {
  isDemo: !FIREBASE_ENABLED || !fbAuth,

  /* Returns the current user object {uid, email, name} or null. */
  current() {
    if (this.isDemo) {
      const raw = localStorage.getItem(DEMO_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    }
    const u = fbAuth.currentUser;
    return u ? { uid: u.uid, email: u.email, name: u.displayName || u.email } : null;
  },

  /* Resolves once the initial auth state is known.
     CRITICAL with Firebase: currentUser is null until the SDK
     asynchronously restores the session, so any redirect decision
     must await this (otherwise auth ⇄ setup bounce in a loop). */
  _readyPromise: null,
  ready() {
    if (this.isDemo) return Promise.resolve(this.current());
    if (this._readyPromise) return this._readyPromise;
    this._readyPromise = new Promise(resolve => {
      const unsub = fbAuth.onAuthStateChanged(u => {
        unsub();
        resolve(u ? { uid: u.uid, email: u.email, name: u.displayName || u.email } : null);
      });
    });
    return this._readyPromise;
  },

  /* Run cb(user) whenever auth state is known/changes. */
  onChange(cb) {
    if (this.isDemo) { cb(this.current()); return; }
    fbAuth.onAuthStateChanged(u => {
      cb(u ? { uid: u.uid, email: u.email, name: u.displayName || u.email } : null);
    });
  },

  async signUp(email, password, name) {
    if (this.isDemo) {
      const users = JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || "{}");
      if (users[email]) throw new Error("An account with that email already exists.");
      users[email] = { password, name: name || email.split("@")[0], uid: "demo_" + Date.now() };
      localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
      const session = { uid: users[email].uid, email, name: users[email].name };
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
      return session;
    }
    const cred = await fbAuth.createUserWithEmailAndPassword(email, password);
    if (name) await cred.user.updateProfile({ displayName: name });
    return { uid: cred.user.uid, email, name: name || email };
  },

  async signIn(email, password) {
    if (this.isDemo) {
      const users = JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || "{}");
      const u = users[email];
      if (!u || u.password !== password) throw new Error("Invalid email or password.");
      const session = { uid: u.uid, email, name: u.name };
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
      return session;
    }
    const cred = await fbAuth.signInWithEmailAndPassword(email, password);
    return { uid: cred.user.uid, email, name: cred.user.displayName || email };
  },

  async signInGoogle() {
    if (this.isDemo) {
      // Simulated Google account for Demo Mode.
      const session = { uid: "demo_google", email: "pilot@google.demo", name: "Google Pilot" };
      const users = JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || "{}");
      users[session.email] = { password: null, name: session.name, uid: session.uid };
      localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
      return session;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    const cred = await fbAuth.signInWithPopup(provider);
    return { uid: cred.user.uid, email: cred.user.email, name: cred.user.displayName || cred.user.email };
  },

  async signOut() {
    if (this.isDemo) { localStorage.removeItem(DEMO_SESSION_KEY); return; }
    await fbAuth.signOut();
  }
};

/* ============================================================
   AppStore — per-user game save/load
   ============================================================ */
const AppStore = {
  isDemo: !FIREBASE_ENABLED || !fbDB,

  async save(uid, state) {
    state.updatedAt = Date.now();
    // Always keep a local copy as a safety net.
    try { localStorage.setItem(SAVE_PREFIX + uid, JSON.stringify(state)); } catch (e) {}
    if (this.isDemo) return;
    // Best-effort cloud sync; never let a Firestore error break the game
    // (e.g. database not created yet, or strict security rules).
    try {
      await fbDB.collection("airlines").doc(uid).set(state, { merge: true });
    } catch (e) {
      console.warn("Cloud save failed — kept a local copy instead:", e.message || e);
    }
  },

  async load(uid) {
    const local = () => { const raw = localStorage.getItem(SAVE_PREFIX + uid); return raw ? JSON.parse(raw) : null; };
    if (this.isDemo) return local();
    try {
      const doc = await fbDB.collection("airlines").doc(uid).get();
      if (doc.exists) return doc.data();
      return local();               // no cloud doc yet → fall back to any local save
    } catch (e) {
      console.warn("Cloud load failed — using local copy:", e.message || e);
      return local();
    }
  },

  async clear(uid) {
    try { localStorage.removeItem(SAVE_PREFIX + uid); } catch (e) {}
    if (this.isDemo) return;
    try { await fbDB.collection("airlines").doc(uid).delete(); } catch (e) {
      console.warn("Cloud clear failed:", e.message || e);
    }
  }
};

/* ---------- Tiny shared helpers ---------- */
/* Async: waits for the real (Firebase) auth state before deciding,
   so a freshly signed-in user is never wrongly bounced to login. */
async function requireAuthOrRedirect() {
  const user = await AppAuth.ready();
  if (!user) { window.location.href = "auth.html"; return null; }
  return user;
}

function fmtMoney(millions) {
  const n = Number(millions) || 0;
  if (Math.abs(n) >= 1000) return "$" + (n / 1000).toFixed(2) + "B";
  return "$" + n.toFixed(1) + "M";
}

function modeBadgeText() {
  return AppAuth.isDemo ? "Demo Mode (local save)" : "Cloud Sync On";
}
