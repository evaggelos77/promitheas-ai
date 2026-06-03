'use strict';
/**
 * ΠΡΟΜΗΘΕΑΣ AI — backend (zero-dependency Node).
 * Serves the static platform + /api/chat (GPT-4o «αρχιπύραρχος» σύμβουλος, grounded στα ζωντανά δεδομένα).
 * EV LABS AI.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// ---- Minimal .env loader (zero-dep) ----
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (val && !process.env[m[1]]) process.env[m[1]] = val;
    }
  }
} catch (e) { /* ignore */ }

const PORT = process.env.PORT || 8131;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const FIRMS_MAP_KEY = process.env.FIRMS_MAP_KEY || '';

// ---- Ο εγκέφαλος: εκπαιδευμένος σαν αξιωματικός Πυροσβεστικής / Πολιτικής Προστασίας ----
const SYSTEM = [
  'Είσαι ο ΠΡΟΜΗΘΕΑΣ — ο AI σύμβουλος επιχειρήσεων δασοπυρόσβεσης & πολιτικής προστασίας της ομώνυμης πλατφόρμας (EV LABS AI), για την Ελλάδα.',
  'Είσαι εκπαιδευμένος σαν έμπειρος αξιωματικός Πυροσβεστικής και συντονιστής Πολιτικής Προστασίας. Γνωρίζεις: συμπεριφορά & εξάπλωση πυρκαγιάς (άνεμος, κλίση εδάφους, καύσιμη ύλη, αναζωπυρώσεις), τακτικές κατάσβεσης, εναέρια & επίγεια μέσα, οργάνωση εκκένωσης & ασφαλείς διαδρομές, προστασία οικισμών, και τις λειτουργίες αυτής της πλατφόρμας (κίνδυνος ανά περιοχή, 5ήμερη πρόβλεψη, δορυφορικές εστίες EFFIS, χάρτης επικινδυνότητας FWI, καμένες, προσομοίωση εξάπλωσης, πλησιέστερα μέσα & χρόνος άφιξης).',
  '',
  'ΓΛΩΣΣΑ: Απάντα στη γλώσσα του χρήστη (προεπιλογή Ελληνικά). Επαγγελματικός, ψύχραιμος, αποφασιστικός.',
  'ΥΦΟΣ: Σύντομα και επιχειρησιακά, με σειρά προτεραιότητας. Όταν βοηθά, χρησιμοποίησε σύντομα bullets. Δώσε ΣΥΓΚΕΚΡΙΜΕΝΑ, εφαρμόσιμα βήματα — όχι γενικότητες.',
  'ΠΡΟΤΕΡΑΙΟΤΗΤΑ ΠΑΝΤΑ: 1) ανθρώπινη ζωή, 2) κατοικημένες περιοχές/οικισμοί, 3) κρίσιμες υποδομές, 4) δάσος/περιουσία.',
  '',
  'ΔΕΔΟΜΕΝΑ: Σου δίνεται «ΖΩΝΤΑΝΗ ΕΙΚΟΝΑ» (κίνδυνος ανά περιοχή, πρόβλεψη, άνεμος, διαθέσιμα μέσα). Βάσισε την ανάλυσή σου σε αυτά συν τη γνώση σου για την ελληνική γεωγραφία. Αν λείπει στοιχείο, πες το καθαρά — ΜΗΝ εφευρίσκεις νούμερα ή τοποθεσίες.',
  'ΠΟΛΛΑΠΛΑ ΜΕΤΩΠΑ: Αν υπάρχουν ταυτόχρονες φωτιές, βοήθησε σε ΤΡΙΑΖ: ποιο μέτωπο πρώτα (απειλή ζωής/οικισμών, ένταση & κατεύθυνση ανέμου, διαθεσιμότητα & χρόνος άφιξης μέσων) και πώς να κατανεμηθούν τα μέσα. Εξήγησε σύντομα το «γιατί».',
  'ΑΣΦΑΛΕΙΑ & ΟΡΙΑ: Είσαι ΥΠΟΣΤΗΡΙΚΤΙΚΟ εργαλείο λήψης απόφασης. Σε πραγματικό συμβάν, η τελική ευθύνη/απόφαση είναι του επικεφαλής στο πεδίο και του 199/112· οι πολίτες καλούν 112. Ανάφερέ το όταν χρειάζεται, χωρίς να γίνεσαι κουραστικός.',
  'Κάνε τον χειριστή να νιώθει ότι έχει δίπλα του έναν ικανό, ήρεμο σύμβουλο.'
].join('\n');

async function askOpenAI(messages, maxTokens = 600) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28000);
  try {
    const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({ model: OPENAI_MODEL, messages, temperature: 0.5, max_tokens: maxTokens }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error('OpenAI ' + res.status);
    const d = await res.json();
    return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content || '').trim();
  } finally { clearTimeout(timeout); }
}

async function promitheasReply(message, context, history) {
  if (!OPENAI_API_KEY) {
    return { reply: 'Ο AI εγκέφαλος δεν είναι ενεργός σε αυτό το περιβάλλον (λείπει το κλειδί OpenAI). Στην πλήρη έκδοση απαντώ με ζωντανή ανάλυση των δεδομένων.', powered: false };
  }
  const sys = SYSTEM + '\n\nΖΩΝΤΑΝΗ ΕΙΚΟΝΑ (τρέχοντα δεδομένα πλατφόρμας):\n' + (context || '(δεν δόθηκε)');
  const msgs = [{ role: 'system', content: sys }];
  for (const h of (history || []).slice(-8)) if (h && h.role && h.content)
    msgs.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: String(h.content).slice(0, 900) });
  msgs.push({ role: 'user', content: String(message).slice(0, 1200) });
  const reply = await askOpenAI(msgs, 600);
  return { reply: reply || 'Δεν μπόρεσα να επεξεργαστώ το αίτημα. Δοκίμασε ξανά.', powered: true };
}

