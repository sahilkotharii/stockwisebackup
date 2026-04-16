import { createContext, useContext } from "react";

export const ACCENT_PRESETS = {
  copper:  { name: "Copper",  light: "#C05C1E", dark: "#E07534" },
  indigo:  { name: "Indigo",  light: "#4F46E5", dark: "#6366F1" },
  emerald: { name: "Emerald", light: "#059669", dark: "#10B981" },
  rose:    { name: "Rose",    light: "#E11D48", dark: "#F43F5E" },
  sky:     { name: "Sky",     light: "#0284C7", dark: "#0EA5E9" },
  violet:  { name: "Violet",  light: "#7C3AED", dark: "#8B5CF6" },
  custom:  { name: "Custom",  light: "#C05C1E", dark: "#E07534" },
};
export const CORNER_STYLES = {
  round:   { name: "Round",   radius: "14px", radiusXl: "20px", radiusFull: "999px" },
  rounded: { name: "Rounded", radius: "10px", radiusXl: "16px", radiusFull: "99px"  },
  sharp:   { name: "Sharp",   radius: "0px",  radiusXl: "0px",  radiusFull: "2px"  },
};

function buildTokens(accentKey = "copper", isDark = false, customColor = null) {
  let p = ACCENT_PRESETS[accentKey] || ACCENT_PRESETS.copper;
  if (customColor && /^#[0-9a-fA-F]{6}$/.test(customColor)) p = { light: customColor, dark: customColor };
  const accent = isDark ? p.dark : p.light;
  const accentDark = p.light;
  if (isDark) return {
    bg: "#09090b", surface: "rgba(24,24,27,0.7)", surfaceGlass: "rgba(24,24,27,0.55)", surfaceStrong: "rgba(39,39,42,0.85)",
    border: "rgba(255,255,255,0.08)", borderSubtle: "rgba(255,255,255,0.04)", glassShine: "rgba(255,255,255,0.05)",
    shadow: "0 2px 8px rgba(0,0,0,0.4)", shadowLg: "0 8px 20px rgba(0,0,0,0.5)", shadowXl: "0 16px 40px rgba(0,0,0,0.7)",
    accent, accentDark, accentBg: accent + "20",
    text: "#FAFAFA", textSub: "#A1A1AA", textMuted: "#71717A",
    green: "#4ADE80", greenBg: "rgba(74,222,128,0.12)", blue: "#60A5FA", blueBg: "rgba(96,165,250,0.12)",
    red: "#F87171", redBg: "rgba(248,113,113,0.12)", amber: "#FBBF24", amberBg: "rgba(251,191,36,0.12)",
    sidebarBg: "rgba(9,9,11,0.85)", sidebarW: 230, isDark: true, displayFont: "'Inter',sans-serif"
  };
  return {
    bg: "#F4F7F9", surface: "rgba(255,255,255,0.8)", surfaceGlass: "rgba(255,255,255,0.6)", surfaceStrong: "rgba(255,255,255,0.92)",
    border: "rgba(0,0,0,0.07)", borderSubtle: "rgba(0,0,0,0.04)", glassShine: "rgba(255,255,255,0.9)",
    shadow: "0 2px 8px rgba(0,0,0,0.04)", shadowLg: "0 8px 20px rgba(0,0,0,0.06)", shadowXl: "0 16px 40px rgba(0,0,0,0.08)",
    accent, accentDark, accentBg: accent + "12",
    text: "#0F172A", textSub: "#475569", textMuted: "#94A3B8",
    green: "#10B981", greenBg: "#D1FAE5", blue: "#3B82F6", blueBg: "#DBEAFE",
    red: "#EF4444", redBg: "#FEE2E2", amber: "#F59E0B", amberBg: "#FEF3C7",
    sidebarBg: "rgba(255,255,255,0.75)", sidebarW: 230, isDark: false, displayFont: "'Inter',sans-serif"
  };
}

export function buildTheme(themeId, accentKey = "copper", isDark = false, customColor = null, bgImage = "", cornerStyle = "rounded") {
  const base = buildTokens(accentKey, isDark, customColor);
  const c = CORNER_STYLES[cornerStyle] || CORNER_STYLES.rounded;
  return { ...base, radius: c.radius, radiusXl: c.radiusXl, radiusFull: c.radiusFull };
}

export const ThemeCtx = createContext(buildTheme());
export const useT = () => useContext(ThemeCtx);
export const THEMES = { modern: { name: "Premium ERP" } };
export const COPPER = buildTheme("modern","copper",false);
export const DARK = buildTheme("modern","copper",true);

export const makeCSS = T => `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;max-width:100vw}
body{font-family:${T.displayFont};background:${T.bg};min-height:100vh;color:${T.text};-webkit-font-smoothing:antialiased;font-size:13px;line-height:1.5}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:${T.isDark?"#3f3f46":"#cbd5e1"};border-radius:99px}
input,select,textarea,button{font-family:${T.displayFont};font-size:13px}
select option{background:${T.isDark?"#18181b":"#fff"};color:${T.text}}

@keyframes fadeUp{0%{opacity:0;transform:translateY(5px)}100%{opacity:1;transform:translateY(0)}}
@keyframes fadeDown{0%{opacity:0;transform:translateY(-5px)}100%{opacity:1;transform:translateY(0)}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
.fade-up{animation:fadeUp .3s ease forwards}
.spring-in{animation:fadeUp .25s ease forwards}
.spring-down{animation:fadeDown .25s ease forwards;transform-origin:top}

.glass{background:${T.surfaceGlass};backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid ${T.border};box-shadow:${T.shadow};border-radius:${T.radius}}
.glass-strong{background:${T.surfaceStrong};backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid ${T.border};box-shadow:${T.shadowXl};border-radius:${T.radius}}

.btn-copper{background:${T.accent};color:#fff;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:${T.radius};font-weight:600;white-space:nowrap;box-shadow:0 2px 6px ${T.accent}30;transition:all .2s}
.btn-copper:hover{filter:brightness(1.08);transform:translateY(-1px)}
.btn-copper:active{transform:translateY(0)}
.btn-ghost{background:transparent;color:${T.textSub};border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:${T.radius};font-weight:600;white-space:nowrap;transition:all .2s}
.btn-ghost:hover{background:${T.isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)"};color:${T.text}}
.btn-green{background:${T.green};color:#fff;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:${T.radius};font-weight:600;white-space:nowrap;box-shadow:0 2px 6px ${T.green}30;transition:all .2s}
.btn-green:hover{filter:brightness(1.05)}
.btn-danger{background:${T.redBg};color:${T.red};border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:5px;border-radius:${T.radius};font-weight:600;transition:all .2s}
.btn-danger:hover{background:${T.red};color:#fff}

.inp,.sel{width:100%;background:${T.isDark?"rgba(0,0,0,0.25)":"#fff"};border:1px solid ${T.border};border-radius:${T.radius};padding:9px 12px;color:${T.text};outline:none;transition:border .2s,box-shadow .2s;font-size:13px}
.inp:focus,.sel:focus{border-color:${T.accent};box-shadow:0 0 0 2px ${T.accentBg}}
.inp::placeholder{color:${T.textMuted}}
.sel{appearance:none;cursor:pointer;padding-right:32px}

.badge{display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:${T.radiusFull};font-size:11px;font-weight:700}
.tag{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:${T.radiusFull};font-size:11px;font-weight:600}

.trow{transition:background .15s}
.trow:hover{background:${T.isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.015)"}}
.th{padding:10px 14px;font-weight:700;color:${T.textSub};font-size:11px;text-align:left;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid ${T.border};background:${T.isDark?"rgba(0,0,0,0.15)":"rgba(0,0,0,0.02)"}}
.th.r{text-align:right}
.td{padding:10px 14px;color:${T.text};font-size:13px;border-bottom:1px solid ${T.borderSubtle}}
.td.m{color:${T.textSub}}
.td.r{text-align:right}

.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;align-items:stretch}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fgrid .s2{grid-column:1/-1}
.filter-wrap{display:flex;gap:8px;align-items:center;overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.filter-wrap::-webkit-scrollbar{display:none}
.filter-wrap>*{flex-shrink:0}
.cb{width:15px;height:15px;accent-color:${T.accent};cursor:pointer;flex-shrink:0}
.modal-overlay{background:rgba(0,0,0,0.45);backdrop-filter:blur(3px)}

/* Desktop nav sub-items */
.nav-sub{font-size:13px;padding:7px 12px 7px 40px;margin:1px 8px;border-radius:${T.radius};cursor:pointer;color:${T.textSub};font-weight:500;border:none;background:transparent;display:block;width:calc(100% - 16px);text-align:left;transition:all .15s}
.nav-sub:hover{background:${T.isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.03)"};color:${T.text}}
.nav-sub.active{color:${T.accent};font-weight:700;background:${T.accentBg}}

.bill-item-sub{display:none}
.mobile-nav,.mob-drawer{display:none}
.mob-card-view{display:none}
.desk-table-view{display:block}

@media(max-width:768px){
  .hide-mob{display:none!important}
  .hide-mob-grid{display:none!important}
  .bill-item-sub{display:block!important}
  .mob-card-view{display:block!important}
  .desk-table-view{display:none!important}
  .desktop-sidebar{display:none!important}
  .mobile-nav{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:100;background:${T.surfaceStrong};backdrop-filter:blur(20px);border-top:1px solid ${T.border};justify-content:space-evenly;padding-bottom:env(safe-area-inset-bottom,0)}
  .main-wrap{margin-left:0!important;padding:8px 12px 80px!important;width:100%!important}
  .kgrid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .fgrid{grid-template-columns:1fr!important;gap:10px!important}
  .fgrid .s2{grid-column:1!important}
  .chart-row{grid-template-columns:1fr!important}
  .period-bar-wrap{width:100%;flex-wrap:wrap!important}
  .sw-toast{bottom:90px!important;left:12px!important;right:12px!important}
  .notif-dropdown{position:fixed!important;left:8px!important;right:8px!important;width:auto!important;max-height:70vh!important}
  .mob-drawer{display:block}
}
@media(max-width:400px){.kgrid{grid-template-columns:1fr!important}}
`;
