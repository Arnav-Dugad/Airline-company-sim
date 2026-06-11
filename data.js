/* ============================================================
   SkyTycoon — Game Data
   Arnav Game Studios
   Real manufacturers, real aircraft, real airlines & airports.
   Aircraft images are hotlinked from Wikimedia Commons; every
   <img> in the UI has an onerror SVG fallback so a broken link
   never breaks the game.
   ============================================================ */

const MANUFACTURERS = ["Airbus", "Boeing", "Embraer", "Bombardier", "ATR"];

/* ---- Aircraft catalogue --------------------------------------------------
   price      = list price in millions USD (approx, simplified)
   range      = nautical miles
   seats      = typical single-class capacity used by the sim
   cruise     = cruise speed in knots
   fuelBurn   = relative fuel burn factor used by the economy model
   category   = "Regional" | "Narrow-body" | "Wide-body"
--------------------------------------------------------------------------- */
const AIRCRAFT = [
  {
    id: "a220-300", maker: "Airbus", model: "A220-300", category: "Narrow-body",
    price: 91, range: 3600, seats: 150, cruise: 470, fuelBurn: 0.78,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Air_Canada_A220-300_C-GNBN_%40YYZ.jpg/960px-Air_Canada_A220-300_C-GNBN_%40YYZ.jpg",
    blurb: "Clean-sheet, fuel-sippy small narrow-body. Perfect for thin routes."
  },
  {
    id: "a320neo", maker: "Airbus", model: "A320neo", category: "Narrow-body",
    price: 110, range: 3500, seats: 180, cruise: 455, fuelBurn: 0.85,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Frontier_Airlines_Airbus_A320neo_N389FR_BWI_MD1.jpg/960px-Frontier_Airlines_Airbus_A320neo_N389FR_BWI_MD1.jpg",
    blurb: "The workhorse of modern short/medium-haul flying."
  },
  {
    id: "a321neo", maker: "Airbus", model: "A321neo", category: "Narrow-body",
    price: 129, range: 4000, seats: 220, cruise: 455, fuelBurn: 0.9,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Spirit_Airbus_A321neo_N725NK_BWI_MD1.jpg/960px-Spirit_Airbus_A321neo_N725NK_BWI_MD1.jpg",
    blurb: "Stretched, high-capacity narrow-body with transcon legs."
  },
  {
    id: "a330-900", maker: "Airbus", model: "A330-900neo", category: "Wide-body",
    price: 296, range: 7200, seats: 287, cruise: 470, fuelBurn: 1.5,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Starlux_Airlines_Airbus_A330-900_B-58301_departing_Taoyuan_February_2026.jpg/960px-Starlux_Airlines_Airbus_A330-900_B-58301_departing_Taoyuan_February_2026.jpg",
    blurb: "Efficient mid-size wide-body for long, dense routes."
  },
  {
    id: "a350-900", maker: "Airbus", model: "A350-900", category: "Wide-body",
    price: 317, range: 8100, seats: 325, cruise: 488, fuelBurn: 1.6,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/China_Eastern_Airlines_Airbus_A350-900_B-306Y_at_Schiphol_24-11-2022_%282%29.jpg/960px-China_Eastern_Airlines_Airbus_A350-900_B-306Y_at_Schiphol_24-11-2022_%282%29.jpg",
    blurb: "Carbon-composite long-haul flagship. Quiet, efficient, loved."
  },
  {
    id: "a380-800", maker: "Airbus", model: "A380-800", category: "Wide-body",
    price: 445, range: 8000, seats: 575, cruise: 490, fuelBurn: 2.7,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Emirates_Airbus_A380-861_A6-EER_MUC_2015_02.jpg/960px-Emirates_Airbus_A380-861_A6-EER_MUC_2015_02.jpg",
    blurb: "The double-decker giant. Huge capacity for mega-hub routes."
  },
  {
    id: "b737max8", maker: "Boeing", model: "737 MAX 8", category: "Narrow-body",
    price: 121, range: 3550, seats: 178, cruise: 453, fuelBurn: 0.86,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/American_Airlines_Boeing_737_MAX_8_N343RY_%40IND.jpg/960px-American_Airlines_Boeing_737_MAX_8_N343RY_%40IND.jpg",
    blurb: "Boeing's best-selling re-engined single-aisle."
  },
  {
    id: "b787-9", maker: "Boeing", model: "787-9 Dreamliner", category: "Wide-body",
    price: 292, range: 7635, seats: 296, cruise: 488, fuelBurn: 1.55,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/S2-AJX_-_Boeing_787-9_Dreamliner_-_Biman_Bangladesh_Airlines_-_60327_-_VGHS.jpg/960px-S2-AJX_-_Boeing_787-9_Dreamliner_-_Biman_Bangladesh_Airlines_-_60327_-_VGHS.jpg",
    blurb: "Composite long-hauler with great range and comfort."
  },
  {
    id: "b777-300er", maker: "Boeing", model: "777-300ER", category: "Wide-body",
    price: 375, range: 7370, seats: 396, cruise: 490, fuelBurn: 1.9,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/United_Boeing_777-300ER_N2737U_IAD_VA2.jpg/960px-United_Boeing_777-300ER_N2737U_IAD_VA2.jpg",
    blurb: "High-capacity twin for the densest long-haul markets."
  },
  {
    id: "b747-8i", maker: "Boeing", model: "747-8 Intercontinental", category: "Wide-body",
    price: 418, range: 7730, seats: 467, cruise: 493, fuelBurn: 2.5,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Boeing_747-8_Intercontinental_-_N6067E_%287987027290%29.jpg/960px-Boeing_747-8_Intercontinental_-_N6067E_%287987027290%29.jpg",
    blurb: "The Queen of the Skies, modernised. Iconic four-engine jumbo."
  },
  {
    id: "e190-e2", maker: "Embraer", model: "E190-E2", category: "Regional",
    price: 61, range: 2850, seats: 106, cruise: 448, fuelBurn: 0.62,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/%28SGP-Singapore%29_Scoot_Embraer_E190-E2_9V-THC_%40_WSSS_2025-01-01_-_2.jpg/960px-%28SGP-Singapore%29_Scoot_Embraer_E190-E2_9V-THC_%40_WSSS_2025-01-01_-_2.jpg",
    blurb: "Efficient regional jet that profitably opens thin markets."
  },
  {
    id: "e195-e2", maker: "Embraer", model: "E195-E2", category: "Regional",
    price: 70, range: 2600, seats: 132, cruise: 448, fuelBurn: 0.68,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/KLM_Cityhopper_PH-NXF_Embraer_E195-E2_Amsterdam_Airport_Schiphol_%28AMS_EHAM%29_%2852723486012%29.jpg/960px-KLM_Cityhopper_PH-NXF_Embraer_E195-E2_Amsterdam_Airport_Schiphol_%28AMS_EHAM%29_%2852723486012%29.jpg",
    blurb: "Stretched regional jet bridging to narrow-body capacity."
  },
  {
    id: "crj900", maker: "Bombardier", model: "CRJ900", category: "Regional",
    price: 48, range: 1550, seats: 90, cruise: 470, fuelBurn: 0.6,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Bombardier_CL-600-2D24_CRJ900LR_%28N548NN%2C_cn_15318%29_%284-8-2022%29.png/960px-Bombardier_CL-600-2D24_CRJ900LR_%28N548NN%2C_cn_15318%29_%284-8-2022%29.png",
    blurb: "Fast regional jet for feeder and short business routes."
  },
  {
    id: "atr72-600", maker: "ATR", model: "ATR 72-600", category: "Regional",
    price: 27, range: 825, seats: 70, cruise: 275, fuelBurn: 0.4,
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/S2-AKK_-_US-Bangla_Airlines_-_ATR_72-600_-_VGHS.jpg/960px-S2-AKK_-_US-Bangla_Airlines_-_ATR_72-600_-_VGHS.jpg",
    blurb: "Turboprop economy champion for short, low-demand hops."
  }
];