// ---- NASA FIRMS: πραγματικές ενεργές εστίες (server-side, το κλειδί ΔΕΝ φτάνει στον browser) ----
let firesCache = { t: 0, data: null };
async function fetchFires(){
  if(!FIRMS_MAP_KEY) return { ok:true, powered:false, fires:[], count:0 };
  if(firesCache.data && (Date.now() - firesCache.t) < 5*60*1000) return firesCache.data; // cache 5'
  const area = '19.3,34.7,28.4,41.8'; // Ελλάδα: west,south,east,north
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${FIRMS_MAP_KEY}/VIIRS_SNPP_NRT/${area}/1`;
  const res = await fetch(url);
  const txt = await res.text();
  const rows = txt.trim().split(/\r?\n/);
  const head = (rows.shift()||'').split(',');
  const iLat=head.indexOf('latitude'), iLon=head.indexOf('longitude'), iConf=head.indexOf('confidence'), iDate=head.indexOf('acq_date'), iTime=head.indexOf('acq_time'), iFrp=head.indexOf('frp');
  const fires=[];
  for(const line of rows){
    const c=line.split(','); if(c.length<3) continue;
    const lat=+c[iLat], lon=+c[iLon]; if(!lat||!lon) continue;
    fires.push({ lat, lon, conf:(iConf>=0?c[iConf]:''), date:(iDate>=0?c[iDate]:''), time:(iTime>=0?c[iTime]:''), frp:(iFrp>=0?+c[iFrp]:0)||0 });
  }
  const out = { ok:true, powered:true, fires, count:fires.length };
  firesCache = { t: Date.now(), data: out };
  return out;
}

// ---- helpers ----
function commonHeaders(extra = {}) {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'X-Content-Type-Options': 'nosniff', ...extra };
}
function sendJson(res, code, payload) {
  res.writeHead(code, commonHeaders({ 'Content-Type': 'application/json; charset=utf-8' }));
  res.end(JSON.stringify(payload)); return true;
}
function sendText(res, code, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(code, commonHeaders({ 'Content-Type': type })); res.end(body); return true;
}
function sendFile(res, fp) {
  if (!fs.existsSync(fp)) return sendText(res, 404, 'Not found.');
  const ext = path.extname(fp).toLowerCase();
  const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
    '.js':'application/javascript; charset=utf-8', '.json':'application/json; charset=utf-8',
    '.webmanifest':'application/manifest+json; charset=utf-8',
    '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.ico':'image/x-icon' };
  res.writeHead(200, commonHeaders({ 'Content-Type': types[ext] || 'application/octet-stream' }));
  fs.createReadStream(fp).pipe(res); return true;
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = ''; req.on('data', c => { b += c; if (b.length > 1_000_000) reject(new Error('too large')); });
    req.on('end', () => { if (!b.trim()) return resolve({}); try { resolve(JSON.parse(b)); } catch (e) { reject(e); } });
  });
}

function handleApi(req, res, url) {
  const p = url.pathname;
  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });
  if (req.method === 'GET' && p === '/api/health')
    return sendJson(res, 200, { ok: true, ai: { powered: !!OPENAI_API_KEY, model: OPENAI_API_KEY ? OPENAI_MODEL : 'offline' } });
  if (req.method === 'POST' && p === '/api/chat')
    return readBody(req).then(async b => {
      const msg = String(b.message || '').trim();
      if (!msg) return sendJson(res, 400, { ok: false, error: 'Empty message.' });
      try {
        const out = await promitheasReply(msg, b.context, b.history);
        sendJson(res, 200, { ok: true, ...out });
      } catch (e) { sendJson(res, 200, { ok: false, error: 'AI error: ' + e.message }); }
    }).catch(e => sendJson(res, 500, { ok: false, error: e.message }));
  if (req.method === 'GET' && p === '/api/fires')
    return fetchFires().then(d => sendJson(res, 200, d)).catch(e => sendJson(res, 200, { ok:false, error:e.message, fires:[] }));
  return false;
}

function tryStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/health') return sendJson(res, 200, { ok: true, status: 'online' });
  if (p === '/' || p === '') p = '/index.html';
  const base = path.basename(p);
  if (base === '.env' || base === 'server.js' || base.startsWith('.')) return sendText(res, 404, 'Not found.');
  const fp = path.join(ROOT, p.replace(/^\/+/, ''));
  if (fp.startsWith(ROOT) && fs.existsSync(fp) && fs.statSync(fp).isFile()) return sendFile(res, fp);
  return sendText(res, 404, 'Not found.');
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      const handled = handleApi(req, res, url);
      if (handled && typeof handled.then === 'function') handled.catch(e => sendJson(res, 500, { ok: false, error: e.message }));
      else if (!handled) sendJson(res, 404, { ok: false, error: 'API route not found' });
      return;
    }
    return tryStatic(req, res, url);
  } catch (e) { sendJson(res, 500, { ok: false, error: e.message }); }
});

server.listen(PORT, HOST, () => {
  console.log(`ΠΡΟΜΗΘΕΑΣ online → http://localhost:${PORT}/  | AI: ${OPENAI_API_KEY ? 'powered ('+OPENAI_MODEL+')' : 'offline (no key)'}`);
  const SELF_URL = process.env.RENDER_EXTERNAL_URL || '';
  if (SELF_URL && typeof fetch === 'function') setInterval(() => { fetch(`${SELF_URL}/health`).catch(() => {}); }, 10 * 60 * 1000);
});
