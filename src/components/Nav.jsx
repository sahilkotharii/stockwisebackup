import React, { useState, useEffect } from "react";
import { LayoutDashboard, TrendingUp, ShoppingCart, Package, IndianRupee, CheckSquare, Settings, Shield, LogOut, Bell, RefreshCw, Sun, Moon, Layers, X, User, Download, Hexagon, ChevronDown, Activity, AlertTriangle, AlertOctagon, Menu } from "lucide-react";
import { useT } from "../theme";

// Every nav item has its own unique pageId that maps to a real page component
export const NAV_GROUPS = [
  { id: "dash", label: "Dashboard", icon: LayoutDashboard, adminOnly: true,
    children: [{ id: "dashboard", label: "Overview" }] },
  { id: "sales", label: "Sales", icon: TrendingUp,
    children: [
      { id: "sales", label: "Sales Bills" },
      { id: "new-sale-invoice", label: "New Tax Invoice" },
      { id: "new-proforma", label: "New Proforma Invoice" },
      { id: "sales-return", label: "Sales Return" },
      { id: "sales-reports", label: "Sales Reports" },
    ]},
  { id: "purchase", label: "Purchase", icon: ShoppingCart,
    children: [
      { id: "purchase", label: "Purchase Bills" },
      { id: "new-purchase-bill", label: "New Purchase Bill" },
      { id: "purchase-return", label: "Purchase Return" },
      { id: "purchase-reports", label: "Purchase Reports" },
    ]},
  { id: "inventory", label: "Inventory", icon: Package,
    children: [
      { id: "inventory", label: "Stock Status" },
      { id: "products", label: "Products" },
      { id: "categories", label: "Categories" },
      { id: "product-reports", label: "Product Reports" },
    ]},
  { id: "accounts", label: "Accounts", icon: IndianRupee,
    children: [
      { id: "pnl", label: "Profit & Loss" },
      { id: "ledger", label: "Ledger" },
      { id: "payments-receipts", label: "Payments & Receipts" },
      { id: "expenses-incomes", label: "Expenses & Incomes" },
      { id: "vendors", label: "Vendors" },
      { id: "transactions", label: "Transactions" },
    ]},
  { id: "approvals", label: "Approvals", icon: CheckSquare, adminOnly: true,
    children: [{ id: "approvals", label: "All Approvals" }] },
  { id: "settings", label: "Settings", icon: Settings, alwaysAllow: true,
    children: [
      { id: "settings-profile", label: "Profile" },
      { id: "settings-theme", label: "Theme" },
      { id: "how-to-use", label: "How to Use" },
    ]},
  { id: "admin", label: "Admin", icon: Shield, adminOnly: true,
    children: [
      { id: "admin-users", label: "Users & Permissions" },
      { id: "admin-activity", label: "Activity Log" },
      { id: "admin-sessions", label: "Login History" },
      { id: "admin-invoice", label: "Invoice Template" },
      { id: "admin-series", label: "Bill Series" },
      { id: "admin-sheets", label: "Google Sheets" },
      { id: "admin-export", label: "Export Data" },
    ]},
];

// Role-based access — list of pageIds each role can see
const ROLE_ACCESS = {
  admin: null, // null = everything
  manager: ["dashboard","sales","new-sale-invoice","new-proforma","sales-return","sales-reports","purchase","new-purchase-bill","purchase-return","purchase-reports","inventory","products","categories","product-reports","pnl","ledger","payments-receipts","vendors","transactions","settings-profile","settings-theme","how-to-use"],
  sales: ["sales","new-sale-invoice","new-proforma","sales-return","sales-reports","inventory","products","vendors","ledger","payments-receipts","settings-profile","settings-theme","how-to-use"],
  purchase: ["purchase","new-purchase-bill","purchase-return","purchase-reports","inventory","products","vendors","ledger","payments-receipts","settings-profile","settings-theme","how-to-use"],
  accountant: ["sales","purchase","sales-return","purchase-return","pnl","ledger","payments-receipts","expenses-incomes","vendors","transactions","settings-profile","settings-theme","how-to-use"],
  production: ["inventory","products","categories","product-reports","settings-profile","settings-theme","how-to-use"],
};
export { ROLE_ACCESS };

