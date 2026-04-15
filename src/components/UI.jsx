import React, { useEffect } from "react";
import { useT } from "../theme";
import { X, ChevronDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function GCard({ c, style, cl = "", onClick }) {
  const T = useT();
  return <div className={`glass ${cl}`} style={{ borderRadius: T.radius, ...style }} onClick={onClick}>{c}</div>;
}

export function Pill({ c, color }) {
  return <span className="badge" style={{ background: color + "15", color, border: `1px solid ${color}30` }}>{c}</span>;
}

export function GBtn({ c, children, onClick, v = "copper", sz = "md", dis, icon, style = {}, type = "button", form }) {
  const s = { sm: { padding: "8px 14px", fontSize: 12 }, md: { padding: "10px 18px", fontSize: 13 }, lg: { padding: "12px 24px", fontSize: 14 } }[sz];
  return <button type={type} form={form} onClick={onClick} disabled={dis} className={`btn-${v}`} style={{ ...s, opacity: dis ? .5 : 1, cursor: dis ? "not-allowed" : "pointer", ...style }}>{icon}{c || children}</button>;
}

export function Lbl({ c, req }) {
  const T = useT();
  return <div style={{ fontSize: 12, fontWeight: 600, color: T.textSub, marginBottom: 6 }}>{c}{req && <span style={{ color: T.red }}> *</span>}</div>;
}

export function Field({ label, children, req, cl = "" }) {
  return <div className={cl}><Lbl c={label} req={req} />{children}</div>;
}

export function GIn({ value, onChange, placeholder, type = "text", readOnly, onKeyDown, min, max, step, maxLength, style: extraStyle }) {
  return <input className="inp" type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} onKeyDown={onKeyDown} min={min} max={max} step={step} maxLength={maxLength} style={readOnly ? { opacity: .6, cursor: "not-allowed", ...extraStyle } : extraStyle || {}} />;
}

export function GS({ value, onChange, children, placeholder, cl = "", style }) {
  const T = useT();
  return <div style={{ position: "relative", ...style }} className={cl}>
    <select className="sel" value={value} onChange={onChange}>
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
    <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: T.textMuted, pointerEvents: "none" }} />
  </div>;
}

export function GTa({ value, onChange, placeholder, rows = 3 }) {
  return <textarea className="inp" value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ resize: "vertical", minHeight: 80 }} />;
}

export function StChip({ stock, min }) {
  const T = useT();
  if (stock <= 0) return <Pill c="Out of Stock" color={T.red} />;
  if (stock <= min) return <Pill c="Low Stock" color={T.amber} />;
  return <Pill c="In Stock" color={T.green} />;
}

export function Toast({ msg, type }) {
  const T = useT();
  const c = type === "error" ? T.red : type === "success" ? T.green : T.amber;
  return <div className="fade-up" style={{ position: "fixed", bottom: 32, right: 32, zIndex: 500, padding: "14px 20px", borderRadius: T.radius, background: T.surface, borderLeft: `4px solid ${c}`, color: T.text, fontSize: 13, fontWeight: 600, boxShadow: T.shadowLg, display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
    {msg}
  </div>;
}

export function Modal({ open, onClose, title, children, footer, width = 560 }) {
  const T = useT();
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div onClick={onClose} className="modal-overlay" style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div className="glass-strong spring-in" onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: width, borderRadius: T.radius, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.surfaceStrong }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.text }}>{title}</div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 6, borderRadius: "50%" }}><X size={16} /></button>
        </div>
        <div style={{ padding: 24, overflowY: "auto" }}>{children}</div>
        {footer && <div style={{ padding: "16px 24px", borderTop: `1px solid ${T.border}`, background: T.surfaceStrong, display: "flex", justifyContent: "flex-end", gap: 12 }}>{footer}</div>}
      </div>
    </div>
  );
}

// Highly refined, sleek KPI Card
export function KCard({ label, value, sub, icon: Icon, color, delta, onClick, active }) {
  const T = useT();
  const c = color || T.accent;
  
  return <div className="glass" style={{ padding: 24, borderRadius: T.radius, cursor: onClick ? "pointer" : "default", border: active ? `2px solid ${c}` : `1px solid ${T.border}`, display: "flex", flexDirection: "column", height: "100%" }} onClick={onClick}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.textSub, marginBottom: 8, letterSpacing: "0.02em" }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: "-0.03em" }}>{value}</div>
      </div>
      <div style={{ width: 44, height: 44, borderRadius: T.radius, background: `${c}12`, display: "flex", alignItems: "center", justifyContent: "center", color: c }}>
        <Icon size={22} strokeWidth={2.5} />
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
      {delta !== undefined && (
        <span style={{ fontSize: 12, fontWeight: 600, color: delta >= 0 ? T.green : T.red, display: "flex", alignItems: "center", gap: 2, background: delta >= 0 ? T.greenBg : T.redBg, padding: "2px 8px", borderRadius: T.radiusFull }}>
          {delta >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {Math.abs(delta).toFixed(1)}%
        </span>
      )}
      {sub && <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{sub}</span>}
    </div>
  </div>;
}

