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

// ---- Διγλωσσία EL/EN: η ενσωμάτωση στο evlabsai.gr περνά ?lang=en ----
const LANG = (new URLSearchParams(location.search).get('lang') === 'en') ? 'en' : 'el';
const T = (el, en) => (LANG === 'en' ? en : el);
const LOC = (LANG === 'en' ? 'en-GB' : 'el-GR');

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
  {min:0,  label:'Χαμηλός',      en:'Low',       color:'#2ec36b'},
  {min:20, label:'Μέτριος',      en:'Moderate',  color:'#ffd23f'},
  {min:40, label:'Υψηλός',       en:'High',      color:'#ff9f1c'},
  {min:60, label:'Πολύ υψηλός',  en:'Very high', color:'#ff3b30'},
  {min:80, label:'Συναγερμός',   en:'Alarm',     color:'#b026ff'}
];
const catLabel = c => T(c.label, c.en);
const COMPASS = ['Β','ΒΑ','Α','ΝΑ','Ν','ΝΔ','Δ','ΒΔ'];
const COMPASS_EN = ['N','NE','E','SE','S','SW','W','NW'];

const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const compass = deg => (LANG==='en'?COMPASS_EN:COMPASS)[Math.round(((deg%360)/45))%8];
function categoryOf(score){ let i=0; for(let k=0;k<CAT.length;k++){ if(score>=CAT[k].min) i=k; } return {idx:i+1, color:CAT[i].color, label:catLabel(CAT[i])}; }
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
      `<b>${p.n}</b><br>${T('Κίνδυνος σήμερα','Risk today')}: <b style="color:${p.cat.color}">${p.cat.idx} · ${p.cat.label}</b> (${p.score}/100)`
      +`<br>🌡️ ${p.temp}°C · 💧 ${p.hum}% · 💨 ${p.wind} ${T('χλμ/η','km/h')} ${compass(p.wdir)}`
      +`<br><span style="opacity:.7">${T('Πρόβλεψη 5ημ.','5-day forecast')}:</span> ${fcMini(p)}`
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
  const ut=document.getElementById('updTime'); if(ut) ut.textContent=T('ανανέωση ','updated ')+new Date().toLocaleTimeString(LOC,{hour:'2-digit',minute:'2-digit'});
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
  const mML = document.getElementById('mML'); if(mML) mML.textContent = (trees? trees+T(' δέντρα · ',' trees · ') : '') + n + T(' περιοχές',' regions');
  const dML = document.getElementById('dML'); if(dML) dML.className = 'meter ' + (trees? 'on':'warn');
  const mMeteo = document.getElementById('mMeteo');
  if(mMeteo) mMeteo.textContent = n + T(' περιοχές · ',' regions · ') + new Date().toLocaleTimeString(LOC,{hour:'2-digit',minute:'2-digit'});
}
async function checkAIBrain(){
  const d = document.getElementById('dGPT'), m = document.getElementById('mGPT');
  try{
    const h = await (await fetch('api/health')).json();
    const on = !!(h && h.ai && h.ai.powered);
    if(d) d.className = 'meter ' + (on? 'on':'warn');
    if(m){ m.textContent = on ? T('ενεργός · συνδεδεμένος','active · connected') : T('τοπική προβολή','local view'); m.className = 'engMeta'+(on?' live':''); }
  }catch(e){ if(d) d.className='engDot warn'; if(m) m.textContent=T('τοπική προβολή','local view'); }
}

// ---- Λίστα περιοχών + αναζήτηση δήμου ----
function renderList(rows){
  const list = document.getElementById('regionList');
  list.innerHTML = '';
  if(!rows.length){ list.innerHTML = '<p class="muted">'+T('Δεν βρέθηκε περιοχή — δοκίμασε άλλο όνομα.','No area found — try another name.')+'</p>'; return; }
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
  const advice = top.cat.idx>=4 ? T('Απόφυγε κάθε υπαίθρια φωτιά. Να είσαι έτοιμος/η για εκκένωση.','Avoid any outdoor fire. Be ready to evacuate.')
              : top.cat.idx===3 ? T('Μην ανάβεις φωτιά ή ψησταριά. Πρόσεχε σπινθήρες — δες την περιοχή σου.','No open fire or BBQ. Watch for sparks — check your area.')
              : T('Ήπιες συνθήκες σήμερα — αλλά πάντα προσοχή με φωτιά στην ύπαιθρο.','Mild conditions today — but always be careful with outdoor fire.');
  strip.style.background = top.cat.color;
  strip.style.color = top.cat.idx===2 ? '#1a1200' : '#fff';
  strip.innerHTML = `<b>${T('ΣΗΜΕΡΑ ΣΤΗΝ ΕΛΛΑΔΑ · Κίνδυνος','TODAY IN GREECE · Risk')} ${top.cat.idx}/5 — ${top.cat.label}</b><span>${advice}</span>`;
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
    const lbl = d===0?T('Σήμ.','Today') : d===1?T('Αύρ.','Tmrw') : dt.toLocaleDateString(LOC,{weekday:'short'}).replace('.','');
    html+=`<div class="fcDay"><span class="fcLbl">${lbl}</span><span class="fcDot" style="background:${cat.color}">${cat.idx}</span><span class="fcScore">${avg}/100</span></div>`;
  }
  el.innerHTML=html;
}

