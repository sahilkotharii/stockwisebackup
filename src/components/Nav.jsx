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

function Avatar({ user, size = 36 }) {
  const T = useT();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: T.accentBg, border: `1px solid ${T.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.45, color: T.accent, flexShrink: 0, userSelect: "none" }}>
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
      style={{ position: "absolute", [align === "right" ? "right" : "left"]: 0, top: "calc(100% + 12px)", width: 240, borderRadius: T.radius, padding: 8, zIndex: 200 }}>
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

export default function Sidebar({ page, setPage, user, onLogout, isDark, toggleTheme, ctx }) {
  const T = useT();
  const { logoUrl, changeReqs, setSettingsTab } = ctx || {};
  const pendingCnt = (changeReqs || []).filter(r => r.status === "pending").length;
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="desktop-sidebar" style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: T.sidebarW, display: "flex", flexDirection: "column", zIndex: 50, background: T.sidebarBg, borderRight: `1px solid ${T.border}` }}>
      
      {/* Sleek Logo Area */}
      <div style={{ padding: "32px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        {logoUrl ? 
          <img src={logoUrl} alt="logo" style={{ width: 36, height: 36, objectFit: "contain" }} /> 
          : <div style={{ width: 36, height: 36, borderRadius: 8, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 10px ${T.accent}40` }}>
              <Hexagon size={22} color="#fff" strokeWidth={2.5} />
            </div>
        }
        <div>
          <div style={{ fontFamily: T.displayFont, fontWeight: 800, fontSize: 20, color: T.text, letterSpacing: "-0.03em" }}>StockWise</div>
          <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, marginTop: -1, textTransform: "uppercase", letterSpacing: "0.08em" }}>ERP System</div>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: "0.08em", padding: "0 24px 12px", textTransform: "uppercase" }}>Main Menu</div>
        {visNav(user).map(n => {
          const isActive = page === n.id;
          return (
            <button key={n.id} className={`nav-item ${isActive ? "active" : ""}`} onClick={() => setPage(n.id)}>
              <n.icon size={20} strokeWidth={isActive ? 2.5 : 2} color={isActive ? T.accent : T.textSub} />
              <span>{n.label}</span>
              {n.id === "approvals" && pendingCnt > 0 && <span style={{ marginLeft: "auto", minWidth: 22, height: 22, borderRadius: "11px", background: T.red, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px", boxShadow: `0 2px 6px ${T.red}40` }}>{pendingCnt}</span>}
            </button>
          );
        })}
      </div>

      {/* Clean Bottom Profile Area */}
      <div style={{ padding: "20px 16px", borderTop: `1px solid ${T.borderSubtle}` }}>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowProfile(p => !p)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px", borderRadius: T.radius, border: "none", background: showProfile ? T.surfaceStrong : "transparent", cursor: "pointer", transition: "all .2s" }}>
            <Avatar user={user} size={38} />
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: T.textMuted, textTransform: "capitalize", fontWeight: 500 }}>{user?.role}</div>
            </div>
            <Settings size={16} color={T.textMuted} />
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

export function MobNav({ page, setPage, user, onLogout, isDark, toggleTheme, pendingCnt, ctx }) {
  const T = useT();
  const { setSettingsTab } = ctx || {};
  const [showMenu, setShowMenu] = useState(false);
  const allItems = visNav(user);
  const mainItems = allItems.slice(0, 4); 
  const hasMore = allItems.length > 4;

  return <>
    {showMenu && (
      <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} onClick={() => setShowMenu(false)}>
        <div className="glass-strong spring-up" onClick={e => e.stopPropagation()} style={{ position: "fixed", bottom: 80, left: 16, right: 16, borderRadius: T.radiusXl, padding: "20px", maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {allItems.map(n => (
              <button key={n.id} onClick={() => { setPage(n.id); setShowMenu(false); }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "16px 8px", borderRadius: T.radius, border: `1px solid ${page === n.id ? T.accent : T.border}`, background: page === n.id ? T.accentBg : T.surface, cursor: "pointer", transition: "all 0.2s" }}>
                <n.icon size={24} strokeWidth={page === n.id ? 2.5 : 2} color={page === n.id ? T.accent : T.textSub} />
                <span style={{ fontSize: 12, fontWeight: page === n.id ? 700 : 500, color: page === n.id ? T.accent : T.textSub }}>{n.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}

    <div className="mobile-nav" style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.05)" }}>
      {mainItems.map(n => {
        const isActive = page === n.id;
        return (
          <button key={n.id} onClick={() => setPage(n.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px 4px", border: "none", background: "transparent", cursor: "pointer", color: isActive ? T.accent : T.textMuted, transition: "color 0.2s" }}>
            <n.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500 }}>{n.label.split(" ")[0]}</span>
          </button>
        );
      })}
      {hasMore && (
        <button onClick={() => setShowMenu(true)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px 4px", border: "none", background: "transparent", cursor: "pointer", color: showMenu ? T.accent : T.textMuted, transition: "color 0.2s" }}>
          <Layers size={24} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>More</span>
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

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 40, background: `${T.bg}E6`, backdropFilter: "blur(12px)", padding: "20px 0", marginBottom: 20, borderBottom: `1px solid ${T.borderSubtle}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: T.displayFont, fontWeight: 800, fontSize: 26, color: T.text, letterSpacing: "-0.03em" }}>{titles[page] || "StockWise"}</h2>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onSync} className="btn-ghost" style={{ padding: "8px 16px", fontSize: 13, borderRadius: 30, background: T.surface, boxShadow: T.shadow }}>
            <RefreshCw size={14} style={{ animation: syncSt === "syncing" ? "spin 1s linear infinite" : "none", marginRight: 8 }} />
            <span style={{ fontWeight: 600 }}>{syncSt === "syncing" ? "Syncing..." : "Synced"}</span>
          </button>

          <button onClick={toggleTheme} className="btn-ghost" style={{ width: 40, height: 40, padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: T.surface, boxShadow: T.shadow }}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div style={{ position: "relative", display: "flex", alignItems: "center" }} className="hide-mob">
            <div onClick={() => setShowProfile(p => !p)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar user={user} size={40} />
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