export function PeriodBar({ df, setDf, dt, setDt, preset, setPreset, noFY = false }) {
  const T = useT();
  const PRESETS = [
    { k: "",   l: "All time" },
    { k: "1d", l: "Today" },
    { k: "7d", l: "Last 7 days" },
    { k: "30d", l: "Last 30 days" },
  ];
  const applyPreset = k => {
    setPreset(k);
    if (!k) { setDf(""); setDt(""); return; }
    const tod = new Date().toISOString().split("T")[0];
    switch (k) {
      case "1d":  setDf(tod); setDt(tod); break;
      case "7d":  setDf(new Date(Date.now()-7*864e5).toISOString().split("T")[0]); setDt(tod); break;
      case "30d": setDf(new Date(Date.now()-30*864e5).toISOString().split("T")[0]); setDt(tod); break;
    }
  };
  return (
    <div className="filter-wrap">
      <select value={preset || ""} onChange={e => applyPreset(e.target.value)} className="sel" style={{ width: 140, fontWeight: 600 }}>
        {PRESETS.map(p => <option key={p.k} value={p.k}>{p.l}</option>)}
      </select>
      <input type="date" className="inp" value={df || ""} onChange={e => { setDf(e.target.value); setPreset("custom"); }} style={{ width: 140 }} />
      <span style={{ color: T.textMuted }}>→</span>
      <input type="date" className="inp" value={dt || ""} onChange={e => { setDt(e.target.value); setPreset("custom"); }} style={{ width: 140 }} />
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", style = {} }) {
  const T = useT();
  return (
    <div style={{ position: "relative", ...style }}>
      <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, fill: "none", stroke: T.textMuted, strokeWidth: 2 }} viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input className="inp" value={value} onChange={onChange} placeholder={placeholder} style={{ paddingLeft: 38 }} />
    </div>
  );
}

export function DeleteConfirmModal({ open, onClose, onConfirm, user, label = "this item", extra = "" }) {
  const T = useT();
  const [pass, setPass] = React.useState("");
  const [err, setErr] = React.useState("");
  if (!open) return null;
  const go = () => {
    if (!pass) { setErr("Enter your password"); return; }
    if (pass !== user?.password) { setErr("Incorrect password"); return; }
    onConfirm(); setPass(""); setErr(""); onClose();
  };
  return (
    <Modal open={true} onClose={onClose} title="Confirm Deletion" width={400}>
      <div style={{ fontSize: 14, color: T.textSub, marginBottom: 16 }}>Are you sure you want to delete <strong>{label}</strong>? {extra} <br/><br/><span style={{ color: T.red, fontWeight: 600 }}>This action cannot be undone.</span></div>
      <Field label="Enter password to confirm" req>
        <GIn type="password" value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} autoFocus onKeyDown={e=>e.key==="Enter"&&go()} />
      </Field>
      {err && <div style={{ fontSize: 13, color: T.red, marginTop: 8 }}>{err}</div>}
      <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
        <GBtn v="ghost" onClick={onClose}>Cancel</GBtn>
        <GBtn v="danger" onClick={go}>Delete Permanently</GBtn>
      </div>
    </Modal>
  );
}

export function CTip({ active, payload, label, fmt }) {
  const T = useT();
  if (!active || !payload?.length) return null;
  return <div className="glass-strong" style={{ padding: "12px 16px", borderRadius: T.radius, fontSize: 12 }}>
    <div style={{ fontWeight: 600, color: T.textSub, marginBottom: 8 }}>{label}</div>
    {payload.map((p, i) => <div key={i} style={{ color: p.color, fontWeight: 700, fontSize: 13 }}>{p.name}: {fmt ? ("₹" + Number(p.value || 0).toLocaleString("en-IN")) : p.value}</div>)}
  </div>;
}

export function Pager({ total, page, ps, setPage, setPs }) {
  const T = useT();
  const tp = Math.ceil(total / ps);
  if (total <= 0) return null;
  let s = Math.max(1, page - 2), e = Math.min(tp, s + 4);
  if (e - s < 4) s = Math.max(1, e - 4);
  const nb = dis => ({ padding: "6px 12px", minWidth: 34, borderRadius: T.radius, border: `1px solid ${T.border}`, cursor: dis ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: dis ? T.textMuted : T.textSub, opacity: dis ? .5 : 1 });
  const range = [];
  for (let i = s; i <= e; i++) range.push(i);
  return <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderTop: `1px solid ${T.border}`, flexWrap: "wrap", background: T.surface, borderRadius: `0 0 ${T.radius} ${T.radius}` }}>
    <span style={{ fontSize: 13, color: T.textMuted, flex: 1, minWidth: 100 }}>Showing {Math.min((page - 1) * ps + 1, total)} to {Math.min(page * ps, total)} of <span style={{ fontWeight: 700, color: T.text }}>{total}</span> results</span>
    <select className="sel" value={ps} onChange={e => { setPs(Number(e.target.value)); setPage(1); }} style={{ width: "auto", padding: "8px 30px 8px 12px", fontSize: 13, fontWeight: 600 }}>
      {[20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
    </select>
    <div style={{ display: "flex", gap: 6 }}>
      <button onClick={() => setPage(1)} disabled={page <= 1} style={nb(page <= 1)}>«</button>
      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={nb(page <= 1)}>‹</button>
      {range.map(p => <button key={p} onClick={() => setPage(p)} style={{ padding: "6px 14px", minWidth: 34, borderRadius: T.radius, border: p === page ? `1px solid ${T.accent}` : `1px solid ${T.border}`, cursor: "pointer", fontWeight: 600, fontSize: 13, background: p === page ? T.accent : "transparent", color: p === page ? "#fff" : T.textSub, transition: "all 0.2s" }}>{p}</button>)}
      <button onClick={() => setPage(p => Math.min(tp, p + 1))} disabled={page >= tp} style={nb(page >= tp)}>›</button>
      <button onClick={() => setPage(tp)} disabled={page >= tp} style={nb(page >= tp)}>»</button>
    </div>
  </div>;
}
