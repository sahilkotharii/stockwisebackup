import React from "react";
import { Download } from "lucide-react";
import { useT } from "../theme";
import { GBtn } from "../components/UI";
import { toCSV, dlCSV, buildTransactionCSVRows, TXN_CSV_HEADERS } from "../utils";
export default function AdminExport({ ctx }) {
  const T = useT();
  const { products, vendors, transactions, bills, categories, payments } = ctx;
  const exports = [
    { label: "Products", fn: () => dlCSV(toCSV(products, ["name","alias","sku","hsn","mrp","purchasePrice","gstRate","unit","minStock","description"]), "products") },
    { label: "Vendors", fn: () => dlCSV(toCSV(vendors, ["name","contact","phone","email","gstin","address1","city","state","pincode"]), "vendors") },
    { label: "Transactions", fn: () => dlCSV(toCSV(buildTransactionCSVRows(transactions, products, vendors), TXN_CSV_HEADERS), "transactions") },
    { label: "Categories", fn: () => dlCSV(toCSV(categories, ["name","color"]), "categories") },
    { label: "Payments", fn: () => dlCSV(toCSV(payments || [], ["date","vendorName","billNo","type","amount","paymentMode","reference","notes","userName"]), "payments") },
  ];
  return <div style={{ maxWidth: 500 }}>
    <div className="glass" style={{ padding: 20, borderRadius: T.radius }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 16 }}>Export Data as CSV</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {exports.map(e => <GBtn key={e.label} v="ghost" onClick={e.fn} icon={<Download size={13} />} style={{ justifyContent: "flex-start", width: "100%", padding: "10px 14px" }}>{e.label}</GBtn>)}
      </div>
    </div>
  </div>;
}
