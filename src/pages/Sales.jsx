import React, { useState, useMemo, useEffect } from "react";
import { Plus, X, Eye, Trash2, Send, Edit2, TrendingUp, DollarSign, FileText, Package, Printer, Download, CreditCard } from "lucide-react";
import { useT } from "../theme";
import { KCard, GBtn, DeleteConfirmModal, GS, GIn, GTa, Field, Modal, Pager, PeriodBar, SearchInput } from "../components/UI";
import BillForm from "../components/BillForm";
import InvoiceModal, { buildHTML } from "../components/InvoiceModal";
import PaymentModal, { PaymentStatusBadge, OutstandingBadge } from "../components/PaymentModal";
import ConversionMenu from "../components/ConversionMenu";
import { uid, today, fmtCur, fmtDate, inRange, calcBillGst, safeDate, getPresetDate, safeNum } from "../utils";

export default function Sales({ ctx }) {
  const T = useT();
  const { bills, saveBills, transactions, saveTransactions, products, vendors, getStock, user, addLog, addChangeReq, invoiceSettings, getBillPaid, getBillOutstanding } = ctx;
  const isManager = user.role === "manager";
  const isAdmin = user.role === "admin";

  const [editBill, setEditBill] = useState(null);
  const [invoiceBill, setInvoiceBill] = useState(null);
  const [payBill, setPayBill] = useState(null);
  const [selBills, setSelBills] = useState(new Set());
  const tgBill = id => setSelBills(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const [preset, setPreset] = useState("30d");
  const [df, setDf] = useState(getPresetDate("30d"));
  const [dt, setDt] = useState(today());
  const [vendorF, setVendorF] = useState("");
  const [pg, setPg] = useState(1); const [ps, setPs] = useState(20);
  const [search, setSearch] = useState("");
  const [exp, setExp] = useState({});
  const [delConfirm, setDelConfirm] = useState(null);
  const [delBulkConfirm, setDelBulkConfirm] = useState(false);
  useEffect(() => setPg(1), [df, dt, vendorF, search, ps]);

  const periodSaleBills = useMemo(() => bills.filter(b =>
    b.type === "sale" && inRange(b.date, df, dt) && (vendorF ? b.vendorId === vendorF : true)
  ), [bills, df, dt, vendorF]);

  const totalRevenueInclGst = periodSaleBills.reduce((s, b) => s + Number(b.total || 0), 0);
  const totalGstCollected = periodSaleBills.reduce((s, b) => s + calcBillGst(b), 0);
  const netRevenueExclGst = totalRevenueInclGst - totalGstCollected;
  const unitsSold = periodSaleBills.reduce((s, b) => s + (b.items || []).reduce((si, i) => si + Number(i.qty || 0), 0), 0);

  const saleBills = useMemo(() => periodSaleBills.filter(b => {
    if (search) {
      const q = search.toLowerCase();
      return (b.items || []).some(i => i.productName?.toLowerCase().includes(q)) || b.billNo?.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b2) => (b2.date || "").localeCompare(a.date || "")), [periodSaleBills, search]);

  const downloadBulkInvoices = () => {
    const selected = saleBills.filter(b => selBills.has(b.id));
    if (selected.length === 0) return;

    const pages = selected.map((b, idx) => {
      const vendor = (vendors||[]).find(v => v.id === b.vendorId) || null;
      const html = buildHTML(b, invoiceSettings || {}, vendor);
      const pageMatch = html.match(/<div class="page">([\s\S]*?)<\/div>\s*<\/body>/i);
      const content = pageMatch ? pageMatch[1] : html.replace(/<html>[\s\S]*?<body>/, "").replace(/<\/body>[\s\S]*/, "");
      const isLast = idx === selected.length - 1;
      return `<div class="page">${content}</div>${isLast ? "" : '<div style="page-break-after:always"></div>'}`;
    });

    const sampleHtml = buildHTML(selected[0], invoiceSettings || {}, (vendors||[]).find(v => v.id === selected[0].vendorId) || null);
    const styleMatch = sampleHtml.match(/<style>([\s\S]*?)<\/style>/i);
    const sharedStyle = styleMatch ? styleMatch[1] : "";

    const combined = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Invoices (${selected.length})</title>
<style>
${sharedStyle}
@page { size: A4; margin: 12mm; }
.page { width: 794px; min-height: 1050px; margin: 0 auto; padding: 24px; display: flex; flex-direction: column; page-break-inside: avoid; }
@media print {
  .no-print { display: none !important; }
  .page { page-break-inside: auto; break-inside: auto; }
}
</style>
</head><body>${pages.join("\n")}</body></html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (win) {
      win.document.write(combined);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 800);
    }
    setSelBills(new Set());
  };

  const handleSaveBill = bill => {
    if (isManager) { addChangeReq({ entity: "sale", action: "create", entityId: null, entityName: bill.billNo, currentData: null, proposedData: bill }); return; }
    const newTxns = bill.items.map(item => ({
      id: uid(), productId: item.productId, type: item.isDamaged ? "damaged" : "sale",
      qty: item.qty, price: item.effectivePrice || item.price,
      effectivePrice: item.effectivePrice || item.price,
      gstRate: item.gstRate || 0, gstAmount: item.gstAmount || 0,
      vendorId: bill.vendorId, date: bill.date,
      notes: `Bill: ${bill.billNo}${bill.notes ? ` · ${bill.notes}` : ""}`,
      userId: user.id, userName: user.name, billId: bill.id, isDamaged: item.isDamaged,
      paymentMode: bill.paymentMode || ""
    }));
    const billWithUser = { ...bill, userId: user.id, userName: user.name };
    saveBills([billWithUser, ...bills]);
    saveTransactions([...newTxns, ...transactions]);
    addLog("created", "sale bill", bill.billNo, `${bill.items.length} items · ${fmtCur(bill.total)}`);
  };

  const handleEditBill = updatedBill => {
    const filteredTxns = transactions.filter(t => t.billId !== updatedBill.id);
    const newTxns = updatedBill.items.map(item => ({
      id: uid(), productId: item.productId, type: item.isDamaged ? "damaged" : "sale",
      qty: item.qty, price: item.effectivePrice || item.price,
      effectivePrice: item.effectivePrice || item.price,
      gstRate: item.gstRate || 0, gstAmount: item.gstAmount || 0,
      vendorId: updatedBill.vendorId, date: updatedBill.date,
      notes: `Bill: ${updatedBill.billNo} (edited)`,
      gstType: updatedBill.gstType || "",
      userId: user.id, userName: user.name, billId: updatedBill.id, isDamaged: item.isDamaged,
      paymentMode: updatedBill.paymentMode || ""
    }));
    const updatedWithUser = { ...updatedBill, userId: user.id, userName: user.name };
    saveBills(bills.map(b => b.id === updatedBill.id ? updatedWithUser : b));
    saveTransactions([...newTxns, ...filteredTxns]);
    addLog("edited", "sale bill", updatedBill.billNo);
    setEditBill(null);
  };

  const deleteBill = b => {
    if (isManager) {
      if (!window.confirm(`Request admin to delete bill ${b.billNo}?`)) return;
      addChangeReq({ entity: "sale", action: "delete", entityId: b.id, entityName: b.billNo, currentData: b, proposedData: null });
      return;
    }
    setDelConfirm(b);
  };
  const doDeleteBill = b => {
    saveBills(bills.filter(x => x.id !== b.id));
    saveTransactions(transactions.filter(t => t.billId !== b.id));
    addLog("deleted", "sale bill", b.billNo);
  };

  return <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
    {isManager && <div className="spring-in" style={{ padding: "12px 16px", borderRadius: T.radius, background: T.amberBg, border: `1px solid ${T.amber}30`, fontSize: 13, color: T.amber, fontWeight: 700, letterSpacing: "0.02em" }}> Manager mode — new sales require admin approval</div>}

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
      <PeriodBar df={df} setDf={setDf} dt={dt} setDt={setDt} preset={preset} setPreset={setPreset} />
      <div style={{ display: "flex", gap: 10 }}>
        <GBtn v="ghost" sz="md" onClick={() => ctx.setPage("new-proforma")} icon={<FileText size={14} />}>+ Proforma Invoice</GBtn>
        <GBtn sz="md" onClick={() => ctx.setPage("new-sale-invoice")} icon={<Plus size={16} />} style={{ fontSize: 14, fontWeight: 700, padding: "12px 24px", borderRadius: T.radiusFull, boxShadow: `0 4px 12px ${T.accent}40` }}>New Tax Invoice</GBtn>
      </div>
    </div>

    <div className="kgrid" style={{ gap: 20 }}>
      {[
        { label: "Total Sales", value: totalRevenueInclGst, sub: "incl. GST · all bills", icon: TrendingUp, color: T.green },
        { label: "Net Sales", value: netRevenueExclGst, sub: "excl. GST · all bills", icon: DollarSign, color: T.accent },
        { label: "Units Sold", value: unitsSold, sub: "total qty across bills", icon: Package, color: "#8B5CF6", noFmt: true },
      ].map((k, i) => (
        <KCard key={i} label={k.label} value={k.noFmt ? String(k.value) : fmtCur(k.value)} sub={k.sub} icon={k.icon} color={k.color} />
      ))}
    </div>

    <div className="glass fade-up" style={{ borderRadius: T.radius, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.borderSubtle}`, background: T.surfaceGlass }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontFamily: T.displayFont, fontWeight: 800, fontSize: 18, color: T.text, letterSpacing: "-0.01em" }}>Sales Bills</div>
        </div>
        
        <div className="filter-wrap" style={{ gap: 12 }}>
          <div style={{ position: "relative", flex: "1 1 200px" }}>
            <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bill no, product…" />
          </div>
          <GS value={vendorF} onChange={e => setVendorF(e.target.value)} placeholder="All Customers" style={{ flex: "0 1 200px" }}>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </GS>
          {(vendorF || search) && <GBtn v="ghost" sz="sm" onClick={() => { setVendorF(""); setSearch(""); }} icon={<X size={14} />} style={{ borderRadius: T.radiusFull }}>Clear</GBtn>}
        </div>

        {selBills.size > 0 && (
          <div className="spring-down liquid-trans" style={{ marginTop: 16, padding: "12px 20px", borderRadius: T.radius, background: T.accentBg, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", border: `1px solid ${T.accent}30` }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.accent }}>{selBills.size} selected</span>
            <GBtn sz="sm" onClick={downloadBulkInvoices} icon={<Download size={14} />}>Download {selBills.size} Invoice{selBills.size!==1?"s":""}</GBtn>
            <GBtn v="danger" sz="sm" onClick={() => { if(isManager){if(window.confirm(`Request admin to delete ${selBills.size} bills?`)){saleBills.filter(b=>selBills.has(b.id)).forEach(b=>addChangeReq({entity:'sale',action:'delete',entityId:b.id,entityName:b.billNo,currentData:b,proposedData:null}));setSelBills(new Set());}}else if(window.confirm(`Delete ${selBills.size} bills?`)){const toDelIds=new Set(selBills);saveBills(bills.filter(x=>!toDelIds.has(x.id)));saveTransactions(transactions.filter(t=>!toDelIds.has(t.billId)));setSelBills(new Set());}}} icon={<Trash2 size={14} />}>{isManager?"Request Delete":"Delete Selected"}</GBtn>
            <button className="liquid-trans" onClick={() => setSelBills(new Set())} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: T.textMuted }}>Clear Selection</button>
          </div>
        )}
      </div>

      {/* ── Mobile Card View ───────────────────────────────────────── */}
      <div className="mob-card-view">
        {saleBills.slice((pg-1)*ps, pg*ps).map(b => {
          const v = vendors.find(x => x.id === b.vendorId);
          return (
            <div key={b.id} className="mob-bill-card" style={{ borderBottom: `1px solid ${T.borderSubtle}`, padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.accent, letterSpacing: "0.02em" }}>{b.billNo}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, fontWeight: 500 }}>{fmtDate(b.date)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.green }}>{fmtCur(b.total)}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>{(b.items||[]).length} items</div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{v?.name || "—"}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <PaymentStatusBadge bill={b} getBillPaid={getBillPaid} />
                <OutstandingBadge bill={b} getBillOutstanding={getBillOutstanding} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button className="btn-ghost liquid-trans" onClick={() => setPayBill(b)} style={{ padding: "6px 12px", fontSize: 11 }}><CreditCard size={12} style={{ marginRight: 4 }} />Pay</button>
                <button className="btn-ghost liquid-trans" onClick={() => setInvoiceBill(b)} style={{ padding: "6px 12px", fontSize: 11 }}><Printer size={12} style={{ marginRight: 4 }} />Invoice</button>
                <button className="btn-ghost liquid-trans" onClick={() => setExp(p => ({...p,[b.id]:!p[b.id]}))} style={{ padding: "6px 12px", fontSize: 11 }}><Eye size={12} style={{ marginRight: 4 }} />Details</button>
                {isAdmin && <button className="btn-ghost liquid-trans" onClick={() => setEditBill(b)} style={{ padding: "6px 12px", fontSize: 11 }}><Edit2 size={12} /></button>}
              </div>
              {exp[b.id] && (
                <div className="spring-down" style={{ marginTop: 8, padding: 12, borderRadius: T.radius, background: T.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                  {(b.items||[]).map((it, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: idx < (b.items||[]).length - 1 ? `1px solid ${T.borderSubtle}` : "none", fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: T.text }}>{it.productName} × {it.qty}</span>
                      <span style={{ fontWeight: 700, color: T.textSub }}>{fmtCur(Number(it.qty) * Number(it.effectivePrice || it.price || 0))}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.borderSubtle}`, fontWeight: 800 }}>
                    <span style={{ color: T.text }}>Total</span>
                    <span style={{ color: T.accent }}>{fmtCur(b.total)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {saleBills.length === 0 && <div style={{ padding: "40px 0", textAlign: "center", color: T.textMuted, fontSize: 13, fontWeight: 600 }}>No sales bills found</div>}
      </div>

      {/* ── Desktop Table View ─────────────────────────────────────── */}
      <div className="desk-table-view" style={{ overflowX: "auto", background: T.surfaceGlass }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>
            <th className="th" style={{ width: 44, padding: "14px" }}>
              <input type="checkbox" className="cb liquid-trans" checked={saleBills.length>0&&saleBills.every(b=>selBills.has(b.id))} onChange={e=>{if(e.target.checked){setSelBills(new Set(saleBills.map(b=>b.id)));}else{setSelBills(new Set());}}} />
            </th>
            {["Bill No", "Date", "Customer", "Items", "Subtotal", "Disc", "GST", "Total", ""].map((h, i) => (
              <th key={i} className="th" style={{ textAlign: ["Subtotal", "Disc", "GST", "Total"].includes(h) ? "right" : "left", padding: "14px 16px" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {saleBills.slice((pg-1)*ps, pg*ps).map(b => {
              const v = vendors.find(x => x.id === b.vendorId);
              return <React.Fragment key={b.id}>
                <tr className={`trow liquid-trans ${selBills.has(b.id)?" row-sel":""}`} style={{ background: selBills.has(b.id) ? T.accentBg : "transparent" }}>
                  <td className="td" style={{ padding: "14px" }} onClick={e=>e.stopPropagation()}><input type="checkbox" className="cb liquid-trans" checked={selBills.has(b.id)} onChange={()=>tgBill(b.id)}/></td>
                  <td className="td" style={{ fontWeight: 800, color: T.accent, letterSpacing: "0.02em" }}>{b.billNo}</td>
                  <td className="td m" style={{ fontWeight: 500 }}>{fmtDate(b.date)}</td>
                  <td className="td" style={{ fontWeight: 600 }}>{v?.name || "—"}</td>
                  <td className="td m" style={{ fontWeight: 500 }}>{(b.items||[]).length}×</td>
                  <td className="td r m" style={{ fontWeight: 600 }}>{fmtCur(b.subtotal)}</td>
                  <td className="td r" style={{ color: (b.discAmount||0)>0 ? T.red : T.textMuted, fontWeight: 600 }}>{(b.discAmount||0)>0 ? `–${fmtCur(b.discAmount)}` : "—"}</td>
                  <td className="td r" style={{ color: T.textSub, fontSize: 12, fontWeight: 600 }}>{calcBillGst(b)>0 ? fmtCur(calcBillGst(b)) : "—"}</td>
                  <td className="td r" style={{ fontWeight: 800, color: T.green, fontSize: 14 }}>{fmtCur(b.total)}
                    <div style={{marginTop:4, display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      {b.isProforma && <span className="badge" style={{ background: T.blueBg, color: T.blue, fontSize: 9 }}>PROFORMA</span>}
                      {!b.isProforma && <PaymentStatusBadge bill={b} getBillPaid={getBillPaid} />}
                    </div>
                  </td>
                  <td className="td">
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                      {b.isProforma && <ConversionMenu source={b} sourceType="proforma" ctx={ctx} />}
                      {!b.isProforma && <button className="btn-ghost liquid-trans" onClick={() => setPayBill(b)} style={{ padding: "6px 10px" }} title="Payments"><CreditCard size={14} /></button>}
                      <button className="btn-ghost liquid-trans" onClick={() => setExp(p => ({...p,[b.id]:!p[b.id]}))} style={{ padding: "6px 10px" }}><Eye size={14} /></button>
                      <button className="btn-ghost liquid-trans" onClick={() => setInvoiceBill(b)} style={{ padding: "6px 10px" }} title="View Invoice"><Printer size={14} /></button>
                      {isAdmin && <button className="btn-ghost liquid-trans" onClick={() => setEditBill(b)} style={{ padding: "6px 10px" }}><Edit2 size={14} /></button>}
                      {isAdmin && <button className="btn-danger liquid-trans" onClick={() => deleteBill(b)} style={{ padding: "6px 10px" }}><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
                {exp[b.id] && <tr className="spring-down" style={{ background: T.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)" }}>
                  <td colSpan={10} style={{ padding: "0", borderBottom: `1px solid ${T.borderSubtle}` }}>
                    <div style={{ padding: "20px 24px" }}>
                      <div style={{ overflowX: "auto", marginBottom: 16, background: T.surfaceStrong, borderRadius: T.radius, border: `1px solid ${T.borderSubtle}` }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead><tr style={{ background: T.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                            {["#","Description","HSN","Qty","Unit","MRP","Rate (ex-GST)","GST%","Line Total"].map((h,i) => (
                              <th key={i} style={{ padding:"10px 14px", textAlign:["Qty","MRP","Rate (ex-GST)","GST%","Line Total"].includes(h)?"right":"left", fontWeight:800, fontSize:11, color:T.textSub, letterSpacing:"0.05em", borderBottom:`1px solid ${T.borderSubtle}`, whiteSpace:"nowrap", textTransform: "uppercase" }}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {(b.items||[]).map((it, idx) => {
                              const rate = safeNum(it.gstRate);
                              const effPrice = safeNum(it.effectivePrice) || safeNum(it.price);
                              const qty = safeNum(it.qty);
                              const taxable = rate > 0 ? effPrice * 100 / (100 + rate) : effPrice;
                              const gst = qty * effPrice - qty * taxable;
                              return (
                                <tr key={idx} className="liquid-trans" style={{ borderBottom:`1px solid ${T.borderSubtle}` }}>
                                  <td style={{ padding:"10px 14px", color:T.textMuted, fontWeight: 600 }}>{idx+1}</td>
                                  <td style={{ padding:"10px 14px", fontWeight:700, color:T.text }}>{it.productName||"—"}{it.isDamaged&&<span style={{color:T.red,fontSize:11,marginLeft:8,fontWeight:800}}>DMG</span>}</td>
                                  <td style={{ padding:"10px 14px", color:T.textSub, fontFamily:"monospace", fontWeight: 500 }}>{it.hsn||"—"}</td>
                                  <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:700, color:T.text }}>{qty}</td>
                                  <td style={{ padding:"10px 14px", color:T.textMuted, fontWeight: 500 }}>{it.unit||"pcs"}</td>
                                  <td style={{ padding:"10px 14px", textAlign:"right", color:T.textSub, fontWeight: 600 }}>{fmtCur(it.mrp||it.effectivePrice||it.price||0)}</td>
                                  <td style={{ padding:"10px 14px", textAlign:"right", color:T.textSub, fontWeight: 600 }}>{fmtCur(taxable)}</td>
                                  <td style={{ padding:"10px 14px", textAlign:"right", color:T.amber, fontWeight: 700 }}>{rate > 0 ? rate+"%" : "—"}</td>
                                  <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:800, color:T.text, fontSize: 13 }}>{fmtCur(qty*effPrice)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div style={{ display:"flex", justifyContent:"flex-end" }}>
                        <div className="glass" style={{ borderRadius: T.radius, padding: "16px 20px", minWidth: 260 }}>
                          <table style={{ fontSize:13, borderCollapse:"collapse", width: "100%" }}>
                            <tbody>
                              <tr><td style={{ padding:"6px 0", color:T.textSub, fontWeight: 600 }}>Subtotal (MRP)</td><td style={{ padding:"6px 0", textAlign:"right", fontWeight:700, color:T.text }}>{fmtCur(b.subtotal)}</td></tr>
                              {(b.discAmount||0)>0 && <tr><td style={{ padding:"6px 0", color:T.red, fontWeight: 600 }}>Discount</td><td style={{ padding:"6px 0", textAlign:"right", color:T.red, fontWeight: 700 }}>–{fmtCur(b.discAmount)}</td></tr>}
                              {calcBillGst(b)>0 && <tr><td style={{ padding:"6px 0", color:T.amber, fontWeight: 600 }}>GST (incl.)</td><td style={{ padding:"6px 0", textAlign:"right", color:T.amber, fontWeight: 700 }}>{fmtCur(calcBillGst(b))}</td></tr>}
                              {b.paymentMode && <tr><td style={{ padding:"6px 0", color:T.textMuted, fontSize:12, fontWeight: 500 }}>Payment Mode</td><td style={{ padding:"6px 0", textAlign:"right", fontSize:12, color:T.textSub, fontWeight: 600 }}>{b.paymentMode}</td></tr>}
                              <tr style={{ borderTop:`2px solid ${T.borderSubtle}` }}><td style={{ padding:"12px 0 0", fontWeight:800, color:T.text, fontSize: 14 }}>Grand Total</td><td style={{ padding:"12px 0 0", textAlign:"right", fontWeight:800, fontSize:18, color:T.accent }}>{fmtCur(b.total)}</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {b.ewayBill && <div className="liquid-trans" style={{ marginTop:16, fontSize:12, color:T.blue, padding:"10px 14px", borderRadius: T.radius, background:T.blueBg, fontWeight: 600 }}> E-Way: {b.ewayBillNo} · {b.transportName} · {b.vehicleNo}</div>}
                      {b.notes && <div style={{ fontSize:12, color:T.textSub, marginTop:12, fontStyle:"italic", fontWeight: 500, background: T.isDark ? "#27272a" : "#F1F5F9", padding: "10px 14px", borderRadius: T.radius }}>Note: {b.notes}</div>}
                    </div>
                  </td>
                </tr>}
              </React.Fragment>;
            })}
          </tbody>
        </table>
        {saleBills.length === 0 && <div style={{ padding: "60px 0", textAlign: "center", color: T.textMuted, fontSize: 14, fontWeight: 600 }}>No sales bills found in this period</div>}
      </div>
      {/* End desk-table-view */}
      <Pager total={saleBills.length} page={pg} ps={ps} setPage={setPg} setPs={setPs} />
    </div>

    <Modal open={Boolean(editBill)} onClose={() => setEditBill(null)} title={`Edit: ${editBill?.billNo}`} width={800}
      footer={<><GBtn v="ghost" onClick={() => setEditBill(null)}>Cancel</GBtn><GBtn type="submit" form="sale-form" icon={<Edit2 size={14}/>}>Save Changes</GBtn></>}>
      {editBill && <BillForm type="sale" bills={bills} onSave={handleEditBill} products={products} vendors={vendors} getStock={getStock} existingBill={editBill} invoiceSettings={invoiceSettings} />}
    </Modal>

    {invoiceBill && <InvoiceModal bill={invoiceBill} invSettings={invoiceSettings||{}} vendors={vendors} products={products} onClose={() => setInvoiceBill(null)} />}

    <DeleteConfirmModal
      open={!!delBulkConfirm}
      onClose={()=>setDelBulkConfirm(false)}
      onConfirm={()=>{const ids=new Set(selBills);saveBills(bills.filter(x=>!ids.has(x.id)));saveTransactions(transactions.filter(t=>!ids.has(t.billId)));setSelBills(new Set());}}
      user={user}
      label={selBills.size + " bills"}
      extra="All transactions will also be deleted."
    />
    <DeleteConfirmModal
      open={!!delConfirm}
      onClose={()=>setDelConfirm(null)}
      onConfirm={()=>doDeleteBill(delConfirm)}
      user={user}
      label={`bill ${delConfirm?.billNo}`}
      extra="All transactions for this bill will also be deleted."
    />

    <PaymentModal open={!!payBill} onClose={() => setPayBill(null)} bill={payBill} ctx={ctx} />
  </div>;
}
