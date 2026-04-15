import React, { useState, useMemo, useEffect } from "react";
import { Plus, Search, X, Eye, Trash2, RotateCcw, Package, Truck, AlertTriangle, Edit2 } from "lucide-react";
import { useT } from "../theme";
import { KCard, GBtn, GIn, GS, GTa, Field, Modal, Pager, PeriodBar, SearchInput, DeleteConfirmModal } from "../components/UI";
import ProductSearch from "../components/ProductSearch";
import VendorSearch from "../components/VendorSearch";
import { uid, today, fmtCur, fmtDate, inRange, getPresetDate, normaliseState, safeNum } from "../utils";

const PRESETS = [
  { k: "30d", l: "30d" }, { k: "90d", l: "90d" }, { k: "6m", l: "6M" }, { k: "1y", l: "1Y" }
];

export default function Returns({ ctx }) {
  const T = useT();
  const { transactions, saveTransactions, products, vendors, getStock, user, addLog, addChangeReq, invoiceSettings } = ctx;
  const isAdmin = user.role === "admin";
  const isManager = user.role === "manager";

  const [modal, setModal] = useState(false);
  const [returnType, setReturnType] = useState("sales_return"); // "sales_return" | "purchase_return"
  const [preset, setPreset] = useState("30d");
  const [df, setDf] = useState(getPresetDate("30d"));
  const [dt, setDt] = useState(today());
  const [typeFilter, setTypeFilter] = useState("all"); // all | sales_return | purchase_return | damaged
  const [pg, setPg] = useState(1); const [ps, setPs] = useState(20);
  const [search, setSearch] = useState("");
  const [selRets, setSelRets] = useState(new Set());
  const tgRet = id => setSelRets(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const [exp, setExp] = useState({});
  const [delConfirmRet, setDelConfirmRet] = useState(null);
  const [delConfirmBulkRet, setDelConfirmBulkRet] = useState(null);
  const [editTxn, setEditTxn] = useState(null);
  
  useEffect(() => setPg(1), [df, dt, typeFilter, search, ps]);

  const [form, setForm] = useState({
    date: today(),
    vendorId: "",
    gstType: "cgst_sgst",
    notes: "",
    items: [{ id: uid(), productId: "", qty: 1, price: "", isDamaged: false }]
  });

  const resetForm = () => setForm({ date: today(), vendorId: "", gstType: "cgst_sgst", notes: "", items: [{ id: uid(), productId: "", qty: 1, price: "", isDamaged: false }] });

  useEffect(() => {
    const companyState = normaliseState(invoiceSettings?.state);
    if (!companyState || !form.vendorId) return;
    const vendor = (vendors||[]).find(v => v.id === form.vendorId);
    if (!vendor?.state) return;
    const isInterState = companyState !== normaliseState(vendor.state);
    setForm(f => ({ ...f, gstType: isInterState ? "igst" : "cgst_sgst" }));
  }, [form.vendorId, vendors, invoiceSettings?.state]);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { id: uid(), productId: "", qty: 1, price: "", isDamaged: false }] }));
  const remItem = id => setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));
  const upItem = (id, k, v) => setForm(f => ({
    ...f, items: f.items.map(i => {
      if (i.id !== id) return i;
      const u = { ...i, [k]: v };
      if (k === "productId") {
        const pr = products.find(p => p.id === v);
        if (pr) u.price = returnType === "sales_return" ? (pr.mrp || "") : (pr.purchasePrice || "");
      }
      return u;
    })
  }));

  const valid = form.items.filter(i => i.productId && Number(i.qty) > 0);
  const totalValue = valid.reduce((s, i) => s + Number(i.qty) * Number(i.price || 0), 0);

  const handleSave = () => {
    if (valid.length === 0) { alert("Add at least one product"); return; }
    if (!form.vendorId) { alert("Select a vendor or customer"); return; }

    const isSalesRet = returnType !== "purchase_return";
    const prefix = isSalesRet ? (invoiceSettings?.salesRetSeries || "SR-") : (invoiceSettings?.purRetSeries || "PR-");
    const startNum = Number(isSalesRet ? (invoiceSettings?.salesRetSeriesStart || 1) : (invoiceSettings?.purRetSeriesStart || 1));
    const existingCount = transactions.filter(t => isSalesRet ? t.type === "return" : t.type === "purchase_return").filter(t => t.billNo?.startsWith(prefix)).length;
    const returnBillNo = prefix + String(startNum + existingCount).padStart(4, "0");
    const batchId = uid(); 
    
    const newTxns = valid.map(item => {
      const pr = products.find(p => p.id === item.productId);
      const rate = Number(pr?.gstRate || 0);
      const price = Number(item.price || 0);
      return {
        id: uid(),
        returnId: batchId,
        billNo: returnBillNo,
        productId: item.productId,
        type: returnType === "purchase_return" ? "purchase_return" : "return",
        qty: Number(item.qty),
        price,
        effectivePrice: price,
        gstRate: rate,
        gstAmount: returnType === "sales_return" ? price * rate / (100 + rate) * Number(item.qty) : price * rate / 100 * Number(item.qty),
        vendorId: form.vendorId || null,
        date: form.date,
        notes: form.notes || (returnType === "purchase_return" ? "Purchase return to vendor" : "Sales return from customer"),
        userId: user.id, userName: user.name,
        billId: null,
        isDamaged: item.isDamaged,
        returnType,
        gstType: form.gstType || "cgst_sgst"
      };
    });

    if (editTxn) {
      const editGroupId = editTxn.returnId || editTxn.id;
      const oldIds = new Set(transactions.filter(t => (t.returnId && t.returnId === editGroupId) || t.id === editTxn.id).map(t => t.id));

      if (isManager) {
        addChangeReq({ entity: "return", action: "update", entityId: editTxn.id, entityName: editTxn.type, currentData: editTxn, proposedData: newTxns });
      } else {
        const remaining = transactions.filter(t => !oldIds.has(t.id));
        saveTransactions([...newTxns, ...remaining]);
        addLog("edited", "return", `${newTxns.length} item(s)`);
      }
    } else if (isManager) {
      addChangeReq({ entity: "return", action: "create", entityId: null, entityName: returnType === "purchase_return" ? "Purchase Return" : "Sales Return", currentData: null, proposedData: newTxns });
    } else {
      saveTransactions([...newTxns, ...transactions]);
      addLog("recorded", returnType === "purchase_return" ? "purchase return" : "sales return", `${valid.length} product(s)`);
    }
    setEditTxn(null);
    setModal(false);
    resetForm();
  };

  const allReturns = useMemo(() => transactions.filter(t =>
    ["return", "purchase_return", "damaged"].includes(t.type) &&
    inRange(t.date, df, dt) &&
    (typeFilter === "all" ? true :
      typeFilter === "damaged" ? t.isDamaged :
      typeFilter === "sales_return" ? t.type === "return" :
      typeFilter === "purchase_return" ? t.type === "purchase_return" : true)
  ).filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    const pn = products.find(p => p.id === t.productId)?.name || "";
    return pn.toLowerCase().includes(q) || (t.notes || "").toLowerCase().includes(q);
  }).sort((a, b) => new Date(b.date) - new Date(a.date)), [transactions, df, dt, typeFilter, search, products]);

  const salesRets = allReturns.filter(t => t.type === "return");
  const purRets = allReturns.filter(t => t.type === "purchase_return");
  const damaged = allReturns.filter(t => t.isDamaged);

  const salesRetValue = salesRets.reduce((s, t) => s + Number(t.qty) * Number(t.price || 0), 0);
  const purRetValue = purRets.reduce((s, t) => s + Number(t.qty) * Number(t.price || 0), 0);

  const damagedStockByProduct = useMemo(() => {
    const m = {};
    transactions.filter(t => t.isDamaged && t.type === "return").forEach(t => {
      if (!m[t.productId]) m[t.productId] = 0;
      m[t.productId] += Number(t.qty);
    });
    transactions.filter(t => t.isDamaged && t.type === "purchase_return").forEach(t => {
      if (!m[t.productId]) m[t.productId] = 0;
      m[t.productId] -= Number(t.qty);
    });
    return m;
  }, [transactions]);

  const damagedInvValue = Object.entries(damagedStockByProduct).reduce((s, [pid, qty]) => {
    const pp = Number(products.find(p => p.id === pid)?.purchasePrice || 0);
    return s + Math.max(0, qty) * pp;
  }, 0);
  const totalDamagedUnits = Object.values(damagedStockByProduct).reduce((s, q) => s + Math.max(0, q), 0);

  const groupedReturns = useMemo(() => {
    const m = {};
    allReturns.forEach(t => {
      const key = t.returnId || t.id;
      if (!m[key]) m[key] = [];
      m[key].push(t);
    });
    return Object.values(m).sort((a, b) =>
      new Date(b[0].date) - new Date(a[0].date) || b[0].id.localeCompare(a[0].id)
    );
  }, [allReturns]);

  return <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
    
    {isManager && <div className="spring-in" style={{ padding: "12px 16px", borderRadius: T.radius, background: T.amberBg, border: `1px solid ${T.amber}30`, fontSize: 13, color: T.amber, fontWeight: 700, letterSpacing: "0.02em" }}> Manager mode — new returns require admin approval</div>}

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
      <PeriodBar df={df} setDf={setDf} dt={dt} setDt={setDt} preset={preset} setPreset={setPreset} />
      <GBtn sz="md" onClick={() => { resetForm(); setModal(true); }} icon={<Plus size={16} />} style={{ fontSize: 14, fontWeight: 700, padding: "12px 24px", borderRadius: T.radiusFull, boxShadow: `0 4px 12px ${T.accent}40` }}>Record Return</GBtn>
    </div>

    <div className="kgrid" style={{ gap: 20 }}>
      <KCard label="Sales Returns" value={fmtCur(salesRetValue)} sub={`${salesRets.length} entries · ${salesRets.reduce((s,t)=>s+Number(t.qty),0)} units`} icon={RotateCcw} color={T.red} onClick={() => setTypeFilter(typeFilter === "sales_return" ? "all" : "sales_return")} active={typeFilter === "sales_return"} />
      <KCard label="Purchase Returns" value={fmtCur(purRetValue)} sub={`${purRets.length} entries · ${purRets.reduce((s,t)=>s+Number(t.qty),0)} units`} icon={Truck} color={T.blue} onClick={() => setTypeFilter(typeFilter === "purchase_return" ? "all" : "purchase_return")} active={typeFilter === "purchase_return"} />
      <KCard label="Damaged in Inventory" value={String(totalDamagedUnits)} sub={`Value: ${fmtCur(damagedInvValue)} (ex-GST)`} icon={AlertTriangle} color={T.amber} onClick={() => setTypeFilter(typeFilter === "damaged" ? "all" : "damaged")} active={typeFilter === "damaged"} noFmt />
    </div>

    {totalDamagedUnits > 0 && (
      <div className="glass fade-up" style={{ padding: 20, borderRadius: T.radius, borderLeft: `4px solid ${T.amber}` }}>
        <div style={{ fontFamily: T.displayFont, fontWeight: 800, fontSize: 15, color: T.amber, marginBottom: 12 }}>Damaged Stock Summary</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(damagedStockByProduct).filter(([, q]) => q > 0).map(([pid, qty]) => {
            const pr = products.find(p => p.id === pid);
            return pr ? (
              <div key={pid} className="liquid-trans" style={{ padding: "6px 14px", borderRadius: T.radiusFull, background: `${T.amber}15`, border: `1px solid ${T.amber}30`, fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: T.text }}>{pr.alias || pr.name}</span>
                <span style={{ color: T.amber, marginLeft: 8, fontWeight: 600 }}>{qty} units</span>
              </div>
            ) : null;
          })}
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 12, fontWeight: 500 }}>These items are physically in your inventory but marked as damaged. They are counted in total stock and inventory value at purchase price.</div>
      </div>
    )}

    <div className="glass fade-up" style={{ borderRadius: T.radius, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.borderSubtle}`, background: T.surfaceGlass }}>
        <div style={{ fontFamily: T.displayFont, fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 16 }}>Returns Log</div>
        <div className="filter-wrap" style={{ gap: 12 }}>
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product, notes…" style={{ flex: "1 1 200px" }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["all", "sales_return", "purchase_return", "damaged"].map(f => (
              <button key={f} className="liquid-trans" onClick={() => setTypeFilter(f)} style={{ padding: "8px 16px", borderRadius: T.radiusFull, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", background: typeFilter === f ? T.accent : T.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: typeFilter === f ? "#fff" : T.textSub, boxShadow: typeFilter === f ? `0 2px 8px ${T.accent}40` : "none" }}>
                {f === "all" ? "All" : f === "sales_return" ? "Sales Returns" : f === "purchase_return" ? "Purchase Returns" : "Damaged"}
              </button>
            ))}
          </div>
          {(search || typeFilter !== "all") && <GBtn v="ghost" sz="sm" onClick={() => { setSearch(""); setTypeFilter("all"); }} icon={<X size={14} />} style={{ borderRadius: T.radiusFull }}>Clear</GBtn>}
        </div>
        
        {selRets.size > 0 && (
          <div className="spring-down liquid-trans" style={{ marginTop: 16, padding: "12px 20px", borderRadius: T.radius, background: T.amberBg, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", border: `1px solid ${T.amber}30` }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.amber }}>{selRets.size} selected</span>
            <GBtn v="danger" sz="sm" onClick={() => {
              if (isManager) {
                if (!window.confirm(`Request admin to delete ${selRets.size} entries?`)) return;
                allReturns.filter(t => selRets.has(t.id)).forEach(t =>
                  addChangeReq({ entity: 'return', action: 'delete', entityId: t.id, entityName: t.type, currentData: t, proposedData: null })
                );
                setSelRets(new Set());
              } else {
                setDelConfirmBulkRet([...selRets]);
              }
            }} icon={<Trash2 size={14} />}>{isManager ? "Request Delete" : "Delete Selected"}</GBtn>
            <button className="liquid-trans" onClick={()=>setSelRets(new Set())} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:T.textMuted}}>Clear Selection</button>
          </div>
        )}
      </div>

      <div style={{ overflowX: "auto", background: T.surfaceGlass }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>
            <th className="th" style={{ width: 44, padding: "14px" }}>
              <input type="checkbox" className="cb liquid-trans"
                checked={groupedReturns.length > 0 && groupedReturns.every(g => g.every(t => selRets.has(t.id)))}
                onChange={e => {
                  if (e.target.checked) setSelRets(new Set(allReturns.map(t => t.id)));
                  else setSelRets(new Set());
                }}
              />
            </th>
            {["Date", "Bill No", "Type", "Items", "Total Qty", "Total Value", "Vendor", "Damaged", ""].map((h, i) => (
              <th key={i} className="th" style={{ textAlign: ["Total Qty","Total Value"].includes(h) ? "right" : "left", padding: "14px 16px", width: h === "" ? 80 : "auto" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {groupedReturns.slice((pg-1)*ps, pg*ps).map(group => {
              const gKey = group[0].returnId || `${group[0].date}__${group[0].vendorId||""}__${group[0].type}`;
              const first = group[0];
              const v = vendors.find(x => x.id === first.vendorId);
              const typeColor = first.type === "return" ? T.red : first.type === "purchase_return" ? T.blue : T.amber;
              const typeLabel = first.type === "return" ? "Sales Return" : first.type === "purchase_return" ? "Purchase Return" : "Damaged";
              const totalQty = group.reduce((s,t) => s + Number(t.qty), 0);
              const totalVal = group.reduce((s,t) => s + Number(t.qty)*Number(t.price||0), 0);
              const hasDamaged = group.some(t => t.isDamaged);
              const allSelected = group.every(t => selRets.has(t.id));
              const groupExp = exp[gKey];
              
              return (<React.Fragment key={gKey}>
                <tr className={`trow liquid-trans ${allSelected?" row-sel":""}`} style={{ background: allSelected ? `${typeColor}10` : "transparent" }}>
                  <td className="td" style={{ padding: "14px" }} onClick={e=>e.stopPropagation()}>
                    <input type="checkbox" className="cb liquid-trans" checked={allSelected}
                      onChange={() => {
                        const ns = new Set(selRets);
                        if (allSelected) group.forEach(t => ns.delete(t.id));
                        else group.forEach(t => ns.add(t.id));
                        setSelRets(ns);
                      }}/>
                  </td>
                  <td className="td m" style={{ fontWeight: 500 }}>{fmtDate(first.date)}</td>
                  <td className="td" style={{ fontWeight:800, color:T.accent, letterSpacing: "0.02em" }}>{first.billNo || "—"}</td>
                  <td className="td"><span className="badge liquid-trans" style={{ background:typeColor+"18", color:typeColor }}>{typeLabel}</span></td>
                  <td className="td">
                    {group.length === 1
                      ? <><div style={{ fontWeight:700, color:T.text, fontSize: 13 }}>{products.find(p=>p.id===first.productId)?.name||"—"}</div><div style={{ fontSize:11, color:T.textMuted, marginTop: 2 }}>{products.find(p=>p.id===first.productId)?.sku}</div></>
                      : <><div style={{ fontWeight:700, color:T.text, fontSize: 13 }}>{group.length} products</div><div style={{ fontSize:11, color:T.textMuted, marginTop: 2 }}>{group.map(t=>products.find(p=>p.id===t.productId)?.alias||products.find(p=>p.id===t.productId)?.name||"?").join(", ")}</div></>
                    }
                  </td>
                  <td className="td r" style={{ fontWeight:700, color:T.text }}>{totalQty}</td>
                  <td className="td r" style={{ fontWeight:800, color:typeColor, fontSize: 14 }}>{fmtCur(totalVal)}</td>
                  <td className="td m" style={{ fontWeight: 600 }}>{v?.name||"—"}</td>
                  <td className="td">{hasDamaged ? <span style={{ fontSize:11, fontWeight:800, color:T.amber }}>YES</span> : <span style={{ color:T.textMuted, fontSize:11 }}>—</span>}</td>
                  <td className="td">
                    <div style={{ display:"flex", gap:6, justifyContent: "flex-end" }}>
                      <button className="btn-ghost liquid-trans" onClick={() => setExp(p=>({...p,[gKey]:!p[gKey]}))} style={{ padding:"6px 10px" }} title="View"><Eye size={14}/></button>
                      {isAdmin && <button className="btn-ghost liquid-trans" onClick={() => { setEditTxn(first); setReturnType(first.type==="purchase_return"?"purchase_return":"sales_return"); setForm({ date:first.date, vendorId:first.vendorId||"", gstType:first.gstType||"cgst_sgst", notes:first.notes||"", items:group.map(t=>({ id:uid(), productId:t.productId, qty:t.qty, price:t.price||"", isDamaged:t.isDamaged||false })) }); setModal(true); }} style={{ padding:"6px 10px" }} title="Edit"><Edit2 size={14}/></button>}
                      <button className="btn-danger liquid-trans" onClick={e=>{e.stopPropagation(); setDelConfirmRet(group);}} style={{ padding:"6px 10px" }}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
                {groupExp && (
                  <tr className="spring-down" style={{ background: T.isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.015)" }}>
                    <td colSpan={10} style={{ padding:0, borderBottom:`1px solid ${T.borderSubtle}` }}>
                      <div style={{ padding:"20px 24px" }}>
                        <div style={{ overflowX:"auto", marginBottom:16, background: T.surfaceStrong, borderRadius: T.radius, border: `1px solid ${T.borderSubtle}` }}>
                          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                            <thead><tr style={{ background: T.isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)" }}>
                              {["#","Description","HSN","Qty","Unit","MRP","Price/Unit","GST%","Value","Damaged"].map((h,i)=>(
                                <th key={i} style={{ padding:"10px 14px", textAlign:["Qty","MRP","Price/Unit","GST%","Value"].includes(h)?"right":"left", fontWeight:800, fontSize:11, color:T.textSub, letterSpacing:"0.05em", borderBottom:`1px solid ${T.borderSubtle}`, whiteSpace:"nowrap", textTransform: "uppercase" }}>{h}</th>
                              ))}
                            </tr></thead>
                            <tbody>
                              {group.map((t,idx)=>{
                                const pr2 = products.find(p=>p.id===t.productId);
                                const mrp = pr2?.mrp || t.price || 0;
                                const val = Number(t.qty)*Number(t.price||0);
                                return (
                                  <tr key={t.id} className="liquid-trans" style={{ borderBottom:`1px solid ${T.borderSubtle}` }}>
                                    <td style={{ padding:"10px 14px", color:T.textMuted, fontWeight: 600 }}>{idx+1}</td>
                                    <td style={{ padding:"10px 14px", fontWeight:700, color:T.text }}>{pr2?.name||"—"}{t.isDamaged&&<span style={{color:T.amber,fontSize:11,marginLeft:8,fontWeight:800}}>DMG</span>}<div style={{fontSize:11,color:T.textMuted, marginTop:2}}>{pr2?.sku}</div></td>
                                    <td style={{ padding:"10px 14px", color:T.textSub, fontFamily:"monospace", fontWeight: 500 }}>{pr2?.hsn||"—"}</td>
                                    <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:700, color:T.text }}>{t.qty}</td>
                                    <td style={{ padding:"10px 14px", color:T.textMuted, fontWeight: 500 }}>{pr2?.unit||"pcs"}</td>
                                    <td style={{ padding:"10px 14px", textAlign:"right", color:T.textSub, fontWeight: 600 }}>{fmtCur(mrp)}</td>
                                    <td style={{ padding:"10px 14px", textAlign:"right", color:T.textSub, fontWeight: 600 }}>{fmtCur(t.price||0)}</td>
                                    <td style={{ padding:"10px 14px", textAlign:"right", color:T.amber, fontWeight: 700 }}>{safeNum(t.gstRate)>0?safeNum(t.gstRate)+"%":"—"}</td>
                                    <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:800, color:typeColor, fontSize: 13 }}>{fmtCur(val)}</td>
                                    <td style={{ padding:"10px 14px" }}>{t.isDamaged?<span style={{color:T.amber,fontWeight:800,fontSize:11}}>YES</span>:<span style={{color:T.textMuted,fontSize:11}}>—</span>}</td>
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
                                {first.notes && <tr><td style={{ padding:"6px 0", color:T.textMuted, fontSize:12, fontWeight: 600 }}>Notes</td><td style={{ padding:"6px 0", color:T.textSub, fontStyle:"italic", textAlign: "right" }}>{first.notes}</td></tr>}
                                <tr><td style={{ padding:"6px 0", color:T.textSub, fontWeight: 600 }}>Customer/Vendor</td><td style={{ padding:"6px 0", fontWeight:700, color:T.text, textAlign: "right" }}>{vendors.find(x=>x.id===first.vendorId)?.name||"—"}</td></tr>
                                <tr><td style={{ padding:"6px 0", color:T.textMuted, fontSize:12, fontWeight: 500 }}>Recorded by</td><td style={{ padding:"6px 0", fontSize:12, color:T.textSub, textAlign: "right", fontWeight: 600 }}>{first.userName||"—"}</td></tr>
                                <tr style={{ borderTop:`2px solid ${T.borderSubtle}` }}><td style={{ padding:"12px 0 0", fontWeight:800, color:T.text, fontSize: 14 }}>Total Value</td><td style={{ padding:"12px 0 0", textAlign:"right", fontWeight:800, fontSize:18, color:typeColor }}>{fmtCur(totalVal)}</td></tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>);
            })}
          </tbody>
        </table>
        {groupedReturns.length === 0 && <div style={{ padding: "60px 0", textAlign: "center", color: T.textMuted, fontSize: 14, fontWeight: 600 }}>No returns found in selected period</div>}
      </div>
      <Pager total={groupedReturns.length} page={pg} ps={ps} setPage={setPg} setPs={setPs} />
    </div>

    {/* New Return Modal */}
    <Modal open={modal} onClose={() => { setModal(false); resetForm(); setEditTxn(null); }} title={`${editTxn ? "Edit" : "Record"} Return${isManager ? " (Requires Approval)" : ""}`} width={800}
      footer={<><GBtn v="ghost" onClick={() => { setModal(false); resetForm(); setEditTxn(null); }}>Cancel</GBtn><GBtn onClick={handleSave} icon={<RotateCcw size={14} />}>Save Return</GBtn></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.textSub, marginBottom: 12, letterSpacing: "0.05em" }}>RETURN TYPE</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[{ k: "sales_return", l: "Sales Return", sub: "Customer returns product to you" },
              { k: "purchase_return", l: "Purchase Return", sub: "You return product to vendor" }].map(rt => (
              <button key={rt.k} className="liquid-trans" onClick={() => setReturnType(rt.k)} style={{
                flex: 1, minWidth: 200, padding: "16px 20px", borderRadius: T.radius, border: `2px solid ${returnType === rt.k ? T.accent : T.borderSubtle}`,
                cursor: "pointer", background: returnType === rt.k ? T.accentBg : T.surfaceGlass,
                textAlign: "left", boxShadow: returnType === rt.k ? `0 4px 12px ${T.accent}30` : "none"
              }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: returnType === rt.k ? T.accent : T.text }}>{rt.l}</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4, fontWeight: 500 }}>{rt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="spring-in" style={{ padding: "12px 16px", borderRadius: T.radius, background: returnType === "sales_return" ? T.redBg : T.blueBg, border: `1px solid ${returnType === "sales_return" ? T.red + "30" : T.blue + "30"}`, fontSize: 13, color: returnType === "sales_return" ? T.red : T.blue, fontWeight: 600 }}>
          {returnType === "sales_return"
            ? " Sales Return: Product added back to your inventory. If damaged, it stays in stock but is flagged as damaged."
            : "🚚 Purchase Return: Product removed from your inventory. Applicable for defective/wrong items sent back to vendor."}
        </div>

        <div className="fgrid">
          <Field label="Date" req><GIn type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
          <Field label={returnType === "sales_return" ? "Customer" : "Vendor"} req><VendorSearch value={form.vendorId} onChange={id => setForm(f => ({ ...f, vendorId: id }))} vendors={vendors||[]} placeholder="Search by name, GSTIN..." /></Field>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.textSub, marginBottom: 12, letterSpacing: "0.05em" }}>GST TYPE</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { k: "cgst_sgst", l: "CGST + SGST", sub: "Intra-state (within same state)" },
              { k: "igst",      l: "IGST",         sub: "Inter-state / Import / Export" }
            ].map(g => (
              <button key={g.k} className="liquid-trans" onClick={() => setForm(f => ({ ...f, gstType: g.k }))} style={{
                flex: 1, minWidth: 200, padding: "14px 16px", borderRadius: T.radius,
                border: `2px solid ${form.gstType === g.k ? T.accent : T.borderSubtle}`,
                cursor: "pointer", background: form.gstType === g.k ? T.accentBg : T.surfaceGlass,
                textAlign: "left", boxShadow: form.gstType === g.k ? `0 2px 8px ${T.accent}30` : "none"
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: form.gstType === g.k ? T.accent : T.text }}>{g.l}</div>
                <div style={{ fontSize:12, color: T.textMuted, marginTop: 4, fontWeight: 500 }}>{g.sub}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass" style={{ borderRadius: T.radius, overflow: "hidden", padding: 0 }}>
          <div style={{ padding: "16px 20px", background: T.surfaceStrong, borderBottom: `1px solid ${T.borderSubtle}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.textSub, letterSpacing: "0.05em" }}>PRODUCTS RETURNED</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <div className="hide-mob" style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 80px 32px", gap: 12, padding: "12px 20px", background: T.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", borderBottom: `1px solid ${T.borderSubtle}` }}>
              {["Product", "Qty", `${returnType === "sales_return" ? "Sale" : "Purchase"} Price`, "Damaged?", ""].map((h, i) => (
                <div key={i} style={{ fontSize:11, fontWeight: 800, color: T.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>
            {form.items.map((item, i) => {
              const pr = products.find(p => p.id === item.productId);
              const stk = item.productId ? getStock(item.productId) : null;
              return (
                <div key={item.id} className="liquid-trans" style={{ borderBottom: `1px solid ${T.borderSubtle}`, padding: "16px 20px", background: T.surfaceGlass }}>
                  <div className="hide-mob" style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 80px 32px", gap: 12, alignItems: "start" }}>
                    <div>
                      <ProductSearch value={item.productId} onChange={v => upItem(item.id, "productId", v)} products={products} getStock={getStock} placeholder={`Search Product ${i + 1}…`} />
                      {stk !== null && <div className="spring-in" style={{ fontSize:11, marginTop:6, color:T.textMuted, fontWeight: 600 }}>Stock: {stk}</div>}
                    </div>
                    <div><GIn type="number" min="1" value={item.qty} onChange={e => upItem(item.id, "qty", e.target.value)} /></div>
                    <div>
                      <GIn type="number" min="0" step="0.01" value={item.price} onChange={e => upItem(item.id, "price", e.target.value)} placeholder="0.00" />
                      {item.price && pr?.gstRate > 0 && (() => {
                        const rate = Number(pr.gstRate);
                        const price = Number(item.price);
                        if (price <= 0) return null;
                        if (returnType === "sales_return") {
                          const totalGst = price * rate / (100 + rate);
                          const net = price - totalGst;
                          return (
                            <div className="spring-in" style={{ fontSize:11, color: T.textMuted, marginTop: 6, fontWeight: 500 }}>
                              {form.gstType === "igst"
                                ? `Net: ${fmtCur(net)} · IGST: ${fmtCur(totalGst)}`
                                : `Net: ${fmtCur(net)} · GST: ${fmtCur(totalGst)}`}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 40 }}>
                      <input type="checkbox" checked={item.isDamaged} onChange={e => upItem(item.id, "isDamaged", e.target.checked)} style={{ width: 18, height: 18, accentColor: T.amber, cursor: "pointer" }} />
                    </div>
                    <button type="button" onClick={() => remItem(item.id)} className="btn-danger liquid-trans" style={{ width: 32, height: 40, padding: 0, opacity: form.items.length <= 1 ? .3 : 1 }} disabled={form.items.length <= 1}>
                      <X size={14} />
                    </button>
                  </div>

                  <div className="bill-item-sub" style={{ display: "none" }}>
                    <div style={{ marginBottom: 12 }}>
                      <ProductSearch value={item.productId} onChange={v => upItem(item.id, "productId", v)} products={products} getStock={getStock} placeholder={`Search Product ${i + 1}…`} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 4 }}>QTY</div>
                        <GIn type="number" min="1" value={item.qty} onChange={e => upItem(item.id, "qty", e.target.value)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 4 }}>{returnType === "sales_return" ? "SALE PRICE" : "PURCHASE PRICE"}</div>
                        <GIn type="number" min="0" step="0.01" value={item.price} onChange={e => upItem(item.id, "price", e.target.value)} placeholder="0.00" />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 4 }}>DAMAGED</div>
                        <div style={{ display: "flex", alignItems: "center", height: 40 }}>
                           <input type="checkbox" checked={item.isDamaged} onChange={e => upItem(item.id, "isDamaged", e.target.checked)} style={{ width: 18, height: 18, accentColor: T.amber }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                      <button type="button" onClick={() => remItem(item.id)} className="btn-danger liquid-trans" style={{ padding: "6px 12px", fontSize: 11, opacity: form.items.length <= 1 ? .3 : 1 }} disabled={form.items.length <= 1}>
                        Remove Item
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ padding: "16px 20px", background: T.surfaceStrong }}>
              <GBtn v="ghost" sz="sm" onClick={addItem} icon={<Plus size={14} />}>Add Another Product</GBtn>
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: 24, borderRadius: T.radius, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Notes / Reason for Return"><GTa value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Customer complaints, defect details, reference no…" /></Field>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", borderTop: `1px solid ${T.borderSubtle}`, paddingTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.textSub, minWidth: 200 }}>
              <span style={{ fontWeight: 600 }}>Total Items</span>
              <span style={{ fontWeight: 700 }}>{valid.length} product{valid.length !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.textSub, minWidth: 200 }}>
              <span style={{ fontWeight: 600 }}>Total Quantity</span>
              <span style={{ fontWeight: 700 }}>{valid.reduce((s, i) => s + Number(i.qty), 0)} units</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: T.text, minWidth: 200, marginTop: 4 }}>
              <span>Total {returnType === "purchase_return" ? "Refund" : "Value"}</span>
              <span style={{ color: T.accent }}>{fmtCur(totalValue)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>

    <DeleteConfirmModal
      open={!!delConfirmRet}
      onClose={() => setDelConfirmRet(null)}
      onConfirm={() => {
        const ids = Array.isArray(delConfirmRet) ? delConfirmRet.map(g=>g.id) : [delConfirmRet.id];
        saveTransactions(transactions.filter(t => !ids.includes(t.id)));
      }}
      user={user}
      label={Array.isArray(delConfirmRet) ? `${delConfirmRet.length} return entries` : "this return entry"}
    />
    <DeleteConfirmModal
      open={!!delConfirmBulkRet}
      onClose={() => setDelConfirmBulkRet(null)}
      onConfirm={() => { const s = new Set(delConfirmBulkRet||[]); saveTransactions(transactions.filter(t=>!s.has(t.id))); setSelRets(new Set()); }}
      user={user}
      label={`${(delConfirmBulkRet||[]).length} return entries`}
    />
  </div>;
}
