import React, { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, Package, Download, ShoppingCart } from "lucide-react";
import { useT } from "../theme";
import { GBtn, KCard } from "../components/UI";
import { fmtCur, toCSV, dlCSV, calcBillGst, safeDate, safeNum, sGst, sQty, sPrice } from "../utils";

export default function PnL({ ctx }) {
  const T = useT();
  const { bills = [], transactions = [], products = [] } = ctx;

  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? `${now.getFullYear()}-04-01` : `${now.getFullYear()-1}-04-01`;
  const fyEnd   = now.getMonth() >= 3 ? `${now.getFullYear()+1}-03-31` : `${now.getFullYear()}-03-31`;
  const [df, setDf] = useState(fyStart);
  const [dt, setDt] = useState(fyEnd);

  const inP = d => { const s = safeDate(d); return s && s >= df && s <= dt; };

  const txnsByProduct = useMemo(() => {
    const m = {};
    transactions.forEach(t => { if (!m[t.productId]) m[t.productId] = []; m[t.productId].push(t); });
    return m;
  }, [transactions]);

  // Lookup exact purchase price (cost) for a product
  const ppOf = pid => safeNum(products.find(p => p.id === pid)?.purchasePrice);

  const saleBills = useMemo(() => bills.filter(b => b.type === "sale"     && inP(b.date)), [bills, df, dt]);
  const purBills  = useMemo(() => bills.filter(b => b.type === "purchase" && inP(b.date)), [bills, df, dt]);
  const retTxns   = useMemo(() => transactions.filter(t => t.type === "return"           && inP(t.date)), [transactions, df, dt]);
  const purRetTxns= useMemo(() => transactions.filter(t => t.type === "purchase_return"  && inP(t.date)), [transactions, df, dt]);

  // ── REVENUE (Based purely on Selling Prices) ─────────────────────────────
  const grossSalesInclGst = useMemo(() => saleBills.reduce((s,b)=>s+safeNum(b.total),0), [saleBills]);
  const gstOnSales        = useMemo(() => saleBills.reduce((s,b)=>s+(calcBillGst(b)||0),0), [saleBills]);
  const grossSalesExclGst = grossSalesInclGst - gstOnSales;

  const salesReturnValue  = useMemo(() => retTxns.reduce((s,t)=>s+sQty(t)*sPrice(t),0), [retTxns]);
  const salesReturnGst    = useMemo(() => retTxns.reduce((s,t)=>{
    const rate = sGst(t) || safeNum(products.find(p=>p.id===t.productId)?.gstRate);
    return s + sQty(t) * sPrice(t) * rate / (100+rate);
  }, 0), [retTxns, products]);
  
  const salesReturnExclGst = salesReturnValue - salesReturnGst;
  const netSalesExclGst = grossSalesExclGst - salesReturnExclGst;

  // ── COST OF GOODS SOLD (Based strictly on Purchase Cost tracking) ────────
  
  // Total Purchases from Bills (may include discounts/variations)
  const totalPurchaseInclGst = useMemo(() => purBills.reduce((s,b)=>s+safeNum(b.total),0), [purBills]);
  const purchasesExclGst     = useMemo(() => purBills.reduce((s,b)=>s+safeNum(b.subtotal),0), [purBills]);
  const gstOnPurchases       = totalPurchaseInclGst - purchasesExclGst;

  const purReturnValue       = useMemo(() => purRetTxns.reduce((s,t)=>s+sQty(t)*sPrice(t),0), [purRetTxns]);
  const purReturnGst         = useMemo(() => purRetTxns.reduce((s,t)=>{
    const rate = sGst(t) || safeNum(products.find(p=>p.id===t.productId)?.gstRate);
    return s + sQty(t) * sPrice(t) * rate / 100;
  }, 0), [purRetTxns, products]);
  const purReturnExclGst     = purReturnValue - purReturnGst;

  // The EXACT value of inventory added back to our warehouse from a Sales Return
  const salesReturnAtCost = useMemo(() =>
    retTxns.reduce((s,t) => s + sQty(t) * ppOf(t.productId), 0)
  , [retTxns, products]);

  // Inventory value mathematically tied strictly to quantities * cost price
  const stockValAt = (upTo, strictBefore) => {
    return products.reduce((s, pr) => {
      const qty = (txnsByProduct[pr.id] || []).filter(t => {
        const d = safeDate(t.date);
        if (!d) return false;
        if (t.type === "opening") return d <= upTo;
        return strictBefore ? d < upTo : d <= upTo;
      }).reduce((sq, t) => {
        if (["opening","purchase","return"].includes(t.type))      return sq + sQty(t);
        if (["sale","damaged","purchase_return"].includes(t.type)) return sq - sQty(t);
        return sq;
      }, 0);
      return s + Math.max(0, qty) * safeNum(pr.purchasePrice);
    }, 0);
  };

  const openingStock = useMemo(() => stockValAt(df, true), [products, txnsByProduct, df]);
  const closingStock = useMemo(() => stockValAt(dt, false), [products, txnsByProduct, dt]);

  // COGS Formula: Opening Inventory + Inventory Purchased - Inventory Remaining
  // This physically calculates the cost of exactly what left the building
  const purePurchasedInventoryValue = useMemo(() => {
    return transactions.filter(t => t.type === "purchase" && inP(t.date))
      .reduce((s, t) => s + (sQty(t) * ppOf(t.productId)), 0);
  }, [transactions, df, dt, ppOf]);

  const purePurchaseReturnedValue = useMemo(() => {
    return purRetTxns.reduce((s, t) => s + (sQty(t) * ppOf(t.productId)), 0);
  }, [purRetTxns, ppOf]);

  const cogs        = openingStock + purePurchasedInventoryValue - purePurchaseReturnedValue - closingStock;
  const grossProfit = netSalesExclGst - cogs;
  const margin      = netSalesExclGst > 0 ? (grossProfit/netSalesExclGst*100) : 0;

  const exportCSV = () => dlCSV(toCSV([
    { item:"Gross Sales (incl. GST)",  value: grossSalesInclGst  },
    { item:"GST on Sales",             value: gstOnSales         },
    { item:"Gross Sales (excl. GST)",  value: grossSalesExclGst  },
    { item:"Sales Returns (Revenue)",  value: salesReturnExclGst },
    { item:"Net Sales (excl. GST)",    value: netSalesExclGst    },
    { item:"Purchases (excl. GST)",    value: purchasesExclGst   },
    { item:"Purchase Returns",         value: purReturnExclGst   },
    { item:"Opening Stock (at cost)",  value: openingStock       },
    { item:"Closing Stock (at cost)",  value: closingStock       },
    { item:"COGS (Pure cost matched)", value: cogs               },
    { item:"Gross Profit",             value: grossProfit        },
    { item:"Gross Margin %",           value: margin.toFixed(1)+"%"},
  ], ["item","value"]), `pnl_${df}_to_${dt}`);

  const Row = ({ label, value, sub, indent=0, bold=false, color, separator }) => (
    <>
      {separator && <tr><td colSpan={2} style={{padding:"4px 0",borderTop:`1px solid ${T.borderSubtle}`}}/></tr>}
      <tr>
        <td style={{padding:"5px 8px",paddingLeft:8+indent*18,fontWeight:bold?700:400,fontSize:bold?13:12,color:bold?T.text:T.textSub}}>
          {label}
          {sub && <div style={{fontSize:11,color:T.textMuted,marginTop:1}}>{sub}</div>}
        </td>
        <td style={{padding:"5px 8px",textAlign:"right",fontWeight:bold?700:500,fontSize:bold?13:12,color:color||(bold?T.text:T.textSub)}}>
          {typeof value==="number"?fmtCur(value):value}
        </td>
      </tr>
    </>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontFamily:T.displayFont,fontWeight:700,fontSize:18,color:T.text}}>Business Summary</div>
          <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>Indicative P&L · Based on Cost & Sell Parity</div>
        </div>
        <GBtn v="ghost" sz="sm" onClick={exportCSV} icon={<Download size={13}/>}>Export CSV</GBtn>
      </div>

      <div className="glass" style={{padding:"12px 16px",borderRadius: T.radius}}>
        <div className="filter-wrap">
          <span style={{fontSize:11,fontWeight:700,color:T.textMuted}}>PERIOD</span>
          <input type="date" className="inp" value={df} onChange={e=>setDf(e.target.value)} style={{flex:"0 1 130px"}}/>
          <span style={{fontSize:12,color:T.textMuted}}>→</span>
          <input type="date" className="inp" value={dt} onChange={e=>setDt(e.target.value)} style={{flex:"0 1 130px"}}/>
        </div>
      </div>

      <div className="kgrid">
        {[
          {label:"Net Sales",     value:netSalesExclGst,   sub:"excl. GST",          icon:DollarSign,  color:T.accent},
          {label:"Gross Profit",  value:grossProfit,       sub:`${margin.toFixed(1)}% margin`, icon:TrendingDown,color:grossProfit>=0?T.green:T.red},
          {label:"Closing Stock", value:closingStock,      sub:"at cost price",      icon:Package,     color:T.amber},
        ].map((k,i)=>(
          <KCard key={i} label={k.label} value={fmtCur(k.value)} sub={k.sub} icon={k.icon} color={k.color} />
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14}}>
        <div className="glass" style={{padding:20,borderRadius:T.radius}}>
          <div style={{fontFamily:T.displayFont,fontWeight:700,fontSize:15,color:T.text,marginBottom:12}}>Profit & Loss</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}><tbody>
            <Row label="SALES REVENUE" bold/>
            <Row label="Gross Sales (excl. GST)"  value={grossSalesExclGst}    indent={1} />
            <Row label="Less: Sales Returns"      value={-salesReturnExclGst}  indent={1} color={T.red} sub="Selling value of returns"/>
            <Row label="Net Sales Revenue"        value={netSalesExclGst}      bold color={T.green} separator/>

            <Row label="COST OF GOODS SOLD" bold/>
            <Row label="Opening Stock"            value={openingStock}         indent={1} sub="Valued at Cost"/>
            <Row label="Add: Inventory Received"  value={purePurchasedInventoryValue} indent={1} color={T.blue} sub="Valued at Cost"/>
            <Row label="Less: Inventory Returned" value={-purePurchaseReturnedValue}  indent={1} color={T.textMuted}/>
            <Row label="Less: Closing Stock"      value={-closingStock}        indent={1} color={T.textMuted} sub="Valued at Cost"/>
            <Row label="Cost of Goods Sold"       value={cogs}                 bold color={T.red} separator/>

            <Row label="GROSS PROFIT"             value={grossProfit}          bold color={grossProfit>=0?T.green:T.red} separator/>
            <Row label="Gross Margin"             value={margin.toFixed(1)+"%"} indent={1} color={T.textMuted}/>
          </tbody></table>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div className="glass" style={{padding:20,borderRadius:T.radius}}>
            <div style={{fontFamily:T.displayFont,fontWeight:700,fontSize:15,color:T.text,marginBottom:12}}>Inventory Ledger (at cost)</div>
            <table style={{width:"100%",borderCollapse:"collapse"}}><tbody>
              <Row label="Opening Stock"             value={openingStock}         indent={1}/>
              <Row label="Add: Stock Purchased"      value={purePurchasedInventoryValue} indent={1} color={T.blue}/>
              <Row label="Less: Purchase Returns"    value={-purePurchaseReturnedValue}  indent={1} color={T.red}/>
              <Row label="Add: Sales Returns"        value={salesReturnAtCost}    indent={1} color={T.green} sub="Restocked at purchase price"/>
              <Row label="Less: Stock Sold (COGS)"   value={-cogs}                indent={1} color={T.red}/>
              <Row label="Closing Stock"             value={closingStock}         bold color={T.accent} separator/>
            </tbody></table>
          </div>
        </div>
      </div>
    </div>
  );
}
