import React, { useState, useMemo, useEffect } from "react";

/* ═══════════════════════════════════════════════
   PARÁMETROS LEGALES
═══════════════════════════════════════════════ */
const P = {
  2026: { smlmv: 1750905, aux: 249095 },
  2025: { smlmv: 1423500, aux: 200000 },
  2024: { smlmv: 1300000, aux: 162000 },
  2023: { smlmv: 1160000, aux: 140606 },
  2022: { smlmv: 1000000, aux: 117172 },
  2021: { smlmv: 908526, aux: 106454 },
  2020: { smlmv: 877803, aux: 102854 },
  2019: { smlmv: 828116, aux: 97032 },
  2018: { smlmv: 781242, aux: 88211 },
};
const gP = y => P[y] || P[2026];
const TODAY = new Date().toISOString().split("T")[0];

/* ═══════════════════════════════════════════════
   FORMATTERS
═══════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════
   CÁLCULO — Días comerciales 360 (CST)
═══════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════
   NÚMERO A LETRAS
═══════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════
   ESTILOS
═══════════════════════════════════════════════ */
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

:root{
  --bg:      #F0F2F5;
  --surf:    #FFFFFF;
  --bdr:     #E4E7ED;
  --bdr2:    #CBD1DB;
  --t1:      #0D1117;
  --t2:      #5A6478;
  --t3:      #9BA3B2;
  --ac:      #2563EB;
  --ac2:     #1D4ED8;
  --ac-lt:   #EEF3FD;
  --ac-mid:  #BFCFEF;
  --hdr:     #141C2E;
  --hdr2:    #1E2A42;
  --r:       12px;
  --rs:      7px;
  --font:    'Inter',system-ui,-apple-system,sans-serif;
  --mono:    'JetBrains Mono','Courier New',monospace;
  --sh:      0 1px 3px rgba(0,0,0,.07),0 4px 12px rgba(0,0,0,.05);
  --sh2:     0 2px 8px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.07);
}

html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
body{margin:0;padding:0;background:var(--bg);}

/* ── APP ── */
.app{min-height:100vh;min-height:100dvh;background:var(--bg);font-family:var(--font);color:var(--t1);font-size:14px;line-height:1.55;}

