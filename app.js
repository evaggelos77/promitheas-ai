/* ============================================================
   ΠΡΟΜΗΘΕΑΣ AI — Αρχηγείο Πρόληψης Φωτιάς
   EV LABS AI · ζωντανά δεδομένα (Open-Meteo) + δείκτης κινδύνου
   ============================================================ */

// ---- Ρυθμίσεις ----
// Δωρεάν κλειδί χάρτη NASA FIRMS (ενεργές εστίες) από: https://firms.modaps.eosdis.nasa.gov/api/area/
// Όταν τρέχει το backend, οι εστίες έρχονται από εκεί (κλειδί κρυφό). Σε ΣΤΑΤΙΚΗ φιλοξενία
// (π.χ. github.io, χωρίς backend) χρησιμοποιείται αυτό απευθείας από τον browser — το FIRMS API
// επιτρέπει CORS. Είναι δωρεάν, read-only, με όριο χρήσης· αν χρειαστεί ανανεώνεται από το FIRMS.
const FIRMS_MAP_KEY = '24a891b2d51dda2d8456ed44852f7048';
const REFRESH_MS = 15 * 60 * 1000; // αυτόματη ανανέωση κάθε 15'

// ---- Περιοχές Ελλάδας (αντιπροσωπευτικά σημεία) ----
const REGIONS = [
  // Αττική & γύρω
  {n:'Αθήνα',lat:37.98,lon:23.73},{n:'Πειραιάς',lat:37.94,lon:23.65},
  {n:'Μαραθώνας',lat:38.15,lon:23.96},{n:'Μέγαρα',lat:38.00,lon:23.34},
  // Στερεά Ελλάδα & Εύβοια
  {n:'Χαλκίδα (Εύβοια)',lat:38.46,lon:23.60},{n:'Κάρυστος (Εύβοια)',lat:38.02,lon:24.42},
  {n:'Θήβα',lat:38.32,lon:23.32},{n:'Λιβαδειά',lat:38.43,lon:22.87},
  {n:'Λαμία',lat:38.90,lon:22.43},{n:'Άμφισσα',lat:38.53,lon:22.38},
  // Πελοπόννησος
  {n:'Κόρινθος',lat:37.94,lon:22.93},{n:'Ναύπλιο (Αργολίδα)',lat:37.57,lon:22.81},
  {n:'Τρίπολη (Αρκαδία)',lat:37.51,lon:22.38},{n:'Σπάρτη (Λακωνία)',lat:37.07,lon:22.43},
  {n:'Καλαμάτα (Μεσσηνία)',lat:37.04,lon:22.11},{n:'Πύργος (Ηλεία)',lat:37.67,lon:21.44},
  // Δυτική Ελλάδα
  {n:'Πάτρα',lat:38.25,lon:21.74},{n:'Αγρίνιο',lat:38.62,lon:21.41},
  {n:'Μεσολόγγι',lat:38.37,lon:21.43},{n:'Ναύπακτος',lat:38.39,lon:21.83},
  // Ήπειρος
  {n:'Ιωάννινα',lat:39.67,lon:20.85},{n:'Άρτα',lat:39.16,lon:20.99},
  {n:'Πρέβεζα',lat:38.96,lon:20.75},{n:'Ηγουμενίτσα',lat:39.50,lon:20.27},
  // Θεσσαλία
  {n:'Λάρισα',lat:39.64,lon:22.42},{n:'Βόλος (Μαγνησία)',lat:39.36,lon:22.95},
  {n:'Τρίκαλα',lat:39.56,lon:21.77},{n:'Καρδίτσα',lat:39.36,lon:21.92},
  // Δυτική Μακεδονία
  {n:'Κοζάνη',lat:40.30,lon:21.79},{n:'Καστοριά',lat:40.52,lon:21.27},
  {n:'Φλώρινα',lat:40.78,lon:21.41},{n:'Γρεβενά',lat:40.08,lon:21.43},
  // Κεντρική Μακεδονία
  {n:'Θεσσαλονίκη',lat:40.64,lon:22.94},{n:'Σέρρες',lat:41.09,lon:23.55},
  {n:'Κιλκίς',lat:40.99,lon:22.87},{n:'Βέροια (Ημαθία)',lat:40.52,lon:22.20},
  {n:'Κατερίνη (Πιερία)',lat:40.27,lon:22.50},{n:'Χαλκιδική',lat:40.32,lon:23.43},
  // Ανατολική Μακεδονία & Θράκη
  {n:'Καβάλα',lat:40.94,lon:24.41},{n:'Δράμα',lat:41.15,lon:24.15},
  {n:'Ξάνθη',lat:41.13,lon:24.88},{n:'Κομοτηνή',lat:41.12,lon:25.40},
  {n:'Αλεξανδρούπολη (Έβρος)',lat:40.85,lon:25.87},
  // Ιόνια Νησιά
  {n:'Κέρκυρα',lat:39.62,lon:19.92},{n:'Λευκάδα',lat:38.83,lon:20.71},
  {n:'Κεφαλονιά',lat:38.18,lon:20.49},{n:'Ζάκυνθος',lat:37.79,lon:20.90},
  // Κρήτη
  {n:'Ηράκλειο',lat:35.34,lon:25.13},{n:'Χανιά',lat:35.51,lon:24.02},
  {n:'Ρέθυμνο',lat:35.37,lon:24.47},{n:'Άγιος Νικόλαος (Λασίθι)',lat:35.19,lon:25.72},
  // Βόρειο Αιγαίο
  {n:'Μυτιλήνη (Λέσβος)',lat:39.11,lon:26.55},{n:'Χίος',lat:38.37,lon:26.14},
  {n:'Σάμος',lat:37.75,lon:26.98},{n:'Λήμνος',lat:39.92,lon:25.07},{n:'Ικαρία',lat:37.61,lon:26.17},
  // Νότιο Αιγαίο (Κυκλάδες & Δωδεκάνησα)
  {n:'Σύρος',lat:37.44,lon:24.94},{n:'Νάξος',lat:37.10,lon:25.38},{n:'Πάρος',lat:37.08,lon:25.15},
  {n:'Μύκονος',lat:37.45,lon:25.33},{n:'Σαντορίνη',lat:36.39,lon:25.46},{n:'Μήλος',lat:36.74,lon:24.43},
  {n:'Ρόδος',lat:36.43,lon:28.22},{n:'Κως',lat:36.89,lon:27.29},{n:'Κάρπαθος',lat:35.51,lon:27.21},
  // Σποράδες
  {n:'Σκιάθος',lat:39.16,lon:23.49},{n:'Σκόπελος',lat:39.12,lon:23.73}
];

const CAT = [
  {min:0,  label:'Χαμηλός',      color:'#2ec36b'},
  {min:20, label:'Μέτριος',      color:'#ffd23f'},
  {min:40, label:'Υψηλός',       color:'#ff9f1c'},
  {min:60, label:'Πολύ υψηλός',  color:'#ff3b30'},
  {min:80, label:'Συναγερμός',   color:'#b026ff'}
];
const COMPASS = ['Β','ΒΑ','Α','ΝΑ','Ν','ΝΔ','Δ','ΒΔ'];

