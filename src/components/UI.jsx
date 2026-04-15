import React, { useEffect } from "react";
import { useT } from "../theme";
import { X, ChevronDown, ArrowUpRight, ArrowDownRight, Search } from "lucide-react";

export function GCard({ c, style, cl = "", onClick }) {
  const T = useT();
  return <div className={`glass ${cl}`} style={{ borderRadius: T.radius, ...style }} onClick={onClick}>{c}</div>;
}

export function Pill({ c, color }) {
  return <span className="badge" style={{ background: color + "15", color, border: `1px solid ${color}30` }}>{c}</span>;
}

export function GBtn({ c, children, onClick, v = "copper", sz = "md", dis, icon, style = {}, type = "button", form }) {
  const s = { sm: { padding: "8px 16px", fontSize: 12 }, md: { padding: "10px 20px", fontSize: 13 }, lg: { padding: "14px 28px", fontSize: 14 } };
  return <button type={type} form={form} onClick={onClick} disabled={dis} className={`btn-${v}`} style={{ ...s[sz], opacity: dis ? .5 : 1, cursor: dis ? "not-allowed" : "pointer", ...style }}>{icon}{c || children}</button>;
}

export function Lbl({ c, req }) {
  const T = useT();
  return <div style={{ fontSize: 12, fontWeight: 700, color: T.textSub, marginBottom: 8, letterSpacing: "0.02em" }}>{c}{req && <span style={{ color: T.red }}> *</span>}</div>;
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
    <ChevronDown size={14} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: T.textMuted, pointerEvents: "none" }} />
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
  return <div className="fade-up" style={{ position: "fixed", bottom: 32, right: 32, zIndex: 5000, padding: "16px 24px", borderRadius: T.radiusXl, background: T.surfaceStrong, backdropFilter: "blur(24px)", border: `1px solid ${T.border}`, borderLeft: `6px solid ${c}`, color: T.text, fontSize: 14, fontWeight: 600, boxShadow: T.shadowXl, display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ width: 10, height: 10, borderRadius: "50%", background: c, boxShadow: `0 0 10px ${c}` }} />
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
    <div onClick={onClose} className="modal-overlay fade-up" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      {/* Overflow set to visible inside modal body so dropdowns break out properly! */}
      <div className="glass-strong spring-in" onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: width, borderRadius: T.radiusXl, maxHeight: "95vh", display: "flex", flexDirection: "column", overflow: "visible" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.surfaceStrong, borderRadius: `${T.radiusXl} ${T.radiusXl} 0 0` }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text, letterSpacing: "-0.02em" }}>{title}</div>
          <button type="button" onClick={onClose} className="btn-ghost" style={{ padding: 8, borderRadius: "50%" }}><X size={18} /></button>
        </div>
        <div style={{ padding: "20px 24px", overflowY: "auto", overflowX: "visible", background: T.surfaceGlass, flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: "20px 24px", borderTop: `1px solid ${T.borderSubtle}`, background: T.surfaceStrong, display: "flex", justifyContent: "flex-end", gap: 12, borderRadius: `0 0 ${T.radiusXl} ${T.radiusXl}` }}>{footer}</div>}
      </div>
    </div>
  );
}

