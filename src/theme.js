import { createContext, useContext } from "react";

// ── Accent palette presets ─────────────────────────────────────────────────
export const ACCENT_PRESETS = {
  copper:  { name: "Copper",  light: "#C05C1E", dark: "#E07534" },
  indigo:  { name: "Indigo",  light: "#4F46E5", dark: "#6366F1" },
  emerald: { name: "Emerald", light: "#059669", dark: "#10B981" },
  rose:    { name: "Rose",    light: "#E11D48", dark: "#F43F5E" },
  sky:     { name: "Sky",     light: "#0284C7", dark: "#0EA5E9" },
  violet:  { name: "Violet",  light: "#7C3AED", dark: "#8B5CF6" },
  custom:  { name: "Custom",  light: "#C05C1E", dark: "#E07534" },
};

// ── Corner style presets ───────────────────────────────────────────────────
export const CORNER_STYLES = {
  round:   { name: "Round",   icon: "○", radius: "16px", radiusXl: "24px", radiusFull: "999px" },
  rounded: { name: "Rounded", icon: "◻", radius: "8px",  radiusXl: "16px", radiusFull: "99px"  },
  sharp:   { name: "Sharp",   icon: "□", radius: "0px",  radiusXl: "0px",  radiusFull: "2px"  },
};

// ── Build base tokens (Modern SaaS Flat Design) ────────────────────────────
function buildTokens(accentKey = "copper", isDark = false, customColor = null) {
  let p = ACCENT_PRESETS[accentKey] || ACCENT_PRESETS.copper;
  if (customColor && /^#[0-9a-fA-F]{6}$/.test(customColor)) {
    p = { light: customColor, dark: customColor };
  }
  const accent = isDark ? p.dark : p.light;
  const accentDark = p.light;

  // Modern Clean SaaS Colors
  if (isDark) return {
    bg: "#09090b", // Very dark background
    surface: "#18181b", // Slightly lighter cards
    surfaceStrong: "#27272a", // Elevated surfaces
    border: "#27272a",
    borderSubtle: "#3f3f46",
    shadow: "0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.5)",
    shadowLg: "0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)",
    shadowXl: "0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.6)",
    accent, accentDark, accentBg: accent + "20",
    text: "#fafafa", textSub: "#a1a1aa", textMuted: "#71717a",
    green: "#4ade80", greenBg: "rgba(74,222,128,0.15)", blue: "#60a5fa", blueBg: "rgba(96,165,250,0.15)",
    red: "#f87171", redBg: "rgba(248,113,113,0.15)", amber: "#fbbf24", amberBg: "rgba(251,191,36,0.15)",
    sidebarBg: "#09090b", 
    sidebarW: 240, isDark: true, displayFont: "'Inter', 'Montserrat', sans-serif"
  };

  return {
    bg: "#f8fafc", // Clean light gray/off-white background
    surface: "#ffffff", // Pure white cards
    surfaceStrong: "#f1f5f9",
    border: "#e2e8f0",
    borderSubtle: "#f1f5f9",
    shadow: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
    shadowLg: "0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
    shadowXl: "0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
    accent, accentDark, accentBg: accent + "15",
    text: "#0f172a", textSub: "#475569", textMuted: "#94a3b8",
    green: "#16a34a", greenBg: "#dcfce7", blue: "#2563eb", blueBg: "#dbeafe",
    red: "#dc2626", redBg: "#fee2e2", amber: "#d97706", amberBg: "#fef3c7",
    sidebarBg: "#ffffff", 
    sidebarW: 240, isDark: false, displayFont: "'Inter', 'Montserrat', sans-serif"
  };
}

export function buildTheme(themeId = "modern", accentKey = "copper", isDark = false, customColor = null, bgImage = "", cornerStyle = "rounded") {
  const base = buildTokens(accentKey, isDark, customColor);
  const corners = CORNER_STYLES[cornerStyle] || CORNER_STYLES.rounded;
  return { ...base, radius: corners.radius, radiusXl: corners.radiusXl, radiusFull: corners.radiusFull };
}

export const ThemeCtx = createContext(buildTheme());
export const useT = () => useContext(ThemeCtx);

// Presets for backwards compatibility
export const THEMES = { modern: { name: "Modern SaaS", desc: "Clean, flat, high-contrast", icon: "◻" } };
export const COPPER = buildTheme("modern","copper",false);
export const DARK   = buildTheme("modern","copper",true);