export const getVisibleGroups = (user) => {
  if (!user) return [];
  const role = user.role?.toLowerCase() || "manager";
  const allowed = ROLE_ACCESS[role];
  const locked = user.lockedPages || [];
  return NAV_GROUPS.filter(g => {
    if (g.adminOnly && role !== "admin") return false;
    if (g.alwaysAllow) return true;
    return g.children.some(c => (allowed === null || allowed.includes(c.id)) && !locked.includes(c.id));
  }).map(g => {
    if (g.alwaysAllow || allowed === null) return g;
    return { ...g, children: g.children.filter(c => allowed.includes(c.id) && !locked.includes(c.id)) };
  });
};

export const canAccess = (user, pageId) => {
  if (!user) return false;
  const role = user.role?.toLowerCase() || "manager";
  if (role === "admin") return true;
  const allowed = ROLE_ACCESS[role] || [];
  return allowed.includes(pageId) && !(user.lockedPages || []).includes(pageId);
};

function Avatar({ user, size = 30 }) {
  const T = useT();
  return <div style={{ width: size, height: size, borderRadius: "50%", background: T.accentBg, border: `1px solid ${T.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.42, color: T.accent, flexShrink: 0 }}>{(user?.name || "?")[0].toUpperCase()}</div>;
}

/* ─── Desktop Sidebar ─────────────────────────────────────────── */
export default function Sidebar({ page, setPage, user, onLogout, ctx }) {
  const T = useT();
  const { logoUrl } = ctx || {};
  const groups = getVisibleGroups(user);
  const [open, setOpen] = useState({});

  // Auto-expand group with active page
  useEffect(() => {
    const g = groups.find(g => g.children.some(c => c.id === page));
    if (g) setOpen(p => ({ ...p, [g.id]: true }));
  }, [page]);

  const toggle = id => setOpen(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="desktop-sidebar" style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: T.sidebarW, display: "flex", flexDirection: "column", zIndex: 100, background: T.sidebarBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRight: `1px solid ${T.border}` }}>
      <div style={{ padding: "18px 16px 12px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {logoUrl ? <img src={logoUrl} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />
          : <div style={{ width: 28, height: 28, borderRadius: 8, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 10px ${T.accent}35` }}><Hexagon size={16} color="#fff" strokeWidth={2.5} /></div>}
        <div><div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>StockWise</div><div style={{ fontSize: 9, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", marginTop: -1 }}>ERP</div></div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "4px 0" }}>
        {groups.map(g => {
          const isOpen = open[g.id];
          const active = g.children.some(c => c.id === page);
          if (g.children.length === 1) {
            const c = g.children[0];
            return <button key={g.id} onClick={() => setPage(c.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", margin: "1px 8px", borderRadius: T.radius, cursor: "pointer", color: c.id === page ? T.accent : T.textSub, fontWeight: c.id === page ? 700 : 600, fontSize: 13, border: "none", background: c.id === page ? T.accentBg : "transparent", width: "calc(100% - 16px)", textAlign: "left", transition: "all .15s" }}>
              <g.icon size={16} strokeWidth={c.id === page ? 2.5 : 2} />{g.label}
            </button>;
          }
          return <div key={g.id} style={{ marginBottom: 2 }}>
            <button onClick={() => toggle(g.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", margin: "1px 8px", cursor: "pointer", fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: active ? T.accent : T.textMuted, border: "none", background: "transparent", borderRadius: T.radius, width: "calc(100% - 16px)", textAlign: "left", transition: "all .15s" }}>
              <g.icon size={14} style={{ flexShrink: 0 }} /><span style={{ flex: 1 }}>{g.label}</span>
              <ChevronDown size={12} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {isOpen && <div className="spring-down">
              {g.children.map(c => <button key={c.id} className={`nav-sub ${c.id === page ? "active" : ""}`} onClick={() => setPage(c.id)}>{c.label}</button>)}
            </div>}
          </div>;
        })}
      </div>

      <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.borderSubtle}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <Avatar user={user} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
          <div style={{ fontSize: 10, color: T.textMuted, textTransform: "capitalize" }}>{user?.role}</div>
        </div>
        <button onClick={onLogout} className="btn-ghost" style={{ padding: 5 }} title="Sign Out"><LogOut size={14} color={T.textMuted} /></button>
      </div>
    </div>
  );
}

/* ─── Mobile Drawer Nav ───────────────────────────────────────── */
export function MobDrawer({ isOpen, onClose, page, setPage, user, onLogout, ctx }) {
  const T = useT();
  const { logoUrl } = ctx || {};
  const groups = getVisibleGroups(user);
  const [openGrp, setOpenGrp] = useState({});

  useEffect(() => {
    const g = groups.find(g => g.children.some(c => c.id === page));
    if (g) setOpenGrp(p => ({ ...p, [g.id]: true }));
  }, [page]);

  if (!isOpen) return null;
  return <>
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)" }} onClick={onClose} />
    <div className="spring-in" style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 260, zIndex: 201, background: T.surfaceStrong, backdropFilter: "blur(24px)", display: "flex", flexDirection: "column", boxShadow: T.shadowXl }}>
      <div style={{ padding: "16px 14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {logoUrl ? <img src={logoUrl} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
            : <div style={{ width: 24, height: 24, borderRadius: 6, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}><Hexagon size={14} color="#fff" /></div>}
          <span style={{ fontWeight: 800, fontSize: 14, color: T.text }}>StockWise</span>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ padding: 4 }}><X size={18} /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {groups.map(g => {
          if (g.children.length === 1) {
            const c = g.children[0];
            return <button key={g.id} onClick={() => { setPage(c.id); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", width: "100%", border: "none", background: c.id === page ? T.accentBg : "transparent", color: c.id === page ? T.accent : T.textSub, fontWeight: 600, fontSize: 13, textAlign: "left", cursor: "pointer" }}>
              <g.icon size={16} />{g.label}
            </button>;
          }
          return <div key={g.id}>
            <button onClick={() => setOpenGrp(p => ({ ...p, [g.id]: !p[g.id] }))} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 16px", width: "100%", border: "none", background: "transparent", cursor: "pointer", fontSize: 11, fontWeight: 800, color: g.children.some(c => c.id === page) ? T.accent : T.textMuted, textTransform: "uppercase", letterSpacing: ".05em", textAlign: "left" }}>
              <g.icon size={13} /><span style={{ flex: 1 }}>{g.label}</span><ChevronDown size={11} style={{ transform: openGrp[g.id] ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {openGrp[g.id] && g.children.map(c => (
              <button key={c.id} onClick={() => { setPage(c.id); onClose(); }} style={{ display: "block", width: "100%", padding: "8px 16px 8px 44px", border: "none", background: c.id === page ? T.accentBg : "transparent", color: c.id === page ? T.accent : T.textSub, fontWeight: c.id === page ? 700 : 500, fontSize: 13, textAlign: "left", cursor: "pointer" }}>
                {c.label}
              </button>
            ))}
          </div>;
        })}
      </div>
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.borderSubtle}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <Avatar user={user} size={26} />
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{user?.name}</div></div>
        <button onClick={() => { onLogout(); onClose(); }} className="btn-ghost" style={{ padding: 4, color: T.red }}><LogOut size={14} /></button>
      </div>
    </div>
  </>;
}

/* ─── Mobile Bottom Bar ───────────────────────────────────────── */
export function MobNav({ onDrawerOpen }) {
  const T = useT();
  return <div className="mobile-nav" style={{ boxShadow: "0 -2px 16px rgba(0,0,0,0.06)" }}>
    <button onClick={onDrawerOpen} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "10px 4px", border: "none", background: "transparent", cursor: "pointer", color: T.textSub }}>
      <Menu size={22} /><span style={{ fontSize: 9, fontWeight: 600 }}>Menu</span>
    </button>
  </div>;
}

/* ─── TopBar ──────────────────────────────────────────────────── */
export function TopBar({ page, user, syncSt, onSync, toggleTheme, isDark, setPage, ctx, onLogout, onDrawerOpen }) {
  const T = useT();
  const titles = {"dashboard":"Dashboard","sales":"Sales Bills","new-sale-invoice":"New Tax Invoice","new-proforma":"New Proforma Invoice","sales-return":"Sales Return","sales-reports":"Sales Reports","purchase":"Purchase Bills","new-purchase-bill":"New Purchase Bill","purchase-return":"Purchase Return","purchase-reports":"Purchase Reports","inventory":"Stock Status","products":"Products","categories":"Categories","product-reports":"Product Reports","pnl":"Profit & Loss","ledger":"Ledger","payments-receipts":"Payments & Receipts","expenses-incomes":"Expenses & Incomes","vendors":"Vendors","transactions":"Transactions","approvals":"Approvals","settings-profile":"Profile","settings-theme":"Theme","how-to-use":"How to Use","admin-users":"Users","admin-activity":"Activity Log","admin-sessions":"Login History","admin-invoice":"Invoice Template","admin-series":"Bill Series","admin-sheets":"Google Sheets","admin-export":"Export Data"};

  const [showNotif, setShowNotif] = useState(false);
  const { changeReqs, products, getStock } = ctx;
  const pending = (changeReqs || []).filter(r => r.status === "pending");
  const lowCnt = (products || []).filter(p => { const s = getStock(p.id); return s > 0 && s <= Number(p.minStock||0); }).length;
  const oosCnt = (products || []).filter(p => getStock(p.id) <= 0).length;
  const badge = (user.role === "admin" ? pending.length : 0) + lowCnt + oosCnt;

  return <div style={{ position: "sticky", top: 0, zIndex: 40, background: T.surfaceGlass, backdropFilter: "blur(20px)", padding: "10px 16px", margin: "-8px -16px 16px -16px", borderBottom: `1px solid ${T.borderSubtle}` }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <h2 style={{ fontWeight: 800, fontSize: 18, color: T.text, letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titles[page] || "StockWise"}</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button onClick={onSync} className="btn-ghost hide-mob" style={{ padding: "6px 12px", fontSize: 12, borderRadius: 20 }}>
          <RefreshCw size={13} style={{ animation: syncSt === "syncing" ? "spin 1s linear infinite" : "none", marginRight: 4 }} />{syncSt === "syncing" ? "Sync…" : "Synced"}
        </button>
        <button onClick={toggleTheme} className="btn-ghost" style={{ width: 34, height: 34, padding: 0, borderRadius: "50%" }}>{isDark ? <Sun size={15} /> : <Moon size={15} />}</button>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowNotif(!showNotif)} className="btn-ghost" style={{ width: 34, height: 34, padding: 0, borderRadius: "50%" }}>
            <Bell size={15} />
            {badge > 0 && <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: T.red, border: `2px solid ${T.surfaceGlass}` }} />}
          </button>
          {showNotif && <>
            <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowNotif(false)} />
            <div className="glass-strong spring-down notif-dropdown" onClick={e => e.stopPropagation()} style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 300, borderRadius: T.radius, overflow: "hidden", zIndex: 200 }}>
              <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.borderSubtle}`, fontWeight: 800, fontSize: 12, color: T.text }}>Notifications</div>
              <div style={{ maxHeight: 320, overflowY: "auto", padding: "8px 14px" }}>
                {oosCnt > 0 && <div onClick={() => { setPage("inventory"); setShowNotif(false); }} style={{ padding: "8px 10px", borderRadius: T.radius, background: T.redBg, marginBottom: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.red, display: "flex", alignItems: "center", gap: 6 }}><AlertOctagon size={13} />{oosCnt} Out of Stock</div>}
                {lowCnt > 0 && <div onClick={() => { setPage("inventory"); setShowNotif(false); }} style={{ padding: "8px 10px", borderRadius: T.radius, background: T.amberBg, marginBottom: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.amber, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={13} />{lowCnt} Low Stock</div>}
                {user.role === "admin" && pending.length > 0 && <div onClick={() => { setPage("approvals"); setShowNotif(false); }} style={{ padding: "8px 10px", borderRadius: T.radius, background: T.accentBg, marginBottom: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.accent, display: "flex", alignItems: "center", gap: 6 }}><CheckSquare size={13} />{pending.length} Pending Approvals</div>}
                {!oosCnt && !lowCnt && !pending.length && <div style={{ padding: 16, textAlign: "center", color: T.textMuted, fontSize: 12 }}>All clear</div>}
              </div>
            </div>
          </>}
        </div>
        <Avatar user={user} size={32} />
      </div>
    </div>
  </div>;
}
