import React, { useState, useMemo, useEffect } from "react";
import { TrendingUp, DollarSign, Package, Download, Users, IndianRupee, BarChart2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useT } from "../theme";
import { KCard, GBtn, GS, Pager, PeriodBar, SearchInput, CTip } from "../components/UI";
import { fmtCur, fmtDate, inRange, getPresetDate, today, toCSV, dlCSV } from "../utils";

export default function SalesReports({ ctx }) {
  const T = useT();
  const { bills, products, vendors } = ctx;

  const [df, setDf] = useState(getPresetDate("30d"));
  const [dt, setDt] = useState(today());
  const [preset, setPreset] = useState("30d");
  const [view, setView] = useState("daily");
  const [search, setSearch] = useState("");
  const [pg, setPg] = useState(1);
  const [ps, setPs] = useState(20);
  useEffect(() => setPg(1), [df, dt, search, ps, view]);

  // Real tax invoices only — exclude proforma
  const saleBills = useMemo(() => bills.filter(b =>
    b.type === "sale" && !b.isProforma && inRange(b.date, df, dt)
  ), [bills, df, dt]);

  const summary = useMemo(() => {
    const totalRevenue = saleBills.reduce((s, b) => s + Number(b.total || 0), 0);
    const totalGst = saleBills.reduce((s, b) => s + Number(b.totalGst || 0), 0);
    const netRevenue = totalRevenue - totalGst;
    const unitsSold = saleBills.reduce((s, b) => s + (b.items || []).reduce((x, i) => x + Number(i.qty || 0), 0), 0);
    const avgTicket = saleBills.length ? totalRevenue / saleBills.length : 0;
    const uniqueCustomers = new Set(saleBills.map(b => b.vendorId).filter(Boolean)).size;
    return { totalRevenue, totalGst, netRevenue, unitsSold, avgTicket, uniqueCustomers, billCount: saleBills.length };
  }, [saleBills]);

  const timeSeries = useMemo(() => {
    const buckets = {};
    saleBills.forEach(b => {
      if (!b.date) return;
      const key = view === "monthly" ? b.date.slice(0, 7) : b.date;
      if (!buckets[key]) buckets[key] = { date: key, revenue: 0, bills: 0, gst: 0 };
      buckets[key].revenue += Number(b.total || 0);
      buckets[key].gst += Number(b.totalGst || 0);
      buckets[key].bills += 1;
    });
    return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date)).map(b => ({
      ...b,
      label: view === "monthly" ? b.date : new Date(b.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    }));
  }, [saleBills, view]);

  const topProducts = useMemo(() => {
    const m = {};
    saleBills.forEach(b => (b.items || []).forEach(it => {
      if (!m[it.productId]) m[it.productId] = { productId: it.productId, name: "", qty: 0, revenue: 0 };
      m[it.productId].qty += Number(it.qty || 0);
      m[it.productId].revenue += Number(it.qty || 0) * Number(it.effectivePrice || it.price || 0);
    }));
    Object.values(m).forEach(x => {
      const p = products.find(pr => pr.id === x.productId);
      x.name = p?.name || "(unknown)";
      x.sku = p?.sku || "";
    });
    return Object.values(m).sort((a, b) => b.revenue - a.revenue);
  }, [saleBills, products]);

  const topCustomers = useMemo(() => {
    const m = {};
    saleBills.forEach(b => {
      if (!b.vendorId) return;
      if (!m[b.vendorId]) m[b.vendorId] = { vendorId: b.vendorId, name: b.vendorName || "", bills: 0, revenue: 0 };
      m[b.vendorId].bills += 1;
      m[b.vendorId].revenue += Number(b.total || 0);
    });
    Object.values(m).forEach(x => { if (!x.name) x.name = vendors.find(v => v.id === x.vendorId)?.name || "(unknown)"; });
    return Object.values(m).sort((a, b) => b.revenue - a.revenue);
  }, [saleBills, vendors]);

  const gstBreakdown = useMemo(() => {
    const intra = saleBills.filter(b => (b.gstType || "cgst_sgst") === "cgst_sgst");
    const inter = saleBills.filter(b => b.gstType === "igst");
    return [
      { name: "CGST + SGST", value: intra.reduce((s, b) => s + Number(b.total || 0), 0), count: intra.length, color: T.accent },
      { name: "IGST", value: inter.reduce((s, b) => s + Number(b.total || 0), 0), count: inter.length, color: T.blue },
    ].filter(x => x.value > 0);
  }, [saleBills, T.accent, T.blue]);

  const paymentModes = useMemo(() => {
    const m = {};
    saleBills.forEach(b => {
      const mode = b.paymentMode || "Not Set";
      if (!m[mode]) m[mode] = { name: mode, value: 0, count: 0 };
      m[mode].value += Number(b.total || 0);
      m[mode].count += 1;
    });
    const palette = [T.accent, T.green, T.blue, T.amber, T.red, "#8B5CF6", "#EC4899"];
    return Object.values(m).sort((a, b) => b.value - a.value).map((x, i) => ({ ...x, color: palette[i % palette.length] }));
  }, [saleBills, T]);

  const filteredBills = useMemo(() => {
    const q = search.toLowerCase();
    return saleBills.filter(b =>
      !search || (b.billNo || "").toLowerCase().includes(q) || (b.vendorName || "").toLowerCase().includes(q)
    ).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [saleBills, search]);

  const exportBills = () => {
    const rows = filteredBills.map(b => ({
      date: b.date, billNo: b.billNo, customer: b.vendorName,
      gstType: b.gstType === "igst" ? "IGST" : "CGST+SGST",
      items: (b.items || []).length, subtotal: b.subtotal || 0,
      discount: b.discAmount || 0, gst: b.totalGst || 0, total: b.total || 0,
      paymentMode: b.paymentMode || ""
    }));
    dlCSV(toCSV(rows, ["date","billNo","customer","gstType","items","subtotal","discount","gst","total","paymentMode"]), `sales_${df}_to_${dt}`);
  };
  const exportTopProducts = () => {
    const rows = topProducts.map(p => ({ name: p.name, sku: p.sku, qty: p.qty, revenue: p.revenue }));
    dlCSV(toCSV(rows, ["name","sku","qty","revenue"]), `top_products_${df}_to_${dt}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <PeriodBar df={df} setDf={setDf} dt={dt} setDt={setDt} preset={preset} setPreset={setPreset} />
        <div style={{ display: "flex", gap: 8 }}>
          <GS value={view} onChange={e => setView(e.target.value)} style={{ width: 140 }}>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </GS>
          <GBtn v="ghost" sz="sm" onClick={exportBills} icon={<Download size={13} />}>Export CSV</GBtn>
        </div>
      </div>

      <div className="kgrid">
        <KCard label="Total Revenue" value={fmtCur(summary.totalRevenue)} sub="incl. GST" icon={TrendingUp} color={T.green} />
        <KCard label="Net Revenue" value={fmtCur(summary.netRevenue)} sub="excl. GST" icon={DollarSign} color={T.accent} />
        <KCard label="GST Collected" value={fmtCur(summary.totalGst)} sub="output GST" icon={IndianRupee} color={T.amber} />
        <KCard label="Units Sold" value={String(summary.unitsSold)} sub={`${summary.billCount} bills`} icon={Package} color={T.blue} />
        <KCard label="Avg. Ticket" value={fmtCur(summary.avgTicket)} sub="per bill" icon={BarChart2} color={T.accent} />
        <KCard label="Unique Customers" value={String(summary.uniqueCustomers)} sub="this period" icon={Users} color="#8B5CF6" />
      </div>

      <div className="glass" style={{ padding: 18, borderRadius: T.radius }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 14 }}>Sales Trend</div>
        {timeSeries.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textMuted, fontSize: 13 }}>No data for this period</div>
        ) : (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke={T.textMuted} fontSize={11} tickLine={false} />
                <YAxis stroke={T.textMuted} fontSize={11} tickLine={false} tickFormatter={v => v >= 100000 ? `${(v/100000).toFixed(1)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<CTip fmt />} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke={T.accent} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="chart-row" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <div className="glass" style={{ padding: 18, borderRadius: T.radius }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Top Products by Revenue</div>
            {topProducts.length > 0 && <GBtn v="ghost" sz="sm" onClick={exportTopProducts} icon={<Download size={12} />}>CSV</GBtn>}
          </div>
          {topProducts.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: T.textMuted, fontSize: 12 }}>No sales</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topProducts.slice(0, 8).map((p, i) => {
                const pct = topProducts[0].revenue ? (p.revenue / topProducts[0].revenue) * 100 : 0;
                return (
                  <div key={p.productId || i}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.name}>{i + 1}. {p.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: T.accent, whiteSpace: "nowrap" }}>{fmtCur(p.revenue)}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: T.border, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: T.accent, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{p.qty} units</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass" style={{ padding: 18, borderRadius: T.radius }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 14 }}>GST Split</div>
          {gstBreakdown.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: T.textMuted, fontSize: 12 }}>No data</div> : (
            <>
              <div style={{ height: 160 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={gstBreakdown} dataKey="value" innerRadius={38} outerRadius={65} paddingAngle={2}>
                      {gstBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CTip fmt />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {gstBreakdown.map((g, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: i > 0 ? `1px solid ${T.borderSubtle}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: g.color }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.textSub }}>{g.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{fmtCur(g.value)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="chart-row" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <div className="glass" style={{ padding: 18, borderRadius: T.radius }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 14 }}>Top Customers</div>
          {topCustomers.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: T.textMuted, fontSize: 12 }}>No customers</div> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr>{["#","Customer","Bills","Revenue"].map((h,i) => <th key={i} className="th" style={{ textAlign: ["Bills","Revenue"].includes(h) ? "right" : "left" }}>{h}</th>)}</tr></thead>
                <tbody>{topCustomers.slice(0, 10).map((c, i) => (
                  <tr key={c.vendorId} className="trow">
                    <td className="td m" style={{ fontWeight: 600 }}>{i + 1}</td>
                    <td className="td" style={{ fontWeight: 700, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.name}>{c.name}</td>
                    <td className="td r m">{c.bills}</td>
                    <td className="td r" style={{ fontWeight: 800, color: T.green }}>{fmtCur(c.revenue)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
        <div className="glass" style={{ padding: 18, borderRadius: T.radius }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 14 }}>Payment Modes</div>
          {paymentModes.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: T.textMuted, fontSize: 12 }}>No data</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {paymentModes.map(m => {
                const pct = summary.totalRevenue ? (m.value / summary.totalRevenue) * 100 : 0;
                return (
                  <div key={m.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{m.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{fmtCur(m.value)}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: T.border, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: m.color, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{m.count} bills · {pct.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="glass" style={{ borderRadius: T.radius, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>All Sales Bills</div>
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Bill no or customer…" style={{ maxWidth: 280 }} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Date","Bill No","Customer","Items","GST Type","Subtotal","GST","Total"].map((h,i) => (
              <th key={i} className="th" style={{ textAlign: ["Items","Subtotal","GST","Total"].includes(h) ? "right" : "left" }}>{h}</th>
            ))}</tr></thead>
            <tbody>{filteredBills.slice((pg-1)*ps, pg*ps).map(b => (
              <tr key={b.id} className="trow">
                <td className="td m" style={{ whiteSpace: "nowrap" }}>{fmtDate(b.date)}</td>
                <td className="td" style={{ fontWeight: 700, color: T.accent, whiteSpace: "nowrap" }}>{b.billNo}</td>
                <td className="td" style={{ fontWeight: 600, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={b.vendorName}>{b.vendorName || "—"}</td>
                <td className="td r m">{(b.items || []).length}</td>
                <td className="td m" style={{ fontSize: 11 }}>{b.gstType === "igst" ? "IGST" : "CGST+SGST"}</td>
                <td className="td r m">{fmtCur(b.subtotal)}</td>
                <td className="td r" style={{ color: T.amber, fontWeight: 600 }}>{fmtCur(b.totalGst)}</td>
                <td className="td r" style={{ fontWeight: 800, color: T.green }}>{fmtCur(b.total)}</td>
              </tr>
            ))}</tbody>
          </table>
          {filteredBills.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textMuted, fontSize: 13 }}>No bills in this period</div>}
        </div>
        <Pager total={filteredBills.length} page={pg} ps={ps} setPage={setPg} setPs={setPs} />
      </div>
    </div>
  );
}
