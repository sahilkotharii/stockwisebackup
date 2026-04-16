import React from "react";
import { ArrowLeft } from "lucide-react";
import { useT } from "../theme";
import { GBtn } from "../components/UI";
import BillForm from "../components/BillForm";
import { uid, fmtCur } from "../utils";

export default function NewSaleInvoice({ ctx }) {
  const T = useT();
  const { bills, saveBills, transactions, saveTransactions, products, vendors, getStock, user, addLog, addChangeReq, invoiceSettings, setPage } = ctx;
  const isManager = user.role === "manager";

  const handleSave = (bill) => {
    if (isManager) {
      addChangeReq({ entity: "sale", action: "create", entityId: null, entityName: bill.billNo, currentData: null, proposedData: bill });
      setPage("sales");
      return;
    }
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
    setPage("sales");
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => setPage("sales")} className="btn-ghost" style={{ padding: "6px 10px" }}><ArrowLeft size={18} /></button>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 18, color: T.text }}>New Tax Invoice</h2>
          {isManager && <div style={{ fontSize: 12, color: T.amber, fontWeight: 600 }}>Requires admin approval</div>}
        </div>
      </div>
      <div className="glass" style={{ padding: 20, borderRadius: T.radius }}>
        <BillForm type="sale" bills={bills} onSave={handleSave} products={products} vendors={vendors} getStock={getStock} invoiceSettings={invoiceSettings} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
        <GBtn v="ghost" onClick={() => setPage("sales")}>Cancel</GBtn>
        <GBtn type="submit" form="sale-form">Save Tax Invoice</GBtn>
      </div>
    </div>
  );
}
