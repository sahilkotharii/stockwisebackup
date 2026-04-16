import React, { useEffect } from "react";
import { useT } from "../theme";
import { X, ChevronDown, ArrowUpRight, ArrowDownRight, Search } from "lucide-react";

export function GCard({ c, style, cl = "", onClick }) {
  const T = useT();
  return <div className={`glass ${cl}`} style={{ borderRadius: T.radius, ...style }} onClick={onClick}>{c}</div>;
}

export function Pill({ c, color }) {
  return <span className="badge" style={{ background: color + "12", color, border: `1px solid ${color}25` }}>{c}</span>;
}

export function GBtn({ c, children, onClick, v = "copper", sz = "md", dis, icon, style = {}, type = "button", form }) {
  const s = { sm: { padding: "6px 14px", fontSize: 12 }, md: { padding: "8px 18px", fontSize: 13 }, lg: { padding: "11px 24px", fontSize: 14 } };
  return <button type={type} form={form} onClick={onClick} disabled={dis} className={`btn-${v}`} style={{ ...s[sz], opacity: dis ? .5 : 1, cursor: dis ? "not-allowed" : "pointer", ...style }}>{icon}{c || children}</button>;
}

export function Lbl({ c, req }) {
  const T = useT();
  return <div style={{ fontSize: 12, fontWeight: 700, color: T.textSub, marginBottom: 5, letterSpacing: ".02em" }}>{c}{req && <span style={{ color: T.red }}> *</span>}</div>;
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
    <ChevronDown size={12} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: T.textMuted, pointerEvents: "none" }} />
  </div>;
}

export function GTa({ value, onChange, placeholder, rows = 3 }) {
  return <textarea className="inp" value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ resize: "vertical", minHeight: 60 }} />;
}

export function StChip({ stock, min }) {
  const T = useT();
  if (stock <= 0) return <Pill c="OOS" color={T.red} />;
  if (stock <= min) return <Pill c="Low" color={T.amber} />;
  return <Pill c="OK" color={T.green} />;
}

export function Toast({ msg, type }) {
  const T = useT();
  const c = type === "error" ? T.red : type === "success" ? T.green : T.amber;
  return <div className="fade-up sw-toast" style={{
    position: "fixed", bottom: 24, right: 24, zIndex: 5000,
    padding: "10px 18px", borderRadius: T.radius,
    background: T.surfaceStrong, backdropFilter: "blur(20px)",
    border: `1px solid ${T.border}`, borderLeft: `4px solid ${c}`,
    color: T.text, fontSize: 12, fontWeight: 600, boxShadow: T.shadowXl,
    display: "flex", alignItems: "center", gap: 8, maxWidth: "calc(100vw - 32px)"
  }}>
    <div style={{ width: 7, height: 7, borderRadius: "50%", background: c, flexShrink: 0 }} />
    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{msg}</span>
  </div>;
}

