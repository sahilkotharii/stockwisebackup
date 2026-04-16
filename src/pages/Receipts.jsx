import React, { useState, useMemo, useEffect } from "react";
import { Plus, X, Trash2, ArrowDownRight, IndianRupee, CheckSquare } from "lucide-react";
import { useT } from "../theme";
import { KCard, GBtn, GIn, GTa, GS, Field, Modal, Pager, PeriodBar, SearchInput, DeleteConfirmModal, Pill } from "../components/UI";
import VendorSearch from "../components/VendorSearch";
import { uid, today, fmtCur, fmtDate, inRange, getPresetDate } from "../utils";

const MODES = ["Cash", "NEFT / RTGS", "UPI", "Cheque", "Card", "Wallet", "Other"];

export default function Receipts({ ctx }) {
  const T = useT();
  const { payments, savePayments, bills, vendors, getBillOutstanding, user, addLog } = ctx;

  // Receipts = payments where type === "received" (customer paid us)
  const receipts = useMemo(() => (payments || []).filter(p => p.type === "received"), [payments]);

  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [df, setDf] = useState(getPresetDate("30d"));
  const [dt, setDt] = useState(today());
  const [preset, setPreset] = useState("30d");
  const [pg, setPg] = useState(1);
  const [ps, setPs] = useState(20);
  const [delConfirm, setDelConfirm] = useState(null);
  useEffect(() => setPg(1), [df, dt, search, ps]);

  // Form for recording a new receipt with bill allocations
  const blank = { date: today(), vendorId: "", amount: "", paymentMode: "", reference: "", notes: "", allocations: {} };
  const [form, setForm] = useState(blank);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Outstanding sale bills for selected customer
  const customerBills = useMemo(() => {
    if (!form.vendorId) return [];
    return bills.filter(b => b.type === "sale" && b.vendorId === form.vendorId && !b.isProforma)
      .map(b => ({ ...b, outstanding: getBillOutstanding(b) }))
      .filter(b => b.outstanding > 0)
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [form.vendorId, bills, getBillOutstanding]);

  const allocatedSum = useMemo(() =>
    Object.values(form.allocations).reduce((s, v) => s + Number(v || 0), 0),
    [form.allocations]
  );
  const remainingToAllocate = Number(form.amount || 0) - allocatedSum;

  const setAllocation = (billId, value) => {
    setForm(p => ({ ...p, allocations: { ...p.allocations, [billId]: value } }));
  };

  // Auto-allocate (FIFO oldest bills first)
  const autoAllocate = () => {
    let remaining = Number(form.amount || 0);
    const allocs = {};
    for (const b of customerBills) {
      if (remaining <= 0) break;
      const a = Math.min(remaining, b.outstanding);
      allocs[b.id] = a;
      remaining -= a;
    }
    setForm(p => ({ ...p, allocations: allocs }));
  };

  const openNew = () => { setForm(blank); setModal(true); };

  const save = () => {
    const amt = Number(form.amount);
    if (!form.vendorId) { alert("Select a customer"); return; }
    if (!amt || amt <= 0) { alert("Enter a valid amount"); return; }
    if (!form.paymentMode) { alert("Select payment mode"); return; }

    const allocations = Object.entries(form.allocations).filter(([, v]) => Number(v) > 0);
    const v = vendors.find(x => x.id === form.vendorId);

    if (allocations.length === 0) {
      // Unallocated receipt — record as "On Account"
      const payment = {
        id: uid(), date: form.date, vendorId: form.vendorId, vendorName: v?.name || "",
        billId: "", billNo: "On Account", billType: "sale", type: "received",
        amount: amt, paymentMode: form.paymentMode, reference: form.reference, notes: form.notes,
        userId: user.id, userName: user.name, ts: new Date().toISOString(),
      };
      savePayments([payment, ...(payments || [])]);
      addLog("received", "payment", `${fmtCur(amt)} on account from ${v?.name}`);
    } else {
      // One payment record per allocation
      const newPayments = allocations.map(([billId, a]) => {
        const b = bills.find(x => x.id === billId);
        return {
          id: uid(), date: form.date, vendorId: form.vendorId, vendorName: v?.name || "",
          billId, billNo: b?.billNo || "", billType: "sale", type: "received",
          amount: Number(a), paymentMode: form.paymentMode, reference: form.reference, notes: form.notes,
          userId: user.id, userName: user.name, ts: new Date().toISOString(),
        };
      });
      savePayments([...newPayments, ...(payments || [])]);
      addLog("received", "payment", `${fmtCur(amt)} from ${v?.name} across ${allocations.length} bills`);
    }
    setModal(false);
  };

  const filtered = useMemo(() => receipts.filter(p =>
    inRange(p.date, df, dt) &&
    (!search || (p.vendorName || "").toLowerCase().includes(search.toLowerCase()) || (p.reference || "").toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => (b.date || "").localeCompare(a.date || "")), [receipts, df, dt, search]);

  const totalReceived = filtered.reduce((s, p) => s + Number(p.amount || 0), 0);
  const onAccountTotal = filtered.filter(p => !p.billId).reduce((s, p) => s + Number(p.amount || 0), 0);

  return <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <PeriodBar df={df} setDf={setDf} dt={dt} setDt={setDt} preset={preset} setPreset={setPreset} />
      <GBtn onClick={openNew} icon={<Plus size={14} />}>Record Receipt</GBtn>
    </div>

    <div className="kgrid">
      <KCard label="Total Received" value={fmtCur(totalReceived)} sub={`${filtered.length} receipts`} icon={ArrowDownRight} color={T.green} />
      <KCard label="On Account" value={fmtCur(onAccountTotal)} sub="Unallocated balance" icon={IndianRupee} color={T.amber} />
      <KCard label="Allocated" value={fmtCur(totalReceived - onAccountTotal)} sub="Linked to bills" icon={CheckSquare} color={T.accent} />
    </div>

    <div className="glass" style={{ borderRadius: T.radius, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.borderSubtle}` }}>
        <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer, reference…" style={{ maxWidth: 320 }} />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Date","Customer","Bill / Ref","Mode","Amount","Reference","Notes","By"].map((h,i) => <th key={i} className="th" style={{ textAlign: h === "Amount" ? "right" : "left", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
          <tbody>{filtered.slice((pg-1)*ps, pg*ps).map(p => (
            <tr key={p.id} className="trow">
              <td className="td m" style={{ whiteSpace: "nowrap" }}>{fmtDate(p.date)}</td>
              <td className="td" style={{ fontWeight: 600 }}>{p.vendorName}</td>
              <td className="td" style={{ fontWeight: 700, color: p.billId ? T.accent : T.amber, whiteSpace: "nowrap" }}>{p.billNo || "On Account"}</td>
              <td className="td"><Pill c={p.paymentMode} color={T.blue} /></td>
              <td className="td r" style={{ fontWeight: 800, color: T.green }}>{fmtCur(p.amount)}</td>
              <td className="td m" style={{ fontFamily: "monospace", fontSize: 11 }}>{p.reference || "—"}</td>
              <td className="td m" style={{ fontSize: 11, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.notes || "—"}</td>
              <td className="td m" style={{ fontSize: 11 }}>{p.userName}</td>
            </tr>
          ))}</tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>No receipts in this period</div>}
      </div>
      <Pager total={filtered.length} page={pg} ps={ps} setPage={setPg} setPs={setPs} />
    </div>

    <Modal open={modal} onClose={() => setModal(false)} title="Record Receipt from Customer" width={680}
      footer={<><GBtn v="ghost" onClick={() => setModal(false)}>Cancel</GBtn><GBtn onClick={save} v="green">Save Receipt</GBtn></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="fgrid">
          <Field label="Date" req><GIn type="date" value={form.date} onChange={e => f("date", e.target.value)} /></Field>
          <Field label="Customer" req><VendorSearch value={form.vendorId} onChange={v => f("vendorId", v)} vendors={vendors} placeholder="Search customer…" /></Field>
          <Field label="Total Amount Received (₹)" req><GIn type="number" min="0" step="0.01" value={form.amount} onChange={e => f("amount", e.target.value)} placeholder="e.g. 50000" /></Field>
          <Field label="Payment Mode" req><GS value={form.paymentMode} onChange={e => f("paymentMode", e.target.value)} placeholder="Select…">{MODES.map(m => <option key={m} value={m}>{m}</option>)}</GS></Field>
          <Field label="Reference / UTR / Cheque No"><GIn value={form.reference} onChange={e => f("reference", e.target.value)} /></Field>
          <Field label="Notes"><GIn value={form.notes} onChange={e => f("notes", e.target.value)} /></Field>
        </div>

        {form.vendorId && Number(form.amount) > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, marginBottom: -4 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Allocate to Bills</div>
              <GBtn v="ghost" sz="sm" onClick={autoAllocate}>Auto-allocate (FIFO)</GBtn>
            </div>
            {customerBills.length === 0 ? (
              <div style={{ padding: 14, borderRadius: T.radius, background: T.amberBg, color: T.amber, fontSize: 12, fontWeight: 600 }}>
                No outstanding bills for this customer. Receipt will be recorded "On Account".
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto", padding: 4 }}>
                {customerBills.map(b => (
                  <div key={b.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto 130px", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: T.radius, background: T.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: `1px solid ${T.borderSubtle}` }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{b.billNo}</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>{fmtDate(b.date)}</div>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600 }}>Total: {fmtCur(b.total)}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.red }}>Due: {fmtCur(b.outstanding)}</div>
                    <input type="number" min="0" step="0.01" max={b.outstanding} className="inp"
                      value={form.allocations[b.id] || ""}
                      onChange={e => setAllocation(b.id, e.target.value)}
                      placeholder="Allocate ₹"
                      style={{ padding: "6px 10px", fontSize: 12 }} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: T.radius, background: remainingToAllocate < 0 ? T.redBg : remainingToAllocate > 0 ? T.amberBg : T.greenBg }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.textSub }}>Allocated: {fmtCur(allocatedSum)} / {fmtCur(form.amount || 0)}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: remainingToAllocate < 0 ? T.red : remainingToAllocate > 0 ? T.amber : T.green }}>
                {remainingToAllocate > 0 ? `On Account: ${fmtCur(remainingToAllocate)}` : remainingToAllocate < 0 ? `Over by ${fmtCur(Math.abs(remainingToAllocate))}` : "Fully allocated"}
              </span>
            </div>
          </>
        )}
      </div>
    </Modal>
  </div>;
}
