import React, { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, ThumbsUp, ThumbsDown, CheckCircle, XCircle, Filter } from "lucide-react";
import { useT } from "../theme";
import { GBtn, GIn, Field } from "../components/UI";
import { uid, fmtCur, fmtTs } from "../utils";

export default function Approvals({ ctx }) {
  const T = useT();
  const { changeReqs, saveChangeReqs, saveBills, saveTransactions, saveProducts, saveCategories, saveVendors, products, categories, vendors, bills, transactions, addLog, user } = ctx;
  const [tab, setTab] = useState("pending");
  const [note, setNote] = useState("");
  const [declining, setDeclining] = useState(null);
  const [entityFilter, setEntityFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());

  const pending = changeReqs.filter(r => r.status === "pending");
  const hist = changeReqs.filter(r => r.status !== "pending").slice(0, 50);
  const sc = { pending: T.amber, approved: T.green, declined: T.red };

  const ENTITY_FILTERS = [
    { id: "all", label: "All" },
    { id: "sale", label: "Sales" },
    { id: "purchase", label: "Purchase" },
    { id: "return", label: "Returns" },
    { id: "product", label: "Products" },
    { id: "vendor", label: "Vendors" },
    { id: "category", label: "Categories" },
  ];

  const shown = useMemo(() => {
    const base = tab === "pending" ? pending : hist;
    if (entityFilter === "all") return base;
    return base.filter(r => r.entity === entityFilter);
  }, [tab, pending, hist, entityFilter]);

  const allSelected = shown.length > 0 && shown.every(r => selected.has(r.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(shown.map(r => r.id)));
  };
  const toggleSel = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const approve = req => {
    try {
      if (req.entity === "product") {
        if (req.action === "create") saveProducts([...products, { ...req.proposedData, id: req.proposedData.id || uid() }]);
        else if (req.action === "update") saveProducts(products.map(p => p.id === req.entityId ? req.proposedData : p));
        else if (req.action === "delete") saveProducts(products.filter(p => p.id !== req.entityId));
      } else if (req.entity === "category") {
        if (req.action === "create") saveCategories([...categories, { ...req.proposedData, id: req.proposedData.id || uid() }]);
        else if (req.action === "update") saveCategories(categories.map(c => c.id === req.entityId ? req.proposedData : c));
        else if (req.action === "delete") saveCategories(categories.filter(c => c.id !== req.entityId));
      } else if (req.entity === "vendor") {
        if (req.action === "create") saveVendors([...vendors, { ...req.proposedData, id: req.proposedData.id || uid() }]);
        else if (req.action === "update") saveVendors(vendors.map(v => v.id === req.entityId ? req.proposedData : v));
        else if (req.action === "delete") saveVendors(vendors.filter(v => v.id !== req.entityId));
      } else if ((req.entity === "sale" || req.entity === "purchase") && req.action === "create") {
        const bill = req.proposedData;
        const newT = bill.items.map(item => ({
          id: uid(), productId: item.productId,
          type: item.isDamaged ? "damaged" : req.entity,
          qty: item.qty,
          price: item.effectivePrice || item.price,
          effectivePrice: item.effectivePrice || item.price,
          gstRate: item.gstRate || 0, gstAmount: item.gstAmount || 0,
          vendorId: bill.vendorId || null,
          gstType: bill.gstType || "",
          date: bill.date, notes: `Bill: ${bill.billNo}`,
          userId: req.requestedBy, userName: req.requestedByName,
          billId: bill.id, isDamaged: item.isDamaged
        }));
        saveBills([bill, ...bills]);
        saveTransactions([...newT, ...transactions]);
      } else if ((req.entity === "sale" || req.entity === "purchase") && req.action === "update") {
        const bill = req.proposedData;
        const newT = bill.items.map(item => ({
          id: uid(), productId: item.productId,
          type: item.isDamaged ? "damaged" : req.entity,
          qty: item.qty,
          price: item.effectivePrice || item.price,
          effectivePrice: item.effectivePrice || item.price,
          gstRate: item.gstRate || 0, gstAmount: item.gstAmount || 0,
          vendorId: bill.vendorId || null,
          gstType: bill.gstType || "",
          date: bill.date, notes: `Bill: ${bill.billNo} (edited)`,
          userId: req.requestedBy, userName: req.requestedByName,
          billId: bill.id, isDamaged: item.isDamaged
        }));
        saveBills(bills.map(b => b.id === bill.id ? bill : b));
        saveTransactions([...newT, ...transactions.filter(t => t.billId !== bill.id)]);
      } else if ((req.entity === "sale" || req.entity === "purchase") && req.action === "delete") {
        saveBills(bills.filter(b => b.id !== req.entityId));
        saveTransactions(transactions.filter(t => t.billId !== req.entityId));
      } else if (req.entity === "return" && req.action === "create") {
        const newTxns = Array.isArray(req.proposedData)
          ? req.proposedData.map(t => ({ ...t, id: t.id || uid() }))
          : [{ ...req.proposedData, id: req.proposedData.id || uid() }];
        saveTransactions([...newTxns, ...transactions]);
      } else if (req.entity === "return" && req.action === "update") {
        saveTransactions(transactions.map(t => t.id === req.entityId ? req.proposedData : t));
      } else if (req.entity === "return" && req.action === "delete") {
        saveTransactions(transactions.filter(t => t.id !== req.entityId));
      }
      saveChangeReqs(changeReqs.map(r => r.id === req.id ? { ...r, status: "approved", reviewedBy: user.id, reviewedByName: user.name, reviewedAt: new Date().toISOString() } : r));
      addLog("approved", req.entity, req.entityName);
    } catch (e) { alert("Error: " + e.message); }
  };

  const decline = req => {
    saveChangeReqs(changeReqs.map(r => r.id === req.id ? { ...r, status: "declined", reviewedBy: user.id, reviewedByName: user.name, reviewedAt: new Date().toISOString(), reviewNote: note } : r));
    addLog("declined", req.entity, req.entityName);
    setDeclining(null);
    setNote("");
  };

  const bulkApprove = () => {
    if (!window.confirm(`Approve ${selected.size} requests?`)) return;
    const toApprove = shown.filter(r => selected.has(r.id) && r.status === "pending");
    toApprove.forEach(req => approve(req));
    setSelected(new Set());
  };
  const bulkDecline = () => {
    if (!window.confirm(`Decline ${selected.size} requests?`)) return;
    const toDecline = shown.filter(r => selected.has(r.id) && r.status === "pending");
    toDecline.forEach(req => {
      saveChangeReqs(changeReqs.map(r => r.id === req.id ? { ...r, status: "declined", reviewedBy: user.id, reviewedByName: user.name, reviewedAt: new Date().toISOString(), reviewNote: "Bulk declined" } : r));
      addLog("declined", req.entity, req.entityName);
    });
    setSelected(new Set());
  };

  return <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["pending", "history"].map(t => <button key={t} onClick={() => { setTab(t); setSelected(new Set()); setEntityFilter("all"); }} style={{ padding: "8px 20px", borderRadius: T.radiusFull, fontSize: 13, fontWeight: 700, border: `1px solid ${tab === t ? T.accent : T.borderSubtle}`, cursor: "pointer", background: tab === t ? T.accent : "transparent", color: tab === t ? "#fff" : T.textSub, transition: "all .2s ease" }}>{t === "pending" ? `Pending (${pending.length})` : `History (${hist.length})`}</button>)}
      </div>
      {tab === "history" && hist.length > 0 && (
        <button className="btn-danger" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => {
          if (window.confirm("Clear all approved/declined history? Pending requests are not affected.")) {
            saveChangeReqs(changeReqs.filter(r => r.status === "pending"));
          }
        }}> Clear History</button>
      )}
    </div>

    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "12px 16px", background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}` }}>
      <Filter size={16} color={T.textMuted} style={{ marginRight: 4 }} />
      {ENTITY_FILTERS.map(f => {
        const count = (tab === "pending" ? pending : hist).filter(r => f.id === "all" || r.entity === f.id).length;
        if (count === 0 && f.id !== "all") return null;
        return (
          <button key={f.id} onClick={() => { setEntityFilter(f.id); setSelected(new Set()); }}
            style={{ padding: "6px 14px", borderRadius: T.radiusFull, fontSize: 12, fontWeight: 600, border: `1px solid ${entityFilter === f.id ? T.accent : "transparent"}`, cursor: "pointer", background: entityFilter === f.id ? T.accent + "15" : T.isDark ? "#27272a" : "#F1F5F9", color: entityFilter === f.id ? T.accent : T.textSub, transition: "all .2s ease" }}>
            {f.label} {count > 0 ? `(${count})` : ""}
          </button>
        );
      })}
    </div>

    {tab === "pending" && shown.length > 0 && (
      <div className="glass" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderRadius: T.radius, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: T.text }}>
          <input type="checkbox" className="cb" checked={allSelected} onChange={toggleAll} />
          Select All ({shown.length})
        </label>
        {selected.size > 0 && <>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.accent, marginLeft: 8 }}>{selected.size} selected</span>
          <GBtn sz="sm" onClick={bulkApprove} icon={<ThumbsUp size={14} />}>Approve All</GBtn>
          <GBtn v="danger" sz="sm" onClick={bulkDecline} icon={<ThumbsDown size={14} />}>Decline All</GBtn>
          <button onClick={() => setSelected(new Set())} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: T.textMuted }}>Clear Selection</button>
        </>}
      </div>
    )}

    {shown.length === 0 && <div className="glass" style={{ padding: "80px 20px", textAlign: "center", borderRadius: T.radius }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${T.green}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <CheckCircle size={32} color={T.green} />
      </div>
      <div style={{ fontWeight: 700, color: T.text, fontSize: 18, marginBottom: 8 }}>All Caught Up</div>
      <div style={{ color: T.textMuted, fontSize: 13 }}>No {tab === "pending" ? "pending approvals" : "history yet"}{entityFilter !== "all" ? ` for ${entityFilter}` : " at the moment."}</div>
    </div>}

    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {shown.map(req => <div key={req.id} className="glass fade-up" style={{ padding: 24, borderRadius: T.radius, borderLeft: `4px solid ${sc[req.status]}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {req.status === "pending" && (
              <input type="checkbox" className="cb" checked={selected.has(req.id)} onChange={() => toggleSel(req.id)} onClick={e => e.stopPropagation()} />
            )}
            <div style={{ width: 42, height: 42, borderRadius: T.radius, background: `${sc[req.status]}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {req.action === "delete" ? <Trash2 size={20} color={sc[req.status]} /> : req.action === "update" ? <Edit2 size={20} color={sc[req.status]} /> : <Plus size={20} color={sc[req.status]} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: T.text, fontSize: 15, letterSpacing: "-0.01em" }}>
                <span style={{ textTransform: "capitalize" }}>{req.action}</span> {req.entity}: <span style={{ color: sc[req.status] }}>{req.entityName}</span>
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4, fontWeight: 500 }}>Requested by <strong style={{ color: T.textSub }}>{req.requestedByName}</strong> · {fmtTs(req.ts)}</div>
            </div>
          </div>
          <span className="badge" style={{ background: `${sc[req.status]}15`, color: sc[req.status], textTransform: "capitalize", padding: "6px 12px", fontSize: 12 }}>{req.status}</span>
        </div>

        {req.action === "delete" && (
          <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: T.radius, background: T.redBg, border: `1px solid ${T.red}30`, fontSize: 13, color: T.red, display: "flex", alignItems: "center", gap: 10 }}>
            <Trash2 size={16} />
            <span><strong>Delete Request</strong> — approving will permanently remove this {req.entity} record{req.entity === "sale" || req.entity === "purchase" ? " and all its transactions" : ""}.</span>
          </div>
        )}
        
        {req.action !== "delete" && req.proposedData?.items && (
          <div style={{ marginTop: 12, marginBottom: 16, padding: 16, background: T.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)", borderRadius: T.radius, border: `1px solid ${T.borderSubtle}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 10, letterSpacing: "0.05em" }}>BILL ITEMS REVIEW</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {req.proposedData.items.map((it, idx) => (
                <div key={idx} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", color: T.text, fontWeight: 500 }}>
                  <span>{it.productName} <span style={{ color: T.textMuted }}>× {it.qty}</span> {it.isDamaged ? <span style={{ color: T.red, fontWeight: 700, fontSize:11, marginLeft: 8 }}>DAMAGED / EXCLUDED</span> : ""}</span>
                  <span style={{ fontWeight: 600 }}>{fmtCur(it.price * it.qty)}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${T.borderSubtle}`, paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between", fontWeight: 700, color: T.accent, fontSize: 14 }}>
                <span>Total Amount</span><span>{fmtCur(req.proposedData.total)}</span>
              </div>
            </div>
          </div>
        )}

        {req.action === "update" && req.currentData && req.proposedData && (
          <div className="fgrid" style={{ marginBottom: 16, gap: 16 }}>
            <div style={{ padding: "14px 16px", borderRadius: T.radius, background: T.isDark ? "rgba(248,113,113,0.05)" : "rgba(254,226,226,0.5)", border: `1px solid ${T.red}20` }}>
              <div style={{ fontSize:11, fontWeight: 800, color: T.red, marginBottom: 10, letterSpacing: "0.05em" }}>CURRENT DATA</div>
              {Object.keys(req.proposedData).filter(k => req.currentData[k] !== req.proposedData[k] && !["id", "margin"].includes(k)).slice(0, 5).map(k => <div key={k} style={{ fontSize: 12, color: T.textSub, marginBottom: 4 }}><span style={{ color: T.textMuted, textTransform: "capitalize", display: "inline-block", width: 80 }}>{k}:</span> <span style={{ fontWeight: 500 }}>{String(req.currentData[k] || "—")}</span></div>)}
            </div>
            <div style={{ padding: "14px 16px", borderRadius: T.radius, background: T.isDark ? "rgba(74,222,128,0.05)" : "rgba(220,252,231,0.5)", border: `1px solid ${T.green}20` }}>
              <div style={{ fontSize:11, fontWeight: 800, color: T.green, marginBottom: 10, letterSpacing: "0.05em" }}>PROPOSED CHANGES</div>
              {Object.keys(req.proposedData).filter(k => req.currentData[k] !== req.proposedData[k] && !["id", "margin"].includes(k)).slice(0, 5).map(k => <div key={k} style={{ fontSize: 12, color: T.textSub, marginBottom: 4 }}><span style={{ color: T.textMuted, textTransform: "capitalize", display: "inline-block", width: 80 }}>{k}:</span> <strong style={{ color: T.text }}>{String(req.proposedData[k] || "—")}</strong></div>)}
            </div>
          </div>
        )}

        {req.status === "pending" && declining !== req.id && (
          <div style={{ display: "flex", gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderSubtle}` }}>
            <GBtn onClick={() => approve(req)} icon={<ThumbsUp size={14} />}>Approve Request</GBtn>
            <GBtn v="ghost" onClick={() => setDeclining(req.id)} icon={<ThumbsDown size={14} />} style={{ color: T.red }}>Decline</GBtn>
          </div>
        )}

        {declining === req.id && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderSubtle}`, display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Decline Reason (Optional)"><GIn value={note} onChange={e => setNote(e.target.value)} placeholder="Provide a reason for declining..." /></Field>
            <div style={{ display: "flex", gap: 10 }}>
              <GBtn v="danger" onClick={() => decline(req)} icon={<XCircle size={14} />}>Confirm Decline</GBtn>
              <GBtn v="ghost" onClick={() => { setDeclining(null); setNote(""); }}>Cancel</GBtn>
            </div>
          </div>
        )}

        {req.status !== "pending" && (
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 8 }}>
            Reviewed by <strong style={{ color: T.text }}>{req.reviewedByName}</strong> · {fmtTs(req.reviewedAt)}{req.reviewNote && <span> · <span style={{ fontStyle: "italic" }}>"{req.reviewNote}"</span></span>}
          </div>
        )}
      </div>)}
    </div>
  </div>;
}