/* ---- Airports ------------------------------------------------------------
   lat/lon used for great-circle distance; demand = base market strength.
--------------------------------------------------------------------------- */
const AIRPORTS = [
  { code: "JFK", city: "New York",     country: "USA",        lat: 40.64,  lon: -73.78, demand: 98 },
  { code: "LAX", city: "Los Angeles",  country: "USA",        lat: 33.94,  lon: -118.41, demand: 95 },
  { code: "ORD", city: "Chicago",      country: "USA",        lat: 41.97,  lon: -87.90, demand: 88 },
  { code: "ATL", city: "Atlanta",      country: "USA",        lat: 33.64,  lon: -84.43, demand: 92 },
  { code: "MIA", city: "Miami",        country: "USA",        lat: 25.79,  lon: -80.29, demand: 80 },
  { code: "LHR", city: "London",       country: "UK",         lat: 51.47,  lon: -0.45,  demand: 99 },
  { code: "CDG", city: "Paris",        country: "France",     lat: 49.01,  lon: 2.55,   demand: 93 },
  { code: "FRA", city: "Frankfurt",    country: "Germany",    lat: 50.04,  lon: 8.56,   demand: 90 },
  { code: "AMS", city: "Amsterdam",    country: "Netherlands",lat: 52.31,  lon: 4.76,   demand: 85 },
  { code: "MAD", city: "Madrid",       country: "Spain",      lat: 40.49,  lon: -3.57,  demand: 78 },
  { code: "IST", city: "Istanbul",     country: "Turkey",     lat: 41.26,  lon: 28.74,  demand: 87 },
  { code: "DXB", city: "Dubai",        country: "UAE",        lat: 25.25,  lon: 55.36,  demand: 96 },
  { code: "DOH", city: "Doha",         country: "Qatar",      lat: 25.27,  lon: 51.61,  demand: 82 },
  { code: "SIN", city: "Singapore",    country: "Singapore",  lat: 1.36,   lon: 103.99, demand: 94 },
  { code: "HND", city: "Tokyo",        country: "Japan",      lat: 35.55,  lon: 139.78, demand: 91 },
  { code: "HKG", city: "Hong Kong",    country: "China",      lat: 22.31,  lon: 113.91, demand: 89 },
  { code: "PEK", city: "Beijing",      country: "China",      lat: 40.08,  lon: 116.58, demand: 90 },
  { code: "SYD", city: "Sydney",       country: "Australia",  lat: -33.94, lon: 151.18, demand: 83 },
  { code: "GRU", city: "São Paulo",    country: "Brazil",     lat: -23.43, lon: -46.47, demand: 79 },
  { code: "JNB", city: "Johannesburg", country: "S. Africa",  lat: -26.13, lon: 28.24,  demand: 70 },
  { code: "DEL", city: "Delhi",        country: "India",      lat: 28.56,  lon: 77.10,  demand: 86 },
  { code: "BOM", city: "Mumbai",       country: "India",      lat: 19.09,  lon: 72.86,  demand: 84 },
  { code: "YYZ", city: "Toronto",      country: "Canada",     lat: 43.68,  lon: -79.61, demand: 81 },
  { code: "MEX", city: "Mexico City",  country: "Mexico",     lat: 19.44,  lon: -99.07, demand: 77 }
];

