import React, { useState, useEffect } from "react";
import { Layers } from "lucide-react";
import { buildTheme, ThemeCtx, makeCSS, THEMES, ACCENT_PRESETS, CORNER_STYLES } from "./theme";
import { lsSet } from "./storage";
import useAppState from "./hooks/useAppState";
import Sidebar, { MobNav, MobDrawer, TopBar, canAccess } from "./components/Nav";
import Login from "./components/Login";
import { Toast } from "./components/UI";

// Every page is its own file
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import NewSaleInvoice from "./pages/NewSaleInvoice";
import NewProformaInvoice from "./pages/NewProformaInvoice";
import SalesReturn from "./pages/SalesReturn";
import SalesReports from "./pages/SalesReports";
import Purchase from "./pages/Purchase";
import NewPurchaseBill from "./pages/NewPurchaseBill";
import PurchaseReturn from "./pages/PurchaseReturn";
import PurchaseReports from "./pages/PurchaseReports";
import Inventory from "./pages/Inventory";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import ProductReports from "./pages/ProductReports";
import PnL from "./pages/PnL";
import Ledger from "./pages/Ledger";
import PaymentsReceipts from "./pages/PaymentsReceipts";
import ExpensesIncomes from "./pages/ExpensesIncomes";
import Vendors from "./pages/Vendors";
import Transactions from "./pages/Transactions";
import Approvals from "./pages/Approvals";
import SettingsProfile from "./pages/SettingsProfile";
import SettingsTheme from "./pages/SettingsTheme";
import HowToUse from "./pages/HowToUse";
import AdminUsers from "./pages/AdminUsers";
import AdminActivity from "./pages/AdminActivity";
import AdminSessions from "./pages/AdminSessions";
import AdminInvoice from "./pages/AdminInvoice";
import AdminSeries from "./pages/AdminSeries";
import AdminSheets from "./pages/AdminSheets";
import AdminExport from "./pages/AdminExport";

const PAGE_MAP = {
  "dashboard": Dashboard,
  "sales": Sales,
  "new-sale-invoice": NewSaleInvoice,
  "new-proforma": NewProformaInvoice,
  "sales-return": SalesReturn,
  "sales-reports": SalesReports,
  "purchase": Purchase,
  "new-purchase-bill": NewPurchaseBill,
  "purchase-return": PurchaseReturn,
  "purchase-reports": PurchaseReports,
  "inventory": Inventory,
  "products": Products,
  "categories": Categories,
  "product-reports": ProductReports,
  "pnl": PnL,
  "ledger": Ledger,
  "payments-receipts": PaymentsReceipts,
  "expenses-incomes": ExpensesIncomes,
  "vendors": Vendors,
  "transactions": Transactions,
  "approvals": Approvals,
  "settings-profile": SettingsProfile,
  "settings-theme": SettingsTheme,
  "how-to-use": HowToUse,
  "admin-users": AdminUsers,
  "admin-activity": AdminActivity,
  "admin-sessions": AdminSessions,
  "admin-invoice": AdminInvoice,
  "admin-series": AdminSeries,
  "admin-sheets": AdminSheets,
  "admin-export": AdminExport,
};

export default function App() {
  const state = useAppState();
  const { ready, user, page, setPage, toast, ctx, isDark, themeId, accentKey, customColor, bgImage, cornerStyle, logoUrl, sheetsUrl, setSheetsUrl, syncSt, testStatus, onTest, handleLogin, handleLogout, pull, toggleTheme } = state;

  ctx.THEMES = THEMES;
  ctx.ACCENT_PRESETS = ACCENT_PRESETS;
  ctx.CORNER_STYLES = CORNER_STYLES;
  ctx.setPage = setPage;
  ctx.sheetsUrl = sheetsUrl;
  ctx.setSheetsUrl = (url) => { setSheetsUrl(url); lsSet("sw_url", url); };
  ctx.testStatus = testStatus;
  ctx.onTest = onTest;

  const [drawer, setDrawer] = useState(false);

  const theme = buildTheme(themeId, accentKey, isDark, customColor, bgImage, cornerStyle);
  const T = theme;

  useEffect(() => {
    let el = document.getElementById("sw-css");
    if (!el) { el = document.createElement("style"); el.id = "sw-css"; document.head.appendChild(el); }
    el.textContent = makeCSS(theme);
  }, [themeId, accentKey, isDark, customColor, bgImage, cornerStyle]);

  // Access control
  const actualPage = user && canAccess(user, page) ? page : (user?.role === "admin" ? "dashboard" : "sales");

  if (!ready) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${T.accent},${T.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", animation: "pulse 1.5s ease infinite" }}><Layers size={22} color="#fff" /></div>
        <div style={{ fontSize: 13, color: T.textMuted }}>Loading…</div>
      </div>
    </div>
  );

  if (!user) return <ThemeCtx.Provider value={T}><Login users={ctx.users} onLogin={handleLogin} logoUrl={logoUrl} /></ThemeCtx.Provider>;

  const PageComponent = PAGE_MAP[actualPage];
  const ml = `${T.sidebarW + 16}px`;

  return (
    <ThemeCtx.Provider value={T}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <Sidebar page={actualPage} setPage={setPage} user={user} onLogout={handleLogout} ctx={ctx} />
      <MobNav onDrawerOpen={() => setDrawer(true)} />
      <MobDrawer isOpen={drawer} onClose={() => setDrawer(false)} page={actualPage} setPage={setPage} user={user} onLogout={handleLogout} ctx={ctx} />

      <div className="main-wrap" style={{ marginLeft: ml, padding: "8px 16px 24px", minHeight: "100vh", transition: "margin .2s" }}>
        <TopBar page={actualPage} user={user} syncSt={syncSt} onSync={pull} toggleTheme={toggleTheme} isDark={isDark} setPage={setPage} ctx={ctx} onLogout={handleLogout} onDrawerOpen={() => setDrawer(true)} />
        <div className="fade-up">
          {PageComponent ? <PageComponent ctx={ctx} /> : <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>Page not found</div>}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
