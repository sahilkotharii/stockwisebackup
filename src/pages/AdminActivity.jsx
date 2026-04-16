import React, { useState, useMemo } from "react";
import { useT } from "../theme";
import { GS, Pager, SearchInput } from "../components/UI";
import { fmtTs } from "../utils";
export default function AdminActivity({ ctx }) {
  const T = useT();
  const { actLog, users } = ctx;
  const [search, setSearch] = useState("");
  const [userF, setUserF] = useState("");
  const [pg, setPg] = useState(1);
  const ps = 30;
  const filtered = useMemo(() => actLog.filter(l => (!userF || l.userId === userF) && (!search || (l.entityName || "").toLowerCase().includes(search.toLowerCase()) || (l.action || "").toLowerCase().includes(search.toLowerCase()))), [actLog, userF, search]);
  return <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div className="filter-wrap">
      <SearchInput value={search} onChange={e => { setSearch(e.target.value); setPg(1); }} placeholder="Search activity…" style={{ width: 250 }} />
      <GS value={userF} onChange={e => { setUserF(e.target.value); setPg(1); }} placeholder="All Users" style={{ width: 180 }}>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</GS>
    </div>
    <div className="glass" style={{ borderRadius: T.radius, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Time","User","Role","Action","Entity","Details"].map((h,i) => <th key={i} className="th">{h}</th>)}</tr></thead>
        <tbody>{filtered.slice((pg-1)*ps, pg*ps).map(l => <tr key={l.id} className="trow">
          <td className="td m" style={{ fontSize: 11, whiteSpace: "nowrap" }}>{fmtTs(l.ts)}</td>
          <td className="td" style={{ fontWeight: 600 }}>{l.userName}</td>
          <td className="td m" style={{ textTransform: "capitalize", fontSize: 11 }}>{l.role}</td>
          <td className="td m">{l.action}</td>
          <td className="td" style={{ fontWeight: 600 }}>{l.entityName}</td>
          <td className="td m" style={{ fontSize: 11 }}>{l.details}</td>
        </tr>)}</tbody>
      </table>
      {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>No activity logged</div>}
    </div>
    <Pager total={filtered.length} page={pg} ps={ps} setPage={setPg} setPs={() => {}} />
  </div>;
}