export function Modal({ open, onClose, title, children, footer, width = 520 }) {
  const T = useT();
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div onClick={onClose} className="modal-overlay fade-up" style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
      <div className="glass-strong spring-in" onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: width, maxHeight: "calc(100vh - 20px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.surfaceStrong, flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{title}</div>
          <button type="button" onClick={onClose} className="btn-ghost" style={{ padding: 4, borderRadius: "50%", flexShrink: 0 }}><X size={16} /></button>
        </div>
        <div style={{ padding: "14px 16px", overflowY: "auto", flex: 1, minHeight: 0, WebkitOverflowScrolling: "touch" }}>{children}</div>
        {footer && <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.borderSubtle}`, background: T.surfaceStrong, display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>{footer}</div>}
      </div>
    </div>
  );
}

export function KCard({ label, value, sub, icon: Icon, color, delta, onClick, active }) {
  const T = useT();
  const c = color || T.accent;
  return <div className="glass" style={{ padding: 14, borderRadius: T.radius, cursor: onClick ? "pointer" : "default", border: active ? `2px solid ${c}` : undefined, display: "flex", flexDirection: "column", height: "100%" }} onClick={onClick}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSub, marginBottom: 4, letterSpacing: ".04em", textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      </div>
      <div style={{ width: 32, height: 32, borderRadius: T.radius, background: `${c}12`, display: "flex", alignItems: "center", justifyContent: "center", color: c, flexShrink: 0 }}>
        <Icon size={16} strokeWidth={2.5} />
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto" }}>
      {delta !== undefined && (
        <span style={{ fontSize: 10, fontWeight: 700, color: delta >= 0 ? T.green : T.red, display: "flex", alignItems: "center", gap: 3, background: delta >= 0 ? T.greenBg : T.redBg, padding: "2px 8px", borderRadius: T.radiusFull }}>
          {delta >= 0 ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>} {Math.abs(delta).toFixed(1)}%
        </span>
      )}
      {sub && <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</span>}
    </div>
  </div>;
}

export function PeriodBar({ df, setDf, dt, setDt, preset, setPreset }) {
  const T = useT();
  const PRESETS = [{ k: "", l: "All" }, { k: "1d", l: "Today" }, { k: "7d", l: "7D" }, { k: "30d", l: "30D" }];
  const applyPreset = k => {
    setPreset(k);
    if (!k) { setDf(""); setDt(""); return; }
    const tod = new Date().toISOString().split("T")[0];
    switch (k) {
      case "1d": setDf(tod); setDt(tod); break;
      case "7d": setDf(new Date(Date.now()-7*864e5).toISOString().split("T")[0]); setDt(tod); break;
      case "30d": setDf(new Date(Date.now()-30*864e5).toISOString().split("T")[0]); setDt(tod); break;
    }
  };
  return (
    <div className="filter-wrap period-bar-wrap" style={{ background: T.surfaceGlass, padding: "3px 6px", borderRadius: T.radius, border: `1px solid ${T.borderSubtle}` }}>
      <div style={{ display: "flex", gap: 2, padding: 2, borderRadius: T.radius, background: T.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
        {PRESETS.map(p => (
          <button key={p.k} className="liquid-trans" onClick={() => applyPreset(p.k)}
            style={{ padding: "4px 10px", borderRadius: T.radius, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: (preset||"") === p.k ? T.accent : "transparent", color: (preset||"") === p.k ? "#fff" : T.textSub }}>
            {p.l}
          </button>
        ))}
      </div>
      <input type="date" className="inp" value={df||""} onChange={e => { setDf(e.target.value); setPreset("custom"); }} style={{ width: 120, border: "none", background: "transparent", boxShadow: "none", padding: "4px 8px", fontSize: 11 }} />
      <span style={{ color: T.textMuted, fontSize: 10 }}>→</span>
      <input type="date" className="inp" value={dt||""} onChange={e => { setDt(e.target.value); setPreset("custom"); }} style={{ width: 120, border: "none", background: "transparent", boxShadow: "none", padding: "4px 8px", fontSize: 11 }} />
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", style = {} }) {
  const T = useT();
  return (
    <div style={{ position: "relative", ...style }}>
      <Search size={13} color={T.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
      <input className="inp" value={value} onChange={onChange} placeholder={placeholder} style={{ paddingLeft: 34, borderRadius: T.radiusFull }} />
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
    <Modal open={true} onClose={onClose} title="Confirm Delete" width={380}>
      <div style={{ fontSize: 12, color: T.textSub, marginBottom: 16, lineHeight: 1.5 }}>Delete <strong>{label}</strong>? {extra}<br/><br/><span style={{ color: T.red, fontWeight: 700, padding: "6px 10px", background: T.redBg, borderRadius: 6, display: "inline-block", fontSize: 11 }}>Cannot be undone.</span></div>
      <Field label="Password to confirm" req><GIn type="password" value={pass} onChange={e=>{setReactPass(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} /></Field>
      {err && <div style={{ fontSize: 11, color: T.red, marginTop: 6, fontWeight: 600 }}>{err}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
        <GBtn v="ghost" sz="sm" onClick={onClose}>Cancel</GBtn>
        <GBtn v="danger" sz="sm" onClick={go}>Delete</GBtn>
      </div>
    </Modal>
  );
}

export function CTip({ active, payload, label, fmt }) {
  const T = useT();
  if (!active || !payload?.length) return null;
  return <div className="glass-strong" style={{ padding: "8px 12px", borderRadius: T.radius, fontSize: 11 }}>
    <div style={{ fontWeight: 700, color: T.textSub, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 10 }}>{label}</div>
    {payload.map((p, i) => <div key={i} style={{ color: p.color, fontWeight: 800, fontSize: 12, marginBottom: 3 }}>{p.name}: {fmt ? ("₹"+Number(p.value||0).toLocaleString("en-IN")) : p.value}</div>)}
  </div>;
}

export function Pager({ total, page, ps, setPage, setPs }) {
  const T = useT();
  const tp = Math.ceil(total / ps);
  if (total <= 0) return null;
  let s = Math.max(1, page - 2), e = Math.min(tp, s + 4);
  if (e - s < 4) s = Math.max(1, e - 4);
  const nb = dis => ({ padding: "5px 10px", minWidth: 28, borderRadius: T.radius, border: `1px solid ${T.border}`, cursor: dis ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 11, background: T.surfaceGlass, color: dis ? T.textMuted : T.textSub, opacity: dis ? .5 : 1, transition: "all .2s" });
  const range = []; for (let i = s; i <= e; i++) range.push(i);
  return <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderTop: `1px solid ${T.border}`, flexWrap: "wrap", background: T.surfaceGlass, borderRadius: `0 0 ${T.radius} ${T.radius}` }}>
    <span style={{ fontSize: 11, color: T.textMuted, flex: 1, minWidth: 80, fontWeight: 500 }}>{Math.min((page-1)*ps+1,total)}–{Math.min(page*ps,total)} of <b style={{color:T.text}}>{total}</b></span>
    <select className="sel" value={ps} onChange={e => { setPs(Number(e.target.value)); setPage(1); }} style={{ width: "auto", padding: "4px 22px 4px 8px", fontSize: 10, fontWeight: 700, borderRadius: T.radiusFull }}>
      {[20,50,100].map(n => <option key={n} value={n}>{n}/pg</option>)}
    </select>
    <div style={{ display: "flex", gap: 3 }}>
      <button onClick={() => setPage(1)} disabled={page<=1} style={nb(page<=1)}>«</button>
      <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page<=1} style={nb(page<=1)}>‹</button>
      {range.map(p => <button key={p} onClick={() => setPage(p)} style={{ ...nb(false), border: p===page?`1px solid ${T.accent}`:`1px solid ${T.border}`, background: p===page?T.accent:T.surfaceGlass, color: p===page?"#fff":T.textSub }}>{p}</button>)}
      <button onClick={() => setPage(p=>Math.min(tp,p+1))} disabled={page>=tp} style={nb(page>=tp)}>›</button>
      <button onClick={() => setPage(tp)} disabled={page>=tp} style={nb(page>=tp)}>»</button>
    </div>
  </div>;
}
