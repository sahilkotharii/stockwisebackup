import React, { useState, useMemo, useRef, useEffect } from "react";
import { Box, CheckCircle, AlertTriangle, AlertOctagon, Download, Search, Edit2, X, Plus, Layers, Upload, DollarSign } from "lucide-react";
import { useT } from "../theme";
import { KCard, GBtn, GS, GIn, Field, Modal, StChip, Pager } from "../components/UI";
import { fmtCur, toCSV, dlCSV, uid, today, calcMgn } from "../utils";

export default function Inventory({ ctx }) {
  const T = useT();
  const { products, transactions, categories, getStock, saveTransactions, user, addLog } = ctx;
  const isAdmin = user.role === "admin";

  const [catF, setCatF] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("stock");
  const [stockF, setStockF] = useState("all"); 
  const [pg, setPg] = useState(1);
  const [ps, setPs] = useState(50);
  useEffect(() => setPg(1), [search, catF, sortBy, stockF]);

  const csvRef = useRef(null);
  const handleOsCsvFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = ev.target.result.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { alert("File empty"); return; }
      const hasHeader = lines[0].toLowerCase().includes("sku") || lines[0].toLowerCase().includes("name");
      const headers = hasHeader ? lines[0].toLowerCase().split(",").map(h => h.trim().replace(/[^a-z]/g,"")) : ["name","sku","qty","date"];
      const dataLines = hasHeader ? lines.slice(1) : lines;
      const skuIdx = headers.indexOf("sku"); const nameIdx = headers.indexOf("name");
      const qtyIdx = headers.indexOf("qty"); const dateIdx = headers.indexOf("date");

      let updated = 0;
      const newTxns = [...transactions.filter(t => t.type !== "opening")]; 
      const existingOpening = transactions.filter(t => t.type === "opening");
      dataLines.forEach(line => {
        const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g,""));
        const skuVal = skuIdx >= 0 ? cols[skuIdx] : "";
        const nameVal = nameIdx >= 0 ? cols[nameIdx] : "";
        const qty = parseInt(qtyIdx >= 0 ? cols[qtyIdx] : cols[2]) || 0;
        const dt = dateIdx >= 0 ? cols[dateIdx] : today();
        if (qty <= 0) return;
        const pr = products.find(p =>
          (skuVal && p.sku?.toLowerCase() === skuVal.toLowerCase()) ||
          (nameVal && p.name?.toLowerCase() === nameVal.toLowerCase())
        );
        if (!pr) return;
        newTxns.push({ id: uid(), productId: pr.id, type: "opening", qty, price: Number(pr.purchasePrice||0), effectivePrice: Number(pr.purchasePrice||0), gstRate:0, gstAmount:0, vendorId:null, channelId:null, date: dt||today(), notes:"Bulk opening stock import", userId:user.id, userName:user.name, billId:null, isDamaged:false });
        updated++;
      });
      existingOpening.forEach(t => {
        if (!newTxns.find(x => x.productId === t.productId && x.type === "opening")) newTxns.push(t);
      });
      saveTransactions(newTxns);
      addLog("bulk import", "opening stock", `${updated} products`);
      alert(` Updated opening stock for ${updated} products`);
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const exportOsTemplate = () => {
    const header = "name,sku,qty,date";
    const rows = products.slice(0, 3).map(p => {
      const stock = transactions.filter(t=>t.productId===p.id&&t.type==="opening").reduce((s,t)=>s+Number(t.qty),0);
      return `"${p.name}",${p.sku},${stock},${today()}`;
    });
    const csv = [header, ...rows, ...products.slice(3).map(p=>`"${p.name}",${p.sku},0,${today()}`)].join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download = "opening_stock_template.csv"; a.click();
  };

  const [editOsModal, setEditOsModal] = useState(false);
  const [editOsProduct, setEditOsProduct] = useState(null);
  const [editOsQty, setEditOsQty] = useState("");
  const [editOsDate, setEditOsDate] = useState(today());

  const openEditOs = (p) => {
    const currentOpening = transactions.filter(t => t.productId === p.id && t.type === "opening").reduce((s, t) => s + Number(t.qty), 0);
    setEditOsProduct(p);
    setEditOsQty(currentOpening.toString());
    setEditOsDate(today());
    setEditOsModal(true);
  };

  const saveEditOs = () => {
    if (!editOsProduct) return;
    const newQty = parseInt(editOsQty) || 0;
    if (newQty < 0) { alert("Quantity cannot be negative"); return; }
    const filtered = transactions.filter(t => !(t.productId === editOsProduct.id && t.type === "opening"));
    const newTxns = newQty > 0
      ? [{
          id: uid(),
          productId: editOsProduct.id,
          type: "opening",
          qty: newQty,
          price: Number(editOsProduct.purchasePrice || 0),
          effectivePrice: Number(editOsProduct.purchasePrice || 0),
          gstRate: 0,
          gstAmount: 0,
          vendorId: null,
          date: editOsDate,
          notes: "Opening stock (edited)",
          userId: user.id, userName: user.name,
          billId: null, isDamaged: false
        }]
      : [];
    saveTransactions([...newTxns, ...filtered]);
    addLog("edited", "opening stock", editOsProduct.name, `Set to ${newQty} units`);
    setEditOsModal(false);
    setEditOsProduct(null);
  };

  const productStats = useMemo(() => products.map(p => {
    const all = transactions.filter(t => t.productId === p.id);
    const opening = all.filter(t => t.type === "opening").reduce((s, t) => s + Number(t.qty), 0);
    const purchased = all.filter(t => t.type === "purchase").reduce((s, t) => s + Number(t.qty), 0);
    const sold = all.filter(t => t.type === "sale").reduce((s, t) => s + Number(t.qty), 0);
    const salesReturned = all.filter(t => t.type === "return").reduce((s, t) => s + (Number(t.qty)||0), 0);
    const purReturned = all.filter(t => t.type === "purchase_return").reduce((s, t) => s + (Number(t.qty)||0), 0);
    const damaged = all.filter(t => t.type === "damaged" || t.isDamaged).reduce((s, t) => s + (Number(t.qty)||0), 0);
    const stock = getStock(p.id);
    const value = stock * Number(p.purchasePrice || 0);
    return { ...p, opening, purchased, sold, salesReturned, purReturned, damaged, stock, value };
  }), [products, transactions, getStock]);

  const filtered = useMemo(() => {
    let d = productStats.filter(p => {
      if (catF && p.categoryId !== catF) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.sku || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    if (stockF === "healthy") d = d.filter(p => p.stock > Number(p.minStock||0));
    else if (stockF === "low") d = d.filter(p => p.stock > 0 && p.stock <= Number(p.minStock||0));
    else if (stockF === "oos") d = d.filter(p => p.stock <= 0);
    else if (stockF === "dead") d = d.filter(p => p.sold === 0 && p.stock > 0);
    if (sortBy === "stock") d.sort((a, b) => a.stock - b.stock);
    else if (sortBy === "value") d.sort((a, b) => b.value - a.value);
    else if (sortBy === "sold") d.sort((a, b) => b.sold - a.sold);
    else if (sortBy === "name") d.sort((a, b) => a.name.localeCompare(b.name));
    return d;
  }, [productStats, catF, search, sortBy, stockF]);

  const totalValue = filtered.reduce((s, p) => s + p.value, 0);
  const oos = filtered.filter(p => p.stock <= 0);
  const low = filtered.filter(p => p.stock > 0 && p.stock <= Number(p.minStock || 0));
  const healthy = filtered.filter(p => p.stock > Number(p.minStock || 0));

  return <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

    <div className="kgrid" style={{ gap: 20 }}>
      <KCard label="Inventory Value" value={fmtCur(totalValue)} sub={`ex-GST · ${productStats.length} products`} icon={Box} color={T.accent} onClick={() => setStockF("all")} active={stockF==="all"} />
      <KCard label="Healthy Stock" value={healthy.length.toString()} sub="Click to filter" icon={CheckCircle} color={T.green} onClick={() => setStockF(stockF==="healthy"?"all":"healthy")} active={stockF==="healthy"} />
      <KCard label="Low Stock" value={low.length.toString()} sub="Click to filter" icon={AlertTriangle} color={T.amber} onClick={() => setStockF(stockF==="low"?"all":"low")} active={stockF==="low"} />
      <KCard label="Out of Stock" value={oos.length.toString()} sub="Click to filter" icon={AlertOctagon} color={T.red} onClick={() => setStockF(stockF==="oos"?"all":"oos")} active={stockF==="oos"} />
    </div>

    <div className="glass spring-in liquid-trans" style={{ padding: 24, borderRadius: T.radius, background: `linear-gradient(135deg, ${T.accentBg}, ${T.accent}15)`, border: `1px solid ${T.accent}30`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div className="liquid-trans" style={{ width: 48, height: 48, borderRadius: T.radius, background: `linear-gradient(135deg,${T.accent},${T.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${T.accent}50`, flexShrink: 0 }}><DollarSign size={24} color="#fff" /></div>
        <div>
          <div style={{ fontFamily: T.displayFont, fontWeight: 800, fontSize: 26, color: T.accent, letterSpacing: "-0.02em" }}>{fmtCur(totalValue)}</div>
          <div style={{ fontSize: 13, color: T.textSub, marginTop: 2, fontWeight: 500 }}>Total Inventory Value in Hand <span style={{ color: T.textMuted }}>(ex-GST · at purchase price)</span></div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div className="liquid-trans" style={{ padding: "8px 16px", borderRadius: T.radiusFull, background: T.greenBg, border: `1px solid ${T.green}25`, fontSize: 13 }}><span style={{ color: T.green, fontWeight: 700 }}>{healthy.length}</span><span style={{ color: T.textMuted, fontWeight: 500 }}> healthy</span></div>
        <div className="liquid-trans" style={{ padding: "8px 16px", borderRadius: T.radiusFull, background: T.amberBg, border: `1px solid ${T.amber}25`, fontSize: 13 }}><span style={{ color: T.amber, fontWeight: 700 }}>{low.length}</span><span style={{ color: T.textMuted, fontWeight: 500 }}> low</span></div>
        <div className="liquid-trans" style={{ padding: "8px 16px", borderRadius: T.radiusFull, background: T.redBg, border: `1px solid ${T.red}25`, fontSize: 13 }}><span style={{ color: T.red, fontWeight: 700 }}>{oos.length}</span><span style={{ color: T.textMuted, fontWeight: 500 }}> OOS</span></div>
      </div>
    </div>

    <div className="glass fade-up" style={{ borderRadius: T.radius, overflow: "hidden" }}>
      <div style={{ padding: 24, borderBottom: `1px solid ${T.borderSubtle}`, background: T.surfaceGlass }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: T.displayFont, fontWeight: 800, fontSize: 18, color: T.text }}>Stock Register</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Inventory value calculated at ex-GST purchase price</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {isAdmin && <>
              <GBtn sz="sm" v="ghost" onClick={exportOsTemplate} icon={<Download size={14} />}>Opening Stock Template</GBtn>
              <GBtn sz="sm" v="ghost" onClick={() => csvRef.current?.click()} icon={<Upload size={14} />}>Import Opening Stock</GBtn>
              <input ref={csvRef} type="file" accept=".csv" onChange={handleOsCsvFile} style={{ display: "none" }} />
            </>}
            <GBtn v="ghost" sz="sm" onClick={() => dlCSV(toCSV(filtered.map(p => ({ name: p.name, sku: p.sku, opening: p.opening, purchased: p.purchased, sold: p.sold, salesReturned: p.salesReturned, purReturned: p.purReturned, damaged: p.damaged, stock: p.stock, value: p.value })), ["name","sku","opening","purchased","sold","salesReturned","purReturned","damaged","stock","value"]), "inventory")} icon={<Download size={14} />}>Export Register</GBtn>
          </div>
        </div>
        <div className="filter-wrap" style={{ gap: 12 }}>
          <div style={{ position: "relative", flex: "1 1 200px" }}>
            <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product…" />
          </div>
          <GS value={catF} onChange={e => setCatF(e.target.value)} placeholder="All Categories">
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </GS>
          <GS value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="stock">Sort: Stock ↑</option>
            <option value="value">Sort: Value ↓</option>
            <option value="sold">Sort: Sold ↓</option>
            <option value="name">Sort: Name</option>
          </GS>
        </div>
        
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {[
            { k: "all",     l: "All",           color: T.accent,  count: productStats.length },
            { k: "healthy", l: "Healthy",       color: T.green,   count: productStats.filter(p => p.stock > Number(p.minStock||0)).length },
            { k: "low",     l: "Low Stock",     color: T.amber,   count: productStats.filter(p => p.stock > 0 && p.stock <= Number(p.minStock||0)).length },
            { k: "oos",     l: "Out of Stock",  color: T.red,     count: productStats.filter(p => p.stock <= 0).length },
            { k: "dead",    l: "Dead Stock",    color: "#7C3AED", count: productStats.filter(p => p.sold === 0 && p.stock > 0).length },
          ].map(f => (
            <button key={f.k} className="liquid-trans" onClick={() => setStockF(stockF === f.k && f.k !== "all" ? "all" : f.k)}
              style={{
                padding: "6px 14px", borderRadius: T.radiusFull, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${stockF === f.k ? f.color : "transparent"}`,
                cursor: "pointer",
                background: stockF === f.k ? `${f.color}15` : T.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                color: stockF === f.k ? f.color : T.textSub,
                display: "flex", alignItems: "center", gap: 6,
                boxShadow: stockF === f.k ? `0 2px 8px ${f.color}30` : "none"
              }}>
              {f.l}
              <span style={{
                background: stockF === f.k ? f.color : T.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
                color: stockF === f.k ? "#fff" : T.textMuted,
                padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, minWidth: 20, textAlign: "center"
              }}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: "auto", background: T.surfaceGlass }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: T.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)" }}>
              {["Product", "SKU", "Category", "Opening", "+Purchased", "-Sold", "+Sale Ret", "-Pur Ret", "-Damaged", "= Stock", "Value (ex-GST)", "Status", isAdmin ? "Edit" : ""].filter(Boolean).map(h => (
                <th key={h} className="th" style={{ textAlign: ["Opening", "+Purchased", "-Sold", "+Sale Ret", "-Pur Ret", "-Damaged", "= Stock", "Value (ex-GST)"].includes(h) ? "right" : "left" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice((pg-1)*ps, pg*ps).map(p => {
              const cat = categories.find(c => c.id === p.categoryId);
              return (
                <tr key={p.id} className="trow liquid-trans">
                  <td className="td" style={{ maxWidth: 220 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {p.imageUrl && <img src={p.imageUrl} alt="" className="liquid-trans" style={{ width: 32, height: 32, borderRadius: T.radius, objectFit: "cover", flexShrink: 0, border: `1px solid ${T.border}` }} onError={e => e.target.style.display = "none"} />}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: T.text, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                        <div style={{ color: T.textMuted, fontSize:11, marginTop: 2 }}>{p.alias}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td m" style={{ fontFamily: "monospace", fontSize:12 }}>{p.sku}</td>
                  <td className="td">{cat && <span className="tag liquid-trans" style={{ background: cat.color + "18", color: cat.color }}>{cat.name}</span>}</td>
                  <td className="td r">{p.opening}</td>
                  <td className="td r" style={{ color: T.blue, fontWeight: 500 }}>{p.purchased}</td>
                  <td className="td r" style={{ color: T.red, fontWeight: 500 }}>-{p.sold}</td>
                  <td className="td r" style={{ color: T.green, fontWeight: 500 }}>+{p.salesReturned}</td>
                  <td className="td r" style={{ color: T.red, fontWeight: 500 }}>-{p.purReturned}</td>
                  <td className="td r" style={{ color: T.amber, fontWeight: 500 }}>-{p.damaged}</td>
                  <td className="td r" style={{ fontWeight: 700, fontSize: 15, color: p.stock <= 0 ? T.red : p.stock <= Number(p.minStock || 0) ? T.amber : T.text }}>{p.stock}</td>
                  <td className="td r" style={{ fontWeight: 600, color: T.accent, fontSize: 14 }}>{fmtCur(p.value)}</td>
                  <td className="td"><StChip stock={p.stock} min={Number(p.minStock || 0)} /></td>
                  {isAdmin && (
                    <td className="td">
                      <button className="btn-ghost liquid-trans" onClick={() => openEditOs(p)} style={{ padding: "6px 10px" }} title="Edit opening stock">
                        <Edit2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${T.accent}30`, background: T.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)" }}>
              <td className="td" style={{ fontWeight: 700, fontSize: 14, padding: "16px" }} colSpan={9}>TOTAL VALUE</td>
              <td className="td r" style={{ fontWeight: 800, color: T.accent, fontSize: 16, padding: "16px" }}>{fmtCur(totalValue)}</td>
              <td className="td" />{isAdmin && <td className="td" />}
            </tr>
          </tfoot>
        </table>
      </div>
      <Pager total={filtered.length} page={pg} ps={ps} setPage={setPg} setPs={setPs} />
    </div>

    <Modal open={editOsModal} onClose={() => setEditOsModal(false)} title={`Edit Opening Stock: ${editOsProduct?.name}`} width={440}
      footer={<><GBtn v="ghost" onClick={() => setEditOsModal(false)}>Cancel</GBtn><GBtn onClick={saveEditOs} icon={<Layers size={14} />}>Save Stock</GBtn></>}>
      {editOsProduct && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="spring-in" style={{ padding: "12px 16px", borderRadius: T.radius, background: T.blueBg, border: `1px solid ${T.blue}25`, fontSize: 13, color: T.blue }}>
            Current opening stock: <strong>{transactions.filter(t => t.productId === editOsProduct.id && t.type === "opening").reduce((s, t) => s + Number(t.qty), 0)} units</strong><br/>
            Current total stock: <strong>{getStock(editOsProduct.id)} units</strong>
          </div>
          <Field label="New Opening Qty" req>
            <GIn type="number" min="0" value={editOsQty} onChange={e => setEditOsQty(e.target.value)} placeholder="Enter opening stock quantity" />
          </Field>
          <Field label="Date">
            <GIn type="date" value={editOsDate} onChange={e => setEditOsDate(e.target.value)} />
          </Field>
          <div style={{ fontSize: 12, color: T.textMuted, padding: "10px 14px", background: T.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderRadius: T.radius, lineHeight: 1.5 }}>
             This replaces all existing opening stock entries for this product. Other transactions (purchases, sales) are unaffected.
          </div>
        </div>
      )}
    </Modal>
  </div>;
}
