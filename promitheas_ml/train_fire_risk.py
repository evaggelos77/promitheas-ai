# -*- coding: utf-8 -*-
"""
ΠΡΟΜΗΘΕΑΣ — Trained ML μοντέλο κινδύνου δασικής πυρκαγιάς.

Pivot του RIBAS ML engine (gradient-boosting ensemble) από το τυχαίο Τζόκερ
σε ΠΡΑΓΜΑΤΙΚΟ σήμα: το διεθνές επιστημονικό Canadian Fire Weather Index (FWI),
το ίδιο σύστημα που χρησιμοποιεί το EFFIS & οι πυροσβεστικές υπηρεσίες.

Inputs (ίδια με τον ΠΡΟΜΗΘΕΑ): temperature_max(°C), humidity(%), wind(km/h), rain3(mm/3 ημέρες)
Output: calibrated risk 0-100 (κατηγορίες 1-5).

Εκπαιδεύει GradientBoostingRegressor και το εξάγει σε zero-dependency fire_model.js.
EV LABS AI.
"""
import os, json, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error

RNG = np.random.default_rng(7)
HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
JS_OUT = os.path.join(PROJ, "fire_model.js")
N = 140_000

# ----- Day-length factors ανά μήνα (Van Wagner FWI) -----
LE = {5:13.9, 6:13.9, 7:12.4, 8:10.9, 9:9.4, 4:12.8, 10:8.0}      # DMC
LF = {5:3.8, 6:5.8, 7:6.4, 8:5.0, 9:2.4, 4:0.9, 10:0.4}            # DC

# ============================================================
#  CANADIAN FOREST FIRE WEATHER INDEX (FWI) — vectorized numpy
# ============================================================
def ffmc(T, H, W, ro, Fo):
    H = np.clip(H, 0, 100)
    mo = 147.2*(101-Fo)/(59.5+Fo)
    rf = np.maximum(ro-0.5, 0.0)
    rfx = np.where(rf > 0, rf, 1.0)
    mr = mo + 42.5*rf*np.exp(-100/(251-mo))*(1-np.exp(-6.93/rfx))
    mr = mr + np.where(mo > 150, 0.0015*np.maximum(mo-150,0)**2*np.sqrt(rf), 0.0)
    mr = np.minimum(mr, 250)
    mo = np.where(ro > 0.5, mr, mo)
    Ed = 0.942*H**0.679 + 11*np.exp((H-100)/10) + 0.18*(21.1-T)*(1-np.exp(-0.115*H))
    ko = 0.424*(1-(H/100)**1.7) + 0.0694*np.sqrt(W)*(1-(H/100)**8)
    kd = ko*0.581*np.exp(0.0365*T)
    m_dry = Ed + (mo-Ed)*10.0**(-kd)
    Ew = 0.618*H**0.753 + 10*np.exp((H-100)/10) + 0.18*(21.1-T)*(1-np.exp(-0.115*H))
    kl = 0.424*(1-((100-H)/100)**1.7) + 0.0694*np.sqrt(W)*(1-((100-H)/100)**8)
    kw = kl*0.581*np.exp(0.0365*T)
    m_wet = Ew - (Ew-mo)*10.0**(-kw)
    m = np.where(mo > Ed, m_dry, np.where(mo < Ew, m_wet, mo))
    F = 59.5*(250-m)/(147.2+m)
    return np.clip(F, 0, 101)

def dmc(T, H, ro, Po, Le):
    Tc = np.maximum(T, -1.1)
    rk = 1.894*(Tc+1.1)*(100-np.clip(H,0,100))*Le*1e-4
    re = 0.92*ro - 1.27
    mo = 20 + np.exp(5.6348 - Po/43.43)
    b = np.where(Po <= 33, 100/(0.5+0.3*Po),
        np.where(Po <= 65, 14-1.3*np.log(np.maximum(Po,1)), 6.2*np.log(np.maximum(Po,1))-17.2))
    mr = mo + 1000*re/(48.77+b*re)
    Pr = np.maximum(244.72 - 43.43*np.log(np.maximum(mr-20, 1e-6)), 0)
    Po2 = np.where((ro > 1.5) & (re > 0), Pr, Po)
    return np.maximum(Po2 + rk, 0)

def dc(T, ro, Do, Lf):
    Tc = np.maximum(T, -2.8)
    V = np.maximum(0.36*(Tc+2.8) + Lf, 0)
    rd = 0.83*ro - 1.27
    Qo = 800*np.exp(-Do/400)
    Qr = Qo + 3.937*rd
    Dr = np.maximum(400*np.log(800/np.maximum(Qr, 1e-6)), 0)
    Do2 = np.where((ro > 2.8) & (rd > 0), Dr, Do)
    return np.maximum(Do2 + 0.5*V, 0)

def isi(F, W):
    m = 147.2*(101-F)/(59.5+F)
    fW = np.exp(0.05039*W)
    fF = 91.9*np.exp(-0.1386*m)*(1+m**5.31/4.93e7)
    return 0.208*fW*fF

