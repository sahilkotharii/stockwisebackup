import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, ShoppingCart, Box, AlertTriangle, ArrowRight } from "lucide-react";
import { useT } from "../theme";
import { KCard, CTip, PeriodBar } from "../components/UI";
import { fmtCur, fmtDate, calcBillGst } from "../utils";

const safeDate = v => { if (!v) return ""; if (typeof v === "string") return v.slice(0,10); if (v instanceof Date && !isNaN(v)) return v.toISOString().split("T")[0]; return ""; };

export default function Dashboard({ ctx }) {
  const T = useT();
  const { products, transactions, getStock, bills, vendors, setPage } = ctx;

  const [preset, setPreset] = useState("30d");
  const [df, setDf] = useState(new Date(Date.now()-30*864e5).toISOString().split("T")[0]);
  const [dt, setDt] = useState(new Date().toISOString().split("T")[0]);
  const [alertOpen, setAlertOpen] = useState({ oos: false, low: false });

  const periodSaleBills = useMemo(() => bills.filter(b => b.type === "sale" && safeDate(b.date) >= df && safeDate(b.date) <= dt), [bills, df, dt]);
  const periodPurBills  = useMemo(() => bills.filter(b => b.type === "purchase" && safeDate(b.date) >= df && safeDate(b.date) <= dt), [bills, df, dt]);
  const retTxns         = useMemo(() => transactions.filter(t => t.type === "return" && safeDate(t.date) >= df && safeDate(t.date) <= dt), [transactions, df, dt]);

  const totalRevenue      = periodSaleBills.reduce((s,b) => s + Number(b.total||0), 0);
  const totalGstCollected = periodSaleBills.reduce((s,b) => s + calcBillGst(b), 0);
  const netRevenue        = totalRevenue - totalGstCollected;
  const retRevenue        = retTxns.reduce((s,t) => s + Number(t.qty)*Number(t.price||0), 0);
  const retGst            = retTxns.reduce((s,t) => { const r = Number(t.gstRate||0); return s + Number(t.qty)*Number(t.price||0)*r/(100+r); }, 0);
  const finalRevenue      = totalRevenue - retRevenue;
  const finalNetRevenue   = netRevenue - (retRevenue - retGst);
  const pp                = pid => Number(products.find(pr => pr.id === pid)?.purchasePrice||0);
  const cogsSales         = periodSaleBills.reduce((s,b) => s + (b.items||[]).reduce((si,i) => si+Number(i.qty)*pp(i.productId), 0), 0);
  const grossProfit       = finalNetRevenue - (cogsSales - retTxns.reduce((s,t) => s+Number(t.qty)*pp(t.productId), 0));
  const purchCost         = periodPurBills.reduce((s,b) => s + Number(b.total||0), 0);
  const invVal            = products.reduce((s,p) => s + getStock(p.id)*Number(p.purchasePrice||0), 0);

  const lowStock = products.filter(p => { const s = getStock(p.id); return s > 0 && s <= Number(p.minStock); });
  const oos      = products.filter(p => getStock(p.id) <= 0);

  const dailyData = useMemo(() => {
    const map = {};
    const start = new Date(df), end = new Date(dt);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
        const k = d.toISOString().split("T")[0];
        map[k] = { date: new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}), revenue:0, purchase:0 };
      }
    }
    bills.forEach(b => {
      if (map[b.date]) {
        if (b.type === "sale") map[b.date].revenue += Number(b.total||0);
        if (b.type === "purchase") map[b.date].purchase += Number(b.total||0);
      }
    });
    return Object.values(map);
  }, [bills, df, dt]);

  const topProds = useMemo(() => {
    const m = {};
    periodSaleBills.forEach(b => {
      (b.items||[]).forEach(i => {
        if (!m[i.productId]) m[i.productId] = { product: products.find(p => p.id === i.productId), units:0, revenue:0 };
        m[i.productId].units += Number(i.qty);
        m[i.productId].revenue += Number(i.qty)*Number(i.effectivePrice||i.price||0);
      });
    });
    return Object.values(m).filter(x => x.product).sort((a,b) => b.revenue-a.revenue).slice(0,5);
  }, [periodSaleBills, products]);

  const recentBills = [...bills].sort((a,b) => safeDate(b.date) > safeDate(a.date) ? 1 : -1).slice(0,5);

  return <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
    
    {(oos.length > 0 || lowStock.length > 0) && (
      <div className="glass fade-up liquid-trans" style={{ padding:"16px 20px", borderRadius: T.radius, background:T.amberBg, borderColor:`${T.amber}30` }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom: (alertOpen.oos || alertOpen.low) ? 12 : 0 }}>
          <div className="liquid-trans" style={{ width: 32, height: 32, borderRadius: "50%", background: `${T.amber}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 2px 10px ${T.amber}30` }}>
            <AlertTriangle size={18} color={T.amber} />
          </div>
          <div style={{ fontWeight:800, fontSize:15, color:T.amber, flex:1, letterSpacing: "-0.01em" }}>Inventory Action Required</div>
        </div>
        
        <div className="spring-down" style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {oos.length > 0 && (
            <div>
              <button className="liquid-trans" onClick={() => setAlertOpen(p => ({...p, oos: !p.oos}))} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, padding:"4px 0", width:"100%" }}>
                <span style={{ color:T.red, fontWeight:700, fontSize:13 }}>{oos.length} Out of Stock</span>
                <span style={{ fontSize:11, color:T.textMuted, marginLeft:4, fontWeight: 600 }}>{alertOpen.oos ? "▲ Hide" : "▼ View Products"}</span>
              </button>
              {alertOpen.oos && (
                <div className="spring-in" style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8, paddingLeft:4 }}>
                  {oos.map(p => (
                    <span key={p.id} className="liquid-trans" style={{ fontSize:11, padding:"4px 10px", borderRadius:T.radiusFull, background:`${T.red}15`, color:T.red, fontWeight:600, border:`1px solid ${T.red}25`, cursor: "default" }}>
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {lowStock.length > 0 && (
            <div>
              <button className="liquid-trans" onClick={() => setAlertOpen(p => ({...p, low: !p.low}))} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, padding:"4px 0", width:"100%" }}>
                <span style={{ color:T.amber, fontWeight:700, fontSize:13 }}>{lowStock.length} Low Stock</span>
                <span style={{ fontSize:11, color:T.textMuted, marginLeft:4, fontWeight: 600 }}>{alertOpen.low ? "▲ Hide" : "▼ View Products"}</span>
              </button>
              {alertOpen.low && (
                <div className="spring-in" style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8, paddingLeft:4 }}>
                  {lowStock.map(p => (
                    <span key={p.id} className="liquid-trans" style={{ fontSize:11, padding:"4px 10px", borderRadius:T.radiusFull, background:`${T.amber}15`, color:T.amber, fontWeight:600, border:`1px solid ${T.amber}30`, cursor: "default" }}>
                      {p.name} <span style={{ opacity:0.7, marginLeft: 2 }}>({getStock(p.id)})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )}

    <PeriodBar df={df} setDf={setDf} dt={dt} setDt={setDt} preset={preset} setPreset={setPreset} />

    <div className="kgrid">
      <KCard label="Total Sales"     value={fmtCur(totalRevenue)}  sub={`Incl. GST: ${fmtCur(totalGstCollected)}`}        icon={TrendingUp}  color={T.green} />
      <KCard label="Total Purchase"  value={fmtCur(purchCost)}     sub="Total purchasing cost in period"                  icon={ShoppingCart} color={T.blue} />
      <KCard label="Inventory Value" value={fmtCur(invVal)}        sub={`${products.length} active SKUs · Excl. GST`}     icon={Box}         color={T.accent} />
      <KCard label="Units Returned"  value={String(retTxns.reduce((s,t)=>s+Number(t.qty||0),0))} sub={`${retTxns.length} total return entries`} icon={DollarSign} color={T.red} />
    </div>

    <div className="chart-row fade-up" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(400px, 1fr))", gap:24 }}>
      <div className="glass" style={{ padding:"24px 24px 16px", borderRadius:T.radius }}>
        <div style={{ fontFamily:T.displayFont, fontWeight:800, fontSize:16, color:T.text, marginBottom:20 }}>Revenue vs Purchase</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize:11, fill:T.textMuted, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize:11, fill:T.textMuted, fontWeight: 500 }} tickFormatter={v => v>=1000?(v/1000).toFixed(0)+"k":v} axisLine={false} tickLine={false} />
            <Tooltip content={<CTip fmt />} cursor={{ fill: T.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }} />
            <Bar dataKey="revenue"  name="Sales (incl GST)"    fill={T.green} radius={[4,4,0,0]} maxBarSize={40} />
            <Bar dataKey="purchase" name="Purchase (incl GST)" fill={T.blue}  radius={[4,4,0,0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass" style={{ padding:24, borderRadius:T.radius, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom:20 }}>
          <div style={{ fontFamily:T.displayFont, fontWeight:800, fontSize:16, color:T.text }}>Top Selling Products</div>
          <button className="btn-ghost" onClick={() => setPage && setPage("reports")} style={{ padding: "6px 12px", color: T.accent, fontSize: 12, fontWeight: 700 }}>
            View Report <ArrowRight size={14} />
          </button>
        </div>
        
        {topProds.length === 0
          ? <div style={{ flex: 1, display:"flex", alignItems:"center", justifyContent:"center", color:T.textMuted, fontSize:13, fontWeight: 500 }}>No sales in this period</div>
          : <div style={{ display:"flex", flexDirection:"column", gap:16, flex: 1, justifyContent: "center" }}>
            {topProds.map((item,i) => {
              const pct = (item.units/topProds[0].units)*100;
              return <div key={i} className="liquid-trans" style={{ display:"flex", alignItems:"center", gap:14, padding: "4px", borderRadius: T.radius }}>
                <div style={{ width:28, height:28, borderRadius: "50%", background:i===0?`linear-gradient(135deg,${T.accent},${T.accentDark})`:T.isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:i===0?"#fff":T.textSub, flexShrink:0, boxShadow: i===0?`0 4px 12px ${T.accent}50`:"none" }}>{i+1}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight: 10 }}>{item.product?.name}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.text, flexShrink:0 }}>{item.units}<span style={{ fontSize:11, color:T.textMuted, fontWeight: 500 }}> units</span></div>
                  </div>
                  <div style={{ height:6, borderRadius: T.radiusFull, background:T.isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,.06)", overflow:"hidden" }}>
                    <div className="liquid-trans" style={{ height:"100%", borderRadius: T.radiusFull, width:`${pct}%`, background: i===0 ? `linear-gradient(90deg,${T.accent},${T.accentDark})` : T.textMuted }} />
                  </div>
                </div>
              </div>;
            })}
          </div>}
      </div>
    </div>

    <div className="glass fade-up" style={{ padding:24, borderRadius:T.radius }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom:20 }}>
        <div style={{ fontFamily:T.displayFont, fontWeight:800, fontSize:16, color:T.text }}>Recent Transactions</div>
        <button className="btn-ghost" onClick={() => setPage && setPage("transactions")} style={{ padding: "6px 12px", color: T.accent, fontSize: 12, fontWeight: 700 }}>
          View All <ArrowRight size={14} />
        </button>
      </div>

      {recentBills.length === 0
        ? <div style={{ padding:"40px 0", textAlign:"center", color:T.textMuted, fontSize:14, fontWeight: 500 }}>No bills recorded yet</div>
        : <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr>{["Bill Number","Date","Type","Items","Vendor/Customer","Total Amount"].map(h=>(
              <th key={h} className="th" style={{ textAlign:h==="Total Amount"?"right":"left" }}>{h}</th>
            ))}</tr></thead>
            <tbody>{recentBills.map(b => {
              const vn = vendors?.find(v => v.id === b.vendorId);
              return <tr key={b.id} className="trow liquid-trans">
                <td className="td" style={{ fontWeight:700, color:T.text }}>{b.billNo}</td>
                <td className="td m" style={{ fontWeight: 500 }}>{fmtDate(b.date)}</td>
                <td className="td"><span className="badge liquid-trans" style={{ background:b.type==="sale"?T.greenBg:T.blueBg, color:b.type==="sale"?T.green:T.blue }}>{b.type}</span></td>
                <td className="td m" style={{ fontWeight: 600 }}>{(b.items||[]).length} items</td>
                <td className="td" style={{ fontWeight: 600 }}>{vn?.name||"—"}</td>
                <td className="td r" style={{ fontWeight:800, color:b.type==="sale"?T.green:T.blue, fontSize: 14 }}>{fmtCur(b.total)}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
    </div>
  </div>;
}
