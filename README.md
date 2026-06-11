# ✈️ SkyTycoon — Airline Empire Simulator
**by Arnav Game Studios**

https://arnav-dugad.github.io/Airline-company-sim/

A premium, browser-based airline tycoon game. Found a carrier, buy **real aircraft**
from real manufacturers (Airbus, Boeing, Embraer, Bombardier, ATR), open routes between
24 real airports, battle 8 real rival airlines, survive random world events, and grow a
global empire.

---

## 🚀 Quick start (play right now)

No build step, no install. Just serve the folder and open it:

```powershell
# from this folder
python -m http.server 5500
```
Then open **http://localhost:5500/index.html** in your browser.

> Opening `index.html` directly via `file://` mostly works too, but a local server is
> recommended so Google sign-in popups and module loading behave correctly.

The game ships in **Demo Mode** — accounts and saves are stored in your browser's
`localStorage`, so everything is fully playable out of the box with **no Firebase setup**.

---

## ☁️ Enabling real Firebase (optional cloud sync)

The game supports real **Firebase Authentication** (Email/Password + Google) and
**Firestore** storage. To switch from Demo Mode to live cloud sync:

1. Create a project at <https://console.firebase.google.com>.
2. Add a **Web App** and copy its config object.
3. In the Firebase console enable:
   - **Authentication → Sign-in method →** Email/Password ✔ and Google ✔
   - **Firestore Database →** Create database
4. Paste your keys into [`js/firebase-config.js`](js/firebase-config.js), replacing the
   `apiKey: "DEMO_MODE"` placeholder with your real values.

That's it — the app auto-detects real keys and switches to cloud mode. Each user's entire
airline (fleet, routes, finances, history, events) is stored under
`airlines/{uid}` in Firestore.

Suggested Firestore security rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /airlines/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## 🎮 How to play

1. **Sign in / create account** (email + password, or Google).
2. **Found your airline** — name, 2-letter code, brand colour, home hub, starting
   capital, and difficulty (Easy / Normal / Hard).
3. **Buy aircraft** — purchase outright or lease (lower upfront, weekly fees).
4. **Open routes** from your hub. Set ticket prices: lower fills seats, higher boosts yield.
5. **Advance the week** (▶) to collect profit, weather random events, and watch rivals grow.
6. Grow cash, reputation and market share — hit milestones, avoid bankruptcy!

### Game systems
- **Realistic economy:** distance-based flight frequency, load factors driven by demand,
  price elasticity, reputation, competition, seasonality and aircraft condition. Fuel,
  payroll, crew, airport fees, maintenance, leases, HQ overhead and loan interest all bite.
- **26 real aircraft** across 5 manufacturers with real range / capacity / speed / fuel
  figures and real photos, plus per-airframe **upgrades** (WiFi & IFE, premium seating, eco winglets).
- **42 real airports** and **multiple bases** — open new bases to launch routes worldwide,
  shown on a live **route map**.
- **Service classes** (Budget / Standard / Premium) per route, trading fares against load.
- **Staff & HR:** hire pilots, cabin crew, engineers and ground staff; understaffing
  throttles revenue and reputation.
- **Marketing campaigns** that boost demand & reputation, and **fuel hedging** to lock prices.
- **12 missions** with cash/reputation rewards and **10 achievement badges**.
- **14 real rival airlines** (Emirates, Delta, Singapore, Lufthansa, Qatar, United, Ryanair,
  ANA, American, Air France, British Airways, Cathay, Turkish, Qantas) that grow and contest your markets.
- **14+ random events:** fuel shocks, strikes, booms, downturns, health scares, awards,
  mechanical issues, grants, volcanic ash, viral marketing, weather and more.
- **Financing & valuation:** loans within an asset-scaled limit; track company value over time.
- **Milestones & game-over** conditions.

---

## 📁 Project structure

```
index.html        Landing page (hero, features, fleet showcase, rivals)
auth.html         Sign in / sign up (email + Google)
setup.html        New-airline setup wizard (prerequisites)
game.html         Main flight-deck dashboard
css/
  styles.css      Global premium dark theme (responsive)
  game.css        Dashboard-specific styles
js/
  data.js         Aircraft, airports, airlines, difficulty, helpers
  firebase-config.js  Firebase keys (DEMO_MODE by default)
  storage.js      Auth + save/load abstraction (Firebase OR localStorage)
  auth.js         Auth page controller
  setup.js        Setup wizard controller
  events.js       Random world-event engine
  game.js         Core game engine + dashboard UI
```

## 📱 Mobile friendly
Fully responsive — playable on phones, tablets and desktop. The HUD, tabs, market grid
and forms all adapt to small screens.

## 📝 Notes
- Aircraft images are hotlinked from **Wikimedia Commons**; every image has an automatic
  SVG fallback, so a broken link never breaks the UI.
- Airline names are used for realism and are not affiliations or endorsements.
- This is a simulation for entertainment and educational purposes.

© 2026 **Arnav Game Studios** · SkyTycoon.
