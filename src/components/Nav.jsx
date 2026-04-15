import React, { useState } from "react";
import { LayoutDashboard, TrendingUp, ShoppingCart, RotateCcw, Package, BarChart2, PieChart, Tag, Users, ArrowLeftRight, CheckSquare, Settings, LogOut, Bell, CheckCircle, RefreshCw, Sun, Moon, Layers, X, User, Download, Hexagon } from "lucide-react";
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

function Avatar({ user, size = 32 }) {
  const T = useT();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: T.accentBg, border: `1px solid ${T.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: size * 0.45, color: T.accent, flexShrink: 0, userSelect: "none" }}>
      {(user?.name || "?")[0].toUpperCase()}
    </div>
  );
}

function ProfileDropdown({ user, onClose, setPage, setSettingsTab, onLogout, align = "left" }) {
  const T = useT();
  const menuItems = [
    { icon: User, label: "Edit Profile", action: () => { setPage("settings"); setSettingsTab?.("profile"); onClose(); } },
    { icon: Download, label: "Export Data", action: () => { setPage("settings"); setSettingsTab?.("export"); onClose(); } },
    { icon: Settings, label: "Settings", action: () => { setPage("settings"); onClose(); } },
  ];
  return (
    <div className="glass-strong spring-down" onClick={e => e.stopPropagation()}
      style={{ position: "absolute", [align === "right" ? "right" : "left"]: 0, top: "calc(100% + 8px)", width: 220, borderRadius: T.radius, padding: 8, zIndex: 200 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px 12px", borderBottom: `1px solid ${T.borderSubtle}`, marginBottom: 4 }}>
        <Avatar user={user} size={36} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: T.textMuted, textTransform: "capitalize" }}>{user?.role}</div>
        </div>
      </div>
      {menuItems.map(item => (
        <button key={item.label} onClick={item.action} className="btn-ghost"
          style={{ width: "100%", justifyContent: "flex-start", padding: "8px 10px", margin: "2px 0", border: "none", background: "transparent" }}>
          <item.icon size={14} color={T.textSub} /><span style={{ fontSize: 13 }}>{item.label}</span>
        </button>
      ))}
      <div style={{ borderTop: `1px solid ${T.borderSubtle}`, marginTop: 4, paddingTop: 4 }}>
        <button onClick={() => { onLogout(); onClose(); }} className="btn-ghost"
          style={{ width: "100%", justifyContent: "flex-start", padding: "8px 10px", border: "none", background: "transparent", color: T.red }}>
          <LogOut size={14} color={T.red} /><span style={{ fontSize: 13 }}>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ page, setPage, user, onLogout, isDark, toggleTheme, ctx }) {
  const T = useT();
  const { logoUrl, changeReqs, setSettingsTab } = ctx || {};
  const pendingCnt = (changeReqs || []).filter(r => r.status === "pending").length;
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="desktop-sidebar" style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: T.sidebarW, display: "flex", flexDirection: "column", zIndex: 50, background: T.sidebarBg, borderRight: `1px solid ${T.border}` }}>
      
      {/* Sleek Logo Area */}
      <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        {logoUrl ? 
          <img src={logoUrl} alt="logo" style={{ width: 32, height: 32, objectFit: "contain" }} /> 
          : <Hexagon size={28} color={T.accent} strokeWidth={2.5} />
        }
        <div>
          <div style={{ fontFamily: T.displayFont, fontWeight: 700, fontSize: 18, color: T.text, letterSpacing: "-0.02em" }}>StockWise</div>
          <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 500, marginTop: -2, textTransform: "uppercase", letterSpacing: "0.05em" }}>ERP System</div>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: "0.05em", padding: "0 10px 8px", textTransform: "uppercase" }}>Main Menu</div>
        {visNav(user).map(n => {
          const isActive = page === n.id;
          return (
            <button key={n.id} className={`nav-item ${isActive ? "active" : ""}`} onClick={() => setPage(n.id)}>
              <n.icon size={18} strokeWidth={isActive ? 2.5 : 2} color={isActive ? T.accent : T.textSub} />
              <span>{n.label}</span>
              {n.id === "approvals" && pendingCnt > 0 && <span style={{ marginLeft: "auto", minWidth: 20, height: 20, borderRadius: "10px", background: T.red, color: "#fff", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>{pendingCnt}</span>}
            </button>
          );
        })}
      </div>

      {/* Clean Bottom Profile Area */}
      <div style={{ padding: "16px", borderTop: `1px solid ${T.borderSubtle}` }}>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowProfile(p => !p)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "8px", borderRadius: T.radius, border: "none", background: showProfile ? T.surfaceStrong : "transparent", cursor: "pointer", transition: "all .2s" }}>
            <Avatar user={user} size={36} />
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: T.textMuted, textTransform: "capitalize" }}>{user?.role}</div>
            </div>
            <Settings size={14} color={T.textMuted} />
          </button>
          {showProfile && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowProfile(false)} />
              <ProfileDropdown user={user} onClose={() => setShowProfile(false)} setPage={setPage} setSettingsTab={setSettingsTab} onLogout={onLogout} align="left" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile Nav remains largely the same structurally, just adopting new colors
export function MobNav({ page, setPage, user, onLogout, isDark, toggleTheme, pendingCnt, ctx }) {
  const T = useT();
  const { setSettingsTab } = ctx || {};
  const [showMenu, setShowMenu] = useState(false);
  const allItems = visNav(user);
  const mainItems = allItems.slice(0, 4); 
  const hasMore = allItems.length > 4;

  return <>
    {showMenu && (
      <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.4)" }} onClick={() => setShowMenu(false)}>
        <div className="glass-strong spring-up" onClick={e => e.stopPropagation()} style={{ position: "fixed", bottom: 70, left: 16, right: 16, borderRadius: T.radius, padding: "16px", maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {allItems.map(n => (
              <button key={n.id} onClick={() => { setPage(n.id); setShowMenu(false); }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 8px", borderRadius: T.radius, border: `1px solid ${page === n.id ? T.accent : T.border}`, background: page === n.id ? T.accentBg : T.surface, cursor: "pointer" }}>
                <n.icon size={22} color={page === n.id ? T.accent : T.textSub} />
                <span style={{ fontSize: 11, fontWeight: page === n.id ? 600 : 500, color: page === n.id ? T.accent : T.textSub }}>{n.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}

    <div className="mobile-nav">
      {mainItems.map(n => {
        const isActive = page === n.id;
        return (
          <button key={n.id} onClick={() => setPage(n.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "12px 4px", border: "none", background: "transparent", cursor: "pointer", color: isActive ? T.accent : T.textMuted }}>
            <n.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500 }}>{n.label.split(" ")[0]}</span>
          </button>
        );
      })}
      {hasMore && (
        <button onClick={() => setShowMenu(true)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "12px 4px", border: "none", background: "transparent", cursor: "pointer", color: showMenu ? T.accent : T.textMuted }}>
          <Layers size={22} />
          <span style={{ fontSize: 10, fontWeight: 500 }}>More</span>
        </button>
      )}
    </div>
  </>;
}

export function TopBar({ page, user, syncSt, lastSync, onSync, toggleTheme, isDark, setPage, ctx, onLogout }) {
  const T = useT();
  const { changeReqs, products, getStock, setSettingsTab } = ctx;
  const titles = { dashboard:"Dashboard", sales:"Sales", purchase:"Purchase", returns:"Returns", inventory:"Inventory", reports:"Reports", pnl:"P&L", products:"Products", vendors:"Vendors", transactions:"Transactions", approvals:"Approvals", settings:"Settings" };
  const [showProfile, setShowProfile] = useState(false);
  const pending = (changeReqs || []).filter(r => r.status === "pending");
  const alertsCnt = products.filter(p => getStock(p.id) <= Number(p.minStock)).length;
  const badgeCnt = user.role === "admin" ? (pending.length + alertsCnt) : alertsCnt;

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 40, background: T.bg, padding: "16px 0", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: T.displayFont, fontWeight: 700, fontSize: 24, color: T.text, letterSpacing: "-0.02em" }}>{titles[page] || "StockWise"}</h2>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onSync} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12, borderRadius: 20 }}>
            <RefreshCw size={12} style={{ animation: syncSt === "syncing" ? "spin 1s linear infinite" : "none", marginRight: 6 }} />
            {syncSt === "syncing" ? "Syncing..." : "Synced"}
          </button>

          <button onClick={toggleTheme} className="btn-ghost" style={{ width: 36, height: 36, padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div style={{ position: "relative" }}>
            <div onClick={() => setShowProfile(p => !p)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
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