// ---- Ο ΠΡΟΜΗΘΕΑΣ μιλάει (data-driven· έτοιμο για σύνδεση με OpenAI) ----
function promitheasSay(sorted){
  const top = sorted[0];
  const high = sorted.filter(p=>p.cat.idx>=3);
  const windy = sorted.filter(p=>p.wind>=40).sort((a,b)=>b.wind-a.wind);
  let msg = `🔥 ${T('Εθνικός κίνδυνος σήμερα','National risk today')}: ${top.cat.idx} · ${top.cat.label}.\n`;
  if(high.length){
    msg += `${T('Πιο επικίνδυνες περιοχές','Highest-risk areas')}: ${high.slice(0,4).map(p=>p.n).join(', ')}.\n`;
  } else {
    msg += T('Καμία περιοχή σε υψηλό κίνδυνο αυτή τη στιγμή — αλλά μένουμε σε εγρήγορση.\n','No area at high risk right now — but we stay alert.\n');
  }
  if(windy.length) msg += `💨 ${T('Δυνατοί άνεμοι','Strong winds')}: ${windy[0].n} (${windy[0].wind} ${T('χλμ/η','km/h')} ${compass(windy[0].wdir)}).\n`;
  if(top.cat.idx>=4)      msg += T('⛔ ΑΠΑΓΟΡΕΥΕΤΑΙ κάθε χρήση φωτιάς στην ύπαιθρο. Αν δεις καπνό κάλεσε ΑΜΕΣΩΣ 199/112.','⛔ All outdoor fire use is BANNED. If you see smoke, call 199/112 IMMEDIATELY.');
  else if(top.cat.idx===3)msg += T('⚠️ Μην ανάβεις φωτιά/ψησταριά, απόφυγε εργασίες που βγάζουν σπίθα. Αναφορά καπνού → 199.','⚠️ No open fire/BBQ, avoid spark-producing work. Report smoke → 199.');
  else                    msg += T('✅ Ήπιες συνθήκες. Πάντα προσοχή σε υπαίθριες φωτιές και σπινθήρες.','✅ Mild conditions. Always be careful with outdoor fire and sparks.');
  // Πρόβλεψη επόμενων ημερών (εθνικός ΜΕΣΟΣ δείκτης — συνεπές με την 5ήμερη)
  const fdays = sorted[0].forecast || [];
  if(fdays.length>1){
    const natCat = d => { let s=0,n=0; sorted.forEach(p=>{const f=p.forecast[d]; if(f){s+=f.score;n++;}}); return n? categoryOf(Math.round(s/n)).idx : 1; };
    const todayC = natCat(0); let worst=todayC, worstD=0;
    for(let d=1; d<Math.min(5,fdays.length); d++){ const c=natCat(d); if(c>worst){ worst=c; worstD=d; } }
    if(worst>todayC){
      const dt=new Date(fdays[worstD].date).toLocaleDateString(LOC,{weekday:'long'});
      msg += `\n📅 ${T('Προσοχή: ο μέσος εθνικός κίνδυνος ανεβαίνει σε','Heads-up: average national risk rises to')} «${catLabel(CAT[worst-1])}» ${T('την','on')} ${dt}.`;
    } else {
      msg += `\n📅 ${T('Επόμενες μέρες: ο μέσος εθνικός κίνδυνος παραμένει γύρω στο','Coming days: average national risk stays around')} «${catLabel(CAT[todayC-1])}».`;
    }
  }
  // Ζωντανές δορυφορικές εστίες — ώστε το headline να συμφωνεί με τον χάρτη (να «τα λέει σωστά»)
  const fl = LIVE_FIRES||[];
  if(fl.length){
    const names = fl.slice(0,3).map(f=>{const nr=nearestRegion(f.lat,f.lon);return nr.region?nr.region.n:'';}).filter(Boolean).join(', ');
    msg += `\n🔥 ${T('Ενεργές δορυφορικές εστίες τώρα','Active satellite hotspots now')}: ${fl.length}${names?' — '+names:''}${fl.length>3?'…':''}. ${T('Δες τα σημεία 🔥 στον χάρτη.','See the 🔥 points on the map.')}`;
  } else if(!firstFireLoad){
    msg += `\n🔥 ${T('Καμία ενεργή δορυφορική εστία σε ελληνικό έδαφος αυτή τη στιγμή.','No active satellite hotspot on Greek territory right now.')}`;
  }
  document.getElementById('aiSay').textContent = msg;
}

