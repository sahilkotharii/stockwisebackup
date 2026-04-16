// ╔═══════════════════════════════════════════════════════════════════╗
// ║  PaymentModal — Record payment against a bill + view history     ║
// ╚═══════════════════════════════════════════════════════════════════╝

import React, { useState, useMemo } from "react";
import { CreditCard, Trash2, IndianRupee } from "lucide-react";
import { useT } from "../theme";
import { Modal, GBtn, GIn, GTa, Field, GS, Pill } from "./UI";
import { uid, today, fmtCur, fmtDate } from "../utils";

const MODES = ["Cash", "NEFT / RTGS", "UPI", "Cheque", "Credit", "On Account"];

export function PaymentStatusBadge({ bill, getBillPaid }) {
  const T = useT();
  if (!bill) return null;
  const total = Number(bill.total || 0);
  const paid = getBillPaid(bill.id);
  if (total <= 0) return null;
  if (paid >= total) return <Pill c="Paid" color={T.green} />;
  if (paid > 0) return <Pill c={`Partial · ${fmtCur(paid)}`} color={T.amber} />;
  return <Pill c="Unpaid" color={T.red} />;
}

export function OutstandingBadge({ bill, getBillOutstanding }) {
  const T = useT();
  if (!bill) return null;
  const os = getBillOutstanding(bill);
  if (os <= 0) return null;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: T.red, background: T.redBg, padding: "2px 8px", borderRadius: T.radiusFull, border: `1px solid ${T.red}20` }}>
      Due: {fmtCur(os)}
    </span>
  );
}

