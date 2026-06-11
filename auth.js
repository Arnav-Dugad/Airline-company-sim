/* ============================================================
   Auth page controller
   ============================================================ */
(function () {
  let mode = "signin"; // or "signup"

  const el = id => document.getElementById(id);
  const titleEl = el("authTitle"), leadEl = el("authLead");
  const nameField = el("nameField"), submitBtn = el("submitBtn");
  const switchBtn = el("switchBtn"), switchLine = el("switchLine");
  const msg = el("msg"), modeNote = el("modeNote");

  modeNote.textContent = AppAuth.isDemo
    ? "Demo Mode active — accounts & saves are stored locally in this browser. Add Firebase keys to enable cloud sync."
    : "Cloud Sync on — secured by Firebase Authentication.";

  /* If already signed in, route forward immediately. */
  AppAuth.onChange(user => { if (user) routeForward(user); });

  function showMsg(text, ok) {
    msg.textContent = text;
    msg.className = "msg " + (ok ? "ok" : "err");
  }

  function setMode(next) {
    mode = next;
    if (mode === "signup") {
      titleEl.textContent = "Found your airline";
      leadEl.textContent = "Create an account to start building your empire.";
      nameField.style.display = "block";
      submitBtn.textContent = "Create Account";
      switchLine.innerHTML = 'Already flying? <a id="switchBtn">Sign in →</a>';
    } else {
      titleEl.textContent = "Welcome back, Captain";
      leadEl.textContent = "Sign in to board your airline empire.";
      nameField.style.display = "none";
      submitBtn.textContent = "Sign In";
      switchLine.innerHTML = 'New here? <a id="switchBtn">Create your airline →</a>';
    }
    document.getElementById("switchBtn").onclick = () =>
      setMode(mode === "signup" ? "signin" : "signup");
    msg.className = "msg";
  }

  async function routeForward(user) {
    // Existing game? → dashboard, else → setup wizard.
    try {
      const save = await AppStore.load(user.uid);
      window.location.href = (save && save.airline) ? "game.html" : "setup.html";
    } catch {
      window.location.href = "setup.html";
    }
  }

  async function handleSubmit() {
    const email = el("email").value.trim();
    const password = el("password").value;
    const name = el("name").value.trim();
    if (!email || !password) return showMsg("Please enter your email and password.");
    if (password.length < 6) return showMsg("Password must be at least 6 characters.");

    submitBtn.disabled = true;
    submitBtn.textContent = "Please wait…";
    try {
      const user = mode === "signup"
        ? await AppAuth.signUp(email, password, name)
        : await AppAuth.signIn(email, password);
      showMsg("Success! Preparing your flight deck…", true);
      routeForward(user);
    } catch (e) {
      showMsg(prettyError(e));
      submitBtn.disabled = false;
      setMode(mode);
    }
  }

  async function handleGoogle() {
    el("googleBtn").disabled = true;
    try {
      const user = await AppAuth.signInGoogle();
      showMsg("Signed in with Google. Boarding…", true);
      routeForward(user);
    } catch (e) {
      showMsg(prettyError(e));
      el("googleBtn").disabled = false;
    }
  }

  function prettyError(e) {
    const m = (e && e.message) || "Something went wrong.";
    if (m.includes("auth/email-already-in-use")) return "That email is already registered. Try signing in.";
    if (m.includes("auth/invalid-credential") || m.includes("auth/wrong-password")) return "Invalid email or password.";
    if (m.includes("auth/user-not-found")) return "No account found. Create one first.";
    if (m.includes("auth/popup-closed")) return "Google sign-in was cancelled.";
    return m.replace("Firebase: ", "");
  }

  submitBtn.onclick = handleSubmit;
  el("googleBtn").onclick = handleGoogle;
  el("password").addEventListener("keydown", e => { if (e.key === "Enter") handleSubmit(); });
  setMode("signin");
})();
