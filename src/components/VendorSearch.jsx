import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { useT } from "../theme";

export default function VendorSearch({ value, onChange, vendors = [], placeholder = "Search vendor/customer…" }) {
  const T = useT();
  const selected = vendors.find(v => v.id === value);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const [pos, setPos] = useState({ top: 0, left: 0, width: 200 });
  const calcPos = useCallback(() => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 300) });
    }
  }, []);

  const filtered = useMemo(() => {
    if (!isOpen) return [];
    const q = search.trim().toLowerCase();
    const list = q
      ? vendors.filter(v =>
          String(v.name || "").toLowerCase().includes(q) ||
          String(v.city || "").toLowerCase().includes(q) ||
          String(v.gstin || "").toLowerCase().includes(q) ||
          String(v.phone || "").toLowerCase().includes(q)
        )
      : vendors;
    return list.slice(0, 50);
  }, [search, vendors, isOpen]);

  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    const scrollHandler = (e) => {
      if (e.target.closest('.ps-dropdown')) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    window.addEventListener("scroll", scrollHandler, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
      window.removeEventListener("scroll", scrollHandler, true);
    };
  }, []);

  const openDropdown = () => {
    if (!isOpen) {
      setSearch("");
      calcPos();
      setIsOpen(true);
    }
  };

  const pick = (id) => {
    onChange(id);
    setIsOpen(false);
    setSearch("");
    inputRef.current?.blur();
  };

  const clear = () => {
    onChange("");
    setSearch("");
    setIsOpen(false);
  };

  const displayValue = isOpen ? search : (selected?.name || "");

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textMuted, pointerEvents: "none", zIndex: 1 }} />
        <input
          ref={inputRef}
          className="inp liquid-trans"
          style={{ paddingLeft: 34, paddingRight: value && !isOpen ? 34 : 14, fontWeight: selected && !isOpen ? 700 : 500 }}
          value={displayValue}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={openDropdown}
          onClick={openDropdown}
          onChange={e => {
            if (!isOpen) openDropdown();
            setSearch(e.target.value);
          }}
        />
        {value && !isOpen && (
          <button type="button" className="liquid-trans" onClick={e => { e.stopPropagation(); clear(); }}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: T.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", color: T.textSub, padding: 4, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
            <X size={12} />
          </button>
        )}
      </div>
      {isOpen && createPortal(
        <div className="spring-in glass-strong ps-dropdown" style={{
          position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 999999,
          borderRadius: T.radius, maxHeight: 300, overflowY: "auto", padding: 6,
          background: T.surfaceStrong, border: `1px solid ${T.accent}40`, boxShadow: T.shadowXl
        }}>
          {vendors.length === 0 && (
            <div style={{ padding: "16px", fontSize: 13, color: T.textMuted, textAlign: "center", fontWeight: 500 }}>No vendors/customers yet</div>
          )}
          {vendors.length > 0 && filtered.length === 0 && (
            <div style={{ padding: "16px", fontSize: 13, color: T.textMuted, textAlign: "center", fontWeight: 500 }}>
              No match for "{search}"
            </div>
          )}
          {filtered.map(v => (
            <div key={v.id}
              className="liquid-trans"
              onMouseDown={e => { e.preventDefault(); pick(v.id); }}
              style={{
                padding: "12px 14px", cursor: "pointer", borderRadius: 8, marginBottom: 2,
                background: v.id === value ? T.accentBg : "transparent"
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = v.id === value ? T.accentBg : "transparent"}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: v.id === value ? T.accent : T.text }}>{v.name}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, fontWeight: 500, display: "flex", gap: 8 }}>
                <span>{[v.city, v.state].filter(Boolean).join(", ")}</span>
                {v.gstin && <span style={{ color: T.textSub, fontFamily: "monospace" }}>GSTIN: {v.gstin}</span>}
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
