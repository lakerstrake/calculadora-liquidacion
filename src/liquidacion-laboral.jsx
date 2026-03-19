import React, { useState, useMemo, useEffect } from "react";

/* ═══ PARÁMETROS LEGALES ═══ */
const P = {
  2026: { smlmv: 1750905, aux: 249095 },
  2025: { smlmv: 1423500, aux: 200000 },
  2024: { smlmv: 1300000, aux: 162000 },
  2023: { smlmv: 1160000, aux: 140606 },
  2022: { smlmv: 1000000, aux: 117172 },
  2021: { smlmv: 908526,  aux: 106454 },
  2020: { smlmv: 877803,  aux: 102854 },
  2019: { smlmv: 828116,  aux: 97032  },
  2018: { smlmv: 781242,  aux: 88211  },
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
    day: "2-digit", month: "short", year: "2-digit",
  });
};
const fDL = d => {
  if (!d) return "";
  return new Date(d.getTime() + 43200000).toLocaleDateString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
  });
};

/* ═══ Días comerciales 360 — CST ═══ */
const d360 = (a, b) => {
  let y1 = a.getFullYear(), m1 = a.getMonth(), d1 = a.getDate();
  let y2 = b.getFullYear(), m2 = b.getMonth(), d2 = b.getDate();
  if (d1 === 31) d1 = 30;
  if (d2 === 31) d2 = 30;
  return Math.max(0, (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1));
};
const dias = (a, b) => b < a ? 0 : d360(a, b) + 1;

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
  --primary:   #0d1f3c;
  --primary-h: #152e58;
  --accent:    #2563eb;
  --accent-lt: #eff6ff;
  --gold:      #c8961e;
  --gold-lt:   rgba(200,150,30,.12);
  --bg:        #f0f3f8;
  --surface:   #ffffff;
  --border:    #dde3ed;
  --text:      #1a2535;
  --text-2:    #566379;
  --text-3:    #9aa5b5;
  --r:         10px;
  --r-sm:      6px;
  --font:      'IBM Plex Sans', system-ui, -apple-system, sans-serif;
  --mono:      'IBM Plex Mono', 'Courier New', monospace;
}

html { scroll-behavior: smooth; }
body { margin: 0; padding: 0; background: var(--bg); }

.lq { min-height: 100vh; background: var(--bg); font-family: var(--font); color: var(--text); font-size: 13.5px; line-height: 1.5; }

