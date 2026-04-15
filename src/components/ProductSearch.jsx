import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { useT } from "../theme";

export default function ProductSearch({ value, onChange, products, placeholder, getStock }) {
  const T = useT();
  const selected = products.find(p => p.id === value);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const [pos, setPos] = useState({ top: 0, left: 0, width: 200 });
  const calcPos = useCallback(() => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 320) });
    }
  }, []);

  const filtered = useMemo(() => {
    if (!isOpen) return [];
    const q = search.trim().toLowerCase();
    const list = q
      ? products.filter(p =>
          String(p.name || "").toLowerCase().includes(q) ||
          String(p.sku || "").toLowerCase().includes(q) ||
          String(p.alias || "").toLowerCase().includes(q)
        )
      : products;
    return list.slice(0, 50);
  }, [search, products, isOpen]);

  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    const scrollHandler = (e) => {
      // Close dropdown if user scrolls the modal behind it
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
          placeholder={placeholder || "Search product…"}
          autoComplete="off"
          onFocus={openDropdown}
          onClick={openDropdown}
          onChange={e => {
            if (!isOpen) openDropdown();
            setSearch(e.target.value);
          }}
        />
        {value && !isOpen && (
          <button type="button" className="liquid-trans" onClick={e => { e.stopPropagation(); onChange(""); }}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: T.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", color: T.textSub, padding: 4, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
            <X size={12} />
          </button>
        )}
      </div>
      {isOpen && createPortal(
        <div className="spring-in glass-strong ps-dropdown" style={{
          position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 999999,
          borderRadius: T.radius, maxHeight: 320, overflowY: "auto",
          WebkitOverflowScrolling: "touch", padding: 6,
          background: T.surfaceStrong, border: `1px solid ${T.accent}40`, boxShadow: T.shadowXl
        }}>
          {filtered.length === 0
            ? <div style={{ padding: "16px", fontSize: 13, color: T.textMuted, textAlign: "center", fontWeight: 500 }}>No products found</div>
            : filtered.map(p => (
              <div key={p.id}
                className="liquid-trans"
                onMouseDown={e => { e.preventDefault(); pick(p.id); }}
                onTouchEnd={e => { e.preventDefault(); pick(p.id); }}
                style={{
                  padding: "12px 14px", cursor: "pointer", borderRadius: 8,
                  background: p.id === value ? T.accentBg : "transparent",
                  marginBottom: 2
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = p.id === value ? T.accentBg : "transparent"}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: p.id === value ? T.accent : T.text }}>{p.name}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, fontWeight: 500, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "monospace", color: T.textSub }}>{p.sku}</span>
                  {Number(p.gstRate) > 0 && <span>GST {Number(p.gstRate)}%</span>}
                  <span style={{ color: T.textSub, fontWeight: 600 }}>MRP ₹{Number(p.mrp || 0).toLocaleString("en-IN")}</span>
                  {getStock && <span style={{ color: getStock(p.id) > 0 ? T.green : T.red, fontWeight: 700 }}>Stock: {getStock(p.id)}</span>}
                </div>
              </div>
            ))
          }
        </div>,
        document.body
      )}
    </div>
  );
}