// ---- Επίπεδα χάρτη — EFFIS / Copernicus WMS (δημόσιο, ΧΩΡΙΣ κλειδί) ----
const EFFIS_WMS = 'https://maps.effis.emergency.copernicus.eu/effis';
const todayISO = () => new Date().toISOString().slice(0,10);
const yesterdayISO = () => new Date(Date.now()-86400000).toISOString().slice(0,10);
const LAYER_DEFS = {
  fires: {layers:'all.hs',               label:'🛰️ Ενεργές εστίες (EFFIS, ευρύτερη περιοχή)', labelEn:'🛰️ Active hotspots (EFFIS, wider area)',  on:false, opacity:0.95},
  fwi:   {layers:'mf010.fwi',            label:'🔥 Επικινδυνότητα (FWI)', labelEn:'🔥 Fire danger (FWI)', on:false, opacity:0.55, time:true},
  burnt: {layers:'modis.ba.poly.season', label:'🌳 Καμένες φέτος',        labelEn:'🌳 Burnt this year',   on:false, opacity:0.6},
  sat:   {label:'🛰️ Δορυφορική εικόνα', labelEn:'🛰️ Satellite imagery', on:false, opacity:1, maxNativeZoom:16, attr:'Sentinel-2 cloudless · EOX',
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
    b.textContent = T(def.label, def.labelEn||def.label);
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
const unitStatusTxt = s => T(s, ({'Διαθέσιμο':'Available','Καθ’ οδόν':'En route','Σε συμβάν':'On incident'})[s]||s);
let unitsLayer=null, unitsOn=false;
function makeUnitsLayer(){
  const g=L.layerGroup();
  UNITS.forEach(u=>{
    const col=unitColor(u.s);
    L.marker([u.lat,u.lon],{icon:L.divIcon({className:'unitIcon',html:`<div style="font-size:22px;filter:drop-shadow(0 0 4px ${col})">${u.t}</div>`,iconSize:[26,26],iconAnchor:[13,13]})})
      .bindPopup(`${u.t} <b>${u.n}</b><br>${T('Κατάσταση','Status')}: <b style="color:${col}">${unitStatusTxt(u.s)}</b>`).addTo(g);
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
  if(b){ b.classList.toggle('active',on); b.textContent = on?T('🎯 Κάνε κλικ στον χάρτη…','🎯 Click on the map…'):T('🔥 Προσομοίωση εξάπλωσης','🔥 Spread simulation'); }
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

  const nearHtml = ranked.map((u,i)=>`${i===0?'🥇 ':'• '}${u.t} ${u.n} — <b>${u.d.toFixed(1)} ${T('χλμ','km')} · ~${u.eta}′</b>`).join('<br>');
  spreadFire.bindPopup(`🔥 <b>${T('Σημείο φωτιάς','Fire point')}</b><br>${T('Άνεμος','Wind')} ${Math.round(wind)} ${T('χλμ/η από','km/h from')} ${compass(wdir)}<br><b style="color:#ff7a3c">${T('Εξάπλωση προς','Spread towards')} ${compass(toBear)}</b> (~${len.toFixed(0)} ${T('χλμ','km')})<hr style="border:none;border-top:1px solid rgba(255,255,255,.15);margin:7px 0">🎯 <b>${T('Πλησιέστερα μέσα','Nearest units')}:</b><br>${nearHtml}<br><span style="opacity:.6;font-size:11px">${T('ETA εκτίμηση (δρόμος ~55 χλμ/η · εναέρια ~160).','ETA estimate (road ~55 km/h · aerial ~160).')}</span>`).openPopup();

  const res=document.getElementById('spreadResult');
  if(res) res.innerHTML = `<div class="srHead">🎯 ${T('Πλησιέστερα μέσα → χρόνος άφιξης','Nearest units → arrival time')}</div>`+ranked.map((u,i)=>`<div class="srRow"><span>${i===0?'🥇':'&nbsp;&nbsp;&nbsp;'} ${u.t} ${u.n}</span><span class="srEta">${u.d.toFixed(1)} ${T('χλμ','km')} · ~${u.eta}′</span></div>`).join('');
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
    bn.innerHTML = `🚨 <span><b>${T('ΣΥΝΑΓΕΡΜΟΣ ΦΩΤΙΑΣ','FIRE ALERT')}</b> — ${String(title||'').replace(/[<>]/g,'')}</span> <button aria-label="${T('Κλείσιμο','Close')}">✕</button>`;
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
  if(!p){ fireAlert(38.32,23.32,T('Θήβα — δοκιμή','Thebes — test')); return; }
  fireAlert(p.lat, p.lon, `${p.n} ${T('(κατ.','(cat.')}${p.cat.idx}) — ${T('δορυφορικός εντοπισμός [demo]','satellite detection [demo]')}`);
}

// ---- Αυτόματος έλεγχος ΠΡΑΓΜΑΤΙΚΩΝ εστιών (NASA FIRMS) + auto-συναγερμός ----
// Προτεραιότητα: backend /api/fires (κλειδί κρυφό). Αν δεν υπάρχει backend ή δεν έχει κλειδί
// (π.χ. στατικό github.io) → απευθείας από NASA FIRMS μέσα από τον browser (επιτρέπει CORS),
// ώστε οι ζωντανές εστίες να εμφανίζονται ΠΑΝΤΟΥ.
let seenFires=new Set(), realFireLayer=null, firstFireLoad=true, LIVE_FIRES=[], firesLastCheck=null;
const FIRMS_SOURCES = [['VIIRS_NOAA20_NRT','NOAA-20'], ['VIIRS_SNPP_NRT','SNPP']];
// Φίλτρα ποιότητας εστιών — το VIIRS δίνει ΠΟΛΛΑ θερμικά σήματα που ΔΕΝ είναι πυρκαγιές
// (βιομηχανία, ζεστές επιφάνειες, νυχτερινός θόρυβος) + ανιχνεύσεις σε γειτονικές χώρες.
// Χωρίς αυτά εμφανίζονταν «φωτιές παντού» (δεκάδες κουκκίδες αντί για λίγα πραγματικά μέτωπα).
const FIRE_MIN_FRP    = 4;    // MW — κάτω από αυτό σπάνια είναι πραγματική φωτιά (εκτός αν αξιοπιστία=υψηλή)
const FIRE_NEAR_GR_KM = 60;   // κράτα μόνο εστίες κοντά σε ελληνικό έδαφος (όχι βάθος Τουρκίας/Αλβανίας/Βουλγαρίας)
const FIRE_CLUSTER_KM = 3;    // ένωσε γειτονικά pixel του ίδιου μετώπου σε ΜΙΑ εστία (VIIRS 375m σπάει μία φωτιά σε πολλά)
// Πλησιέστερη ελληνική περιοχή (km) — για φιλτράρισμα «κοντά στην Ελλάδα» & ονομασία εστίας
function nearestRegion(lat,lon){ let best=null, bd=Infinity;
  for(const r of REGIONS){ const dd=distKm(lat,lon,r.lat,r.lon); if(dd<bd){ bd=dd; best=r; } }
  return {region:best, km:bd}; }
// Καθάρισμα + ομαδοποίηση ακατέργαστων ανιχνεύσεων (κοινό για backend & απευθείας FIRMS)
function normalizeFires(raw){
  const seen=new Set(), kept=[];
  for(const f of (raw||[])){
    const conf=(f.conf||'').toLowerCase(), frp=+f.frp||0;
    if(conf==='l') continue;                              // πέτα χαμηλή αξιοπιστία
    if(conf!=='h' && frp>0 && frp<FIRE_MIN_FRP) continue; // πέτα αδύναμο θερμικό σήμα (θόρυβος), εκτός αν υψηλή αξιοπιστία
    if(nearestRegion(f.lat,f.lon).km>FIRE_NEAR_GR_KM) continue; // μόνο κοντά σε ελληνικό έδαφος
    const k=f.lat.toFixed(3)+','+f.lon.toFixed(3); if(seen.has(k)) continue; seen.add(k);
    kept.push(f);
  }
  return clusterFires(kept);
}
// Ομαδοποίηση γειτονικών pixel → ΕΝΑ ενεργό μέτωπο (κρατά το ισχυρότερο FRP/αξιοπιστία, μετρά τα pixel)
function clusterFires(raw){
  const cl=[]; raw.sort((a,b)=>(+b.frp||0)-(+a.frp||0));
  for(const f of raw){
    let host=null;
    for(const g of cl){ if(distKm(f.lat,f.lon,g.lat,g.lon)<=FIRE_CLUSTER_KM){ host=g; break; } }
    if(host){ host.count++; if((+f.frp||0)>(+host.frp||0)) host.frp=f.frp;
              if((f.conf||'').toLowerCase()==='h') host.conf='h'; }
    else cl.push({lat:f.lat,lon:f.lon,conf:f.conf,date:f.date,time:f.time,frp:f.frp,sat:f.sat,count:1});
  }
  return cl;
}
function confWord(c){ c=(c||'').toLowerCase(); return c==='h'?T('υψηλή','high'):c==='n'?T('μέτρια','nominal'):c==='l'?T('χαμηλή','low'):'—'; }
// Αζιμούθιο από περιοχή → εστία (για «X χλμ ΒΑ από …»)
function bearing(la1,lo1,la2,lo2){ const t=x=>x*Math.PI/180;
  const y=Math.sin(t(lo2-lo1))*Math.cos(t(la2));
  const x=Math.cos(t(la1))*Math.sin(t(la2))-Math.sin(t(la1))*Math.cos(t(la2))*Math.cos(t(lo2-lo1));
  return (Math.atan2(y,x)*180/Math.PI+360)%360; }
// Ώρα δορυφορικής λήψης → τοπική ώρα + «πριν Χ» (πραγματικός χρόνος)
function fireWhen(f){
  if(!f.date || f.time==null || f.time==='') return null;
  const tm=String(f.time).padStart(4,'0');
  const d=new Date(`${f.date}T${tm.slice(0,2)}:${tm.slice(2,4)}:00Z`);
  if(isNaN(d.getTime())) return null;
  const mins=Math.max(0,Math.round((Date.now()-d.getTime())/60000));
  const h=Math.floor(mins/60), m=mins%60;
  const rel = LANG==='en' ? (h?`${h}h ${m}m ago`:`${m}m ago`) : (h?`πριν ${h}ω ${m}′`:`πριν ${m}′`);
  return {loc:d.toLocaleTimeString(LOC,{hour:'2-digit',minute:'2-digit'}), rel, mins};
}

function paintFires(fires, srcLabel){
  if(!realFireLayer) realFireLayer=L.layerGroup().addTo(map);
  realFireLayer.clearLayers();
  LIVE_FIRES = fires || [];
  const fresh=[];
  LIVE_FIRES.forEach(f=>{
    const id=f.lat.toFixed(3)+','+f.lon.toFixed(3)+','+(f.time||'');
    if(!seenFires.has(id)){ seenFires.add(id); if(!firstFireLoad) fresh.push(f); }
    const sat = f.sat ? ` ${f.sat}` : '';
    const near = nearestRegion(f.lat,f.lon);
    L.marker([f.lat,f.lon],{
      icon:L.divIcon({className:'fireHot', html:'<span></span><i>🔥</i>', iconSize:[26,26], iconAnchor:[13,13]}),
      zIndexOffset:600, keyboard:false
    }).addTo(realFireLayer).bindPopup(
      `🔥 ${T('Ενεργή εστία (δορυφόρος VIIRS','Active hotspot (VIIRS satellite')}${sat})`
      + (near.region? `<br>${T('Κοντά σε','Near')}: <b>${near.region.n}</b> (~${Math.round(near.km)} ${T('χλμ','km')})`:'')
      + (f.frp? `<br>${T('Ισχύς ακτινοβολίας','Radiative power')}: ${Math.round(f.frp)} MW`:'')
      + ((f.count>1)? `<br>${T('Σημεία ανίχνευσης','Detection pixels')}: ${f.count}`:'')
      + `<br>${T('Αξιοπιστία','Confidence')}: ${confWord(f.conf)}<br>${f.date||''} ${f.time||''} UTC`);
  });
  const pill=document.getElementById('firesLivePill'); if(pill) pill.textContent = LIVE_FIRES.length;
  const dF=document.getElementById('dFIRMS'), mF=document.getElementById('mFIRMS');
  if(dF) dF.className='meter on';
  if(mF){ mF.textContent=(LIVE_FIRES.length>0? LIVE_FIRES.length+T(' ενεργές εστίες',' active fronts')+(srcLabel?' · '+srcLabel:'') : T('0 — καθαρά','0 — clear')); mF.className='engMeta live'; }
  if(fresh.length){ fireAlert(fresh[0].lat, fresh[0].lon, `${fresh.length} ${T('νέα ενεργά μέτωπα — δορυφορικός εντοπισμός (VIIRS)','new active fronts — satellite detection (VIIRS)')}`); }
  firstFireLoad=false;
  renderLiveFires(); // ζωντανή λίστα εστιών ανά περιοχή
  if(LAST_POINTS && LAST_POINTS.length) promitheasSay(LAST_POINTS); // ενημέρωσε το headline ώστε «να τα λέει σωστά»
}
// ---- Ζωντανές εστίες ανά περιοχή (καθαρή λίστα που «γράφει» ο ΠΡΟΜΗΘΕΑΣ) ----
function renderLiveFires(){
  const el=document.getElementById('liveFiresList'); if(!el) return;
  const fl=LIVE_FIRES||[];
  const stamp = firesLastCheck
    ? `<div class="lfStamp">🛰️ ${T('Τελευταίος έλεγχος δορυφόρου','Last satellite check')}: <b>${firesLastCheck.toLocaleTimeString(LOC,{hour:'2-digit',minute:'2-digit'})}</b> · ${T('αυτόματα κάθε 5′','auto every 5m')}</div>`
    : '';
  if(!fl.length){
    el.innerHTML = `<div class="lfEmpty">✅ ${T('Καμία ενεργή εστία σε ελληνικό έδαφος αυτή τη στιγμή.','No active hotspot on Greek territory right now.')}</div>`+stamp;
    return;
  }
  const rows=[...fl].sort((a,b)=>(+b.frp||0)-(+a.frp||0)).map(f=>{
    const nr=nearestRegion(f.lat,f.lon), nm=nr.region?nr.region.n:'—';
    const dir=nr.region?compass(bearing(nr.region.lat,nr.region.lon,f.lat,f.lon)):'';
    const where = nr.region ? `${Math.round(nr.km)} ${T('χλμ','km')} ${dir} ${T('από','of')} ${nm}` : `${f.lat.toFixed(2)}, ${f.lon.toFixed(2)}`;
    const w=fireWhen(f);
    const when = w ? `🛰️ ${w.loc} · <b>${w.rel}</b>` : '';
    const hot=(+f.frp||0)>=30?' hot':'';
    return `<button class="lfRow${hot}" type="button" data-lat="${f.lat}" data-lon="${f.lon}" aria-label="${nm}">`
      +`<span class="lfFlame">🔥</span>`
      +`<span class="lfMain"><b>${where}</b><small>${T('αξιοπιστία','confidence')} ${confWord(f.conf)}${f.count>1?' · '+f.count+' '+T('σημεία','px'):''}${when?' · '+when:''}</small></span>`
      +`<span class="lfFrp">${f.frp?Math.round(f.frp)+'<i>MW</i>':''}</span>`
      +`</button>`;
  }).join('');
  el.innerHTML = `<div class="lfCount">${fl.length} ${fl.length===1?T('ενεργή εστία τώρα','active hotspot now'):T('ενεργές εστίες τώρα','active hotspots now')}</div>`+rows+stamp;
  el.querySelectorAll('.lfRow').forEach(b=>b.addEventListener('click',()=>{
    const lat=+b.dataset.lat, lon=+b.dataset.lon;
    if(map) map.setView([lat,lon],10);
  }));
}
function firmsNoKey(){
  const pill=document.getElementById('firesLivePill'); if(pill) pill.textContent='—';
  const dF=document.getElementById('dFIRMS'), mF=document.getElementById('mFIRMS');
  if(dF) dF.className='meter warn'; if(mF) mF.textContent=T('δορυφόρος προσωρινά μη διαθέσιμος','satellite temporarily unavailable');
  const el=document.getElementById('liveFiresList');
  if(el){
    const stamp = firesLastCheck ? `<div class="lfStamp">🛰️ ${T('Τελευταία προσπάθεια','Last attempt')}: ${firesLastCheck.toLocaleTimeString(LOC,{hour:'2-digit',minute:'2-digit'})}</div>` : '';
    el.innerHTML = `<div class="lfEmpty">⚠️ ${T('Ο δορυφόρος NASA FIRMS δεν απαντά αυτή τη στιγμή. Νέα προσπάθεια αυτόματα σε λίγο…','NASA FIRMS satellite is not responding right now. Retrying automatically soon…')}</div>`+stamp;
  }
}
// Απευθείας από NASA FIRMS (CORS-enabled) — πολλαπλοί δορυφόροι· επιστρέφει ΑΚΑΤΕΡΓΑΣΤΑ (το φιλτράρισμα γίνεται στο normalizeFires)
async function fetchFiresClient(){
  if(!FIRMS_MAP_KEY) return null;
  const area='19.3,34.7,28.4,41.8'; // Ελλάδα: west,south,east,north
  const out=[]; let ok=false; // ok=true αν τουλάχιστον μία πηγή απάντησε (διαφορά «καμία φωτιά» από «αποτυχία σύνδεσης»)
  for(const [prod,label] of FIRMS_SOURCES){
    try{
      const res = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${FIRMS_MAP_KEY}/${prod}/${area}/1`);
      if(!res.ok) continue; // π.χ. 429 rate-limit → δοκίμασε την επόμενη πηγή
      const txt = await res.text(); ok=true;
      const rows=txt.trim().split(/\r?\n/); const head=(rows.shift()||'').split(',');
      const iLat=head.indexOf('latitude'),iLon=head.indexOf('longitude'),iConf=head.indexOf('confidence'),
            iDate=head.indexOf('acq_date'),iTime=head.indexOf('acq_time'),iFrp=head.indexOf('frp');
      for(const line of rows){ const c=line.split(','); if(c.length<3) continue;
        const lat=+c[iLat], lon=+c[iLon]; if(!lat||!lon) continue;
        out.push({lat,lon,conf:iConf>=0?c[iConf]:'',date:iDate>=0?c[iDate]:'',time:iTime>=0?c[iTime]:'',frp:iFrp>=0?(+c[iFrp]||0):0,sat:label}); }
    }catch(e){ /* αγνόησε αυτή την πηγή */ }
  }
  return ok ? out : null; // null = δεν απάντησε ΚΑΜΙΑ πηγή (αποτυχία)
}
async function loadRealFires(){
  firesLastCheck = new Date(); // πραγματικός χρόνος: πότε ελέγξαμε τελευταία φορά
  // 1) Backend (κλειδί κρυφό) όταν υπάρχει & είναι ενεργό
  try{
    const d = await (await fetch('api/fires')).json();
    if(d && d.ok && d.powered){ paintFires(normalizeFires(d.fires||[]), T('δορυφόρος','satellite')); return; }
  }catch(e){ /* δεν υπάρχει backend — πάμε σε client fallback */ }
  // 2) Fallback: απευθείας NASA FIRMS από τον browser (στατικό hosting / backend χωρίς κλειδί)
  const cf = await fetchFiresClient();
  if(cf){ paintFires(normalizeFires(cf), T('απευθείας δορυφόρος','direct satellite')); return; }
  // 3) Αποτυχία σύνδεσης με δορυφόρο
  firmsNoKey();
}

// ---- Ασφαλής Έξοδος (γεωεντοπισμός χρήστη) ----
function safeExit(){
  const box = document.getElementById('safeBox');
  const st  = document.getElementById('myStatus');
  if(!navigator.geolocation){ st.textContent=T('Η συσκευή δεν υποστηρίζει γεωεντοπισμό.','Your device does not support geolocation.'); return; }
  st.textContent = T('Εντοπισμός τοποθεσίας…','Locating…');
  navigator.geolocation.getCurrentPosition(async pos=>{
    const {latitude:lat, longitude:lon} = pos.coords;
    try{
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
        +`&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m`
        +`&daily=temperature_2m_max,wind_speed_10m_max,precipitation_sum&past_days=3&forecast_days=1&timezone=auto&wind_speed_unit=kmh`;
      const p = parsePoint(await (await fetch(url)).json(), {n:T('Η περιοχή μου','My area'),lat,lon});
      map.setView([lat,lon],11);
      if(userMarker) map.removeLayer(userMarker);
      userMarker = L.marker([lat,lon]).addTo(map).bindPopup(T('📍 Είσαι εδώ','📍 You are here')).openPopup();

      const fromDir = compass(p.wdir);              // απ' όπου φυσά ο άνεμος
      const fireDir = compass((p.wdir+180)%360);    // προς τα εκεί «τρέχει» η φωτιά
      const safe = destinationPoint(lat, lon, p.wdir, 8); // ~8χλμ αντίθετα στη φωτιά
      const gmaps = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${safe.lat.toFixed(5)},${safe.lon.toFixed(5)}&travelmode=driving`;
      st.textContent = `${T('Περιοχή σου: κατηγορία','Your area: category')} ${p.cat.idx} (${p.cat.label}).`;
      box.hidden=false;
      box.innerHTML = `<h4 style="color:${p.cat.color}">${T('Κίνδυνος','Risk')}: ${p.cat.idx} · ${p.cat.label} (${p.score}/100)</h4>
        🌡️ ${p.temp}°C · 💧 ${p.hum}% · 💨 ${p.wind} ${T('χλμ/η (φυσά από','km/h (blowing from')} ${fromDir})
        <div style="margin-top:10px">${T('Αν δεις φωτιά/καπνό, η πιθανή διάδοση είναι προς','If you see fire/smoke, likely spread is towards')} <b>${fireDir}</b>.</div>
        <div class="dir">🧭 ${T('Φύγε προς','Head towards')} ${fromDir} ${T('(αντίθετα στη φωτιά)','(away from the fire)')}</div>
        <ul>
          <li>${T('Κινήσου <b>μακριά από τον καπνό</b>, ποτέ προς τα εκεί.','Move <b>away from the smoke</b>, never towards it.')}</li>
          <li>${T('<b>Ποτέ ανηφόρα</b> — η φωτιά τρέχει γρήγορα στην ανηφόρα.','<b>Never uphill</b> — fire races fast uphill.')}</li>
          <li>${T('Κατευθύνσου σε <b>ανοιχτό χώρο, δρόμο ή θάλασσα</b>.','Head to an <b>open area, road or the sea</b>.')}</li>
          <li>${T('Πάρε νερό, σκέπασε μύτη/στόμα με βρεγμένο ύφασμα.','Take water, cover nose/mouth with a wet cloth.')}</li>
          <li>${T('Κάλεσε <b>112</b> και ειδοποίησε γείτονες.','Call <b>112</b> and warn your neighbours.')}</li>
        </ul>
        <a class="bigBtn safe gmapsBtn" target="_blank" rel="noopener" href="${gmaps}">🧭 ${T('Πλοήγηση διαφυγής (Google Maps)','Escape navigation (Google Maps)')}</a>`;
    }catch(e){ st.textContent=T('Σφάλμα λήψης δεδομένων περιοχής.','Error fetching area data.'); }
  }, ()=>{ st.textContent=T('Δεν δόθηκε άδεια τοποθεσίας. Επίτρεψέ την για οδηγίες διαφυγής.','Location permission denied. Allow it for escape guidance.'); },
  {enableHighAccuracy:true, timeout:10000});
}

// ---- Αναφορές πολιτών (localStorage + χάρτης) ----
const REP_KEY='promitheas_reports';
const getReports = ()=>{ try{return JSON.parse(localStorage.getItem(REP_KEY)||'[]')}catch{return[]} };
const sevLabel = s=>(LANG==='en'?{smoke:'Smoke/smell',flames:'Visible flames',spreading:'Spreading fast'}:{smoke:'Καπνός/μυρωδιά',flames:'Ορατές φλόγες',spreading:'Επεκτείνεται'})[s]||s;
function renderReports(){
  reportsLayer.clearLayers();
  const list=document.getElementById('reportList'); list.innerHTML='';
  const reps=getReports().slice(-6).reverse();
  reps.forEach(r=>{
    if(r.lat) L.circleMarker([r.lat,r.lon],{radius:8,color:'#fff',weight:1,fillColor:'#ff7a3c',fillOpacity:.9})
      .addTo(reportsLayer).bindPopup(`📢 ${T('Αναφορά πολίτη','Citizen report')}<br><b>${sevLabel(r.sev)}</b><br>${r.text||''}`);
    const t = new Date(r.time).toLocaleTimeString(LOC,{hour:'2-digit',minute:'2-digit'});
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
      stat(`${top.cat.idx}/5`,T('Εθνικός κίνδυνος','National risk'),top.cat.color)
    + stat(high,T('Περιοχές σε υψηλό (3+)','Areas at high risk (3+)'),high?'#ff9f1c':'#2ec36b')
    + stat(`${avg}/100`,T('Μέση βαθμολογία','Average score'))
    + stat(reps.length,T('Αναφορές πολιτών','Citizen reports'),reps.length?'#ff7a3c':'#94a6bf')
    + stat(pts.length,T('Περιοχές υπό παρακολούθηση','Areas monitored'),'#8ff6ff')
    + stat(UNITS.length,T('Πυροσβεστικά μέσα (demo)','Fire units (demo)'),'#ff7a3c');
  const rows = pts.map((p,i)=>`<tr>
      <td>${i+1}</td><td><b>${p.n}</b></td>
      <td><span class="tBadge" style="background:${p.cat.color}">${p.cat.idx}</span>${p.cat.label}</td>
      <td>${p.score}/100</td><td>${p.temp}°C</td><td>${p.hum}%</td><td>${p.wind} ${compass(p.wdir)}</td></tr>`).join('');
  document.getElementById('authTable').innerHTML =
    `<thead><tr><th>#</th><th>${T('Περιοχή','Area')}</th><th>${T('Κίνδυνος','Risk')}</th><th>Score</th><th>🌡️</th><th>💧</th><th>💨 ${T('χλμ/η','km/h')}</th></tr></thead><tbody>${rows}</tbody>`;
  document.getElementById('authReports').innerHTML = reps.slice().reverse().map(r=>{
      const t=new Date(r.time).toLocaleString(LOC);
      return `<div class="repItem"><b>${sevLabel(r.sev)}</b> · ${t}${r.lat?` · 📍 ${r.lat.toFixed(3)},${r.lon.toFixed(3)}`:''}<br>${r.text||''}</div>`;
    }).join('') || '<p class="muted">'+T('Καμία αναφορά πολίτη ακόμη.','No citizen reports yet.')+'</p>';
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
  const fl = LIVE_FIRES||[];
  const fireLine = fl.length
    ? `${fl.length} ${fl.length===1?'ενεργό μέτωπο':'ενεργά μέτωπα'} — `+fl.slice(0,8).map(f=>{const nr=nearestRegion(f.lat,f.lon);return `${nr.region?nr.region.n:'—'}${f.frp?' '+Math.round(f.frp)+'MW':''}`;}).join(', ')
    : 'καμία επιβεβαιωμένη ενεργή εστία σε ελληνικό έδαφος αυτή τη στιγμή';
  return [
    `Ημερομηνία: ${new Date().toLocaleDateString('el-GR')}.`,
    `Εθνικός κίνδυνος: κατηγορία ${top.cat.idx}/5 (${top.cat.label}).`,
    `Περιοχές αυξημένου κινδύνου (κατ.3+): ${high.length? high.join(' | ') : 'καμία αυτή τη στιγμή'}.`,
    `Ενεργές δορυφορικές εστίες (NASA FIRMS, τελευταίο 24ωρο, φιλτραρισμένες ως προς θόρυβο & ομαδοποιημένες): ${fireLine}.`,
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
  chatAdd(T('Εσύ:','You:'), text.replace(/[<>]/g,''), 'cUser');
  const thinking=chatAdd(T('ΠΡΟΜΗΘΕΑΣ:','PROMITHEAS:'), '<span class="muted">'+T('σκέφτεται…','thinking…')+'</span>', 'cBot');
  try{
    const r=await fetch('api/chat',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:text, context:buildContext(), history:chatHistory})});
    const d=await r.json();
    if(d && d.ok && d.reply){
      thinking.innerHTML=`<b>${T('ΠΡΟΜΗΘΕΑΣ:','PROMITHEAS:')}</b> `+d.reply.replace(/[<>]/g,'').replace(/\n/g,'<br>');
      chatHistory.push({role:'user',content:text},{role:'assistant',content:d.reply});
      if(chatHistory.length>12) chatHistory=chatHistory.slice(-12);
    } else { throw new Error((d&&d.error)||'no reply'); }
  }catch(e){
    thinking.innerHTML=`<b>${T('ΠΡΟΜΗΘΕΑΣ:','PROMITHEAS:')}</b> <span class="muted">${T('Ο Εγκέφαλος ΠΡΟΜΗΘΕΑΣ θα είναι διαθέσιμος στην πλήρη έκδοση (backend στο Render). Σε λίγο online!','The PROMITHEAS Brain will be available in the full version (Render backend). Online soon!')}</span>`;
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

// ---- Στατικά κείμενα HTML στα Αγγλικά (όταν ?lang=en) ----
function applyStaticI18n(){
  if(LANG!=='en') return;
  document.documentElement.lang='en';
  const set=(sel,txt)=>{ const e=document.querySelector(sel); if(e) e.textContent=txt; };
  const html=(sel,h)=>{ const e=document.querySelector(sel); if(e) e.innerHTML=h; };
  const attr=(sel,a,v)=>{ const e=document.querySelector(sel); if(e) e.setAttribute(a,v); };
  const cardHead=(id,txt)=>{ const e=document.getElementById(id); const b=e&&e.closest('.card')&&e.closest('.card').querySelector('.cardHead b'); if(b) b.textContent=txt; };

  set('.brandHQtext small','Wildfire Prevention & Protection HQ');
  set('.natRiskLabel','National Risk');
  set('#authBtn','🚒 Authorities'); attr('#authBtn','title','View for Authorities / Municipalities / Fire Service');
  set('#statusStrip','Calculating national wildfire risk…');

  html('#legend','<b>Wildfire risk</b>'
    +'<span><i style="background:#2ec36b"></i>1 · Low</span>'
    +'<span><i style="background:#ffd23f"></i>2 · Moderate</span>'
    +'<span><i style="background:#ff9f1c"></i>3 · High</span>'
    +'<span><i style="background:#ff3b30"></i>4 · Very high</span>'
    +'<span><i style="background:#b026ff"></i>5 · Alarm</span>'
    +'<span style="margin-top:7px;padding-top:7px;border-top:1px solid var(--line2)">🔥 Live hotspot (satellite)</span>');
  set('#locateBtn','📍 Find me'); attr('#locateBtn','title','Find me & Safe Exit');
  html('#loadingMap','<span class="spin"></span> Loading live data…');

  html('.card.promitheas .cardHead b','🧠 Ask PROMITHEAS');
  attr('#chatExpand','title','Maximise'); attr('#chatExpand','aria-label','Maximise');
  set('#aiSay','Reading the weather across Greece…');
  const qb=document.querySelectorAll('.qBtn');
  if(qb[0]){ qb[0].textContent='Where is the risk?'; qb[0].dataset.q='Where is the greatest wildfire risk right now and why?'; }
  if(qb[1]){ qb[1].textContent='Multiple fires'; qb[1].dataset.q='I have simultaneous fires in different areas. Help me prioritise and allocate the resources.'; }
  if(qb[2]){ qb[2].textContent='Protect a settlement'; qb[2].dataset.q='What protective measures should a settlement near a forest take today?'; }
  attr('#chatInput','placeholder','e.g. "Are settlements at risk in Thebes?"');
  set('#aiStatus','🧠 PROMITHEAS Brain — active in the full version (backend).');

  html('.liveFires .cardHead b','🔥 Live hotspots by area');
  { const p=document.querySelector('.liveFires .lf-note'); if(p) p.innerHTML='Active hotspots over the last 24h (VIIRS satellites), noise-filtered &amp; clustered by area. New hotspot → auto-alert. Tap a hotspot to zoom the map.'; }

  html('.aiEngines .cardHead b','🧠 AI Engines · Live status');
  set('.gaugeReadout small','out of 100 · national index');
  set('#gaugeCat','calculating…');
  const enr=document.querySelectorAll('.engName');
  if(enr[0]) enr[0].innerHTML='Risk Model <b>FWI-ML</b>';
  if(enr[1]) enr[1].innerHTML='AI Advisor <b>PROMITHEAS Brain</b>';
  if(enr[2]) enr[2].innerHTML='Satellite hotspots <b>NASA FIRMS</b>';
  if(enr[3]) enr[3].innerHTML='Weather <b>Open-Meteo</b>';
  html('.aiEngines p.muted','Real indicators, live. <b>FWI</b> methodology — the international fire-danger standard of <b>EFFIS</b> & fire services.');

  cardHead('natForecast','📅 Risk forecast · 5 days');
  { const e=document.getElementById('natForecast'); const p=e&&e.parentElement.querySelector('p.muted'); if(p) p.innerHTML='National view: the country\'s <b>average</b> daily risk index (0-100), from the weather forecast.'; }

  cardHead('safeBtn','📍 My location');
  set('#myStatus','Tap "Safe Exit" to check your area and get escape guidance.');
  set('#safeBtn','🧭 Safe Exit');

  cardHead('layerBtns','🗺️ Map layers (satellite)');
  { const c=document.getElementById('layerBtns'); const ps=c&&c.closest('.card').querySelectorAll('p.muted');
    if(ps&&ps[0]) ps[0].textContent='Official EFFIS/Copernicus data — tap to show/hide on the map.';
    if(ps&&ps[1]) ps[1].innerHTML='🔴 Live hotspots (NASA FIRMS): <b id="firesLivePill" style="color:#ff7a3c">—</b> · <b>auto-alert</b> on a new hotspot.';
    if(ps&&ps[2]) ps[2].innerHTML='🛰️ active hotspots (VIIRS/MODIS) · 🔥 official fire-danger map (FWI) · 🌳 burnt areas this year.'; }

  cardHead('spreadBtn','🚒 Operations tools');
  set('#unitsBtn','🚒 Fire units'); set('#spreadBtn','🔥 Spread simulation'); set('#alarmBtn','🚨 Alarm test');
  { const c=document.getElementById('spreadBtn'); const p=c&&c.closest('.card').querySelector('p.muted'); if(p) p.innerHTML='🚒 Units = <b>sample</b> (connects to a real fleet/AVL). 🔥 Spread: click a point → 3 nearest units & arrival time. 🚨 Alarm: sound + map animation — when fully connected it <b>triggers automatically from satellite detection</b>.'; }

  cardHead('regSearch','⚠️ Areas at risk');
  attr('#regSearch','placeholder','🔎 Find municipality / area / island…');

  cardHead('reportBtn','📢 Report fire / smoke');
  { const c=document.getElementById('reportBtn'); const p=c&&c.closest('.card').querySelector('p.muted'); if(p) p.textContent='Help spot it early. Your report goes on the map.'; }
  set('#reportBtn','📷 New report');

  const fs=document.querySelectorAll('.hqFooter span');
  if(fs[0]) fs[0].textContent='Sources: Open-Meteo (weather) · NASA FIRMS (hotspots) · Copernicus EFFIS (risk index)';
  if(fs[1]) fs[1].innerHTML='⚠️ Awareness support tool. In an emergency call <b>112</b> and follow Civil Protection.';

  set('#reportModal h3','📢 Fire / smoke report');
  { const p=document.querySelector('#reportModal .muted'); if(p) p.textContent='Your location is taken from your phone (if you allow it).'; }
  attr('#reportText','placeholder','What do you see? (e.g. smoke over the mountain, burning smell…)');
  { const o=document.querySelectorAll('#reportSeverity option'); if(o[0])o[0].textContent='Smoke / smell'; if(o[1])o[1].textContent='Visible flames'; if(o[2])o[2].textContent='Spreading fast'; }
  set('#reportSubmit','Send report');
  { const w=document.querySelector('#reportModal .warn'); if(w) w.innerHTML='For emergencies: <b>112</b> / Fire Service <b>199</b>.'; }

  set('#authView .authTop h2','🚒 Authorities & Municipalities HQ');
  set('#authClose','← Back to citizen view');
  { const h=document.querySelectorAll('#authView h3'); if(h[0])h[0].textContent='📊 All areas (by risk)'; if(h[1])h[1].textContent='📢 Citizen reports'; }
  { const p=document.querySelector('#authView .muted.small'); if(p) p.innerHTML='Demo version for Authorities/Municipalities. In full deployment (like Pano AI / Technosylva / ALERTCalifornia / NOA FireHub): a network of <b>AI early smoke-detection cameras</b>, a <b>fire-spread model & “time to arrival”</b>, <b>field push alerts</b>, integration with 112 / Fire Service / Civil Protection, and incident history/analytics.'; }
}

// ---- Εκκίνηση ----
async function boot(){
  applyStaticI18n();
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
    catch(e){ document.getElementById('aiSay').textContent=T('⚠️ Δεν φορτώθηκαν τα δεδομένα καιρού. Δοκίμασε ανανέωση.','⚠️ Weather data could not be loaded. Try refreshing.'); console.error(e); }
    load.style.display='none';
  }
  await refresh();
  initLayers();
  loadRealFires(); setInterval(loadRealFires, 5*60*1000);
  checkAIBrain(); setInterval(checkAIBrain, 5*60*1000);
  setInterval(refresh, REFRESH_MS);
}
document.addEventListener('DOMContentLoaded', boot);
