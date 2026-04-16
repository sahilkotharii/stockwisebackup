import React, { useState, useMemo, useEffect } from "react";
import { Plus, X, Eye, Trash2, Edit2, ShoppingCart, Box, Package, CreditCard } from "lucide-react";
import { useT } from "../theme";
import { KCard, GBtn, DeleteConfirmModal, GS, GIn, GTa, Field, Modal, Pager, PeriodBar, SearchInput } from "../components/UI";
import BillForm from "../components/BillForm";
import PaymentModal, { PaymentStatusBadge, OutstandingBadge } from "../components/PaymentModal";
import { uid, fmtCur, fmtDate, inRange, today } from "../utils";

export default function Purchase({ ctx }) {
  const T = useT();
  const { bills, saveBills, transactions, saveTransactions, products, vendors, getStock, user, addLog, addChangeReq, invoiceSettings, getBillPaid, getBillOutstanding } = ctx;
  const isAdmin = user.role === "admin";
  const isManager = user.role === "manager";

  const [editBill, setEditBill] = useState(null);
  const [payBill, setPayBill] = useState(null);

  const [preset, setPreset] = useState("30d");
  const [df, setDf] = useState(new Date(Date.now()-30*864e5).toISOString().split("T")[0]);
  const [dt, setDt] = useState(today());
  const [vF, setVF] = useState("");
  const [pg, setPg] = useState(1); const [ps, setPs] = useState(20);
  const [search, setSearch] = useState("");
  const [exp, setExp] = useState({});
  const [delConfirm, setDelConfirm] = useState(null);
  const [delBulkConfirm, setDelBulkConfirm] = useState(false);
  const [selBills, setSelBills] = useState(new Set());
  const tgBill = id => setSelBills(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  useEffect(() => setPg(1), [df, dt, vF, search, ps]);

  const periodPurBills = useMemo(() => bills.filter(b =>
    b.type === "purchase" && inRange(b.date, df, dt) &&
    (vF ? b.vendorId === vF : true)
  ), [bills, df, dt, vF]);

  const totalPurchaseInclGst = periodPurBills.reduce((s, b) => s + Number(b.total || 0), 0);
  const totalPurchaseExclGst = periodPurBills.reduce((s, b) => s + Number(b.subtotal || 0), 0);
  const totalUnits = periodPurBills.reduce((s, b) => s + (b.items || []).reduce((si, i) => si + Number(i.qty || 0), 0), 0);

  const purBills = useMemo(() => periodPurBills.filter(b => {
    if (search) {
      const q = search.toLowerCase();
      return b.billNo.toLowerCase().includes(q) || (b.items || []).some(i => i.productName?.toLowerCase().includes(q));
    }
    return true;
  }).sort((a, b2) => new Date(b2.date) - new Date(a.date)), [periodPurBills, search]);

  const handleSaveBill = bill => {
    if (isManager) {
      addChangeReq({ entity: "purchase", action: "create", entityId: null, entityName: bill.billNo, currentData: null, proposedData: bill });
      setModal(false); return;
    }
    const newTxns = bill.items.map(item => ({
      id: uid(), productId: item.productId, type: item.isDamaged ? "damaged" : "purchase",
      qty: item.qty,
      price: item.price, 
      effectivePrice: item.price,
      gstRate: item.gstRate || 0,
      gstAmount: item.gstAmount || 0,
      vendorId: bill.vendorId, date: bill.date,
      notes: `Bill: ${bill.billNo}${bill.notes ? ` · ${bill.notes}` : ""}`,
      userId: user.id, userName: user.name, billId: bill.id, isDamaged: item.isDamaged,
      paymentMode: bill.paymentMode || ""
    }));
    const billWithUser = { ...bill, userId: user.id, userName: user.name };
    saveBills([billWithUser, ...bills]);
    saveTransactions([...newTxns, ...transactions]);
    addLog("created", "purchase bill", bill.billNo, `${bill.items.length} items · ${fmtCur(bill.total)}`);
    setModal(false);
  };

  const handleEditBill = updatedBill => {
    if (isManager) {
      addChangeReq({ entity: "purchase", action: "update", entityId: updatedBill.id, entityName: updatedBill.billNo, currentData: bills.find(b => b.id === updatedBill.id), proposedData: updatedBill });
      setEditBill(null); return;
    }
    const filteredTxns = transactions.filter(t => t.billId !== updatedBill.id);
    const newTxns = updatedBill.items.map(item => ({
      id: uid(), productId: item.productId, type: item.isDamaged ? "damaged" : "purchase",
      qty: item.qty, price: item.effectivePrice || item.price, effectivePrice: item.effectivePrice || item.price,
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
    addLog("edited", "purchase bill", updatedBill.billNo);
    setEditBill(null);
  };

  const deleteBill = b => {
    if (isManager) {
      if (!window.confirm(`Request admin to delete bill ${b.billNo}?`)) return;
      addChangeReq({ entity: "purchase", action: "delete", entityId: b.id, entityName: b.billNo, currentData: b, proposedData: null });
      return;
    }
    setDelConfirm(b);
  };
  const doDeleteBill = b => {
    saveBills(bills.filter(x => x.id !== b.id));
    saveTransactions(transactions.filter(t => t.billId !== b.id));
    addLog("deleted", "purchase bill", b.billNo);
  };

  return <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
      <PeriodBar df={df} setDf={setDf} dt={dt} setDt={setDt} preset={preset} setPreset={setPreset} />
      <GBtn sz="md" onClick={() => ctx.setPage("new-purchase-bill")} icon={<Plus size={16} />} style={{ fontSize: 14, fontWeight: 700, padding: "12px 24px", borderRadius: T.radiusFull, boxShadow: `0 4px 12px ${T.accent}40` }}>New Purchase Bill</GBtn>
    </div>

    <div className="kgrid" style={{ gap: 20 }}>
      <KCard label="Total Purchase" value={fmtCur(totalPurchaseInclGst)} sub="incl. GST · amount paid" icon={ShoppingCart} color={T.blue} />
      <KCard label="Purchase Cost" value={fmtCur(totalPurchaseExclGst)} sub="excl. GST · inventory cost basis" icon={Box} color={T.accent} />
      <KCard label="Units Purchased" value={String(totalUnits)} sub="total qty in period" icon={Package} color={T.cyan} noFmt />
    </div>

    <div className="glass fade-up" style={{ borderRadius: T.radius, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.borderSubtle}`, background: T.surfaceGlass }}>
        <div style={{ fontFamily: T.displayFont, fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 16, letterSpacing: "-0.01em" }}>Purchase Bills</div>
        <div className="filter-wrap" style={{ gap: 12 }}>
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bill, product…" style={{ flex: "1 1 200px" }} />
          <GS value={vF} onChange={e => setVF(e.target.value)} placeholder="All Vendors" style={{ flex: "0 1 200px" }}>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </GS>
          {(vF || search) && <GBtn v="ghost" sz="sm" onClick={() => { setVF(""); setSearch(""); }} icon={<X size={14} />} style={{ borderRadius: T.radiusFull }}>Clear</GBtn>}
        </div>
        
        {selBills.size > 0 && (
          <div className="spring-down liquid-trans" style={{ marginTop: 16, padding: "12px 20px", borderRadius: T.radius, background: T.blueBg, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", border: `1px solid ${T.blue}30` }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.blue }}>{selBills.size} selected</span>
            <GBtn v="danger" sz="sm" onClick={() => { if(isManager){if(window.confirm(`Request admin to delete ${selBills.size} bills?`)){purBills.filter(b=>selBills.has(b.id)).forEach(b=>addChangeReq({entity:'purchase',action:'delete',entityId:b.id,entityName:b.billNo,currentData:b,proposedData:null}));setSelBills(new Set());}}else if(window.confirm(`Delete ${selBills.size} bills?`)){const toDelIds=new Set(selBills);saveBills(bills.filter(x=>!toDelIds.has(x.id)));saveTransactions(transactions.filter(t=>!toDelIds.has(t.billId)));setSelBills(new Set());}}} icon={<Trash2 size={14} />}>{isManager?"Request Delete":"Delete Selected"}</GBtn>
            <button className="liquid-trans" onClick={()=>setSelBills(new Set())} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:T.textMuted}}>Clear Selection</button>
          </div>
        )}
      </div>

      {/* ── Mobile Card View ───────────────────────────────────────── */}
      <div className="mob-card-view">
        {purBills.slice((pg-1)*ps, pg*ps).map(b => {
          const v = vendors.find(x => x.id === b.vendorId);
          return (
            <div key={b.id} style={{ borderBottom: `1px solid ${T.borderSubtle}`, padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.blue, letterSpacing: "0.02em" }}>{b.billNo}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, fontWeight: 500 }}>{fmtDate(b.date)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.blue }}>{fmtCur(b.total)}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>{(b.items||[]).length} items</div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 6 }}>{v?.name || "—"}</div>
              {Number(b.totalGst||0) > 0 && <div style={{ fontSize: 11, color: T.amber, fontWeight: 600, marginTop: 4 }}>GST: {fmtCur(b.totalGst)}</div>}
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
                <PaymentStatusBadge bill={b} getBillPaid={getBillPaid} />
                <OutstandingBadge bill={b} getBillOutstanding={getBillOutstanding} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="btn-ghost liquid-trans" onClick={() => setPayBill(b)} style={{ padding: "6px 12px", fontSize: 11 }}><CreditCard size={12} style={{ marginRight: 4 }} />Pay</button>
                <button className="btn-ghost liquid-trans" onClick={() => setExp(p => ({...p,[b.id]:!p[b.id]}))} style={{ padding: "6px 12px", fontSize: 11 }}><Eye size={12} style={{ marginRight: 4 }} />Details</button>
                {isAdmin && <button className="btn-ghost liquid-trans" onClick={() => setEditBill(b)} style={{ padding: "6px 12px", fontSize: 11 }}><Edit2 size={12} /></button>}
              </div>
              {exp[b.id] && (
                <div className="spring-down" style={{ marginTop: 8, padding: 12, borderRadius: T.radius, background: T.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                  {(b.items||[]).map((it, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: idx < (b.items||[]).length - 1 ? `1px solid ${T.borderSubtle}` : "none", fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: T.text }}>{it.productName} × {it.qty}</span>
                      <span style={{ fontWeight: 700, color: T.textSub }}>{fmtCur(Number(it.qty||0) * Number(it.price||0))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {purBills.length === 0 && <div style={{ padding: "40px 0", textAlign: "center", color: T.textMuted, fontSize: 13, fontWeight: 600 }}>No purchase bills found</div>}
      </div>

      {/* ── Desktop Table View ─────────────────────────────────────── */}
      <div className="desk-table-view" style={{ overflowX: "auto", background: T.surfaceGlass }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>
            <th className="th" style={{ width: 44, padding: "14px" }}>
              <input type="checkbox" className="cb liquid-trans" checked={purBills.length>0&&purBills.every(b=>selBills.has(b.id))} onChange={e=>{if(e.target.checked){setSelBills(new Set(purBills.map(b=>b.id)));}else{setSelBills(new Set());}}} />
            </th>
            {["Bill No", "Date", "Vendor", "Items", "Ex-GST", "GST", "Total Paid", ""].map((h, i) => (
            <th key={i} className="th" style={{ textAlign: ["Ex-GST", "GST", "Total Paid"].includes(h) ? "right" : "left", padding: "14px 16px" }}>{h}</th>
          ))}</tr></thead>
          <tbody>
            {purBills.slice((pg - 1) * ps, pg * ps).map(b => {
              const v = vendors.find(x => x.id === b.vendorId);
              return <React.Fragment key={b.id}>
                <tr className={`trow liquid-trans ${selBills.has(b.id)?" row-sel":""}`} style={{ background: selBills.has(b.id) ? T.blueBg : "transparent" }}>
                  <td className="td" style={{ padding: "14px" }} onClick={e=>e.stopPropagation()}><input type="checkbox" className="cb liquid-trans" checked={selBills.has(b.id)} onChange={()=>tgBill(b.id)}/></td>
                  <td className="td" style={{ fontWeight: 800, color: T.blue, letterSpacing: "0.02em" }}>{b.billNo}</td>
                  <td className="td m" style={{ fontWeight: 500 }}>{fmtDate(b.date)}</td>
                  <td className="td" style={{ fontWeight: 600 }}>{v?.name || "—"}</td>
                  <td className="td m" style={{ fontWeight: 500 }}>{(b.items || []).length}×</td>
                  <td className="td r m" style={{ fontWeight: 600 }}>{fmtCur(b.subtotal)}</td>
                  <td className="td r" style={{ color: (b.totalGst || 0) > 0 ? T.amber : T.textMuted, fontWeight: 600 }}>{(b.totalGst || 0) > 0 ? `+${fmtCur(b.totalGst)}` : "—"}</td>
                  <td className="td r" style={{ fontWeight: 800, color: T.blue, fontSize: 14 }}>{fmtCur(b.total)}<div style={{marginTop:4}}><PaymentStatusBadge bill={b} getBillPaid={getBillPaid} /></div></td>
                  <td className="td">
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="btn-ghost liquid-trans" onClick={() => setPayBill(b)} style={{ padding: "6px 10px" }} title="Payments"><CreditCard size={14} /></button>
                      <button className="btn-ghost liquid-trans" onClick={() => setExp(p => ({ ...p, [b.id]: !p[b.id] }))} style={{ padding: "6px 10px" }}><Eye size={14} /></button>
                      {isAdmin && <button className="btn-ghost liquid-trans" onClick={() => setEditBill(b)} style={{ padding: "6px 10px" }}><Edit2 size={14} /></button>}
                      <button className="btn-danger liquid-trans" onClick={() => deleteBill(b)} style={{ padding: "6px 10px" }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
                {exp[b.id] && <tr className="spring-down" style={{ background: T.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)" }}>
                  <td colSpan={9} style={{ padding: "0", borderBottom: `1px solid ${T.borderSubtle}` }}>
                    <div style={{ padding: "20px 24px" }}>
                      <div style={{ overflowX: "auto", marginBottom: 16, background: T.surfaceStrong, borderRadius: T.radius, border: `1px solid ${T.borderSubtle}` }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead><tr style={{ background: T.isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)" }}>
                            {["#","Description","HSN","Qty","Unit","MRP","Cost (ex-GST)","GST%","GST Amt","Line Total"].map((h,i) => (
                              <th key={i} style={{ padding:"10px 14px", textAlign:["Qty","MRP","Cost (ex-GST)","GST%","GST Amt","Line Total"].includes(h)?"right":"left", fontWeight:800, fontSize:11, color:T.textSub, letterSpacing:"0.05em", borderBottom:`1px solid ${T.borderSubtle}`, whiteSpace:"nowrap", textTransform: "uppercase" }}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {(b.items||[]).map((it, idx) => {
                              const rate = Number(it.gstRate||0);
                              const price = Number(it.price||0);
                              const qty = Number(it.qty||0);
                              const gstAmt = it.gstAmount || (rate ? qty * price * rate / 100 : 0);
                              const lineTotal = qty * price + gstAmt;
                              return (
                                <tr key={idx} className="liquid-trans" style={{ borderBottom:`1px solid ${T.borderSubtle}` }}>
                                  <td style={{ padding:"10px 14px", color:T.textMuted, fontWeight: 600 }}>{idx+1}</td>
                                  <td style={{ padding:"10px 14px", fontWeight:700, color:T.text }}>{it.productName||"—"}</td>
                                  <td style={{ padding:"10px 14px", color:T.textSub, fontFamily:"monospace", fontWeight: 500 }}>{it.hsn||"—"}</td>
                                  <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:700, color:T.text }}>{qty}</td>
                                  <td style={{ padding:"10px 14px", color:T.textMuted, fontWeight: 500 }}>{it.unit||"pcs"}</td>
                                  <td style={{ padding:"10px 14px", textAlign:"right", color:T.textSub, fontWeight: 600 }}>{fmtCur(it.mrp||0)}</td>
                                  <td style={{ padding:"10px 14px", textAlign:"right", color:T.textSub, fontWeight: 600 }}>{fmtCur(price)}</td>
                                  <td style={{ padding:"10px 14px", textAlign:"right", color:T.amber, fontWeight: 700 }}>{rate > 0 ? rate+"%" : "—"}</td>
                                  <td style={{ padding:"10px 14px", textAlign:"right", color:T.amber, fontWeight: 700 }}>{gstAmt > 0 ? fmtCur(gstAmt) : "—"}</td>
                                  <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:800, color:T.text, fontSize: 13 }}>{fmtCur(lineTotal)}</td>
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
                              <tr><td style={{ padding:"6px 0", color:T.textSub, fontWeight: 600 }}>Subtotal (ex-GST)</td><td style={{ padding:"6px 0", textAlign:"right", fontWeight:700, color:T.text }}>{fmtCur(b.subtotal)}</td></tr>
                              {(b.totalGst||0) > 0 && <tr><td style={{ padding:"6px 0", color:T.amber, fontWeight: 600 }}>GST</td><td style={{ padding:"6px 0", textAlign:"right", color:T.amber, fontWeight: 700 }}>+{fmtCur(b.totalGst)}</td></tr>}
                              {b.paymentMode && <tr><td style={{ padding:"6px 0", color:T.textMuted, fontSize:12, fontWeight: 500 }}>Payment Mode</td><td style={{ padding:"6px 0", textAlign:"right", fontSize:12, color:T.textSub, fontWeight: 600 }}>{b.paymentMode}</td></tr>}
                              <tr style={{ borderTop:`2px solid ${T.borderSubtle}` }}><td style={{ padding:"12px 0 0", fontWeight:800, color:T.text, fontSize: 14 }}>Total Paid</td><td style={{ padding:"12px 0 0", textAlign:"right", fontWeight:800, fontSize:18, color:T.blue }}>{fmtCur(b.total)}</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {b.notes && <div style={{ fontSize:12, color:T.textSub, marginTop:16, fontStyle:"italic", fontWeight: 500, background: T.isDark ? "#27272a" : "#F1F5F9", padding: "10px 14px", borderRadius: T.radius }}>Note: {b.notes}</div>}
                    </div>
                  </td>
                </tr>}
              </React.Fragment>;
            })}
          </tbody>
        </table>
        {purBills.length === 0 && <div style={{ padding: "60px 0", textAlign: "center", color: T.textMuted, fontSize: 14, fontWeight: 600 }}>No purchase bills found in this period</div>}
      </div>
      {/* end desk-table-view */}
      <Pager total={purBills.length} page={pg} ps={ps} setPage={setPg} setPs={setPs} />
    </div>

    <Modal open={Boolean(editBill)} onClose={() => setEditBill(null)} title={`Edit: ${editBill?.billNo}`} width={800}
      footer={<><GBtn v="ghost" onClick={() => setEditBill(null)}>Cancel</GBtn><GBtn type="submit" form="purchase-form" icon={<Edit2 size={14} />}>Save Changes</GBtn></>}>
      {editBill && <BillForm type="purchase" bills={bills} onSave={handleEditBill} products={products} vendors={vendors} getStock={getStock} existingBill={editBill} invoiceSettings={invoiceSettings} />}
    </Modal>

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