const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const compass = deg => COMPASS[Math.round(((deg%360)/45))%8];
function categoryOf(score){ let i=0; for(let k=0;k<CAT.length;k++){ if(score>=CAT[k].min) i=k; } return {idx:i+1, ...CAT[i]}; }
const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
// Σημείο ~d χλμ. μακριά, σε αζιμούθιο brng (μοίρες) — για πλοήγηση διαφυγής
function destinationPoint(lat,lon,brng,d){
  const R=6371, br=brng*Math.PI/180, la=lat*Math.PI/180, lo=lon*Math.PI/180;
  const la2=Math.asin(Math.sin(la)*Math.cos(d/R)+Math.cos(la)*Math.sin(d/R)*Math.cos(br));
  const lo2=lo+Math.atan2(Math.sin(br)*Math.sin(d/R)*Math.cos(la), Math.cos(d/R)-Math.sin(la)*Math.sin(la2));
  return {lat:la2*180/Math.PI, lon:((lo2*180/Math.PI)+540)%360-180};
}
// Απόσταση μεγάλου κύκλου (χλμ)
function distKm(la1,lo1,la2,lo2){
  const R=6371, t=x=>x*Math.PI/180;
  const dla=t(la2-la1), dlo=t(lo2-lo1);
  const a=Math.sin(dla/2)**2 + Math.cos(t(la1))*Math.cos(t(la2))*Math.sin(dlo/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

// ---- Υπολογισμός δείκτη κινδύνου (0-100) από ζωντανό καιρό ----
// ΚΥΡΙΟ: trained ML μοντέλο (gradient-boosting στο επιστημονικό Fire Weather Index / EFFIS),
// βλ. fire_model.js. Πιάνει μη-γραμμικές αλληλεπιδράσεις (άνεμος × ξηρασία × θερμοκρασία).
function fireRisk({temp,hum,wind,rain3}){
  if (typeof window.fireRiskML === 'function') {
    const v = window.fireRiskML(temp, hum, wind, rain3);
    if (v != null && !isNaN(v)) return v;
  }
  // Fallback: απλή γραμμική ευρετική (αν δεν φορτώθηκε το μοντέλο)
  const t = clamp((temp-22)/16, 0,1);
  const h = clamp((45-hum)/35, 0,1);
  const w = clamp((wind-10)/45, 0,1);
  const d = clamp((8-rain3)/8, 0,1);
  return Math.round(100*(0.28*t + 0.24*h + 0.30*w + 0.18*d));
}

// ---- Χάρτης ----
let map, markersLayer, reportsLayer, userMarker;
let LAST_POINTS = [];
function initMap(){
  map = L.map('map',{zoomControl:true, attributionControl:true}).setView([38.5,24.2],6);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
    subdomains:'abcd', maxZoom:18,
    attribution:'&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  reportsLayer = L.layerGroup().addTo(map);
}

// ---- Λήψη ζωντανών δεδομένων για όλες τις περιοχές (1 κλήση) ----
async function fetchAll(){
  const lats = REGIONS.map(r=>r.lat).join(',');
  const lons = REGIONS.map(r=>r.lon).join(',');
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}`
    + `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m`
    + `&daily=temperature_2m_max,wind_speed_10m_max,wind_direction_10m_dominant,precipitation_sum`
    + `&past_days=3&forecast_days=7&timezone=auto&wind_speed_unit=kmh`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('weather '+res.status);
  let data = await res.json();
  if(!Array.isArray(data)) data = [data];
  return data.map((d,i)=>parsePoint(d, REGIONS[i]));
}

function parsePoint(d, region){
  const cur = d.current||{};
  const dly = d.daily||{};
  const T=dly.temperature_2m_max||[], W=dly.wind_speed_10m_max||[],
        WD=dly.wind_direction_10m_dominant||[], P=dly.precipitation_sum||[], times=dly.time||[];
  const humNow = cur.relative_humidity_2m ?? 40;
  const PAST = 3; // past_days στο API
  const start = Math.min(PAST, Math.max(0, times.length-1)); // δείκτης «σήμερα»
  const dayRisk = (i)=>{
    const temp = T[i] ?? cur.temperature_2m ?? 25;
    const wind = W[i] ?? cur.wind_speed_10m ?? 10;
    const rain3 = P.slice(Math.max(0,i-2), i+1).reduce((a,b)=>a+(b||0),0); // κυλιόμενη ξηρασία
    return fireRisk({temp, hum:humNow, wind, rain3});
  };
  const forecast=[];
  for(let i=start; i<times.length && forecast.length<7; i++){
    const s=dayRisk(i);
    forecast.push({date:times[i]||'', score:s, cat:categoryOf(s), temp:Math.round(T[i]??0), wind:Math.round(W[i]??0)});
  }
  const t0 = forecast[0] || {score:0, cat:categoryOf(0), temp:Math.round(cur.temperature_2m??25), wind:Math.round(cur.wind_speed_10m??10)};
  const wdir = cur.wind_direction_10m ?? WD[start] ?? 0;
  return {...region, temp:t0.temp, hum:Math.round(humNow), wind:t0.wind, wdir,
          score:t0.score, cat:t0.cat, forecast};
}

// ---- Render: χάρτης + λίστα + εθνικός + Προμηθέας ----
function render(points){
  markersLayer.clearLayers();
  points.forEach(p=>{
    const r = 11 + p.cat.idx*3;
    L.circleMarker([p.lat,p.lon],{
      radius:r, color:'#000', weight:1, opacity:.4,
      fillColor:p.cat.color, fillOpacity:.78
    }).addTo(markersLayer).bindPopup(
      `<b>${p.n}</b><br>Κίνδυνος σήμερα: <b style="color:${p.cat.color}">${p.cat.idx} · ${p.cat.label}</b> (${p.score}/100)`
      +`<br>🌡️ ${p.temp}°C · 💧 ${p.hum}% · 💨 ${p.wind} χλμ/η ${compass(p.wdir)}`
      +`<br><span style="opacity:.7">Πρόβλεψη 5ημ.:</span> ${fcMini(p)}`
    );
  });

  const sorted = [...points].sort((a,b)=>b.score-a.score);

  // Εθνικός κίνδυνος = υψηλότερη κατηγορία
  const top = sorted[0];
  const nv = document.getElementById('natRiskValue');
  nv.textContent = `${top.cat.idx} · ${top.cat.label}`;
  nv.style.color = top.cat.color;
  document.getElementById('natRisk').style.boxShadow = `0 0 24px ${top.cat.color}55`;

  LAST_POINTS = sorted;
  updateAIEngines(sorted, top);
  renderList(sorted.slice(0,8));
  setStatusStrip(top);
  renderForecast(sorted);
  const ut=document.getElementById('updTime'); if(ut) ut.textContent='ανανέωση '+new Date().toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'});
  promitheasSay(sorted);
}

// ---- Μηχανές AI: βαρόμετρα ζωντανής κατάστασης (αληθινά μετρικά) ----
function setGauge(score, cat){
  score = Math.max(0, Math.min(100, Math.round(score||0)));
  const th = (180 - (score/100)*180) * Math.PI/180;
  const n = document.getElementById('gaugeNeedle');
  if(n){ n.setAttribute('x2', (100+74*Math.cos(th)).toFixed(1)); n.setAttribute('y2', (102-74*Math.sin(th)).toFixed(1)); if(cat) n.style.stroke = cat.color; }
  const v = document.getElementById('gaugeVal'); if(v){ v.textContent = score; if(cat) v.style.color = cat.color; }
  const c = document.getElementById('gaugeCat'); if(c && cat){ c.textContent = cat.idx+' · '+cat.label; c.style.color = cat.color; }
}
function updateAIEngines(points, top){
  if(top && top.cat) setGauge(top.score, top.cat);
  const n = (points||[]).length;
  const trees = (window.PROMETHEAS_FIRE_MODEL && window.PROMETHEAS_FIRE_MODEL.trees) ? window.PROMETHEAS_FIRE_MODEL.trees.length : 0;
  const mML = document.getElementById('mML'); if(mML) mML.textContent = (trees? trees+' δέντρα · ' : '') + n + ' περιοχές';
  const dML = document.getElementById('dML'); if(dML) dML.className = 'meter ' + (trees? 'on':'warn');
  const mMeteo = document.getElementById('mMeteo');
  if(mMeteo) mMeteo.textContent = n + ' περιοχές · ' + new Date().toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'});
}
async function checkAIBrain(){
  const d = document.getElementById('dGPT'), m = document.getElementById('mGPT');
  try{
    const h = await (await fetch('api/health')).json();
    const on = !!(h && h.ai && h.ai.powered);
    if(d) d.className = 'meter ' + (on? 'on':'warn');
    if(m){ m.textContent = on ? 'ενεργός · συνδεδεμένος' : 'τοπική προβολή'; m.className = 'engMeta'+(on?' live':''); }
  }catch(e){ if(d) d.className='engDot warn'; if(m) m.textContent='τοπική προβολή'; }
}

// ---- Λίστα περιοχών + αναζήτηση δήμου ----
function renderList(rows){
  const list = document.getElementById('regionList');
  list.innerHTML = '';
  if(!rows.length){ list.innerHTML = '<p class="muted">Δεν βρέθηκε περιοχή — δοκίμασε άλλο όνομα.</p>'; return; }
  rows.forEach(p=>{
    const row = document.createElement('div');
    row.className='regRow';
    row.innerHTML = `<span class="regBadge" style="background:${p.cat.color}">${p.cat.idx}</span>
      <div><div class="regName">${p.n}</div><div class="regMeta">${p.cat.label} · ${p.score}/100</div></div>
      <div class="regRight"><div class="regName">${p.temp}°C</div><div class="regMeta">💨 ${p.wind} ${compass(p.wdir)}</div></div>`;
    row.onclick = ()=>{ map.setView([p.lat,p.lon],9); };
    list.appendChild(row);
  });
}
function searchRegions(q){
  q = norm(q);
  if(!q){ renderList(LAST_POINTS.slice(0,8)); return; }
  const matches = LAST_POINTS.filter(p=>norm(p.n).includes(q));
  renderList(matches.slice(0,12));
  if(matches[0]) map.setView([matches[0].lat,matches[0].lon],9);
}
// ---- Εθνική «μπάρα κατάστασης» (απλά λόγια) ----
function setStatusStrip(top){
  const strip = document.getElementById('statusStrip'); if(!strip) return;
  const advice = top.cat.idx>=4 ? 'Απόφυγε κάθε υπαίθρια φωτιά. Να είσαι έτοιμος/η για εκκένωση.'
              : top.cat.idx===3 ? 'Μην ανάβεις φωτιά ή ψησταριά. Πρόσεχε σπινθήρες — δες την περιοχή σου.'
              : 'Ήπιες συνθήκες σήμερα — αλλά πάντα προσοχή με φωτιά στην ύπαιθρο.';
  strip.style.background = top.cat.color;
  strip.style.color = top.cat.idx===2 ? '#1a1200' : '#fff';
  strip.innerHTML = `<b>ΣΗΜΕΡΑ ΣΤΗΝ ΕΛΛΑΔΑ · Κίνδυνος ${top.cat.idx}/5 — ${top.cat.label}</b><span>${advice}</span>`;
}

// ---- Πρόβλεψη κινδύνου (έως 7 ημέρες, από πρόγνωση καιρού) ----
const fcMini = p => (p.forecast||[]).slice(0,5).map(f=>
  `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${f.cat.color};margin:0 1px" title="${f.cat.label} (${f.score})"></span>`).join('') || '—';
function renderForecast(points){
  const el=document.getElementById('natForecast'); if(!el) return;
  if(!points.length || !points[0].forecast || !points[0].forecast.length){ el.innerHTML='<span class="muted">—</span>'; return; }
  const days=Math.min(5, points[0].forecast.length);
  let html='';
  for(let d=0; d<days; d++){
    // Εθνικός ΜΕΣΟΣ δείκτης ανά ημέρα (όχι η χειρότερη περιοχή — αλλιώς πάντα κόκκινο/πανικός)
    let sum=0, cnt=0;
    points.forEach(p=>{ const f=p.forecast[d]; if(f){ sum+=f.score; cnt++; } });
    const avg=cnt?Math.round(sum/cnt):0;
    const cat=categoryOf(avg);
    const dt=new Date(points[0].forecast[d].date);
    const lbl = d===0?'Σήμ.' : d===1?'Αύρ.' : dt.toLocaleDateString('el-GR',{weekday:'short'}).replace('.','');
    html+=`<div class="fcDay"><span class="fcLbl">${lbl}</span><span class="fcDot" style="background:${cat.color}">${cat.idx}</span><span class="fcScore">${avg}/100</span></div>`;
  }
  el.innerHTML=html;
}

// ---- Ο ΠΡΟΜΗΘΕΑΣ μιλάει (data-driven· έτοιμο για σύνδεση με OpenAI) ----
function promitheasSay(sorted){
  const top = sorted[0];
  const high = sorted.filter(p=>p.cat.idx>=3);
  const windy = sorted.filter(p=>p.wind>=40).sort((a,b)=>b.wind-a.wind);
  let msg = `🔥 Εθνικός κίνδυνος σήμερα: ${top.cat.idx} · ${top.cat.label}.\n`;
  if(high.length){
    msg += `Πιο επικίνδυνες περιοχές: ${high.slice(0,4).map(p=>p.n).join(', ')}.\n`;
  } else {
    msg += `Καμία περιοχή σε υψηλό κίνδυνο αυτή τη στιγμή — αλλά μένουμε σε εγρήγορση.\n`;
  }
  if(windy.length) msg += `💨 Δυνατοί άνεμοι: ${windy[0].n} (${windy[0].wind} χλμ/η ${compass(windy[0].wdir)}).\n`;
  if(top.cat.idx>=4)      msg += `⛔ ΑΠΑΓΟΡΕΥΕΤΑΙ κάθε χρήση φωτιάς στην ύπαιθρο. Αν δεις καπνό κάλεσε ΑΜΕΣΩΣ 199/112.`;
  else if(top.cat.idx===3)msg += `⚠️ Μην ανάβεις φωτιά/ψησταριά, απόφυγε εργασίες που βγάζουν σπίθα. Αναφορά καπνού → 199.`;
  else                    msg += `✅ Ήπιες συνθήκες. Πάντα προσοχή σε υπαίθριες φωτιές και σπινθήρες.`;
  // Πρόβλεψη επόμενων ημερών (εθνικός ΜΕΣΟΣ δείκτης — συνεπές με την 5ήμερη)
  const fdays = sorted[0].forecast || [];
  if(fdays.length>1){
    const natCat = d => { let s=0,n=0; sorted.forEach(p=>{const f=p.forecast[d]; if(f){s+=f.score;n++;}}); return n? categoryOf(Math.round(s/n)).idx : 1; };
    const todayC = natCat(0); let worst=todayC, worstD=0;
    for(let d=1; d<Math.min(5,fdays.length); d++){ const c=natCat(d); if(c>worst){ worst=c; worstD=d; } }
    if(worst>todayC){
      const dt=new Date(fdays[worstD].date).toLocaleDateString('el-GR',{weekday:'long'});
      msg += `\n📅 Προσοχή: ο μέσος εθνικός κίνδυνος ανεβαίνει σε «${CAT[worst-1].label}» την ${dt}.`;
    } else {
      msg += `\n📅 Επόμενες μέρες: ο μέσος εθνικός κίνδυνος παραμένει γύρω στο «${CAT[todayC-1].label}».`;
    }
  }
  document.getElementById('aiSay').textContent = msg;
}

// ---- Επίπεδα χάρτη — EFFIS / Copernicus WMS (δημόσιο, ΧΩΡΙΣ κλειδί) ----
const EFFIS_WMS = 'https://maps.effis.emergency.copernicus.eu/effis';
const todayISO = () => new Date().toISOString().slice(0,10);
const yesterdayISO = () => new Date(Date.now()-86400000).toISOString().slice(0,10);
const LAYER_DEFS = {
  fires: {layers:'all.hs',               label:'🛰️ Ενεργές εστίες',      on:true,  opacity:0.95},
  fwi:   {layers:'mf010.fwi',            label:'🔥 Επικινδυνότητα (FWI)', on:false, opacity:0.55, time:true},
  burnt: {layers:'modis.ba.poly.season', label:'🌳 Καμένες φέτος',        on:false, opacity:0.6},
  sat:   {label:'🛰️ Δορυφορική εικόνα', on:false, opacity:1, maxNativeZoom:16, attr:'Sentinel-2 cloudless · EOX',
          xyz:'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg'}
};
const wmsLayers = {};
function makeWms(def){
  if(def.xyz){
    return L.tileLayer(def.xyz.replace('{DATE}', yesterdayISO()),
      {maxNativeZoom:def.maxNativeZoom||8, maxZoom:18, opacity:def.opacity||1, attribution:def.attr||'Δορυφόρος'});
  }
  const opts = {layers:def.layers, format:'image/png', transparent:true, version:'1.3.0', opacity:def.opacity, attribution:'EFFIS / Copernicus'};
  if(def.time) opts.time = todayISO();
  return L.tileLayer.wms(EFFIS_WMS, opts);
}
function initLayers(){
  const box = document.getElementById('layerBtns'); if(!box) return;
  box.innerHTML = '';
  Object.entries(LAYER_DEFS).forEach(([k,def])=>{
    if(!wmsLayers[k]) wmsLayers[k] = makeWms(def);
    if(def.on) wmsLayers[k].addTo(map);
    const b = document.createElement('button');
    b.className = 'layerBtn' + (def.on ? ' active' : '');
    b.textContent = def.label;
    b.onclick = ()=>{
      def.on = !def.on;
      if(def.on){ wmsLayers[k].addTo(map); b.classList.add('active'); }
      else { map.removeLayer(wmsLayers[k]); b.classList.remove('active'); }
    };
    box.appendChild(b);
  });
}

// ---- Πυροσβεστικά μέσα (demo — συνδέεται με πραγματικό AVL/GPS στόλου) ----
const UNITS = [
  {n:'ΠΥ Αθηνών',lat:37.99,lon:23.73,t:'🚒',s:'Διαθέσιμο'},
  {n:'ΠΥ Πειραιά',lat:37.94,lon:23.64,t:'🚒',s:'Διαθέσιμο'},
  {n:'ΠΥ Θεσσαλονίκης',lat:40.63,lon:22.95,t:'🚒',s:'Διαθέσιμο'},
  {n:'ΠΥ Πάτρας',lat:38.24,lon:21.73,t:'🚒',s:'Καθ’ οδόν'},
  {n:'ΠΥ Ηρακλείου',lat:35.33,lon:25.14,t:'🚒',s:'Διαθέσιμο'},
  {n:'ΠΥ Χανίων',lat:35.51,lon:24.02,t:'🚒',s:'Διαθέσιμο'},
  {n:'ΠΥ Λάρισας',lat:39.64,lon:22.41,t:'🚒',s:'Διαθέσιμο'},
  {n:'ΠΥ Βόλου',lat:39.36,lon:22.94,t:'🚒',s:'Σε συμβάν'},
  {n:'ΠΥ Ιωαννίνων',lat:39.66,lon:20.85,t:'🚒',s:'Διαθέσιμο'},
  {n:'ΠΥ Καλαμάτας',lat:37.04,lon:22.11,t:'🚒',s:'Διαθέσιμο'},
  {n:'ΠΥ Τρίπολης',lat:37.51,lon:22.37,t:'🚒',s:'Διαθέσιμο'},
  {n:'ΠΥ Χαλκίδας',lat:38.46,lon:23.60,t:'🚒',s:'Καθ’ οδόν'},
  {n:'ΠΥ Κέρκυρας',lat:39.62,lon:19.92,t:'🚒',s:'Διαθέσιμο'},
  {n:'ΠΥ Ρόδου',lat:36.43,lon:28.22,t:'🚒',s:'Διαθέσιμο'},
  {n:'ΠΥ Λαμίας',lat:38.90,lon:22.43,t:'🚒',s:'Διαθέσιμο'},
  {n:'Εναέριο Ελευσίνας',lat:38.07,lon:23.55,t:'🚁',s:'Διαθέσιμο'},
  {n:'Εναέριο Θεσσαλονίκης',lat:40.52,lon:22.97,t:'🚁',s:'Διαθέσιμο'}
];
const unitColor = s => s==='Σε συμβάν' ? '#ff3b30' : s==='Καθ’ οδόν' ? '#ffd23f' : '#2ec36b';
let unitsLayer=null, unitsOn=false;
function makeUnitsLayer(){
  const g=L.layerGroup();
  UNITS.forEach(u=>{
    const col=unitColor(u.s);
    L.marker([u.lat,u.lon],{icon:L.divIcon({className:'unitIcon',html:`<div style="font-size:22px;filter:drop-shadow(0 0 4px ${col})">${u.t}</div>`,iconSize:[26,26],iconAnchor:[13,13]})})
      .bindPopup(`${u.t} <b>${u.n}</b><br>Κατάσταση: <b style="color:${col}">${u.s}</b>`).addTo(g);
  });
  return g;
}
function toggleUnits(){
  if(!unitsLayer) unitsLayer=makeUnitsLayer();
  unitsOn=!unitsOn;
  if(unitsOn) unitsLayer.addTo(map); else map.removeLayer(unitsLayer);
  const b=document.getElementById('unitsBtn'); if(b) b.classList.toggle('active',unitsOn);
}

// ---- «Lite» μοντέλο εξάπλωσης φωτιάς (κώνος ανέμου) ----
let spreadCone=null, spreadFire=null, spreadMode=false, responseLayer=null;
function setSpreadMode(on){
  spreadMode=on;
  const mapEl=document.getElementById('map'); if(mapEl) mapEl.style.cursor=on?'crosshair':'';
  const b=document.getElementById('spreadBtn');
  if(b){ b.classList.toggle('active',on); b.textContent = on?'🎯 Κάνε κλικ στον χάρτη…':'🔥 Προσομοίωση εξάπλωσης'; }
}
async function simulateSpread(lat,lon){
  let wind=15, wdir=0;
  try{
    const u=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh`;
    const c=(await (await fetch(u)).json()).current||{}; wind=c.wind_speed_10m??15; wdir=c.wind_direction_10m??0;
  }catch(e){}
  const toBear=(wdir+180)%360;            // η φωτιά «τρέχει» downwind
  const len=Math.min(30, 3+wind*0.45);    // χλμ, κλιμακώνεται με τον άνεμο
  const pts=[[lat,lon]];
  for(let a=-30;a<=30;a+=10){ const d=destinationPoint(lat,lon,(toBear+a+360)%360,len); pts.push([d.lat,d.lon]); }
  pts.push([lat,lon]);
  if(spreadCone) map.removeLayer(spreadCone);
  if(spreadFire) map.removeLayer(spreadFire);
  spreadCone=L.polygon(pts,{color:'#ff3b30',weight:1.5,fillColor:'#ff5a1f',fillOpacity:.35}).addTo(map);
  spreadFire=L.circleMarker([lat,lon],{radius:8,color:'#fff',weight:2,fillColor:'#ff2d00',fillOpacity:1}).addTo(map);

  // 🎯 Πλησιέστερα μέσα + εκτιμώμενος χρόνος άφιξης (Time to Arrival)
  if(!unitsLayer) unitsLayer=makeUnitsLayer();
  if(!unitsOn){ unitsLayer.addTo(map); unitsOn=true; const ub=document.getElementById('unitsBtn'); if(ub) ub.classList.add('active'); }
  const ranked = UNITS.map(u=>{
    const d=distKm(lat,lon,u.lat,u.lon);
    const road=(u.t==='🚁'? d : d*1.25), speed=(u.t==='🚁'?160:55);
    return {...u, d, eta:Math.max(1, Math.round(road/speed*60))};
  }).sort((a,b)=>a.d-b.d).slice(0,3);
  if(responseLayer) map.removeLayer(responseLayer);
  responseLayer=L.layerGroup().addTo(map);
  ranked.forEach((u,i)=>L.polyline([[u.lat,u.lon],[lat,lon]],{color:i===0?'#2ec36b':'#8ff6ff',weight:i===0?3.5:1.5,opacity:.85,dashArray:i===0?null:'6 7'}).addTo(responseLayer));

  const nearHtml = ranked.map((u,i)=>`${i===0?'🥇 ':'• '}${u.t} ${u.n} — <b>${u.d.toFixed(1)} χλμ · ~${u.eta}′</b>`).join('<br>');
  spreadFire.bindPopup(`🔥 <b>Σημείο φωτιάς</b><br>Άνεμος ${Math.round(wind)} χλμ/η από ${compass(wdir)}<br><b style="color:#ff7a3c">Εξάπλωση προς ${compass(toBear)}</b> (~${len.toFixed(0)} χλμ)<hr style="border:none;border-top:1px solid rgba(255,255,255,.15);margin:7px 0">🎯 <b>Πλησιέστερα μέσα:</b><br>${nearHtml}<br><span style="opacity:.6;font-size:11px">ETA εκτίμηση (δρόμος ~55 χλμ/η · εναέρια ~160).</span>`).openPopup();

  const res=document.getElementById('spreadResult');
  if(res) res.innerHTML = `<div class="srHead">🎯 Πλησιέστερα μέσα → χρόνος άφιξης</div>`+ranked.map((u,i)=>`<div class="srRow"><span>${i===0?'🥇':'&nbsp;&nbsp;&nbsp;'} ${u.t} ${u.n}</span><span class="srEta">${u.d.toFixed(1)} χλμ · ~${u.eta}′</span></div>`).join('');
}

// ---- 🚨 Σύστημα συναγερμού: ήχος σειρήνας + animation στον χάρτη + banner ----
let audioCtx=null, alertLayer=null;
function playSiren(){
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    const ctx=audioCtx; if(ctx.state==='suspended') ctx.resume();
    const t0=ctx.currentTime;
    for(let i=0;i<3;i++){ const o=ctx.createOscillator(), g=ctx.createGain(); const s=t0+i*0.5;
      o.type='sine'; o.frequency.setValueAtTime(900,s); o.frequency.linearRampToValueAtTime(460,s+0.4);
      g.gain.setValueAtTime(0.0001,s); g.gain.exponentialRampToValueAtTime(0.25,s+0.05); g.gain.exponentialRampToValueAtTime(0.0001,s+0.46);
      o.connect(g); g.connect(ctx.destination); o.start(s); o.stop(s+0.5); }
  }catch(e){}
}
function fireAlert(lat, lon, title, withSound){
  const bn=document.getElementById('alertBanner');
  if(bn){
    bn.innerHTML = `🚨 <span><b>ΣΥΝΑΓΕΡΜΟΣ ΦΩΤΙΑΣ</b> — ${String(title||'').replace(/[<>]/g,'')}</span> <button aria-label="Κλείσιμο">✕</button>`;
    bn.hidden=false;
    bn.querySelector('button').onclick=()=>{ bn.hidden=true; };
    clearTimeout(window.__alertT); window.__alertT=setTimeout(()=>{ bn.hidden=true; }, 10000);
  }
  if(withSound!==false) playSiren();
  if(!alertLayer) alertLayer=L.layerGroup().addTo(map);
  const m=L.marker([lat,lon],{icon:L.divIcon({className:'alertPulse',html:'<span></span><span></span><i>🔥</i>',iconSize:[30,30],iconAnchor:[15,15]}),zIndexOffset:1000}).addTo(alertLayer);
  setTimeout(()=>{ try{ alertLayer.removeLayer(m); }catch(e){} }, 30000);
  map.setView([lat,lon], Math.max(map.getZoom(), 8));
}
function demoAlert(){
  const p=LAST_POINTS[0];
  if(!p){ fireAlert(38.32,23.32,'Θήβα — δοκιμή'); return; }
  fireAlert(p.lat, p.lon, `${p.n} (κατ.${p.cat.idx}) — δορυφορικός εντοπισμός [demo]`);
}

// ---- Αυτόματος έλεγχος ΠΡΑΓΜΑΤΙΚΩΝ εστιών (NASA FIRMS) + auto-συναγερμός ----
// Προτεραιότητα: backend /api/fires (κλειδί κρυφό). Αν δεν υπάρχει backend ή δεν έχει κλειδί
// (π.χ. στατικό github.io) → απευθείας από NASA FIRMS μέσα από τον browser (επιτρέπει CORS),
// ώστε οι ζωντανές εστίες να εμφανίζονται ΠΑΝΤΟΥ.
let seenFires=new Set(), realFireLayer=null, firstFireLoad=true;
const FIRMS_SOURCES = [['VIIRS_NOAA20_NRT','NOAA-20'], ['VIIRS_SNPP_NRT','SNPP']];

function paintFires(fires, srcLabel){
  if(!realFireLayer) realFireLayer=L.layerGroup().addTo(map);
  realFireLayer.clearLayers();
  const fresh=[];
  (fires||[]).forEach(f=>{
    const id=f.lat.toFixed(3)+','+f.lon.toFixed(3)+','+(f.time||'');
    if(!seenFires.has(id)){ seenFires.add(id); if(!firstFireLoad) fresh.push(f); }
    const sat = f.sat ? ` ${f.sat}` : '';
    L.marker([f.lat,f.lon],{
      icon:L.divIcon({className:'fireHot', html:'<span></span><i>🔥</i>', iconSize:[26,26], iconAnchor:[13,13]}),
      zIndexOffset:600, keyboard:false
    }).addTo(realFireLayer).bindPopup(`🔥 Ενεργή εστία (δορυφόρος VIIRS${sat})<br>Αξιοπιστία: ${f.conf||'—'}<br>${f.date||''} ${f.time||''} UTC`);
  });
  const pill=document.getElementById('firesLivePill'); if(pill) pill.textContent = fires.length;
  const dF=document.getElementById('dFIRMS'), mF=document.getElementById('mFIRMS');
  if(dF) dF.className='meter on';
  if(mF){ mF.textContent=(fires.length>0? fires.length+' ενεργές'+(srcLabel?' · '+srcLabel:'') : '0 — καθαρά'); mF.className='engMeta live'; }
  if(fresh.length){ fireAlert(fresh[0].lat, fresh[0].lon, `${fresh.length} νέα σημεία εστιών — δορυφορικός εντοπισμός (VIIRS)`); }
  firstFireLoad=false;
}
function firmsNoKey(){
  const pill=document.getElementById('firesLivePill'); if(pill) pill.textContent='—';
  const dF=document.getElementById('dFIRMS'), mF=document.getElementById('mFIRMS');
  if(dF) dF.className='meter warn'; if(mF) mF.textContent='σε αναμονή κλειδιού';
}
// Απευθείας από NASA FIRMS (CORS-enabled) — πολλαπλοί δορυφόροι με dedupe
async function fetchFiresClient(){
  if(!FIRMS_MAP_KEY) return null;
  const area='19.3,34.7,28.4,41.8'; // Ελλάδα: west,south,east,north
  const seen=new Set(), fires=[];
  for(const [prod,label] of FIRMS_SOURCES){
    try{
      const txt = await (await fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${FIRMS_MAP_KEY}/${prod}/${area}/1`)).text();
      const rows=txt.trim().split(/\r?\n/); const head=(rows.shift()||'').split(',');
      const iLat=head.indexOf('latitude'),iLon=head.indexOf('longitude'),iConf=head.indexOf('confidence'),iDate=head.indexOf('acq_date'),iTime=head.indexOf('acq_time');
      for(const line of rows){ const c=line.split(','); if(c.length<3) continue;
        const lat=+c[iLat], lon=+c[iLon]; if(!lat||!lon) continue;
        const k=lat.toFixed(3)+','+lon.toFixed(3); if(seen.has(k)) continue; seen.add(k);
        fires.push({lat,lon,conf:iConf>=0?c[iConf]:'',date:iDate>=0?c[iDate]:'',time:iTime>=0?c[iTime]:'',sat:label}); }
    }catch(e){ /* αγνόησε αυτή την πηγή */ }
  }
  return fires;
}
async function loadRealFires(){
  // 1) Backend (κλειδί κρυφό) όταν υπάρχει & είναι ενεργό
  try{
    const d = await (await fetch('api/fires')).json();
    if(d && d.ok && d.powered){ paintFires(d.fires||[], 'δορυφόρος'); return; }
  }catch(e){ /* δεν υπάρχει backend — πάμε σε client fallback */ }
  // 2) Fallback: απευθείας NASA FIRMS από τον browser (στατικό hosting / backend χωρίς κλειδί)
  const cf = await fetchFiresClient();
  if(cf){ paintFires(cf, 'απευθείας δορυφόρος'); return; }
  // 3) Δεν υπάρχει κλειδί πουθενά
  firmsNoKey();
}

