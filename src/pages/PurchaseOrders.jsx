import React, { useState, useMemo, useEffect } from "react";
import { Plus, X, Trash2, Edit2, FileText, Package } from "lucide-react";
import { useT } from "../theme";
import { KCard, GBtn, GIn, GTa, GS, Field, Modal, Pager, PeriodBar, SearchInput, DeleteConfirmModal } from "../components/UI";
import ProductSearch from "../components/ProductSearch";
import VendorSearch from "../components/VendorSearch";
import ConversionMenu from "../components/ConversionMenu";
import { uid, today, fmtCur, fmtDate, inRange, getPresetDate } from "../utils";

const STATUSES = ["Draft", "Sent", "Confirmed", "Received", "Cancelled"];
const STATUS_COLORS = { "Draft": "amber", "Sent": "blue", "Confirmed": "accent", "Received": "green", "Cancelled": "red" };

export default function PurchaseOrders({ ctx }) {
  const T = useT();
  const { purchaseOrders = [], savePurchaseOrders, products, vendors, user, addLog, invoiceSettings } = ctx;
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [df, setDf] = useState(getPresetDate("30d"));
  const [dt, setDt] = useState(today());
  const [preset, setPreset] = useState("30d");
  const [statusF, setStatusF] = useState("");
  const [pg, setPg] = useState(1);
  const [ps, setPs] = useState(20);
  const [delConfirm, setDelConfirm] = useState(null);
  useEffect(() => setPg(1), [df, dt, search, statusF, ps]);

  const blank = { date: today(), vendorId: "", status: "Draft", expectedDate: "", notes: "", items: [{ id: uid(), productId: "", qty: 1, price: "" }] };
  const [form, setForm] = useState(blank);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const upItem = (id, k, v) => setForm(p => ({ ...p, items: p.items.map(i => {
    if (i.id !== id) return i;
    const u = { ...i, [k]: v };
    if (k === "productId") { const pr = products.find(x => x.id === v); if (pr) u.price = pr.purchasePrice || ""; }
    return u;
  }) }));
  const addItem = () => f("items", [...form.items, { id: uid(), productId: "", qty: 1, price: "" }]);
  const remItem = id => f("items", form.items.filter(i => i.id !== id));

  const valid = form.items.filter(i => i.productId && Number(i.qty) > 0);
  const total = valid.reduce((s, i) => s + Number(i.qty) * Number(i.price || 0), 0);

  const openNew = () => { setEdit(null); setForm(blank); setModal(true); };
  const openEdit = o => { setEdit(o); setForm({ ...o, items: o.items?.length ? o.items : blank.items }); setModal(true); };

  const save = () => {
    if (!form.vendorId) { alert("Select a vendor"); return; }
    if (valid.length === 0) { alert("Add at least one product"); return; }
    if (edit) {
      savePurchaseOrders(purchaseOrders.map(o => o.id === edit.id ? { ...edit, ...form, items: valid, total, updatedTs: new Date().toISOString() } : o));
      addLog("edited", "purchase order", edit.orderNo);
    } else {
      const prefix = invoiceSettings?.poSeries || "PO-";
      const startNum = Number(invoiceSettings?.poSeriesStart || 1);
      const cnt = purchaseOrders.length;
      const orderNo = prefix + String(startNum + cnt).padStart(4, "0");
      const newOrder = { id: uid(), orderNo, ...form, items: valid, total, userId: user.id, userName: user.name, ts: new Date().toISOString() };
      savePurchaseOrders([newOrder, ...purchaseOrders]);
      addLog("created", "purchase order", orderNo, `${valid.length} items · ${fmtCur(total)}`);
    }
    setModal(false);
  };

  const filtered = useMemo(() => purchaseOrders.filter(o => 
    inRange(o.date, df, dt) && 
    (!statusF || o.status === statusF) && 
    (!search || (o.orderNo || "").toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => (b.date || "").localeCompare(a.date || "")), [purchaseOrders, df, dt, statusF, search]);

  const stats = {
    total: filtered.length,
    pending: filtered.filter(o => ["Draft", "Sent", "Confirmed"].includes(o.status)).length,
    received: filtered.filter(o => o.status === "Received").length,
    value: filtered.reduce((s, o) => s + Number(o.total || 0), 0),
  };

  return <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <PeriodBar df={df} setDf={setDf} dt={dt} setDt={setDt} preset={preset} setPreset={setPreset} />
      <GBtn onClick={openNew} icon={<Plus size={14} />}>New Purchase Order</GBtn>
    </div>

    <div className="kgrid">
      <KCard label="Total Orders" value={String(stats.total)} sub="In selected period" icon={FileText} color={T.accent} />
      <KCard label="Pending" value={String(stats.pending)} sub="Not yet received" icon={Package} color={T.amber} />
      <KCard label="Received" value={String(stats.received)} sub="Completed orders" icon={Package} color={T.green} />
      <KCard label="Total Value" value={fmtCur(stats.value)} sub="At order price" icon={FileText} color={T.blue} />
    </div>

    <div className="glass" style={{ borderRadius: T.radius, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order no…" style={{ flex: 1, minWidth: 200 }} />
        <GS value={statusF} onChange={e => setStatusF(e.target.value)} placeholder="All Statuses" style={{ width: 160 }}>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </GS>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Date","Order No","Vendor","Items","Total","Status","Actions"].map((h,i) => <th key={i} className="th" style={{ textAlign: ["Items","Total"].includes(h) ? "right" : "left" }}>{h}</th>)}</tr></thead>
          <tbody>{filtered.slice((pg-1)*ps, pg*ps).map(o => {
            const v = vendors.find(x => x.id === o.vendorId);
            const sc = STATUS_COLORS[o.status] || "accent";
            return <tr key={o.id} className="trow">
              <td className="td m" style={{ whiteSpace: "nowrap" }}>{fmtDate(o.date)}</td>
              <td className="td" style={{ fontWeight: 700, color: T.blue, whiteSpace: "nowrap" }}>{o.orderNo}</td>
              <td className="td" style={{ fontWeight: 600 }}>{v?.name || "—"}</td>
              <td className="td r m">{(o.items || []).length}</td>
              <td className="td r" style={{ fontWeight: 800 }}>{fmtCur(o.total)}</td>
              <td className="td"><span className="badge" style={{ background: T[sc + "Bg"], color: T[sc] }}>{o.status}</span></td>
              <td className="td">
                <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                  <ConversionMenu source={o} sourceType="purchase-order" ctx={ctx} />
                  <button className="btn-ghost" onClick={() => openEdit(o)} style={{ padding: 5 }}><Edit2 size={13} /></button>
                  <button className="btn-danger" onClick={() => setDelConfirm(o)} style={{ padding: 5 }}><Trash2 size={13} /></button>
                </div>
              </td>
            </tr>;
          })}</tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>No purchase orders found</div>}
      </div>
      <Pager total={filtered.length} page={pg} ps={ps} setPage={setPg} setPs={setPs} />
    </div>

    <Modal open={modal} onClose={() => setModal(false)} title={edit ? `Edit: ${edit.orderNo}` : "New Purchase Order"} width={760}
      footer={<><GBtn v="ghost" onClick={() => setModal(false)}>Cancel</GBtn><GBtn onClick={save}>{edit ? "Save Changes" : "Create Order"}</GBtn></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="fgrid">
          <Field label="Date" req><GIn type="date" value={form.date} onChange={e => f("date", e.target.value)} /></Field>
          <Field label="Vendor" req><VendorSearch value={form.vendorId} onChange={v => f("vendorId", v)} vendors={vendors} placeholder="Search vendor…" /></Field>
          <Field label="Status" req><GS value={form.status} onChange={e => f("status", e.target.value)}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</GS></Field>
          <Field label="Expected Delivery"><GIn type="date" value={form.expectedDate || ""} onChange={e => f("expectedDate", e.target.value)} /></Field>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textSub, marginTop: 4 }}>Order Items</div>
        {form.items.map((item, i) => (
          <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, borderRadius: T.radius, border: `1px solid ${T.borderSubtle}` }}>
            <ProductSearch value={item.productId} onChange={v => upItem(item.id, "productId", v)} products={products} getStock={() => 0} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "end" }}>
              <Field label="Qty"><GIn type="number" min="1" value={item.qty} onChange={e => upItem(item.id, "qty", e.target.value)} /></Field>
              <Field label="Cost"><GIn type="number" min="0" step="0.01" value={item.price} onChange={e => upItem(item.id, "price", e.target.value)} /></Field>
              <button onClick={() => remItem(item.id)} className="btn-danger" style={{ padding: "6px 8px", marginBottom: 6 }} disabled={form.items.length <= 1}><X size={12} /></button>
            </div>
          </div>
        ))}
        <GBtn v="ghost" sz="sm" onClick={addItem} icon={<Plus size={13} />}>Add Item</GBtn>
        <Field label="Notes"><GTa value={form.notes} onChange={e => f("notes", e.target.value)} rows={2} /></Field>
        <div style={{ textAlign: "right", fontSize: 16, fontWeight: 800, color: T.blue }}>Total: {fmtCur(total)}</div>
      </div>
    </Modal>

    <DeleteConfirmModal open={!!delConfirm} onClose={() => setDelConfirm(null)} 
      onConfirm={() => { savePurchaseOrders(purchaseOrders.filter(o => o.id !== delConfirm.id)); addLog("deleted", "purchase order", delConfirm.orderNo); }} 
      user={user} label={`order ${delConfirm?.orderNo}`} />
  </div>;
}
