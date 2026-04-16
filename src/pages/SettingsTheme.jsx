import React from "react";
import { useT } from "../theme";
import { GBtn } from "../components/UI";
export default function SettingsTheme({ ctx }) {
  const T = useT();
  const { accentKey, setAccent, customColor, setCustomColor, cornerStyle, setCornerStyle, logoUrl, setLogoUrl, isDark, toggleTheme, ACCENT_PRESETS, CORNER_STYLES } = ctx;
  return <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 20 }}>
    <div className="glass" style={{ padding: 20, borderRadius: T.radius }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 14 }}>Theme Mode</div>
      <div style={{ display: "flex", gap: 10 }}>
        <GBtn v={isDark ? "ghost" : "copper"} onClick={() => isDark && toggleTheme()}>Light</GBtn>
        <GBtn v={isDark ? "copper" : "ghost"} onClick={() => !isDark && toggleTheme()}>Dark</GBtn>
      </div>
    </div>
    <div className="glass" style={{ padding: 20, borderRadius: T.radius }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 14 }}>Accent Color</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {Object.entries(ACCENT_PRESETS).filter(([k]) => k !== "custom").map(([k, v]) => (
          <button key={k} onClick={() => setAccent(k)} style={{ width: 36, height: 36, borderRadius: "50%", background: isDark ? v.dark : v.light, border: accentKey === k ? "3px solid " + T.text : "2px solid transparent", cursor: "pointer" }} title={v.name} />
        ))}
        <input type="color" value={customColor || "#C05C1E"} onChange={e => { setAccent("custom"); setCustomColor(e.target.value); }} style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${T.border}`, cursor: "pointer", padding: 2 }} />
      </div>
    </div>
    <div className="glass" style={{ padding: 20, borderRadius: T.radius }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 14 }}>Corner Style</div>
      <div style={{ display: "flex", gap: 8 }}>
        {Object.entries(CORNER_STYLES).map(([k, v]) => (
          <GBtn key={k} v={cornerStyle === k ? "copper" : "ghost"} sz="sm" onClick={() => setCornerStyle(k)}>{v.name}</GBtn>
        ))}
      </div>
    </div>
  </div>;
}