def bui(P, D):
    denom = np.where((P+0.4*D) > 0, P+0.4*D, 1.0)
    low = 0.8*P*D/denom
    high = P - (1 - 0.8*D/denom)*(0.92+(0.0114*P)**1.7)
    return np.maximum(np.where(P <= 0.4*D, low, high), 0)

def fwi(I, B):
    fD = np.where(B <= 80, 0.626*B**0.809+2, 1000/(25+108.64*np.exp(-0.023*B)))
    Bb = 0.1*I*fD
    logB = 0.434*np.log(np.maximum(Bb, 1.0))     # >=0 -> αποφυγή nan στο ^0.647
    high = np.exp(2.72*logB**0.647)
    return np.maximum(np.where(Bb > 1, high, Bb), 0)

# FWI → risk 0-100, βαθμονομημένο στις κλάσεις επικινδυνότητας EFFIS
FWI_PTS  = [0.0, 5.2, 11.2, 21.3, 38.0, 50.0, 70.0, 120.0]
RISK_PTS = [0.0, 12.0, 25.0, 44.0, 62.0, 78.0, 92.0, 100.0]
def fwi_to_risk(x):
    return np.interp(x, FWI_PTS, RISK_PTS)

# ============================================================
#  DATASET — ρεαλιστικά εύρη ελληνικής αντιπυρικής περιόδου
# ============================================================
def build_dataset(n):
    # Είσοδοι που βλέπει ο ΠΡΟΜΗΘΕΑΣ
    temp  = RNG.uniform(8, 45, n)                     # °C (ημερήσιο max)
    hum   = np.clip(RNG.uniform(5, 98, n), 5, 98)     # %
    wind  = np.clip(RNG.gamma(2.2, 9.0, n), 0, 95)    # km/h (ουρά για μελτέμια)
    rain3 = np.where(RNG.random(n) < 0.55, 0.0,       # 55% ξηρές 3μερες
                     RNG.gamma(1.6, 4.5, n))          # αλλιώς 0–~40 mm
    rain3 = np.clip(rain3, 0, 45)

    # Κατάσταση ξηρασίας (drought memory) — συσχετισμένη με rain3 + ανεξάρτητη διακύμανση
    dry = np.clip((12 - rain3)/12, 0, 1)
    dry = np.clip(0.8*dry + 0.2*RNG.random(n), 0, 1)  # η ξηρασία έχει μνήμη > 3 ημερών
    Do  = np.clip(55 + 360*dry + RNG.normal(0, 60, n), 0, 720)    # DC prev (μετριασμένο)
    Po  = np.clip(3  + 95*dry  + RNG.normal(0, 20, n), 0, 210)    # DMC prev
    Fo  = np.clip(70 + 16*dry  + RNG.normal(0, 5,  n), 45, 94)    # FFMC prev
    ro  = rain3 * RNG.uniform(0, 0.5, n)              # «σημερινή» βροχή ~ μέρος του 3μερου

    month = RNG.choice([5,6,7,8,9], n, p=[0.18,0.22,0.24,0.22,0.14])
    Le = np.vectorize(LE.get)(month).astype(float)
    Lf = np.vectorize(LF.get)(month).astype(float)

    F = ffmc(temp, hum, wind, ro, Fo)
    P = dmc(temp, hum, ro, Po, Le)
    D = dc(temp, ro, Do, Lf)
    I = isi(F, wind)
    B = bui(P, D)
    Z = fwi(I, B)

    risk = fwi_to_risk(Z)
    risk = np.clip(risk + RNG.normal(0, 1.5, n), 0, 100)   # λίγος θόρυβος για robustness
    X = np.column_stack([temp, hum, wind, rain3]).astype(np.float64)
    return X, risk.astype(np.float64)

print("Παραγωγή dataset (FWI) …")
X, y = build_dataset(N)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.18, random_state=3)

# ============================================================
#  ΕΚΠΑΙΔΕΥΣΗ — gradient boosting ensemble (πνεύμα RIBAS)
# ============================================================
print("Εκπαίδευση gradient boosting …")
model = GradientBoostingRegressor(
    n_estimators=150, max_depth=4, learning_rate=0.1,
    subsample=0.85, random_state=3, loss="squared_error")
model.fit(Xtr, ytr)

pred = model.predict(Xte)
print(f"  R²  = {r2_score(yte, pred):.4f}")
print(f"  MAE = {mean_absolute_error(yte, pred):.2f} (στα 0-100)")

# Σύγκριση με την ΠΑΛΙΑ γραμμική φόρμουλα του ΠΡΟΜΗΘΕΑ
def old_linear(temp, hum, wind, rain3):
    t = np.clip((temp-22)/16, 0, 1); h = np.clip((45-hum)/35, 0, 1)
    w = np.clip((wind-10)/45, 0, 1); d = np.clip((8-rain3)/8, 0, 1)
    return np.round(100*(0.28*t+0.24*h+0.30*w+0.18*d))
