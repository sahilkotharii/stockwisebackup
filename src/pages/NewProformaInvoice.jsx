import React from "react";
import { ArrowLeft } from "lucide-react";
import { useT } from "../theme";
import { GBtn } from "../components/UI";
import BillForm from "../components/BillForm";
import { uid, fmtCur } from "../utils";

export default function NewProformaInvoice({ ctx }) {
  const T = useT();
  const { bills, saveBills, transactions, saveTransactions, products, vendors, getStock, user, addLog, invoiceSettings, setPage } = ctx;

  const handleSave = (bill) => {
    // Generate a proper proforma bill number using piSeries settings
    const prefix = invoiceSettings?.piSeries || "PI-";
    const startNum = Number(invoiceSettings?.piSeriesStart || 1);
    const existingCount = bills.filter(b => b.isProforma && (b.billNo || "").startsWith(prefix)).length;
    const proformaBillNo = prefix + String(startNum + existingCount).padStart(4, "0");

    const proformaBill = {
      ...bill,
      id: uid(),
      billNo: proformaBillNo,
      isProforma: true,
      userId: user.id,
      userName: user.name
    };
    saveBills([proformaBill, ...bills]);
    addLog("created", "proforma invoice", proformaBill.billNo, `${bill.items.length} items · ${fmtCur(bill.total)}`);
    setPage("sales");
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => setPage("sales")} className="btn-ghost" style={{ padding: "6px 10px" }}><ArrowLeft size={18} /></button>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 18, color: T.text }}>New Proforma Invoice</h2>
          <div style={{ fontSize: 12, color: T.textMuted }}>This will not affect stock or transactions</div>
        </div>
      </div>
      <div style={{ padding: "10px 16px", borderRadius: T.radius, background: T.blueBg, border: `1px solid ${T.blue}20`, marginBottom: 16, fontSize: 13, color: T.blue, fontWeight: 600 }}>
        Proforma invoices are quotations — no inventory movement, no GST reporting.
      </div>
      <div className="glass" style={{ padding: 20, borderRadius: T.radius }}>
        <BillForm type="sale" bills={bills} onSave={handleSave} products={products} vendors={vendors} getStock={getStock} invoiceSettings={invoiceSettings} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
        <GBtn v="ghost" onClick={() => setPage("sales")}>Cancel</GBtn>
        <GBtn type="submit" form="sale-form">Save Proforma</GBtn>
      </div>
    </div>
  );
}
