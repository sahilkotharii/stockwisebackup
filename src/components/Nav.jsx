import React, { useState, useEffect } from "react";
import { LayoutDashboard, TrendingUp, ShoppingCart, RotateCcw, Package, BarChart2, PieChart, Tag, Users, ArrowLeftRight, CheckSquare, Settings, LogOut, Bell, RefreshCw, Sun, Moon, Layers, X, User, Download, Hexagon, ChevronLeft, ChevronRight, Activity, AlertTriangle, AlertOctagon } from "lucide-react";
import { useT } from "../theme";

export const ALL_NAV = [
  { id: "dashboard",    label: "Dashboard",    icon: LayoutDashboard,  alwaysAllow: true },
  { id: "sales",        label: "Sales",        icon: TrendingUp },
  { id: "purchase",     label: "Purchase",     icon: ShoppingCart },
  { id: "returns",      label: "Returns",      icon: RotateCcw },
  { id: "inventory",    label: "Inventory",    icon: Package },
  { id: "reports",      label: "Reports",      icon: BarChart2 },
  { id: "pnl",          label: "P&L",          icon: PieChart },
  { id: "products",     label: "Products",     icon: Tag },
  { id: "vendors",      label: "Vendors",      icon: Users },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "approvals",    label: "Approvals",    icon: CheckSquare, adminOnly: true },
  { id: "settings",     label: "Settings",     icon: Settings, alwaysAllow: true },
];

const ROLE_PAGES = {
  admin:      null,
  manager:    ["dashboard","sales","purchase","returns","inventory","reports","pnl","products","vendors","transactions","settings"],
  sales:      ["dashboard","sales","inventory","returns","vendors","settings"],
  purchase:   ["dashboard","purchase","vendors","inventory","settings"],
  accountant: ["dashboard","sales","purchase","returns","inventory","pnl","transactions","settings"],
  production: ["dashboard","products","inventory","reports","settings"],
};
export { ROLE_PAGES };

export const visNav = (user) => {
  if (!user || user.role === "admin") return ALL_NAV;
  const allowed = ROLE_PAGES[user.role] || ROLE_PAGES.manager;
  const locked = user.lockedPages || [];
  return ALL_NAV.filter(n => allowed.includes(n.id) && !locked.includes(n.id));
};