old = old_linear(Xte[:,0], Xte[:,1], Xte[:,2], Xte[:,3])
print(f"  Παλιά γραμμική vs FWI-στόχος: R²={r2_score(yte, old):.4f}, MAE={mean_absolute_error(yte, old):.2f}")

# ============================================================
#  EXPORT → zero-dependency fire_model.js
# ============================================================
print("Εξαγωγή σε fire_model.js …")
base = float(model.init_.constant_.ravel()[0])
lr = float(model.learning_rate)
trees = []
for est in model.estimators_[:, 0]:
    t = est.tree_
    f = t.feature.astype(int).tolist()                 # -2 = φύλλο
    f = [(-1 if v < 0 else v) for v in f]
    trees.append({
        "f": f,
        "t": [round(float(v), 4) for v in t.threshold.tolist()],
        "l": t.children_left.astype(int).tolist(),
        "r": t.children_right.astype(int).tolist(),
        "v": [round(float(v[0][0]), 5) for v in t.value.tolist()],
    })

# Επαλήθευση ισοδυναμίας Python-εξαγωγής ↔ sklearn
def eval_tree(tr, x):
    i = 0
    while tr["f"][i] >= 0:
        i = tr["l"][i] if x[tr["f"][i]] <= tr["t"][i] else tr["r"][i]
    return tr["v"][i]
def manual_predict(row):
    s = base
    for tr in trees: s += lr*eval_tree(tr, row)
    return s
chk = np.array([manual_predict(Xte[i]) for i in range(400)])
print(f"  Max |JS-export - sklearn| = {np.max(np.abs(chk - model.predict(Xte[:400]))):.6f}")

n_nodes = sum(len(t["f"]) for t in trees)
payload = {"base": round(base,5), "lr": round(lr,5), "feat": ["temp","hum","wind","rain3"], "trees": trees}
js = (
"/* ΠΡΟΜΗΘΕΑΣ — Trained fire-risk model (EV LABS AI).\n"
"   Gradient-boosting ensemble εκπαιδευμένο στο επιστημονικό Fire Weather Index (FWI/EFFIS).\n"
"   Pivot του RIBAS ML engine σε πραγματικό σήμα. Inputs: temp(C), hum(%), wind(km/h), rain3(mm).\n"
f"   {len(trees)} trees / {n_nodes} nodes. Auto-generated — μην το πειράζεις με το χέρι. */\n"
"window.PROMETHEAS_FIRE_MODEL = " + json.dumps(payload, ensure_ascii=False, separators=(',',':')) + ";\n"
"""
window.fireRiskML = function(temp, hum, wind, rain3){
  var M = window.PROMETHEAS_FIRE_MODEL; if(!M) return null;
  var x = [temp, hum, wind, rain3], s = M.base, T = M.trees;
  for(var k=0;k<T.length;k++){ var tr=T[k], i=0;
    while(tr.f[i] >= 0){ i = (x[tr.f[i]] <= tr.t[i]) ? tr.l[i] : tr.r[i]; }
    s += M.lr * tr.v[i];
  }
  return Math.max(0, Math.min(100, Math.round(s)));
};
"""
)
with open(JS_OUT, "w", encoding="utf-8") as fh:
    fh.write(js)
size_kb = os.path.getsize(JS_OUT)/1024
print(f"  -> {JS_OUT}  ({size_kb:.1f} KB, {len(trees)} trees, {n_nodes} nodes)")

# ============================================================
#  SANITY — ελληνικά σενάρια (παλιά vs νέα)
# ============================================================
print("\nΣΕΝΑΡΙΑ  (temp,hum,wind,rain3)  ->  ΠΑΛΙΑ  |  ΝΕΑ(FWI-ML)")
scen = [
    ("Δροσερή υγρή μέρα",      12, 85, 8, 20),
    ("Άνοιξη ήπια",           22, 55, 15, 5),
    ("Ζεστή ξηρή",            34, 28, 18, 0),
    ("Καύσωνας + ξηρασία",    41, 14, 22, 0),
    ("Καύσωνας + ΜΕΛΤΕΜΙ",    40, 16, 65, 0),
    ("Ζεστή ΜΕΤΑ τη βροχή",   33, 45, 20, 30),
    ("Μέτριος άνεμος ξηρά",   30, 35, 35, 1),
]
for name,t,h,w,r in scen:
    o = int(old_linear(np.array([t]),np.array([h]),np.array([w]),np.array([r]))[0])
    nv = int(np.clip(round(manual_predict(np.array([t,h,w,r],dtype=float))),0,100))
    print(f"  {name:24s} ({t:>2},{h:>2},{w:>2},{r:>2})  ->  {o:>3}   |  {nv:>3}")
print("\nΈτοιμο. Το fire_model.js μπαίνει στον ΠΡΟΜΗΘΕΑ.")