/* ── HEADER ── */
.lq-hdr { background: var(--primary); position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 16px rgba(0,0,0,.22); border-bottom: 3px solid var(--gold); }
.lq-hdr-in { max-width: 840px; margin: 0 auto; padding: 13px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.lq-brand { display: flex; align-items: center; gap: 12px; }
.lq-icon { width: 38px; height: 38px; background: rgba(255,255,255,.10); border: 1px solid rgba(255,255,255,.16); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.lq-title { font-size: 15.5px; font-weight: 700; color: #fff; line-height: 1.15; }
.lq-sub { font-size: 10.5px; color: rgba(255,255,255,.5); margin-top: 1px; }
.lq-badge { font-size: 10px; font-weight: 700; color: var(--gold); background: var(--gold-lt); border: 1px solid rgba(200,150,30,.35); border-radius: 4px; padding: 4px 10px; letter-spacing: .4px; white-space: nowrap; font-family: var(--mono); }

/* ── MAIN ── */
.lq-main { max-width: 840px; margin: 0 auto; padding: 22px 16px 52px; }

/* ── CARD ── */
.lq-card { background: var(--surface); border-radius: var(--r); border: 1px solid var(--border); box-shadow: 0 1px 4px rgba(0,0,0,.08), 0 2px 8px rgba(0,0,0,.04); padding: 22px 24px; margin-bottom: 12px; }
.lq-card-hd { font-size: 10px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: .9px; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 2px solid var(--primary); display: flex; align-items: center; gap: 9px; }
.lq-num { font-family: var(--mono); font-size: 10px; background: var(--accent-lt); color: var(--accent); padding: 2px 7px; border-radius: 4px; font-weight: 600; }

/* ── FIELDS ── */
.lq-f { margin-bottom: 14px; }
.lq-f:last-child { margin-bottom: 0; }
.lq-lbl { display: block; font-size: 10.5px; font-weight: 600; color: var(--text-2); margin-bottom: 5px; text-transform: uppercase; letter-spacing: .5px; }
.lq-inp { width: 100%; padding: 9px 12px; background: #f7f9fc; border: 1.5px solid var(--border); border-radius: var(--r-sm); color: var(--text); font-size: 13.5px; font-family: var(--font); outline: none; transition: border-color .15s, box-shadow .15s, background .15s; -webkit-appearance: none; }
.lq-inp:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,.10); background: #fff; }
.lq-inp::placeholder { color: var(--text-3); }

/* ── GRIDS ── */
.lq-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.lq-r2  { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.lq-r3  { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }

/* ── TOGGLE ── */
.lq-tog { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px; }
.lq-tb { padding: 7px 13px; border-radius: var(--r-sm); border: 1.5px solid var(--border); background: #f7f9fc; color: var(--text-2); font-size: 12px; font-weight: 500; font-family: var(--font); cursor: pointer; transition: all .14s; flex: 1; text-align: center; min-width: 80px; line-height: 1.3; }
.lq-tb:hover { background: var(--accent-lt); border-color: #bfdbfe; color: var(--accent); }
.lq-tb.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; }

/* ── CHIPS ── */
.lq-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 4px; border: 1px solid #bfdbfe; background: var(--accent-lt); color: var(--accent); font-size: 10px; font-weight: 600; cursor: pointer; margin-top: 5px; font-family: var(--mono); transition: background .1s; }
.lq-chip:hover { background: #dbeafe; }
.lq-hint { font-size: 10.5px; color: var(--text-3); margin-top: 4px; }
.lq-info { margin-top: 11px; padding: 10px 13px; background: var(--accent-lt); border-radius: var(--r-sm); border-left: 3px solid var(--accent); font-size: 12px; color: #1e40af; line-height: 1.55; }

/* ── YEAR TABLE ── */
.lq-ytbl { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
.lq-ytbl th { padding: 7px 8px; background: #f1f5fb; font-size: 9.5px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: .5px; border: 1px solid var(--border); text-align: center; }
.lq-ytbl td { padding: 6px 8px; border: 1px solid var(--border); vertical-align: middle; }
.lq-yl { font-weight: 700; color: var(--accent); font-family: var(--mono); font-size: 12.5px; background: var(--accent-lt); text-align: center; white-space: nowrap; }
.lq-yd { font-family: var(--mono); text-align: center; color: var(--text-2); font-size: 11px; }
.lq-yi { width: 100%; padding: 5px 8px; background: #fff; border: 1.5px solid var(--border); border-radius: 4px; font-size: 12px; font-family: var(--mono); color: var(--text); outline: none; text-align: right; transition: border-color .14s; }
.lq-yi:focus { border-color: var(--accent); }
.lq-yq { font-size: 9px; color: var(--accent); cursor: pointer; text-decoration: underline; display: block; text-align: right; margin-top: 2px; }
.lq-ytot { font-family: var(--mono); text-align: right; font-weight: 700; color: var(--primary); font-size: 11.5px; background: #f8fafc; }

/* ── BUTTONS ── */
.lq-btn-p { width: 100%; padding: 14px; background: var(--primary); color: #fff; border: none; border-radius: var(--r); font-size: 15px; font-weight: 700; font-family: var(--font); cursor: pointer; transition: background .14s, transform .1s; margin-top: 4px; letter-spacing: .2px; }
.lq-btn-p:hover:not(:disabled) { background: var(--primary-h); }
.lq-btn-p:active:not(:disabled) { transform: scale(.99); }
.lq-btn-p:disabled { opacity: .32; cursor: not-allowed; }
.lq-btn-s { padding: 9px 16px; background: #fff; color: var(--text-2); border: 1.5px solid var(--border); border-radius: var(--r-sm); font-size: 12.5px; font-weight: 600; font-family: var(--font); cursor: pointer; transition: all .14s; display: inline-flex; align-items: center; gap: 6px; }
.lq-btn-s:hover { background: #f4f6fb; border-color: #bbc5d5; color: var(--text); }
.lq-btn-s.on { background: var(--primary); color: #fff; border-color: var(--primary); }
.lq-btn-back { width: 100%; padding: 11px; background: #fff; color: var(--text-2); border: 1.5px solid var(--border); border-radius: var(--r); font-size: 13.5px; font-weight: 600; font-family: var(--font); cursor: pointer; transition: all .14s; margin-top: 10px; }
.lq-btn-back:hover { background: #f4f6fb; }
.lq-bar { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }

/* ══════════════════════════════════════════
   DOCUMENTO — Layout idéntico al formato físico
   ══════════════════════════════════════════ */
.lq-doc { background: #fff; border-radius: var(--r); border: 1px solid #c4cdd9; box-shadow: 0 4px 20px rgba(0,0,0,.10); overflow: hidden; animation: su .28s ease; }
@keyframes su { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

/* Encabezado del documento */
.lq-dochd { background: var(--primary); padding: 14px 22px; border-bottom: 4px solid var(--gold); text-align: center; }
.lq-dochd h2 { color: #fff; font-size: 14px; font-weight: 700; letter-spacing: .6px; margin: 0; text-transform: uppercase; }
.lq-dochd p { color: rgba(255,255,255,.5); font-size: 9.5px; margin: 4px 0 0; }
.lq-docb { padding: 14px 18px; }

/* Tablas del documento */
.dt { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 11px; }
.dt td { padding: 4px 7px; border: 1px solid #b8c4d4; vertical-align: middle; }
.dt th { padding: 5px 7px; border: 1px solid #b8c4d4; background: #d5e0ef; font-weight: 700; color: var(--primary); font-size: 9px; text-transform: uppercase; letter-spacing: .4px; text-align: center; }

/* Tipos de celda */
.dl  { background: #edf2f9; font-weight: 600; color: #1e293b; width: 50%; }
.dl2 { background: #edf2f9; font-weight: 600; color: #1e293b; }
.dv  { font-family: var(--mono); text-align: right; color: var(--text); font-size: 10.5px; }
.dvb { font-family: var(--mono); text-align: right; font-weight: 700; color: var(--primary); font-size: 10.5px; }
.fw  { font-weight: 700; }

/* Sección título (cabecera oscura) */
.sec { background: var(--primary); color: #fff !important; font-weight: 700 !important; text-transform: uppercase; letter-spacing: .5px; font-size: 9px !important; text-align: center; padding: 5px 7px !important; }

/* Fila total devengos / resumen */
.row-tot td { background: var(--primary); color: #fff; font-weight: 700; font-size: 12px; }
.row-tot .dvb { color: #fbbf24; font-size: 12px; }
.row-sub td  { background: #dce6f4; font-weight: 700; font-size: 10.5px; }
.row-yh td   { background: #d0dcee; font-weight: 700; color: var(--primary); font-size: 10px; }

/* Fórmulas */
.fm  { font-family: var(--mono); text-align: center; font-size: 10px; color: #334155; white-space: nowrap; }
.op  { text-align: center; color: var(--text-3); font-size: 9px; padding: 4px 2px !important; }

/* Grid 2 columnas para las cajas */
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-bottom: 8px; }
.bx { border: 1px solid #b8c4d4; border-radius: 4px; overflow: hidden; }
.bxhd { background: #d5e0ef; padding: 4px 8px; font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--primary); text-align: center; border-bottom: 1px solid #b8c4d4; }
.bx .dt { margin: 0; }
.bx .dt td { border-left: none; border-right: none; }
.bx .dt tr:last-child td { border-bottom: none; }
.bx .dl { width: 55%; }

/* Separador de año */
.yr-sep { background: var(--primary); color: #fbbf24; font-weight: 700; font-size: 10px; text-align: center; padding: 4px 8px; margin-bottom: 8px; border-radius: 4px; }

/* Textos legales */
.lq-legal { margin-top: 10px; padding: 9px 12px; background: #f7f9fc; border: 1px solid var(--border); font-size: 9.5px; color: var(--text-2); line-height: 1.65; border-radius: 4px; }
.lq-legal strong { color: var(--text); }
.lq-norms { margin-top: 7px; padding: 8px 10px; background: #f1f5f9; border: 1px solid var(--border); font-size: 8.5px; color: var(--text-2); line-height: 1.6; border-radius: 4px; }
.lq-norms strong { color: var(--text); }
.lq-norms-t { font-size: 8.5px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: .6px; margin-bottom: 3px; }
.lq-warn { margin-top: 7px; padding: 7px 10px; background: #fefce8; border: 1px solid #fde68a; font-size: 8.5px; color: #78521a; line-height: 1.5; border-radius: 4px; }

/* Firmas */
.lq-sigs { display: flex; justify-content: space-around; margin-top: 28px; padding-top: 4px; }
.lq-sig  { text-align: center; width: 180px; }
.lq-sig-ln { border-top: 1.5px solid #334155; padding-top: 5px; font-size: 9.5px; color: var(--text-2); font-weight: 600; }
.lq-sig-sub { font-size: 8.5px; color: var(--text-3); margin-top: 2px; }

/* Footer */
.lq-footer { text-align: center; padding: 16px 0 0; font-size: 10px; color: var(--text-3); }

/* ── IMPRESIÓN ── */
@media print {
  body { background: #fff !important; }
  .np { display: none !important; }
  .lq-hdr { display: none !important; }
  .lq-main { padding: 0 !important; max-width: 100% !important; }
  .lq-doc { box-shadow: none !important; border: none !important; border-radius: 0 !important; animation: none !important; }
  .lq-docb { padding: 5px 10px !important; }
  .dt { font-size: 9px !important; margin-bottom: 4px !important; }
  .dt td, .dt th { padding: 2px 5px !important; }
  .lq-dochd { padding: 7px 12px !important; }
  .lq-dochd h2 { font-size: 11px !important; }
  .g2 { gap: 4px !important; margin-bottom: 5px !important; }
  .lq-legal, .lq-warn, .lq-norms { padding: 4px 6px !important; font-size: 7.5px !important; margin-top: 4px !important; }
  .lq-sigs { margin-top: 14px !important; }
  .row-tot td { font-size: 10px !important; }
  .yr-sep { font-size: 9px !important; padding: 2px 6px !important; }
  .fm { font-size: 8.5px !important; }
  @page { size: letter portrait; margin: 8mm 10mm; }
}

/* ── RESPONSIVE ── */
@media (max-width: 680px) {
  .lq-card { padding: 16px; }
  .lq-r2, .lq-r3 { grid-template-columns: 1fr; }
  .g2 { grid-template-columns: 1fr; }
  .lq-sigs { flex-direction: column; align-items: center; gap: 20px; }
  .lq-main { padding: 14px 10px 44px; }
  .lq-ytbl { font-size: 11px; }
}
@media (max-width: 420px) {
  .lq-badge { display: none; }
  .lq-tb { min-width: 60px; font-size: 11px; padding: 6px 8px; }
  .lq-title { font-size: 14px; }
  .lq-sub { display: none; }
}
`;

/* ─── COMPONENTE PRINCIPAL ─── */
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
    const tVac = Math.max(0, tVB - vDesc);
    const tDev = tCes + tInt + tP1 + tP2 + tVac;
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
          /* ══════════════ FORMULARIO ══════════════ */
          <>
            {/* 01 — Empleado */}
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

            {/* 02 — Periodo */}
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

            {/* 03 — Salario */}
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
                    <tr><th>Año</th><th>Días</th><th>Salario mensual</th><th>Aux. transporte</th><th>Base total</th></tr>
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

            {/* 04 — Descuentos */}
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
          /* ══════════════ DOCUMENTO ══════════════ */
          <div>
            {/* Barra de acciones */}
            <div className="lq-bar np">
              <button className="lq-btn-s" onClick={() => setShow(false)}>← Editar datos</button>
              <button className="lq-btn-s" onClick={() => window.print()}>🖨 Imprimir / PDF</button>
            </div>

            <div className="lq-doc">
              {/* ── Encabezado ── */}
              <div className="lq-dochd">
                <h2>{emp || "Liquidación de Contrato de Trabajo"}</h2>
                <p>Liquidación definitiva de prestaciones sociales · Sector privado · Colombia</p>
              </div>

              <div className="lq-docb">

                {/* ── 1. Datos del empleado ── */}
                <table className="dt"><tbody>
                  <tr><td className="dl2" style={{ width: "28%" }}>Nombre del empleado</td><td style={{ fontWeight: 600 }}>{nom || "—"}</td><td className="dl2" style={{ width: "18%" }}>PPT / Cédula</td><td className="dv">{ced || "—"}</td></tr>
                  <tr><td className="dl2">Cargo</td><td>{car || "—"}</td><td className="dl2">Causa de la liquidación</td><td>{cau}</td></tr>
                </tbody></table>

                {/* ── Por segmento de año ── */}
                {R.rs.map((r, i) => {
                  const isLast = i === R.rs.length - 1;
                  const vacPend = isLast ? Math.max(0, r.d - R.vTom) : r.d;
                  return (
                    <div key={r.y}>
                      {R.multi && <div className="yr-sep">📅 Año {r.y} — {r.d} días laborados</div>}

                      {/* Periodo + Salario base */}
                      <div className="g2">
                        <div className="bx">
                          <div className="bxhd">Período de liquidación</div>
                          <table className="dt"><tbody>
                            <tr><td className="dl">Fecha de inicio contrato</td><td className="dv">{fDL(r.s)}</td></tr>
                            <tr><td className="dl">Fecha terminación contrato</td><td className="dv">{fDL(r.e)}</td></tr>
                            <tr><td className="dl fw">Tiempo total laborado</td><td className="dvb">{r.d} días</td></tr>
                          </tbody></table>
                        </div>
                        <div className="bx">
                          <div className="bxhd">Salario base de liquidación</div>
                          <table className="dt"><tbody>
                            <tr><td className="dl">Sueldo básico</td><td className="dv">{n$(r.sal)}</td></tr>
                            <tr><td className="dl">Auxilio de transporte</td><td className="dv">{n$(r.aux)}</td></tr>
                            <tr><td className="dl">Promedio bonificaciones</td><td className="dv">{n$(r.bon)}</td></tr>
                            <tr><td className="dl fw">Total base de liquidación</td><td className="dvb">{n$(r.base)}</td></tr>
                          </tbody></table>
                        </div>
                      </div>

                      {/* Prima + Cesantías */}
                      <div className="g2">
                        <div className="bx">
                          <div className="bxhd">Prima de servicios</div>
                          <table className="dt"><tbody>
                            <tr><td className="dl">Fecha de liquidación prima</td><td className="dv">{fD(r.e)}</td></tr>
                            <tr><td className="dl">Fecha de corte prima</td><td className="dv">{fD(r.s)}</td></tr>
                            {r.dp1 > 0 && <tr><td className="dl">Días prima 1er semestre</td><td className="dvb">{r.dp1}</td></tr>}
                            {r.dp2 > 0 && <tr><td className="dl">Días prima 2do semestre</td><td className="dvb">{r.dp2}</td></tr>}
                            {r.dp1 === 0 && r.dp2 === 0 && <tr><td className="dl">Días prima</td><td className="dvb">0</td></tr>}
                          </tbody></table>
                        </div>
                        <div className="bx">
                          <div className="bxhd">Cesantías</div>
                          <table className="dt"><tbody>
                            <tr><td className="dl">Fecha de liquidación cesantías</td><td className="dv">{fD(r.e)}</td></tr>
                            <tr><td className="dl">Fecha de corte cesantías</td><td className="dv">{fD(r.s)}</td></tr>
                            <tr><td className="dl">Días cesantías</td><td className="dvb">{r.d}</td></tr>
                          </tbody></table>
                        </div>
                      </div>

                      {/* Vacaciones + Intereses */}
                      <div className="g2">
                        <div className="bx">
                          <div className="bxhd">Vacaciones</div>
                          <table className="dt"><tbody>
                            <tr><td className="dl">Fecha de liquidación vacaciones</td><td className="dv">{fD(r.e)}</td></tr>
                            <tr><td className="dl">Fecha de corte vacaciones</td><td className="dv">{fD(r.s)}</td></tr>
                            <tr><td className="dl">Total días de vacaciones</td><td className="dvb">{r.d}</td></tr>
                            {isLast && <tr><td className="dl">Días tomados de vacaciones</td><td className="dv">{R.vTom}</td></tr>}
                            {isLast && <tr><td className="dl fw">Días pendientes</td><td className="dvb">{vacPend}</td></tr>}
                          </tbody></table>
                        </div>
                        <div className="bx">
                          <div className="bxhd">Intereses a las cesantías</div>
                          <table className="dt"><tbody>
                            <tr><td className="dl">Fecha de liquidación intereses</td><td className="dv">{fD(r.e)}</td></tr>
                            <tr><td className="dl">Fecha de corte intereses</td><td className="dv">{fD(r.s)}</td></tr>
                            <tr><td className="dl">Días intereses</td><td className="dvb">{r.d}</td></tr>
                          </tbody></table>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* ── 2. Resumen liquidación de pagos ── */}
                <table className="dt">
                  <thead>
                    <tr><td colSpan="8" className="sec">Resumen liquidación de pagos</td></tr>
                    <tr>
                      <th style={{ textAlign: "left", width: "30%" }}>Concepto</th>
                      <th>Valor base</th><th>/</th><th>Divisor</th><th>×</th><th>Días</th><th>=</th><th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {R.rs.map(r => (
                      <React.Fragment key={r.y}>
                        {R.multi && <tr className="row-yh"><td colSpan="8">Año {r.y} — {r.d} días — Base: {n$(r.base)}</td></tr>}
                        <tr>
                          <td className="dl2">Vacaciones pendientes {R.multi ? r.y : ""}</td>
                          <td className="fm">{nF(r.sal)}</td><td className="op">/</td><td className="fm">720</td>
                          <td className="op">×</td><td className="fm">{r.d}</td><td className="op">=</td>
                          <td className="dvb">{n$(r.vac)}</td>
                        </tr>
                        <tr>
                          <td className="dl2">Cesantías {R.multi ? r.y : ""}</td>
                          <td className="fm">{nF(r.base)}</td><td className="op">/</td><td className="fm">360</td>
                          <td className="op">×</td><td className="fm">{r.d}</td><td className="op">=</td>
                          <td className="dvb">{n$(r.ces)}</td>
                        </tr>
                        <tr>
                          <td className="dl2">Intereses de cesantías {R.multi ? r.y : ""}</td>
                          <td className="fm">{nF(Math.round(r.ces))}</td><td className="op">/</td><td className="fm">360</td>
                          <td className="op">×</td><td className="fm">{r.d} × 12%</td><td className="op">=</td>
                          <td className="dvb">{n$(r.int)}</td>
                        </tr>
                        {r.dp1 > 0 && <tr>
                          <td className="dl2">Prima servicios 1er sem. {R.multi ? r.y : ""}</td>
                          <td className="fm">{nF(r.base)}</td><td className="op">/</td><td className="fm">360</td>
                          <td className="op">×</td><td className="fm">{r.dp1}</td><td className="op">=</td>
                          <td className="dvb">{n$(r.p1)}</td>
                        </tr>}
                        {r.dp2 > 0 && <tr>
                          <td className="dl2">Prima servicios 2do sem. {R.multi ? r.y : ""}</td>
                          <td className="fm">{nF(r.base)}</td><td className="op">/</td><td className="fm">360</td>
                          <td className="op">×</td><td className="fm">{r.dp2}</td><td className="op">=</td>
                          <td className="dvb">{n$(r.p2)}</td>
                        </tr>}
                        {R.multi && <tr className="row-sub">
                          <td colSpan="7" style={{ textAlign: "right", paddingRight: 8 }}>Subtotal {r.y}</td>
                          <td className="dvb">{n$(r.sub)}</td>
                        </tr>}
                      </React.Fragment>
                    ))}
                    <tr style={{ background: "#dce6f4", fontWeight: 700 }}>
                      <td colSpan="7" style={{ textAlign: "right", paddingRight: 8 }}>TOTAL DEVENGOS</td>
                      <td className="dvb">{n$(R.tDev)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* ── 3. Descuentos ── */}
                <table className="dt">
                  <thead><tr><td colSpan="2" className="sec">Resumen descuentos liquidación</td></tr></thead>
                  <tbody>
                    <tr><td className="dl2">Cesantías consignadas</td><td className="dv">{n$(R.dc)}</td></tr>
                    <tr><td className="dl2">Prima pagada</td><td className="dv">{n$(R.dp)}</td></tr>
                    <tr><td className="dl2">Intereses de cesantías pagados</td><td className="dv">{n$(R.di)}</td></tr>
                    <tr style={{ background: "#dce6f4", fontWeight: 700 }}>
                      <td style={{ textAlign: "right", paddingRight: 8 }}>TOTAL DEDUCCIONES</td>
                      <td className="dvb">{n$(R.tDesc)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* ── 4. Valor final ── */}
                <table className="dt"><tbody>
                  <tr className="row-tot">
                    <td style={{ textAlign: "right", paddingRight: 10, fontWeight: 700 }}>VALOR LIQUIDACIÓN</td>
                    <td className="dvb" style={{ width: "30%" }}>{n$(R.val)}</td>
                  </tr>
                  <tr>
                    <td colSpan="2" style={{ fontSize: 9.5, color: "#4a5568", fontStyle: "italic", padding: "5px 8px" }}>
                      SON: ({NL(R.val)})
                    </td>
                  </tr>
                </tbody></table>

                {/* ── 5. Se hace constar ── */}
                <div className="lq-legal">
                  <strong>SE HACE CONSTAR:</strong><br /><br />
                  1. Que el patrono ha incorporado en la presente liquidación los importes correspondientes a salarios, horas extras, descansos compensatorios, cesantías, vacaciones, prima de servicios, auxilio de transporte, y en sí, todo concepto relacionado con salarios, prestaciones o indemnizaciones causadas al quedar extinguido el contrato de trabajo.<br /><br />
                  2. Que con el pago del dinero anotado en la presente liquidación, queda transada cualquier diferencia relativa al contrato de trabajo extinguido, o a cualquier diferencia anterior. Por lo tanto, esta transacción tiene como efecto la terminación de las obligaciones provenientes de la relación laboral que existió entre <strong>{emp || "el empleador"}</strong> y el trabajador, quienes declaran estar a paz y salvo por todo concepto.
                </div>

                {/* ── 6. Firmas ── */}
                <div className="lq-sigs">
                  <div className="lq-sig">
                    <div style={{ height: 34 }}></div>
                    <div className="lq-sig-ln">Firma del trabajador</div>
                    {nom && <div className="lq-sig-sub">{nom}</div>}
                    {ced && <div className="lq-sig-sub">C.C. {ced}</div>}
                  </div>
                  <div className="lq-sig">
                    <div style={{ height: 34 }}></div>
                    <div className="lq-sig-ln">Firma del empleador</div>
                    {emp && <div className="lq-sig-sub">{emp}</div>}
                  </div>
                </div>

                {/* ── 7. Normativa ── */}
                <div className="lq-norms">
                  <div className="lq-norms-t">📜 Fundamento normativo</div>
                  <strong>Cesantías:</strong> Art.249 CST · Ley 50/1990 — (Sal+Aux)×Días÷360 &nbsp;·&nbsp;
                  <strong>Intereses:</strong> Ley 52/1975 — Ces×Días×12%÷360 &nbsp;·&nbsp;
                  <strong>Prima:</strong> Art.306 CST — (Sal+Aux)×Días_sem÷360 · Pagos: jun.30 y dic.20 &nbsp;·&nbsp;
                  <strong>Vacaciones:</strong> Art.186 CST — Sal_básico×Días÷720 &nbsp;·&nbsp;
                  <strong>Días:</strong> Año comercial 360, conteo inclusivo &nbsp;·&nbsp;
                  <strong>Aux. transporte:</strong> Ley 15/1959 — aplica si salario ≤ 2 SMLMV.
                </div>
                <div className="lq-warn">
                  <strong>⚠ Aviso:</strong> Estimación informativa conforme a normatividad laboral colombiana vigente (sector privado). No aplica para servidores públicos, prestación de servicios, salario integral (Art.132 CST) ni régimen retroactivo de cesantías. Consulte un abogado laboralista.
                </div>

              </div>
            </div>

            <button className="lq-btn-back np" onClick={() => setShow(false)}>← Modificar datos</button>
            <div className="lq-footer np">Calculadora de Liquidación Laboral · Colombia · CST 2026</div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