/* ---- Hub options offered at setup (subset of airports) ------------------ */
const HUB_OPTIONS = ["JFK", "LAX", "LHR", "CDG", "FRA", "DXB", "SIN", "HND", "DEL", "GRU"];

/* ---- Real airline competitors ------------------------------------------- */
const COMPETITORS = [
  { name: "Emirates",          hub: "DXB", strength: 96, cash: 8200, color: "#d71921" },
  { name: "Delta Air Lines",   hub: "ATL", strength: 93, cash: 7600, color: "#003366" },
  { name: "Singapore Airlines",hub: "SIN", strength: 94, cash: 7100, color: "#f9a01b" },
  { name: "Lufthansa",         hub: "FRA", strength: 90, cash: 6800, color: "#05164d" },
  { name: "Qatar Airways",     hub: "DOH", strength: 92, cash: 6900, color: "#5c0632" },
  { name: "United Airlines",   hub: "ORD", strength: 88, cash: 6400, color: "#1414aa" },
  { name: "Ryanair",           hub: "MAD", strength: 79, cash: 4200, color: "#073590" },
  { name: "ANA",               hub: "HND", strength: 87, cash: 5600, color: "#13448f" }
];

/* ---- Difficulty presets -------------------------------------------------- */
const DIFFICULTIES = {
  easy:   { label: "Easy",   cashMult: 1.5, demandMult: 1.25, eventBad: 0.6, interest: 0.04 },
  normal: { label: "Normal", cashMult: 1.0, demandMult: 1.0,  eventBad: 1.0, interest: 0.06 },
  hard:   { label: "Hard",   cashMult: 0.7, demandMult: 0.85, eventBad: 1.4, interest: 0.09 }
};

