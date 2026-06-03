/* ============================================================
   ΠΡΟΜΗΘΕΑΣ AI — Αρχηγείο Πρόληψης Φωτιάς
   EV LABS AI · ζωντανά δεδομένα (Open-Meteo) + δείκτης κινδύνου
   ============================================================ */

// ---- Ρυθμίσεις ----
// Δωρεάν κλειδί NASA FIRMS (ενεργές εστίες) από: https://firms.modaps.eosdis.nasa.gov/api/area/
// Άφησέ το κενό αν δεν έχεις ακόμη — η εφαρμογή δουλεύει κανονικά χωρίς αυτό.
const FIRMS_MAP_KEY = '';
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

// ---- Υπολογισμός δείκτη κινδύνου (0-100) από ζωντανό καιρό ----
function fireRisk({temp,hum,wind,rain3}){
  const t = clamp((temp-22)/16, 0,1);   // 22°C→0, 38°C→1
  const h = clamp((45-hum)/35, 0,1);    // 45%→0, 10%→1 (ξηρό = κίνδυνος)
  const w = clamp((wind-10)/45, 0,1);   // 10→0, 55 χλμ/η→1
  const d = clamp((8-rain3)/8, 0,1);    // 8mm+ βροχή→0, 0mm→1
  const score = 100*(0.28*t + 0.24*h + 0.30*w + 0.18*d);
  return Math.round(score);
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
  renderList(sorted.slice(0,8));
  setStatusStrip(top);
  renderForecast(sorted);
  const ut=document.getElementById('updTime'); if(ut) ut.textContent='ανανέωση '+new Date().toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'});
  promitheasSay(sorted);
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
    const maxCat=points.reduce((m,p)=>{ const f=p.forecast[d]; return f && f.cat.idx>m ? f.cat.idx : m; }, 1);
    const c=CAT[maxCat-1];
    const dt=new Date(points[0].forecast[d].date);
    const lbl = d===0?'Σήμ.' : d===1?'Αύρ.' : dt.toLocaleDateString('el-GR',{weekday:'short'}).replace('.','');
    html+=`<div class="fcDay"><span class="fcLbl">${lbl}</span><span class="fcDot" style="background:${c.color}">${maxCat}</span></div>`;
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
  // Πρόβλεψη επόμενων ημερών
  const fdays = sorted[0].forecast || [];
  if(fdays.length>1){
    const natCat = d => sorted.reduce((m,p)=>{ const f=p.forecast[d]; return f && f.cat.idx>m ? f.cat.idx : m; }, 1);
    const todayC = natCat(0); let worst=todayC, worstD=0;
    for(let d=1; d<Math.min(5,fdays.length); d++){ const c=natCat(d); if(c>worst){ worst=c; worstD=d; } }
    if(worst>todayC){
      const dt=new Date(fdays[worstD].date).toLocaleDateString('el-GR',{weekday:'long'});
      msg += `\n📅 Προσοχή: ο κίνδυνος ανεβαίνει σε «${CAT[worst-1].label}» την ${dt}.`;
    } else {
      msg += `\n📅 Επόμενες μέρες: ο κίνδυνος παραμένει γύρω στο «${top.cat.label}».`;
    }
  }
  document.getElementById('aiSay').textContent = msg;
}

// ---- Ενεργές εστίες — EFFIS / Copernicus WMS (δημόσιο, ΧΩΡΙΣ κλειδί) ----
let firesLayer = null, firesOn = true;
function loadFires(){
  const pill = document.getElementById('firesPill');
  const note = document.getElementById('firesNote');
  try{
    if(!firesLayer){
      firesLayer = L.tileLayer.wms('https://maps.effis.emergency.copernicus.eu/effis', {
        layers:'all.hs', format:'image/png', transparent:true, version:'1.3.0',
        opacity:0.95, attribution:'Εστίες: EFFIS / Copernicus'
      });
      firesLayer.on('tileerror', ()=>{ note.textContent='Το επίπεδο εστιών δεν αποκρίνεται προσωρινά.'; });
    }
    if(firesOn) firesLayer.addTo(map);
    pill.textContent = firesOn ? 'ON' : 'OFF';
    note.innerHTML = 'Ζωντανός δορυφορικός εντοπισμός φωτιάς (EFFIS/Copernicus — VIIRS &amp; MODIS, τελευταίες ώρες). Κόκκινα σημεία στον χάρτη όταν υπάρχουν εντοπισμοί.';
  }catch(e){
    pill.textContent='—';
    note.textContent='Δεν φορτώθηκε το επίπεδο εστιών.';
  }
}
function toggleFires(){
  if(!firesLayer){ loadFires(); return; }
  firesOn = !firesOn;
  if(firesOn) firesLayer.addTo(map); else map.removeLayer(firesLayer);
  document.getElementById('firesPill').textContent = firesOn ? 'ON' : 'OFF';
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
    + stat(pts.length,'Περιοχές υπό παρακολούθηση','#8ff6ff');
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
  document.getElementById('authBtn').onclick=openAuth;
  document.getElementById('authClose').onclick=()=>document.getElementById('authView').hidden=true;
  document.getElementById('firesToggle').onclick=toggleFires;

  async function refresh(){
    const load=document.getElementById('loadingMap'); load.style.display='flex';
    try{ render(await fetchAll()); }
    catch(e){ document.getElementById('aiSay').textContent='⚠️ Δεν φορτώθηκαν τα δεδομένα καιρού. Δοκίμασε ανανέωση.'; console.error(e); }
    load.style.display='none';
  }
  await refresh();
  loadFires();
  setInterval(refresh, REFRESH_MS);
}
document.addEventListener('DOMContentLoaded', boot);
