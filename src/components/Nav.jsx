import React, { useState, useEffect } from "react";
import { LayoutDashboard, TrendingUp, ShoppingCart, RotateCcw, Package, BarChart2, PieChart, Tag, Users, ArrowLeftRight, BookOpen, CheckSquare, Settings, LogOut, Bell, RefreshCw, Sun, Moon, Layers, X, User, Download, Hexagon, ChevronDown, ChevronRight, Activity, AlertTriangle, AlertOctagon, FileText, CreditCard, Wallet, ClipboardList, IndianRupee, Shield } from "lucide-react";
import { useT } from "../theme";

/* ═══════════════════════════════════════════════════════════════
   NAV STRUCTURE — grouped dropdown menus
   Each group has an icon, label, and children (sub-items).
   Children have a pageId that maps to the router in App.jsx,
   plus optional action/subPage for triggering modals/tabs.
   ═══════════════════════════════════════════════════════════════ */

export const NAV_GROUPS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: true,
    children: [
      { id: "dashboard", label: "Overview", pageId: "dashboard" },
    ]
  },
  { id: "sales-grp", label: "Sales", icon: TrendingUp,
    children: [
      { id: "sales", label: "Sales Bills", pageId: "sales" },
      { id: "sales-new", label: "New Tax Invoice", pageId: "sales", action: "newBill" },
      { id: "sales-proforma", label: "New Proforma Invoice", pageId: "sales", action: "newProforma" },
      { id: "sales-return", label: "Sales Return", pageId: "returns", subPage: "sales_return" },
      { id: "sales-reports", label: "Sales Reports", pageId: "reports", subPage: "sales" },
    ]
  },
  { id: "purchase-grp", label: "Purchase", icon: ShoppingCart,
    children: [
      { id: "purchase", label: "Purchase Bills", pageId: "purchase" },
      { id: "purchase-new", label: "New Purchase Bill", pageId: "purchase", action: "newBill" },
      { id: "purchase-return", label: "Purchase Return", pageId: "returns", subPage: "purchase_return" },
      { id: "purchase-reports", label: "Purchase Reports", pageId: "reports", subPage: "purchase" },
    ]
  },
  { id: "inventory-grp", label: "Inventory", icon: Package,
    children: [
      { id: "inventory", label: "Stock Status", pageId: "inventory" },
      { id: "products", label: "Products", pageId: "products" },
      { id: "categories", label: "Categories", pageId: "products", subPage: "categories" },
      { id: "product-reports", label: "Product Reports", pageId: "reports", subPage: "products" },
    ]
  },
  { id: "accounts-grp", label: "Accounts", icon: IndianRupee,
    children: [
      { id: "pnl", label: "Profit & Loss", pageId: "pnl" },
      { id: "ledger", label: "Ledger", pageId: "ledger" },
      { id: "vendors", label: "Vendors", pageId: "vendors" },
      { id: "transactions", label: "Transactions", pageId: "transactions" },
    ]
  },
  { id: "approvals-grp", label: "Approvals", icon: CheckSquare, adminOnly: true,
    children: [
      { id: "approvals", label: "All Approvals", pageId: "approvals" },
    ]
  },
  { id: "settings-grp", label: "Settings", icon: Settings, alwaysAllow: true,
    children: [
      { id: "profile", label: "Profile", pageId: "settings", subPage: "profile" },
      { id: "theme", label: "Theme", pageId: "settings", subPage: "theme" },
    ]
  },
  { id: "admin-grp", label: "Admin", icon: Shield, adminOnly: true,
    children: [
      { id: "users", label: "Users & Permissions", pageId: "settings", subPage: "users" },
      { id: "activity", label: "Activity Log", pageId: "settings", subPage: "activity" },
      { id: "sessions", label: "Login History", pageId: "settings", subPage: "sessions" },
      { id: "invoice-tpl", label: "Invoice Template", pageId: "settings", subPage: "invoice" },
      { id: "bill-series", label: "Bill Series", pageId: "settings", subPage: "series" },
      { id: "sheets", label: "Google Sheets", pageId: "settings", subPage: "sheets" },
      { id: "export", label: "Export Data", pageId: "settings", subPage: "export" },
    ]
  },
];

// Pages each role can access
const ROLE_PAGES = {
  admin: null,
  manager: ["dashboard","sales","purchase","returns","inventory","reports","pnl","products","vendors","transactions","ledger","settings"],
  sales: ["sales","returns","products","vendors","ledger","settings","inventory"],
  purchase: ["purchase","returns","vendors","inventory","ledger","settings","products"],
  accountant: ["sales","purchase","returns","inventory","pnl","transactions","ledger","settings"],
  production: ["products","inventory","reports","settings"],
};
export { ROLE_PAGES };

