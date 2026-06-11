/* ============================================================
   SkyTycoon — Game Engine + Dashboard UI  (v3 — Premium)
   Arnav Game Studios
   Systems: fleet, routes, service classes, upgrades, staff/HR,
   marketing, alliances, loyalty, lounges, missions, achievements,
   multi-base, fuel hedging, auto-maintenance, bulk buy/pricing,
   auto-pricing optimiser, analytics, fast-forward, save export,
   seasonality, valuation, random events, route map.
   ============================================================ */
(function () {
  let user = null;
  let S = null;
  let currentTab = "overview";
  let tailCounter = 0;

  const $ = id => document.getElementById(id);
  const view = $("view");
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* ---------------- Load + migrate ---------------- */
  init();
  async function init() {
    user = await requireAuthOrRedirect();
    if (!user) return;                 // redirected to auth.html
    try { S = await AppStore.load(user.uid); } catch (e) { S = null; }
    if (!S || !S.airline) { location.href = "setup.html"; return; }
    migrate(S);
    tailCounter = S.fleet.reduce((m, p) => Math.max(m, p.tailSeq || 0), 0);
    bindChrome();
    renderHUD();
    switchTab("overview");
  }

  function migrate(s) {
    if (s.fuelPrice == null) s.fuelPrice = 5.5;
    if (!s.fuelHedge) s.fuelHedge = { active: false, price: 0, weeksLeft: 0 };
    if (!s.airline.bases) s.airline.bases = [s.airline.hub];
    if (!s.staff) s.staff = { pilots: 0, crew: 0, engineers: 0, ground: 0 };
    if (!s.marketing) s.marketing = { active: null };
    if (!s.flags) s.flags = {};
    if (!s.achievements) s.achievements = {};
    if (!s.completedMissions) s.completedMissions = [];
    if (!s.stats) s.stats = { totalPax: 0, totalRevenue: 0 };
    if (!s.history) s.history = [{ week: s.week, cash: s.finance.cash }];
    if (!s.valHistory) s.valHistory = [];
    if (s.finance.marketShare == null) s.finance.marketShare = 1;
    if (!s.maintenance) s.maintenance = { contract: "none" };
    if (s.alliance === undefined) s.alliance = null;
    if (!s.loyalty) s.loyalty = "none";
    if (!s.lounges) s.lounges = {};
    if (s.autoPrice === undefined) s.autoPrice = false;
    if (!s.settings) s.settings = {};
    s.fleet.forEach(p => { if (!p.upgrades) p.upgrades = []; if (p.condition == null) p.condition = 100; });
    s.routes.forEach(r => { if (!r.service) r.service = "standard"; });
  }

  let saveTimer = null;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => AppStore.save(user.uid, S).catch(() => {}), 250);
  }

  /* ---------------- Chrome / HUD ---------------- */
  function bindChrome() {
    $("nextWeekBtn").onclick = () => advanceWeek();
    if ($("ffBtn")) $("ffBtn").onclick = () => fastForward(4);
    $("tabs").querySelectorAll(".tab").forEach(t => t.onclick = () => switchTab(t.dataset.tab));
    $("airlineId").onclick = openAccountMenu;
  }

  function openAccountMenu() {
    openModal(
      `${S.airline.name} <span class="badge" style="color:var(--brand-2)">${S.airline.code}</span>`,
      `Signed in as <b>${user.name || user.email}</b>.<br>${modeBadgeText()} · progress saves automatically.<br><br>
       <b>Save data</b><br><span class="muted" style="font-size:12.5px">Back up or move your airline between devices.</span>`,
      [{ label: "⬇ Export save", ghost: true, fn: () => { exportSave(); } },
       { label: "⬆ Import save", ghost: true, fn: () => { importSave(); } },
       { label: "Sign out", danger: true, fn: async () => { await AppAuth.signOut(); location.href = "auth.html"; } },
       { label: "Close", ghost: true, fn: closeModal }]);
  }

  function renderHUD() {
    const a = S.airline, f = S.finance;
    $("alLogo").textContent = a.code;
    $("alLogo").style.background = a.color;
    $("alName").textContent = a.name;
    $("alSub").textContent = `${a.bases.join("·")} · Wk ${S.week}, ${S.year} · ${seasonLabel(S.week)}`;
    $("hudCash").textContent = fmtMoney(f.cash);
    $("hudCash").className = f.cash < 0 ? "neg" : "";
    $("hudProfit").textContent = (f.weekProfit >= 0 ? "+" : "") + fmtMoney(f.weekProfit);
    $("hudProfit").className = f.weekProfit >= 0 ? "pos" : "neg";
    $("hudRep").textContent = Math.round(f.reputation);
    if ($("nextWeekBtn")) $("nextWeekBtn").disabled = !!S._over;
    if ($("ffBtn")) $("ffBtn").disabled = !!S._over;
  }

  function switchTab(tab) {
    currentTab = tab;
    $("tabs").querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
    const active = $("tabs").querySelector(".tab.active");
    if (active && active.scrollIntoView) active.scrollIntoView({ inline: "center", block: "nearest" });
    render();
  }

  function render() {
    ({ overview: renderOverview, market: renderMarket, fleet: renderFleet, routes: renderRoutes,
       staff: renderStaff, growth: renderGrowth, analytics: renderAnalytics, missions: renderMissions,
       finance: renderFinance, rivals: renderRivals, log: renderLog }[currentTab] || renderOverview)();
    renderHUD();
  }

  /* ============================================================
     ECONOMY MODEL
     ============================================================ */
  const WEEK_HOURS = 100;
  const PILOTS_PER = { Regional: 4, "Narrow-body": 6, "Wide-body": 10 };

  function fairPrice(dist) { return Math.round(58 + dist * 0.132); }
  function fuelEffectivePrice() { return S.fuelHedge.active ? S.fuelHedge.price : S.fuelPrice; }
  function loungeCount() { return Object.values(S.lounges || {}).filter(Boolean).length; }

  function programDemand() {
    let d = 0;
    const al = getAlliance(S.alliance); if (al) d += al.demand;
    d += getLoyalty(S.loyalty).demand;
    return d;
  }
  function demandContext() {
    const season = seasonFactor(S.week);
    const mkt = S.marketing.active ? S.marketing.active.demand : 0;
    const ev = S.tempDemandBoost || 0;
    return season * (1 + mkt + ev + programDemand());
  }

  function upgradeMults(p) {
    let y = 1, f = 1, s = 1;
    (p.upgrades || []).forEach(k => { const u = getUpgrade(k); if (u) { y *= u.yieldMult; f *= u.fuelMult; s *= u.seatMult; } });
    return { y, f, s };
  }

  function staffRequirements() {
    let pilots = 0, crew = 0;
    S.fleet.forEach(p => {
      const ac = getAircraft(p.aircraftId);
      pilots += PILOTS_PER[ac.category] || 6;
      const route = S.routes.find(r => r.aircraftInstId === p.instId);
      const cmult = route ? getServiceLevel(route.service).crewMult : 1;
      crew += Math.ceil(ac.seats / 35 * cmult);
    });
    const engineers = Math.ceil(S.fleet.length * 1.5);
    const ground = Math.ceil(S.routes.length * 2 + S.airline.bases.length * 3);
    return { pilots, crew, engineers, ground };
  }
  function staffCoverage() {
    const req = staffRequirements(), have = S.staff;
    const r = k => req[k] === 0 ? 1 : Math.min(1, (have[k] || 0) / req[k]);
    return +(0.4 * r("pilots") + 0.3 * r("crew") + 0.15 * r("engineers") + 0.15 * r("ground")).toFixed(3);
  }
  function staffRevenueMult() { return 0.5 + 0.5 * staffCoverage(); }
  function weeklySalaries() {
    let t = 0;
    for (const k in STAFF_ROLES) t += (S.staff[k] || 0) * STAFF_ROLES[k].salary;
    return t;
  }

  function routeEconomics(route) {
    const plane = S.fleet.find(p => p.instId === route.aircraftInstId);
    if (!plane) return null;
    const ac = getAircraft(plane.aircraftId);
    const dist = route.distance;
    const svc = getServiceLevel(route.service);
    const up = upgradeMults(plane);

    const onewayHrs = dist / ac.cruise;
    const roundTripHrs = 2 * onewayHrs + 2;
    const roundTrips = Math.max(1, Math.floor(WEEK_HOURS / roundTripHrs));
    const freq = Math.min(28, roundTrips * 2);

    const A = getAirport(route.from), B = getAirport(route.to);
    const market = ((A.demand + B.demand) / 2) / 100;
    const diff = DIFFICULTIES[S.airline.difficulty];
    const fair = fairPrice(dist);
    const elasticity = Math.pow(fair / route.price, 1.25);
    const repFactor = 0.82 + S.finance.reputation / 280;
    const comp = competitionFactor(route);
    const lounge = (S.lounges && S.lounges[route.from]) ? (1 + LOUNGE.demand) : 1;

    let load = (0.5 + 0.42 * market) * repFactor * diff.demandMult * elasticity * comp
             * svc.demandMult * demandContext() * lounge;
    load = Math.max(0.15, Math.min(0.985, load)) * (plane.condition / 100 * 0.15 + 0.85);

    const seats = ac.seats * up.s;
    const seatsOffered = seats * freq;
    const pax = Math.round(seatsOffered * load);
    let revenue = pax * route.price * svc.priceMult * up.y;
    revenue *= staffRevenueMult();

    const fuelCost = freq * dist * ac.fuelBurn * fuelEffectivePrice() * up.f;
    const crewCost = freq * (2500 + dist * 1.15) * svc.crewMult;
    const feesCost = freq * 1750;
    const cost = fuelCost + crewCost + feesCost;

    return { freq, seatsOffered, pax, load, revenue, cost, profit: revenue - cost, ac, dist };
  }

  function competitionFactor(route) {
    let pressure = 0;
    S.competitors.forEach(c => { if (c.hub === route.from || c.hub === route.to) pressure += c.strength; });
    const A = getAirport(route.from), B = getAirport(route.to);
    pressure += (A.demand + B.demand) * 0.25;
    return Math.max(0.62, 1 - pressure / 900);
  }

  function fleetCosts() {
    let maint = 0, lease = 0, park = 0;
    S.fleet.forEach(p => {
      const ac = getAircraft(p.aircraftId);
      const priceUSD = ac.price * 1e6;
      maint += priceUSD * 0.00085 * (1 + (100 - p.condition) / 160);
      if (p.leased) lease += priceUSD * 0.0023;
      if (!p.routeId) park += priceUSD * 0.00035;
    });
    return { maint, lease, park };
  }
  function overheadCost() {
    return (0.28 + 0.045 * S.fleet.length + 0.02 * S.routes.length + 0.06 * S.airline.bases.length) * 1e6;
  }

  /* Program & maintenance costs in $M */
  function programCosts() {
    const al = getAlliance(S.alliance);
    const lty = getLoyalty(S.loyalty);
    const allianceDues = al ? al.dues : 0;
    const loyaltyCost = lty.key === "none" ? 0 : (lty.base + lty.perRoute * S.routes.length);
    const loungeFees = loungeCount() * LOUNGE.weeklyFee;
    return { allianceDues, loyaltyCost, loungeFees, total: allianceDues + loyaltyCost + loungeFees };
  }

  function repairCostM(p, target) {
    const ac = getAircraft(p.aircraftId);
    return +(ac.price * Math.max(0, target - p.condition) / 100 * 0.03).toFixed(3);
  }
  function maintenanceWeek() {
    const mc = getMaintContract(S.maintenance.contract);
    const feeM = S.fleet.length * mc.feePerPlane;
    let repairM = 0, repaired = 0;
    if (mc.autoFloor > 0) {
      S.fleet.forEach(p => {
        if (p.condition < mc.autoFloor) { repairM += repairCostM(p, mc.topTo) * mc.repairDisc; p.condition = mc.topTo; repaired++; }
        else if (mc.key === "premium" && p.condition < mc.topTo) { repairM += repairCostM(p, mc.topTo) * mc.repairDisc; p.condition = mc.topTo; }
      });
    }
    return { feeM, repairM: +repairM.toFixed(3), repaired };
  }

  function assetValue() {
    return S.fleet.reduce((s, p) => p.leased ? s : s + getAircraft(p.aircraftId).price * (p.condition / 100), 0);
  }
  function loanLimit() { return Math.round(assetValue() * 0.6 + 120); }

  function companyValuation() {
    const fleetVal = S.fleet.reduce((s, p) => p.leased ? s : s + getAircraft(p.aircraftId).price * (p.condition / 100) * 0.8, 0);
    return +(S.finance.cash - S.finance.loan + fleetVal + S.routes.length * 8 + S.airline.bases.length * 30 + loungeCount() * 12 + S.finance.reputation * 2).toFixed(1);
  }

  function computeShare() {
    const playerStrength = S.fleet.length * 4 + S.routes.length * 3 + S.finance.reputation * 0.25 + 5;
    const rivalStrength = S.competitors.reduce((s, c) => s + c.strength, 0);
    return (playerStrength / (playerStrength + rivalStrength)) * 100;
  }

  /* ---- Auto-pricing optimiser ---- */
  function bestPriceFor(route) {
    const fair = fairPrice(route.distance);
    let best = route.price, bestProfit = -Infinity;
    const saved = route.price;
    for (let m = 0.6; m <= 1.85; m += 0.1) {
      route.price = Math.max(20, Math.round(fair * m));
      const e = routeEconomics(route);
      if (e && e.profit > bestProfit) { bestProfit = e.profit; best = route.price; }
    }
    route.price = saved;
    return best;
  }
  function optimizeAllPrices() {
    S.routes.forEach(r => { r.price = bestPriceFor(r); });
  }

  /* ============================================================
     WEEK ADVANCE
     ============================================================ */
  /** Pure-ish weekly step. Returns {netM, event}. silent => no modal. */
  function stepWeek() {
    S.tempDemandBoost = 0;

    const drift = (Math.random() - 0.48) * 0.4;
    S.fuelPrice = +clamp(S.fuelPrice + drift, 3, 12).toFixed(2);

    if (S.marketing.active) {
      S.marketing.active.weeksLeft -= 1;
      if (S.marketing.active.weeksLeft <= 0) { S.log.unshift({ week: S.week, kind: "neutral", title: "📣 Campaign Ended", text: `${S.marketing.active.name} has finished.` }); S.marketing.active = null; }
    }
    if (S.fuelHedge.active) {
      S.fuelHedge.weeksLeft -= 1;
      if (S.fuelHedge.weeksLeft <= 0) { S.fuelHedge.active = false; S.log.unshift({ week: S.week, kind: "neutral", title: "⛽ Hedge Expired", text: "Your fuel hedge has expired." }); }
    }

    if (S.autoPrice) optimizeAllPrices();

    const eventEntry = rollEvent(S);

    let revenue = 0, opCost = 0, paxThisWeek = 0;
    S.routes.forEach(r => {
      const e = routeEconomics(r);
      if (e) { revenue += e.revenue; opCost += e.cost; paxThisWeek += e.pax; r.lastProfit = e.profit; r.lastLoad = e.load; r.lastRevenue = e.revenue; }
    });

    const fc = fleetCosts();
    const overhead = overheadCost();
    const salaries = weeklySalaries() * 1e6;
    const interest = S.finance.loan * 1e6 * (DIFFICULTIES[S.airline.difficulty].interest / 52);
    const baseCostUSD = opCost + fc.maint + fc.lease + fc.park + overhead + salaries + interest;

    // wear (with contract multiplier), then auto-maintenance
    const mc = getMaintContract(S.maintenance.contract);
    S.fleet.forEach(p => {
      p.ageWeeks = (p.ageWeeks || 0) + 1;
      p.condition = clamp((p.condition ?? 100) - (p.routeId ? 0.5 : 0.12) * mc.wearMult, 35, 100);
    });
    const maint = maintenanceWeek();
    const prog = programCosts();
    const extraM = maint.feeM + maint.repairM + prog.total;

    const netM = (revenue - baseCostUSD) / 1e6 - extraM;
    S.finance.weekProfit = +netM.toFixed(2);
    S.finance.cash = +(S.finance.cash + netM).toFixed(2);
    S.stats.totalPax += paxThisWeek;
    S.stats.totalRevenue += revenue / 1e6;

    if (eventEntry) S.log.unshift(eventEntry);

    const cov = staffCoverage();
    const avgLoad = S.routes.length ? S.routes.reduce((s, r) => s + (r.lastLoad || 0), 0) / S.routes.length : 0.5;
    const svcRep = S.routes.length ? S.routes.reduce((s, r) => s + getServiceLevel(r.service).repDelta, 0) / S.routes.length : 0;
    const progRep = getLoyalty(S.loyalty).repWk + (S.alliance ? 0.2 : 0) + loungeCount() * LOUNGE.rep;
    let repDelta = (avgLoad - 0.7) * 5 + svcRep + progRep - (1 - cov) * 4 + (Math.random() - 0.5) * 1.2;
    if (S.finance.cash < 0) repDelta -= 2;
    S.finance.reputation = clamp(S.finance.reputation + repDelta, 1, 100);

    S.competitors.forEach(c => {
      c.cash = Math.round(c.cash + c.strength * (0.6 + Math.random() * 0.8));
      if (Math.random() < 0.12) c.strength = clamp(c.strength + (Math.random() < 0.6 ? 0.4 : -0.3), 60, 99);
    });

    S.finance.marketShare = +computeShare().toFixed(2);

    S.week += 1;
    if ((S.week - 1) % 52 === 0) S.year += 1;
    S.history.push({ week: S.week, cash: S.finance.cash });
    S.valHistory.push({ week: S.week, val: companyValuation() });
    if (S.history.length > 160) S.history.shift();
    if (S.valHistory.length > 160) S.valHistory.shift();

    checkSolvency();
    checkProgress();
    return { netM, event: eventEntry, cov };
  }

  function advanceWeek() {
    if (S._over) return;
    const res = stepWeek();
    persist(); render();
    const sign = res.netM >= 0 ? "good" : "bad";
    toast(`Week ${S.week - 1}: ${res.netM >= 0 ? "Profit" : "Loss"} ${fmtMoney(Math.abs(res.netM))}` + (res.event ? ` · ${res.event.title}` : ""), sign);
    if (res.cov < 0.9) toast(`⚠️ Understaffed (${Math.round(res.cov * 100)}%) — hire staff to lift revenue.`, "bad");
    if (res.event) flashEvent(res.event);
  }

  function fastForward(n) {
    if (S._over) return;
    let totalNet = 0; const events = []; let weeksRun = 0;
    for (let i = 0; i < n; i++) {
      if (S._over) break;
      const res = stepWeek();
      totalNet += res.netM; weeksRun++;
      if (res.event && res.event.kind !== "neutral") events.push(res.event);
    }
    persist(); render();
    toast(`Fast-forwarded ${weeksRun} week(s): net ${(totalNet>=0?"+":"")}${fmtMoney(totalNet)}.`, totalNet >= 0 ? "good" : "bad");
    if (!S._over) {
      const evHtml = events.length
        ? events.map(e => `<div class="log-entry ${e.kind}"><div class="wk">Wk ${e.week}</div><div><b>${e.title}</b> ${e.text}</div></div>`).join("")
        : `<div class="muted">A quiet stretch — no major events.</div>`;
      openModal(`⏩ ${weeksRun} weeks later…`,
        `Net result: <b class="${totalNet>=0?'pos':'neg'}">${(totalNet>=0?'+':'')+fmtMoney(totalNet)}</b> · Cash now ${fmtMoney(S.finance.cash)} · Reputation ${Math.round(S.finance.reputation)}.
         <div class="rows" style="margin-top:14px;max-height:240px;overflow:auto">${evHtml}</div>`,
        [{ label: "Continue", fn: closeModal }]);
    }
  }

  function checkSolvency() {
    if (S.finance.cash >= 0 || S._over) return;
    const room = loanLimit() - S.finance.loan;
    if (S.finance.cash < -room) {
      S._over = true;
      S.log.unshift({ week: S.week, kind: "bad", title: "💀 Bankruptcy", text: `${S.airline.name} ran out of cash and credit. The airline has folded.` });
      setTimeout(showGameOver, 600);
    }
  }

  /* ============================================================
     MISSIONS & ACHIEVEMENTS
     ============================================================ */
  function metric(type) {
    switch (type) {
      case "fleet": return S.fleet.length;
      case "routes": return S.routes.length;
      case "airports": { const set = new Set(S.airline.bases); S.routes.forEach(r => { set.add(r.from); set.add(r.to); }); return set.size; }
      case "longhaul": return S.routes.reduce((m, r) => Math.max(m, r.distance), 0);
      case "avgload": return S.routes.length ? S.routes.reduce((s, r) => s + (r.lastLoad || 0), 0) / S.routes.length : 0;
      case "rep": return S.finance.reputation;
      case "cash": return S.finance.cash;
      case "bases": return S.airline.bases.length;
      case "pax": return S.stats.totalPax;
      case "share": return S.finance.marketShare;
      case "weeks": return S.week - 1;
      case "ownjumbo": return S.fleet.some(p => ["a380-800", "b747-8i"].includes(p.aircraftId)) ? 1 : 0;
      case "flagMkt": return S.flags.marketing ? 1 : 0;
      case "flagUpg": return S.flags.upgrade ? 1 : 0;
      default: return 0;
    }
  }
  function checkProgress() {
    MISSIONS.forEach(m => {
      if (S.completedMissions.includes(m.id)) return;
      if (metric(m.type) >= m.target) {
        S.completedMissions.push(m.id);
        S.finance.cash = +(S.finance.cash + m.reward.cash).toFixed(2);
        S.finance.reputation = clamp(S.finance.reputation + m.reward.rep, 1, 100);
        S.log.unshift({ week: S.week, kind: "good", title: "🎯 Mission Complete", text: `${m.title} — reward ${m.reward.cash ? fmtMoney(m.reward.cash) : ""}${m.reward.cash && m.reward.rep ? " + " : ""}${m.reward.rep ? m.reward.rep + " rep" : ""}.` });
        toast(`🎯 Mission complete: ${m.title}!`, "good");
      }
    });
    ACHIEVEMENTS.forEach(a => {
      if (S.achievements[a.id]) return;
      if (metric(a.type) >= a.target) {
        S.achievements[a.id] = S.week;
        S.log.unshift({ week: S.week, kind: "good", title: "🏅 Achievement Unlocked", text: `${a.icon} ${a.title} — ${a.desc}.` });
        toast(`🏅 Achievement: ${a.title}!`, "good");
      }
    });
  }

  /* ============================================================
     RENDER: OVERVIEW (+ smart alerts)
     ============================================================ */
  function smartAlerts() {
    const a = [];
    if (S.finance.cash < 50) a.push({ t: "Cash is low — risk of bankruptcy", tab: "finance", btn: "Finance" });
    const idle = S.fleet.filter(p => !p.routeId).length;
    if (idle) a.push({ t: `${idle} idle aircraft earning nothing`, tab: "routes", btn: "Open routes" });
    if (S.fleet.length && staffCoverage() < 0.9) a.push({ t: "Understaffed — revenue & reputation suffering", tab: "staff", btn: "Staff" });
    const bad = S.fleet.filter(p => p.condition < 55).length;
    if (bad && S.maintenance.contract === "none") a.push({ t: `${bad} aircraft in poor condition`, tab: "fleet", btn: "Fleet" });
    if (S.finance.loan > 0 && loanLimit() - S.finance.loan < 20) a.push({ t: "Approaching your loan limit", tab: "finance", btn: "Finance" });
    return a;
  }
  function alertsHTML() {
    const al = smartAlerts();
    if (!al.length) return "";
    return `<div class="alerts">${al.map(x => `<div class="alert-chip"><span>⚠️ ${x.t}</span>
      <button class="btn ghost sm" onclick="window.__go('${x.tab}')">${x.btn} →</button></div>`).join("")}</div>`;
  }

  function renderOverview() {
    const f = S.finance;
    const idle = S.fleet.filter(p => !p.routeId).length;
    const cov = staffCoverage();
    const val = companyValuation();

    view.innerHTML = `
      ${alertsHTML()}
      <div class="kpi-grid">
        ${kpi("Cash on Hand", fmtMoney(f.cash), modeBadgeText(), f.cash < 0 ? "neg" : "pos")}
        ${kpi("Company Value", fmtMoney(val), "valuation")}
        ${kpi("Last Week", (f.weekProfit>=0?"+":"")+fmtMoney(f.weekProfit), "net result", f.weekProfit>=0?"pos":"neg")}
        ${kpi("Reputation", Math.round(f.reputation)+"/100", barHTML(f.reputation))}
        ${kpi("Market Share", f.marketShare.toFixed(1)+"%", "vs "+S.competitors.length+" rivals")}
        ${kpi("Staffing", Math.round(cov*100)+"%", cov<0.9?'<span class="neg">understaffed</span>':'<span class="pos">healthy</span>')}
        ${kpi("Fleet", S.fleet.length, idle?`${idle} idle ✈️`:"all assigned")}
        ${kpi("Routes", S.routes.length, S.airline.bases.length+" base(s)")}
      </div>

      ${routeMapPanel()}

      <div class="panel">
        <h3>Treasury trend</h3>
        <div class="desc">Cash over the last ${S.history.length} weeks.</div>
        ${sparkHTML(S.history.map(h => h.cash))}
      </div>

      <div class="panel">
        <h3>This week at a glance</h3>
        <div class="desc">${seasonLabel(S.week)} · demand ×${seasonFactor(S.week).toFixed(2)} · Difficulty ${DIFFICULTIES[S.airline.difficulty].label}</div>
        <div class="rows">
          ${infoRow("⛽ Jet fuel price", "$"+S.fuelPrice+"/unit"+(S.fuelHedge.active?` · <span class="badge" style="color:var(--good)">hedged @ $${S.fuelHedge.price} (${S.fuelHedge.weeksLeft}w)</span>`:""))}
          ${infoRow("🔧 Maintenance plan", getMaintContract(S.maintenance.contract).label)}
          ${infoRow("💵 Auto-pricing", S.autoPrice?'<span class="pos">ON</span>':'<span class="muted">off</span>')}
          ${infoRow("🤝 Alliance", S.alliance?getAlliance(S.alliance).name:"independent")}
          ${infoRow("🎯 Missions", `${S.completedMissions.length}/${MISSIONS.length} · 🏅 ${Object.keys(S.achievements).length}/${ACHIEVEMENTS.length} achievements`)}
          ${infoRow("👥 Total passengers", Math.round(S.stats.totalPax).toLocaleString())}
        </div>
        ${S.fleet.length===0 ? `<div style="margin-top:16px"><button class="btn gold" onclick="window.__go('market')">🛒 Buy your first aircraft</button></div>`:""}
      </div>

      ${renderRecentNews()}`;
  }

  function routeMapPanel() {
    if (!S.routes.length && S.airline.bases.length <= 1)
      return `<div class="panel"><h3>Route map 🗺️</h3><div class="desc">Open routes to see your network spread across the globe.</div></div>`;
    return `<div class="panel"><h3>Route network 🗺️</h3>
      <div class="desc">${S.routes.length} route(s) from ${S.airline.bases.length} base(s).</div>${worldMapSVG()}</div>`;
  }
  function worldMapSVG() {
    const W = 1000, H = 500;
    const px = lon => (lon + 180) / 360 * W, py = lat => (90 - lat) / 180 * H;
    const baseSet = new Set(S.airline.bases);
    const used = new Map();
    S.airline.bases.forEach(b => used.set(b, getAirport(b)));
    S.routes.forEach(r => { used.set(r.from, getAirport(r.from)); used.set(r.to, getAirport(r.to)); });
    const lines = S.routes.map(r => {
      const a = getAirport(r.from), b = getAirport(r.to), prof = (r.lastProfit || 0) >= 0;
      return `<line x1="${px(a.lon).toFixed(0)}" y1="${py(a.lat).toFixed(0)}" x2="${px(b.lon).toFixed(0)}" y2="${py(b.lat).toFixed(0)}" stroke="${prof ? S.airline.color : '#f87171'}" stroke-width="1.6" opacity="0.55"/>`;
    }).join("");
    const dots = [...used.entries()].map(([code, ap]) => {
      const isBase = baseSet.has(code);
      return `<g><circle cx="${px(ap.lon).toFixed(0)}" cy="${py(ap.lat).toFixed(0)}" r="${isBase ? 6 : 4}" fill="${isBase ? S.airline.color : '#9cc0ff'}" stroke="#fff" stroke-width="1"></circle>
        <text x="${px(ap.lon).toFixed(0)}" y="${(py(ap.lat) - 9).toFixed(0)}" fill="#cfe0ff" font-size="13" text-anchor="middle">${code}</text></g>`;
    }).join("");
    let grid = "";
    for (let lon = -150; lon <= 150; lon += 30) grid += `<line x1="${px(lon)}" y1="0" x2="${px(lon)}" y2="${H}" stroke="rgba(120,150,220,0.10)"/>`;
    for (let lat = -60; lat <= 60; lat += 30) grid += `<line x1="0" y1="${py(lat)}" x2="${W}" y2="${py(lat)}" stroke="rgba(120,150,220,0.10)"/>`;
    return `<div class="mapwrap"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" class="worldmap">
      <rect width="${W}" height="${H}" fill="rgba(8,12,24,0.5)" rx="14"/>${grid}${lines}${dots}</svg></div>`;
  }
  function renderRecentNews() {
    return `<div class="panel"><h3>Latest news</h3><div class="desc">Your airline's headlines.</div>
      ${S.log.slice(0, 4).map(logEntryHTML).join("")}
      <div style="margin-top:10px"><button class="btn ghost sm" onclick="window.__go('log')">View all news →</button></div></div>`;
  }

  /* ============================================================
     RENDER: MARKET (bulk buy + financing)
     ============================================================ */
  function renderMarket() {
    const makers = ["All", ...MANUFACTURERS];
    view.innerHTML = `
      <div class="panel">
        <h3>Aircraft Market</h3>
        <div class="desc">Order real aircraft in any quantity. Volume discounts: 3+ → 1.5%, 5+ → 3%, 10+ → 6%. Cash: <b id="mktCash">${fmtMoney(S.finance.cash)}</b></div>
        <div class="buy-controls">
          <label>Quantity <input id="buyQty" type="number" min="1" max="50" value="1"></label>
          <label class="chk"><input id="buyFinance" type="checkbox"> Finance (30% down, rest as loan)</label>
        </div>
        <div class="tabs" id="makerFilter" style="margin:14px 0">
          ${makers.map((m,i)=>`<button class="tab ${i===0?'active':''}" data-maker="${m}">${m}</button>`).join("")}
        </div>
        <div class="market-grid" id="marketGrid"></div>
      </div>`;
    const grid = $("marketGrid");
    const paint = maker => { grid.innerHTML = AIRCRAFT.filter(a => maker==="All"||a.maker===maker).map(acCardHTML).join(""); };
    paint("All");
    $("makerFilter").querySelectorAll(".tab").forEach(t => t.onclick = () => {
      $("makerFilter").querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
      t.classList.add("active"); paint(t.dataset.maker);
    });
  }
  function acCardHTML(a) {
    const leaseWk = (a.price * 0.0023).toFixed(2);
    return `<div class="ac-card">
      <div class="ph"><img loading="lazy" src="${a.img}" alt="${a.maker} ${a.model}" onerror="this.onerror=null;this.src=planePlaceholder('${a.maker} ${a.model}')"></div>
      <div class="body">
        <div class="maker">${a.maker} · ${a.category}</div>
        <div class="model">${a.model}</div>
        <div class="blurb">${a.blurb}</div>
        <div class="spec-line"><span>Seats <b>${a.seats}</b></span><span>Range <b>${a.range.toLocaleString()} nm</b></span><span>Speed <b>${a.cruise} kt</b></span><span>Fuel <b>${a.fuelBurn.toFixed(2)}×</b></span></div>
        <div class="ac-buy">
          <button class="btn" onclick="window.__buy('${a.id}',false)">Buy $${a.price}M</button>
          <button class="btn ghost" onclick="window.__buy('${a.id}',true)">Lease $${leaseWk}M/wk</button>
        </div>
      </div></div>`;
  }

  function buyAircraft(acId, leased) {
    if (S._over) return;
    const ac = getAircraft(acId);
    const qty = clamp(parseInt(($("buyQty") || {}).value) || 1, 1, 50);
    const finance = !leased && $("buyFinance") && $("buyFinance").checked;

    if (leased) {
      const down = ac.price * 0.04 * qty;
      if (S.finance.cash < down) return toast(`Need ${fmtMoney(down)} for ${qty} lease deposit(s).`, "bad");
      S.finance.cash = +(S.finance.cash - down).toFixed(2);
      for (let i = 0; i < qty; i++) addPlane(acId, true);
      logBuy(ac, qty, true, 0);
    } else {
      const disc = volumeDiscount(qty);
      const gross = ac.price * qty;
      const net = +(gross * (1 - disc)).toFixed(1);
      if (finance) {
        const down = +(net * 0.30).toFixed(1);
        if (S.finance.cash < down) return toast(`Need ${fmtMoney(down)} down for financing.`, "bad");
        S.finance.cash = +(S.finance.cash - down).toFixed(2);
        S.finance.loan = +(S.finance.loan + (net - down)).toFixed(2);
      } else {
        if (S.finance.cash < net) return toast(`Need ${fmtMoney(net)} for ${qty}× ${ac.model}.`, "bad");
        S.finance.cash = +(S.finance.cash - net).toFixed(2);
      }
      for (let i = 0; i < qty; i++) addPlane(acId, false);
      logBuy(ac, qty, false, disc, finance);
    }
    toast(`${qty}× ${ac.model} ${leased ? "leased" : "acquired"}! Assign in Routes.`, "good");
    checkProgress(); persist();
    if (currentTab === "market" && $("mktCash")) $("mktCash").textContent = fmtMoney(S.finance.cash);
    renderHUD();
  }
  function addPlane(acId, leased) {
    tailCounter += 1;
    const tail = `${S.airline.code}-${String(tailCounter).padStart(3, "0")}`;
    S.fleet.push({ instId: "p" + Date.now() + Math.floor(Math.random()*99999), aircraftId: acId, tail, tailSeq: tailCounter,
      condition: 100, ageWeeks: 0, leased, routeId: null, upgrades: [] });
  }
  function logBuy(ac, qty, leased, disc, finance) {
    const extra = leased ? "leased" : (finance ? "financed" : "purchased") + (disc ? ` (${Math.round(disc*100)}% volume discount)` : "");
    S.log.unshift({ week: S.week, kind: "good", title: leased ? "📝 Aircraft Leased" : "✅ Aircraft Acquired", text: `${qty}× ${ac.maker} ${ac.model} ${extra}.` });
  }

  /* ============================================================
     RENDER: FLEET (auto-maintenance + bulk ops + upgrades)
     ============================================================ */
  function renderFleet() {
    if (!S.fleet.length) {
      view.innerHTML = panelEmpty("🛩️", "No aircraft yet", "Head to the market and order your first jet.",
        `<button class="btn gold" onclick="window.__go('market')">🛒 Buy Aircraft</button>`);
      return;
    }
    const mcCards = Object.values(MAINT_CONTRACTS).map(mc => `
      <div class="choice ${S.maintenance.contract===mc.key?'active':''}" onclick="window.__maint('${mc.key}')">
        <b>${mc.icon} ${mc.label}</b>
        <span>${mc.feePerPlane?fmtMoney(mc.feePerPlane)+'/plane/wk':'Free'}</span>
        <span style="font-size:11px;color:var(--muted)">${mc.desc}</span>
      </div>`).join("");

    const idleCount = S.fleet.filter(p => !p.routeId).length;
    const repairTotal = S.fleet.reduce((s, p) => s + repairCostM(p, 100), 0);

    view.innerHTML = `
      <div class="panel">
        <h3>Maintenance plan 🔧</h3>
        <div class="desc">Choose an auto-maintenance contract so you never babysit aircraft condition again.</div>
        <div class="choice-grid">${mcCards}</div>
      </div>
      <div class="panel">
        <h3>Your Fleet (${S.fleet.length})</h3>
        <div class="desc">Upgrade aircraft, repair, or sell. Bulk actions below.</div>
        <div class="bulk-bar">
          <button class="btn sm" id="repairAll" ${repairTotal<=0?'disabled':''}>🛠️ Repair all (${fmtMoney(repairTotal)})</button>
          <button class="btn ghost sm" id="sellIdle" ${idleCount?'':'disabled'}>💸 Sell ${idleCount} idle</button>
        </div>
        <div class="rows">${S.fleet.map(fleetRowHTML).join("")}</div>
      </div>`;

    $("repairAll").onclick = repairAll;
    $("sellIdle").onclick = sellAllIdle;
  }

  function fleetRowHTML(p) {
    const ac = getAircraft(p.aircraftId);
    const route = S.routes.find(r => r.id === p.routeId);
    const status = route
      ? `<span class="badge" style="border-color:rgba(52,211,153,.5);color:var(--good)">On ${route.from}→${route.to}</span>`
      : `<span class="badge" style="border-color:rgba(251,191,36,.5);color:var(--warn)">Idle</span>`;
    const resale = (ac.price * (p.condition/100) * (p.leased?0:0.78)).toFixed(1);
    const upBadges = (p.upgrades||[]).map(k=>{const u=getUpgrade(k);return u?`<span class="badge" title="${u.name}">${u.icon}</span>`:"";}).join(" ");
    return `<div class="row-item">
      <img class="thumb" src="${ac.img}" alt="${ac.model}" onerror="this.onerror=null;this.src=planePlaceholder('${ac.model}')">
      <div class="grow">
        <div class="ttl">${p.tail} · ${ac.maker} ${ac.model} ${p.leased?'<span class="badge" style="color:var(--brand-2)">Leased</span>':''} ${upBadges}</div>
        <div class="meta"><span>${status}</span><span>Condition <b>${Math.round(p.condition)}%</b></span><span>Age <b>${(p.ageWeeks/52).toFixed(1)} yr</b></span><span>Seats <b>${ac.seats}</b></span></div>
        <div class="meter"><i style="width:${p.condition}%;background:${p.condition<55?'linear-gradient(90deg,#f59e0b,#ef4444)':''}"></i></div>
      </div>
      <div class="row-actions">
        <button class="btn ghost sm" onclick="window.__upg('${p.instId}')">🔧 Upgrade</button>
        ${route?`<button class="btn ghost sm" onclick="window.__unassign('${p.instId}')">Unassign</button>`:''}
        <button class="btn ${p.leased?'':'danger'} sm" onclick="window.__sell('${p.instId}')">${p.leased?'Return':'Sell $'+resale+'M'}</button>
      </div></div>`;
  }

  function setMaintContract(key) {
    if (!MAINT_CONTRACTS[key]) return;
    S.maintenance.contract = key;
    S.log.unshift({ week: S.week, kind: "neutral", title: "🔧 Maintenance Plan", text: `Switched to ${MAINT_CONTRACTS[key].label} maintenance.` });
    toast(`Maintenance: ${MAINT_CONTRACTS[key].label}.`, "good");
    persist(); render();
  }
  function repairAll() {
    const cost = +S.fleet.reduce((s, p) => s + repairCostM(p, 100), 0).toFixed(1);
    if (cost <= 0) return;
    if (S.finance.cash < cost) return toast(`Need ${fmtMoney(cost)} to repair all.`, "bad");
    S.finance.cash = +(S.finance.cash - cost).toFixed(2);
    S.fleet.forEach(p => p.condition = 100);
    S.log.unshift({ week: S.week, kind: "neutral", title: "🛠️ Fleet Overhauled", text: `All aircraft restored to 100% for ${fmtMoney(cost)}.` });
    toast(`Fleet repaired for ${fmtMoney(cost)}.`, "good");
    persist(); render();
  }
  function sellAllIdle() {
    const idle = S.fleet.filter(p => !p.routeId);
    if (!idle.length) return;
    openModal("Sell all idle aircraft?", `This sells/returns <b>${idle.length}</b> unassigned aircraft.`,
      [{ label: "Cancel", ghost: true, fn: closeModal },
       { label: `Sell ${idle.length}`, danger: true, fn: () => {
          let proceeds = 0;
          idle.forEach(p => { const ac = getAircraft(p.aircraftId); if (!p.leased) proceeds += ac.price * (p.condition/100) * 0.78; });
          proceeds = +proceeds.toFixed(1);
          S.fleet = S.fleet.filter(p => p.routeId);
          S.finance.cash = +(S.finance.cash + proceeds).toFixed(2);
          S.log.unshift({ week: S.week, kind: "neutral", title: "💸 Idle Fleet Sold", text: `Sold/returned ${idle.length} idle aircraft for ${fmtMoney(proceeds)}.` });
          toast(`Sold idle fleet for ${fmtMoney(proceeds)}.`, "good");
          closeModal(); persist(); render();
       }}]);
  }

  function openUpgrade(instId) {
    const p = S.fleet.find(x => x.instId === instId); if (!p) return;
    const ac = getAircraft(p.aircraftId);
    const opts = Object.values(UPGRADES).map(u => {
      const owned = (p.upgrades||[]).includes(u.key);
      return `<div class="row-item" style="padding:10px 12px"><div class="grow"><div class="ttl">${u.icon} ${u.name} ${owned?'<span class="badge" style="color:var(--good)">Installed</span>':''}</div><div class="meta"><span>${u.desc}</span></div></div>
        <div class="row-actions">${owned?'':`<button class="btn sm" onclick="window.__doUpg('${instId}','${u.key}')">Install $${u.cost}M</button>`}</div></div>`;
    }).join("");
    openModal(`Upgrade ${p.tail}`, `${ac.maker} ${ac.model}. Upgrades are permanent for this airframe.<div class="rows" style="margin-top:14px">${opts}</div>`,
      [{ label: "Close", ghost: true, fn: closeModal }]);
  }
  function doUpgrade(instId, key) {
    const p = S.fleet.find(x => x.instId === instId), u = getUpgrade(key);
    if (!p || !u || (p.upgrades||[]).includes(key)) return;
    if (S.finance.cash < u.cost) return toast(`Need ${fmtMoney(u.cost)}.`, "bad");
    S.finance.cash = +(S.finance.cash - u.cost).toFixed(2);
    p.upgrades.push(key);
    S.finance.reputation = clamp(S.finance.reputation + u.repBoost, 1, 100);
    S.flags.upgrade = true;
    S.log.unshift({ week: S.week, kind: "good", title: "🔧 Aircraft Upgraded", text: `${u.name} installed on ${p.tail}.` });
    toast(`${u.icon} ${u.name} installed.`, "good");
    closeModal(); checkProgress(); persist(); render();
  }
  function sellAircraft(instId) {
    const idx = S.fleet.findIndex(p => p.instId === instId); if (idx < 0) return;
    const p = S.fleet[idx], ac = getAircraft(p.aircraftId);
    if (p.routeId) removeRoute(p.routeId, true);
    if (!p.leased) {
      const resale = +(ac.price * (p.condition/100) * 0.78).toFixed(1);
      S.finance.cash = +(S.finance.cash + resale).toFixed(2);
      toast(`Sold ${p.tail} for ${fmtMoney(resale)}.`, "good");
      S.log.unshift({ week: S.week, kind: "neutral", title: "💸 Aircraft Sold", text: `${p.tail} (${ac.model}) sold for ${fmtMoney(resale)}.` });
    } else {
      toast(`Lease on ${p.tail} returned.`, "good");
      S.log.unshift({ week: S.week, kind: "neutral", title: "📤 Lease Returned", text: `${p.tail} (${ac.model}) returned.` });
    }
    S.fleet.splice(idx, 1); persist(); render();
  }
  function unassign(instId) { const p = S.fleet.find(x => x.instId === instId); if (p && p.routeId) removeRoute(p.routeId, true); persist(); render(); }

  /* ============================================================
     RENDER: ROUTES (multi-base, service, bulk pricing, auto-price)
     ============================================================ */
  function renderRoutes() {
    const idle = S.fleet.filter(p => !p.routeId);
    const bases = S.airline.bases;
    const baseOptions = bases.map(b => `<option value="${b}">${b} · ${getAirport(b).city}</option>`).join("");
    const idleOptions = idle.map(p => { const ac = getAircraft(p.aircraftId); return `<option value="${p.instId}">${p.tail} · ${ac.model} (${ac.range.toLocaleString()} nm)</option>`; }).join("");
    const svcOptions = Object.values(SERVICE_LEVELS).map(s => `<option value="${s.key}" ${s.key==='standard'?'selected':''}>${s.icon} ${s.label}</option>`).join("");
    const canCreate = S.fleet.length && idle.length;

    const creator = !S.fleet.length
      ? `<div class="empty"><div class="big">🗺️</div>Buy an aircraft first, then open routes from your bases.</div>`
      : !idle.length
        ? `<div class="empty muted">All aircraft are assigned. Buy more or unassign one to open a new route.</div>`
        : `<div class="inline-form">
            <div class="field"><label>From base</label><select id="rBase">${baseOptions}</select></div>
            <div class="field"><label>Destination</label><select id="rDest"></select></div>
            <div class="field"><label>Aircraft</label><select id="rPlane">${idleOptions}</select></div>
            <div class="field"><label>Service class</label><select id="rSvc">${svcOptions}</select></div>
            <div class="field"><label>Ticket price (per seat)</label><input id="rPrice" type="number" min="20"></div>
            <div class="field full"><button class="btn" style="width:100%" id="rCreate">➕ Open Route</button></div>
           </div><div class="desc" id="rHint" style="margin-top:12px"></div>`;

    const bulkTools = S.routes.length ? `
      <div class="panel">
        <h3>Pricing tools 💵</h3>
        <div class="desc">Adjust every route's fare at once, auto-optimise for profit, or reset to fair price.</div>
        <div class="bulk-price">
          <select id="bpDir"><option value="up">Increase ▲</option><option value="down">Decrease ▼</option></select>
          <input id="bpVal" type="number" min="0" value="10">
          <select id="bpMode"><option value="pct">%</option><option value="abs">$ per seat</option></select>
          <button class="btn sm" id="bpApply">Apply to all</button>
          <button class="btn ghost sm" id="bpFair">↺ Reset to fair</button>
          <button class="btn ${S.autoPrice?'gold':'ghost'} sm" id="bpAuto">${S.autoPrice?'🤖 Auto-price ON':'🤖 Auto-price'}</button>
          <button class="btn ghost sm" id="bpOpt">⚡ Optimise now</button>
        </div>
      </div>` : "";

    view.innerHTML = `
      <div class="panel">
        <h3>Open a New Route</h3>
        <div class="desc">Fly between any base and a destination. Service class trades fares against how full cabins run.</div>
        ${creator}
      </div>
      ${bulkTools}
      <div class="panel">
        <h3>Secondary Bases</h3>
        <div class="desc">Open new bases to launch routes from more cities. Cost ${fmtMoney(BASE_OPEN_COST)} each.</div>
        <div class="rows">${bases.map(b=>`<div class="row-item" style="padding:10px 14px"><div class="grow"><div class="ttl">🏢 ${b} · ${getAirport(b).city}, ${getAirport(b).country} ${b===S.airline.hub?'<span class="badge" style="color:var(--brand-2)">HQ</span>':''} ${S.lounges[b]?'<span class="badge" style="color:var(--gold)">🛋️ Lounge</span>':''}</div></div></div>`).join("")}</div>
        <div style="margin-top:12px"><button class="btn ghost sm" id="openBaseBtn">➕ Open a base (${fmtMoney(BASE_OPEN_COST)})</button></div>
      </div>
      <div class="panel">
        <h3>Active Network (${S.routes.length})</h3>
        ${S.routes.length ? `<div class="rows">${S.routes.map(routeRowHTML).join("")}</div>` : `<div class="empty muted">No active routes yet.</div>`}
      </div>`;

    $("openBaseBtn").onclick = openBaseDialog;
    if (S.routes.length) {
      $("bpApply").onclick = applyBulkPrice;
      $("bpFair").onclick = () => { S.routes.forEach(r => r.price = fairPrice(r.distance)); persist(); render(); toast("Prices reset to fair value.", "good"); };
      $("bpAuto").onclick = () => { S.autoPrice = !S.autoPrice; if (S.autoPrice) optimizeAllPrices(); persist(); render(); toast(`Auto-pricing ${S.autoPrice?'enabled':'disabled'}.`, "good"); };
      $("bpOpt").onclick = () => { optimizeAllPrices(); persist(); render(); toast("Prices optimised for profit.", "good"); };
    }
    if (canCreate) {
      const fillDest = () => {
        const base = $("rBase").value;
        $("rDest").innerHTML = AIRPORTS.filter(a => a.code !== base).map(a => `<option value="${a.code}">${a.code} · ${a.city} (${distanceNM(base,a.code).toLocaleString()} nm)</option>`).join("");
      };
      const updateHint = () => {
        const base = $("rBase").value, dest = $("rDest").value, dist = distanceNM(base, dest);
        if (!$("rPrice").value || $("rPrice").dataset.auto !== "0") { $("rPrice").value = fairPrice(dist); $("rPrice").dataset.auto = "1"; }
        const plane = S.fleet.find(p => p.instId === $("rPlane").value), ac = plane && getAircraft(plane.aircraftId);
        const ok = ac && ac.range >= dist;
        $("rHint").innerHTML = ok ? `Distance <b>${dist.toLocaleString()} nm</b> · Fair price <b>$${fairPrice(dist)}</b> · ${ac.model} range OK ✅`
          : `<span class="neg">⚠️ ${ac?ac.model:'Aircraft'} range (${ac?ac.range.toLocaleString():0} nm) too short for ${dist.toLocaleString()} nm.</span>`;
        $("rCreate").disabled = !ok;
      };
      $("rBase").onchange = () => { fillDest(); updateHint(); };
      $("rDest").onchange = updateHint;
      $("rPlane").onchange = updateHint;
      $("rPrice").oninput = () => { $("rPrice").dataset.auto = "0"; };
      fillDest(); updateHint();
      $("rCreate").onclick = createRoute;
    }
  }

  function applyBulkPrice() {
    const dir = $("bpDir").value, mode = $("bpMode").value, val = Math.max(0, parseFloat($("bpVal").value) || 0);
    if (!val) return;
    S.routes.forEach(r => {
      let p = r.price;
      if (mode === "pct") p = dir === "up" ? p * (1 + val/100) : p * (1 - val/100);
      else p = dir === "up" ? p + val : p - val;
      r.price = Math.max(20, Math.round(p));
    });
    persist(); render();
    toast(`Adjusted all fares ${dir==='up'?'+':'−'}${val}${mode==='pct'?'%':' per seat'}.`, "good");
  }

  function routeRowHTML(r) {
    const plane = S.fleet.find(p => p.instId === r.aircraftInstId);
    const ac = plane ? getAircraft(plane.aircraftId) : null;
    const eco = routeEconomics(r);
    const A = getAirport(r.from), B = getAirport(r.to);
    const profit = eco ? eco.profit/1e6 : (r.lastProfit||0)/1e6;
    const svc = getServiceLevel(r.service);
    return `<div class="row-item">
      <div class="grow">
        <div class="ttl">${r.from} → ${r.to} <span class="muted" style="font-weight:500">· ${A.city} ✈ ${B.city}</span> <span class="badge">${svc.icon} ${svc.label}</span></div>
        <div class="meta"><span>${ac?plane.tail+' · '+ac.model:'—'}</span><span>${r.distance.toLocaleString()} nm</span><span>Price <b>$${r.price}</b></span>
          ${eco?`<span>Load <b>${Math.round(eco.load*100)}%</b></span><span>${eco.freq}×/wk</span>`:''}
          <span>Profit/wk <b class="${profit>=0?'pos':'neg'}">${(profit>=0?'+':'')+fmtMoney(profit)}</b></span></div>
      </div>
      <div class="row-actions">
        <button class="btn ghost sm" onclick="window.__editRoute('${r.id}')">⚙️ Manage</button>
        <button class="btn danger sm" onclick="window.__closeRoute('${r.id}')">Close</button>
      </div></div>`;
  }
  function createRoute() {
    const base = $("rBase").value, dest = $("rDest").value, instId = $("rPlane").value, service = $("rSvc").value;
    const dist = distanceNM(base, dest);
    const price = Math.max(20, parseInt($("rPrice").value) || fairPrice(dist));
    const plane = S.fleet.find(p => p.instId === instId), ac = getAircraft(plane.aircraftId);
    if (ac.range < dist) return toast("That aircraft can't reach this destination.", "bad");
    const route = { id: "r" + Date.now() + Math.floor(Math.random()*999), from: base, to: dest, aircraftInstId: instId, price, distance: dist, service };
    S.routes.push(route); plane.routeId = route.id;
    S.log.unshift({ week: S.week, kind: "good", title: "🗺️ Route Opened", text: `New ${getServiceLevel(service).label} route ${route.from} → ${route.to} on ${plane.tail}.` });
    toast(`Route ${route.from} → ${route.to} opened!`, "good");
    checkProgress(); persist(); render();
  }
  function removeRoute(routeId, silent) {
    const idx = S.routes.findIndex(r => r.id === routeId); if (idx < 0) return;
    const r = S.routes[idx], plane = S.fleet.find(p => p.instId === r.aircraftInstId);
    if (plane) plane.routeId = null;
    S.routes.splice(idx, 1);
    if (!silent) { S.log.unshift({ week: S.week, kind: "neutral", title: "🚫 Route Closed", text: `Route ${r.from} → ${r.to} closed.` }); toast(`Route ${r.from} → ${r.to} closed.`, "good"); }
    persist();
  }
  function closeRoute(id) { removeRoute(id); render(); }
  function editRoute(routeId) {
    const r = S.routes.find(x => x.id === routeId); if (!r) return;
    const fair = fairPrice(r.distance);
    const svcOptions = Object.values(SERVICE_LEVELS).map(s => `<option value="${s.key}" ${s.key===r.service?'selected':''}>${s.icon} ${s.label} — ${s.desc}</option>`).join("");
    openModal(`Manage ${r.from} → ${r.to}`,
      `${r.distance.toLocaleString()} nm · fair price ≈ <b>$${fair}</b>.
       <div class="field" style="margin-top:14px"><label>Service class</label><select id="mSvc">${svcOptions}</select></div>
       <div class="field"><label>Ticket price (per seat)</label><input id="mPrice" type="number" min="20" value="${r.price}"></div>`,
      [{ label: "Cancel", ghost: true, fn: closeModal },
       { label: "Optimise", ghost: true, fn: () => { document.getElementById("mPrice").value = bestPriceFor(r); } },
       { label: "Save", fn: () => { r.price = Math.max(20, parseInt(document.getElementById("mPrice").value) || r.price); r.service = document.getElementById("mSvc").value; closeModal(); persist(); render(); toast(`Updated ${r.from}→${r.to}.`, "good"); }}]);
  }
  function openBaseDialog() {
    const avail = AIRPORTS.filter(a => !S.airline.bases.includes(a.code));
    const opts = avail.map(a => `<option value="${a.code}">${a.code} · ${a.city}, ${a.country} (demand ${a.demand})</option>`).join("");
    openModal("Open a new base", `A new base lets you launch routes from this city. Cost <b>${fmtMoney(BASE_OPEN_COST)}</b>, plus extra overhead.
      <div class="field" style="margin-top:14px"><label>City</label><select id="baseSel">${opts}</select></div>`,
      [{ label: "Cancel", ghost: true, fn: closeModal },
       { label: `Open base (${fmtMoney(BASE_OPEN_COST)})`, fn: () => {
          if (S.finance.cash < BASE_OPEN_COST) { toast(`Need ${fmtMoney(BASE_OPEN_COST)}.`, "bad"); return; }
          const code = document.getElementById("baseSel").value;
          S.finance.cash = +(S.finance.cash - BASE_OPEN_COST).toFixed(2);
          S.airline.bases.push(code);
          S.log.unshift({ week: S.week, kind: "good", title: "🏢 New Base", text: `Opened a base at ${code} · ${getAirport(code).city}.` });
          toast(`New base opened at ${code}!`, "good");
          closeModal(); checkProgress(); persist(); render();
       }}]);
  }

  /* ============================================================
     RENDER: STAFF
     ============================================================ */
  function renderStaff() {
    const req = staffRequirements(), cov = staffCoverage();
    const rows = Object.values(STAFF_ROLES).map(role => {
      const have = S.staff[role.key] || 0, need = req[role.key], short = have < need;
      return `<div class="row-item">
        <div class="grow"><div class="ttl">${role.icon} ${role.label}</div>
          <div class="meta"><span>Have <b>${have}</b></span><span>Need <b>${need}</b></span><span>Salary <b>${fmtMoney(role.salary)}</b>/head/wk</span><span class="${short?'neg':'pos'}">${short?'⚠️ short '+(need-have):'covered'}</span></div>
          <div class="meter"><i style="width:${need?Math.min(100,have/need*100):100}%;background:${short?'linear-gradient(90deg,#f59e0b,#ef4444)':''}"></i></div></div>
        <div class="row-actions"><button class="btn ghost sm" onclick="window.__hire('${role.key}',-5)">−5</button><button class="btn ghost sm" onclick="window.__hire('${role.key}',5)">+5</button><button class="btn sm" onclick="window.__hireTo('${role.key}')">Hire to need</button></div></div>`;
    }).join("");
    view.innerHTML = `
      <div class="kpi-grid">
        ${kpi("Operational coverage", Math.round(cov*100)+"%", barHTML(cov*100), cov<0.9?"neg":"pos")}
        ${kpi("Weekly payroll", fmtMoney(weeklySalaries()), "all staff")}
        ${kpi("Revenue impact", Math.round(staffRevenueMult()*100)+"%", "of potential")}
      </div>
      <div class="panel"><h3>Staffing & HR</h3>
        <div class="desc">Understaffing throttles revenue and reputation. Overstaffing wastes payroll. Hiring costs a one-off fee per head.</div>
        <div class="rows">${rows}</div>
        <div class="bulk-bar" style="margin-top:14px"><button class="btn gold" id="autoStaff">⚡ Auto-staff to requirement</button><button class="btn ghost" id="trimStaff">✂️ Trim to requirement</button></div>
      </div>`;
    $("autoStaff").onclick = () => adjustAllStaff(true);
    $("trimStaff").onclick = () => adjustAllStaff(false);
  }
  function hire(role, n) {
    const cur = S.staff[role] || 0, next = Math.max(0, cur + n), added = next - cur;
    if (added > 0) { const cost = added * STAFF_ROLES[role].hire; if (S.finance.cash < cost) return toast(`Need ${fmtMoney(cost)} to hire ${added}.`, "bad"); S.finance.cash = +(S.finance.cash - cost).toFixed(2); }
    S.staff[role] = next; persist(); render();
  }
  function hireToNeed(role) { const need = staffRequirements()[role], cur = S.staff[role] || 0; if (need > cur) hire(role, need - cur); else { S.staff[role] = need; persist(); render(); } }
  function adjustAllStaff(up) {
    const req = staffRequirements();
    if (up) {
      let cost = 0; for (const k in req) cost += Math.max(0, req[k] - (S.staff[k]||0)) * STAFF_ROLES[k].hire;
      if (S.finance.cash < cost) return toast(`Auto-staffing needs ${fmtMoney(cost)}.`, "bad");
      S.finance.cash = +(S.finance.cash - cost).toFixed(2);
      for (const k in req) S.staff[k] = Math.max(S.staff[k]||0, req[k]);
      toast(`Staffed to requirement (−${fmtMoney(cost)}).`, "good");
    } else { for (const k in req) S.staff[k] = req[k]; toast("Trimmed staff to requirement.", "good"); }
    persist(); render();
  }

  /* ============================================================
     RENDER: GROWTH (marketing, hedging, alliances, loyalty, lounges)
     ============================================================ */
  function renderGrowth() {
    const active = S.marketing.active;
    const campaigns = MARKETING_CAMPAIGNS.map(c => `
      <div class="ac-card"><div class="body">
        <div class="maker">${c.icon} Campaign</div><div class="model">${c.name}</div><div class="blurb">${c.desc}</div>
        <div class="spec-line"><span>Cost <b>${fmtMoney(c.cost)}</b></span><span>Runs <b>${c.weeks} wks</b></span><span>+<b>${c.rep}</b> rep</span><span>+<b>${Math.round(c.demand*100)}%</b> demand</span></div>
        <button class="btn" ${active?'disabled':''} onclick="window.__campaign('${c.key}')">${active?'Campaign running':'Launch'}</button>
      </div></div>`).join("");

    const allianceCards = ALLIANCES.map(a => {
      const joined = S.alliance === a.key;
      return `<div class="ac-card"><div class="body">
        <div class="maker">${a.icon} Alliance</div><div class="model">${a.name}</div><div class="blurb">${a.desc}</div>
        <div class="spec-line"><span>Dues <b>${fmtMoney(a.dues)}/wk</b></span><span>+<b>${Math.round(a.demand*100)}%</b> demand</span></div>
        ${joined?`<button class="btn danger" onclick="window.__leaveAlliance()">Leave ${a.name}</button>`:`<button class="btn" ${S.alliance?'disabled':''} onclick="window.__joinAlliance('${a.key}')">${S.alliance?'In another alliance':'Join'}</button>`}
      </div></div>`;
    }).join("");

    const loyaltyCards = Object.values(LOYALTY_TIERS).map(t => {
      const cur = S.loyalty === t.key;
      const cost = t.key==='none'?0:(t.base + t.perRoute*S.routes.length);
      return `<div class="choice ${cur?'active':''}" onclick="window.__loyalty('${t.key}')">
        <b>${t.label}</b><span>${t.key==='none'?'No programme':'+'+Math.round(t.demand*100)+'% demand'}</span>
        <span style="font-size:11px;color:var(--muted)">${t.key==='none'?'—':fmtMoney(cost)+'/wk'}</span></div>`;
    }).join("");

    const loungeRows = S.airline.bases.map(b => {
      const has = !!S.lounges[b];
      return `<div class="row-item" style="padding:10px 14px"><div class="grow"><div class="ttl">🛋️ ${b} · ${getAirport(b).city} ${has?'<span class="badge" style="color:var(--gold)">Open</span>':''}</div>
        <div class="meta"><span>+${Math.round(LOUNGE.demand*100)}% demand on routes from here</span></div></div>
        <div class="row-actions">${has?'<span class="muted" style="font-size:12px">'+fmtMoney(LOUNGE.weeklyFee)+'/wk</span>':`<button class="btn sm" onclick="window.__lounge('${b}')">Build $${LOUNGE.cost}M</button>`}</div></div>`;
    }).join("");

    view.innerHTML = `
      <div class="panel"><h3>Marketing 📣</h3>
        <div class="desc">Campaigns boost demand and reputation while they run. One at a time.${active?`<br><b class="pos">Active:</b> ${active.name} — ${active.weeksLeft} week(s) left.`:''}</div>
        <div class="market-grid">${campaigns}</div></div>

      <div class="panel"><h3>Fuel Hedging ⛽</h3>
        <div class="desc">Lock today's fuel price ($${S.fuelPrice}/unit) for ${FUEL_HEDGE.weeks} weeks. Fee: ${fmtMoney(Math.max(FUEL_HEDGE.minFee, S.fleet.length*FUEL_HEDGE.feePerAircraft))}.${S.fuelHedge.active?`<br><b class="pos">Hedged</b> @ $${S.fuelHedge.price} for ${S.fuelHedge.weeksLeft} more week(s).`:''}</div>
        <button class="btn ${S.fuelHedge.active?'':'gold'}" id="hedgeBtn" ${S.fuelHedge.active?'disabled':''}>${S.fuelHedge.active?'Hedge active':'🔒 Hedge fuel now'}</button></div>

      <div class="panel"><h3>Alliances 🤝</h3>
        <div class="desc">Join a global alliance for a permanent demand & reputation boost (weekly dues apply). ${S.alliance?'Member of <b>'+getAlliance(S.alliance).name+'</b>.':'Currently independent.'}</div>
        <div class="market-grid">${allianceCards}</div></div>

      <div class="panel"><h3>Frequent-Flyer Programme 💳</h3>
        <div class="desc">Higher tiers grow repeat demand and reputation — at a weekly cost that scales with your network.</div>
        <div class="choice-grid">${loyaltyCards}</div></div>

      <div class="panel"><h3>Airport Lounges 🛋️</h3>
        <div class="desc">Premium lounges at your bases lift demand on departing routes and polish your brand.</div>
        <div class="rows">${loungeRows}</div></div>`;

    $("hedgeBtn").onclick = doHedge;
  }
  function startCampaign(key) {
    if (S.marketing.active) return toast("A campaign is already running.", "bad");
    const c = MARKETING_CAMPAIGNS.find(x => x.key === key); if (!c) return;
    if (S.finance.cash < c.cost) return toast(`Need ${fmtMoney(c.cost)}.`, "bad");
    S.finance.cash = +(S.finance.cash - c.cost).toFixed(2);
    S.marketing.active = { name: c.name, demand: c.demand, weeksLeft: c.weeks };
    S.finance.reputation = clamp(S.finance.reputation + c.rep, 1, 100);
    S.flags.marketing = true;
    S.log.unshift({ week: S.week, kind: "good", title: "📣 Campaign Launched", text: `${c.name} is live for ${c.weeks} weeks (+${c.rep} rep).` });
    toast(`${c.icon} ${c.name} launched!`, "good");
    checkProgress(); persist(); render();
  }
  function doHedge() {
    if (S.fuelHedge.active) return;
    const fee = Math.max(FUEL_HEDGE.minFee, S.fleet.length * FUEL_HEDGE.feePerAircraft);
    if (S.finance.cash < fee) return toast(`Need ${fmtMoney(fee)}.`, "bad");
    S.finance.cash = +(S.finance.cash - fee).toFixed(2);
    S.fuelHedge = { active: true, price: S.fuelPrice, weeksLeft: FUEL_HEDGE.weeks };
    S.log.unshift({ week: S.week, kind: "neutral", title: "⛽ Fuel Hedged", text: `Locked fuel at $${S.fuelPrice} for ${FUEL_HEDGE.weeks} weeks.` });
    toast(`Fuel hedged at $${S.fuelPrice}.`, "good"); persist(); render();
  }
  function joinAlliance(key) {
    const a = getAlliance(key); if (!a || S.alliance) return;
    S.alliance = key;
    S.finance.reputation = clamp(S.finance.reputation + a.rep, 1, 100);
    S.log.unshift({ week: S.week, kind: "good", title: "🤝 Alliance Joined", text: `${S.airline.name} joined ${a.name} (+${a.rep} rep).` });
    toast(`Joined ${a.name}!`, "good"); checkProgress(); persist(); render();
  }
  function leaveAlliance() {
    if (!S.alliance) return; const a = getAlliance(S.alliance);
    S.alliance = null;
    S.log.unshift({ week: S.week, kind: "neutral", title: "🤝 Alliance Left", text: `Left ${a?a.name:'the alliance'}.` });
    toast("Left alliance.", "good"); persist(); render();
  }
  function setLoyalty(key) {
    if (!LOYALTY_TIERS[key]) return; S.loyalty = key;
    S.log.unshift({ week: S.week, kind: "neutral", title: "💳 Loyalty Programme", text: `Frequent-flyer tier set to ${LOYALTY_TIERS[key].label}.` });
    toast(`Loyalty: ${LOYALTY_TIERS[key].label}.`, "good"); persist(); render();
  }
  function buildLounge(base) {
    if (S.lounges[base]) return;
    if (S.finance.cash < LOUNGE.cost) return toast(`Need ${fmtMoney(LOUNGE.cost)}.`, "bad");
    S.finance.cash = +(S.finance.cash - LOUNGE.cost).toFixed(2);
    S.lounges[base] = true;
    S.finance.reputation = clamp(S.finance.reputation + 2, 1, 100);
    S.log.unshift({ week: S.week, kind: "good", title: "🛋️ Lounge Opened", text: `Premium lounge opened at ${base}.` });
    toast(`Lounge opened at ${base}!`, "good"); persist(); render();
  }

  /* ============================================================
     RENDER: ANALYTICS
     ============================================================ */
  function renderAnalytics() {
    const routesByProfit = [...S.routes].map(r => ({ r, e: routeEconomics(r) })).filter(x => x.e).sort((a,b)=>b.e.profit - a.e.profit);
    const top = routesByProfit.slice(0, 6);
    const maxAbs = Math.max(1, ...top.map(x => Math.abs(x.e.profit)));
    const topHTML = top.length ? top.map(x => {
      const p = x.e.profit/1e6, w = Math.abs(x.e.profit)/maxAbs*100;
      return `<div class="bar-row"><div class="bar-lab">${x.r.from}→${x.r.to}</div>
        <div class="bar-track"><i class="${p>=0?'pos-bar':'neg-bar'}" style="width:${w}%"></i></div>
        <div class="bar-val ${p>=0?'pos':'neg'}">${(p>=0?'+':'')+fmtMoney(p)}</div></div>`;
    }).join("") : `<div class="muted">No routes yet.</div>`;

    // last-week cost breakdown
    const fc = fleetCosts(); const prog = programCosts(); const maint = getMaintContract(S.maintenance.contract);
    let opCost = 0, rev = 0;
    S.routes.forEach(r => { const e = routeEconomics(r); if (e){ opCost+=e.cost; rev+=e.revenue; } });
    const breakdown = [
      ["Fuel & ops", opCost/1e6], ["Maintenance", fc.maint/1e6 + S.fleet.length*maint.feePerPlane],
      ["Leases", fc.lease/1e6], ["Payroll", weeklySalaries()], ["Overhead", overheadCost()/1e6],
      ["Programs", prog.total], ["Interest", S.finance.loan*(DIFFICULTIES[S.airline.difficulty].interest/52)]
    ];
    const maxC = Math.max(1, ...breakdown.map(b => b[1]));
    const bHTML = breakdown.map(b => `<div class="bar-row"><div class="bar-lab">${b[0]}</div><div class="bar-track"><i class="neg-bar" style="width:${b[1]/maxC*100}%"></i></div><div class="bar-val">${fmtMoney(b[1])}</div></div>`).join("");

    const idle = S.fleet.filter(p=>!p.routeId).length;
    const avgCond = S.fleet.length ? Math.round(S.fleet.reduce((s,p)=>s+p.condition,0)/S.fleet.length) : 0;
    const avgLoad = S.routes.length ? Math.round(S.routes.reduce((s,r)=>s+(r.lastLoad||0),0)/S.routes.length*100) : 0;

    view.innerHTML = `
      <div class="kpi-grid">
        ${kpi("Total revenue", fmtMoney(S.stats.totalRevenue), "all-time")}
        ${kpi("Passengers", Math.round(S.stats.totalPax).toLocaleString(), "all-time")}
        ${kpi("Avg load factor", avgLoad+"%", "current routes")}
        ${kpi("Fleet utilisation", (S.fleet.length-idle)+"/"+S.fleet.length, idle+" idle")}
        ${kpi("Avg condition", avgCond+"%", "fleet health")}
        ${kpi("Revenue/week", fmtMoney(rev/1e6), "projected")}
      </div>
      <div class="panel"><h3>Most profitable routes</h3><div class="desc">Projected weekly profit per route.</div><div class="bars">${topHTML}</div></div>
      <div class="panel"><h3>Weekly cost breakdown</h3><div class="desc">Where your money goes each week.</div><div class="bars">${bHTML}</div></div>
      <div class="panel"><h3>Company valuation</h3><div class="desc">Total enterprise value over time.</div>${sparkHTML(S.valHistory.length?S.valHistory.map(h=>h.val):[companyValuation()])}</div>`;
  }

  /* ============================================================
     RENDER: MISSIONS & ACHIEVEMENTS
     ============================================================ */
  function renderMissions() {
    const mRows = MISSIONS.map(m => {
      const done = S.completedMissions.includes(m.id), cur = metric(m.type), prog = Math.min(1, cur / m.target);
      return `<div class="row-item"><div class="grow"><div class="ttl">${done?'✅':'🎯'} ${m.title} ${done?'<span class="badge" style="color:var(--good)">Done</span>':''}</div>
        <div class="meta"><span>${m.desc}</span><span>${fmtMetric(m.type,cur)} / ${fmtMetric(m.type,m.target)}</span><span>Reward <b>${m.reward.cash?fmtMoney(m.reward.cash):''}${m.reward.cash&&m.reward.rep?' + ':''}${m.reward.rep?m.reward.rep+' rep':''}</b></span></div>
        <div class="meter"><i style="width:${prog*100}%"></i></div></div></div>`;
    }).join("");
    const aRows = ACHIEVEMENTS.map(a => {
      const got = !!S.achievements[a.id];
      return `<div class="ach ${got?'got':''}"><div class="ach-ico">${a.icon}</div><div><div class="ach-ttl">${a.title}</div><div class="ach-desc">${a.desc}</div></div>${got?'<span class="badge" style="color:var(--good)">Unlocked</span>':'<span class="badge muted">Locked</span>'}</div>`;
    }).join("");
    view.innerHTML = `
      <div class="panel"><h3>Missions 🎯</h3><div class="desc">Complete objectives for cash & reputation. (${S.completedMissions.length}/${MISSIONS.length} done)</div><div class="rows">${mRows}</div></div>
      <div class="panel"><h3>Achievements 🏅</h3><div class="desc">Permanent badges. (${Object.keys(S.achievements).length}/${ACHIEVEMENTS.length} unlocked)</div><div class="ach-grid">${aRows}</div></div>`;
  }
  function fmtMetric(type, v) {
    if (type === "cash") return fmtMoney(v);
    if (type === "avgload") return Math.round(v*100)+"%";
    if (type === "share") return v.toFixed(1)+"%";
    if (type === "longhaul") return Math.round(v).toLocaleString()+" nm";
    return Math.round(v).toLocaleString();
  }

  /* ============================================================
     RENDER: FINANCE (financing, data, settings)
     ============================================================ */
  function renderFinance() {
    const f = S.finance, fc = fleetCosts();
    const overhead = overheadCost()/1e6, salaries = weeklySalaries(), prog = programCosts();
    const maint = getMaintContract(S.maintenance.contract);
    const interest = f.loan * (DIFFICULTIES[S.airline.difficulty].interest/52);
    let weeklyRev = 0, weeklyOp = 0;
    S.routes.forEach(r => { const e = routeEconomics(r); if (e){ weeklyRev+=e.revenue; weeklyOp+=e.cost; } });

    view.innerHTML = `
      <div class="kpi-grid">
        ${kpi("Cash", fmtMoney(f.cash), "", f.cash<0?"neg":"pos")}
        ${kpi("Company Value", fmtMoney(companyValuation()), "")}
        ${kpi("Loan", fmtMoney(f.loan), `Limit ${fmtMoney(loanLimit())}`)}
        ${kpi("Net / week", (f.weekProfit>=0?"+":"")+fmtMoney(f.weekProfit), "", f.weekProfit>=0?"pos":"neg")}
      </div>
      <div class="panel"><h3>Projected weekly P&amp;L</h3>
        <div class="desc">Estimate for the coming week at current settings.</div>
        <div class="rows">
          ${infoRow("✈️ Route revenue", "+"+fmtMoney(weeklyRev/1e6), "pos")}
          ${infoRow("⛽ + 👩‍✈️ Operating cost", "−"+fmtMoney(weeklyOp/1e6), "neg")}
          ${infoRow("🔧 Maintenance + plan", "−"+fmtMoney(fc.maint/1e6 + S.fleet.length*maint.feePerPlane), "neg")}
          ${infoRow("📝 Lease fees", "−"+fmtMoney(fc.lease/1e6), "neg")}
          ${infoRow("👥 Payroll", "−"+fmtMoney(salaries), "neg")}
          ${infoRow("🤝 Programs (alliance/loyalty/lounge)", "−"+fmtMoney(prog.total), "neg")}
          ${infoRow("🏢 HQ overhead", "−"+fmtMoney(overhead), "neg")}
          ${infoRow("🏦 Loan interest", "−"+fmtMoney(interest), "neg")}
        </div>
      </div>
      <div class="panel"><h3>Financing</h3>
        <div class="desc">Borrow to fund expansion (interest weekly). Repay to cut costs. Limit scales with owned fleet value.</div>
        <div class="inline-form">
          <div class="field"><label>Amount ($M)</label><input id="loanAmt" type="number" min="10" value="100"></div>
          <div class="field"><label>&nbsp;</label><button class="btn" style="width:100%" id="borrowBtn">🏦 Borrow</button></div>
          <div class="field"><label>&nbsp;</label><button class="btn ghost" style="width:100%" id="repayBtn">💳 Repay</button></div>
        </div>
      </div>
      <div class="panel"><h3>Game options & data</h3>
        <div class="desc">Random events: <b>${S.airline.eventsOn?'On':'Off'}</b>. Back up or restore your airline anytime.</div>
        <div class="bulk-bar">
          <button class="btn ghost sm" id="toggleEvents">${S.airline.eventsOn?'🔕 Disable events':'🔔 Enable events'}</button>
          <button class="btn ghost sm" id="exportBtn">⬇ Export save</button>
          <button class="btn ghost sm" id="importBtn">⬆ Import save</button>
        </div>
      </div>
      <div class="panel"><h3>Danger zone</h3>
        <div class="desc">Restart wipes this airline and returns you to setup.</div>
        <button class="btn danger" id="restartBtn">♻️ Restart Airline</button>
      </div>`;

    $("borrowBtn").onclick = () => {
      const amt = Math.max(10, parseInt($("loanAmt").value)||0), room = loanLimit() - S.finance.loan;
      if (amt > room) return toast(`Loan limit reached. Up to ${fmtMoney(room)} more.`, "bad");
      S.finance.loan += amt; S.finance.cash = +(S.finance.cash+amt).toFixed(2);
      S.log.unshift({ week:S.week, kind:"neutral", title:"🏦 Loan Taken", text:`Borrowed ${fmtMoney(amt)}.` });
      toast(`Borrowed ${fmtMoney(amt)}.`, "good"); persist(); render();
    };
    $("repayBtn").onclick = () => {
      let amt = Math.max(10, parseInt($("loanAmt").value)||0);
      amt = Math.min(amt, S.finance.loan, Math.max(0,S.finance.cash));
      if (amt <= 0) return toast("Nothing to repay, or not enough cash.", "bad");
      S.finance.loan = +(S.finance.loan-amt).toFixed(2); S.finance.cash = +(S.finance.cash-amt).toFixed(2);
      toast(`Repaid ${fmtMoney(amt)}.`, "good"); persist(); render();
    };
    $("toggleEvents").onclick = () => { S.airline.eventsOn = !S.airline.eventsOn; persist(); render(); toast(`Random events ${S.airline.eventsOn?'enabled':'disabled'}.`, "good"); };
    $("exportBtn").onclick = exportSave;
    $("importBtn").onclick = importSave;
    $("restartBtn").onclick = () => openModal("Restart airline?", "This permanently deletes your current airline and all progress. Are you sure?",
      [{label:"Cancel",ghost:true,fn:closeModal},{label:"Yes, restart",danger:true,fn:async()=>{ await AppStore.clear(user.uid); location.href="setup.html"; }}]);
  }

  /* ---- Save export / import ---- */
  function exportSave() {
    try {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `skytycoon-${S.airline.code}-wk${S.week}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Save exported.", "good");
    } catch (e) { toast("Export failed: " + e.message, "bad"); }
  }
  function importSave() {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "application/json,.json";
    inp.onchange = () => {
      const file = inp.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data || !data.airline || !data.finance) throw new Error("Not a valid SkyTycoon save.");
          migrate(data);
          AppStore.save(user.uid, data).then(() => { toast("Save imported! Reloading…", "good"); setTimeout(() => location.reload(), 700); });
        } catch (e) { toast("Import failed: " + e.message, "bad"); }
      };
      reader.readAsText(file);
    };
    inp.click();
  }

  /* ============================================================
     RENDER: RIVALS & LOG
     ============================================================ */
  function renderRivals() {
    const ranked = S.competitors.map(c => ({ ...c }));
    const playerStrength = Math.round(S.fleet.length*4 + S.routes.length*3 + S.finance.reputation*0.25 + 5);
    ranked.push({ name: S.airline.name + " (You)", hub: S.airline.hub, strength: playerStrength, cash: S.finance.cash, color: S.airline.color, isPlayer: true });
    ranked.sort((a,b) => b.strength - a.strength);
    view.innerHTML = `<div class="panel"><h3>Industry Standings</h3>
      <div class="desc">Real carriers competing for the same passengers. Your market share: <b>${S.finance.marketShare.toFixed(1)}%</b>.</div>
      ${ranked.map((c,i)=>`<div class="comp-row" style="${c.isPlayer?'border-color:'+c.color+';box-shadow:0 0 0 2px '+c.color+'55':''}">
        <div style="width:26px;text-align:center;font-weight:900;color:var(--muted)">${i+1}</div>
        <div class="comp-badge" style="background:${c.color}">${c.name[0]}</div>
        <div class="grow"><div class="ttl">${c.name}</div><div class="meta"><span>Hub ${c.hub}</span><span>Strength <b>${Math.round(c.strength)}</b></span><span>War-chest <b>${fmtMoney(c.cash)}</b></span></div></div>
      </div>`).join("")}</div>`;
  }
  function renderLog() {
    view.innerHTML = `<div class="panel"><h3>Airline News & Events</h3><div class="desc">Everything that's happened at ${S.airline.name}.</div>
      ${S.log.length ? S.log.map(logEntryHTML).join("") : `<div class="empty muted">No news yet.</div>`}</div>`;
  }

  /* ============================================================
     HTML helpers
     ============================================================ */
  function kpi(lab, val, sub, cls) { return `<div class="kpi-card"><div class="lab">${lab}</div><div class="val ${cls||''}">${val}</div><div class="sub2">${sub||''}</div></div>`; }
  function barHTML(v){ return `<div class="meter" style="margin-top:6px"><i style="width:${clamp(v,0,100)}%"></i></div>`; }
  function infoRow(label, val, cls){ return `<div class="row-item" style="padding:11px 14px"><div class="grow"><div class="ttl" style="font-weight:600;font-size:13.5px">${label}</div></div><div class="${cls||''}" style="font-weight:800;text-align:right">${val}</div></div>`; }
  function logEntryHTML(l){ return `<div class="log-entry ${l.kind||'neutral'}"><div class="wk">Wk ${l.week}</div><div><b>${l.title||''}</b> ${l.text}</div></div>`; }
  function panelEmpty(icon,title,sub,actions){ return `<div class="panel"><div class="empty"><div class="big">${icon}</div><h3 style="margin-bottom:6px">${title}</h3><p>${sub}</p><div style="margin-top:16px">${actions||''}</div></div></div>`; }
  function sparkHTML(values){
    if (!values.length) return "";
    const min = Math.min(...values, 0), max = Math.max(...values, 1), span = (max-min)||1;
    return `<div class="spark">${values.map(v=>{const h=6+((v-min)/span)*54;return `<i style="height:${h}px;${v<0?'background:linear-gradient(180deg,#f87171,rgba(248,113,113,.2))':''}"></i>`;}).join("")}</div>
      <div class="meta" style="display:flex;justify-content:space-between;color:var(--muted);font-size:12px;margin-top:6px"><span>${fmtMoney(values[0])}</span><span>now ${fmtMoney(values[values.length-1])}</span></div>`;
  }

  let toastTimer = null;
  function toast(msg, kind){ const t = $("toast"); t.textContent = msg; t.className = "show " + (kind||""); clearTimeout(toastTimer); toastTimer = setTimeout(()=> t.className = t.className.replace("show","").trim(), 3400); }

  function openModal(title, body, actions){
    $("modalTitle").innerHTML = title; $("modalBody").innerHTML = body;
    const wrap = $("modalActions"); wrap.innerHTML = "";
    actions.forEach(a=>{ const b=document.createElement("button"); b.className="btn "+(a.danger?"danger":a.ghost?"ghost":""); b.textContent=a.label; b.onclick=a.fn; wrap.appendChild(b); });
    $("modalBack").classList.add("show");
  }
  function closeModal(){ $("modalBack").classList.remove("show"); }
  $("modalBack").onclick = (e)=>{ if (e.target === $("modalBack")) closeModal(); };
  function flashEvent(entry){ if (entry.kind === "neutral") return; openModal(entry.title, entry.text + `<br><br><span class="muted">Week ${entry.week}</span>`, [{label:"Got it", fn: closeModal}]); }
  function showGameOver(){
    openModal("💀 Game Over", `${S.airline.name} has gone bankrupt after ${S.week-1} weeks.
      Final reputation ${Math.round(S.finance.reputation)} · Peak fleet ${S.fleet.length} · ${S.completedMissions.length} missions done.<br><br>Ready to try again?`,
      [{label:"View final stats", ghost:true, fn:closeModal},{label:"Start new airline", danger:true, fn:async()=>{ await AppStore.clear(user.uid); location.href="setup.html"; }}]);
    renderHUD();
  }

  /* ---- Inline onclick bridges ---- */
  window.__go = switchTab;
  window.__buy = buyAircraft;
  window.__sell = sellAircraft;
  window.__unassign = unassign;
  window.__closeRoute = closeRoute;
  window.__editRoute = editRoute;
  window.__upg = openUpgrade;
  window.__doUpg = doUpgrade;
  window.__hire = hire;
  window.__hireTo = hireToNeed;
  window.__campaign = startCampaign;
  window.__maint = setMaintContract;
  window.__joinAlliance = joinAlliance;
  window.__leaveAlliance = leaveAlliance;
  window.__loyalty = setLoyalty;
  window.__lounge = buildLounge;
})();
