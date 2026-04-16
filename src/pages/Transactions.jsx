import React, { useState, useMemo, useEffect } from "react";
import { Download, ArrowUp, ArrowDown, Package, IndianRupee, Receipt, RotateCcw, AlertTriangle, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { useT } from "../theme";
import { GBtn, GS, Pager, PeriodBar, SearchInput, Pill } from "../components/UI";
import { fmtCur, fmtDate, inRange, toCSV, dlCSV } from "../utils";

// Unified activity ledger — stock moves + payments + receipts + expenses + incomes
// Excludes PI (proforma), SO, PO entirely

export default function Transactions({ ctx }) {
  const T = useT();
  const { transactions, products, vendors, payments, expenses, incomes } = ctx;

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [df, setDf] = useState("");
  const [dt, setDt] = useState("");
  const [preset, setPreset] = useState("");
  const [pg, setPg] = useState(1);
  const [ps, setPs] = useState(30);

  useEffect(() => { setPg(1); }, [tab, search, df, dt, ps]);

  // ─── Build unified activity feed ────────────────────────────
  const allActivity = useMemo(() => {
    const rows = [];

    // Stock transactions (already excludes proforma/SO/PO by design)
    (transactions || []).forEach(t => {
      const p = products.find(pr => pr.id === t.productId);
      const v = vendors.find(vn => vn.id === t.vendorId);
      const qty = Number(t.qty || 0);
      const price = Number(t.effectivePrice || t.price || 0);
      const value = qty * price;
      let category = "stock";
      let label = t.type;
      let direction = "neutral";
      if (t.type === "sale") { category = "sale"; label = "Sale"; direction = "in"; }
      else if (t.type === "purchase") { category = "purchase"; label = "Purchase"; direction = "out"; }
      else if (t.type === "return") { category = "sale_return"; label = "Sales Return"; direction = "out"; }
      else if (t.type === "purchase_return") { category = "purchase_return"; label = "Purchase Return"; direction = "in"; }
      else if (t.type === "damaged") { category = "damaged"; label = "Damaged"; direction = "out"; }
      else if (t.type === "opening") { category = "opening"; label = "Opening Stock"; direction = "neutral"; }

      rows.push({
        id: t.id,
        date: t.date,
        kind: "stock",
        category,
        label,
        direction,
        description: p?.name || "—",
        secondary: p?.sku || "",
        partyName: v?.name || t.vendorName || "—",
        qty,
        amount: value,
        ref: t.billNo || "",
        paymentMode: t.paymentMode || "",
        user: t.userName || "",
        notes: t.notes || ""
      });
    });

    // Payments & Receipts — both come from `payments` state
    (payments || []).forEach(p => {
      const isReceived = p.type === "received";
      rows.push({
        id: p.id,
        date: p.date,
        kind: isReceived ? "receipt" : "payment",
        category: isReceived ? "receipt" : "payment",
        label: isReceived ? "Receipt" : "Payment",
        direction: isReceived ? "in" : "out",
        description: isReceived ? "Payment received" : "Payment made",
        secondary: "",
        partyName: p.vendorName || "—",
        qty: null,
        amount: Number(p.amount || 0),
        ref: p.billNo || "On Account",
        paymentMode: p.paymentMode || "",
        user: p.userName || "",
        notes: p.notes || p.reference || ""
      });
    });

    // Expenses
    (expenses || []).forEach(e => {
      rows.push({
        id: e.id,
        date: e.date,
        kind: "expense",
        category: "expense",
        label: "Expense",
        direction: "out",
        description: e.category || "Expense",
        secondary: "",
        partyName: e.party || "—",
        qty: null,
        amount: Number(e.amount || 0),
        ref: e.reference || "",
        paymentMode: e.paymentMode || "",
        user: e.userName || "",
        notes: e.notes || ""
      });
    });

    // Incomes
    (incomes || []).forEach(i => {
      rows.push({
        id: i.id,
        date: i.date,
        kind: "income",
        category: "income",
        label: "Income",
        direction: "in",
        description: i.category || "Income",
        secondary: "",
        partyName: i.party || "—",
        qty: null,
        amount: Number(i.amount || 0),
        ref: i.reference || "",
        paymentMode: i.paymentMode || "",
        user: i.userName || "",
        notes: i.notes || ""
      });
    });

    return rows;
  }, [transactions, products, vendors, payments, expenses, incomes]);

  // ─── Filter by tab, date, search ───────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allActivity
      .filter(r => {
        if (tab !== "all" && r.category !== tab) return false;
        if (!inRange(r.date, df, dt)) return false;
        if (search && !`${r.description} ${r.partyName} ${r.ref}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [allActivity, tab, df, dt, search]);

  // ─── Tab counts and summaries ──────────────────────────────
  const counts = useMemo(() => {
    const c = { all: allActivity.length };
    allActivity.forEach(r => { c[r.category] = (c[r.category] || 0) + 1; });
    return c;
  }, [allActivity]);

  // Money-in vs money-out for selected range (just for the summary banner)
  const totals = useMemo(() => {
    let inAmt = 0, outAmt = 0;
    filtered.forEach(r => {
      // For stock, we count sale value as "in" and purchase value as "out"
      // but for simplicity in this summary, use direction field
      if (r.kind === "receipt" || r.kind === "income") inAmt += r.amount;
      else if (r.kind === "payment" || r.kind === "expense") outAmt += r.amount;
    });
    return { inAmt, outAmt, net: inAmt - outAmt };
  }, [filtered]);

  const TABS = [
    { id: "all",             label: "All",             icon: ArrowUp, color: T.text },
    { id: "sale",            label: "Sales",           icon: TrendingUp, color: T.green },
    { id: "purchase",        label: "Purchases",       icon: ShoppingCart, color: T.blue },
    { id: "sale_return",     label: "Sales Returns",   icon: RotateCcw, color: T.amber },
    { id: "purchase_return", label: "Pur. Returns",    icon: RotateCcw, color: T.accent },
    { id: "damaged",         label: "Damaged",         icon: AlertTriangle, color: T.red },
    { id: "receipt",         label: "Receipts",        icon: ArrowDown, color: T.green },
    { id: "payment",         label: "Payments",        icon: ArrowUp, color: T.red },
    { id: "income",          label: "Incomes",         icon: Wallet, color: T.green },
    { id: "expense",         label: "Expenses",        icon: Wallet, color: T.red },
    { id: "opening",         label: "Opening",         icon: Package, color: "#8B5CF6" },
  ];

  const tabColor = id => TABS.find(t => t.id === id)?.color || T.textSub;

  const exportCSV = () => {
    const rows = filtered.map(r => ({
      date: r.date, type: r.label, party: r.partyName, description: r.description,
      qty: r.qty ?? "", amount: r.amount, reference: r.ref, paymentMode: r.paymentMode,
      user: r.user, notes: r.notes
    }));
    dlCSV(toCSV(rows, ["date","type","party","description","qty","amount","reference","paymentMode","user","notes"]), `activity_${df || "all"}_to_${dt || "now"}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="glass" style={{ padding: "12px 16px", borderRadius: T.radius, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ width: 36, height: 36, borderRadius: T.radius, background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowUp size={16} color={T.accent} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Master Activity Ledger</div>
          <div style={{ fontSize: 11, color: T.textMuted }}>All stock, cash, expense, and income movements · excludes Proforma, SO, PO</div>
        </div>
        {(totals.inAmt > 0 || totals.outAmt > 0) && (
          <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
            <div><span style={{ color: T.textMuted, fontWeight: 600 }}>Money In: </span><span style={{ color: T.green, fontWeight: 800 }}>{fmtCur(totals.inAmt)}</span></div>
            <div><span style={{ color: T.textMuted, fontWeight: 600 }}>Money Out: </span><span style={{ color: T.red, fontWeight: 800 }}>{fmtCur(totals.outAmt)}</span></div>
            <div><span style={{ color: T.textMuted, fontWeight: 600 }}>Net: </span><span style={{ color: totals.net >= 0 ? T.green : T.red, fontWeight: 800 }}>{fmtCur(totals.net)}</span></div>
          </div>
        )}
      </div>

      <div className="filter-wrap">
        {TABS.map(t => {
          const count = counts[t.id] || 0;
          if (t.id !== "all" && count === 0) return null;
          const isActive = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "6px 14px", borderRadius: T.radiusFull, border: "none",
                background: isActive ? t.color : "transparent",
                color: isActive ? "#fff" : T.textSub,
                fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 5, transition: "all .2s" }}>
              <t.icon size={12} />{t.label}
              <span style={{ opacity: .7, fontSize: 10 }}>({count})</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <PeriodBar df={df} setDf={setDf} dt={dt} setDt={setDt} preset={preset} setPreset={setPreset} />
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search description, party, reference…" style={{ flex: "1 1 220px", minWidth: 200 }} />
        <GBtn v="ghost" sz="sm" onClick={exportCSV} icon={<Download size={13} />}>Export CSV</GBtn>
      </div>

      <div className="glass" style={{ borderRadius: T.radius, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th className="th">Date</th>
                <th className="th">Type</th>
                <th className="th">Description</th>
                <th className="th">Party</th>
                <th className="th">Reference</th>
                <th className="th" style={{ textAlign: "right" }}>Qty</th>
                <th className="th" style={{ textAlign: "right" }}>Amount</th>
                <th className="th">By</th>
              </tr>
            </thead>
            <tbody>{filtered.slice((pg-1)*ps, pg*ps).map(r => {
              const tc = tabColor(r.category);
              return (
                <tr key={`${r.kind}-${r.id}`} className="trow">
                  <td className="td m" style={{ whiteSpace: "nowrap" }}>{fmtDate(r.date)}</td>
                  <td className="td"><Pill c={r.label} color={tc} /></td>
                  <td className="td" style={{ maxWidth: 240 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.description}>{r.description}</div>
                    {r.secondary && <div style={{ fontSize: 11, color: T.textMuted, fontFamily: "monospace", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.secondary}</div>}
                  </td>
                  <td className="td" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }} title={r.partyName}>{r.partyName}</td>
                  <td className="td" style={{ fontWeight: 700, color: tc, whiteSpace: "nowrap" }}>{r.ref || "—"}</td>
                  <td className="td r m">{r.qty !== null ? r.qty : "—"}</td>
                  <td className="td r" style={{ fontWeight: 800, color: r.direction === "in" ? T.green : r.direction === "out" ? T.red : T.text }}>
                    {r.direction === "in" ? "+" : r.direction === "out" ? "−" : ""}{fmtCur(r.amount)}
                  </td>
                  <td className="td m" style={{ fontSize: 11 }}>{r.user || "—"}</td>
                </tr>
              );
            })}</tbody>
          </table>
          {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>No activity in this period</div>}
        </div>
        <Pager total={filtered.length} page={pg} ps={ps} setPage={setPg} setPs={setPs} />
      </div>
    </div>
  );
}
