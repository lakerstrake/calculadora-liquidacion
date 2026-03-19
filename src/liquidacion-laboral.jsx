import React, { useState, useMemo, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════
   PARÁMETROS LEGALES POR AÑO — Decretos Gobierno Nacional
   ═══════════════════════════════════════════════════════════ */
const P = {
  2026: { smlmv: 1750905, aux: 249095, dec: "Dcto.1469/2025" },
  2025: { smlmv: 1423500, aux: 200000, dec: "Dcto.1572/2024" },
  2024: { smlmv: 1300000, aux: 162000, dec: "Dcto.2292/2023" },
  2023: { smlmv: 1160000, aux: 140606, dec: "Dcto.2613/2022" },
  2022: { smlmv: 1000000, aux: 117172, dec: "Dcto.1724/2021" },
  2021: { smlmv: 908526,  aux: 106454, dec: "Dcto.1785/2020" },
  2020: { smlmv: 877803,  aux: 102854, dec: "Dcto.2360/2019" },
  2019: { smlmv: 828116,  aux: 97032,  dec: "Dcto.2451/2018" },
  2018: { smlmv: 781242,  aux: 88211,  dec: "Dcto.2269/2017" },
};
const gP = y => P[y] || P[2026];
const TODAY = new Date().toISOString().split("T")[0];

/* ═══ Formatters ═══ */
const n$ = v => "$ " + new Intl.NumberFormat("es-CO").format(Math.round(v));
const nF = v => new Intl.NumberFormat("es-CO").format(Math.round(v));
const pN = s => parseFloat((s || "0").replace(/[^\d]/g, "")) || 0;
const fD = d => {
  if (!d) return "";
  return new Date(d.getTime() + 43200000).toLocaleDateString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

/* ═══ Días comerciales (360/30) — Método oficial CST ═══ */
const d360 = (a, b) => {
  let y1 = a.getFullYear(), m1 = a.getMonth(), d1 = a.getDate();
  let y2 = b.getFullYear(), m2 = b.getMonth(), d2 = b.getDate();
  if (d1 === 31) d1 = 30;
  if (d2 === 31) d2 = 30;
  return Math.max(0, (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1));
};
const dias = (a, b) => b < a ? 0 : d360(a, b) + 1;

/* Dividir por año calendario */
const splitYears = (s, e) => {
  const r = []; let c = new Date(s);
  while (c <= e) {
    const ye = new Date(c.getFullYear(), 11, 31);
    const se = ye < e ? ye : new Date(e);
    r.push({ s: new Date(c), e: se, y: c.getFullYear() });
    if (ye < e) c = new Date(c.getFullYear() + 1, 0, 1); else break;
  }
  return r;
};

/* ═══ Cálculo por segmento ═══ */
const calc = (s, e, sal, aux, bon) => {
  const y = s.getFullYear(), d = dias(s, e), base = sal + aux + bon;
  const ces = (base * d) / 360;
  const int = (ces * d * 0.12) / 360;
  const j1 = new Date(y, 6, 1), j30 = new Date(y, 5, 30);
  let dp1 = 0, dp2 = 0;
  if (e < j1) dp1 = d;
  else if (s >= j1) dp2 = d;
  else { dp1 = dias(s, j30); dp2 = dias(j1, e); }
  const p1 = (base * dp1) / 360, p2 = (base * dp2) / 360;
  const vac = (sal * d) / 720;
  return { y, s, e, d, sal, aux, bon, base, ces, int, dp1, dp2, p1, p2, vac, sub: ces + int + p1 + p2 + vac };
};

/* Número a letras */
const NL = n => {
  const a = Math.round(Math.abs(n)); if (!a) return "CERO PESOS";
  const u = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const sp = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
  const d = ["", "", "VEINTI", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const c = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];
  const h = n => {
    if (!n) return "";
    if (n === 100) return "CIEN";
    let r = "";
    if (n >= 100) { r = c[~~(n / 100)] + " "; n %= 100; }
    if (n >= 10 && n <= 19) return r + sp[n - 10];
    if (n === 20) return r + "VEINTE";
    if (n >= 21 && n <= 29) return r + "VEINTI" + u[n - 20];
    if (n >= 30) { r += d[~~(n / 10)]; n %= 10; if (n) r += " Y " + u[n]; return r; }
    return r + u[n];
  };
  if (a >= 1e6) { const m = ~~(a / 1e6), r = a % 1e6; return (m === 1 ? "UN MILLÓN" : h(m) + " MILLONES") + (r ? " " + NL(r).replace(" PESOS", "") : "") + " PESOS"; }
  if (a >= 1e3) { const m = ~~(a / 1e3), r = a % 1e3; return (m === 1 ? "MIL" : h(m) + " MIL") + (r ? " " + h(r) : "") + " PESOS"; }
  return h(a) + " PESOS";
};

/* ─── CSS ─────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --primary:    #0d1f3c;
  --primary-h:  #152e58;
  --accent:     #2563eb;
  --accent-lt:  #eff6ff;
  --gold:       #c8961e;
  --gold-lt:    rgba(200,150,30,.12);
  --bg:         #f0f3f8;
  --surface:    #ffffff;
  --border:     #dde3ed;
  --text:       #1a2535;
  --text-2:     #566379;
  --text-3:     #9aa5b5;
  --r:          10px;
  --r-sm:       6px;
  --font:       'IBM Plex Sans', system-ui, -apple-system, sans-serif;
  --mono:       'IBM Plex Mono', 'Courier New', monospace;
}

html { scroll-behavior: smooth; }
body { margin: 0; padding: 0; background: var(--bg); }

.lq { min-height: 100vh; background: var(--bg); font-family: var(--font); color: var(--text); font-size: 13.5px; line-height: 1.5; }

/* HEADER */
.lq-hdr { background: var(--primary); position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 16px rgba(0,0,0,.22); border-bottom: 3px solid var(--gold); }
.lq-hdr-in { max-width: 840px; margin: 0 auto; padding: 13px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.lq-brand { display: flex; align-items: center; gap: 12px; }
.lq-icon { width: 38px; height: 38px; background: rgba(255,255,255,.10); border: 1px solid rgba(255,255,255,.16); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.lq-title { font-size: 15.5px; font-weight: 700; color: #fff; line-height: 1.15; }
.lq-sub { font-size: 10.5px; color: rgba(255,255,255,.5); margin-top: 1px; }
.lq-badge { font-size: 10px; font-weight: 700; color: var(--gold); background: var(--gold-lt); border: 1px solid rgba(200,150,30,.35); border-radius: 4px; padding: 4px 10px; letter-spacing: .4px; white-space: nowrap; font-family: var(--mono); }

/* MAIN */
.lq-main { max-width: 840px; margin: 0 auto; padding: 22px 16px 52px; }

/* CARD */
.lq-card { background: var(--surface); border-radius: var(--r); border: 1px solid var(--border); box-shadow: 0 1px 4px rgba(0,0,0,.08), 0 2px 8px rgba(0,0,0,.04); padding: 22px 24px; margin-bottom: 12px; }
.lq-card-hd { font-size: 10px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: .9px; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 2px solid var(--primary); display: flex; align-items: center; gap: 9px; }
.lq-num { font-family: var(--mono); font-size: 10px; background: var(--accent-lt); color: var(--accent); padding: 2px 7px; border-radius: 4px; font-weight: 600; }

/* FIELDS */
.lq-f { margin-bottom: 14px; }
.lq-f:last-child { margin-bottom: 0; }
.lq-lbl { display: block; font-size: 10.5px; font-weight: 600; color: var(--text-2); margin-bottom: 5px; text-transform: uppercase; letter-spacing: .5px; }
.lq-inp { width: 100%; padding: 9px 12px; background: #f7f9fc; border: 1.5px solid var(--border); border-radius: var(--r-sm); color: var(--text); font-size: 13.5px; font-family: var(--font); outline: none; transition: border-color .15s, box-shadow .15s, background .15s; -webkit-appearance: none; }
.lq-inp:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,.10); background: #fff; }
.lq-inp::placeholder { color: var(--text-3); }

/* GRIDS */
.lq-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.lq-r2  { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.lq-r3  { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }

/* TOGGLE */
.lq-tog { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px; }
.lq-tb { padding: 7px 13px; border-radius: var(--r-sm); border: 1.5px solid var(--border); background: #f7f9fc; color: var(--text-2); font-size: 12px; font-weight: 500; font-family: var(--font); cursor: pointer; transition: all .14s; flex: 1; text-align: center; min-width: 80px; line-height: 1.3; }
.lq-tb:hover { background: var(--accent-lt); border-color: #bfdbfe; color: var(--accent); }
.lq-tb.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; }

/* CHIPS / HINTS */
.lq-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 4px; border: 1px solid #bfdbfe; background: var(--accent-lt); color: var(--accent); font-size: 10px; font-weight: 600; cursor: pointer; margin-top: 5px; font-family: var(--mono); transition: background .1s; }
.lq-chip:hover { background: #dbeafe; }
.lq-hint { font-size: 10.5px; color: var(--text-3); margin-top: 4px; }
.lq-info { margin-top: 11px; padding: 10px 13px; background: var(--accent-lt); border-radius: var(--r-sm); border-left: 3px solid var(--accent); font-size: 12px; color: #1e40af; line-height: 1.55; }

/* YEAR TABLE */
.lq-ytbl { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
.lq-ytbl th { padding: 7px 8px; background: #f1f5fb; font-size: 9.5px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: .5px; border: 1px solid var(--border); text-align: center; }
.lq-ytbl td { padding: 6px 8px; border: 1px solid var(--border); vertical-align: middle; }
.lq-yl { font-weight: 700; color: var(--accent); font-family: var(--mono); font-size: 12.5px; background: var(--accent-lt); text-align: center; white-space: nowrap; }
.lq-yd { font-family: var(--mono); text-align: center; color: var(--text-2); font-size: 11px; }
.lq-yi { width: 100%; padding: 5px 8px; background: #fff; border: 1.5px solid var(--border); border-radius: 4px; font-size: 12px; font-family: var(--mono); color: var(--text); outline: none; text-align: right; transition: border-color .14s; }
.lq-yi:focus { border-color: var(--accent); }
.lq-yq { font-size: 9px; color: var(--accent); cursor: pointer; text-decoration: underline; display: block; text-align: right; margin-top: 2px; }
.lq-ytot { font-family: var(--mono); text-align: right; font-weight: 700; color: var(--primary); font-size: 11.5px; background: #f8fafc; }

/* BUTTONS */
.lq-btn-p { width: 100%; padding: 14px; background: var(--primary); color: #fff; border: none; border-radius: var(--r); font-size: 15px; font-weight: 700; font-family: var(--font); cursor: pointer; transition: background .14s, transform .1s; margin-top: 4px; letter-spacing: .2px; }
.lq-btn-p:hover:not(:disabled) { background: var(--primary-h); }
.lq-btn-p:active:not(:disabled) { transform: scale(.99); }
.lq-btn-p:disabled { opacity: .32; cursor: not-allowed; }
.lq-btn-s { padding: 9px 16px; background: #fff; color: var(--text-2); border: 1.5px solid var(--border); border-radius: var(--r-sm); font-size: 12.5px; font-weight: 600; font-family: var(--font); cursor: pointer; transition: all .14s; display: inline-flex; align-items: center; gap: 6px; }
.lq-btn-s:hover { background: #f4f6fb; border-color: #bbc5d5; color: var(--text); }
.lq-btn-s.on { background: var(--primary); color: #fff; border-color: var(--primary); }
.lq-btn-back { width: 100%; padding: 11px; background: #fff; color: var(--text-2); border: 1.5px solid var(--border); border-radius: var(--r); font-size: 13.5px; font-weight: 600; font-family: var(--font); cursor: pointer; transition: all .14s; margin-top: 10px; }
.lq-btn-back:hover { background: #f4f6fb; }

/* ACTION BAR */
.lq-bar { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }

/* DOCUMENT */
.lq-doc { background: #fff; border-radius: var(--r); border: 1px solid #c4cdd9; box-shadow: 0 4px 16px rgba(0,0,0,.10), 0 1px 4px rgba(0,0,0,.06); overflow: hidden; animation: slideUp .28s ease; }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.lq-dochd { background: var(--primary); padding: 18px 26px; border-bottom: 4px solid var(--gold); text-align: center; }
.lq-dochd h2 { color: #fff; font-size: 15px; font-weight: 700; letter-spacing: .5px; margin: 0; }
.lq-dochd p { color: rgba(255,255,255,.5); font-size: 10px; margin: 5px 0 0; }
.lq-docb { padding: 18px 22px; }

/* DOC TABLES */
.lq-dt { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11.5px; }
.lq-dt td, .lq-dt th { padding: 5px 8px; border: 1px solid #c8d2de; }
.lq-dt th { background: #e4ebf5; font-weight: 700; color: var(--primary); font-size: 9.5px; text-transform: uppercase; letter-spacing: .4px; }
.dl  { background: #f4f7fb; font-weight: 600; color: #2d3748; }
.dv  { font-family: var(--mono); text-align: right; color: var(--text); font-size: 10.5px; }
.dvb { font-family: var(--mono); text-align: right; font-weight: 700; color: var(--primary); font-size: 10.5px; }
.sec { background: var(--primary); color: #fff; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; font-size: 9.5px; text-align: center; }
.tot td  { background: #0a1828; color: #fff; font-weight: 700; font-size: 13px; }
.tot .dvb { color: #fbbf24; font-size: 13px; }
.fm  { font-family: var(--mono); text-align: center; font-size: 10px; color: var(--text-2); }
.sp  { text-align: center; color: var(--text-3); font-size: 9px; }
.yh  { background: #dde9f5; font-weight: 700; color: var(--primary); font-size: 10px; }
.sub td { background: #edf2fa; font-weight: 700; font-size: 10.5px; }

/* DOC GRID */
.lq-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
.lq-bx { border: 1px solid #c8d2de; overflow: hidden; border-radius: 5px; }
.lq-bxhd { background: #e4ebf5; padding: 4px 9px; font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--primary); text-align: center; }
.lq-bx .lq-dt { margin: 0; }
.lq-bx .lq-dt td { border-left: none; border-right: none; }
.lq-bx .lq-dt tr:last-child td { border-bottom: none; }

/* LEGAL */
.lq-legal { margin-top: 12px; padding: 10px 13px; background: #f7f9fc; border: 1px solid var(--border); font-size: 9.5px; color: var(--text-2); line-height: 1.65; border-radius: 5px; }
.lq-legal strong { color: var(--text); }
.lq-warn  { margin-top: 8px; padding: 8px 11px; background: #fefce8; border: 1px solid #fde68a; font-size: 9px; color: #78521a; line-height: 1.55; border-radius: 5px; }
.lq-norms { margin-top: 8px; padding: 9px 12px; background: #f1f5f9; border: 1px solid var(--border); font-size: 9px; color: var(--text-2); line-height: 1.65; border-radius: 5px; }
.lq-norms strong { color: var(--text); }
.lq-norms-t { font-size: 9px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: .6px; margin-bottom: 4px; }

/* SIGNATURES */
.lq-sigs { display: flex; justify-content: space-around; margin-top: 32px; }
.lq-sig  { text-align: center; width: 180px; }
.lq-sig-line { border-top: 1.5px solid #2d3748; padding-top: 6px; font-size: 9.5px; color: var(--text-2); font-weight: 600; }
.lq-sig-sub  { font-size: 8.5px; color: var(--text-3); margin-top: 2px; }

/* FOOTER */
.lq-footer { text-align: center; padding: 18px 0 0; font-size: 10px; color: var(--text-3); }

/* PRINT */
@media print {
  body { background: #fff !important; }
  .np { display: none !important; }
  .lq-hdr { display: none !important; }
  .lq-main { padding: 0; max-width: 100%; }
  .lq-doc { box-shadow: none; border: none; border-radius: 0; }
  .lq-docb { padding: 6px 10px; }
  .lq-dt { font-size: 9.5px; margin-bottom: 4px; }
  .lq-dt td, .lq-dt th { padding: 2px 4px; }
  .lq-dochd { padding: 8px 12px; }
  .lq-dochd h2 { font-size: 12px; }
  .lq-g2 { gap: 4px; margin-bottom: 5px; }
  .lq-legal, .lq-warn, .lq-norms { padding: 4px 6px; font-size: 8px; margin-top: 4px; }
  .lq-sigs { margin-top: 18px; }
  .tot td { font-size: 11px; }
  @page { size: letter; margin: 10mm 12mm; }
}

/* RESPONSIVE */
@media (max-width: 680px) {
  .lq-card { padding: 16px; }
  .lq-r2, .lq-r3 { grid-template-columns: 1fr; }
  .lq-g2 { grid-template-columns: 1fr; }
  .lq-sigs { flex-direction: column; align-items: center; gap: 22px; }
  .lq-main { padding: 14px 10px 44px; }
  .lq-ytbl { font-size: 11px; }
}
@media (max-width: 420px) {
  .lq-badge { display: none; }
  .lq-tb { min-width: 60px; font-size: 11px; padding: 6px 9px; }
  .lq-title { font-size: 14px; }
  .lq-sub { display: none; }
}
`;

/* ─── COMPONENT ──────────────────────────────────────────── */
export default function App() {
  const [emp, setEmp] = useState("");
  const [nom, setNom] = useState("");
  const [ced, setCed] = useState("");
  const [car, setCar] = useState("");
  const [cau, setCau] = useState("Terminación de contrato");
  const [fi, setFi] = useState("");
  const [fr, setFr] = useState("");
  const [sameSal, setSameSal] = useState(true);
  const [gSal, setGSal] = useState("");
  const [hasAux, setHasAux] = useState(true);
  const [bon, setBon] = useState("");
  const [vt, setVt] = useState("0");
  const [dCes, setDCes] = useState("");
  const [dPri, setDPri] = useState("");
  const [dInt, setDInt] = useState("");
  const [yd, setYd] = useState({});
  const [show, setShow] = useState(false);
  const [det, setDet] = useState(false);

  const yrs = useMemo(() => {
    if (!fi || !fr) return [];
    const a = new Date(fi + "T00:00:00"), b = new Date(fr + "T00:00:00");
    return b > a ? splitYears(a, b) : [];
  }, [fi, fr]);

  useEffect(() => {
    setYd(prev => {
      const n = {};
      yrs.forEach(s => {
        const y = s.y, p = gP(y);
        n[y] = prev[y] || { sal: sameSal ? gSal : nF(p.smlmv), aux: hasAux ? nF(p.aux) : "0" };
      });
      return n;
    });
  }, [yrs.length]);

  useEffect(() => {
    if (sameSal) setYd(p => { const n = {}; Object.keys(p).forEach(y => { n[y] = { ...p[y], sal: gSal }; }); return n; });
  }, [gSal, sameSal]);

  useEffect(() => {
    setYd(p => { const n = {}; Object.keys(p).forEach(y => { const pp = gP(+y); n[y] = { ...p[y], aux: hasAux ? nF(pp.aux) : "0" }; }); return n; });
  }, [hasAux]);

  const uY = (y, f, v) => setYd(p => ({ ...p, [y]: { ...p[y], [f]: v } }));
  const fI = fn => e => { const r = e.target.value.replace(/[^\d]/g, ""); fn(r ? nF(+r) : ""); };

  const R = useMemo(() => {
    if (!yrs.length) return null;
    const ok = yrs.every(s => yd[s.y] && pN(yd[s.y].sal) > 0); if (!ok) return null;
    const rs = yrs.map(s => { const d = yd[s.y]; return calc(s.s, s.e, pN(d.sal), pN(d.aux), pN(bon)); });
    const tD   = rs.reduce((a, r) => a + r.d, 0);
    const tCes = rs.reduce((a, r) => a + r.ces, 0);
    const tInt = rs.reduce((a, r) => a + r.int, 0);
    const tP1  = rs.reduce((a, r) => a + r.p1, 0);
    const tP2  = rs.reduce((a, r) => a + r.p2, 0);
    const tVB  = rs.reduce((a, r) => a + r.vac, 0);
    const vTom = +(vt) || 0;
    const lastSal = rs[rs.length - 1].sal;
    const vDesc = (lastSal / 720) * vTom;
    const tVac  = Math.max(0, tVB - vDesc);
    const tDev  = tCes + tInt + tP1 + tP2 + tVac;
    const dc = pN(dCes), dp = pN(dPri), di = pN(dInt), tDesc = dc + dp + di;
    return {
      rs, tD, tCes, tInt, tP1, tP2, tVB, vTom, vDesc, tVac, tDev, dc, dp, di, tDesc,
      val: tDev - tDesc,
      ing: new Date(fi + "T00:00:00"),
      ret: new Date(fr + "T00:00:00"),
      multi: rs.length > 1,
    };
  }, [yrs, yd, bon, vt, dCes, dPri, dInt]);

  const ok = fi && fr && yrs.length > 0 && yrs.every(s => yd[s.y] && pN(yd[s.y].sal) > 0);
  const CAUSAS = ["Terminación de contrato", "Renuncia voluntaria", "Despido sin justa causa", "Mutuo acuerdo"];

  return (
    <div className="lq">
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <header className="lq-hdr">
        <div className="lq-hdr-in">
          <div className="lq-brand">
            <div className="lq-icon">⚖</div>
            <div>
              <div className="lq-title">Liquidación Laboral</div>
              <div className="lq-sub">Prestaciones sociales · Colombia · CST vigente</div>
            </div>
          </div>
          <div className="lq-badge">🇨🇴 Normativa 2026</div>
        </div>
      </header>

      <main className="lq-main">
        {!show ? (
          <>
            {/* ── 01 Empleado ── */}
            <div className="lq-card">
              <div className="lq-card-hd"><span className="lq-num">01</span>Información del empleado</div>
              <div className="lq-f">
                <label className="lq-lbl">Empresa / Empleador</label>
                <input className="lq-inp" placeholder="Razón social o nombre del empleador" value={emp} onChange={e => setEmp(e.target.value)} />
              </div>
              <div className="lq-row">
                <div className="lq-f">
                  <label className="lq-lbl">Nombre del empleado</label>
                  <input className="lq-inp" placeholder="Nombre completo" value={nom} onChange={e => setNom(e.target.value)} />
                </div>
                <div className="lq-f">
                  <label className="lq-lbl">Cédula / PPT</label>
                  <input className="lq-inp" placeholder="Número de documento" value={ced} onChange={e => setCed(e.target.value)} inputMode="numeric" />
                </div>
                <div className="lq-f">
                  <label className="lq-lbl">Cargo</label>
                  <input className="lq-inp" placeholder="Cargo o posición" value={car} onChange={e => setCar(e.target.value)} />
                </div>
              </div>
              <div className="lq-f" style={{ marginBottom: 0 }}>
                <label className="lq-lbl">Causa de la liquidación</label>
                <div className="lq-tog">
                  {CAUSAS.map(c => (
                    <button key={c} className={`lq-tb${cau === c ? " on" : ""}`} onClick={() => setCau(c)}>{c}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── 02 Periodo ── */}
            <div className="lq-card">
              <div className="lq-card-hd"><span className="lq-num">02</span>Período de liquidación</div>
              <div className="lq-r2">
                <div className="lq-f">
                  <label className="lq-lbl">Fecha de inicio del contrato</label>
                  <input type="date" className="lq-inp" value={fi} onChange={e => setFi(e.target.value)} />
                </div>
                <div className="lq-f">
                  <label className="lq-lbl">Fecha de terminación</label>
                  <input type="date" className="lq-inp" value={fr} onChange={e => setFr(e.target.value)} />
                  <button className="lq-chip" onClick={() => setFr(TODAY)}>📅 Usar fecha de hoy</button>
                </div>
              </div>
              {yrs.length > 1 && (
                <div className="lq-info">
                  📊 <strong>Contrato de {yrs.length} años</strong> ({yrs.map(s => s.y).join(", ")}). Se liquidará cada año de forma independiente con sus parámetros legales vigentes.
                </div>
              )}
            </div>

            {/* ── 03 Salario ── */}
            <div className="lq-card">
              <div className="lq-card-hd"><span className="lq-num">03</span>Salario y auxilio de transporte</div>
              <div className="lq-r2">
                <div className="lq-f">
                  <label className="lq-lbl">¿El salario fue igual todos los años?</label>
                  <div className="lq-tog">
                    <button className={`lq-tb${sameSal ? " on" : ""}`} onClick={() => setSameSal(true)}>Sí, el mismo</button>
                    <button className={`lq-tb${!sameSal ? " on" : ""}`} onClick={() => setSameSal(false)}>No, cambió</button>
                  </div>
                </div>
                <div className="lq-f">
                  <label className="lq-lbl">¿Recibe auxilio de transporte?</label>
                  <div className="lq-tog" style={{ maxWidth: 180 }}>
                    <button className={`lq-tb${hasAux ? " on" : ""}`} onClick={() => setHasAux(true)}>Sí</button>
                    <button className={`lq-tb${!hasAux ? " on" : ""}`} onClick={() => setHasAux(false)}>No</button>
                  </div>
                  <div className="lq-hint">Aplica si salario ≤ 2 SMLMV · Ley 15/1959</div>
                </div>
              </div>

              {sameSal && (
                <div className="lq-f">
                  <label className="lq-lbl">Salario mensual</label>
                  <input type="text" className="lq-inp" placeholder="Ingrese el salario mensual" value={gSal}
                    onChange={fI(setGSal)} inputMode="numeric" style={{ maxWidth: 280 }} />
                  <button className="lq-chip" onClick={() => setGSal(nF(gP(2026).smlmv))}>
                    SMLMV 2026: ${nF(gP(2026).smlmv)}
                  </button>
                </div>
              )}

              <div className="lq-f">
                <label className="lq-lbl">Promedio bonificaciones mensuales</label>
                <input type="text" className="lq-inp" placeholder="$0 — si no aplica, deje en blanco" value={bon}
                  onChange={fI(setBon)} inputMode="numeric" style={{ maxWidth: 280 }} />
              </div>

              {yrs.length > 0 && (
                <table className="lq-ytbl">
                  <thead>
                    <tr>
                      <th>Año</th><th>Días</th><th>Salario mensual</th><th>Aux. transporte</th><th>Base total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yrs.map(s => {
                      const y = s.y, d = yd[y] || { sal: "", aux: "0" }, p = gP(y);
                      const sl = pN(d.sal), ax = pN(d.aux), dd = dias(s.s, s.e);
                      return (
                        <tr key={y}>
                          <td className="lq-yl">{y}</td>
                          <td className="lq-yd">{dd}</td>
                          <td>
                            <input className="lq-yi" value={d.sal} inputMode="numeric" placeholder="Salario"
                              onChange={e => { const r = e.target.value.replace(/[^\d]/g, ""); uY(y, "sal", r ? nF(+r) : ""); if (sameSal) setGSal(r ? nF(+r) : ""); }} />
                            <span className="lq-yq" onClick={() => { uY(y, "sal", nF(p.smlmv)); if (sameSal) setGSal(nF(p.smlmv)); }}>
                              SMLMV {y}: ${nF(p.smlmv)}
                            </span>
                          </td>
                          <td>
                            <input className="lq-yi" value={d.aux} inputMode="numeric"
                              onChange={e => { const r = e.target.value.replace(/[^\d]/g, ""); uY(y, "aux", r ? nF(+r) : ""); }} />
                            <span className="lq-yq" onClick={() => uY(y, "aux", nF(p.aux))}>Legal {y}: ${nF(p.aux)}</span>
                          </td>
                          <td className="lq-ytot">{n$(sl + ax + pN(bon))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── 04 Descuentos ── */}
            <div className="lq-card">
              <div className="lq-card-hd"><span className="lq-num">04</span>Vacaciones y descuentos previos</div>
              <div className="lq-f">
                <label className="lq-lbl">Días de vacaciones ya tomados</label>
                <input type="number" className="lq-inp" value={vt} onChange={e => setVt(e.target.value)} min="0" style={{ maxWidth: 140 }} />
              </div>
              <div className="lq-r3">
                <div className="lq-f">
                  <label className="lq-lbl">Cesantías ya consignadas</label>
                  <input type="text" className="lq-inp" placeholder="$0" value={dCes} onChange={fI(setDCes)} inputMode="numeric" />
                </div>
                <div className="lq-f">
                  <label className="lq-lbl">Prima ya pagada</label>
                  <input type="text" className="lq-inp" placeholder="$0" value={dPri} onChange={fI(setDPri)} inputMode="numeric" />
                </div>
                <div className="lq-f">
                  <label className="lq-lbl">Int. cesantías pagados</label>
                  <input type="text" className="lq-inp" placeholder="$0" value={dInt} onChange={fI(setDInt)} inputMode="numeric" />
                </div>
              </div>
            </div>

            <button className="lq-btn-p" disabled={!ok} onClick={() => ok && setShow(true)}>
              {ok ? "Generar liquidación →" : "Complete los campos requeridos"}
            </button>
          </>
        ) : R ? (
          <div>
            {/* Barra de acciones */}
            <div className="lq-bar np">
              <button className="lq-btn-s" onClick={() => setShow(false)}>← Editar datos</button>
              <button className="lq-btn-s" onClick={() => window.print()}>🖨 Imprimir / PDF</button>
              {R.multi && (
                <button className={`lq-btn-s${det ? " on" : ""}`} onClick={() => setDet(!det)}>
                  {det ? "▼ Ocultar detalle" : "▶ Ver detalle año a año"}
                </button>
              )}
            </div>

            <div className="lq-doc">
              {/* Encabezado */}
              <div className="lq-dochd">
                <h2>{emp ? emp.toUpperCase() : "LIQUIDACIÓN DE CONTRATO DE TRABAJO"}</h2>
                <p>Liquidación definitiva de prestaciones sociales · Sector privado · Colombia</p>
              </div>

              <div className="lq-docb">

                {/* Info empleado */}
                <table className="lq-dt"><tbody>
                  <tr><td className="dl" style={{ width: "34%" }}>Nombre del empleado</td><td>{nom || "—"}</td></tr>
                  <tr><td className="dl">Cédula / PPT</td><td>{ced || "—"}</td></tr>
                  <tr><td className="dl">Cargo</td><td>{car || "—"}</td></tr>
                  <tr><td className="dl">Causa de la liquidación</td><td>{cau}</td></tr>
                </tbody></table>

                {/* Periodo + Salario */}
                <div className="lq-g2">
                  <div className="lq-bx">
                    <div className="lq-bxhd">Período de liquidación</div>
                    <table className="lq-dt"><tbody>
                      <tr><td className="dl">Fecha inicio contrato</td><td className="dv">{fD(R.ing)}</td></tr>
                      <tr><td className="dl">Fecha terminación</td><td className="dv">{fD(R.ret)}</td></tr>
                      <tr><td className="dl" style={{ fontWeight: 700 }}>Tiempo total laborado</td><td className="dvb">{R.tD} días</td></tr>
                    </tbody></table>
                  </div>
                  <div className="lq-bx">
                    <div className="lq-bxhd">Salario base de liquidación</div>
                    <table className="lq-dt"><tbody>
                      {R.rs.map(r => (
                        <tr key={r.y}>
                          <td className="dl">{r.y} ({r.d} días)</td>
                          <td className="dv" style={{ fontSize: 10 }}>Sal: {n$(r.sal)} · Aux: {n$(r.aux)} · <strong>Base: {n$(r.base)}</strong></td>
                        </tr>
                      ))}
                    </tbody></table>
                  </div>
                </div>

                {/* Detalle por año */}
                {(det || !R.multi) && R.rs.map(r => (
                  <div key={r.y}>
                    <div className="lq-g2">
                      <div className="lq-bx">
                        <div className="lq-bxhd">Cesantías {r.y}</div>
                        <table className="lq-dt"><tbody>
                          <tr><td className="dl">Fecha de corte</td><td className="dv">{fD(r.s)}</td></tr>
                          <tr><td className="dl">Fecha liquidación</td><td className="dv">{fD(r.e)}</td></tr>
                          <tr><td className="dl">Días cesantías</td><td className="dvb">{r.d}</td></tr>
                        </tbody></table>
                      </div>
                      <div className="lq-bx">
                        <div className="lq-bxhd">Intereses cesantías {r.y}</div>
                        <table className="lq-dt"><tbody>
                          <tr><td className="dl">Fecha de corte</td><td className="dv">{fD(r.s)}</td></tr>
                          <tr><td className="dl">Fecha liquidación</td><td className="dv">{fD(r.e)}</td></tr>
                          <tr><td className="dl">Días intereses</td><td className="dvb">{r.d}</td></tr>
                        </tbody></table>
                      </div>
                    </div>
                    <div className="lq-g2">
                      <div className="lq-bx">
                        <div className="lq-bxhd">Prima de servicios {r.y}</div>
                        <table className="lq-dt"><tbody>
                          <tr><td className="dl">Fecha de corte</td><td className="dv">{fD(r.s)}</td></tr>
                          <tr><td className="dl">Fecha liquidación</td><td className="dv">{fD(r.e)}</td></tr>
                          {r.dp1 > 0 && <tr><td className="dl">Días prima 1er sem.</td><td className="dvb">{r.dp1}</td></tr>}
                          {r.dp2 > 0 && <tr><td className="dl">Días prima 2do sem.</td><td className="dvb">{r.dp2}</td></tr>}
                        </tbody></table>
                      </div>
                      <div className="lq-bx">
                        <div className="lq-bxhd">Vacaciones {r.y}</div>
                        <table className="lq-dt"><tbody>
                          <tr><td className="dl">Fecha de corte</td><td className="dv">{fD(r.s)}</td></tr>
                          <tr><td className="dl">Fecha liquidación</td><td className="dv">{fD(r.e)}</td></tr>
                          <tr><td className="dl">Total días vacaciones</td><td className="dvb">{r.d}</td></tr>
                          {r.y === R.rs[R.rs.length - 1].y && R.vTom > 0 && (
                            <tr><td className="dl">Días ya tomados</td><td className="dv">{R.vTom}</td></tr>
                          )}
                        </tbody></table>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Resumen con fórmulas */}
                <table className="lq-dt">
                  <thead><tr><td colSpan="7" className="sec">Prestaciones sociales — Resumen de liquidación</td></tr></thead>
                  <tbody>
                    {R.rs.map(r => (
                      <React.Fragment key={r.y}>
                        {R.multi && <tr><td colSpan="7" className="yh">📅 Año {r.y} — {r.d} días — Base: {n$(r.base)}</td></tr>}
                        <tr><td className="dl">Vacaciones {r.y}</td><td className="fm">{nF(r.sal)}</td><td className="sp">÷</td><td className="fm">720</td><td className="sp">×</td><td className="fm">{r.d} días</td><td className="dvb">{n$(r.vac)}</td></tr>
                        <tr><td className="dl">Cesantías {r.y}</td><td className="fm">{nF(r.base)}</td><td className="sp">÷</td><td className="fm">360</td><td className="sp">×</td><td className="fm">{r.d} días</td><td className="dvb">{n$(r.ces)}</td></tr>
                        <tr><td className="dl">Intereses cesantías {r.y}</td><td className="fm">{nF(Math.round(r.ces))}</td><td className="sp">÷</td><td className="fm">360</td><td className="sp">× {r.d} × 12%</td><td className="fm"></td><td className="dvb">{n$(r.int)}</td></tr>
                        {r.dp1 > 0 && <tr><td className="dl">Prima 1er sem. {r.y}</td><td className="fm">{nF(r.base)}</td><td className="sp">÷</td><td className="fm">360</td><td className="sp">×</td><td className="fm">{r.dp1} días</td><td className="dvb">{n$(r.p1)}</td></tr>}
                        {r.dp2 > 0 && <tr><td className="dl">Prima 2do sem. {r.y}</td><td className="fm">{nF(r.base)}</td><td className="sp">÷</td><td className="fm">360</td><td className="sp">×</td><td className="fm">{r.dp2} días</td><td className="dvb">{n$(r.p2)}</td></tr>}
                        {R.multi && <tr className="sub"><td colSpan="6" style={{ textAlign: "right", paddingRight: 8 }}>Subtotal {r.y}</td><td className="dvb">{n$(r.sub)}</td></tr>}
                      </React.Fragment>
                    ))}
                    <tr style={{ background: "#e6ecf5", fontWeight: 700 }}>
                      <td colSpan="6" style={{ textAlign: "right", paddingRight: 8 }}>TOTAL DEVENGOS</td>
                      <td className="dvb">{n$(R.tDev)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Descuentos */}
                <table className="lq-dt">
                  <thead><tr><td colSpan="2" className="sec">Descuentos — Pagos previos realizados</td></tr></thead>
                  <tbody>
                    <tr><td className="dl">Cesantías ya consignadas</td><td className="dv">{n$(R.dc)}</td></tr>
                    <tr><td className="dl">Prima ya pagada</td><td className="dv">{n$(R.dp)}</td></tr>
                    <tr><td className="dl">Intereses de cesantías pagados</td><td className="dv">{n$(R.di)}</td></tr>
                    <tr style={{ background: "#e6ecf5", fontWeight: 700 }}>
                      <td style={{ textAlign: "right", paddingRight: 8 }}>TOTAL DEDUCCIONES</td>
                      <td className="dvb">{n$(R.tDesc)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Valor final */}
                <table className="lq-dt"><tbody>
                  <tr className="tot">
                    <td style={{ textAlign: "right", paddingRight: 10 }}>VALOR NETO A PAGAR — LIQUIDACIÓN</td>
                    <td className="dvb" style={{ width: "32%", fontSize: 14 }}>{n$(R.val)}</td>
                  </tr>
                  <tr>
                    <td colSpan="2" style={{ fontSize: 9.5, color: "#4a5568", fontStyle: "italic", padding: "6px 8px" }}>
                      SON: ({NL(R.val)})
                    </td>
                  </tr>
                </tbody></table>

                {/* Se hace constar */}
                <div className="lq-legal">
                  <strong>SE HACE CONSTAR:</strong><br /><br />
                  1. Que el patrono ha incorporado en la presente liquidación los importes correspondientes a salarios, horas extras, descansos compensatorios, cesantías, vacaciones, prima de servicios, auxilio de transporte, y en sí, todo concepto relacionado con salarios, prestaciones o indemnizaciones causadas al quedar extinguido el contrato de trabajo.<br /><br />
                  2. Que con el pago del dinero anotado en la presente liquidación, queda transada cualquier diferencia relativa al contrato de trabajo extinguido, o a cualquier diferencia anterior. Por lo tanto, esta transacción tiene como efecto la terminación de las obligaciones provenientes de la relación laboral que existió entre <strong>{emp || "el empleador"}</strong> y el trabajador, quienes declaran estar a paz y salvo por todo concepto.
                </div>

                {/* Firmas */}
                <div className="lq-sigs">
                  <div className="lq-sig">
                    <div style={{ height: 36 }}></div>
                    <div className="lq-sig-line">Firma del empleador</div>
                    {emp && <div className="lq-sig-sub">{emp}</div>}
                  </div>
                  <div className="lq-sig">
                    <div style={{ height: 36 }}></div>
                    <div className="lq-sig-line">Firma del trabajador</div>
                    {nom && <div className="lq-sig-sub">{nom}</div>}
                    {ced && <div className="lq-sig-sub">C.C. {ced}</div>}
                  </div>
                </div>

                {/* Normativa */}
                <div className="lq-norms">
                  <div className="lq-norms-t">📜 Fundamento normativo</div>
                  <strong>Cesantías:</strong> Art.249 CST · Ley 50/1990 — (Sal+Aux)×Días÷360 &nbsp;·&nbsp;
                  <strong>Intereses:</strong> Ley 52/1975 — Ces×Días×12%÷360 · Mora: 1 día salario/día retardo (Art.65 CST) &nbsp;·&nbsp;
                  <strong>Prima:</strong> Art.306 CST — (Sal+Aux)×Días_sem÷360 · Pagos: jun.30 y dic.20 &nbsp;·&nbsp;
                  <strong>Vacaciones:</strong> Art.186 CST — Sal_básico×Días÷720 (sin aux. transporte) &nbsp;·&nbsp;
                  <strong>Días:</strong> Año comercial 360, conteo inclusivo &nbsp;·&nbsp;
                  <strong>Aux. transporte:</strong> Ley 15/1959 — aplica si salario ≤ 2 SMLMV &nbsp;·&nbsp;
                  <strong>Cálculo año a año:</strong> Metodología Mintrabajo · Verificado contra Magneto.
                </div>

                <div className="lq-warn">
                  <strong>⚠ Aviso:</strong> Esta herramienta es de carácter informativo conforme a la normatividad laboral colombiana vigente (sector privado). No aplica para: servidores públicos, contratos de prestación de servicios, salario integral (Art.132 CST) ni régimen retroactivo de cesantías. Consulte con un abogado laboralista para decisiones jurídicas.
                </div>

              </div>
            </div>

            <button className="lq-btn-back np" onClick={() => setShow(false)}>← Modificar datos</button>
            <div className="lq-footer np">Calculadora de Liquidación Laboral · Colombia · Normativa CST vigente</div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
