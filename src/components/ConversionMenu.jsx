// ╔═══════════════════════════════════════════════════════════════════╗
// ║  ConversionMenu — handles PI→SO/TI, SO→TI, PO→Bill               ║
// ╚═══════════════════════════════════════════════════════════════════╝

import React, { useState, useRef, useEffect } from "react";
import { ArrowRightCircle, ChevronDown, FileText, ShoppingCart, Check } from "lucide-react";
import { useT } from "../theme";
import { uid, today, fmtCur } from "../utils";

export default function ConversionMenu({ source, sourceType, ctx }) {
  const T = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Already converted?
  if (source?.convertedToId) {
    return <span className="badge" style={{ background: T.greenBg, color: T.green, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <Check size={10} /> Converted
    </span>;
  }

  // What conversion options apply?
  const options = [];
  if (sourceType === "proforma") {
    options.push({ id: "to-so", label: "Convert to Sales Order", icon: ShoppingCart, color: T.accent });
    options.push({ id: "to-ti", label: "Convert to Tax Invoice", icon: FileText, color: T.green });
  } else if (sourceType === "sales-order") {
    options.push({ id: "to-ti", label: "Convert to Tax Invoice", icon: FileText, color: T.green });
  } else if (sourceType === "purchase-order") {
    options.push({ id: "to-pb", label: "Convert to Purchase Bill", icon: FileText, color: T.blue });
  }

  if (options.length === 0) return null;

  const markConverted = (patch) => {
    // Patch the source entity to mark it converted
    if (sourceType === "proforma") {
      ctx.saveBills(ctx.bills.map(b => b.id === source.id ? { ...b, ...patch } : b));
    } else if (sourceType === "sales-order") {
      ctx.saveSalesOrders(ctx.salesOrders.map(o => o.id === source.id ? { ...o, ...patch } : o));
    } else if (sourceType === "purchase-order") {
      ctx.savePurchaseOrders(ctx.purchaseOrders.map(o => o.id === source.id ? { ...o, ...patch } : o));
    }
  };

  const convertToSO = () => {
    // PI → Sales Order
    const prefix = ctx.invoiceSettings?.soSeries || "SO-";
    const startNum = Number(ctx.invoiceSettings?.soSeriesStart || 1);
    const cnt = (ctx.salesOrders || []).length;
    const orderNo = prefix + String(startNum + cnt).padStart(4, "0");

    const newOrder = {
      id: uid(),
      orderNo,
      date: today(),
      vendorId: source.vendorId,
      vendorName: source.vendorName,
      status: "Draft",
      validUntil: "",
      notes: `Converted from Proforma ${source.billNo}`,
      items: (source.items || []).map(it => ({ ...it, id: uid() })),
      total: Number(source.total || 0),
      userId: ctx.user.id,
      userName: ctx.user.name,
      ts: new Date().toISOString(),
      convertedFromType: "proforma",
      convertedFromId: source.id,
      convertedFromNo: source.billNo
    };
    ctx.saveSalesOrders([newOrder, ...(ctx.salesOrders || [])]);
    markConverted({ convertedToId: newOrder.id, convertedToType: "sales-order", convertedToNo: orderNo });
    ctx.addLog?.("converted", "proforma to SO", `${source.billNo} → ${orderNo}`);
    setOpen(false);
    alert(`Created Sales Order ${orderNo}`);
    ctx.setPage("sales-orders");
  };

  const convertToTI = () => {
    // PI or SO → Tax Invoice (creates actual sale bill + stock transactions)
    const prefix = ctx.invoiceSettings?.saleSeries || "SK-";
    const startNum = Number(ctx.invoiceSettings?.saleSeriesStart || 1);
    const existing = (ctx.bills || []).filter(b => b.type === "sale" && !b.isProforma && (b.billNo || "").startsWith(prefix));
    let maxNum = startNum - 1;
    existing.forEach(b => { const n = parseInt((b.billNo || "").replace(prefix, ""), 10); if (!isNaN(n) && n > maxNum) maxNum = n; });
    const billNo = prefix + String(maxNum + 1).padStart(4, "0");

    const items = (source.items || []).map(it => ({ ...it, id: uid() }));
    const newBill = {
      id: uid(),
      billNo,
      type: "sale",
      date: today(),
      vendorId: source.vendorId,
      vendorName: source.vendorName,
      gstType: source.gstType || "cgst_sgst",
      items,
      subtotal: source.subtotal || 0,
      discType: source.discType || "pct",
      discValue: source.discValue || 0,
      discAmount: source.discAmount || 0,
      totalGst: source.totalGst || 0,
      total: source.total || 0,
      notes: `Converted from ${sourceType === "proforma" ? "Proforma" : "Sales Order"} ${source.billNo || source.orderNo}`,
      paymentMode: "",
      userId: ctx.user.id,
      userName: ctx.user.name,
      ts: new Date().toISOString(),
      isProforma: false,
      convertedFromType: sourceType,
      convertedFromId: source.id,
      convertedFromNo: source.billNo || source.orderNo
    };

    // Create stock transactions
    const newTxns = items.map(item => ({
      id: uid(),
      productId: item.productId,
      type: item.isDamaged ? "damaged" : "sale",
      qty: item.qty,
      price: item.effectivePrice || item.price,
      effectivePrice: item.effectivePrice || item.price,
      gstRate: item.gstRate || 0,
      gstAmount: item.gstAmount || 0,
      vendorId: source.vendorId,
      date: today(),
      notes: `Bill: ${billNo}`,
      userId: ctx.user.id,
      userName: ctx.user.name,
      billId: newBill.id
    }));

    ctx.saveBills([newBill, ...(ctx.bills || [])]);
    ctx.saveTransactions([...newTxns, ...(ctx.transactions || [])]);

    const patch = { convertedToId: newBill.id, convertedToType: "tax-invoice", convertedToNo: billNo };
    if (sourceType === "sales-order") patch.status = "Fulfilled";
    markConverted(patch);
    ctx.addLog?.("converted", `${sourceType} to tax invoice`, `${source.billNo || source.orderNo} → ${billNo}`);
    setOpen(false);
    alert(`Created Tax Invoice ${billNo}`);
    ctx.setPage("sales");
  };

  const convertToPB = () => {
    // PO → Purchase Bill
    const prefix = ctx.invoiceSettings?.saleSeries || "SK-"; // Purchase bills follow your own series
    const items = (source.items || []).map(it => ({ ...it, id: uid() }));
    const subtotal = items.reduce((s, i) => s + Number(i.qty || 0) * Number(i.price || 0), 0);
    const gstTotal = items.reduce((s, i) => {
      const p = (ctx.products || []).find(pr => pr.id === i.productId);
      const rate = Number(p?.gstRate || 0);
      return s + Number(i.qty || 0) * Number(i.price || 0) * rate / 100;
    }, 0);
    const billNo = `PB-${Date.now().toString(36).toUpperCase()}`;

    const newBill = {
      id: uid(),
      billNo,
      type: "purchase",
      date: today(),
      vendorId: source.vendorId,
      vendorName: source.vendorName,
      gstType: "cgst_sgst",
      items,
      subtotal,
      totalGst: gstTotal,
      total: subtotal + gstTotal,
      notes: `Converted from Purchase Order ${source.orderNo}`,
      purchaseInvoiceNo: "",
      userId: ctx.user.id,
      userName: ctx.user.name,
      ts: new Date().toISOString(),
      convertedFromType: "purchase-order",
      convertedFromId: source.id,
      convertedFromNo: source.orderNo
    };

    const newTxns = items.map(item => ({
      id: uid(),
      productId: item.productId,
      type: "purchase",
      qty: item.qty,
      price: item.price,
      effectivePrice: item.price,
      gstRate: Number((ctx.products || []).find(pr => pr.id === item.productId)?.gstRate || 0),
      vendorId: source.vendorId,
      date: today(),
      notes: `From PO: ${source.orderNo}`,
      userId: ctx.user.id,
      userName: ctx.user.name,
      billId: newBill.id
    }));

    ctx.saveBills([newBill, ...(ctx.bills || [])]);
    ctx.saveTransactions([...newTxns, ...(ctx.transactions || [])]);

    markConverted({ convertedToId: newBill.id, convertedToType: "purchase-bill", convertedToNo: billNo, status: "Received" });
    ctx.addLog?.("converted", "PO to purchase bill", `${source.orderNo} → ${billNo}`);
    setOpen(false);
    alert(`Created Purchase Bill — go to Purchase → edit to add the vendor invoice number`);
    ctx.setPage("purchase");
  };

  const handleClick = (id) => {
    if (id === "to-so") convertToSO();
    else if (id === "to-ti") convertToTI();
    else if (id === "to-pb") convertToPB();
  };

  if (options.length === 1) {
    const opt = options[0];
    return (
      <button onClick={() => handleClick(opt.id)} className="btn-ghost"
        style={{ padding: "5px 10px", fontSize: 11, fontWeight: 700, color: opt.color, border: `1px solid ${opt.color}30`, background: opt.color + "10" }}>
        <opt.icon size={11} /> {opt.label.replace("Convert to ", "→ ")}
      </button>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(o => !o)} className="btn-ghost"
        style={{ padding: "5px 10px", fontSize: 11, fontWeight: 700, color: T.accent, border: `1px solid ${T.accent}30`, background: T.accentBg }}>
        <ArrowRightCircle size={11} /> Convert <ChevronDown size={10} />
      </button>
      {open && (
        <div className="glass-strong spring-down" style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", minWidth: 200, borderRadius: T.radius, padding: 4, zIndex: 100, boxShadow: T.shadowXl }}>
          {options.map(opt => (
            <button key={opt.id} onClick={() => handleClick(opt.id)} className="btn-ghost"
              style={{ width: "100%", justifyContent: "flex-start", padding: "8px 10px", fontSize: 12, color: T.text, border: "none", background: "transparent" }}>
              <opt.icon size={13} color={opt.color} /> {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