export const makeCSS = T => `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

*{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;max-width:100vw}
body{font-family:${T.displayFont};background:${T.bg};min-height:100vh;color:${T.text}}

::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:${T.isDark?"#3f3f46":"#cbd5e1"};border-radius:${T.radiusFull}}

input,select,textarea,button{font-family:${T.displayFont};font-size:13px}
select option{background:${T.surface};color:${T.text}}

@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}

.fade-up{animation:fadeUp .3s ease forwards}
.spring-in{animation:fadeUp .25s ease backwards}
.spring-down{animation:fadeUp .2s ease backwards}
.spring-up{animation:fadeUp .2s ease backwards}

/* Replaced heavy glass with clean solid surfaces */
.glass{background:${T.surface};border:1px solid ${T.border};box-shadow:${T.shadow}; transition: box-shadow 0.2s ease}
.glass-strong{background:${T.surface};border:1px solid ${T.border};box-shadow:${T.shadowLg}}

.btn-copper{background:${T.accent};color:#fff;border:1px solid transparent;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:${T.radius};font-weight:500;transition:all .15s ease;white-space:nowrap;box-shadow: 0 1px 2px rgba(0,0,0,0.05)}
.btn-copper:hover{filter:brightness(1.1); box-shadow:${T.shadow}}
.btn-copper:active{transform:scale(0.98)}

.btn-ghost{background:${T.isDark?"#27272a":"#f1f5f9"};color:${T.textSub};border:1px solid ${T.border};cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:${T.radius};font-weight:500;transition:all .15s ease;white-space:nowrap}
.btn-ghost:hover{background:${T.isDark?"#3f3f46":"#e2e8f0"};color:${T.text}}
.btn-ghost:active{transform:scale(0.98)}

.btn-green{background:${T.green};color:#fff;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:${T.radius};font-weight:500;transition:all .15s;white-space:nowrap}
.btn-green:hover{filter:brightness(1.1)}

.btn-danger{background:${T.redBg};color:${T.red};border:1px solid transparent;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;border-radius:${T.radius};font-weight:500;transition:all .15s}
.btn-danger:hover{background:${T.red}; color:#fff}

/* Clean Modern Inputs */
.inp, .sel{width:100%;background:${T.isDark?"#09090b":"#ffffff"};border:1px solid ${T.border};border-radius:${T.radius};padding:9px 12px;color:${T.text};outline:none;transition:all .2s;font-size:13px; box-shadow: 0 1px 2px rgba(0,0,0,0.02)}
.inp:focus, .sel:focus{border-color:${T.accent};box-shadow:0 0 0 3px ${T.accentBg}}
.inp::placeholder{color:${T.textMuted}}
.sel{appearance:none;cursor:pointer}

/* Sidebar Nav Items */
.nav-item{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:${T.radius};cursor:pointer;transition:all .15s;color:${T.textSub};font-weight:500;font-size:14px;border:none;background:transparent;width:100%;text-align:left;white-space:nowrap; margin-bottom: 2px}
.nav-item:hover{background:${T.isDark?"#18181b":"#f1f5f9"};color:${T.text}}
.nav-item.active{background:${T.accentBg};color:${T.accent};font-weight:600}

.badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:${T.radiusFull};font-size:12px;font-weight:600}
.tag{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:${T.radiusFull};font-size:11px;font-weight:600}

/* Tables */
.trow{transition: background 0.15s ease}
.trow:hover{background:${T.isDark?"#18181b":"#f8fafc"}}
.th{padding:12px 16px;font-weight:600;color:${T.textMuted};font-size:12px;text-align:left;white-space:nowrap;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid ${T.border}}
.th.r{text-align:right}
.td{padding:12px 16px;color:${T.text};font-size:13px;border-bottom:1px solid ${T.borderSubtle}}
.td.m{color:${T.textSub}}
.td.r{text-align:right}

/* Grids */
.kgrid{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:16px;align-items:stretch}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.fgrid .s2{grid-column:1/-1}
.filter-wrap{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.cb{width:16px;height:16px;accent-color:${T.accent};cursor:pointer;flex-shrink:0}

/* Modals */
.modal-overlay{background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(2px)}

/* Mobile Adjustments */
.mobile-nav{display:none}
.settings-tabs{display:flex;flex-wrap:wrap;gap:8px}

@media(max-width:768px){
  .mobile-nav{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:100;background:${T.surface};border-top:1px solid ${T.border};justify-content:space-evenly;align-items:stretch;padding-bottom:env(safe-area-inset-bottom,0px)}
  .desktop-sidebar{display:none!important}
  .main-wrap{margin-left:0!important;padding:16px 16px 90px!important;overflow-x:hidden!important}
  .kgrid{grid-auto-flow:row!important;grid-template-columns:1fr 1fr!important;gap:12px!important}
  .fgrid{grid-template-columns:1fr!important;gap:14px!important}
  .fgrid .s2{grid-column:1!important}
  .filter-wrap{gap:10px!important;flex-wrap:wrap!important}
  .filter-wrap input[type="date"]{flex:1 1 120px!important}
  .settings-tabs{flex-wrap:nowrap!important;overflow-x:auto!important;gap:8px!important;padding-bottom:4px;scrollbar-width:none}
  .settings-tabs::-webkit-scrollbar{display:none}
  .hide-mob{display:none!important}
}
`;
