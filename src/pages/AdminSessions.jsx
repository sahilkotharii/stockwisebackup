import React, { useMemo } from "react";
import { useT } from "../theme";
import { fmtTs } from "../utils";
export default function AdminSessions({ ctx }) {
  const T = useT();
  const { actLog } = ctx;
  const logins = useMemo(() => actLog.filter(l => l.action === "login").slice(0, 100), [actLog]);
  return <div className="glass" style={{ borderRadius: T.radius, overflow: "hidden" }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr>{["Time","User","Role"].map((h,i) => <th key={i} className="th">{h}</th>)}</tr></thead>
      <tbody>{logins.map(l => <tr key={l.id} className="trow">
        <td className="td m" style={{ whiteSpace: "nowrap" }}>{fmtTs(l.ts)}</td>
        <td className="td" style={{ fontWeight: 700 }}>{l.userName}</td>
        <td className="td m" style={{ textTransform: "capitalize" }}>{l.role}</td>
      </tr>)}</tbody>
    </table>
    {logins.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>No login history</div>}
  </div>;
}