/* ---- Starting-capital options (millions USD) ---------------------------- */
const CAPITAL_OPTIONS = [
  { label: "Lean Startup — $250M", value: 250 },
  { label: "Funded — $500M",       value: 500 },
  { label: "Well-Backed — $1B",    value: 1000 },
  { label: "Sovereign Fund — $2.5B", value: 2500 }
];

/* ---- Brand colour palette for player airline ---------------------------- */
const BRAND_COLORS = ["#2563eb","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6"];

/* ---- Helpers ------------------------------------------------------------- */
function getAirport(code) { return AIRPORTS.find(a => a.code === code); }
function getAircraft(id)  { return AIRCRAFT.find(a => a.id === id); }

/** Great-circle distance in nautical miles between two airport codes. */
function distanceNM(codeA, codeB) {
  const a = getAirport(codeA), b = getAirport(codeB);
  if (!a || !b) return 0;
  const R = 3440.065; // earth radius in NM
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** Inline SVG placeholder (data URI) used as image onerror fallback. */
function planePlaceholder(label) {
  const txt = (label || "Aircraft").replace(/&/g, "and");
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'>
       <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
         <stop offset='0' stop-color='#1e3a8a'/><stop offset='1' stop-color='#0ea5e9'/>
       </linearGradient></defs>
       <rect width='640' height='360' fill='url(#g)'/>
       <text x='50%' y='46%' fill='white' font-size='30' font-family='Arial'
             text-anchor='middle' opacity='0.95'>&#9992;&#65039;</text>
       <text x='50%' y='60%' fill='white' font-size='24' font-family='Arial'
             text-anchor='middle' font-weight='bold'>${txt}</text>
     </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/* ============================================================
   EXPANSION PACK — extra aircraft, airports, rivals & systems
   (pushed onto the base arrays so all helpers keep working)
   ============================================================ */

AIRCRAFT.push(
  { id:"a319neo", maker:"Airbus", model:"A319neo", category:"Narrow-body", price:101, range:3750, seats:140, cruise:455, fuelBurn:0.80,
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Hamburg-Finkenwerder_Airport_China_Southern_Airlines_Airbus_A319-153N_B-32LM_%28DSC09591%29.jpg/960px-Hamburg-Finkenwerder_Airport_China_Southern_Airlines_Airbus_A319-153N_B-32LM_%28DSC09591%29.jpg",
    blurb:"Smallest of the neo family — efficient on lower-demand city pairs." },
  { id:"a321xlr", maker:"Airbus", model:"A321XLR", category:"Narrow-body", price:142, range:4700, seats:200, cruise:455, fuelBurn:0.92,
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Iberia_Airbus_A321XLR_EC-OIL_IAD_VA2.jpg/960px-Iberia_Airbus_A321XLR_EC-OIL_IAD_VA2.jpg",
    blurb:"Game-changing range — open thin long-haul routes with a single aisle." },
  { id:"a350-1000", maker:"Airbus", model:"A350-1000", category:"Wide-body", price:366, range:8700, seats:410, cruise:488, fuelBurn:1.8,
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Starlux_Airbus_A350-1000_B-58551_departing_Taoyuan_February_2026_2.jpg/960px-Starlux_Airbus_A350-1000_B-58551_departing_Taoyuan_February_2026_2.jpg",
    blurb:"Stretched A350 flagship for the densest ultra-long-haul routes." },
  { id:"a330-200", maker:"Airbus", model:"A330-200", category:"Wide-body", price:238, range:7250, seats:247, cruise:470, fuelBurn:1.45,
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/China_Eastern_Airbus_A330-200_B-5952_landing_at_Shanghai_Hongqiao_May_2026.jpg/960px-China_Eastern_Airbus_A330-200_B-5952_landing_at_Shanghai_Hongqiao_May_2026.jpg",
    blurb:"Versatile mid-size twin with long legs and proven economics." },
  { id:"b787-10", maker:"Boeing", model:"787-10 Dreamliner", category:"Wide-body", price:338, range:6430, seats:336, cruise:488, fuelBurn:1.7,
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/HZ-AR24_Boeing_787-10_Saudia%2C_Manchester.jpg/960px-HZ-AR24_Boeing_787-10_Saudia%2C_Manchester.jpg",
    blurb:"Longest Dreamliner — superb seat costs on medium-long routes." },
  { id:"b737-800", maker:"Boeing", model:"737-800", category:"Narrow-body", price:106, range:2935, seats:184, cruise:450, fuelBurn:0.95,
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/United_Airlines_Boeing_737-800_N76516_departing_Boston_May_2025.jpg/960px-United_Airlines_Boeing_737-800_N76516_departing_Boston_May_2025.jpg",
    blurb:"The proven backbone of countless short/medium fleets." },
  { id:"b737-700", maker:"Boeing", model:"737-700", category:"Narrow-body", price:89, range:3010, seats:143, cruise:450, fuelBurn:0.88,
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Southwest_Boeing_737-700_N910WN_BWI_MD1.jpg/960px-Southwest_Boeing_737-700_N910WN_BWI_MD1.jpg",
    blurb:"Smaller Classic-gen 737 — reliable and cheap to acquire." },
  { id:"b767-300er", maker:"Boeing", model:"767-300ER", category:"Wide-body", price:220, range:5980, seats:261, cruise:470, fuelBurn:1.6,
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/United_Boeing_767-300_N642UA_IAD_VA1.jpg/960px-United_Boeing_767-300_N642UA_IAD_VA1.jpg",
    blurb:"Dependable widebody for transatlantic-length sectors." },
  { id:"b757-200", maker:"Boeing", model:"757-200", category:"Narrow-body", price:96, range:3915, seats:200, cruise:458, fuelBurn:1.1,
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/United_Boeing_757-200_N41135_IAD_VA1.jpg/960px-United_Boeing_757-200_N41135_IAD_VA1.jpg",
    blurb:"Powerful narrow-body — punches above its weight on long, hot routes." },
  { id:"b777-9", maker:"Boeing", model:"777-9", category:"Wide-body", price:442, range:7285, seats:426, cruise:490, fuelBurn:1.95,
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Stored_Boeing_777X_Aircraft_at_Paine_Field.jpg/960px-Stored_Boeing_777X_Aircraft_at_Paine_Field.jpg",
    blurb:"The new 777X giant — huge capacity, folding wingtips, next-gen efficiency." },
  { id:"e175", maker:"Embraer", model:"E175", category:"Regional", price:46, range:2200, seats:88, cruise:448, fuelBurn:0.58,
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/United_Express-Mesa_Embraer_E175_N82314_BWI_MD1.jpg/960px-United_Express-Mesa_Embraer_E175_N82314_BWI_MD1.jpg",
    blurb:"The go-to regional jet for feeding hubs profitably." },
  { id:"dash8-400", maker:"Bombardier", model:"Dash 8-400", category:"Regional", price:32, range:1100, seats:78, cruise:360, fuelBurn:0.42,
    img:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Austrian_Airlines_Bombardier_Dash_8_Q400_%28flight_683%29_boarding_at_Vienna_Airport%2C_Austria_%28DSC_0003%29.jpg/960px-Austrian_Airlines_Bombardier_Dash_8_Q400_%28flight_683%29_boarding_at_Vienna_Airport%2C_Austria_%28DSC_0003%29.jpg",
    blurb:"Fast turboprop — low costs on short regional hops." }
);

AIRPORTS.push(
  { code:"SFO", city:"San Francisco", country:"USA",         lat:37.62,  lon:-122.38, demand:88 },
  { code:"SEA", city:"Seattle",       country:"USA",         lat:47.45,  lon:-122.31, demand:80 },
  { code:"BOS", city:"Boston",        country:"USA",         lat:42.36,  lon:-71.01,  demand:82 },
  { code:"DFW", city:"Dallas",        country:"USA",         lat:32.90,  lon:-97.04,  demand:86 },
  { code:"DEN", city:"Denver",        country:"USA",         lat:39.86,  lon:-104.67, demand:83 },
  { code:"YVR", city:"Vancouver",     country:"Canada",      lat:49.19,  lon:-123.18, demand:76 },
  { code:"BCN", city:"Barcelona",     country:"Spain",       lat:41.30,  lon:2.08,    demand:79 },
  { code:"MUC", city:"Munich",        country:"Germany",     lat:48.35,  lon:11.79,   demand:84 },
  { code:"ZRH", city:"Zurich",        country:"Switzerland", lat:47.46,  lon:8.55,    demand:77 },
  { code:"VIE", city:"Vienna",        country:"Austria",     lat:48.11,  lon:16.57,   demand:75 },
  { code:"FCO", city:"Rome",          country:"Italy",       lat:41.80,  lon:12.25,   demand:81 },
  { code:"BKK", city:"Bangkok",       country:"Thailand",    lat:13.69,  lon:100.75,  demand:85 },
  { code:"KUL", city:"Kuala Lumpur",  country:"Malaysia",    lat:2.74,   lon:101.71,  demand:78 },
  { code:"ICN", city:"Seoul",         country:"South Korea", lat:37.46,  lon:126.44,  demand:87 },
  { code:"CGK", city:"Jakarta",       country:"Indonesia",   lat:-6.13,  lon:106.66,  demand:80 },
  { code:"EZE", city:"Buenos Aires",  country:"Argentina",   lat:-34.82, lon:-58.54,  demand:74 },
  { code:"CPT", city:"Cape Town",     country:"S. Africa",   lat:-33.97, lon:18.60,   demand:70 },
  { code:"AKL", city:"Auckland",      country:"New Zealand", lat:-37.01, lon:174.79,  demand:68 }
);

COMPETITORS.push(
  { name:"American Airlines", hub:"DFW", strength:89, cash:6600, color:"#0078d2" },
  { name:"Air France",        hub:"CDG", strength:88, cash:6200, color:"#002157" },
  { name:"British Airways",   hub:"LHR", strength:89, cash:6500, color:"#2a5cab" },
  { name:"Cathay Pacific",    hub:"HKG", strength:87, cash:5800, color:"#006564" },
  { name:"Turkish Airlines",  hub:"IST", strength:86, cash:5400, color:"#c70a0c" },
  { name:"Qantas",            hub:"SYD", strength:85, cash:5200, color:"#e40000" }
);

/* Extra hub choices unlocked at setup. */
HUB_OPTIONS.push("ATL","DFW","IST","HKG","ICN","BKK","MUC","SFO");

/* ---- Per-route service / product level ---- */
const SERVICE_LEVELS = {
  budget:   { key:"budget",   label:"Budget",   priceMult:0.82, demandMult:1.18, repDelta:-0.35, crewMult:0.85, icon:"💺", desc:"Low fares, dense cabins, no frills — fills seats fast." },
  standard: { key:"standard", label:"Standard", priceMult:1.0,  demandMult:1.0,  repDelta:0,     crewMult:1.0,  icon:"✈️", desc:"A balanced product for most travellers." },
  premium:  { key:"premium",  label:"Premium",  priceMult:1.42, demandMult:0.85, repDelta:0.5,   crewMult:1.25, icon:"🥂", desc:"Spacious cabins & top service — higher fares, fewer but loyal flyers." }
};

/* ---- One-time aircraft upgrades ---- */
const UPGRADES = {
  wifi:        { key:"wifi",        name:"WiFi & IFE",       icon:"📶", cost:4, repBoost:2, yieldMult:1.05, fuelMult:1.0,  seatMult:1.0,  desc:"Onboard wifi & entertainment. +reputation, +yield." },
  premiumseat: { key:"premiumseat", name:"Premium Seating",  icon:"🛋️", cost:7, repBoost:1, yieldMult:1.12, fuelMult:1.0,  seatMult:0.92, desc:"Lie-flat & extra legroom. +yield, slightly fewer seats." },
  ecokit:      { key:"ecokit",      name:"Eco Winglets",     icon:"🍃", cost:5, repBoost:1, yieldMult:1.0,  fuelMult:0.92, seatMult:1.0,  desc:"Aerodynamic kit. Cuts fuel burn 8%." }
};

/* ---- Staff roles. Salary & hire cost are in $M (per head). ---- */
const STAFF_ROLES = {
  pilots:    { key:"pilots",    label:"Pilots",       icon:"👨‍✈️", salary:0.0060, hire:0.020 },
  crew:      { key:"crew",      label:"Cabin Crew",   icon:"🧑‍🍳", salary:0.0028, hire:0.008 },
  engineers: { key:"engineers", label:"Engineers",    icon:"🧰",   salary:0.0042, hire:0.012 },
  ground:    { key:"ground",    label:"Ground Staff", icon:"🧳",   salary:0.0022, hire:0.006 }
};

/* ---- Marketing campaigns ---- */
const MARKETING_CAMPAIGNS = [
  { key:"local",   name:"Local Ad Spots",      icon:"📻", cost:8,  weeks:4,  rep:2,  demand:0.08, desc:"Radio & billboards around your bases." },
  { key:"digital", name:"Digital Blitz",       icon:"💻", cost:20, weeks:6,  rep:4,  demand:0.12, desc:"Targeted online & social campaign." },
  { key:"national",name:"National TV",         icon:"📺", cost:45, weeks:8,  rep:7,  demand:0.18, desc:"Prime-time brand advertising." },
  { key:"sponsor", name:"Stadium Sponsorship", icon:"🏟️", cost:90, weeks:12, rep:12, demand:0.22, desc:"Major sports sponsorship deal." }
];

/* ---- Opening a secondary base ---- */
const BASE_OPEN_COST = 75;   // $M

/* ---- Fuel hedging ---- */
const FUEL_HEDGE = { weeks:8, feePerAircraft:0.45, minFee:3 };

/* ---- Missions (sequential-ish objectives with rewards) ---- */
const MISSIONS = [
  { id:"m_fleet3",    title:"First Fleet",            desc:"Own 3 aircraft",                     type:"fleet",    target:3,       reward:{cash:15, rep:2} },
  { id:"m_routes5",   title:"Network Builder",        desc:"Operate 5 routes",                   type:"routes",   target:5,       reward:{cash:30, rep:3} },
  { id:"m_airports10",title:"Going Places",           desc:"Serve 10 different airports",        type:"airports", target:10,      reward:{cash:40, rep:3} },
  { id:"m_longhaul",  title:"Long Hauler",            desc:"Operate a route over 5,000 nm",      type:"longhaul", target:5000,    reward:{cash:35, rep:4} },
  { id:"m_load80",    title:"Packed Flights",         desc:"Reach 80% average load factor",      type:"avgload",  target:0.8,     reward:{cash:30, rep:5} },
  { id:"m_rep75",     title:"Crowd Favourite",        desc:"Reach 75 reputation",                type:"rep",      target:75,      reward:{cash:25, rep:0} },
  { id:"m_cash1b",    title:"Billion-Dollar Airline", desc:"Hold $1B in cash",                   type:"cash",     target:1000,    reward:{cash:0,  rep:6} },
  { id:"m_bases3",    title:"Multi-Hub Carrier",      desc:"Operate from 3 bases",               type:"bases",    target:3,       reward:{cash:50, rep:3} },
  { id:"m_fleet15",   title:"Mega Fleet",             desc:"Own 15 aircraft",                    type:"fleet",    target:15,      reward:{cash:80, rep:4} },
  { id:"m_pax1m",     title:"A Million Served",       desc:"Carry 1,000,000 passengers total",   type:"pax",      target:1000000, reward:{cash:60, rep:5} },
  { id:"m_share20",   title:"Market Force",           desc:"Reach 20% market share",             type:"share",    target:20,      reward:{cash:70, rep:5} },
  { id:"m_routes15",  title:"Spread Your Wings",      desc:"Operate 15 routes",                  type:"routes",   target:15,      reward:{cash:90, rep:4} }
];

/* ---- Achievements (permanent badges) ---- */
const ACHIEVEMENTS = [
  { id:"a_first",   icon:"🛫", title:"Wheels Up",       desc:"Open your first route",          type:"routes",    target:1 },
  { id:"a_intl",    icon:"🌍", title:"Globetrotter",    desc:"Serve 20 airports",              type:"airports",  target:20 },
  { id:"a_jumbo",   icon:"🐘", title:"Jumbo Operator",  desc:"Own an A380 or 747",             type:"ownjumbo",  target:1 },
  { id:"a_fleet20", icon:"✈️", title:"Air Force",       desc:"Own 20 aircraft",                type:"fleet",     target:20 },
  { id:"a_rep90",   icon:"⭐", title:"Five-Star Airline",desc:"Reach 90 reputation",            type:"rep",       target:90 },
  { id:"a_cash5b",  icon:"💎", title:"Aviation Mogul",  desc:"Hold $5B in cash",               type:"cash",      target:5000 },
  { id:"a_share30", icon:"👑", title:"Sky King",        desc:"Reach 30% market share",         type:"share",     target:30 },
  { id:"a_year",    icon:"📅", title:"Survivor",        desc:"Operate for 52 weeks",           type:"weeks",     target:52 },
  { id:"a_mkt",     icon:"📣", title:"Hype Machine",    desc:"Run a marketing campaign",       type:"flagMkt",   target:1 },
  { id:"a_upg",     icon:"🔧", title:"Cabin Upgrade",   desc:"Upgrade an aircraft",            type:"flagUpg",   target:1 }
];

/* Seasonality: demand multiplier by week-of-year (summer & holiday peaks). */
function seasonFactor(week) {
  const w = ((week - 1) % 52) + 1;
  const summer = Math.exp(-Math.pow((w - 30) / 9, 2)) * 0.18;   // peak ~ wk 30
  const holiday = Math.exp(-Math.pow((w - 51) / 3, 2)) * 0.14;  // year-end
  const spring = Math.exp(-Math.pow((w - 14) / 6, 2)) * 0.06;
  const winterLow = -0.08 * Math.exp(-Math.pow((w - 6) / 5, 2));
  return +(1 + summer + holiday + spring + winterLow).toFixed(3);
}
function seasonLabel(week) {
  const w = ((week - 1) % 52) + 1;
  if (w >= 24 && w <= 36) return "Summer Peak ☀️";
  if (w >= 48 || w <= 2)  return "Holiday Rush 🎄";
  if (w >= 10 && w <= 18) return "Spring Break 🌷";
  if (w >= 3 && w <= 9)   return "Winter Lull ❄️";
  return "Shoulder Season 🍂";
}

function getServiceLevel(k){ return SERVICE_LEVELS[k] || SERVICE_LEVELS.standard; }
function getUpgrade(k){ return UPGRADES[k]; }

/* ============================================================
   EXPANSION PACK 2 — auto-maintenance, alliances, loyalty,
   lounges, bulk-buy economics & quality-of-life systems
   ============================================================ */

/* ---- Auto-maintenance contracts ---- */
const MAINT_CONTRACTS = {
  none:    { key:"none",    label:"In-House",      feePerPlane:0,    wearMult:1.0,  autoFloor:0,  topTo:0,  repairDisc:1.0,  icon:"🔧",
             desc:"No contract — repair aircraft manually in the Fleet tab." },
  basic:   { key:"basic",   label:"Basic Care",    feePerPlane:0.05, wearMult:0.9,  autoFloor:60, topTo:85, repairDisc:0.85, icon:"🛠️",
             desc:"Auto-repairs any aircraft below 60% back to 85%. Slows wear 10%. (Discounted parts.)" },
  premium: { key:"premium", label:"Premium Care",  feePerPlane:0.12, wearMult:0.65, autoFloor:90, topTo:98, repairDisc:0.70, icon:"💠",
             desc:"Keeps the whole fleet near-new (98%) automatically and slows wear 35%. (Best rates.)" }
};

/* ---- Strategic alliances ---- */
const ALLIANCES = [
  { key:"skyalliance", name:"SkyAlliance",  icon:"🤝", dues:3, demand:0.06,  rep:4, desc:"Global codeshare web. +6% demand and a reputation halo." },
  { key:"starnetwork", name:"StarNetwork",  icon:"⭐", dues:5, demand:0.09,  rep:6, desc:"The largest alliance. +9% demand, strong brand lift." },
  { key:"onesky",      name:"OneSky",       icon:"🌐", dues:4, demand:0.075, rep:5, desc:"Premium-focused partners. +7.5% demand worldwide." }
];

/* ---- Frequent-flyer loyalty tiers ---- */
const LOYALTY_TIERS = {
  none:     { key:"none",     label:"None",     demand:0,    repWk:0,   base:0,   perRoute:0 },
  silver:   { key:"silver",   label:"Silver",   demand:0.04, repWk:0.3, base:0.3, perRoute:0.05 },
  gold:     { key:"gold",     label:"Gold",     demand:0.08, repWk:0.5, base:0.8, perRoute:0.09 },
  platinum: { key:"platinum", label:"Platinum", demand:0.12, repWk:0.8, base:1.5, perRoute:0.15 }
};

/* ---- Airport lounges (per base) ---- */
const LOUNGE = { cost:25, weeklyFee:0.4, demand:0.06, rep:0.15 };

/* ---- Bulk purchase volume discount ---- */
function volumeDiscount(qty){
  if (qty >= 10) return 0.06;
  if (qty >= 5)  return 0.03;
  if (qty >= 3)  return 0.015;
  return 0;
}

function getMaintContract(k){ return MAINT_CONTRACTS[k] || MAINT_CONTRACTS.none; }
function getLoyalty(k){ return LOYALTY_TIERS[k] || LOYALTY_TIERS.none; }
function getAlliance(k){ return ALLIANCES.find(a => a.key === k) || null; }
