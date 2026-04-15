import React, { useState, useMemo, useEffect } from "react";
import { Plus, X, FileText, ChevronDown, ChevronUp, Truck } from "lucide-react";
import { useT } from "../theme";
import { uid, today, fmtCur, fetchPincodeData, normaliseState, safeNum } from "../utils";
import { GIn, GS, GTa, GBtn, Lbl, Field } from "./UI";
import VendorSearch from "./VendorSearch";
import ProductSearch from "./ProductSearch";

export { default as ProductSearch } from "./ProductSearch";

export default function BillForm({ type, bills, onSave, products, vendors, getStock, existingBill, invoiceSettings }) {
  const T = useT();
  const isEdit = Boolean(existingBill);

  const [date, setDate] = useState(existingBill?.date || today());
  const [vendorId, setVendorId] = useState(existingBill?.vendorId || "");
  const [discount, setDiscount] = useState(existingBill?.discValue?.toString() || "");
  const [discType, setDiscType] = useState(existingBill?.discType || "percent");
  const [notes, setNotes] = useState(existingBill?.notes || "");
  const [gstType, setGstType] = useState(existingBill?.gstType || "cgst_sgst");
  const [gstAutoSet, setGstAutoSet] = useState(false);
  const [paymentMode, setPaymentMode] = useState(existingBill?.paymentMode || "");
  const [purchaseInvoiceNo, setPurchaseInvoiceNo] = useState(existingBill?.purchaseInvoiceNo || "");
  
  const [shipTo, setShipTo] = useState(existingBill?.shipTo || "");
  const [shipAddr, setShipAddr] = useState(() => ({ addr1: "", addr2: "", city: "", state: "", pincode: "" }));
  const upShipAddr = (k, v) => setShipAddr(p => ({...p, [k]: v}));
  const [shipToSameAsBill, setShipToSameAsBill] = useState(!existingBill?.shipTo || existingBill?.shipToSameAsBill !== false);
  
  const [ewayBill, setEwayBill] = useState(existingBill?.ewayBill || false);
  const [ewayBillNo, setEwayBillNo] = useState(existingBill?.ewayBillNo || "");
  const [transportName, setTransportName] = useState(existingBill?.transportName || "");
  const [vehicleNo, setVehicleNo] = useState(existingBill?.vehicleNo || "");

  const [items, setItems] = useState(
    existingBill?.items?.map(i => ({
      id: uid(), productId: i.productId, qty: i.qty,
      price: i.price, gstRate: safeNum(i.gstRate), isDamaged: i.isDamaged || false
    })) || [{ id: uid(), productId: "", qty: 1, price: "", gstRate: 0, isDamaged: false }]
  );

  useEffect(() => {
    if (isEdit) return;
    const companyState = normaliseState(invoiceSettings?.state);
    if (!companyState) return;

    const vendor = (vendors||[]).find(v => v.id === vendorId);
    if (!vendor) { setGstAutoSet(false); return; }

    let compareState = normaliseState(vendor.state);
    if (type === "sale" && !shipToSameAsBill && shipAddr.state) {
      compareState = normaliseState(shipAddr.state);
    }

    if (!compareState) { setGstAutoSet(false); return; }

    const isInterState = companyState !== compareState;
    setGstType(isInterState ? "igst" : "cgst_sgst");
    setGstAutoSet(true);
  }, [vendorId, vendors, invoiceSettings?.state, shipToSameAsBill, shipAddr.state, type, isEdit]);

  useEffect(() => {
    if (type !== "sale") return;
    const v = (vendors||[]).find(x => x.id === vendorId);
    if (v && shipToSameAsBill) {
      const addr = [v.name, v.address1, v.address2, v.city, v.state, v.pincode].filter(Boolean).join(", ");
      setShipTo(addr);
    }
  }, [vendorId, shipToSameAsBill]);

  const billNo = useMemo(() => {
    if (isEdit) return existingBill.billNo;
    if (type === "sale") {
      const prefix = invoiceSettings?.saleSeries || "SALE-";
      const startNum = Number(invoiceSettings?.saleSeriesStart || 1);
      const saleBills = (bills||[]).filter(b => b.type === "sale");
      let maxNum = startNum - 1;
      saleBills.forEach(b => {
        const noStr = b.billNo?.replace(prefix, "");
        const n = parseInt(noStr, 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      });
      return `${prefix}${String(maxNum + 1).padStart(4, "0")}`;
    } else {
      return purchaseInvoiceNo || "";
    }
  }, [bills, type, isEdit, existingBill, invoiceSettings, purchaseInvoiceNo]);

  const addItem = () => setItems(p => [...p, { id: uid(), productId: "", qty: 1, price: "", gstRate: 0, isDamaged: false }]);
  const remItem = id => setItems(p => p.filter(i => i.id !== id));
  const upItem = (id, k, v2) => setItems(p => p.map(i => {
    if (i.id !== id) return i;
    const u = { ...i, [k]: v2 };
    if (k === "productId") {
      const pr = products.find(x => x.id === v2);
      if (pr) { u.price = type === "sale" ? pr.mrp : pr.purchasePrice; u.gstRate = safeNum(pr.gstRate); }
    }
    return u;
  }));

  const valid = items.filter(i => i.productId && Number(i.qty) > 0 && Number(i.price) >= 0);
  const subtotal = valid.reduce((s, i) => s + Number(i.qty) * Number(i.price), 0);
  const discAmt = type === "sale"
    ? (discType === "percent" ? subtotal * Number(discount || 0) / 100 : Math.min(Number(discount || 0), subtotal))
    : 0;
  const saleTotal = subtotal - discAmt;
  const effectiveFactor = subtotal > 0 ? saleTotal / subtotal : 1;

  const totalGst = valid.reduce((s, i) => {
    const rate = Number(i.gstRate || 0);
    const lineBase = Number(i.qty) * Number(i.price);
    return s + (type === "sale"
      ? lineBase * effectiveFactor * rate / (100 + rate)
      : lineBase * rate / 100);
  }, 0);

  const total = type === "sale" ? saleTotal : subtotal + totalGst;

  const handleSave = () => {
    if (type === "purchase" && !purchaseInvoiceNo && !isEdit) {
      alert("Please enter the vendor's invoice number"); return;
    }
    if (valid.length === 0) { alert("Add at least one product with qty > 0"); return; }
    if (!vendorId) { alert("Select a vendor"); return; }

    const selectedVendor = (vendors||[]).find(v => v.id === vendorId);
    const billToAddress = selectedVendor
      ? [selectedVendor.name, selectedVendor.address1, selectedVendor.address2, selectedVendor.city, selectedVendor.state, selectedVendor.pincode].filter(Boolean).join(", ")
      : "";

    onSave({
      id: existingBill?.id || uid(),
      billNo: type === "purchase" ? purchaseInvoiceNo : billNo,
      type, date, vendorId,
      gstType,
      billToAddress,
      shipTo: type === "sale" ? (shipToSameAsBill ? billToAddress : [shipAddr.contactName, shipAddr.addr1, shipAddr.addr2, shipAddr.city, shipAddr.state, shipAddr.pincode].filter(Boolean).join(", ")) : "",
      shipToSameAsBill: type === "sale" ? shipToSameAsBill : true,
      ewayBill: type === "sale" ? ewayBill : false,
      ewayBillNo: type === "sale" && ewayBill ? ewayBillNo : "",
      transportName: type === "sale" && ewayBill ? transportName : "",
      vehicleNo: type === "sale" && ewayBill ? vehicleNo : "",
      items: valid.map(i => {
        const rate = Number(i.gstRate || 0);
        const lineBase = Number(i.qty) * Number(i.price);
        let gstPerUnit = 0, effectivePrice = Number(i.price);
        if (type === "sale") {
          effectivePrice = Number(i.price) * effectiveFactor;
          gstPerUnit = effectivePrice * rate / (100 + rate);
        } else {
          gstPerUnit = effectivePrice * rate / 100;
        }
        return {
          productId: i.productId,
          productName: products.find(p => p.id === i.productId)?.name || "",
          hsn: products.find(p => p.id === i.productId)?.hsn || "",
          unit: products.find(p => p.id === i.productId)?.unit || "Pcs",
          qty: Number(i.qty),
          price: Number(i.price),
          effectivePrice,
          gstRate: rate,
          gstAmount: gstPerUnit * Number(i.qty),
          isDamaged: Boolean(i.isDamaged),
          mrp: products.find(p => p.id === i.productId)?.mrp || Number(i.price)
        };
      }),
      subtotal,
      discType, discValue: Number(discount || 0), discAmount: discAmt,
      totalGst: type === "purchase" ? totalGst : 0,
      saleGstInfo: type === "sale" ? totalGst : 0,
      total,
      notes,
      purchaseInvoiceNo: type === "purchase" ? purchaseInvoiceNo : "",
      ts: existingBill?.ts || new Date().toISOString(),
      updatedTs: isEdit ? new Date().toISOString() : undefined
    });
  };

  const selectedVendor = (vendors||[]).find(v => v.id === vendorId);

  return (
    <form id={type + "-form"} onSubmit={e => { e.preventDefault(); handleSave(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <div className="glass" style={{ padding: "10px 14px", borderRadius: T.radius, background: T.accentBg, display: "flex", alignItems: "center", gap: 10, border: `1px solid ${T.accent}30` }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${T.accent}50` }}>
          <FileText size={12} color="#fff" />
        </div>
        {type === "sale"
          ? <span style={{ fontSize: 14, fontWeight: 800, color: T.accent, letterSpacing: "0.02em" }}>{billNo || "Series not set"}</span>
          : <span style={{ fontSize: 13, fontWeight: 800, color: T.accent, letterSpacing: "0.02em" }}>{purchaseInvoiceNo || "Enter vendor invoice no."}</span>}
        {isEdit && <span className="spring-in" style={{ fontSize:10, background: T.amber, color: "#fff", padding: "2px 8px", borderRadius: T.radiusFull, fontWeight: 800, letterSpacing: "0.05em", boxShadow: `0 2px 6px ${T.amber}50` }}>EDITING</span>}
        <span className="hide-mob" style={{ fontSize: 11, color: T.textSub, marginLeft: "auto", fontWeight: 600 }}>
          {type === "sale" ? "Sales Bill — MRP incl. GST" : "Purchase Order — Cost ex-GST"}
        </span>
      </div>

      {type === "purchase" && (
        <div className="glass" style={{ padding: "14px 16px", borderRadius: T.radius }}>
          <Field label="Vendor Invoice Number" req>
            <GIn value={purchaseInvoiceNo} onChange={e => setPurchaseInvoiceNo(e.target.value)} placeholder="e.g. INV-2425-001" />
          </Field>
        </div>
      )}

      <div className="glass fgrid" style={{ padding: "16px", borderRadius: T.radius }}>
        <Field label="Date" req><GIn type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Vendor / Customer" req>
          <VendorSearch value={vendorId} onChange={v => setVendorId(v)} vendors={vendors||[]} placeholder="Search by name, GSTIN…" />
        </Field>
        {selectedVendor && (
          <div className="s2 spring-down" style={{ padding: "10px 14px", borderRadius: T.radius, background: T.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: `1px solid ${T.borderSubtle}`, fontSize: 11, color: T.textSub, lineHeight: 1.5 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {[selectedVendor.address1, selectedVendor.city, selectedVendor.state].filter(Boolean).length > 0 && (
                <div><span style={{ color: T.textMuted, fontWeight: 600 }}>Address: </span>{[selectedVendor.address1, selectedVendor.address2, selectedVendor.city, selectedVendor.state, selectedVendor.pincode].filter(Boolean).join(", ")}</div>
              )}
              {selectedVendor.gstin && <div><span style={{ color: T.textMuted, fontWeight: 600 }}>GSTIN: </span><span style={{ fontFamily: "monospace", fontWeight: 700, color: T.text }}>{selectedVendor.gstin}</span></div>}
              {selectedVendor.contact && <div><span style={{ color: T.textMuted, fontWeight: 600 }}>Contact: </span><span style={{ fontWeight: 600, color: T.text }}>{selectedVendor.contact}</span></div>}
            </div>
          </div>
        )}
      </div>

      <div className="glass" style={{ padding: "14px 16px", borderRadius: T.radius, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: T.textSub, letterSpacing: "0.05em" }}>GST TYPE</span>
        {gstAutoSet
          ? <div className="spring-in" style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ padding:"4px 12px", borderRadius:T.radiusFull, background:gstType==="igst"?T.blueBg:T.greenBg, color:gstType==="igst"?T.blue:T.green, fontSize:11, fontWeight:700, boxShadow: `0 2px 8px ${gstType==="igst"?T.blue:T.green}30` }}>
                {gstType === "igst" ? "IGST · Inter-state" : "CGST + SGST · Intra-state"}
              </span>
              <span style={{ fontSize:11, color:T.textMuted, fontWeight: 600 }}>Auto-detected</span>
              <button type="button" className="liquid-trans" onClick={() => setGstAutoSet(false)} style={{ fontSize:11, color:T.accent, background:"none", border:"none", cursor:"pointer", fontWeight: 700 }}>Change</button>
            </div>
          : <div style={{ display:"flex", gap:4, background:T.isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)", borderRadius:T.radius, padding:4 }}>
              {[{k:"cgst_sgst",l:"CGST + SGST",sub:"Intra-state"},{k:"igst",l:"IGST",sub:"Inter-state"}].map(g=>(
                <button type="button" className="liquid-trans" key={g.k} onClick={()=>setGstType(g.k)} style={{ padding:"6px 14px", borderRadius:T.radius, border:"none", cursor:"pointer", background:gstType===g.k?T.accent:"transparent", color:gstType===g.k?"#fff":T.textSub, fontSize:11, fontWeight:700, boxShadow: gstType===g.k ? `0 2px 8px ${T.accent}50` : "none" }}>
                  {g.l} <span style={{fontSize:10,opacity:.8, fontWeight: 500, marginLeft: 4}}>({g.sub})</span>
                </button>
              ))}
            </div>
        }
      </div>

      {type === "sale" && (
        <div className="glass" style={{ padding: "14px 16px", borderRadius: T.radius }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: shipToSameAsBill ? 0 : 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Truck size={12} color={T.textSub} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Shipping Address</span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="sameAsBill" className="cb liquid-trans" checked={shipToSameAsBill} onChange={e => setShipToSameAsBill(e.target.checked)} />
              <label htmlFor="sameAsBill" style={{ fontSize: 11, color: T.textSub, cursor: "pointer", fontWeight: 600 }}>Same as Billing</label>
            </div>
          </div>
          {!shipToSameAsBill && (
            <div className="spring-down fgrid" style={{ paddingTop: 12, borderTop: `1px solid ${T.borderSubtle}` }}>
              <Field label="Contact Name"><GIn value={shipAddr.contactName||""} onChange={e=>upShipAddr("contactName",e.target.value)} placeholder="Recipient name" /></Field>
              <Field label="Contact Phone"><GIn value={shipAddr.contactPhone||""} onChange={e=>upShipAddr("contactPhone",e.target.value)} placeholder="Phone number" /></Field>
              <Field label="Address Line 1" cl="s2"><GIn value={shipAddr.addr1||""} onChange={e=>upShipAddr("addr1",e.target.value)} placeholder="Building / Street" /></Field>
              <Field label="Address Line 2" cl="s2"><GIn value={shipAddr.addr2||""} onChange={e=>upShipAddr("addr2",e.target.value)} placeholder="Area / Landmark (optional)" /></Field>
              <Field label="Pincode">
                <GIn value={shipAddr.pincode||""} maxLength={6} onChange={async e=>{
                  const pin=e.target.value; upShipAddr("pincode",pin);
                  if(String(pin).length===6){const d=await fetchPincodeData(pin);if(d){upShipAddr("city",d.city);upShipAddr("state",d.state);}}
                }} placeholder="6-digit PIN" />
                {shipAddr.pincode?.length===6&&shipAddr.city&&<div className="spring-in" style={{fontSize:11,color:T.green,marginTop:4,fontWeight:600}}>✓ {shipAddr.city}, {shipAddr.state}</div>}
              </Field>
              <Field label="City"><GIn value={shipAddr.city||""} onChange={e=>upShipAddr("city",e.target.value)} /></Field>
              <Field label="State" cl="s2"><GIn value={shipAddr.state||""} onChange={e=>upShipAddr("state",e.target.value)} /></Field>
            </div>
          )}
        </div>
      )}

      {/* PRODUCTS SECTION - OVERFLOW VISIBLE */}
      <div className="glass" style={{ borderRadius: T.radius, overflow: "visible", padding: 0 }}>
        <div style={{ padding: "12px 16px", background: T.surfaceStrong, borderBottom: `1px solid ${T.borderSubtle}` }}>
          <Lbl c="Line Items" req />
        </div>
        <div style={{ overflow: "visible" }}>
          
          <div className="hide-mob" style={{ display: "grid", gridTemplateColumns: "1fr 70px 100px 90px 32px", gap: 10, padding: "10px 16px", background: T.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", borderBottom: `1px solid ${T.borderSubtle}` }}>
            {["Product", "Qty", type === "sale" ? "MRP (incl GST)" : "Cost (ex-GST)", "Line Total", ""].map((h, i) => (
              <div key={i} style={{ fontSize:10, fontWeight: 800, color: T.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>
          
          {items.map((item, i) => {
            const pr = products.find(p => p.id === item.productId);
            const stk = item.productId ? getStock(item.productId) : null;
            const rate = safeNum(item.gstRate);
            const lineBase = Number(item.qty || 0) * Number(item.price || 0);
            const effectiveLine = lineBase * effectiveFactor;
            const lineGst = type === "sale" ? effectiveLine * rate / (100 + rate) : lineBase * rate / 100;
            const lineTotal = type === "sale" ? effectiveLine : lineBase + lineGst;

            return (
              <div key={item.id} className="liquid-trans" style={{ borderBottom: `1px solid ${T.borderSubtle}`, padding: "14px 16px", background: T.surfaceGlass, overflow: "visible" }}>
                
                {/* Desktop View */}
                <div className="hide-mob" style={{ display: "grid", gridTemplateColumns: "1fr 70px 100px 90px 32px", gap: 10, alignItems: "start", overflow: "visible" }}>
                  <div style={{ overflow: "visible" }}>
                    <ProductSearch value={item.productId} onChange={v => upItem(item.id, "productId", v)} products={products} getStock={getStock} placeholder={`Search Product ${i + 1}`} />
                    {stk !== null && (
                      <div className="spring-in" style={{ fontSize:11, marginTop: 4, fontWeight: 600, color: stk <= 0 ? T.red : stk <= (pr?.minStock || 5) ? T.amber : T.textMuted }}>
                        Stock: {stk} <span style={{ opacity: 0.5, margin: "0 6px" }}>|</span> <span style={{ color: T.textSub }}>GST {rate}%</span>
                      </div>
                    )}
                  </div>
                  <div><GIn type="number" min="1" value={item.qty} onChange={e => upItem(item.id, "qty", e.target.value)} /></div>
                  <div>
                    <GIn type="number" min="0" step="0.01" value={item.price} onChange={e => upItem(item.id, "price", e.target.value)} placeholder="0.00" />
                    {rate > 0 && lineBase > 0 && <div className="spring-in" style={{ fontSize:10, marginTop: 4, color: T.textMuted, fontWeight: 500 }}>{type === "purchase" ? `+GST: ${fmtCur(lineGst)}` : `GST: ${fmtCur(lineGst)}`}</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text, padding: "8px 0" }}>{fmtCur(lineTotal)}</div>
                    {discAmt > 0 && lineBase > 0 && type === "sale" && <div className="spring-in" style={{ fontSize:10, color: T.textMuted, fontWeight: 500 }}>was {fmtCur(lineBase)}</div>}
                  </div>
                  <button type="button" onClick={() => remItem(item.id)} className="btn-danger liquid-trans" style={{ width: 32, height: 34, padding: 0, opacity: items.length <= 1 ? .3 : 1 }} disabled={items.length <= 1}>
                    <X size={14} />
                  </button>
                </div>

                {/* Mobile View */}
                <div className="bill-item-sub">
                  <div style={{ marginBottom: 10, overflow: "visible" }}>
                    <ProductSearch value={item.productId} onChange={v => upItem(item.id, "productId", v)} products={products} getStock={getStock} placeholder={`Search Product ${i + 1}`} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 4 }}>QTY</div>
                      <GIn type="number" min="1" value={item.qty} onChange={e => upItem(item.id, "qty", e.target.value)} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 4 }}>{type === "sale" ? "MRP" : "COST"}</div>
                      <GIn type="number" min="0" step="0.01" value={item.price} onChange={e => upItem(item.id, "price", e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 4 }}>TOTAL</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: T.text, padding: "8px 0" }}>{fmtCur(lineTotal)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                    <button type="button" onClick={() => remItem(item.id)} className="btn-danger liquid-trans" style={{ padding: "6px 12px", fontSize: 11, opacity: items.length <= 1 ? .3 : 1 }} disabled={items.length <= 1}>
                      Remove Item
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ padding: "12px 16px", background: T.surfaceStrong }}>
            <GBtn v="ghost" sz="sm" onClick={addItem} icon={<Plus size={14} />}>Add Another Product</GBtn>
          </div>
        </div>
      </div>

      <div className="fgrid">
        {type === "sale"
          ? <div className="glass" style={{ padding: "16px", borderRadius: T.radius }}>
              <Field label="Discount">
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ display: "flex", gap: 4, background: T.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", borderRadius: T.radius, padding: 4, flexShrink: 0 }}>
                    {[{ k: "percent", l: "%" }, { k: "amount", l: "₹" }].map(d => (
                      <button type="button" key={d.k} className="liquid-trans" onClick={() => setDiscType(d.k)} style={{ padding: "4px 12px", borderRadius: T.radius, border: "none", cursor: "pointer", background: discType === d.k ? T.accent : "transparent", color: discType === d.k ? "#fff" : T.textSub, fontSize: 12, fontWeight: 700, boxShadow: discType === d.k ? `0 2px 8px ${T.accent}40` : "none" }}>{d.l}</button>
                    ))}
                  </div>
                  <GIn type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
                </div>
              </Field>
            </div>
          : <div />
        }
        
        <div className="glass" style={{ padding: "16px", borderRadius: T.radius, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSub }}>
            <span style={{ fontWeight: 600 }}>{type === "sale" ? "Subtotal (MRP)" : "Subtotal (ex-GST)"}</span>
            <span style={{ fontWeight: 700, color: T.text }}>{fmtCur(subtotal)}</span>
          </div>
          {type === "sale" && discAmt > 0 && (
            <div className="spring-down" style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.red }}>
              <span style={{ fontWeight: 600 }}>Discount ({discType === "percent" ? `${discount}%` : `₹${discount}`})</span>
              <span style={{ fontWeight: 700 }}>–{fmtCur(discAmt)}</span>
            </div>
          )}
          {type === "purchase" && totalGst > 0 && (
            <div className="spring-down" style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.amber }}>
              <span style={{ fontWeight: 600 }}>Total GST</span>
              <span style={{ fontWeight: 700 }}>+{fmtCur(totalGst)}</span>
            </div>
          )}
          {type === "sale" && totalGst > 0 && (
            <div className="spring-in" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMuted }}>
              <span style={{ fontWeight: 500 }}>GST incl. in total</span>
              <span style={{ fontWeight: 600 }}>{fmtCur(totalGst)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: T.text, borderTop: `1px solid ${T.borderSubtle}`, paddingTop: 10, marginTop: 2 }}>
            <span>Grand Total</span>
            <span style={{ color: T.accent }}>{fmtCur(total)}</span>
          </div>
          {type === "sale" && totalGst > 0 && (
            <div className="spring-in" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMuted, marginTop: 2 }}>
              <span style={{ fontWeight: 500 }}>Net Revenue (ex-GST)</span>
              <span style={{ fontWeight: 700, color: T.textSub }}>{fmtCur(total - totalGst)}</span>
            </div>
          )}
        </div>
      </div>

      {type === "sale" && (
        <div className="glass" style={{ borderRadius: T.radius, overflow: "hidden" }}>
          <button type="button" onClick={() => setEwayBill(p => !p)} className="liquid-trans" style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", cursor: "pointer", color: T.text }}>
            <input type="checkbox" className="cb" checked={ewayBill} readOnly style={{ pointerEvents: "none" }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>E-Way Bill Required</span>
            {ewayBill ? <ChevronUp size={14} color={T.textMuted} style={{ marginLeft: "auto" }} /> : <ChevronDown size={14} color={T.textMuted} style={{ marginLeft: "auto" }} />}
          </button>
          {ewayBill && (
            <div className="spring-down fgrid" style={{ padding: "0 16px 16px" }}>
              <Field label="E-Way Bill No."><GIn value={ewayBillNo} onChange={e => setEwayBillNo(e.target.value)} placeholder="EWB-XXXX-XXXX" /></Field>
              <Field label="Transporter Name"><GIn value={transportName} onChange={e => setTransportName(e.target.value)} placeholder="Transport company name" /></Field>
              <Field label="Vehicle No." cl="s2"><GIn value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="MH 12 AB 1234" /></Field>
            </div>
          )}
        </div>
      )}

      <div className="glass" style={{ padding: "16px", borderRadius: T.radius }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: T.textSub, letterSpacing: "0.05em" }}>PAYMENT MODE</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Cash", "NEFT / RTGS", "UPI", "Cheque", "Credit", "On Account"].map(pm => (
              <button type="button" key={pm} className="liquid-trans" onClick={() => setPaymentMode(paymentMode === pm ? "" : pm)} style={{ padding: "4px 12px", borderRadius: T.radiusFull, fontSize: 11, fontWeight: 700, border: `1px solid ${paymentMode === pm ? T.accent : T.borderSubtle}`, cursor: "pointer", background: paymentMode === pm ? T.accent : "transparent", color: paymentMode === pm ? "#fff" : T.textSub, boxShadow: paymentMode === pm ? `0 2px 8px ${T.accent}40` : "none" }}>{pm}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: "16px", borderRadius: T.radius }}>
        <Field label="Notes / Reference">
          <GTa value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Remarks, reference, packing instructions…" />
        </Field>
      </div>

    </form>
  );
}