/* ── HEADER ── */
.hdr{position:sticky;top:0;z-index:100;background:var(--hdr);border-bottom:1px solid rgba(255,255,255,.06);}
.hdr-in{max-width:760px;margin:0 auto;padding:0 24px;height:54px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
.hdr-brand{display:flex;align-items:center;gap:12px;}
.hdr-ico{width:32px;height:32px;background:var(--ac);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
.hdr-name{font-size:14.5px;font-weight:600;color:#FFFFFF;letter-spacing:-.25px;}
.hdr-leg{font-size:10px;color:rgba(255,255,255,.38);margin-top:1px;}
.hdr-badge{font-size:10px;font-weight:500;font-family:var(--mono);color:rgba(255,255,255,.35);letter-spacing:.3px;white-space:nowrap;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:5px;padding:4px 9px;}

/* ── MAIN ── */
.main{max-width:760px;margin:0 auto;padding:28px 16px 80px;}

/* ── CARD ── */
.card{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r);box-shadow:var(--sh);padding:24px;margin-bottom:10px;}
.card-hd{display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--bdr);}
.card-n{font-family:var(--mono);font-size:9.5px;font-weight:600;color:var(--ac);background:var(--ac-lt);padding:2px 7px;border-radius:4px;letter-spacing:.3px;flex-shrink:0;}
.card-title{font-size:13.5px;font-weight:600;color:var(--t1);letter-spacing:-.2px;}

/* ── FIELDS ── */
.f{margin-bottom:14px;}
.f:last-child{margin-bottom:0;}
.lbl{display:block;font-size:11px;font-weight:500;color:var(--t2);margin-bottom:6px;letter-spacing:-.1px;}
.inp{width:100%;padding:10px 13px;background:#FAFBFC;border:1.5px solid var(--bdr);border-radius:var(--rs);color:var(--t1);font-size:14px;font-family:var(--font);outline:none;-webkit-appearance:none;appearance:none;transition:border-color .15s,box-shadow .15s,background .15s;min-height:44px;}
.inp:focus{border-color:var(--ac);box-shadow:0 0 0 3px rgba(37,99,235,.1);background:#fff;}
.inp::placeholder{color:var(--t3);}
input[type="date"].inp{font-family:var(--font);}

/* ── GRIDS ── */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
.ga{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;}

/* ── TOGGLE — segmented ── */
.tog{display:flex;background:#ECEEF2;border-radius:var(--rs);padding:3px;gap:2px;}
.tb{flex:1;padding:8px 10px;background:transparent;border:none;border-radius:5px;color:var(--t2);font-size:12.5px;font-weight:500;font-family:var(--font);cursor:pointer;transition:all .15s;text-align:center;min-height:36px;line-height:1.2;}
.tb:hover{color:var(--t1);}
.tb.on{background:#fff;color:var(--ac);font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,.12);}

/* ── CAUSA ── */
.seg{display:flex;flex-wrap:wrap;gap:6px;}
.sb{padding:7px 15px;background:transparent;border:1.5px solid var(--bdr);border-radius:20px;color:var(--t2);font-size:12px;font-weight:500;font-family:var(--font);cursor:pointer;transition:all .15s;white-space:nowrap;min-height:36px;}
.sb:hover{border-color:var(--ac-mid);color:var(--ac);}
.sb.on{background:var(--ac);border-color:var(--ac);color:#fff;font-weight:600;}

/* ── PILL ── */
.pill{display:inline-flex;align-items:center;gap:4px;padding:4px 11px;border-radius:20px;background:var(--ac-lt);border:1.5px solid var(--ac-mid);color:var(--ac);font-size:10.5px;font-weight:600;cursor:pointer;font-family:var(--mono);margin-top:7px;transition:all .12s;}
.pill:hover{background:#dde8fd;border-color:var(--ac);}
.hint{font-size:11px;color:var(--t3);margin-top:5px;line-height:1.4;}
.info{margin-top:14px;padding:11px 14px;background:var(--ac-lt);border-radius:var(--rs);border:1.5px solid var(--ac-mid);font-size:12px;color:#1E40AF;line-height:1.6;}

/* ── YEAR TABLE ── */
.ytbl{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px;}
.ytbl th{padding:8px 9px;background:#F4F6FB;font-size:9px;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.5px;border:1px solid var(--bdr);text-align:center;}
.ytbl td{padding:6px 9px;border:1px solid var(--bdr);vertical-align:middle;}
.yl{font-weight:700;color:var(--ac);font-family:var(--mono);font-size:12px;background:var(--ac-lt);text-align:center;white-space:nowrap;}
.yd{font-family:var(--mono);text-align:center;color:var(--t2);font-size:11px;}
.yi{width:100%;padding:5px 8px;background:#fff;border:1.5px solid var(--bdr);border-radius:4px;font-size:12px;font-family:var(--mono);color:var(--t1);outline:none;text-align:right;transition:border-color .14s;min-height:32px;}
.yi:focus{border-color:var(--ac);}
.yq{font-size:9px;color:var(--ac);cursor:pointer;display:block;text-align:right;margin-top:3px;opacity:.65;transition:opacity .1s;}
.yq:hover{opacity:1;}
.ytot{font-family:var(--mono);text-align:right;font-weight:700;color:var(--t1);font-size:11px;background:#F8FAFF;}
.tbl-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}

/* ── BUTTONS ── */
.btn-p{width:100%;padding:15px 20px;background:var(--ac);color:#fff;border:none;border-radius:var(--r);font-size:14.5px;font-weight:600;font-family:var(--font);cursor:pointer;transition:background .15s,transform .1s,box-shadow .15s;margin-top:4px;letter-spacing:-.1px;min-height:52px;box-shadow:0 2px 8px rgba(37,99,235,.35);}
.btn-p:hover:not(:disabled){background:var(--ac2);box-shadow:0 4px 14px rgba(37,99,235,.45);}
.btn-p:active:not(:disabled){transform:scale(.99);}
.btn-p:disabled{opacity:.3;cursor:not-allowed;box-shadow:none;}

.btn-s{padding:9px 16px;background:#fff;color:var(--t2);border:1.5px solid var(--bdr);border-radius:var(--rs);font-size:13px;font-weight:500;font-family:var(--font);cursor:pointer;transition:all .14s;display:inline-flex;align-items:center;gap:7px;min-height:40px;}
.btn-s:hover{background:#F5F7FC;border-color:var(--bdr2);color:var(--t1);}

.btn-pr{padding:9px 20px;background:var(--hdr);color:#fff;border:none;border-radius:var(--rs);font-size:13px;font-weight:500;font-family:var(--font);cursor:pointer;transition:background .14s;display:inline-flex;align-items:center;gap:7px;min-height:40px;}
.btn-pr:hover{background:var(--hdr2);}

.btn-b{width:100%;padding:12px;background:#fff;color:var(--t2);border:1.5px solid var(--bdr);border-radius:var(--r);font-size:13px;font-weight:500;font-family:var(--font);cursor:pointer;transition:all .14s;margin-top:10px;min-height:44px;}
.btn-b:hover{background:#F5F7FC;color:var(--t1);}
.abar{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;align-items:center;}

/* ═══════════════════════════════════════════════
   DOCUMENTO
═══════════════════════════════════════════════ */
.doc{background:#fff;border-radius:var(--r);border:1px solid var(--bdr2);box-shadow:var(--sh2);overflow:hidden;animation:su .24s ease;}
@keyframes su{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}

.dochd{background:var(--hdr);padding:16px 24px;border-bottom:3px solid var(--ac);text-align:center;}
.dochd h2{color:#fff;font-size:13px;font-weight:700;letter-spacing:.5px;margin:0;text-transform:uppercase;}
.dochd p{color:rgba(255,255,255,.4);font-size:9.5px;margin:4px 0 0;}
.docb{padding:16px 20px;overflow-x:auto;}

/* Tablas del documento */
.dt{width:100%;border-collapse:collapse;margin-bottom:8px;font-size:11px;}
.dt td{padding:4px 7px;border:1px solid #D4DAE4;vertical-align:middle;}
.dt th{padding:5px 7px;border:1px solid #D4DAE4;background:#DDE4F0;font-weight:700;color:#1E2A42;font-size:9px;text-transform:uppercase;letter-spacing:.4px;text-align:center;}
.dl{background:#EBF0F9;font-weight:600;color:#1A2234;width:50%;}
.dl2{background:#EBF0F9;font-weight:600;color:#1A2234;}
.dv{font-family:var(--mono);text-align:right;color:#374151;font-size:10.5px;}
.dvb{font-family:var(--mono);text-align:right;font-weight:700;color:#111827;font-size:10.5px;}
.fw{font-weight:700;}
.sec{background:var(--hdr);color:#fff!important;font-weight:700!important;text-transform:uppercase;letter-spacing:.5px;font-size:9px!important;text-align:center;padding:5px 7px!important;}
.row-tot td{background:var(--hdr);color:#fff;font-weight:700;font-size:12px;}
.row-tot .dvb{color:#60A5FA;font-size:12px;}
.row-sub td{background:#DCE7F7;font-weight:700;font-size:10.5px;}
.row-yh td{background:#D4DFEE;font-weight:700;color:#1E2A42;font-size:10px;}
.fm{font-family:var(--mono);text-align:center;font-size:10px;color:#4B5563;white-space:nowrap;}
.op{text-align:center;color:var(--t3);font-size:9px;padding:4px 2px!important;}

/* Grid 2 col en documento */
.dg2{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;}
.bx{border:1px solid #D4DAE4;border-radius:5px;overflow:hidden;}
.bxhd{background:#DDE4F0;padding:4px 9px;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#1E2A42;text-align:center;border-bottom:1px solid #D4DAE4;}
.bx .dt{margin:0;}
.bx .dt td{border-left:none;border-right:none;}
.bx .dt tr:last-child td{border-bottom:none;}
.bx .dl{width:55%;}
.yr-sep{background:var(--hdr);color:#93C5FD;font-weight:700;font-size:10px;text-align:center;padding:4px 8px;margin-bottom:8px;border-radius:5px;}

/* Textos legales */
.legal{margin-top:10px;padding:10px 12px;background:#F8FAFC;border:1px solid var(--bdr);font-size:9.5px;color:#4B5563;line-height:1.7;border-radius:5px;}
.legal strong{color:#111827;}
.norms{margin-top:6px;padding:8px 10px;background:#F3F6FB;border:1px solid var(--bdr);font-size:8.5px;color:#5A6478;line-height:1.65;border-radius:5px;}
.norms strong{color:#1E2A42;}
.norms-t{font-size:8.5px;font-weight:700;color:#1E2A42;text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px;}
.warn{margin-top:6px;padding:7px 10px;background:#FFFBEB;border:1px solid #FDE68A;font-size:8.5px;color:#7C4F0F;line-height:1.55;border-radius:5px;}

/* Firmas */
.sigs{display:flex;justify-content:space-around;margin-top:28px;padding-top:4px;}
.sig{text-align:center;width:180px;}
.sig-ln{border-top:1.5px solid #9CA3AF;padding-top:6px;font-size:9.5px;color:#4B5563;font-weight:600;}
.sig-sub{font-size:8.5px;color:var(--t3);margin-top:2px;}

/* Footer */
.footer{text-align:center;padding:16px 0 0;font-size:10px;color:var(--t3);}

/* ═══════════════════════════════════════════════
   IMPRESIÓN — layout fijo, siempre igual
═══════════════════════════════════════════════ */
@media print{
  @page{size:letter portrait;margin:6mm 8mm;}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}
  body,html{background:#fff!important;}
  .np{display:none!important;}
  .hdr{display:none!important;}
  .main{padding:0!important;max-width:100%!important;margin:0!important;}
  .app{background:#fff!important;min-height:unset!important;}
  .doc{box-shadow:none!important;border:none!important;border-radius:0!important;animation:none!important;page-break-inside:avoid;break-inside:avoid;}
  .dochd{padding:5px 10px!important;}
  .dochd h2{font-size:11px!important;}
  .dochd p{font-size:8px!important;margin:2px 0 0!important;}
  .docb{padding:4px 8px!important;overflow:visible!important;zoom:0.82;}
  .dt{font-size:8px!important;margin-bottom:3px!important;}
  .dt td,.dt th{padding:2px 4px!important;line-height:1.3!important;}
  .dg2{gap:3px!important;margin-bottom:4px!important;}
  .bxhd{padding:2px 6px!important;font-size:7.5px!important;}
  .legal{padding:3px 6px!important;font-size:7px!important;margin-top:3px!important;line-height:1.5!important;}
  .warn{padding:2px 5px!important;font-size:7px!important;margin-top:3px!important;line-height:1.4!important;}
  .norms{padding:3px 6px!important;font-size:7px!important;margin-top:3px!important;line-height:1.5!important;}
  .norms-t{font-size:7px!important;margin-bottom:2px!important;}
  .sigs{margin-top:10px!important;padding-top:2px!important;}
  .sig{width:140px!important;}
  .sig-ln{font-size:8px!important;padding-top:4px!important;}
  .sig-sub{font-size:7.5px!important;}
  .row-tot td{font-size:9px!important;}
  .row-yh td{font-size:8px!important;}
  .yr-sep{font-size:8px!important;padding:2px 5px!important;margin-bottom:4px!important;}
  .fm{font-size:7.5px!important;}
  .dvb{font-size:8px!important;}
  .dv{font-size:8px!important;}
  .dl,.dl2{font-size:8px!important;}
  .sec{font-size:8px!important;padding:3px 5px!important;}
}

/* ═══════════════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════════════ */
@media(max-width:640px){
  .hdr-badge{display:none;}
  .hdr-leg{display:none;}
  .hdr-in{padding:0 16px;}
  .card{padding:18px;}
  .g2,.g3,.ga{grid-template-columns:1fr;}
  .dg2{grid-template-columns:1fr;}
  .sigs{flex-direction:column;align-items:center;gap:20px;}
  .main{padding:16px 12px 60px;}
  .ytbl{font-size:11px;}
  .tb{font-size:12px;}
  .btn-p{font-size:14px;}
}
@media(max-width:400px){
  .hdr-name{font-size:13.5px;}
  .card{padding:16px;}
  .sb{font-size:11.5px;padding:6px 11px;}
}
@media(min-width:641px) and (max-width:900px){
  .main{padding:22px 24px 64px;}
}
`;

/* ═══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════ */
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
    const tD = rs.reduce((a, r) => a + r.d, 0);
    const tCes = rs.reduce((a, r) => a + r.ces, 0);
    const tInt = rs.reduce((a, r) => a + r.int, 0);
    const tP1 = rs.reduce((a, r) => a + r.p1, 0);
    const tP2 = rs.reduce((a, r) => a + r.p2, 0);
    const tVB = rs.reduce((a, r) => a + r.vac, 0);
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
    <div className="app">
      <style>{CSS}</style>

      {/* ══ HEADER ══ */}
      <header className="hdr">
        <div className="hdr-in">
          <div className="hdr-brand">
            <div className="hdr-ico">⚖</div>
            <div>
              <div className="hdr-name">Liquidación Laboral</div>
              <div className="hdr-leg">Prestaciones sociales · Colombia · CST vigente</div>
            </div>
          </div>
          <div className="hdr-badge">CO · 2026</div>
        </div>
      </header>

      <main className="main">
        {!show ? (
          /* ══ FORMULARIO ══ */
          <>
            {/* 01 — Empleado */}
            <div className="card">
              <div className="card-hd"><span className="card-n">01 —</span><span className="card-title">Información del empleado</span></div>
              <div className="f">
                <label className="lbl">Empresa / Empleador</label>
                <input className="inp" placeholder="Razón social o nombre del empleador" value={emp} onChange={e => setEmp(e.target.value)} />
              </div>
              <div className="ga">
                <div className="f">
                  <label className="lbl">Nombre del empleado</label>
                  <input className="inp" placeholder="Nombre completo" value={nom} onChange={e => setNom(e.target.value)} />
                </div>
                <div className="f">
                  <label className="lbl">Cédula / PPT</label>
                  <input className="inp" placeholder="Número de documento" value={ced} onChange={e => setCed(e.target.value)} inputMode="numeric" />
                </div>
                <div className="f">
                  <label className="lbl">Cargo</label>
                  <input className="inp" placeholder="Cargo o posición" value={car} onChange={e => setCar(e.target.value)} />
                </div>
              </div>
              <div className="f" style={{ marginBottom: 0 }}>
                <label className="lbl">Causa de la liquidación</label>
                <div className="seg">
                  {CAUSAS.map(c => (
                    <button key={c} className={`sb${cau === c ? " on" : ""}`} onClick={() => setCau(c)}>{c}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* 02 — Periodo */}
            <div className="card">
              <div className="card-hd"><span className="card-n">02 —</span><span className="card-title">Período de liquidación</span></div>
              <div className="g2">
                <div className="f">
                  <label className="lbl">Fecha de inicio del contrato</label>
                  <input type="date" className="inp" value={fi} onChange={e => setFi(e.target.value)} />
                </div>
                <div className="f">
                  <label className="lbl">Fecha de terminación</label>
                  <input type="date" className="inp" value={fr} onChange={e => setFr(e.target.value)} />
                  <button className="pill" onClick={() => setFr(TODAY)}>Usar fecha de hoy</button>
                </div>
              </div>
              {yrs.length > 1 && (
                <div className="info">
                  <strong>Contrato de {yrs.length} años</strong> ({yrs.map(s => s.y).join(", ")}). Se liquidará cada año de forma independiente con sus parámetros legales vigentes.
                </div>
              )}
            </div>

            {/* 03 — Salario */}
            <div className="card">
              <div className="card-hd"><span className="card-n">03 —</span><span className="card-title">Salario y auxilio de transporte</span></div>
              <div className="g2">
                <div className="f">
                  <label className="lbl">¿El salario fue igual todos los años?</label>
                  <div className="tog">
                    <button className={`tb${sameSal ? " on" : ""}`} onClick={() => setSameSal(true)}>Sí, el mismo</button>
                    <button className={`tb${!sameSal ? " on" : ""}`} onClick={() => setSameSal(false)}>No, cambió</button>
                  </div>
                </div>
                <div className="f">
                  <label className="lbl">¿Recibe auxilio de transporte?</label>
                  <div className="tog" style={{ maxWidth: 180 }}>
                    <button className={`tb${hasAux ? " on" : ""}`} onClick={() => setHasAux(true)}>Sí</button>
                    <button className={`tb${!hasAux ? " on" : ""}`} onClick={() => setHasAux(false)}>No</button>
                  </div>
                  <div className="hint">Aplica si salario ≤ 2 SMLMV · Ley 15/1959</div>
                </div>
              </div>
              {sameSal && (
                <div className="f">
                  <label className="lbl">Salario mensual</label>
                  <input type="text" className="inp" placeholder="Ingrese el salario mensual" value={gSal}
                    onChange={fI(setGSal)} inputMode="numeric" style={{ maxWidth: 280 }} />
                  <button className="pill" onClick={() => setGSal(nF(gP(2026).smlmv))}>
                    SMLMV 2026 · ${nF(gP(2026).smlmv)}
                  </button>
                </div>
              )}
              <div className="f">
                <label className="lbl">Promedio bonificaciones mensuales</label>
                <input type="text" className="inp" placeholder="$ 0 — si no aplica, deje en blanco" value={bon}
                  onChange={fI(setBon)} inputMode="numeric" style={{ maxWidth: 280 }} />
              </div>
              {yrs.length > 0 && (
                <div className="tbl-scroll">
                  <table className="ytbl">
                    <thead>
                      <tr><th>Año</th><th>Días</th><th>Salario mensual</th><th>Aux. transporte</th><th>Base total</th></tr>
                    </thead>
                    <tbody>
                      {yrs.map(s => {
                        const y = s.y, d = yd[y] || { sal: "", aux: "0" }, p = gP(y);
                        const sl = pN(d.sal), ax = pN(d.aux), dd = dias(s.s, s.e);
                        return (
                          <tr key={y}>
                            <td className="yl">{y}</td>
                            <td className="yd">{dd}</td>
                            <td>
                              <input className="yi" value={d.sal} inputMode="numeric" placeholder="Salario"
                                onChange={e => { const r = e.target.value.replace(/[^\d]/g, ""); uY(y, "sal", r ? nF(+r) : ""); if (sameSal) setGSal(r ? nF(+r) : ""); }} />
                              <span className="yq" onClick={() => { uY(y, "sal", nF(p.smlmv)); if (sameSal) setGSal(nF(p.smlmv)); }}>
                                SMLMV {y} · ${nF(p.smlmv)}
                              </span>
                            </td>
                            <td>
                              <input className="yi" value={d.aux} inputMode="numeric"
                                onChange={e => { const r = e.target.value.replace(/[^\d]/g, ""); uY(y, "aux", r ? nF(+r) : ""); }} />
                              <span className="yq" onClick={() => uY(y, "aux", nF(p.aux))}>Legal {y} · ${nF(p.aux)}</span>
                            </td>
                            <td className="ytot">{n$(sl + ax + pN(bon))}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 04 — Vacaciones y descuentos */}
            <div className="card">
              <div className="card-hd"><span className="card-n">04 —</span><span className="card-title">Vacaciones y descuentos previos</span></div>
              <div className="f">
                <label className="lbl">Días de vacaciones ya tomados</label>
                <input type="number" className="inp" value={vt} onChange={e => setVt(e.target.value)} min="0" style={{ maxWidth: 140 }} />
              </div>
              <div className="g3">
                <div className="f">
                  <label className="lbl">Cesantías ya consignadas</label>
                  <input type="text" className="inp" placeholder="$ 0" value={dCes} onChange={fI(setDCes)} inputMode="numeric" />
                </div>
                <div className="f">
                  <label className="lbl">Prima ya pagada</label>
                  <input type="text" className="inp" placeholder="$ 0" value={dPri} onChange={fI(setDPri)} inputMode="numeric" />
                </div>
                <div className="f">
                  <label className="lbl">Int. cesantías pagados</label>
                  <input type="text" className="inp" placeholder="$ 0" value={dInt} onChange={fI(setDInt)} inputMode="numeric" />
                </div>
              </div>
            </div>

            <button className="btn-p" disabled={!ok} onClick={() => ok && setShow(true)}>
              {ok ? "Generar liquidación →" : "Complete los campos requeridos"}
            </button>
          </>

        ) : R ? (
          /* ══ DOCUMENTO ══ */
          <div>
            <div className="abar np">
              <button className="btn-s" onClick={() => setShow(false)}>← Editar datos</button>
              <button className="btn-pr" onClick={() => window.print()}>Imprimir / PDF</button>
            </div>

            <div className="doc">
              {/* Encabezado */}
              <div className="dochd">
                <h2>{emp || "Liquidación de Contrato de Trabajo"}</h2>
                <p>Liquidación definitiva de prestaciones sociales · Sector privado · Colombia</p>
              </div>

              <div className="docb">

                {/* 1. Datos del empleado */}
                <table className="dt"><tbody>
                  <tr>
                    <td className="dl2" style={{ width: "28%" }}>Nombre del empleado</td>
                    <td style={{ fontWeight: 600 }}>{nom || "—"}</td>
                    <td className="dl2" style={{ width: "18%" }}>PPT / Cédula</td>
                    <td className="dv">{ced || "—"}</td>
                  </tr>
                  <tr>
                    <td className="dl2">Cargo</td>
                    <td>{car || "—"}</td>
                    <td className="dl2">Causa de la liquidación</td>
                    <td>{cau}</td>
                  </tr>
                </tbody></table>

                {/* Por segmento de año */}
                {R.rs.map((r, i) => {
                  const isLast = i === R.rs.length - 1;
                  const vacPend = isLast ? Math.max(0, r.d - R.vTom) : r.d;
                  return (
                    <div key={r.y}>
                      {R.multi && <div className="yr-sep">Año {r.y} — {r.d} días laborados</div>}

                      {/* Período + Salario base */}
                      <div className="dg2">
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
                      <div className="dg2">
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
                      <div className="dg2">
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

                {/* 2. Resumen liquidación de pagos */}
                <div className="tbl-scroll">
                <table className="dt" style={{ minWidth: 500 }}>
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
                          <td className="dl2">Vacaciones pendientes{R.multi ? ` ${r.y}` : ""}</td>
                          <td className="fm">{nF(r.sal)}</td><td className="op">/</td><td className="fm">720</td>
                          <td className="op">×</td><td className="fm">{r.d}</td><td className="op">=</td>
                          <td className="dvb">{n$(r.vac)}</td>
                        </tr>
                        <tr>
                          <td className="dl2">Cesantías{R.multi ? ` ${r.y}` : ""}</td>
                          <td className="fm">{nF(r.base)}</td><td className="op">/</td><td className="fm">360</td>
                          <td className="op">×</td><td className="fm">{r.d}</td><td className="op">=</td>
                          <td className="dvb">{n$(r.ces)}</td>
                        </tr>
                        <tr>
                          <td className="dl2">Intereses de cesantías{R.multi ? ` ${r.y}` : ""}</td>
                          <td className="fm">{nF(Math.round(r.ces))}</td><td className="op">/</td><td className="fm">360</td>
                          <td className="op">×</td><td className="fm">{r.d} × 12%</td><td className="op">=</td>
                          <td className="dvb">{n$(r.int)}</td>
                        </tr>
                        {r.dp1 > 0 && (
                          <tr>
                            <td className="dl2">Prima servicios 1er sem.{R.multi ? ` ${r.y}` : ""}</td>
                            <td className="fm">{nF(r.base)}</td><td className="op">/</td><td className="fm">360</td>
                            <td className="op">×</td><td className="fm">{r.dp1}</td><td className="op">=</td>
                            <td className="dvb">{n$(r.p1)}</td>
                          </tr>
                        )}
                        {r.dp2 > 0 && (
                          <tr>
                            <td className="dl2">Prima servicios 2do sem.{R.multi ? ` ${r.y}` : ""}</td>
                            <td className="fm">{nF(r.base)}</td><td className="op">/</td><td className="fm">360</td>
                            <td className="op">×</td><td className="fm">{r.dp2}</td><td className="op">=</td>
                            <td className="dvb">{n$(r.p2)}</td>
                          </tr>
                        )}
                        {R.multi && (
                          <tr className="row-sub">
                            <td colSpan="7" style={{ textAlign: "right", paddingRight: 8 }}>Subtotal {r.y}</td>
                            <td className="dvb">{n$(r.sub)}</td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    <tr style={{ background: "#D4E2F4", fontWeight: 700 }}>
                      <td colSpan="7" style={{ textAlign: "right", paddingRight: 8 }}>TOTAL DEVENGOS</td>
                      <td className="dvb">{n$(R.tDev)}</td>
                    </tr>
                  </tbody>
                </table>
                </div>

                {/* 3. Descuentos */}
                <table className="dt">
                  <thead><tr><td colSpan="2" className="sec">Resumen descuentos liquidación</td></tr></thead>
                  <tbody>
                    <tr><td className="dl2">Cesantías consignadas</td><td className="dv">{n$(R.dc)}</td></tr>
                    <tr><td className="dl2">Prima pagada</td><td className="dv">{n$(R.dp)}</td></tr>
                    <tr><td className="dl2">Intereses de cesantías pagados</td><td className="dv">{n$(R.di)}</td></tr>
                    <tr style={{ background: "#D4E2F4", fontWeight: 700 }}>
                      <td style={{ textAlign: "right", paddingRight: 8 }}>TOTAL DEDUCCIONES</td>
                      <td className="dvb">{n$(R.tDesc)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* 4. Valor final */}
                <table className="dt"><tbody>
                  <tr className="row-tot">
                    <td style={{ textAlign: "right", paddingRight: 10, fontWeight: 700 }}>VALOR LIQUIDACIÓN</td>
                    <td className="dvb" style={{ width: "30%" }}>{n$(R.val)}</td>
                  </tr>
                  <tr>
                    <td colSpan="2" style={{ fontSize: 9.5, color: "#4A5568", fontStyle: "italic", padding: "5px 8px" }}>
                      SON: ({NL(R.val)})
                    </td>
                  </tr>
                </tbody></table>

                {/* 5. Se hace constar */}
                <div className="legal">
                  <strong>SE HACE CONSTAR:</strong><br /><br />
                  1. Que el patrono ha incorporado en la presente liquidación los importes correspondientes a salarios, horas extras, descansos compensatorios, cesantías, vacaciones, prima de servicios, auxilio de transporte, y en sí, todo concepto relacionado con salarios, prestaciones o indemnizaciones causadas al quedar extinguido el contrato de trabajo.<br /><br />
                  2. Que con el pago del dinero anotado en la presente liquidación, queda transada cualquier diferencia relativa al contrato de trabajo extinguido, o a cualquier diferencia anterior. Por lo tanto, esta transacción tiene como efecto la terminación de las obligaciones provenientes de la relación laboral que existió entre <strong>{emp || "el empleador"}</strong> y el trabajador, quienes declaran estar a paz y salvo por todo concepto.
                </div>

                {/* 6. Firmas */}
                <div className="sigs">
                  <div className="sig">
                    <div style={{ height: 34 }}></div>
                    <div className="sig-ln">Firma del trabajador</div>
                    {nom && <div className="sig-sub">{nom}</div>}
                    {ced && <div className="sig-sub">C.C. {ced}</div>}
                  </div>
                  <div className="sig">
                    <div style={{ height: 34 }}></div>
                    <div className="sig-ln">Firma del empleador</div>
                    {emp && <div className="sig-sub">{emp}</div>}
                  </div>
                </div>

                {/* 7. Normativa */}
                <div className="norms">
                  <div className="norms-t">Fundamento normativo</div>
                  <strong>Cesantías:</strong> Art.249 CST · Ley 50/1990 — (Sal+Aux)×Días÷360 &nbsp;·&nbsp;
                  <strong>Intereses:</strong> Ley 52/1975 — Ces×Días×12%÷360 &nbsp;·&nbsp;
                  <strong>Prima:</strong> Art.306 CST — (Sal+Aux)×Días_sem÷360 · Pagos: jun.30 y dic.20 &nbsp;·&nbsp;
                  <strong>Vacaciones:</strong> Art.186 CST — Sal_básico×Días÷720 &nbsp;·&nbsp;
                  <strong>Días:</strong> Año comercial 360, conteo inclusivo &nbsp;·&nbsp;
                  <strong>Aux. transporte:</strong> Ley 15/1959 — aplica si salario ≤ 2 SMLMV.
                </div>
                <div className="warn">
                  <strong>Aviso:</strong> Estimación informativa conforme a normatividad laboral colombiana vigente (sector privado). No aplica para servidores públicos, prestación de servicios, salario integral (Art.132 CST) ni régimen retroactivo de cesantías. Consulte un abogado laboralista.
                </div>

              </div>
            </div>

            <button className="btn-b np" onClick={() => setShow(false)}>← Modificar datos</button>
            <div className="footer np">Calculadora de Liquidación Laboral · Colombia · CST 2026</div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
