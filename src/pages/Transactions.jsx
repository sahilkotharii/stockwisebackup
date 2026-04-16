import React, { useState, useMemo, useEffect } from "react";
import { X, Download, Trash2, ArrowLeftRight } from "lucide-react";
import { useT } from "../theme";
import { GBtn, Pager, PeriodBar, SearchInput, DeleteConfirmModal } from "../components/UI";
import { fmtCur, fmtDate, inRange, toCSV, dlCSV, safeNum, sGst, sQty, sEffPrice, buildTransactionCSVRows, TXN_CSV_HEADERS } from "../utils";

export default function Transactions({ ctx }) {
  const T = useT();
  const { transactions, products, vendors, saveTransactions, saveBills, bills, user } = ctx;
  const canDelete = user.role === 'admin' || !ctx.changeReqs; 
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [df, setDf] = useState("");
  const [dt, setDt] = useState("");
  const [preset, setPreset] = useState("");
  const [pg, setPg] = useState(1);
  const [ps, setPs] = useState(20);
  const [sel, setSel] = useState(new Set());
  const [delConfirm, setDelConfirm] = useState(null); 
  
  useEffect(() => { setPg(1); setSel(new Set()); }, [tab, search, df, dt, ps]);

  const TT = [
    { id: "all",             label: "All Transactions" },
    { id: "opening",         label: "Opening Stock",    color: "#8B5CF6" },
    { id: "purchase",        label: "Purchases",        color: T.blue },
    { id: "sale",            label: "Sales",            color: T.green },
    { id: "return",          label: "Sales Returns",    color: T.amber },
    { id: "purchase_return", label: "Purchase Returns", color: T.cyan },
    { id: "damaged",         label: "Damaged",          color: T.red },
  ];

  const fil = useMemo(() => transactions.filter(t => {
    if (tab !== "all" && t.type !== tab) return false;
    if (!inRange(t.date, df, dt)) return false;
    const p = products.find(pr => pr.id === t.productId);
    if (search && !p?.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [transactions, tab, search, df, dt, products]);

  const paged = useMemo(() => fil.slice((pg - 1) * ps, pg * ps), [fil, pg, ps]);
  const allSel = paged.length > 0 && paged.every(t => sel.has(t.id));
  const tgSel = id => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const tgAll = () => setSel(allSel ? new Set() : new Set(paged.map(t => t.id)));
  const tiMap = { opening: "#8B5CF6", purchase: T.blue, sale: T.green, return: T.amber, purchase_return: T.cyan, damaged: T.red };

  const confirmDelete = (target) => { setDelConfirm({ mode: 'single', target }); };
  const confirmDeleteBulk = () => { setDelConfirm({ mode: 'bulk', target: [...sel] }); };
  
  const executeDelete = () => {
    if (!delConfirm) return;
    if (delConfirm.mode === 'single') {
      const t = delConfirm.target;
      const updated = transactions.filter(x => x.id !== t.id);
      saveTransactions(updated);
      if (t.billId) {
        saveBills(bills.filter(b => b.id !== t.billId));
        saveTransactions(updated.filter(x => x.billId !== t.billId));
      }
    } else {
      const toDelIds = new Set(delConfirm.target);
      const billIds = new Set(transactions.filter(t => toDelIds.has(t.id) && t.billId).map(t => t.billId));
      const remaining = transactions.filter(t => !toDelIds.has(t.id) && !billIds.has(t.billId));
      saveTransactions(remaining);
      if (billIds.size) saveBills(bills.filter(b => !billIds.has(b.id)));
      setSel(new Set());
    }
    setDelConfirm(null);
  };
  
  const exportCSV = () => dlCSV(toCSV(buildTransactionCSVRows(fil, products, vendors), TXN_CSV_HEADERS), "transactions");

  return <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
    <div className="glass spring-in" style={{ padding: "16px 20px", borderRadius: T.radius, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${T.accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ArrowLeftRight size={18} color={T.accent} />
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 16, color: T.text, letterSpacing: "-0.01em" }}>Master Transaction Ledger</div>
        <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 500, marginTop: 2 }}>Raw transaction log. To create new entries, use the Sales, Purchase, or Returns pages.</div>
      </div>
    </div>

    <div className="glass fade-up" style={{ borderRadius: T.radius, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.borderSubtle}`, background: T.surfaceGlass }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {TT.map(t => (
            <button key={t.id} className="liquid-trans" onClick={() => setTab(t.id)} 
              style={{ padding: "8px 16px", borderRadius: T.radiusFull, fontSize: 12, fontWeight: 700, cursor: "pointer", background: tab === t.id ? (t.color || T.accent) : "transparent", color: tab === t.id ? "#fff" : T.textSub, border: `1px solid ${tab === t.id ? (t.color || T.accent) : T.borderSubtle}`, boxShadow: tab === t.id ? `0 2px 8px ${(t.color||T.accent)}40` : "none" }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="filter-wrap" style={{ gap: 12 }}>
          <PeriodBar df={df} setDf={setDf} dt={dt} setDt={setDt} preset={preset} setPreset={setPreset} />
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product…" style={{ flex: "1 1 200px" }} />
          {(df || dt || search || preset) && <GBtn v="ghost" sz="sm" onClick={() => { setDf(""); setDt(""); setSearch(""); setPreset(""); }} icon={<X size={14} />} style={{ borderRadius: T.radiusFull }}>Clear Filters</GBtn>}
          <GBtn v="ghost" sz="sm" onClick={exportCSV} icon={<Download size={14} />} style={{ marginLeft: "auto" }}>Export CSV</GBtn>
        </div>

        {sel.size > 0 && (
          <div className="spring-down liquid-trans" style={{ marginTop: 16, padding: "12px 20px", borderRadius: T.radius, background: T.redBg, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", border: `1px solid ${T.red}30` }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.red }}>{sel.size} selected</span>
            <GBtn v="danger" sz="sm" onClick={confirmDeleteBulk} icon={<Trash2 size={14} />}>Delete Selected</GBtn>
            <button className="liquid-trans" onClick={() => setSel(new Set())} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: T.textMuted }}>Clear Selection</button>
          </div>
        )}
      </div>

      <div style={{ overflowX: "auto", background: T.surfaceGlass }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: T.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)" }}>
              <th className="th" style={{ width: 44, padding: "14px" }}><input type="checkbox" className="cb liquid-trans" checked={allSel} onChange={tgAll} /></th>
              {["Date", "Product", "Type", "Qty", "Rate", "Taxable", "GST", "Total Value", "Vendor/Customer", "Recorded By", "Bill/Ref"].map((h, i) => (
                <th key={i} className="th" style={{ textAlign: ["Qty","Rate","Taxable","GST","Total Value"].includes(h) ? "right" : "left", padding: "14px 16px" }}>{h}</th>
              ))}
              {user.role === "admin" && <th className="th" />}
            </tr>
          </thead>
          <tbody>
            {paged.map(t => {
              const p = products.find(pr => pr.id === t.productId);
              const v = vendors?.find(vn => vn.id === t.vendorId);
              const tc = tiMap[t.type] || T.textMuted;
              const isSel = sel.has(t.id);
              const typeLabel = t.type === "purchase_return" ? "Pur. Return" : t.type === "return" ? "Sale Return" : t.type;
              
              const rate = sGst(t);
              const ep = sEffPrice(t);
              const qty = sQty(t);
              const taxable = rate > 0 ? ep * 100/(100+rate) : ep;
              const gstAmt = safeNum(t.gstAmount) || (qty * ep - qty * taxable);
              
              return (
                <tr key={t.id} className={`trow liquid-trans ${isSel ? " row-sel" : ""}`} style={{ background: isSel ? `${T.red}10` : "transparent" }}>
                  <td className="td" style={{ padding: "14px" }}><input type="checkbox" className="cb liquid-trans" checked={isSel} onChange={() => tgSel(t.id)} /></td>
                  <td className="td m" style={{ whiteSpace: "nowrap", fontWeight: 500 }}>{fmtDate(t.date)}</td>
                  <td className="td" style={{ maxWidth: 220 }}>
                    <div style={{ fontWeight: 700, color: T.text, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={p?.name}>{p?.name || "—"}</div>
                    <div style={{ fontSize:11, color: T.textMuted, fontFamily: "monospace", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p?.sku}</div>
                  </td>
                  <td className="td">
                    <span className="badge liquid-trans" style={{ background: `${tc}15`, color: tc, textTransform: "capitalize", padding: "6px 12px", fontSize: 11 }}>
                      {typeLabel} {t.isDamaged ? " (DMG)" : ""}
                    </span>
                  </td>
                  <td className="td r" style={{ fontWeight: 800, color:T.text }}>{t.qty}</td>
                  <td className="td r m" style={{ fontWeight: 600 }}>{fmtCur(ep)}</td>
                  <td className="td r m" style={{ fontWeight: 500 }}>{fmtCur(qty*taxable)}</td>
                  <td className="td r m" style={{ color:T.amber, fontWeight: 600 }}>{gstAmt>0?fmtCur(gstAmt):"—"}</td>
                  <td className="td r" style={{ fontWeight:800, fontSize: 14, color:t.type==="sale"?T.green:t.type==="purchase"?T.blue:T.textSub }}>
                    {fmtCur(qty*ep)}
                  </td>
                  <td className="td m" style={{ fontWeight: 500 }}>{v?.name||"—"}</td>
                  <td className="td m" style={{ fontWeight: 500 }}>{t.userName||"—"}</td>
                  <td className="td" style={{ fontWeight:700, color:T.accent, letterSpacing: "0.02em" }}>{
                    t.billId ? (bills.find(b=>b.id===t.billId)?.billNo || t.billNo || "—") : (t.billNo || "—")
                  }</td>
                  {user.role === "admin" && (
                    <td className="td">
                      <button className="btn-danger liquid-trans" onClick={() => confirmDelete(t)} style={{ padding: "6px 10px" }}><Trash2 size={14} /></button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {fil.length === 0 && <div style={{ padding: "60px 0", textAlign: "center", color: T.textMuted, fontSize: 14, fontWeight: 600 }}>No transactions found in this period</div>}
      </div>
      <Pager total={fil.length} page={pg} ps={ps} setPage={setPg} setPs={setPs} />
    </div>

    <DeleteConfirmModal
      open={!!delConfirm}
      onClose={() => setDelConfirm(null)}
      onConfirm={executeDelete}
      user={user}
      label={delConfirm?.mode === "single" ? "this transaction" : `${delConfirm?.target?.length} transactions`}
      extra={delConfirm?.mode === "single" && delConfirm?.target?.billId ? "This will also delete the parent bill." : ""}
    />
  </div>;
}
