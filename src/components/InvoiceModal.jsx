import React, { useRef } from "react";
import { Printer, X } from "lucide-react";
import { useT } from "../theme";
import { GBtn } from "./UI";

/* ── Amount to words (Indian system) ────────────────────────────────────── */
function amountToWords(n) {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  function conv(n) {
    if (!n) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? " " + ones[n%10] : "");
    if (n < 1000) return ones[Math.floor(n/100)] + " Hundred" + (n%100 ? " " + conv(n%100) : "");
    if (n < 100000) return conv(Math.floor(n/1000)) + " Thousand" + (n%1000 ? " " + conv(n%1000) : "");
    if (n < 10000000) return conv(Math.floor(n/100000)) + " Lakh" + (n%100000 ? " " + conv(n%100000) : "");
    return conv(Math.floor(n/10000000)) + " Crore" + (n%10000000 ? " " + conv(n%10000000) : "");
  }
  const rupees = Math.floor(n), paise = Math.round((n - rupees)*100);
  return (conv(rupees) || "Zero") + " Rupees" + (paise ? " and " + conv(paise) + " Paise" : "") + " Only";
}

/* ── Build invoice HTML ──────────────────────────────────────────────────── */
export function buildHTML(bill, inv, vendor) {
  const isIGST = (bill.gstType || "cgst_sgst") === "igst";
  const dateStr = bill.date ? new Date(bill.date).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}) : "";

  const itemsData = (bill.items || []).map(it => {
    const rate = Number(it.gstRate || 0);
    const effPrice = Number(it.effectivePrice || it.price || 0);
    const qty = Number(it.qty || 0);
    const taxablePerUnit = rate > 0 ? effPrice * 100 / (100 + rate) : effPrice;
    const taxableTotal = qty * taxablePerUnit;
    const gstTotal = qty * effPrice - taxableTotal;
    return { ...it, taxablePerUnit, taxableTotal, gstTotal, rate, effPrice, qty };
  });

  const gstByRate = {};
  itemsData.forEach(it => {
    if (!it.rate) return;
    if (!gstByRate[it.rate]) gstByRate[it.rate] = { taxable: 0, gst: 0 };
    gstByRate[it.rate].taxable += it.taxableTotal;
    gstByRate[it.rate].gst += it.gstTotal;
  });

  const grandTaxable = itemsData.reduce((s,i) => s + i.taxableTotal, 0);
  const grandGst = itemsData.reduce((s,i) => s + i.gstTotal, 0);
  const grandTotal = Number(bill.total || 0);
  const discount = Number(bill.discAmount || 0);

  const billToLines = [];
  if (vendor) {
    if (vendor.name) billToLines.push(`<strong style="font-size:15px;color:#111">${vendor.name}</strong>`);
    const addrParts = [vendor.address1, vendor.address2].filter(Boolean);
    if (addrParts.length) billToLines.push(addrParts.join(", "));
    const cityState = [vendor.city, vendor.state, vendor.pincode].filter(Boolean).join(", ");
    if (cityState) billToLines.push(cityState);
    if (vendor.gstin) billToLines.push(`<span style="font-family:monospace;font-weight:700;color:#333;margin-top:4px;display:inline-block">GSTIN: ${vendor.gstin}</span>`);
    if (vendor.phone) billToLines.push(`Ph: ${vendor.phone}`);
    if (vendor.email) billToLines.push(vendor.email);
  } else if (bill.billToAddress) {
    bill.billToAddress.split(",").forEach(p => billToLines.push(p.trim()));
  }

  const shipLines = (() => {
    if (bill.shipToSameAsBill !== false) return billToLines;
    const custom = bill.shipTo || "";
    if (!custom) return billToLines;
    return custom.split("\n").map(l => l.trim()).filter(Boolean);
  })();

  const itemRows = itemsData.map((it, idx) => `
    <tr>
      <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #e5e7eb">${idx+1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">
        <div style="font-weight:700;color:#111">${it.productName || ""}</div>
      </td>
      <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:11px;color:#64748b">${it.hsnCode || it.hsn || "—"}</td>
      <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #e5e7eb;color:#475569">${it.unit || "Pcs"}</td>
      <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #e5e7eb;font-weight:600">${it.qty}</td>
      <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #e5e7eb;color:#64748b">₹${(it.mrp||it.effPrice||0).toFixed(2)}</td>
      <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #e5e7eb;color:#475569">₹${it.taxablePerUnit.toFixed(2)}</td>
      <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #e5e7eb;font-weight:700;color:#111">₹${it.taxableTotal.toFixed(2)}</td>
      <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #e5e7eb;font-weight:800;color:#111">₹${(it.qty * it.effPrice).toFixed(2)}</td>
    </tr>`).join("");

  const gstRows = Object.entries(gstByRate).map(([rate, v]) => {
    if (isIGST) {
      return `<tr><td style="padding:6px 12px;color:#64748b;font-weight:500">IGST @${rate}%</td><td style="padding:6px 12px;text-align:right;font-weight:700;color:#334155">₹${v.gst.toFixed(2)}</td></tr>`;
    } else {
      const half = v.gst / 2;
      const halfRate = (Number(rate) / 2).toFixed(1);
      return `
        <tr><td style="padding:6px 12px;color:#64748b;font-weight:500">CGST @${halfRate}%</td><td style="padding:6px 12px;text-align:right;font-weight:600;color:#475569">₹${half.toFixed(2)}</td></tr>
        <tr><td style="padding:6px 12px;color:#64748b;font-weight:500">SGST @${halfRate}%</td><td style="padding:6px 12px;text-align:right;font-weight:600;color:#475569">₹${half.toFixed(2)}</td></tr>`;
    }
  }).join("");

  const footerPoints = inv.footerPoints || ["E & O.E.", "Subject to local jurisdiction.", "Goods once sold will not be taken back."];

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>${bill.isProforma ? "Proforma Invoice" : "Tax Invoice"} - ${bill.billNo}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
  body { font-size: 12px; color: #1e293b; background: #fff; -webkit-font-smoothing: antialiased; }
  .page { width: 794px; min-height: 1050px; margin: 0 auto; padding: 32px; display: flex; flex-direction: column; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #0f172a; gap: 16px; }
  .company h1 { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin-bottom: 4px; }
  .company p { font-size: 11px; color: #475569; line-height: 1.6; font-weight: 500; }
  .inv-title { text-align: right; }
  .inv-title h2 { font-size: 26px; font-weight: 800; letter-spacing: 0.05em; color: #0f172a; margin-bottom: 8px; }
  .inv-title .meta { font-size: 12px; color: #334155; line-height: 1.8; font-weight: 500; }
  .inv-title .meta strong { color: #0f172a; font-weight: 700; }
  .addr-row { display: flex; gap: 0; border: 1px solid #cbd5e1; margin: 16px 0; border-radius: 8px; overflow: hidden; }
  .addr-box { flex: 1; padding: 14px 18px; }
  .addr-box + .addr-box { border-left: 1px solid #cbd5e1; }
  .addr-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .addr-box p { font-size: 12px; color: #334155; line-height: 1.6; font-weight: 500; }
  .eway-box { border: 1px solid #cbd5e1; border-top: none; padding: 10px 18px; background: #f8fafc; border-radius: 0 0 8px 8px; margin-top: -16px; margin-bottom: 16px; }
  .eway-grid { display: flex; gap: 32px; font-size: 11px; }
  .eway-grid span { color: #64748b; font-weight: 600; }
  .eway-grid strong { color: #0f172a; font-weight: 700; }
  table.items { width: 100%; border-collapse: collapse; margin: 16px 0 0; }
  table.items thead th { background: #f8fafc; padding: 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #cbd5e1; color: #475569; }
  table.items tfoot td { background: #f8fafc; font-weight: 800; padding: 12px; border-top: 2px solid #94a3b8; color: #0f172a; }
  .totals-row { display: flex; gap: 0; border: 1px solid #cbd5e1; border-top: none; border-radius: 0 0 8px 8px; overflow: hidden; }
  .words-box { flex: 1; padding: 16px 18px; background: #f8fafc; border-right: 1px solid #cbd5e1; }
  .words-box .label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
  .words-box p { font-size: 12px; font-weight: 700; color: #1e293b; }
  .summary { min-width: 280px; padding: 10px 0; }
  .summary table { width: 100%; border-collapse: collapse; }
  .summary td { padding: 6px 12px; font-size: 12px; }
  .summary .grand td { font-size: 16px; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a; padding-top: 10px; margin-top: 4px; }
  .footer { display: flex; gap: 0; margin-top: auto; padding-top: 24px; border-top: 1px solid #cbd5e1; }
  .footer-bank { flex: 1; padding-right: 24px; }
  .footer-bank p { font-size: 11px; color: #475569; line-height: 1.8; font-weight: 500; }
  .footer-bank strong { color: #0f172a; font-weight: 700; }
  .footer-points { flex: 1; padding: 0 24px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; }
  .footer-points li { font-size: 11px; color: #475569; margin-bottom: 6px; font-weight: 500; }
  .footer-sign { min-width: 200px; text-align: center; }
  .footer-sign .company-name { font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 60px; }
  .footer-sign .sig-line { border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .gst-badge { display: inline-block; padding: 4px 12px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 99px; font-size: 10px; font-weight: 800; color: #334155; margin-top: 8px; letter-spacing: 0.02em; }
  @media print {
    .page { width: 100%; padding: 0; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="company" style="display:flex;gap:16px;align-items:center">
      ${inv.logoUrl ? `<img src="${inv.logoUrl}" style="height:64px;max-width:140px;object-fit:contain" alt="logo"/>` : ""}
      <div>
        <h1>${inv.businessName || "Your Business"}</h1>
        <p>
          ${[inv.address1, inv.address2, inv.city, inv.state, inv.pincode].filter(Boolean).join(", ")}<br/>
          ${inv.gstin ? `GSTIN: <strong>${inv.gstin}</strong><br/>` : ""}
          ${inv.phone ? `Ph: ${inv.phone}` : ""}${inv.email ? ` &nbsp;|&nbsp; ${inv.email}` : ""}
        </p>
      </div>
    </div>
    <div class="inv-title">
      <h2>${bill.isProforma ? "PROFORMA INVOICE" : "TAX INVOICE"}</h2>
      <div class="meta">
        <div><strong>${bill.isProforma ? "Proforma" : "Invoice"} No:</strong> ${bill.billNo || "—"}</div>
        <div><strong>Date:</strong> ${dateStr}</div>
        ${bill.purchaseInvoiceNo ? `<div><strong>Ref No:</strong> ${bill.purchaseInvoiceNo}</div>` : ""}
      ${bill.paymentMode ? `<div><strong>Payment:</strong> ${bill.paymentMode}</div>` : ""}
      </div>
      <div class="gst-badge">${isIGST ? "IGST (Inter-state)" : "CGST + SGST (Intra-state)"}</div>
    </div>
  </div>

  <div class="addr-row">
    <div class="addr-box">
      <div class="addr-label">Bill To</div>
      <p>${billToLines.join("<br/>") || "—"}</p>
    </div>
    <div class="addr-box">
      <div class="addr-label">Ship To</div>
      <p>${shipLines.length > 0 ? shipLines.join("<br/>") : billToLines.join("<br/>") || "—"}</p>
    </div>
    <div class="addr-box" style="max-width:220px">
      <div class="addr-label">Sold By</div>
      <p>
        <strong style="color:#111">${inv.businessName || "—"}</strong><br/>
        ${inv.state ? `State: ${inv.state}` : ""}
        ${inv.gstin ? `<br/>GSTIN: <span style="font-family:monospace;font-weight:700">${inv.gstin}</span>` : ""}
      </p>
    </div>
  </div>

  ${bill.ewayBill ? `
  <div class="eway-box">
    <div class="addr-label" style="margin-bottom:8px">E-Way Bill Details</div>
    <div class="eway-grid">
      ${bill.ewayBillNo ? `<div><span>EWB No: </span><strong>${bill.ewayBillNo}</strong></div>` : ""}
      ${bill.transportName ? `<div><span>Transporter: </span><strong>${bill.transportName}</strong></div>` : ""}
      ${bill.vehicleNo ? `<div><span>Vehicle: </span><strong>${bill.vehicleNo}</strong></div>` : ""}
    </div>
  </div>` : ""}

  <table class="items">
    <thead>
      <tr>
        <th style="width:30px">#</th>
        <th style="text-align:left">Description of Goods / Services</th>
        <th style="width:80px;text-align:center">HSN/SAC</th>
        <th style="width:50px">Unit</th>
        <th style="width:45px">Qty</th>
        <th style="width:90px;text-align:right">MRP</th>
        <th style="width:90px;text-align:right">Rate<br/><span style="font-size:8px;font-weight:600;opacity:0.7">(ex-GST)</span></th>
        <th style="width:100px;text-align:right">Taxable<br/><span style="font-size:8px;font-weight:600;opacity:0.7">Value</span></th>
        <th style="width:100px;text-align:right">Total<br/><span style="font-size:8px;font-weight:600;opacity:0.7">(incl. GST)</span></th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="7" style="text-align:right;padding:12px">Totals</td>
        <td style="text-align:right;padding:12px">₹${grandTaxable.toFixed(2)}</td>
        <td style="text-align:right;padding:12px">₹${grandTotal.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="totals-row">
    <div class="words-box">
      <div class="label">Amount in Words</div>
      <p>${amountToWords(grandTotal)}</p>
    </div>
    <div class="summary">
      <table>
        <tr><td style="color:#64748b;font-weight:600">Subtotal (ex-GST)</td><td style="text-align:right;font-weight:700">₹${grandTaxable.toFixed(2)}</td></tr>
        ${discount > 0 ? `<tr><td style="color:#ef4444;font-weight:600">Discount</td><td style="text-align:right;color:#ef4444;font-weight:700">-₹${discount.toFixed(2)}</td></tr>` : ""}
        ${gstRows}
        <tr><td style="color:#475569;padding-top:8px;font-weight:700">Total GST</td><td style="text-align:right;padding-top:8px;font-weight:800;color:#0f172a">₹${grandGst.toFixed(2)}</td></tr>
        <tr class="grand"><td>Grand Total</td><td style="text-align:right">₹${grandTotal.toFixed(2)}</td></tr>
      </table>
    </div>
  </div>

  <div class="footer">
    <div class="footer-bank">
      <div class="addr-label">Bank Details</div>
      ${inv.bankName ? `<p>Bank: <strong>${inv.bankName}</strong></p>` : ""}
      ${inv.bankAccount ? `<p>A/C No: <strong>${inv.bankAccount}</strong></p>` : ""}
      ${inv.ifsc ? `<p>IFSC: <strong>${inv.ifsc}</strong></p>` : ""}
      ${inv.upiId ? `<p>UPI: <strong>${inv.upiId}</strong></p>` : ""}
    </div>
    <div class="footer-points">
      <div class="addr-label">Terms & Conditions</div>
      <ul style="padding-left:16px">
        ${footerPoints.map(p => `<li>${p}</li>`).join("")}
      </ul>
    </div>
    <div class="footer-sign">
      <div class="company-name">For ${inv.businessName || "Your Business"}</div>
      ${inv.signatureUrl ? `<img src="${inv.signatureUrl}" style="height:48px;max-width:160px;object-fit:contain;margin-bottom:8px" alt="signature"/>` : ""}
      <div class="sig-line">Authorized Signatory</div>
    </div>
  </div>

</div>
</body>
</html>`;
}

export default function InvoiceModal({ bill, invSettings, vendors, products, onClose }) {
  const T = useT();
  if (!bill) return null;

  const vendor = vendors?.find(v => v.id === bill.vendorId) || null;
  const html = buildHTML(bill, invSettings || {}, vendor);

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 400); }
  };

  return (
    <div className="fade-up" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: "rgba(0,0,0,.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div className="glass-strong spring-in" style={{ borderRadius: T.radiusXl, boxShadow: T.shadowXl, width: "100%", maxWidth: 900, maxHeight: "95vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.borderSubtle}`, flexShrink: 0, background: T.surfaceStrong }}>
          <div>
            <div style={{ fontFamily: T.displayFont, fontWeight: 800, fontSize: 18, color: T.text, letterSpacing: "-0.01em" }}>{bill.isProforma ? "Proforma Invoice" : "Tax Invoice"} — {bill.billNo}</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4, fontWeight: 500 }}>A4 Preview · Print → Save as PDF to download</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <GBtn onClick={handlePrint} icon={<Printer size={16} />}>Print / Download PDF</GBtn>
            <button onClick={onClose} className="btn-ghost" style={{ padding: 8, borderRadius: "50%" }}><X size={18} /></button>
          </div>
        </div>

        {/* Preview — scales down on mobile */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px", background: T.isDark ? "#09090b" : "#e2e8f0" }}>
          <div style={{
            transformOrigin: "top center",
            transform: typeof window !== "undefined" && window.innerWidth < 840 ? `scale(${Math.min(1, (window.innerWidth - 48) / 794)})` : "scale(1)",
            marginBottom: typeof window !== "undefined" && window.innerWidth < 840 ? `-${794 * (1 - Math.min(1, (window.innerWidth - 48) / 794))}px` : "0"
          }}>
            <iframe
              srcDoc={html}
              style={{ width: "794px", height: "1080px", border: "none", borderRadius: 8, background: "#fff", display: "block", margin: "0 auto", boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
              title="Invoice Preview"
            />
          </div>
        </div>

        {/* Footer note */}
        <div style={{ padding: "12px 24px", borderTop: `1px solid ${T.borderSubtle}`, fontSize: 12, color: T.textMuted, flexShrink: 0, background: T.surfaceStrong, fontWeight: 500 }}>
          💡 In print dialog: set Destination → "Save as PDF", Paper size → A4, Margins → None.
          Set invoice details in <strong style={{ color: T.text }}>Settings → Invoice</strong>.
        </div>
      </div>
    </div>
  );
}
