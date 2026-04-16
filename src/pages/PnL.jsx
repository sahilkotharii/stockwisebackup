import React, { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, Package, Download, ShoppingCart, Wallet, AlertTriangle } from "lucide-react";
import { useT } from "../theme";
import { GBtn, GIn, GS, KCard } from "../components/UI";
import { fmtCur, toCSV, dlCSV, safeDate } from "../utils";

export default function PnL({ ctx }) {
  const T = useT();
  const { bills = [], transactions = [], products = [], expenses = [], incomes = [] } = ctx;

  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? `${now.getFullYear()}-04-01` : `${now.getFullYear()-1}-04-01`;
  const fyEnd = now.getMonth() >= 3 ? `${now.getFullYear()+1}-03-31` : `${now.getFullYear()}-03-31`;
  const [df, setDf] = useState(fyStart);
  const [dt, setDt] = useState(fyEnd);

  const inP = d => { const s = safeDate(d); return s && s >= df && s <= dt; };

  // ─── Revenue side ──────────────────────────────────────────
  const revenue = useMemo(() => {
    // Only tax invoices — proforma excluded
    const saleBills = bills.filter(b => b.type === "sale" && !b.isProforma && inP(b.date));
    const grossSales = saleBills.reduce((s, b) => s + Number(b.total || 0), 0);
    const salesGst = saleBills.reduce((s, b) => s + Number(b.totalGst || 0), 0);
    const netSales = grossSales - salesGst;
    // Sales Returns — stock transactions with type "return"
    const salesReturns = transactions
      .filter(t => t.type === "return" && inP(t.date))
      .reduce((s, t) => s + Number(t.qty || 0) * Number(t.effectivePrice || t.price || 0), 0);
    // Other income — from ExpensesIncomes page
    const otherIncome = incomes.filter(i => inP(i.date)).reduce((s, i) => s + Number(i.amount || 0), 0);

    const netRevenue = netSales - salesReturns + otherIncome;
    return { grossSales, salesGst, netSales, salesReturns, otherIncome, netRevenue, billCount: saleBills.length };
  }, [bills, transactions, incomes, df, dt]);

  // ─── COGS side ─────────────────────────────────────────────
  const cogs = useMemo(() => {
    const purBills = bills.filter(b => b.type === "purchase" && inP(b.date));
    const grossPurchases = purBills.reduce((s, b) => s + Number(b.total || 0), 0);
    const purchaseGst = purBills.reduce((s, b) => s + Number(b.totalGst || 0), 0);
    const netPurchases = grossPurchases - purchaseGst;
    const purchaseReturns = transactions
      .filter(t => t.type === "purchase_return" && inP(t.date))
      .reduce((s, t) => s + Number(t.qty || 0) * Number(t.price || 0), 0);
    // Damaged goods — value at purchase cost
    const damagedValue = transactions.filter(t => t.type === "damaged" && inP(t.date)).reduce((s, t) => {
      const p = products.find(pr => pr.id === t.productId);
      const cost = Number(p?.purchasePrice || t.price || 0);
      return s + Number(t.qty || 0) * cost;
    }, 0);
    const netCogs = netPurchases - purchaseReturns + damagedValue;
    return { grossPurchases, purchaseGst, netPurchases, purchaseReturns, damagedValue, netCogs, billCount: purBills.length };
  }, [bills, transactions, products, df, dt]);

  // ─── Operating expenses ────────────────────────────────────
  const operatingExpenses = useMemo(() => {
    const filtered = expenses.filter(e => inP(e.date));
    const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
    const byCategory = {};
    filtered.forEach(e => {
      const c = e.category || "Uncategorized";
      byCategory[c] = (byCategory[c] || 0) + Number(e.amount || 0);
    });
    return { total, byCategory, count: filtered.length };
  }, [expenses, df, dt]);

  // ─── Final P&L ─────────────────────────────────────────────
  const grossProfit = revenue.netSales - revenue.salesReturns - cogs.netCogs;
  const netProfit = grossProfit + revenue.otherIncome - operatingExpenses.total;
  const gstLiability = revenue.salesGst - cogs.purchaseGst;
  const grossMargin = revenue.netSales > 0 ? (grossProfit / revenue.netSales) * 100 : 0;
  const netMargin = revenue.netRevenue > 0 ? (netProfit / revenue.netRevenue) * 100 : 0;

  const exportCSV = () => {
    const rows = [
      { label: "REVENUE", value: "" },
      { label: "Gross Sales (incl. GST)", value: revenue.grossSales },
      { label: "Less: Output GST", value: -revenue.salesGst },
      { label: "Net Sales", value: revenue.netSales },
      { label: "Less: Sales Returns", value: -revenue.salesReturns },
      { label: "Add: Other Income", value: revenue.otherIncome },
      { label: "Net Revenue", value: revenue.netRevenue },
      { label: "", value: "" },
      { label: "COST OF GOODS SOLD", value: "" },
      { label: "Gross Purchases (incl. GST)", value: cogs.grossPurchases },
      { label: "Less: Input GST", value: -cogs.purchaseGst },
      { label: "Net Purchases", value: cogs.netPurchases },
      { label: "Less: Purchase Returns", value: -cogs.purchaseReturns },
      { label: "Add: Damaged Goods", value: cogs.damagedValue },
      { label: "Total COGS", value: cogs.netCogs },
      { label: "", value: "" },
      { label: "GROSS PROFIT", value: grossProfit },
      { label: `Gross Margin %`, value: grossMargin.toFixed(2) },
      { label: "", value: "" },
      { label: "OPERATING EXPENSES", value: "" },
      ...Object.entries(operatingExpenses.byCategory).map(([k, v]) => ({ label: `  ${k}`, value: v })),
      { label: "Total Operating Expenses", value: operatingExpenses.total },
      { label: "", value: "" },
      { label: "NET PROFIT", value: netProfit },
      { label: "Net Margin %", value: netMargin.toFixed(2) },
      { label: "", value: "" },
      { label: "GST SUMMARY", value: "" },
      { label: "Output GST (collected)", value: revenue.salesGst },
      { label: "Input GST (paid)", value: cogs.purchaseGst },
      { label: "GST Liability (payable)", value: gstLiability },
    ];
    dlCSV(toCSV(rows, ["label","value"]), `pnl_${df}_to_${dt}`);
  };

  const LineItem = ({ label, value, bold, indent, positive, negative, subtle, divider }) => (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: divider ? "10px 16px" : "6px 16px",
      paddingLeft: indent ? 32 : 16,
      borderTop: divider ? `1px solid ${T.border}` : "none",
      fontWeight: bold ? 800 : subtle ? 500 : 600,
      fontSize: bold ? 14 : 12,
      background: bold ? (T.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)") : "transparent"
    }}>
      <span style={{ color: bold ? T.text : subtle ? T.textMuted : T.textSub }}>{label}</span>
      <span style={{
        color: positive ? T.green : negative ? T.red : bold ? T.text : T.textSub,
        fontWeight: 800, fontFamily: "monospace"
      }}>{typeof value === "number" ? fmtCur(value) : value}</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Period filter */}
      <div className="glass" style={{ padding: 14, borderRadius: T.radius, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.textSub }}>Period:</span>
        <GIn type="date" value={df} onChange={e => setDf(e.target.value)} style={{ width: 140 }} />
        <span style={{ color: T.textMuted }}>→</span>
        <GIn type="date" value={dt} onChange={e => setDt(e.target.value)} style={{ width: 140 }} />
        <GBtn v="ghost" sz="sm" onClick={() => { setDf(fyStart); setDt(fyEnd); }}>Current FY</GBtn>
        <div style={{ flex: 1 }} />
        <GBtn v="ghost" sz="sm" onClick={exportCSV} icon={<Download size={13} />}>Export CSV</GBtn>
      </div>

      {/* Top KPIs */}
      <div className="kgrid">
        <KCard label="Net Revenue" value={fmtCur(revenue.netRevenue)} sub={`${revenue.billCount} invoices`} icon={TrendingUp} color={T.green} />
        <KCard label="Total COGS" value={fmtCur(cogs.netCogs)} sub={`${cogs.billCount} purchases`} icon={ShoppingCart} color={T.blue} />
        <KCard label="Gross Profit" value={fmtCur(grossProfit)} sub={`${grossMargin.toFixed(1)}% margin`} icon={DollarSign} color={T.accent} />
        <KCard label="Operating Expenses" value={fmtCur(operatingExpenses.total)} sub={`${operatingExpenses.count} entries`} icon={Wallet} color={T.amber} />
        <KCard label="Net Profit" value={fmtCur(netProfit)} sub={`${netMargin.toFixed(1)}% net margin`} icon={netProfit >= 0 ? TrendingUp : TrendingDown} color={netProfit >= 0 ? T.green : T.red} />
        <KCard label="GST Liability" value={fmtCur(gstLiability)} sub={gstLiability > 0 ? "To pay" : "Refund due"} icon={Package} color={gstLiability > 0 ? T.red : T.green} />
      </div>

      {/* P&L Statement */}
      <div className="glass" style={{ borderRadius: T.radius, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.borderSubtle}`, background: T.surfaceStrong }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Profit & Loss Statement</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{df} to {dt}</div>
        </div>

        {/* Revenue */}
        <LineItem label="REVENUE" bold />
        <LineItem label="Gross Sales (incl. GST)" value={revenue.grossSales} indent />
        <LineItem label="Less: Output GST" value={-revenue.salesGst} indent negative subtle />
        <LineItem label="Net Sales (excl. GST)" value={revenue.netSales} indent divider />
        <LineItem label="Less: Sales Returns" value={-revenue.salesReturns} indent negative subtle />
        <LineItem label="Add: Other Income" value={revenue.otherIncome} indent positive subtle />
        <LineItem label="Total Revenue" value={revenue.netRevenue} bold divider />

        {/* COGS */}
        <div style={{ height: 8 }} />
        <LineItem label="COST OF GOODS SOLD" bold />
        <LineItem label="Gross Purchases (incl. GST)" value={cogs.grossPurchases} indent />
        <LineItem label="Less: Input GST" value={-cogs.purchaseGst} indent negative subtle />
        <LineItem label="Net Purchases" value={cogs.netPurchases} indent divider />
        <LineItem label="Less: Purchase Returns" value={-cogs.purchaseReturns} indent positive subtle />
        <LineItem label="Add: Damaged Goods" value={cogs.damagedValue} indent negative subtle />
        <LineItem label="Total COGS" value={cogs.netCogs} bold divider />

        {/* Gross Profit */}
        <div style={{ padding: "12px 16px", background: T.accentBg, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.accent }}>GROSS PROFIT</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Revenue − COGS · {grossMargin.toFixed(2)}% margin</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: grossProfit >= 0 ? T.green : T.red, fontFamily: "monospace" }}>{fmtCur(grossProfit)}</div>
        </div>

        {/* Operating Expenses */}
        <div style={{ height: 8 }} />
        <LineItem label="OPERATING EXPENSES" bold />
        {Object.keys(operatingExpenses.byCategory).length === 0 ? (
          <div style={{ padding: "8px 16px 8px 32px", fontSize: 12, color: T.textMuted, fontStyle: "italic" }}>No operating expenses recorded</div>
        ) : (
          Object.entries(operatingExpenses.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <LineItem key={cat} label={cat} value={amt} indent negative subtle />
          ))
        )}
        <LineItem label="Total Operating Expenses" value={operatingExpenses.total} bold divider />

        {/* Net Profit */}
        <div style={{ padding: "16px 16px", background: netProfit >= 0 ? T.greenBg : T.redBg, borderTop: `2px solid ${netProfit >= 0 ? T.green : T.red}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: netProfit >= 0 ? T.green : T.red }}>NET PROFIT</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Gross Profit + Other Income − Expenses · {netMargin.toFixed(2)}% net margin</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: netProfit >= 0 ? T.green : T.red, fontFamily: "monospace" }}>{fmtCur(netProfit)}</div>
        </div>

        {/* GST Summary */}
        <div style={{ padding: "14px 16px", background: T.surfaceGlass, borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.textSub, letterSpacing: ".05em", marginBottom: 10 }}>GST SUMMARY</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div><div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>Output GST (collected)</div><div style={{ fontSize: 14, fontWeight: 800, color: T.amber, marginTop: 2 }}>{fmtCur(revenue.salesGst)}</div></div>
            <div><div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>Input GST (paid)</div><div style={{ fontSize: 14, fontWeight: 800, color: T.blue, marginTop: 2 }}>{fmtCur(cogs.purchaseGst)}</div></div>
            <div><div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>GST Liability</div><div style={{ fontSize: 14, fontWeight: 800, color: gstLiability > 0 ? T.red : T.green, marginTop: 2 }}>{fmtCur(gstLiability)}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
