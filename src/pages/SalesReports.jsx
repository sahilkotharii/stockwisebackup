import React from "react";
import { useT } from "../theme";
export default function SalesReports({ ctx }) {
  const T = useT();
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
    <div style={{ width: 56, height: 56, borderRadius: 16, background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 24 }}>🚧</div>
    <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 8 }}>SalesReports</div>
    <div style={{ fontSize: 13, color: T.textMuted, maxWidth: 400 }}>This module is being built. The navigation and data layer are ready — the UI is coming in the next update.</div>
  </div>;
}
