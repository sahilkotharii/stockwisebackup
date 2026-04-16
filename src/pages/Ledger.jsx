// ╔═══════════════════════════════════════════════════════════════════╗
// ║  Ledger.jsx — Vendor/Customer ledger with running balance        ║
// ╚═══════════════════════════════════════════════════════════════════╝

import React, { useState, useMemo, useEffect } from "react";
import { BookOpen, IndianRupee, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Download, CreditCard } from "lucide-react";
import { useT } from "../theme";
import { KCard, GBtn, GS, Pager, PeriodBar, SearchInput, Pill } from "../components/UI";
import VendorSearch from "../components/VendorSearch";
import PaymentModal from "../components/PaymentModal";
import { fmtCur, fmtDate, today, getPresetDate, inRange, safeDate, toCSV, dlCSV } from "../utils";

export default function Ledger({ ctx }) {
  const T = useT();
  const { bills, payments, vendors, getBillPaid, getBillOutstanding, getVendorBalance, user } = ctx;

  const [vendorId, setVendorId] = useState("");
  const [preset, setPreset] = useState("");
  const [df, setDf] = useState("");
  const [dt, setDt] = useState("");
  const [search, setSearch] = useState("");
  const [pg, setPg] = useState(1);
  const [ps, setPs] = useState(50);
  const [payBill, setPayBill] = useState(null);

  useEffect(() => setPg(1), [vendorId, df, dt, search, ps]);

  // ── Outstanding summary across all vendors ────────────────────
  const summaryData = useMemo(() => {
    let totalReceivable = 0, totalPayable = 0;
    const vendorMap = {};

    bills.forEach(b => {
      const os = getBillOutstanding(b);
      if (os <= 0) return;
      if (!vendorMap[b.vendorId]) vendorMap[b.vendorId] = { receivable: 0, payable: 0 };
      if (b.type === "sale") { totalReceivable += os; vendorMap[b.vendorId].receivable += os; }
      if (b.type === "purchase") { totalPayable += os; vendorMap[b.vendorId].payable += os; }
    });

    const vendorsWithOutstanding = Object.keys(vendorMap).length;
    return { totalReceivable, totalPayable, vendorsWithOutstanding };
  }, [bills, getBillOutstanding]);

  // ── Build ledger entries for selected vendor ──────────────────
  const ledgerEntries = useMemo(() => {
    if (!vendorId) return [];

    // Collect all bills and payments for this vendor
    const entries = [];

    bills.filter(b => b.vendorId === vendorId).forEach(b => {
      if (!inRange(b.date, df, dt)) return;
      entries.push({
        id: b.id,
        date: safeDate(b.date),
        type: "bill",
        billType: b.type,
        ref: b.billNo,
        description: b.type === "sale" ? "Sale Invoice" : "Purchase Invoice",
        debit: b.type === "sale" ? Number(b.total || 0) : 0,
        credit: b.type === "purchase" ? Number(b.total || 0) : 0,
        bill: b,
      });
    });

    payments.filter(p => p.vendorId === vendorId).forEach(p => {
      if (!inRange(p.date, df, dt)) return;
      entries.push({
        id: p.id,
        date: safeDate(p.date),
        type: "payment",
        billType: p.billType,
        ref: `${p.billNo} · ${p.paymentMode}`,
        description: p.type === "received" ? "Payment Received" : "Payment Made",
        debit: p.type === "made" ? Number(p.amount || 0) : 0,     // we paid them
        credit: p.type === "received" ? Number(p.amount || 0) : 0, // they paid us
        payment: p,
      });
    });

    // Sort chronologically
    entries.sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.type === "bill" ? -1 : 1));

    // Compute running balance (positive = they owe us)
    let balance = 0;
    entries.forEach(e => {
      // Sale bill → they owe us more (debit increases receivable)
      // Purchase bill → we owe them more (credit increases payable)
      // Payment received → they owe us less
      // Payment made → we owe them less
      if (e.type === "bill" && e.billType === "sale") balance += e.debit;
      else if (e.type === "bill" && e.billType === "purchase") balance -= e.credit;
      else if (e.type === "payment" && e.description === "Payment Received") balance -= e.credit;
      else if (e.type === "payment" && e.description === "Payment Made") balance += e.debit;
      e.balance = balance;
    });

    return entries;
  }, [vendorId, bills, payments, df, dt]);

  const filteredEntries = useMemo(() => {
    if (!search) return ledgerEntries;
    const q = search.toLowerCase();
    return ledgerEntries.filter(e => e.ref?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q));
  }, [ledgerEntries, search]);

  const selectedVendor = vendors.find(v => v.id === vendorId);
  const vendorBal = vendorId ? getVendorBalance(vendorId) : 0;

  // ── Outstanding bills for selected vendor ─────────────────────
  const outstandingBills = useMemo(() => {
    if (!vendorId) return [];
    return bills
      .filter(b => b.vendorId === vendorId && getBillOutstanding(b) > 0)
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [vendorId, bills, getBillOutstanding]);

  const exportLedger = () => {
    const rows = filteredEntries.map(e => ({
      date: e.date, type: e.type, ref: e.ref, description: e.description,
      debit: e.debit || "", credit: e.credit || "", balance: e.balance
    }));
    dlCSV(toCSV(rows, ["date","type","ref","description","debit","credit","balance"]), `ledger_${selectedVendor?.name || "all"}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Summary Cards ──────────────────────────────────────── */}
      <div className="kgrid" style={{ gap: 16 }}>
        <KCard label="Total Receivable" value={fmtCur(summaryData.totalReceivable)} sub="Outstanding from customers" icon={ArrowDownRight} color={T.green} />
        <KCard label="Total Payable" value={fmtCur(summaryData.totalPayable)} sub="Outstanding to vendors" icon={ArrowUpRight} color={T.red} />
        <KCard label="Net Position" value={fmtCur(summaryData.totalReceivable - summaryData.totalPayable)}
          sub={summaryData.totalReceivable >= summaryData.totalPayable ? "Net receivable" : "Net payable"}
          icon={IndianRupee}
          color={summaryData.totalReceivable >= summaryData.totalPayable ? T.green : T.red} />
      </div>

      {/* ── Vendor Selector + Filters ──────────────────────────── */}
      <div className="glass" style={{ padding: "20px", borderRadius: T.radius }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <BookOpen size={18} color={T.accent} />
            <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Vendor / Customer Ledger</span>
          </div>
          <div className="fgrid">
            <Field label="Select Vendor / Customer" req>
              <VendorSearch value={vendorId} onChange={setVendorId} vendors={vendors} placeholder="Pick a vendor to view ledger…" />
            </Field>
            <div />
          </div>
          {vendorId && (
            <div className="filter-wrap" style={{ gap: 10 }}>
              <PeriodBar df={df} setDf={setDf} dt={dt} setDt={setDt} preset={preset} setPreset={setPreset} />
              <GBtn v="ghost" sz="sm" onClick={exportLedger} icon={<Download size={14} />}>Export CSV</GBtn>
            </div>
          )}
        </div>
      </div>

      {/* ── Vendor Balance Header ──────────────────────────────── */}
      {vendorId && selectedVendor && (
        <div className="glass spring-in" style={{
          padding: "20px 24px", borderRadius: T.radius,
          background: `linear-gradient(135deg, ${vendorBal >= 0 ? T.greenBg : T.redBg}, transparent)`,
          border: `1px solid ${vendorBal >= 0 ? T.green : T.red}20`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{selectedVendor.name}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4, fontWeight: 500 }}>
                {selectedVendor.city}{selectedVendor.state ? `, ${selectedVendor.state}` : ""}
                {selectedVendor.gstin ? ` · GSTIN: ${selectedVendor.gstin}` : ""}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.05em" }}>
                {vendorBal >= 0 ? "THEY OWE YOU" : "YOU OWE THEM"}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: vendorBal >= 0 ? T.green : T.red, letterSpacing: "-0.02em" }}>
                {fmtCur(Math.abs(vendorBal))}
              </div>
            </div>
          </div>

          {/* Outstanding bills quick view */}
          {outstandingBills.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderSubtle}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.05em", marginBottom: 10 }}>
                OUTSTANDING BILLS ({outstandingBills.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {outstandingBills.map(b => (
                  <button key={b.id} onClick={() => setPayBill(b)} className="liquid-trans"
                    style={{
                      padding: "8px 14px", borderRadius: T.radius, cursor: "pointer",
                      background: T.surfaceGlass, border: `1px solid ${T.border}`,
                      display: "flex", alignItems: "center", gap: 8, fontSize: 12
                    }}>
                    <span style={{ fontWeight: 800, color: b.type === "sale" ? T.green : T.blue }}>{b.billNo}</span>
                    <span style={{ color: T.red, fontWeight: 700 }}>{fmtCur(getBillOutstanding(b))}</span>
                    <CreditCard size={12} color={T.accent} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Ledger Table ───────────────────────────────────────── */}
      {vendorId && (
        <div className="glass fade-up" style={{ borderRadius: T.radius, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderSubtle}`, background: T.surfaceGlass }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>Ledger Entries</div>
              <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries…" style={{ maxWidth: 280 }} />
            </div>
          </div>

          {/* Desktop table */}
          <div className="desk-table-view" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Date", "Type", "Reference", "Description", "Debit (₹)", "Credit (₹)", "Balance (₹)"].map((h, i) => (
                    <th key={i} className="th" style={{ textAlign: ["Debit (₹)", "Credit (₹)", "Balance (₹)"].includes(h) ? "right" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEntries.slice((pg - 1) * ps, pg * ps).map(e => (
                  <tr key={e.id} className="trow liquid-trans" style={{ cursor: e.bill ? "pointer" : "default" }}
                    onClick={() => e.bill && setPayBill(e.bill)}>
                    <td className="td m" style={{ fontWeight: 500 }}>{fmtDate(e.date)}</td>
                    <td className="td">
                      <Pill c={e.type === "bill" ? (e.billType === "sale" ? "Sale" : "Purchase") : "Payment"}
                        color={e.type === "payment" ? T.green : e.billType === "sale" ? T.blue : T.amber} />
                    </td>
                    <td className="td" style={{ fontWeight: 700, color: T.text }}>{e.ref}</td>
                    <td className="td m" style={{ fontWeight: 500 }}>{e.description}</td>
                    <td className="td r" style={{ fontWeight: 700, color: e.debit > 0 ? T.text : T.textMuted }}>
                      {e.debit > 0 ? fmtCur(e.debit) : "—"}
                    </td>
                    <td className="td r" style={{ fontWeight: 700, color: e.credit > 0 ? T.text : T.textMuted }}>
                      {e.credit > 0 ? fmtCur(e.credit) : "—"}
                    </td>
                    <td className="td r" style={{ fontWeight: 800, color: e.balance >= 0 ? T.green : T.red, fontSize: 14 }}>
                      {e.balance >= 0 ? fmtCur(e.balance) : `–${fmtCur(Math.abs(e.balance))}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEntries.length === 0 && (
              <div style={{ padding: "48px 0", textAlign: "center", color: T.textMuted, fontSize: 13, fontWeight: 500 }}>
                No ledger entries for this vendor{df || dt ? " in this period" : ""}
              </div>
            )}
          </div>

          {/* Mobile cards */}
          <div className="mob-card-view">
            {filteredEntries.slice((pg - 1) * ps, pg * ps).map(e => (
              <div key={e.id} style={{ borderBottom: `1px solid ${T.borderSubtle}`, padding: "14px 16px" }}
                onClick={() => e.bill && setPayBill(e.bill)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{e.ref}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{e.description} · {fmtDate(e.date)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {e.debit > 0 && <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Dr {fmtCur(e.debit)}</div>}
                    {e.credit > 0 && <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Cr {fmtCur(e.credit)}</div>}
                    <div style={{ fontSize: 12, fontWeight: 700, color: e.balance >= 0 ? T.green : T.red, marginTop: 2 }}>
                      Bal: {e.balance >= 0 ? fmtCur(e.balance) : `–${fmtCur(Math.abs(e.balance))}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredEntries.length === 0 && (
              <div style={{ padding: "40px 0", textAlign: "center", color: T.textMuted, fontSize: 13 }}>No entries found</div>
            )}
          </div>

          <Pager total={filteredEntries.length} page={pg} ps={ps} setPage={setPg} setPs={setPs} />
        </div>
      )}

      {!vendorId && (
        <div className="glass" style={{ padding: "48px 24px", borderRadius: T.radius, textAlign: "center" }}>
          <BookOpen size={36} color={T.textMuted} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: T.textMuted, fontWeight: 600 }}>Select a vendor or customer above to view their ledger</div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal open={!!payBill} onClose={() => setPayBill(null)} bill={payBill} ctx={ctx} />
    </div>
  );
}

// Need this for the Field component used inside ledger
function Field({ label, children, req, cl = "" }) {
  const T = useT();
  return <div className={cl}><div style={{ fontSize: 12, fontWeight: 700, color: T.textSub, marginBottom: 8 }}>{label}{req && <span style={{ color: T.red }}> *</span>}</div>{children}</div>;
}