// Filter nav groups based on user role
export const getVisibleGroups = (user) => {
  if (!user) return [];
  const role = user.role?.toLowerCase() || "";
  const allowed = ROLE_PAGES[role];
  const locked = user.lockedPages || [];

  return NAV_GROUPS.filter(g => {
    if (g.adminOnly && role !== "admin") return false;
    if (g.alwaysAllow) return true;
    // Group visible if at least one child page is allowed
    return g.children.some(c => {
      if (allowed === null) return true; // admin
      return allowed.includes(c.pageId) && !locked.includes(c.pageId);
    });
  }).map(g => {
    if (g.alwaysAllow || !allowed) return g;
    return { ...g, children: g.children.filter(c => allowed.includes(c.pageId) && !locked.includes(c.pageId)) };
  });
};

function Avatar({ user, size = 32 }) {
  const T = useT();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: T.accentBg, border: `1px solid ${T.accent}25`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.42, color: T.accent, flexShrink: 0, userSelect: "none" }}>
      {(user?.name || "?")[0].toUpperCase()}
    </div>
  );
}

/* ── Notification Dropdown ──────────────────────────────── */
function NotificationDropdown({ ctx, user, onNav, onClose }) {
  const T = useT();
  const { changeReqs, actLog, products, getStock } = ctx;
  const pending = (changeReqs || []).filter(r => r.status === "pending");
  const recentLogs = (actLog || []).slice(0, 5);
  const lowStock = (products || []).filter(p => { const s = getStock(p.id); return s > 0 && s <= Number(p.minStock || 0); });
  const oos = (products || []).filter(p => getStock(p.id) <= 0);

  return (
    <div className="glass-strong spring-down notif-dropdown" onClick={e => e.stopPropagation()}
      style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 320, borderRadius: T.radius, overflow: "hidden", zIndex: 200 }}>
      <div style={{ padding: "10px 16px", background: T.surfaceStrong, borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 12, color: T.text }}>Notifications</div>
        {(pending.length + lowStock.length + oos.length) > 0 && (
          <span style={{ background: T.redBg, color: T.red, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99 }}>{pending.length + lowStock.length + oos.length}</span>
        )}
      </div>
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {(oos.length > 0 || lowStock.length > 0) && (
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.borderSubtle}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: ".05em", marginBottom: 8 }}>STOCK ALERTS</div>
            {oos.length > 0 && (
              <button onClick={() => { onNav("inventory"); onClose(); }} className="liquid-trans"
                style={{ width: "100%", textAlign: "left", padding: 10, borderRadius: T.radius, border: `1px solid ${T.red}20`, background: T.redBg, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12 }}>
                <AlertOctagon size={14} color={T.red} />
                <div><div style={{ fontWeight: 700, color: T.red }}>{oos.length} Out of Stock</div></div>
              </button>
            )}
            {lowStock.length > 0 && (
              <button onClick={() => { onNav("inventory"); onClose(); }} className="liquid-trans"
                style={{ width: "100%", textAlign: "left", padding: 10, borderRadius: T.radius, border: `1px solid ${T.amber}20`, background: T.amberBg, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <AlertTriangle size={14} color={T.amber} />
                <div><div style={{ fontWeight: 700, color: T.amber }}>{lowStock.length} Low Stock</div></div>
              </button>
            )}
          </div>
        )}
        {user.role === "admin" && pending.length > 0 && (
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.borderSubtle}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: ".05em", marginBottom: 8 }}>APPROVALS</div>
            <button onClick={() => { onNav("approvals"); onClose(); }} className="liquid-trans"
              style={{ width: "100%", textAlign: "left", padding: 10, borderRadius: T.radius, border: `1px solid ${T.accent}25`, background: T.accentBg, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <CheckSquare size={14} color={T.accent} />
              <div style={{ fontWeight: 700, color: T.text }}>{pending.length} pending</div>
            </button>
          </div>
        )}
        <div style={{ padding: "10px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: ".05em", marginBottom: 8 }}>RECENT</div>
          {recentLogs.length === 0 ? <div style={{ fontSize: 11, color: T.textMuted, textAlign: "center", padding: 16 }}>No activity</div> :
            recentLogs.map((log, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10, fontSize: 11 }}>
                <Activity size={11} color={T.blue} style={{ marginTop: 3, flexShrink: 0 }} />
                <div><span style={{ fontWeight: 600, color: T.textSub }}>{log.userName}</span> {log.action} <span style={{ fontWeight: 600 }}>{log.entityName}</span>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>{new Date(log.ts).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DESKTOP SIDEBAR — grouped dropdown navigation
   ═══════════════════════════════════════════════════════════════ */
export default function Sidebar({ page, onNav, user, onLogout, ctx }) {
  const T = useT();
  const { logoUrl } = ctx || {};
  const groups = getVisibleGroups(user);
  const [openGroups, setOpenGroups] = useState(() => {
    // Auto-open the group containing current page
    const active = groups.find(g => g.children.some(c => c.pageId === page));
    return active ? { [active.id]: true } : {};
  });

  const toggleGroup = id => setOpenGroups(p => ({ ...p, [id]: !p[id] }));

  // Auto-open group when page changes
  useEffect(() => {
    const active = groups.find(g => g.children.some(c => c.pageId === page));
    if (active && !openGroups[active.id]) setOpenGroups(p => ({ ...p, [active.id]: true }));
  }, [page]);

  return (
    <div className="desktop-sidebar" style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: T.sidebarW, display: "flex", flexDirection: "column", zIndex: 100, background: T.sidebarBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRight: `1px solid ${T.border}` }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        {logoUrl ?
          <img src={logoUrl} alt="logo" style={{ width: 30, height: 30, objectFit: "contain", flexShrink: 0 }} />
          : <div style={{ width: 30, height: 30, borderRadius: 8, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 10px ${T.accent}40`, flexShrink: 0 }}>
              <Hexagon size={17} color="#fff" strokeWidth={2.5} />
            </div>
        }
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: T.text, letterSpacing: "-0.02em" }}>StockWise</div>
          <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 700, marginTop: -1, textTransform: "uppercase", letterSpacing: ".08em" }}>ERP System</div>
        </div>
      </div>

      {/* Nav Groups */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "4px 0" }}>
        {groups.map(g => {
          const isOpen = openGroups[g.id];
          const hasActiveChild = g.children.some(c => c.pageId === page);
          // Single-child groups just navigate directly
          if (g.children.length === 1) {
            const c = g.children[0];
            return (
              <button key={g.id} className={`nav-item ${c.pageId === page ? "active" : ""}`}
                onClick={() => onNav(c.pageId, c.action, c.subPage)}>
                <g.icon size={16} strokeWidth={c.pageId === page ? 2.5 : 2} />
                <span>{g.label}</span>
              </button>
            );
          }
          return (
            <div key={g.id} style={{ marginBottom: 2 }}>
              <button className="nav-group-hd" onClick={() => toggleGroup(g.id)}
                style={{ color: hasActiveChild ? T.accent : T.textMuted }}>
                <g.icon size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{g.label}</span>
                <ChevronDown size={12} style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }} />
              </button>
              {isOpen && (
                <div className="spring-down" style={{ marginBottom: 4 }}>
                  {g.children.map(c => (
                    <button key={c.id} className={`nav-sub ${c.pageId === page ? "active" : ""}`}
                      onClick={() => onNav(c.pageId, c.action, c.subPage)}>
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User footer */}
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.borderSubtle}`, display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar user={user} size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
          <div style={{ fontSize: 10, color: T.textMuted, textTransform: "capitalize" }}>{user?.role}</div>
        </div>
        <button onClick={onLogout} className="btn-ghost" style={{ padding: 6, borderRadius: "50%" }} title="Sign Out">
          <LogOut size={14} color={T.textMuted} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE BOTTOM NAV — 4 quick items + More sheet
   ═══════════════════════════════════════════════════════════════ */
export function MobNav({ page, onNav, user, onLogout, ctx }) {
  const T = useT();
  const [showMenu, setShowMenu] = useState(false);
  const groups = getVisibleGroups(user);
  // Quick-access: first page from first 4 visible groups
  const quickItems = groups.slice(0, 4).map(g => ({ ...g.children[0], icon: g.icon, groupLabel: g.label }));

  return <>
    {showMenu && (
      <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }} onClick={() => setShowMenu(false)}>
        <div className="glass-strong spring-down" onClick={e => e.stopPropagation()} style={{ position: "fixed", bottom: 72, left: 8, right: 8, borderRadius: T.radiusXl, padding: 16, maxHeight: "75vh", overflowY: "auto" }}>
          {groups.map(g => (
            <div key={g.id} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: T.textMuted, letterSpacing: ".06em", textTransform: "uppercase", padding: "4px 8px", display: "flex", alignItems: "center", gap: 6 }}>
                <g.icon size={12} /> {g.label}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 4 }}>
                {g.children.map(c => (
                  <button key={c.id} onClick={() => { onNav(c.pageId, c.action, c.subPage); setShowMenu(false); }}
                    style={{ padding: "10px 12px", borderRadius: T.radius, border: `1px solid ${c.pageId === page ? T.accent : T.borderSubtle}`, background: c.pageId === page ? T.accentBg : "transparent", cursor: "pointer", fontSize: 11, fontWeight: c.pageId === page ? 700 : 500, color: c.pageId === page ? T.accent : T.textSub, textAlign: "left" }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    <div className="mobile-nav" style={{ boxShadow: "0 -2px 16px rgba(0,0,0,0.08)" }}>
      {quickItems.map(n => {
        const Icon = n.icon;
        const isActive = n.pageId === page;
        return (
          <button key={n.id} onClick={() => onNav(n.pageId)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "10px 4px", border: "none", background: "transparent", cursor: "pointer", color: isActive ? T.accent : T.textMuted, transition: "color .2s" }}>
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500 }}>{n.groupLabel}</span>
          </button>
        );
      })}
      <button onClick={() => setShowMenu(true)}
        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "10px 4px", border: "none", background: "transparent", cursor: "pointer", color: T.textMuted }}>
        <Layers size={20} />
        <span style={{ fontSize: 9, fontWeight: 600 }}>More</span>
      </button>
    </div>
  </>;
}

/* ═══════════════════════════════════════════════════════════════
   TOP BAR — compact, profile visible everywhere
   ═══════════════════════════════════════════════════════════════ */
export function TopBar({ page, user, syncSt, onSync, toggleTheme, isDark, onNav, ctx, onLogout }) {
  const T = useT();
  const { changeReqs, products, getStock } = ctx;
  const titles = { dashboard:"Dashboard", sales:"Sales", purchase:"Purchase", returns:"Returns", inventory:"Inventory", reports:"Reports", pnl:"P&L", products:"Products", vendors:"Vendors", transactions:"Transactions", ledger:"Ledger", approvals:"Approvals", settings:"Settings" };

  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const pending = (changeReqs || []).filter(r => r.status === "pending");
  const lowCnt = (products || []).filter(p => { const s = getStock(p.id); return s > 0 && s <= Number(p.minStock||0); }).length;
  const oosCnt = (products || []).filter(p => getStock(p.id) <= 0).length;
  const badgeCnt = (user.role === "admin" ? pending.length : 0) + lowCnt + oosCnt;

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 40, background: T.surfaceGlass, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", padding: "8px 14px", margin: "-8px -14px 16px -14px", borderBottom: `1px solid ${T.borderSubtle}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <h2 style={{ fontWeight: 800, fontSize: 17, color: T.text, letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titles[page] || "StockWise"}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button onClick={onSync} className="btn-ghost hide-mob" style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20 }}>
            <RefreshCw size={12} style={{ animation: syncSt === "syncing" ? "spin 1s linear infinite" : "none", marginRight: 4 }} />
            {syncSt === "syncing" ? "Sync…" : "Synced"}
          </button>
          <button onClick={toggleTheme} className="btn-ghost" style={{ width: 32, height: 32, padding: 0, borderRadius: "50%" }}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }} className="btn-ghost" style={{ width: 32, height: 32, padding: 0, borderRadius: "50%" }}>
              <Bell size={14} />
              {badgeCnt > 0 && <span style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: "50%", background: T.red, border: `2px solid ${T.surfaceGlass}` }} />}
            </button>
            {showNotif && <>
              <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowNotif(false)} />
              <NotificationDropdown ctx={ctx} user={user} onNav={onNav} onClose={() => setShowNotif(false)} />
            </>}
          </div>
          <div style={{ position: "relative" }}>
            <div onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }} style={{ cursor: "pointer" }}>
              <Avatar user={user} size={30} />
            </div>
            {showProfile && <>
              <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowProfile(false)} />
              <div className="glass-strong spring-down" onClick={e => e.stopPropagation()}
                style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 200, borderRadius: T.radius, padding: 6, zIndex: 200 }}>
                <div style={{ padding: "8px 10px 12px", borderBottom: `1px solid ${T.borderSubtle}`, marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: T.text }}>{user?.name}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, textTransform: "capitalize" }}>{user?.role}</div>
                </div>
                <button onClick={() => { onNav("settings", null, "profile"); setShowProfile(false); }} className="btn-ghost" style={{ width: "100%", justifyContent: "flex-start", padding: "7px 10px", fontSize: 11, border: "none", background: "transparent" }}>
                  <User size={13} /> Profile
                </button>
                <button onClick={() => { onNav("settings", null, "export"); setShowProfile(false); }} className="btn-ghost" style={{ width: "100%", justifyContent: "flex-start", padding: "7px 10px", fontSize: 11, border: "none", background: "transparent" }}>
                  <Download size={13} /> Export Data
                </button>
                <div style={{ borderTop: `1px solid ${T.borderSubtle}`, marginTop: 4, paddingTop: 4 }}>
                  <button onClick={() => { onLogout(); setShowProfile(false); }} className="btn-ghost" style={{ width: "100%", justifyContent: "flex-start", padding: "7px 10px", fontSize: 11, border: "none", background: "transparent", color: T.red }}>
                    <LogOut size={13} color={T.red} /> Sign Out
                  </button>
                </div>
              </div>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}
