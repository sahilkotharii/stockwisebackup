import React, { useState, useMemo, useEffect } from "react";
import { Package, Download, TrendingUp, TrendingDown, RotateCcw, AlertTriangle, Activity } from "lucide-react";
import { useT } from "../theme";
import { KCard, GBtn, GS, Pager, PeriodBar, SearchInput } from "../components/UI";
import { fmtCur, fmtDate, inRange, getPresetDate, today, toCSV, dlCSV } from "../utils";

export default function ProductReports({ ctx }) {
  const T = useT();
  const { products, categories, transactions, getStock } = ctx;

  const [df, setDf] = useState(getPresetDate("30d"));
  const [dt, setDt] = useState(today());
  const [preset, setPreset] = useState("30d");
  const [search, setSearch] = useState("");
  const [catF, setCatF] = useState("");
  const [sortBy, setSortBy] = useState("soldDesc");
  const [pg, setPg] = useState(1);
  const [ps, setPs] = useState(50);
  useEffect(() => setPg(1), [df, dt, search, catF, sortBy, ps]);

  // ── Per-product movement computed from transactions ─────────
  const productMovement = useMemo(() => {
    // Seed with all products so even zero-movement products show up
    const m = {};
    products.forEach(p => {
      m[p.id] = {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        alias: p.alias,
        categoryId: p.categoryId,
        minStock: Number(p.minStock || 0),
        // Movement counters within selected period
        opening: 0,
        purchased: 0,
        sold: 0,
        salesReturned: 0,
        purchaseReturned: 0,
        damaged: 0,
        // Financial
        revenue: 0,
        spendOnPurchase: 0,
      };
    });

    transactions.forEach(t => {
      if (!inRange(t.date, df, dt)) return;
      const p = m[t.productId];
      if (!p) return;
      const qty = Number(t.qty || 0);
      const price = Number(t.effectivePrice || t.price || 0);
      switch (t.type) {
        case "opening":        p.opening += qty; break;
        case "purchase":       p.purchased += qty; p.spendOnPurchase += qty * price; break;
        case "sale":           p.sold += qty; p.revenue += qty * price; break;
        case "return":         p.salesReturned += qty; break;
        case "purchase_return":p.purchaseReturned += qty; break;
        case "damaged":        p.damaged += qty; break;
      }
    });

    // Attach current stock (always live, not period-based)
    Object.values(m).forEach(p => {
      p.currentStock = getStock ? getStock(p.productId) : 0;
      p.netMovement = p.purchased + p.salesReturned - p.sold - p.purchaseReturned - p.damaged;
    });

    return Object.values(m);
  }, [products, transactions, df, dt, getStock]);

  // ── Summary KPIs (across all products in period) ────────────
  const summary = useMemo(() => ({
    activeProducts: productMovement.filter(p => p.sold > 0 || p.purchased > 0).length,
    totalSold: productMovement.reduce((s, p) => s + p.sold, 0),
    totalPurchased: productMovement.reduce((s, p) => s + p.purchased, 0),
    totalDamaged: productMovement.reduce((s, p) => s + p.damaged, 0),
    totalSalesReturned: productMovement.reduce((s, p) => s + p.salesReturned, 0),
    totalRevenue: productMovement.reduce((s, p) => s + p.revenue, 0),
    deadStock: productMovement.filter(p => p.sold === 0 && p.currentStock > 0).length,
  }), [productMovement]);

  // ── Filter + sort ───────────────────────────────────────────
  const filtered = useMemo(() => {
    let data = productMovement;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(p => (p.name || "").toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q));
    }
    if (catF) data = data.filter(p => p.categoryId === catF);

    switch (sortBy) {
      case "soldDesc":      data = [...data].sort((a, b) => b.sold - a.sold); break;
      case "soldAsc":       data = [...data].sort((a, b) => a.sold - b.sold); break;
      case "revenueDesc":   data = [...data].sort((a, b) => b.revenue - a.revenue); break;
      case "damagedDesc":   data = [...data].sort((a, b) => b.damaged - a.damaged); break;
      case "purchasedDesc": data = [...data].sort((a, b) => b.purchased - a.purchased); break;
      case "stockAsc":      data = [...data].sort((a, b) => a.currentStock - b.currentStock); break;
      case "name":          data = [...data].sort((a, b) => (a.name || "").localeCompare(b.name || "")); break;
    }
    return data;
  }, [productMovement, search, catF, sortBy]);

  // ── Top movers + slow movers (from filtered data) ──────────
  const topSellers = useMemo(() => [...filtered].filter(p => p.sold > 0).sort((a, b) => b.sold - a.sold).slice(0, 5), [filtered]);
  const slowMovers = useMemo(() => filtered.filter(p => p.sold === 0 && p.currentStock > 0).slice(0, 5), [filtered]);

  const exportCSV = () => {
    const rows = filtered.map(p => ({
      name: p.name, sku: p.sku, alias: p.alias || "",
      opening: p.opening, purchased: p.purchased, sold: p.sold,
      salesReturned: p.salesReturned, purchaseReturned: p.purchaseReturned,
      damaged: p.damaged, netMovement: p.netMovement,
      currentStock: p.currentStock, revenue: p.revenue, spend: p.spendOnPurchase,
    }));
    dlCSV(toCSV(rows, ["name","sku","alias","opening","purchased","sold","salesReturned","purchaseReturned","damaged","netMovement","currentStock","revenue","spend"]), `product_report_${df}_to_${dt}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <PeriodBar df={df} setDf={setDf} dt={dt} setDt={setDt} preset={preset} setPreset={setPreset} />
        <GBtn v="ghost" sz="sm" onClick={exportCSV} icon={<Download size={13} />}>Export CSV</GBtn>
      </div>

      <div className="kgrid">
        <KCard label="Active Products" value={String(summary.activeProducts)} sub={`of ${products.length} total`} icon={Package} color={T.accent} />
        <KCard label="Units Sold" value={String(summary.totalSold)} sub="in this period" icon={TrendingUp} color={T.green} />
        <KCard label="Units Purchased" value={String(summary.totalPurchased)} sub="in this period" icon={TrendingDown} color={T.blue} />
        <KCard label="Revenue" value={fmtCur(summary.totalRevenue)} sub="incl. GST" icon={Activity} color={T.accent} />
        <KCard label="Damaged / Lost" value={String(summary.totalDamaged)} sub={`${summary.totalSalesReturned} returned`} icon={AlertTriangle} color={T.red} />
        <KCard label="Slow Movers" value={String(summary.deadStock)} sub="stock but no sales" icon={RotateCcw} color={T.amber} />
      </div>

      <div className="chart-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="glass" style={{ padding: 18, borderRadius: T.radius }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={14} color={T.green} /> Top Sellers
          </div>
          {topSellers.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: T.textMuted, fontSize: 12 }}>No sales in period</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topSellers.map((p, i) => (
                <div key={p.productId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: T.radius, background: T.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.name}>{i + 1}. {p.name}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, fontFamily: "monospace" }}>{p.sku}</div>
                  </div>
                  <div style={{ textAlign: "right", marginLeft: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.green }}>{p.sold} units</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{fmtCur(p.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass" style={{ padding: 18, borderRadius: T.radius }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={14} color={T.amber} /> Slow Movers (stock but no sales)
          </div>
          {slowMovers.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: T.textMuted, fontSize: 12 }}>All stocked products are selling</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {slowMovers.map((p, i) => (
                <div key={p.productId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: T.radius, background: T.amberBg }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.name}>{p.name}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, fontFamily: "monospace" }}>{p.sku}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.amber, marginLeft: 12 }}>{p.currentStock} in stock</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass" style={{ borderRadius: T.radius, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text, flex: 1, minWidth: 160 }}>Product Movement Register</div>
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Product name or SKU…" style={{ flex: "1 1 200px", maxWidth: 280 }} />
          <GS value={catF} onChange={e => setCatF(e.target.value)} placeholder="All Categories" style={{ width: 160 }}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </GS>
          <GS value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 180 }}>
            <option value="soldDesc">Most Sold ↓</option>
            <option value="soldAsc">Least Sold ↑</option>
            <option value="revenueDesc">Revenue ↓</option>
            <option value="purchasedDesc">Most Purchased ↓</option>
            <option value="damagedDesc">Most Damaged ↓</option>
            <option value="stockAsc">Lowest Stock ↑</option>
            <option value="name">Name A–Z</option>
          </GS>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th className="th" style={{ textAlign: "left" }}>Product</th>
                <th className="th" style={{ textAlign: "left" }}>SKU</th>
                <th className="th" style={{ textAlign: "right" }}>Opening</th>
                <th className="th" style={{ textAlign: "right" }}>+ Purchased</th>
                <th className="th" style={{ textAlign: "right" }}>– Sold</th>
                <th className="th" style={{ textAlign: "right" }}>+ Sale Ret.</th>
                <th className="th" style={{ textAlign: "right" }}>– Pur. Ret.</th>
                <th className="th" style={{ textAlign: "right" }}>– Damaged</th>
                <th className="th" style={{ textAlign: "right" }}>Current Stock</th>
                <th className="th" style={{ textAlign: "right" }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice((pg-1)*ps, pg*ps).map(p => {
                const lowStock = p.currentStock > 0 && p.currentStock <= p.minStock;
                const oos = p.currentStock <= 0;
                return (
                  <tr key={p.productId} className="trow">
                    <td className="td" style={{ fontWeight: 700, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.name}>{p.name}</td>
                    <td className="td m" style={{ fontFamily: "monospace", fontSize: 11 }}>{p.sku || "—"}</td>
                    <td className="td r m">{p.opening || "—"}</td>
                    <td className="td r" style={{ color: p.purchased > 0 ? T.blue : T.textMuted, fontWeight: p.purchased > 0 ? 700 : 500 }}>{p.purchased || "—"}</td>
                    <td className="td r" style={{ color: p.sold > 0 ? T.green : T.textMuted, fontWeight: p.sold > 0 ? 700 : 500 }}>{p.sold || "—"}</td>
                    <td className="td r m" style={{ color: p.salesReturned > 0 ? T.amber : T.textMuted }}>{p.salesReturned || "—"}</td>
                    <td className="td r m" style={{ color: p.purchaseReturned > 0 ? T.amber : T.textMuted }}>{p.purchaseReturned || "—"}</td>
                    <td className="td r" style={{ color: p.damaged > 0 ? T.red : T.textMuted, fontWeight: p.damaged > 0 ? 700 : 500 }}>{p.damaged || "—"}</td>
                    <td className="td r" style={{ fontWeight: 800, color: oos ? T.red : lowStock ? T.amber : T.text }}>
                      {p.currentStock}{oos && <span style={{ fontSize: 9, marginLeft: 4, fontWeight: 700 }}>OOS</span>}{lowStock && !oos && <span style={{ fontSize: 9, marginLeft: 4, fontWeight: 700 }}>LOW</span>}
                    </td>
                    <td className="td r" style={{ fontWeight: 700, color: p.revenue > 0 ? T.accent : T.textMuted }}>{p.revenue > 0 ? fmtCur(p.revenue) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textMuted, fontSize: 13 }}>No products match</div>}
        </div>
        <Pager total={filtered.length} page={pg} ps={ps} setPage={setPg} setPs={setPs} />
      </div>
    </div>
  );
}
