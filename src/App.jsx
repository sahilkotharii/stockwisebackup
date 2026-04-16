import React, { useEffect, useRef } from "react";
import { Layers } from "lucide-react";

import { buildTheme, ThemeCtx, makeCSS, THEMES, ACCENT_PRESETS, CORNER_STYLES } from "./theme";
import { lsSet } from "./storage";
import useAppState from "./hooks/useAppState";

import Sidebar, { MobNav, TopBar, ROLE_PAGES } from "./components/Nav";
import Login from "./components/Login";
import { Toast } from "./components/UI";

import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Purchase from "./pages/Purchase";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Products from "./pages/Products";
import Vendors from "./pages/Vendors";
import Transactions from "./pages/Transactions";
import Approvals from "./pages/Approvals";
import Settings from "./pages/Settings";
import Returns from "./pages/Returns";
import Ledger from "./pages/Ledger";
import PnL from "./pages/PnL";

export default function App() {
  const state = useAppState();
  const {
    ready, user, page, setPage, toast,
    ctx, isDark, themeId, accentKey, customColor, bgImage, cornerStyle, logoUrl,
    sheetsUrl, setSheetsUrl, syncSt, lastSync, testStatus, onTest,
    handleLogin, handleLogout, pull, toggleTheme,
  } = state;

  ctx.THEMES = THEMES;
  ctx.ACCENT_PRESETS = ACCENT_PRESETS;
  ctx.CORNER_STYLES = CORNER_STYLES;

  // ── Nav action queue — lets dropdown items trigger modals/tabs on target pages ──
  const navActionRef = useRef(null);

  const onNav = (pageId, action, subPage) => {
    // Store action for the target page to pick up
    navActionRef.current = { action: action || null, subPage: subPage || null, ts: Date.now() };
    setPage(pageId);
    // Also set settings tab if navigating to settings with a subPage
    if (pageId === "settings" && subPage) {
      ctx.setSettingsTab?.(subPage);
    }
  };

  // Expose onNav through ctx so pages can navigate with actions
  ctx.setPage = (p) => onNav(p);
  ctx.navAction = navActionRef.current;
  ctx.clearNavAction = () => { navActionRef.current = null; };

  const theme = buildTheme(themeId, accentKey, isDark, customColor, bgImage, cornerStyle);
  const T = theme;

  useEffect(() => {
    let el = document.getElementById("sw-css");
    if (!el) { el = document.createElement("style"); el.id = "sw-css"; document.head.appendChild(el); }
    el.textContent = makeCSS(theme);
    document.body.style.background = theme.bg;
  }, [themeId, accentKey, isDark, customColor, bgImage, cornerStyle]);

  // ── Role-based page access ──────────────────────────────────
  const actualPage = (() => {
    const role = user?.role?.toLowerCase() || "";
    if (role === "admin") return page;
    const allowed = ROLE_PAGES[role] || ROLE_PAGES.manager || [];
    if (allowed === null) return page; // admin
    const locked = user?.lockedPages || [];
    if (allowed.includes(page) && !locked.includes(page)) return page;
    // Dashboard only for admin, fallback to first allowed page
    return allowed[0] || "settings";
  })();

  if (!ready) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${T.accent},${T.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", animation: "pulse 1.5s ease infinite", boxShadow: `0 6px 20px ${T.accent}40` }}>
          <Layers size={22} color="#fff" />
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>Loading…</div>
      </div>
    </div>
  );

  if (!user) return (
    <ThemeCtx.Provider value={T}>
      <Login users={ctx.users} onLogin={handleLogin} logoUrl={logoUrl} />
    </ThemeCtx.Provider>
  );

  const ml = `${T.sidebarW + 16}px`;

  return (
    <ThemeCtx.Provider value={T}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <Sidebar page={actualPage} onNav={onNav} user={user} onLogout={handleLogout} ctx={ctx} />
      <MobNav page={actualPage} onNav={onNav} user={user} onLogout={handleLogout} ctx={ctx} />

      <div className="main-wrap" style={{ marginLeft: ml, padding: "8px 14px 20px", minHeight: "100vh", transition: "margin .2s" }}>
        <TopBar page={actualPage} user={user} syncSt={syncSt} onSync={pull} toggleTheme={toggleTheme} isDark={isDark} onNav={onNav} ctx={ctx} onLogout={handleLogout} />
        <div className="fade-up">
          {actualPage === "dashboard"    && <Dashboard    ctx={ctx} />}
          {actualPage === "sales"        && <Sales        ctx={ctx} />}
          {actualPage === "purchase"     && <Purchase     ctx={ctx} />}
          {actualPage === "inventory"    && <Inventory    ctx={ctx} />}
          {actualPage === "reports"      && <Reports      ctx={ctx} />}
          {actualPage === "products"     && <Products     ctx={ctx} />}
          {actualPage === "vendors"      && <Vendors      ctx={ctx} />}
          {actualPage === "transactions" && <Transactions ctx={ctx} />}
          {actualPage === "returns"      && <Returns      ctx={ctx} />}
          {actualPage === "ledger"       && <Ledger       ctx={ctx} />}
          {actualPage === "pnl"          && <PnL          ctx={ctx} />}
          {actualPage === "approvals"    && user.role === "admin" && <Approvals ctx={ctx} />}
          {actualPage === "settings"     && <Settings ctx={ctx} sheetsUrl={sheetsUrl} setSheetsUrl={url => { setSheetsUrl(url); lsSet("sw_url", url); }} testStatus={testStatus} onTest={onTest} />}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
