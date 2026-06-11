/* ============================================================
   Setup wizard — builds the initial game state and saves it.
   ============================================================ */
(async function () {
  const user = await requireAuthOrRedirect();
  if (!user) return;

  const el = id => document.getElementById(id);
  el("modeNote").textContent = modeBadgeText();
  el("logoutLink").onclick = async () => { await AppAuth.signOut(); location.href = "auth.html"; };

  /* Prefill name from CEO display name. */
  if (user.name) el("airlineName").value = "";

  const sel = { color: BRAND_COLORS[0], hub: HUB_OPTIONS[0], capital: 500, diff: "normal" };

  /* ---- Brand colour swatches ---- */
  const sw = el("swatches");
  BRAND_COLORS.forEach((c, i) => {
    const d = document.createElement("div");
    d.className = "swatch" + (i === 0 ? " active" : "");
    d.style.background = c;
    d.onclick = () => { sel.color = c; [...sw.children].forEach(x => x.classList.remove("active")); d.classList.add("active"); };
    sw.appendChild(d);
  });

  /* ---- Hub choices ---- */
  const hubGrid = el("hubGrid");
  HUB_OPTIONS.forEach((code, i) => {
    const ap = getAirport(code);
    const d = document.createElement("div");
    d.className = "choice" + (i === 0 ? " active" : "");
    d.innerHTML = `<b>${code}</b><span>${ap.city}, ${ap.country}</span><span style="color:var(--brand-2)">Demand ${ap.demand}</span>`;
    d.onclick = () => pick(hubGrid, d, () => sel.hub = code);
    hubGrid.appendChild(d);
  });

  /* ---- Capital choices ---- */
  const capGrid = el("capitalGrid");
  CAPITAL_OPTIONS.forEach((c, i) => {
    const d = document.createElement("div");
    d.className = "choice" + (c.value === 500 ? " active" : "");
    d.innerHTML = `<b>${fmtMoney(c.value)}</b><span>${c.label.split("—")[0].trim()}</span>`;
    d.onclick = () => pick(capGrid, d, () => sel.capital = c.value);
    capGrid.appendChild(d);
  });

  /* ---- Difficulty choices ---- */
  const diffGrid = el("diffGrid");
  Object.entries(DIFFICULTIES).forEach(([key, d2], i) => {
    const d = document.createElement("div");
    d.className = "choice" + (key === "normal" ? " active" : "");
    d.innerHTML = `<b>${d2.label}</b><span>${descDiff(key)}</span>`;
    d.onclick = () => pick(diffGrid, d, () => sel.diff = key);
    diffGrid.appendChild(d);
  });

  function descDiff(k) {
    return { easy: "Forgiving · more cash & demand", normal: "Balanced challenge", hard: "Brutal · scarce cash, harsh events" }[k];
  }
  function pick(grid, node, fn) {
    [...grid.children].forEach(x => x.classList.remove("active"));
    node.classList.add("active");
    fn();
  }

  function showMsg(t, ok) { const m = el("msg"); m.textContent = t; m.className = "msg " + (ok ? "ok" : "err"); }

  /* ---- Launch ---- */
  el("launchBtn").onclick = async () => {
    const name = el("airlineName").value.trim();
    let code = el("airlineCode").value.trim().toUpperCase();
    if (name.length < 2) return showMsg("Give your airline a name.");
    if (!/^[A-Z]{2}$/.test(code)) return showMsg("Flight code must be exactly 2 letters (A–Z).");

    const d = DIFFICULTIES[sel.diff];
    const startCash = Math.round(sel.capital * d.cashMult);

    const state = {
      ceo: user.name || user.email,
      airline: {
        name, code, color: sel.color, hub: sel.hub, bases: [sel.hub],
        difficulty: sel.diff, capital: startCash, eventsOn: el("optEvents").checked
      },
      finance: {
        cash: startCash, loan: 0, weekProfit: 0,
        reputation: 50, marketShare: 1.0
      },
      fleet: [],     // owned/leased aircraft instances
      routes: [],    // active routes
      staff: { pilots: 0, crew: 0, engineers: 0, ground: 0 },
      fuelPrice: 5.5,
      fuelHedge: { active: false, price: 0, weeksLeft: 0 },
      marketing: { active: null },
      flags: {},
      achievements: {},
      completedMissions: [],
      stats: { totalPax: 0, totalRevenue: 0 },
      week: 1, year: 2026,
      log: [{ week: 1, title: "🛫 Airline Founded", text: `${name} (${code}) founded at ${sel.hub}. Cleared for takeoff!`, kind: "good" }],
      history: [{ week: 1, cash: startCash }],
      valHistory: [{ week: 1, val: startCash }],
      competitors: COMPETITORS.map(c => ({ ...c })),
      createdAt: Date.now()
    };

    el("launchBtn").disabled = true;
    el("launchBtn").textContent = "Building your airline…";
    try {
      await AppStore.save(user.uid, state);
      location.href = "game.html";
    } catch (e) {
      showMsg("Could not save: " + (e.message || e));
      el("launchBtn").disabled = false;
      el("launchBtn").textContent = "🚀 Launch Airline";
    }
  };
})();