// ---- Ασφαλής Έξοδος (γεωεντοπισμός χρήστη) ----
function safeExit(){
  const box = document.getElementById('safeBox');
  const st  = document.getElementById('myStatus');
  if(!navigator.geolocation){ st.textContent='Η συσκευή δεν υποστηρίζει γεωεντοπισμό.'; return; }
  st.textContent = 'Εντοπισμός τοποθεσίας…';
  navigator.geolocation.getCurrentPosition(async pos=>{
    const {latitude:lat, longitude:lon} = pos.coords;
    try{
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
        +`&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m`
        +`&daily=temperature_2m_max,wind_speed_10m_max,precipitation_sum&past_days=3&forecast_days=1&timezone=auto&wind_speed_unit=kmh`;
      const p = parsePoint(await (await fetch(url)).json(), {n:'Η περιοχή μου',lat,lon});
      map.setView([lat,lon],11);
      if(userMarker) map.removeLayer(userMarker);
      userMarker = L.marker([lat,lon]).addTo(map).bindPopup('📍 Είσαι εδώ').openPopup();

      const fromDir = compass(p.wdir);              // απ' όπου φυσά ο άνεμος
      const fireDir = compass((p.wdir+180)%360);    // προς τα εκεί «τρέχει» η φωτιά
      const safe = destinationPoint(lat, lon, p.wdir, 8); // ~8χλμ αντίθετα στη φωτιά
      const gmaps = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${safe.lat.toFixed(5)},${safe.lon.toFixed(5)}&travelmode=driving`;
      st.textContent = `Περιοχή σου: κατηγορία ${p.cat.idx} (${p.cat.label}).`;
      box.hidden=false;
      box.innerHTML = `<h4 style="color:${p.cat.color}">Κίνδυνος: ${p.cat.idx} · ${p.cat.label} (${p.score}/100)</h4>
        🌡️ ${p.temp}°C · 💧 ${p.hum}% · 💨 ${p.wind} χλμ/η (φυσά από ${fromDir})
        <div style="margin-top:10px">Αν δεις φωτιά/καπνό, η πιθανή διάδοση είναι προς <b>${fireDir}</b>.</div>
        <div class="dir">🧭 Φύγε προς ${fromDir} (αντίθετα στη φωτιά)</div>
        <ul>
          <li>Κινήσου <b>μακριά από τον καπνό</b>, ποτέ προς τα εκεί.</li>
          <li><b>Ποτέ ανηφόρα</b> — η φωτιά τρέχει γρήγορα στην ανηφόρα.</li>
          <li>Κατευθύνσου σε <b>ανοιχτό χώρο, δρόμο ή θάλασσα</b>.</li>
          <li>Πάρε νερό, σκέπασε μύτη/στόμα με βρεγμένο ύφασμα.</li>
          <li>Κάλεσε <b>112</b> και ειδοποίησε γείτονες.</li>
        </ul>
        <a class="bigBtn safe gmapsBtn" target="_blank" rel="noopener" href="${gmaps}">🧭 Πλοήγηση διαφυγής (Google Maps)</a>`;
    }catch(e){ st.textContent='Σφάλμα λήψης δεδομένων περιοχής.'; }
  }, ()=>{ st.textContent='Δεν δόθηκε άδεια τοποθεσίας. Επίτρεψέ την για οδηγίες διαφυγής.'; },
  {enableHighAccuracy:true, timeout:10000});
}

// ---- Αναφορές πολιτών (localStorage + χάρτης) ----
const REP_KEY='promitheas_reports';
const getReports = ()=>{ try{return JSON.parse(localStorage.getItem(REP_KEY)||'[]')}catch{return[]} };
const sevLabel = s=>({smoke:'Καπνός/μυρωδιά',flames:'Ορατές φλόγες',spreading:'Επεκτείνεται'}[s]||s);
function renderReports(){
  reportsLayer.clearLayers();
  const list=document.getElementById('reportList'); list.innerHTML='';
  const reps=getReports().slice(-6).reverse();
  reps.forEach(r=>{
    if(r.lat) L.circleMarker([r.lat,r.lon],{radius:8,color:'#fff',weight:1,fillColor:'#ff7a3c',fillOpacity:.9})
      .addTo(reportsLayer).bindPopup(`📢 Αναφορά πολίτη<br><b>${sevLabel(r.sev)}</b><br>${r.text||''}`);
    const t = new Date(r.time).toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'});
    const el=document.createElement('div'); el.className='repItem';
    el.innerHTML=`<b>${sevLabel(r.sev)}</b> · ${t}<br>${r.text||''}`;
    list.appendChild(el);
  });
}
function submitReport(){
  const text=document.getElementById('reportText').value.trim();
  const sev=document.getElementById('reportSeverity').value;
  const save=(lat,lon)=>{
    const reps=getReports(); reps.push({lat,lon,text,sev,time:Date.now()});
    localStorage.setItem(REP_KEY, JSON.stringify(reps));
    document.getElementById('reportModal').hidden=true;
    document.getElementById('reportText').value='';
    renderReports();
    if(lat) map.setView([lat,lon],10);
  };
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(p=>save(p.coords.latitude,p.coords.longitude), ()=>save(null,null), {timeout:8000});
  } else save(null,null);
}

// ---- Αρχηγείο Αρχών / Δήμων / Πυροσβεστικής ----
function openAuth(){
  const pts = LAST_POINTS;
  const high = pts.filter(p=>p.cat.idx>=3).length;
  const avg  = pts.length ? Math.round(pts.reduce((a,p)=>a+p.score,0)/pts.length) : 0;
  const top  = pts[0] || {cat:{idx:0,label:'—',color:'#888'}};
  const reps = getReports();
  const stat=(v,l,c)=>`<div class="statCard"><div class="statV" style="color:${c||'#fff'}">${v}</div><div class="statL">${l}</div></div>`;
  document.getElementById('authStats').innerHTML =
      stat(`${top.cat.idx}/5`,'Εθνικός κίνδυνος',top.cat.color)
    + stat(high,'Περιοχές σε υψηλό (3+)',high?'#ff9f1c':'#2ec36b')
    + stat(`${avg}/100`,'Μέση βαθμολογία')
    + stat(reps.length,'Αναφορές πολιτών',reps.length?'#ff7a3c':'#94a6bf')
    + stat(pts.length,'Περιοχές υπό παρακολούθηση','#8ff6ff')
    + stat(UNITS.length,'Πυροσβεστικά μέσα (demo)','#ff7a3c');
  const rows = pts.map((p,i)=>`<tr>
      <td>${i+1}</td><td><b>${p.n}</b></td>
      <td><span class="tBadge" style="background:${p.cat.color}">${p.cat.idx}</span>${p.cat.label}</td>
      <td>${p.score}/100</td><td>${p.temp}°C</td><td>${p.hum}%</td><td>${p.wind} ${compass(p.wdir)}</td></tr>`).join('');
  document.getElementById('authTable').innerHTML =
    `<thead><tr><th>#</th><th>Περιοχή</th><th>Κίνδυνος</th><th>Score</th><th>🌡️</th><th>💧</th><th>💨 χλμ/η</th></tr></thead><tbody>${rows}</tbody>`;
  document.getElementById('authReports').innerHTML = reps.slice().reverse().map(r=>{
      const t=new Date(r.time).toLocaleString('el-GR');
      return `<div class="repItem"><b>${sevLabel(r.sev)}</b> · ${t}${r.lat?` · 📍 ${r.lat.toFixed(3)},${r.lon.toFixed(3)}`:''}<br>${r.text||''}</div>`;
    }).join('') || '<p class="muted">Καμία αναφορά πολίτη ακόμη.</p>';
  document.getElementById('authView').hidden=false;
}

// ---- AI Chat: «Ρώτησε τον ΠΡΟΜΗΘΕΑ» (GPT-4o backend, grounded στα ζωντανά δεδομένα) ----
let chatHistory = [];
function buildContext(){
  const p = LAST_POINTS;
  if(!p.length) return 'Δεν έχουν φορτωθεί ακόμη δεδομένα.';
  const top = p[0];
  const high = p.filter(x=>x.cat.idx>=3).slice(0,12)
    .map(x=>`${x.n}: κατ.${x.cat.idx} (${x.score}/100), ${x.temp}°C, υγρασία ${x.hum}%, άνεμος ${x.wind}χλμ/η ${compass(x.wdir)}`);
  const days = Math.min(5,(top.forecast||[]).length);
  const natFc = [];
  for(let d=0; d<days; d++){ const mc = p.reduce((m,x)=>{ const f=x.forecast[d]; return f&&f.cat.idx>m?f.cat.idx:m; },1); natFc.push(`ημ${d}:κατ.${mc}`); }
  const av=UNITS.filter(u=>u.s==='Διαθέσιμο').length, en=UNITS.filter(u=>u.s==='Καθ’ οδόν').length, on=UNITS.filter(u=>u.s==='Σε συμβάν').length;
  return [
    `Ημερομηνία: ${new Date().toLocaleDateString('el-GR')}.`,
    `Εθνικός κίνδυνος: κατηγορία ${top.cat.idx}/5 (${top.cat.label}).`,
    `Περιοχές αυξημένου κινδύνου (κατ.3+): ${high.length? high.join(' | ') : 'καμία αυτή τη στιγμή'}.`,
    `Εθνική πρόβλεψη 5 ημερών (μέγιστη κατηγορία ανά ημέρα): ${natFc.join(', ')}.`,
    `Πυροσβεστικά μέσα (δείγμα): σύνολο ${UNITS.length} — διαθέσιμα ${av}, καθ’ οδόν ${en}, σε συμβάν ${on}.`
  ].join('\n');
}
function chatAdd(who, msg, cls){
  const box=document.getElementById('chatMsgs'); if(!box) return null;
  const d=document.createElement('div'); d.className='cMsg '+cls;
  d.innerHTML = `<b>${who}</b> ${msg}`;
  box.appendChild(d); box.scrollTop=box.scrollHeight; return d;
}
async function askPromitheas(text){
  text=(text||'').trim(); if(!text) return;
  const input=document.getElementById('chatInput'); if(input) input.value='';
  chatAdd('Εσύ:', text.replace(/[<>]/g,''), 'cUser');
  const thinking=chatAdd('ΠΡΟΜΗΘΕΑΣ:', '<span class="muted">σκέφτεται…</span>', 'cBot');
  try{
    const r=await fetch('api/chat',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:text, context:buildContext(), history:chatHistory})});
    const d=await r.json();
    if(d && d.ok && d.reply){
      thinking.innerHTML=`<b>ΠΡΟΜΗΘΕΑΣ:</b> `+d.reply.replace(/[<>]/g,'').replace(/\n/g,'<br>');
      chatHistory.push({role:'user',content:text},{role:'assistant',content:d.reply});
      if(chatHistory.length>12) chatHistory=chatHistory.slice(-12);
    } else { throw new Error((d&&d.error)||'no reply'); }
  }catch(e){
    thinking.innerHTML=`<b>ΠΡΟΜΗΘΕΑΣ:</b> <span class="muted">Ο Εγκέφαλος ΠΡΟΜΗΘΕΑΣ θα είναι διαθέσιμος στην πλήρη έκδοση (backend στο Render). Σε λίγο online!</span>`;
  }
}