export default function PaymentModal({ open, onClose, bill, ctx }) {
  const T = useT();
  const { payments, savePayments, getBillPaid, getBillOutstanding, vendors, user, addLog } = ctx;

  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [date, setDate] = useState(today());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");

  const billPayments = useMemo(() =>
    (payments || []).filter(p => p.billId === bill?.id).sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [payments, bill?.id]
  );

  const totalPaid = bill ? getBillPaid(bill.id) : 0;
  const outstanding = bill ? getBillOutstanding(bill) : 0;
  const vendor = vendors?.find(v => v.id === bill?.vendorId);

  const handleSave = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { setErr("Enter a valid amount"); return; }
    if (amt > outstanding + 0.01) { setErr(`Amount exceeds outstanding (${fmtCur(outstanding)})`); return; }
    if (!paymentMode) { setErr("Select a payment mode"); return; }
    if (!date) { setErr("Select a date"); return; }

    const payment = {
      id: uid(),
      date,
      vendorId: bill.vendorId || "",
      vendorName: vendor?.name || "",
      billId: bill.id,
      billNo: bill.billNo || "",
      billType: bill.type,
      type: bill.type === "sale" ? "received" : "made",
      amount: amt,
      paymentMode,
      reference,
      notes,
      userId: user?.id || "",
      userName: user?.name || "",
      ts: new Date().toISOString(),
    };

    savePayments([payment, ...payments]);
    addLog(
      bill.type === "sale" ? "received payment" : "made payment",
      "payment",
      `${fmtCur(amt)} → ${bill.billNo}`,
      `Mode: ${paymentMode}${reference ? ` · Ref: ${reference}` : ""}`
    );

    // Reset form
    setAmount("");
    setPaymentMode("");
    setReference("");
    setNotes("");
    setErr("");
  };

  const deletePayment = (payId) => {
    if (!window.confirm("Delete this payment record?")) return;
    savePayments(payments.filter(p => p.id !== payId));
    addLog("deleted", "payment", `Payment on ${bill?.billNo}`);
  };

  if (!open || !bill) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Payments — ${bill.billNo}`} width={600}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Bill Summary ───────────────────────────────────────── */}
        <div style={{ padding: "16px 20px", borderRadius: T.radius, background: `linear-gradient(135deg, ${bill.type === "sale" ? T.greenBg : T.blueBg}, transparent)`, border: `1px solid ${bill.type === "sale" ? T.green : T.blue}20` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {bill.type === "sale" ? "Sale to" : "Purchase from"}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginTop: 4 }}>{vendor?.name || "—"}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, fontWeight: 500 }}>{fmtDate(bill.date)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.05em" }}>BILL TOTAL</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginTop: 2 }}>{fmtCur(bill.total)}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderSubtle}` }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 4 }}>PAID</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.green }}>{fmtCur(totalPaid)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 4 }}>OUTSTANDING</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: outstanding > 0 ? T.red : T.green }}>{fmtCur(outstanding)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 4 }}>STATUS</div>
              <div style={{ marginTop: 2 }}>
                {outstanding <= 0
                  ? <Pill c="Fully Paid" color={T.green} />
                  : totalPaid > 0
                    ? <Pill c="Partial" color={T.amber} />
                    : <Pill c="Unpaid" color={T.red} />
                }
              </div>
            </div>
          </div>
        </div>

        {/* ── Record Payment Form (only if outstanding > 0) ──────── */}
        {outstanding > 0 && (
          <div style={{ padding: "20px", borderRadius: T.radius, background: T.surfaceGlass, border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IndianRupee size={14} color={T.accent} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Record Payment</div>
            </div>

            <div className="fgrid">
              <Field label="Amount (₹)" req>
                <GIn type="number" min="0" step="0.01" value={amount} onChange={e => { setAmount(e.target.value); setErr(""); }}
                  placeholder={`Max: ${fmtCur(outstanding)}`} />
              </Field>
              <Field label="Date" req>
                <GIn type="date" value={date} onChange={e => setDate(e.target.value)} />
              </Field>
              <Field label="Payment Mode" req cl="s2">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {MODES.map(pm => (
                    <button type="button" key={pm} className="liquid-trans" onClick={() => { setPaymentMode(paymentMode === pm ? "" : pm); setErr(""); }}
                      style={{
                        padding: "6px 14px", borderRadius: T.radiusFull, fontSize: 12, fontWeight: 700,
                        border: `1px solid ${paymentMode === pm ? T.accent : T.borderSubtle}`,
                        cursor: "pointer",
                        background: paymentMode === pm ? T.accent : "transparent",
                        color: paymentMode === pm ? "#fff" : T.textSub,
                        boxShadow: paymentMode === pm ? `0 2px 8px ${T.accent}40` : "none"
                      }}>{pm}</button>
                  ))}
                </div>
              </Field>
              <Field label="Reference / Txn ID">
                <GIn value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. UTR, cheque no." />
              </Field>
              <Field label="Notes">
                <GIn value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional remarks" />
              </Field>
            </div>

            {err && <div style={{ fontSize: 12, color: T.red, marginTop: 8, fontWeight: 600 }}>{err}</div>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <GBtn v="ghost" sz="sm" onClick={() => { setAmount(String(outstanding)); }}>Full Amount</GBtn>
              <GBtn sz="md" onClick={handleSave} icon={<CreditCard size={14} />}>
                {bill.type === "sale" ? "Record Receipt" : "Record Payment"}
              </GBtn>
            </div>
          </div>
        )}

        {/* ── Payment History ────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.textMuted, letterSpacing: "0.05em", marginBottom: 12 }}>
            PAYMENT HISTORY ({billPayments.length})
          </div>
          {billPayments.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: T.textMuted, fontSize: 13, fontWeight: 500 }}>
              No payments recorded yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {billPayments.map(p => (
                <div key={p.id} className="liquid-trans" style={{
                  padding: "12px 16px", borderRadius: T.radius,
                  background: T.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  border: `1px solid ${T.borderSubtle}`,
                  display: "flex", alignItems: "center", gap: 14
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.greenBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <IndianRupee size={16} color={T.green} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: T.green }}>{fmtCur(p.amount)}</span>
                      <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>{fmtDate(p.date)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSub, marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span className="badge" style={{ background: T.accentBg, color: T.accent, padding: "2px 8px", fontSize: 10 }}>{p.paymentMode}</span>
                      {p.reference && <span style={{ fontFamily: "monospace", color: T.textMuted }}>Ref: {p.reference}</span>}
                      {p.notes && <span style={{ color: T.textMuted, fontStyle: "italic" }}>{p.notes}</span>}
                    </div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4, fontWeight: 500 }}>by {p.userName}</div>
                  </div>
                  {user?.role === "admin" && (
                    <button className="btn-danger liquid-trans" onClick={() => deletePayment(p.id)}
                      style={{ padding: "6px 8px", flexShrink: 0 }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}
