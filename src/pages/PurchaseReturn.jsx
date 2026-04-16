import React, { useState, useMemo, useEffect } from "react";
import { Plus, X, RotateCcw } from "lucide-react";
import { useT } from "../theme";
import { KCard, GBtn, GIn, GTa, Field, Modal, Pager, PeriodBar, SearchInput } from "../components/UI";
import ProductSearch from "../components/ProductSearch";
import VendorSearch from "../components/VendorSearch";
import { uid, today, fmtCur, fmtDate, inRange, getPresetDate } from "../utils";

export default function PurchaseReturn({ ctx }) {
  const T = useT();
  const { transactions, saveTransactions, products, vendors, getStock, user, addLog, invoiceSettings } = ctx;
  const [modal, setModal] = useState(false);
  const [preset, setPreset] = useState("30d");
  const [df, setDf] = useState(getPresetDate("30d"));
  const [dt, setDt] = useState(today());
  const [pg, setPg] = useState(1);
  const [ps, setPs] = useState(20);
  const [search, setSearch] = useState("");
  useEffect(() => setPg(1), [df, dt, search, ps]);

  const [form, setForm] = useState({ date: today(), vendorId: "", notes: "", items: [{ id: uid(), productId: "", qty: 1, price: "" }] });
  const resetForm = () => setForm({ date: today(), vendorId: "", notes: "", items: [{ id: uid(), productId: "", qty: 1, price: "" }] });
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { id: uid(), productId: "", qty: 1, price: "" }] }));
  const remItem = id => setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));
  const upItem = (id, k, v) => setForm(f => ({ ...f, items: f.items.map(i => {
    if (i.id !== id) return i;
    const u = { ...i, [k]: v };
    if (k === "productId") { const pr = products.find(p => p.id === v); if (pr) u.price = pr.purchasePrice || ""; }
    return u;
  }) }));

  const valid = form.items.filter(i => i.productId && Number(i.qty) > 0);
  const totalValue = valid.reduce((s, i) => s + Number(i.qty) * Number(i.price || 0), 0);

  const handleSave = () => {
    if (valid.length === 0) { alert("Add at least one product"); return; }
    if (!form.vendorId) { alert("Select a vendor"); return; }
    const prefix = invoiceSettings?.purRetSeries || "PR-";
    const startNum = Number(invoiceSettings?.purRetSeriesStart || 1);
    const cnt = transactions.filter(t => t.type === "purchase_return" && t.billNo?.startsWith(prefix)).length;
    const billNo = prefix + String(startNum + cnt).padStart(4, "0");
    const batchId = uid();
    const newTxns = valid.map(item => {
      const pr = products.find(p => p.id === item.productId);
      const rate = Number(pr?.gstRate || 0);
      const price = Number(item.price || 0);
      return { id: uid(), returnId: batchId, billNo, productId: item.productId, type: "purchase_return", qty: Number(item.qty), price, effectivePrice: price, gstRate: rate, gstAmount: price * rate / 100 * Number(item.qty), vendorId: form.vendorId, date: form.date, notes: form.notes || "Purchase return", userId: user.id, userName: user.name, billId: null, isDamaged: false, returnType: "purchase_return", gstType: "cgst_sgst" };
    });
    saveTransactions([...newTxns, ...transactions]);
    addLog("recorded", "purchase return", `${valid.length} product(s)`);
    setModal(false);
    resetForm();
  };

  const returns = useMemo(() => transactions.filter(t => t.type === "purchase_return" && inRange(t.date, df, dt) && (!search || (t.productName || "").toLowerCase().includes(search.toLowerCase()))).sort((a, b) => (b.date || "").localeCompare(a.date || "")), [transactions, df, dt, search]);

  return <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <PeriodBar df={df} setDf={setDf} dt={dt} setDt={setDt} preset={preset} setPreset={setPreset} />
      <GBtn onClick={() => setModal(true)} icon={<Plus size={14} />}>New Purchase Return</GBtn>
    </div>
    <div className="kgrid">
      <KCard label="Return Entries" value={String(returns.length)} sub="In selected period" icon={RotateCcw} color={T.amber} />
      <KCard label="Total Value" value={fmtCur(returns.reduce((s, t) => s + Number(t.qty || 0) * Number(t.effectivePrice || t.price || 0), 0))} sub="At purchase price" icon={RotateCcw} color={T.red} />
    </div>
    <div className="glass" style={{ borderRadius: T.radius, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.borderSubtle}` }}>
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ maxWidth: 300 }} />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Date","Bill No","Product","Qty","Cost","Value","Vendor","By"].map((h,i) => <th key={i} className="th" style={{ textAlign: ["Qty","Cost","Value"].includes(h) ? "right" : "left" }}>{h}</th>)}</tr></thead>
          <tbody>{returns.slice((pg-1)*ps, pg*ps).map(t => {
            const pr = products.find(p => p.id === t.productId);
            const v = vendors.find(x => x.id === t.vendorId);
            return <tr key={t.id} className="trow">
              <td className="td m">{fmtDate(t.date)}</td>
              <td className="td" style={{ fontWeight: 700, color: T.blue }}>{t.billNo || "—"}</td>
              <td className="td" style={{ fontWeight: 600 }}>{pr?.name || "—"}</td>
              <td className="td r" style={{ fontWeight: 700 }}>{t.qty}</td>
              <td className="td r m">{fmtCur(t.price)}</td>
              <td className="td r" style={{ fontWeight: 700, color: T.blue }}>{fmtCur(Number(t.qty) * Number(t.price || 0))}</td>
              <td className="td m">{v?.name || "—"}</td>
              <td className="td m">{t.userName}</td>
            </tr>;
          })}</tbody>
        </table>
        {returns.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>No purchase returns found</div>}
      </div>
      <Pager total={returns.length} page={pg} ps={ps} setPage={setPg} setPs={setPs} />
    </div>
    <Modal open={modal} onClose={() => setModal(false)} title="New Purchase Return" width={700}
      footer={<><GBtn v="ghost" onClick={() => setModal(false)}>Cancel</GBtn><GBtn onClick={handleSave}>Save Return</GBtn></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="fgrid">
          <Field label="Date" req><GIn type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Vendor" req><VendorSearch value={form.vendorId} onChange={v => setForm(f => ({ ...f, vendorId: v }))} vendors={vendors} placeholder="Select vendor…" /></Field>
        </div>
        {form.items.map((item, i) => (
          <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, borderRadius: T.radius, border: `1px solid ${T.borderSubtle}` }}>
            <ProductSearch value={item.productId} onChange={v => upItem(item.id, "productId", v)} products={products} getStock={getStock} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "end" }}>
              <Field label="Qty"><GIn type="number" min="1" value={item.qty} onChange={e => upItem(item.id, "qty", e.target.value)} /></Field>
              <Field label="Purchase Price"><GIn type="number" min="0" step="0.01" value={item.price} onChange={e => upItem(item.id, "price", e.target.value)} /></Field>
              <button onClick={() => remItem(item.id)} className="btn-danger" style={{ padding: "6px 8px", marginBottom: 6 }} disabled={form.items.length <= 1}><X size={12} /></button>
            </div>
          </div>
        ))}
        <GBtn v="ghost" sz="sm" onClick={addItem} icon={<Plus size={13} />}>Add Product</GBtn>
        <Field label="Notes"><GTa value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></Field>
        <div style={{ textAlign: "right", fontWeight: 800, fontSize: 16, color: T.blue }}>Total: {fmtCur(totalValue)}</div>
      </div>
    </Modal>
  </div>;
}
