import React, { useState, useMemo, useEffect } from "react";
import { ShoppingCart, Package, Download, IndianRupee, BarChart2, Users, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useT } from "../theme";
import { KCard, GBtn, GS, Pager, PeriodBar, SearchInput, CTip } from "../components/UI";
import { fmtCur, fmtDate, inRange, getPresetDate, today, toCSV, dlCSV } from "../utils";

export default function PurchaseReports({ ctx }) {
  const T = useT();
  const { bills, products, vendors, getBillOutstanding } = ctx;

  const [df, setDf] = useState(getPresetDate("30d"));
  const [dt, setDt] = useState(today());
  const [preset, setPreset] = useState("30d");
  const [view, setView] = useState("daily");
  const [search, setSearch] = useState("");
  const [pg, setPg] = useState(1);
  const [ps, setPs] = useState(20);
  useEffect(() => setPg(1), [df, dt, search, ps, view]);

  const purchaseBills = useMemo(() => bills.filter(b =>
    b.type === "purchase" && inRange(b.date, df, dt)
  ), [bills, df, dt]);

  const summary = useMemo(() => {
    const totalSpend = purchaseBills.reduce((s, b) => s + Number(b.total || 0), 0);
    const totalGst = purchaseBills.reduce((s, b) => s + Number(b.totalGst || 0), 0);
    const netSpend = totalSpend - totalGst;
    const unitsBought = purchaseBills.reduce((s, b) => s + (b.items || []).reduce((x, i) => x + Number(i.qty || 0), 0), 0);
    const avgBill = purchaseBills.length ? totalSpend / purchaseBills.length : 0;
    const uniqueVendors = new Set(purchaseBills.map(b => b.vendorId).filter(Boolean)).size;
    // Outstanding across all purchase bills (not just filtered period)
    const allPurchaseOutstanding = bills.filter(b => b.type === "purchase")
      .reduce((s, b) => s + (getBillOutstanding ? getBillOutstanding(b) : 0), 0);
    return { totalSpend, totalGst, netSpend, unitsBought, avgBill, uniqueVendors, billCount: purchaseBills.length, outstanding: allPurchaseOutstanding };
  }, [purchaseBills, bills, getBillOutstanding]);

  const timeSeries = useMemo(() => {
    const buckets = {};
    purchaseBills.forEach(b => {
      if (!b.date) return;
      const key = view === "monthly" ? b.date.slice(0, 7) : b.date;
      if (!buckets[key]) buckets[key] = { date: key, spend: 0, bills: 0 };
      buckets[key].spend += Number(b.total || 0);
      buckets[key].bills += 1;
    });
    return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date)).map(b => ({
      ...b,
      label: view === "monthly" ? b.date : new Date(b.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    }));
  }, [purchaseBills, view]);

  const topVendors = useMemo(() => {
    const m = {};
    purchaseBills.forEach(b => {
      if (!b.vendorId) return;
      if (!m[b.vendorId]) m[b.vendorId] = { vendorId: b.vendorId, name: b.vendorName || "", bills: 0, spend: 0, units: 0 };
      m[b.vendorId].bills += 1;
      m[b.vendorId].spend += Number(b.total || 0);
      m[b.vendorId].units += (b.items || []).reduce((s, i) => s + Number(i.qty || 0), 0);
    });
    Object.values(m).forEach(x => { if (!x.name) x.name = vendors.find(v => v.id === x.vendorId)?.name || "(unknown)"; });
    return Object.values(m).sort((a, b) => b.spend - a.spend);
  }, [purchaseBills, vendors]);

  const topProducts = useMemo(() => {
    const m = {};
    purchaseBills.forEach(b => (b.items || []).forEach(it => {
      if (!m[it.productId]) m[it.productId] = { productId: it.productId, name: "", qty: 0, spend: 0 };
      m[it.productId].qty += Number(it.qty || 0);
      m[it.productId].spend += Number(it.qty || 0) * Number(it.price || 0);
    }));
    Object.values(m).forEach(x => {
      const p = products.find(pr => pr.id === x.productId);
      x.name = p?.name || "(unknown)";
      x.sku = p?.sku || "";
    });
    return Object.values(m).sort((a, b) => b.spend - a.spend);
  }, [purchaseBills, products]);

  const gstBreakdown = useMemo(() => {
    const intra = purchaseBills.filter(b => (b.gstType || "cgst_sgst") === "cgst_sgst");
    const inter = purchaseBills.filter(b => b.gstType === "igst");
    return [
      { name: "CGST + SGST", value: intra.reduce((s, b) => s + Number(b.total || 0), 0), count: intra.length, color: T.accent },
      { name: "IGST", value: inter.reduce((s, b) => s + Number(b.total || 0), 0), count: inter.length, color: T.blue },
    ].filter(x => x.value > 0);
  }, [purchaseBills, T.accent, T.blue]);

  const filteredBills = useMemo(() => {
    const q = search.toLowerCase();
    return purchaseBills.filter(b =>
      !search || (b.billNo || "").toLowerCase().includes(q) ||
      (b.purchaseInvoiceNo || "").toLowerCase().includes(q) ||
      (b.vendorName || "").toLowerCase().includes(q)
    ).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [purchaseBills, search]);

  const exportBills = () => {
    const rows = filteredBills.map(b => ({
      date: b.date, billNo: b.billNo, vendorInvoiceNo: b.purchaseInvoiceNo || "",
      vendor: b.vendorName,
      gstType: b.gstType === "igst" ? "IGST" : "CGST+SGST",
      items: (b.items || []).length, subtotal: b.subtotal || 0,
      gst: b.totalGst || 0, total: b.total || 0
    }));
    dlCSV(toCSV(rows, ["date","billNo","vendorInvoiceNo","vendor","gstType","items","subtotal","gst","total"]), `purchases_${df}_to_${dt}`);
  };
  const exportTopVendors = () => {
    const rows = topVendors.map(v => ({ name: v.name, bills: v.bills, units: v.units, spend: v.spend }));
    dlCSV(toCSV(rows, ["name","bills","units","spend"]), `top_vendors_${df}_to_${dt}`);
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
        <KCard label="Total Spend" value={fmtCur(summary.totalSpend)} sub="incl. GST" icon={ShoppingCart} color={T.blue} />
        <KCard label="Net Spend" value={fmtCur(summary.netSpend)} sub="excl. GST" icon={IndianRupee} color={T.accent} />
        <KCard label="GST Paid" value={fmtCur(summary.totalGst)} sub="input GST" icon={IndianRupee} color={T.amber} />
        <KCard label="Units Purchased" value={String(summary.unitsBought)} sub={`${summary.billCount} bills`} icon={Package} color={T.green} />
        <KCard label="Avg. Bill" value={fmtCur(summary.avgBill)} sub="per purchase" icon={BarChart2} color={T.accent} />
        <KCard label="Total Payable" value={fmtCur(summary.outstanding)} sub="across all bills" icon={AlertCircle} color={T.red} />
      </div>

      <div className="glass" style={{ padding: 18, borderRadius: T.radius }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 14 }}>Purchase Trend</div>
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
                <Line type="monotone" dataKey="spend" name="Spend" stroke={T.blue} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="chart-row" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <div className="glass" style={{ padding: 18, borderRadius: T.radius }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Top Vendors by Spend</div>
            {topVendors.length > 0 && <GBtn v="ghost" sz="sm" onClick={exportTopVendors} icon={<Download size={12} />}>CSV</GBtn>}
          </div>
          {topVendors.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: T.textMuted, fontSize: 12 }}>No vendors</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topVendors.slice(0, 8).map((v, i) => {
                const pct = topVendors[0].spend ? (v.spend / topVendors[0].spend) * 100 : 0;
                return (
                  <div key={v.vendorId || i}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={v.name}>{i + 1}. {v.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: T.blue, whiteSpace: "nowrap" }}>{fmtCur(v.spend)}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: T.border, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: T.blue, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{v.bills} bills · {v.units} units</div>
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

      <div className="glass" style={{ padding: 18, borderRadius: T.radius }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 14 }}>Top Products Purchased</div>
        {topProducts.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: T.textMuted, fontSize: 12 }}>No purchases</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr>{["#","Product","SKU","Qty","Spend"].map((h,i) => <th key={i} className="th" style={{ textAlign: ["Qty","Spend"].includes(h) ? "right" : "left" }}>{h}</th>)}</tr></thead>
              <tbody>{topProducts.slice(0, 15).map((p, i) => (
                <tr key={p.productId} className="trow">
                  <td className="td m" style={{ fontWeight: 600 }}>{i + 1}</td>
                  <td className="td" style={{ fontWeight: 700, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.name}>{p.name}</td>
                  <td className="td m" style={{ fontFamily: "monospace", fontSize: 11 }}>{p.sku || "—"}</td>
                  <td className="td r m">{p.qty}</td>
                  <td className="td r" style={{ fontWeight: 800, color: T.blue }}>{fmtCur(p.spend)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass" style={{ borderRadius: T.radius, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>All Purchase Bills</div>
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Bill no, vendor invoice, or vendor…" style={{ maxWidth: 320 }} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Date","Vendor Invoice","Vendor","Items","GST Type","Subtotal","GST","Total"].map((h,i) => (
              <th key={i} className="th" style={{ textAlign: ["Items","Subtotal","GST","Total"].includes(h) ? "right" : "left" }}>{h}</th>
            ))}</tr></thead>
            <tbody>{filteredBills.slice((pg-1)*ps, pg*ps).map(b => (
              <tr key={b.id} className="trow">
                <td className="td m" style={{ whiteSpace: "nowrap" }}>{fmtDate(b.date)}</td>
                <td className="td" style={{ fontWeight: 700, color: T.blue, whiteSpace: "nowrap" }}>{b.purchaseInvoiceNo || b.billNo}</td>
                <td className="td" style={{ fontWeight: 600, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={b.vendorName}>{b.vendorName || "—"}</td>
                <td className="td r m">{(b.items || []).length}</td>
                <td className="td m" style={{ fontSize: 11 }}>{b.gstType === "igst" ? "IGST" : "CGST+SGST"}</td>
                <td className="td r m">{fmtCur(b.subtotal)}</td>
                <td className="td r" style={{ color: T.amber, fontWeight: 600 }}>{fmtCur(b.totalGst)}</td>
                <td className="td r" style={{ fontWeight: 800, color: T.blue }}>{fmtCur(b.total)}</td>
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