function Avatar({ user, size = 36 }) {
  const T = useT();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: T.accentBg, border: `1px solid ${T.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.45, color: T.accent, flexShrink: 0, userSelect: "none" }}>
      {(user?.name || "?")[0].toUpperCase()}
    </div>
  );
}

function ProfileDropdown({ user, onClose, setPage, setSettingsTab, onLogout }) {
  const T = useT();
  const menuItems = [
    { icon: User, label: "Edit Profile", action: () => { setPage("settings"); setSettingsTab?.("profile"); onClose(); } },
    { icon: Download, label: "Export Data", action: () => { setPage("settings"); setSettingsTab?.("export"); onClose(); } },
    { icon: Settings, label: "Settings", action: () => { setPage("settings"); onClose(); } },
  ];
  return (
    <div className="glass-strong spring-down" onClick={e => e.stopPropagation()}
      style={{ position: "absolute", right: 0, top: "calc(100% + 12px)", width: 240, borderRadius: T.radius, padding: 8, zIndex: 200 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px 16px", borderBottom: `1px solid ${T.borderSubtle}`, marginBottom: 4 }}>
        <Avatar user={user} size={40} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: T.textMuted, textTransform: "capitalize", fontWeight: 500 }}>{user?.role}</div>
        </div>
      </div>
      {menuItems.map(item => (
        <button key={item.label} onClick={item.action} className="btn-ghost"
          style={{ width: "100%", justifyContent: "flex-start", padding: "10px 12px", margin: "2px 0", border: "none", background: "transparent" }}>
          <item.icon size={16} color={T.textSub} /><span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
        </button>
      ))}
      <div style={{ borderTop: `1px solid ${T.borderSubtle}`, marginTop: 4, paddingTop: 4 }}>
        <button onClick={() => { onLogout(); onClose(); }} className="btn-ghost"
          style={{ width: "100%", justifyContent: "flex-start", padding: "10px 12px", border: "none", background: "transparent", color: T.red }}>
          <LogOut size={16} color={T.red} /><span style={{ fontSize: 13, fontWeight: 600 }}>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

/* ── Notification Dropdown — now includes stock alerts ────────── */
function NotificationDropdown({ ctx, user, setPage, onClose }) {
  const T = useT();
  const { changeReqs, actLog, products, getStock } = ctx;
  const pending = (changeReqs || []).filter(r => r.status === "pending");
  const recentLogs = (actLog || []).slice(0, 5);

  // Stock alerts
  const lowStock = (products || []).filter(p => {
    const s = getStock(p.id);
    return s > 0 && s <= Number(p.minStock || 0);
  });
  const oos = (products || []).filter(p => getStock(p.id) <= 0);
  const stockAlertCount = lowStock.length + oos.length;

  return (
    <div className="glass-strong spring-down notif-dropdown" onClick={e => e.stopPropagation()}
      style={{ position: "absolute", right: 0, top: "calc(100% + 12px)", width: 340, borderRadius: T.radius, overflow: "hidden", zIndex: 200 }}>
      
      <div style={{ padding: "14px 20px", background: T.surfaceStrong, borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>Notifications</div>
        {(pending.length + stockAlertCount) > 0 && (
          <span style={{ background: T.redBg, color: T.red, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>{pending.length + stockAlertCount}</span>
        )}
      </div>

      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {/* Stock Alerts — always visible to everyone */}
        {(oos.length > 0 || lowStock.length > 0) && (
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.borderSubtle}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 10, letterSpacing: "0.05em" }}>STOCK ALERTS</div>
            {oos.length > 0 && (
              <button onClick={() => { setPage("inventory"); onClose(); }} className="liquid-trans"
                style={{ width: "100%", textAlign: "left", padding: 12, borderRadius: T.radius, border: `1px solid ${T.red}25`, background: T.redBg, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <AlertOctagon size={16} color={T.red} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.red }}>{oos.length} Out of Stock</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {oos.slice(0, 3).map(p => p.name).join(", ")}{oos.length > 3 ? ` +${oos.length - 3} more` : ""}
                  </div>
                </div>
              </button>
            )}
            {lowStock.length > 0 && (
              <button onClick={() => { setPage("inventory"); onClose(); }} className="liquid-trans"
                style={{ width: "100%", textAlign: "left", padding: 12, borderRadius: T.radius, border: `1px solid ${T.amber}25`, background: T.amberBg, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                <AlertTriangle size={16} color={T.amber} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.amber }}>{lowStock.length} Low Stock</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {lowStock.slice(0, 3).map(p => `${p.name} (${getStock(p.id)})`).join(", ")}{lowStock.length > 3 ? ` +${lowStock.length - 3}` : ""}
                  </div>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Pending Approvals — admin only */}
        {user.role === "admin" && pending.length > 0 && (
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.borderSubtle}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 10, letterSpacing: "0.05em" }}>NEEDS APPROVAL</div>
            <button onClick={() => { setPage("approvals"); onClose(); }} className="liquid-trans" style={{ width: "100%", textAlign: "left", padding: 12, borderRadius: T.radius, border: `1px solid ${T.accent}30`, background: T.accentBg, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
              <CheckSquare size={16} color={T.accent} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{pending.length} pending request{pending.length !== 1 ? "s" : ""}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Click to review</div>
              </div>
            </button>
          </div>
        )}

        {/* Recent Activity */}
        <div style={{ padding: "12px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 10, letterSpacing: "0.05em" }}>RECENT ACTIVITY</div>
          {recentLogs.length === 0 ? (
            <div style={{ fontSize: 12, color: T.textMuted, textAlign: "center", padding: "20px 0" }}>No recent activity</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentLogs.map((log, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${T.blue}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <Activity size={12} color={T.blue} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>
                      <strong style={{ color: T.textSub }}>{log.userName}</strong> {log.action} <strong style={{ color: T.text }}>{log.entityName}</strong>
                    </div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{new Date(log.ts).toLocaleTimeString("en-IN", {hour:"2-digit", minute:"2-digit"})}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: 12, borderTop: `1px solid ${T.borderSubtle}`, textAlign: "center", background: T.surfaceStrong }}>
        <button onClick={() => { setPage("settings"); ctx.setSettingsTab?.("activity"); onClose(); }} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View All Activity</button>
      </div>
    </div>
  );
}

/* ── Desktop Sidebar ─────────────────────────────────────────── */
export default function Sidebar({ page, setPage, user, onLogout, isDark, toggleTheme, ctx }) {
  const T = useT();
  const { logoUrl, changeReqs } = ctx || {};
  const pendingCnt = (changeReqs || []).filter(r => r.status === "pending").length;
  
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (collapsed) document.body.classList.add('sidebar-collapsed');
    else document.body.classList.remove('sidebar-collapsed');
  }, [collapsed]);

  const currentW = collapsed ? 88 : T.sidebarW;

  return (
    <div className="desktop-sidebar glass" style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: currentW, display: "flex", flexDirection: "column", zIndex: 100, background: T.sidebarBg, borderRight: `1px solid ${T.border}`, borderRadius: 0, borderTop: "none", borderBottom: "none", boxShadow: "none" }}>
      
      <button onClick={() => setCollapsed(!collapsed)} className="liquid-trans" style={{ position: 'absolute', right: -14, top: 36, width: 28, height: 28, borderRadius: '50%', padding: 0, background: T.surfaceStrong, border: `1px solid ${T.border}`, zIndex: 110, boxShadow: T.shadow, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {collapsed ? <ChevronRight size={16} color={T.textSub}/> : <ChevronLeft size={16} color={T.textSub}/>}
      </button>

      <div style={{ padding: collapsed ? "32px 0" : "32px 24px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 14, overflow: "hidden" }}>
        {logoUrl ? 
          <img src={logoUrl} alt="logo" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} /> 
          : <div className="liquid-trans" style={{ width: 36, height: 36, borderRadius: 10, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${T.accent}50`, flexShrink: 0 }}>
              <Hexagon size={22} color="#fff" strokeWidth={2.5} />
            </div>
        }
        <div style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto", transition: "opacity 0.3s ease" }}>
          <div style={{ fontFamily: T.displayFont, fontWeight: 800, fontSize: 20, color: T.text, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>StockWise</div>
          <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, marginTop: -2, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>ERP System</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 0", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.textMuted, letterSpacing: "0.1em", padding: collapsed ? "0 0 12px" : "0 24px 12px", textAlign: collapsed ? "center" : "left", textTransform: "uppercase", opacity: collapsed ? 0 : 1, transition: "opacity 0.3s ease" }}>
          {!collapsed && "Main Menu"}
        </div>
        {visNav(user).map(n => {
          const isActive = page === n.id;
          return (
            <button key={n.id} className={`nav-item liquid-trans ${isActive ? "active" : ""}`} onClick={() => setPage(n.id)} title={collapsed ? n.label : ""} style={{ justifyContent: collapsed ? "center" : "flex-start", margin: collapsed ? "4px 16px" : "4px 12px", padding: collapsed ? "12px" : "10px 14px" }}>
              <n.icon size={20} strokeWidth={isActive ? 2.5 : 2} color={isActive ? T.accent : T.textSub} style={{ flexShrink: 0 }} />
              <span style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto", transition: "opacity 0.3s ease" }}>{n.label}</span>
              {!collapsed && n.id === "approvals" && pendingCnt > 0 && <span style={{ marginLeft: "auto", minWidth: 22, height: 22, borderRadius: "11px", background: T.red, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px", boxShadow: `0 2px 8px ${T.red}50` }}>{pendingCnt}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Mobile Bottom Nav ───────────────────────────────────────── */
export function MobNav({ page, setPage, user, onLogout, isDark, toggleTheme, pendingCnt, ctx }) {
  const T = useT();
  const [showMenu, setShowMenu] = useState(false);
  const allItems = visNav(user);
  const mainItems = allItems.slice(0, 4); 
  const hasMore = allItems.length > 4;

  return <>
    {showMenu && (
      <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setShowMenu(false)}>
        <div className="glass-strong spring-down" onClick={e => e.stopPropagation()} style={{ position: "fixed", bottom: 80, left: 12, right: 12, borderRadius: T.radiusXl, padding: "20px", maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {allItems.map(n => (
              <button key={n.id} onClick={() => { setPage(n.id); setShowMenu(false); }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "14px 6px", borderRadius: T.radius, border: `1px solid ${page === n.id ? T.accent : T.border}`, background: page === n.id ? T.accentBg : T.surface, cursor: "pointer", transition: "all 0.2s ease" }}>
                <n.icon size={22} strokeWidth={page === n.id ? 2.5 : 2} color={page === n.id ? T.accent : T.textSub} />
                <span style={{ fontSize: 11, fontWeight: page === n.id ? 700 : 500, color: page === n.id ? T.accent : T.textSub }}>{n.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}

    <div className="mobile-nav" style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.1)" }}>
      {mainItems.map(n => {
        const isActive = page === n.id;
        return (
          <button key={n.id} onClick={() => setPage(n.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "12px 4px", border: "none", background: "transparent", cursor: "pointer", color: isActive ? T.accent : T.textMuted, transition: "color 0.2s ease" }}>
            <n.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{n.label.split(" ")[0]}</span>
          </button>
        );
      })}
      {hasMore && (
        <button onClick={() => setShowMenu(true)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "12px 4px", border: "none", background: "transparent", cursor: "pointer", color: showMenu ? T.accent : T.textMuted, transition: "color 0.2s ease" }}>
          <Layers size={22} />
          <span style={{ fontSize: 10, fontWeight: 600 }}>More</span>
        </button>
      )}
    </div>
  </>;
}

/* ── Top Bar — profile avatar visible on BOTH mobile and desktop ─ */
export function TopBar({ page, user, syncSt, lastSync, onSync, toggleTheme, isDark, setPage, ctx, onLogout }) {
  const T = useT();
  const { changeReqs, products, getStock, setSettingsTab } = ctx;
  const titles = { dashboard:"Dashboard", sales:"Sales", purchase:"Purchase", returns:"Returns", inventory:"Inventory", reports:"Reports", pnl:"P&L", products:"Products", vendors:"Vendors", transactions:"Transactions", approvals:"Approvals", settings:"Settings" };
  
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  
  const pending = (changeReqs || []).filter(r => r.status === "pending");
  const lowStockCount = (products || []).filter(p => { const s = getStock(p.id); return s > 0 && s <= Number(p.minStock || 0); }).length;
  const oosCount = (products || []).filter(p => getStock(p.id) <= 0).length;
  const badgeCnt = (user.role === "admin" ? pending.length : 0) + lowStockCount + oosCount;

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 40, background: T.surfaceGlass, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", padding: "12px 16px", margin: "-12px -16px 20px -16px", borderBottom: `1px solid ${T.borderSubtle}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        {/* Title */}
        <h2 style={{ fontFamily: T.displayFont, fontWeight: 800, fontSize: 22, color: T.text, letterSpacing: "-0.03em", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titles[page] || "StockWise"}</h2>
        
        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* Sync button — desktop only */}
          <button onClick={onSync} className="btn-ghost hide-mob" style={{ padding: "8px 14px", fontSize: 12, borderRadius: 30, background: T.surface, boxShadow: T.shadow }}>
            <RefreshCw size={14} style={{ animation: syncSt === "syncing" ? "spin 1s linear infinite" : "none", marginRight: 6 }} />
            <span style={{ fontWeight: 600 }}>{syncSt === "syncing" ? "Syncing…" : "Synced"}</span>
          </button>

          {/* Theme toggle */}
          <button onClick={toggleTheme} className="btn-ghost" style={{ width: 36, height: 36, padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: T.surface, boxShadow: T.shadow }}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }} className="btn-ghost" style={{ width: 36, height: 36, padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: T.surface, boxShadow: T.shadow }}>
              <Bell size={16} />
              {badgeCnt > 0 && <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: T.red, border: `2px solid ${T.surface}`, boxShadow: `0 0 8px ${T.red}` }} />}
            </button>
            {showNotif && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowNotif(false)} />
                <NotificationDropdown ctx={ctx} user={user} setPage={setPage} onClose={() => setShowNotif(false)} />
              </>
            )}
          </div>

          {/* Profile — VISIBLE on both mobile and desktop */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <div onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }} className="liquid-trans" style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <Avatar user={user} size={36} />
            </div>
            {showProfile && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowProfile(false)} />
                <ProfileDropdown user={user} onClose={() => setShowProfile(false)} setPage={setPage} setSettingsTab={setSettingsTab} onLogout={onLogout} align="right" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
