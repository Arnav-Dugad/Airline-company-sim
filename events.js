/* ============================================================
   Random world events. Each event mutates the game state on
   trigger and returns a log entry {text, kind}.
   `kind`: good | bad | neutral.  `bad` events are scaled by the
   chosen difficulty's eventBad multiplier.
   ============================================================ */

const EVENTS = [
  {
    id: "fuel_spike", weight: 14, bad: true, title: "⛽ Fuel Price Spike",
    apply(s, sev) {
      const pct = 18 + Math.round(20 * sev);
      s.fuelPrice = +(s.fuelPrice * (1 + pct / 100)).toFixed(2);
      return { kind: "bad", text: `Oil markets jump — jet fuel up ${pct}%. Margins are squeezed.` };
    }
  },
  {
    id: "fuel_drop", weight: 10, bad: false, title: "⛽ Fuel Prices Ease",
    apply(s) {
      const pct = 10 + Math.round(Math.random() * 12);
      s.fuelPrice = +(Math.max(3, s.fuelPrice * (1 - pct / 100))).toFixed(2);
      return { kind: "good", text: `Oil glut! Jet fuel falls ${pct}%. Everyone breathes easier.` };
    }
  },
  {
    id: "strike", weight: 8, bad: true, title: "✊ Crew Strike",
    apply(s, sev) {
      const hit = Math.round((6 + 10 * sev) * (1 + s.fleet.length * 0.04) * 10) / 10;
      s.finance.cash -= hit;
      s.finance.reputation = Math.max(0, s.finance.reputation - Math.round(4 + 6 * sev));
      return { kind: "bad", text: `Cabin crew walkout grounds flights. Lost ${fmtMoney(hit)} and reputation dipped.` };
    }
  },
  {
    id: "boom", weight: 11, bad: false, title: "📈 Economic Boom",
    apply(s) {
      s.tempDemandBoost = 0.12;
      return { kind: "good", text: `Travel demand surges in a booming economy — load factors up this week!` };
    }
  },
  {
    id: "recession", weight: 9, bad: true, title: "📉 Economic Downturn",
    apply(s, sev) {
      s.tempDemandBoost = -(0.1 + 0.08 * sev);
      return { kind: "bad", text: `A downturn cools travel demand. Expect weaker bookings this week.` };
    }
  },
  {
    id: "outbreak", weight: 6, bad: true, title: "🦠 Health Scare",
    apply(s, sev) {
      s.tempDemandBoost = -(0.2 + 0.15 * sev);
      s.finance.reputation = Math.max(0, s.finance.reputation - 2);
      return { kind: "bad", text: `A regional health scare hammers bookings. Demand drops sharply this week.` };
    }
  },
  {
    id: "award", weight: 8, bad: false, title: "🏆 Industry Award",
    apply(s) {
      s.finance.reputation = Math.min(100, s.finance.reputation + 6);
      return { kind: "good", text: `${s.airline.name} wins a Best Airline award! Reputation +6.` };
    }
  },
  {
    id: "mech", weight: 9, bad: true, title: "🔧 Mechanical Issue",
    apply(s, sev) {
      if (!s.fleet.length) return { kind: "neutral", text: "A maintenance bulletin is issued industry-wide. No fleet affected." };
      const p = s.fleet[Math.floor(Math.random() * s.fleet.length)];
      const ac = getAircraft(p.aircraftId);
      const cost = Math.round(ac.price * (0.01 + 0.015 * sev) * 10) / 10;
      s.finance.cash -= cost;
      p.condition = Math.max(40, p.condition - 15);
      return { kind: "bad", text: `${p.tail} (${ac.model}) needs unscheduled repairs — ${fmtMoney(cost)}.` };
    }
  },
  {
    id: "grant", weight: 6, bad: false, title: "🏛️ Government Grant",
    apply(s) {
      const amt = Math.round((8 + Math.random() * 22) * 10) / 10;
      s.finance.cash += amt;
      return { kind: "good", text: `Aviation development grant approved: +${fmtMoney(amt)} to your treasury.` };
    }
  },
  {
    id: "volcano", weight: 4, bad: true, title: "🌋 Volcanic Ash Cloud",
    apply(s, sev) {
      const hit = Math.round((10 + 18 * sev) * (1 + s.routes.length * 0.05) * 10) / 10;
      s.finance.cash -= hit;
      return { kind: "bad", text: `Ash cloud closes airspace. Cancellations cost ${fmtMoney(hit)}.` };
    }
  },
  {
    id: "viral", weight: 7, bad: false, title: "📱 Viral Marketing Hit",
    apply(s) {
      s.finance.reputation = Math.min(100, s.finance.reputation + 5);
      s.tempDemandBoost = (s.tempDemandBoost || 0) + 0.08;
      return { kind: "good", text: `Your safety video goes viral! Reputation +5 and a demand bump this week.` };
    }
  },
  {
    id: "weather", weight: 8, bad: true, title: "🌪️ Severe Weather",
    apply(s, sev) {
      const hit = Math.round((4 + 9 * sev) * (1 + s.routes.length * 0.04) * 10) / 10;
      s.finance.cash -= hit;
      return { kind: "bad", text: `Storms force diversions and delays — ${fmtMoney(hit)} in extra costs.` };
    }
  },
  {
    id: "loyalty", weight: 7, bad: false, title: "💳 Loyalty Program Surge",
    apply(s) {
      const amt = Math.round((3 + Math.random() * 9) * 10) / 10;
      s.finance.cash += amt;
      s.finance.reputation = Math.min(100, s.finance.reputation + 2);
      return { kind: "good", text: `Frequent-flyer sign-ups spike: +${fmtMoney(amt)} and a small reputation lift.` };
    }
  },
  {
    id: "fee", weight: 6, bad: true, title: "🛂 New Airport Fees",
    apply(s, sev) {
      const amt = Math.round((2 + 6 * sev) * (1 + s.routes.length * 0.06) * 10) / 10;
      s.finance.cash -= amt;
      return { kind: "bad", text: `Airports hike landing fees. Operating costs up ${fmtMoney(amt)} this week.` };
    }
  }
];

/* Pick & apply a weighted random event. Returns a log entry or null. */
function rollEvent(state) {
  if (!state.airline.eventsOn) return null;
  // ~55% chance of an event each week so it stays lively but not chaotic.
  if (Math.random() > 0.55) return null;

  const diff = DIFFICULTIES[state.airline.difficulty];
  const total = EVENTS.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total, chosen = EVENTS[0];
  for (const e of EVENTS) { if ((r -= e.weight) <= 0) { chosen = e; break; } }

  const severity = chosen.bad ? Math.min(1.6, Math.random() * diff.eventBad) : Math.random();
  const entry = chosen.apply(state, severity);
  entry.week = state.week;
  entry.title = chosen.title;
  return entry;
}