function toggleChatExpand(force){
  const card=document.querySelector('.card.promitheas'); if(!card) return;
  const bd=document.getElementById('chatBackdrop'), btn=document.getElementById('chatExpand');
  const on = (force!==undefined) ? force : !card.classList.contains('expanded');
  card.classList.toggle('expanded', on);
  if(bd) bd.hidden = !on;
  if(btn){ btn.textContent = on?'✕':'⛶'; btn.title = on?'Σμίκρυνση':'Μεγέθυνση κάδρου'; }
  if(on){ const box=document.getElementById('chatMsgs'); if(box) box.scrollTop=box.scrollHeight; const ci=document.getElementById('chatInput'); if(ci) ci.focus(); }
}

// ---- Ρολόι ----
function tick(){
  document.getElementById('clock').textContent =
    new Date().toLocaleTimeString('el-GR',{timeZone:'Europe/Athens'});
}

// ---- Εκκίνηση ----
async function boot(){
  initMap();
  tick(); setInterval(tick,1000);
  renderReports();
  document.getElementById('safeBtn').onclick=safeExit;
  document.getElementById('locateBtn').onclick=safeExit;
  document.getElementById('reportBtn').onclick=()=>document.getElementById('reportModal').hidden=false;
  document.getElementById('reportClose').onclick=()=>document.getElementById('reportModal').hidden=true;
  document.getElementById('reportSubmit').onclick=submitReport;
  const rs=document.getElementById('regSearch'); if(rs) rs.oninput=()=>searchRegions(rs.value);
  const ci=document.getElementById('chatInput'), cs=document.getElementById('chatSend');
  if(cs) cs.onclick=()=>askPromitheas(ci.value);
  if(ci) ci.addEventListener('keydown', e=>{ if(e.key==='Enter') askPromitheas(ci.value); });
  document.querySelectorAll('.qBtn').forEach(b=>b.onclick=()=>askPromitheas(b.dataset.q));
  const ce=document.getElementById('chatExpand'); if(ce) ce.onclick=()=>toggleChatExpand();
  const cbd=document.getElementById('chatBackdrop'); if(cbd) cbd.onclick=()=>toggleChatExpand(false);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') toggleChatExpand(false); });
  document.getElementById('authBtn').onclick=openAuth;
  document.getElementById('authClose').onclick=()=>document.getElementById('authView').hidden=true;
  document.getElementById('unitsBtn').onclick=toggleUnits;
  document.getElementById('spreadBtn').onclick=()=>setSpreadMode(!spreadMode);
  var ab=document.getElementById('alarmBtn'); if(ab) ab.onclick=demoAlert;
  map.on('click', e=>{ if(spreadMode){ simulateSpread(e.latlng.lat, e.latlng.lng); setSpreadMode(false); } });

  async function refresh(){
    const load=document.getElementById('loadingMap'); load.style.display='flex';
    try{ render(await fetchAll()); }
    catch(e){ document.getElementById('aiSay').textContent='⚠️ Δεν φορτώθηκαν τα δεδομένα καιρού. Δοκίμασε ανανέωση.'; console.error(e); }
    load.style.display='none';
  }
  await refresh();
  initLayers();
  loadRealFires(); setInterval(loadRealFires, 5*60*1000);
  checkAIBrain(); setInterval(checkAIBrain, 5*60*1000);
  setInterval(refresh, REFRESH_MS);
}
document.addEventListener('DOMContentLoaded', boot);