export function KCard({ label, value, sub, icon: Icon, color, delta, onClick, active }) {
  const T = useT();
  const c = color || T.accent;
  return <div className="glass" style={{ padding: 24, borderRadius: T.radius, cursor: onClick ? "pointer" : "default", border: active ? `2px solid ${c}` : undefined, display: "flex", flexDirection: "column", height: "100%" }} onClick={onClick}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.textSub, marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>{value}</div>
      </div>
      <div style={{ width: 48, height: 48, borderRadius: T.radius, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", color: c, boxShadow: `inset 0 1px 1px rgba(255,255,255,0.2)` }}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
      {delta !== undefined && (
        <span style={{ fontSize: 12, fontWeight: 700, color: delta >= 0 ? T.green : T.red, display: "flex", alignItems: "center", gap: 4, background: delta >= 0 ? T.greenBg : T.redBg, padding: "4px 10px", borderRadius: T.radiusFull }}>
          {delta >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {Math.abs(delta).toFixed(1)}%
        </span>
      )}
      {sub && <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>{sub}</span>}
    </div>
  </div>;
}

export function PeriodBar({ df, setDf, dt, setDt, preset, setPreset }) {
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
    <div className="filter-wrap period-bar-wrap" style={{ background: T.surfaceGlass, padding: "4px 8px", borderRadius: T.radius, border: `1px solid ${T.borderSubtle}` }}>
      <select value={preset || ""} onChange={e => applyPreset(e.target.value)} className="sel" style={{ width: 140, fontWeight: 600, border: "none", background: "transparent", boxShadow: "none" }}>
        {PRESETS.map(p => <option key={p.k} value={p.k}>{p.l}</option>)}
      </select>
      <div className="hide-mob" style={{ width: 1, height: 20, background: T.borderSubtle }} />
      <input type="date" className="inp" value={df || ""} onChange={e => { setDf(e.target.value); setPreset("custom"); }} style={{ width: 140, border: "none", background: "transparent", boxShadow: "none" }} />
      <span style={{ color: T.textMuted, fontWeight: 700 }}>→</span>
      <input type="date" className="inp" value={dt || ""} onChange={e => { setDt(e.target.value); setPreset("custom"); }} style={{ width: 140, border: "none", background: "transparent", boxShadow: "none" }} />
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", style = {} }) {
  const T = useT();
  return (
    <div style={{ position: "relative", ...style }}>
      <Search size={16} color={T.textMuted} strokeWidth={2.5} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
      <input className="inp" value={value} onChange={onChange} placeholder={placeholder} style={{ paddingLeft: 42, borderRadius: T.radiusFull }} />
    </div>
  );
}

export function DeleteConfirmModal({ open, onClose, onConfirm, user, label = "this item", extra = "" }) {
  const T = useT();
  const [pass, setReactPass] = React.useState("");
  const [err, setErr] = React.useState("");
  if (!open) return null;
  const go = () => {
    if (!pass) { setErr("Enter your password"); return; }
    if (pass !== user?.password) { setErr("Incorrect password"); return; }
    onConfirm(); setReactPass(""); setErr(""); onClose();
  };
  return (
    <Modal open={true} onClose={onClose} title="Confirm Deletion" width={420}>
      <div style={{ fontSize: 14, color: T.textSub, marginBottom: 20, lineHeight: 1.5 }}>Are you sure you want to delete <strong>{label}</strong>? {extra} <br/><br/><span style={{ color: T.red, fontWeight: 700, padding: "8px 12px", background: T.redBg, borderRadius: 8, display: "inline-block" }}>This action cannot be undone.</span></div>
      <Field label="Enter password to confirm" req>
        <GIn type="password" value={pass} onChange={e=>{setReactPass(e.target.value);setErr("");}} autoFocus onKeyDown={e=>e.key==="Enter"&&go()} />
      </Field>
      {err && <div style={{ fontSize: 13, color: T.red, marginTop: 8, fontWeight: 600 }}>{err}</div>}
      <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
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
    <div style={{ fontWeight: 700, color: T.textSub, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    {payload.map((p, i) => <div key={i} style={{ color: p.color, fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{p.name}: {fmt ? ("₹" + Number(p.value || 0).toLocaleString("en-IN")) : p.value}</div>)}
  </div>;
}

export function Pager({ total, page, ps, setPage, setPs }) {
  const T = useT();
  const tp = Math.ceil(total / ps);
  if (total <= 0) return null;
  let s = Math.max(1, page - 2), e = Math.min(tp, s + 4);
  if (e - s < 4) s = Math.max(1, e - 4);
  const nb = dis => ({ padding: "8px 14px", minWidth: 36, borderRadius: T.radius, border: `1px solid ${T.border}`, cursor: dis ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, background: T.surfaceGlass, color: dis ? T.textMuted : T.textSub, opacity: dis ? .5 : 1, transition: "all 0.2s" });
  const range = [];
  for (let i = s; i <= e; i++) range.push(i);
  return <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", borderTop: `1px solid ${T.border}`, flexWrap: "wrap", background: T.surfaceGlass, borderRadius: `0 0 ${T.radius} ${T.radius}` }}>
    <span style={{ fontSize: 13, color: T.textMuted, flex: 1, minWidth: 120, fontWeight: 500 }}>Showing {Math.min((page - 1) * ps + 1, total)} to {Math.min(page * ps, total)} of <span style={{ fontWeight: 800, color: T.text }}>{total}</span></span>
    <select className="sel" value={ps} onChange={e => { setPs(Number(e.target.value)); setPage(1); }} style={{ width: "auto", padding: "8px 30px 8px 16px", fontSize: 13, fontWeight: 700, borderRadius: T.radiusFull }}>
      {[20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
    </select>
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => setPage(1)} disabled={page <= 1} style={nb(page <= 1)}>«</button>
      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={nb(page <= 1)}>‹</button>
      {range.map(p => <button key={p} onClick={() => setPage(p)} style={{ padding: "8px 16px", minWidth: 36, borderRadius: T.radius, border: p === page ? `1px solid ${T.accent}` : `1px solid ${T.border}`, cursor: "pointer", fontWeight: 700, fontSize: 13, background: p === page ? T.accent : T.surfaceGlass, color: p === page ? "#fff" : T.textSub, transition: "all 0.2s ease" }}>{p}</button>)}
      <button onClick={() => setPage(p => Math.min(tp, p + 1))} disabled={page >= tp} style={nb(page >= tp)}>›</button>
      <button onClick={() => setPage(tp)} disabled={page >= tp} style={nb(page >= tp)}>»</button>
    </div>
  </div>;
}
