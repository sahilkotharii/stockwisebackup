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
  rounded: { name: "Rounded", icon: "◻", radius: "10px", radiusXl: "16px", radiusFull: "99px"  },
  sharp:   { name: "Sharp",   icon: "□", radius: "0px",  radiusXl: "0px",  radiusFull: "2px"  },
};

// ── Build base tokens (Premium SaaS Flat Design) ────────────────────────────
function buildTokens(accentKey = "copper", isDark = false, customColor = null) {
  let p = ACCENT_PRESETS[accentKey] || ACCENT_PRESETS.copper;
  if (customColor && /^#[0-9a-fA-F]{6}$/.test(customColor)) {
    p = { light: customColor, dark: customColor };
  }
  const accent = isDark ? p.dark : p.light;
  const accentDark = p.light;

  // Dark Mode
  if (isDark) return {
    bg: "#09090B", 
    surface: "#18181B", 
    surfaceStrong: "#27272A", 
    border: "#27272A",
    borderSubtle: "#3F3F46",
    shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
    shadowLg: "0 10px 25px -3px rgba(0, 0, 0, 0.4)",
    shadowXl: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    accent, accentDark, accentBg: accent + "20",
    text: "#FAFAFA", textSub: "#A1A1AA", textMuted: "#71717A",
    green: "#4ADE80", greenBg: "rgba(74,222,128,0.15)", blue: "#60A5FA", blueBg: "rgba(96,165,250,0.15)",
    red: "#F87171", redBg: "rgba(248,113,113,0.15)", amber: "#FBBF24", amberBg: "rgba(251,191,36,0.15)",
    sidebarBg: "#09090B", 
    sidebarW: 250, isDark: true, displayFont: "'Inter', sans-serif"
  };

  // Light Mode (Premium SaaS Look)
  return {
    bg: "#F4F7F9", // Soft cool off-white
    surface: "#FFFFFF", // Pure white cards
    surfaceStrong: "#F8FAFC",
    border: "#E2E8F0",
    borderSubtle: "#F1F5F9",
    shadow: "0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
    shadowLg: "0 10px 20px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)",
    shadowXl: "0 20px 40px rgba(0, 0, 0, 0.08)",
    accent, accentDark, accentBg: accent + "12",
    text: "#0F172A", textSub: "#475569", textMuted: "#94A3B8",
    green: "#10B981", greenBg: "#D1FAE5", blue: "#3B82F6", blueBg: "#DBEAFE",
    red: "#EF4444", redBg: "#FEE2E2", amber: "#F59E0B", amberBg: "#FEF3C7",
    sidebarBg: "#FFFFFF", 
    sidebarW: 250, isDark: false, displayFont: "'Inter', sans-serif"
  };
}

export function buildTheme(themeId = "modern", accentKey = "copper", isDark = false, customColor = null, bgImage = "", cornerStyle = "rounded") {
  const base = buildTokens(accentKey, isDark, customColor);
  const corners = CORNER_STYLES[cornerStyle] || CORNER_STYLES.rounded;
  return { ...base, radius: corners.radius, radiusXl: corners.radiusXl, radiusFull: corners.radiusFull };
}

export const ThemeCtx = createContext(buildTheme());
export const useT = () => useContext(ThemeCtx);

export const THEMES = { modern: { name: "Modern SaaS", desc: "Clean, flat, high-contrast", icon: "◻" } };
export const COPPER = buildTheme("modern","copper",false);
export const DARK   = buildTheme("modern","copper",true);

export const makeCSS = T => `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

*{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;max-width:100vw}
body{font-family:${T.displayFont};background:${T.bg};min-height:100vh;color:${T.text};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}

::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:${T.isDark?"#3f3f46":"#cbd5e1"};border-radius:${T.radiusFull}}
::-webkit-scrollbar-thumb:hover{background:${T.textMuted}}

input,select,textarea,button{font-family:${T.displayFont};font-size:13px}
select option{background:${T.surface};color:${T.text}}

@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}

.fade-up{animation:fadeUp .4s cubic-bezier(0.16, 1, 0.3, 1) forwards}
.spring-in{animation:fadeUp .3s cubic-bezier(0.16, 1, 0.3, 1) backwards}
.spring-down{animation:fadeUp .2s ease backwards}
.spring-up{animation:fadeUp .2s ease backwards}

/* Pure Premium Cards */
.glass{background:${T.surface};border:1px solid ${T.border};box-shadow:${T.shadow};transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1)}
.glass:hover{box-shadow:${T.shadowLg};transform:translateY(-2px)}
.glass-strong{background:${T.surface};border:1px solid ${T.border};box-shadow:${T.shadowXl}}

/* Premium Buttons */
.btn-copper{background:${T.accent};color:#fff;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:${T.radius};font-weight:600;transition:all 0.2s ease;white-space:nowrap;box-shadow:0 4px 6px ${T.accent}30}
.btn-copper:hover{filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 6px 12px ${T.accent}40}
.btn-copper:active{transform:translateY(0);box-shadow:none}

.btn-ghost{background:transparent;color:${T.textSub};border:1px solid transparent;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:${T.radius};font-weight:600;transition:all 0.2s ease;white-space:nowrap}
.btn-ghost:hover{background:${T.isDark?"#27272a":"#F1F5F9"};color:${T.text}}
.btn-ghost:active{transform:scale(0.98)}

.btn-green{background:${T.green};color:#fff;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:${T.radius};font-weight:600;transition:all .15s;white-space:nowrap;box-shadow:0 4px 6px ${T.green}30}
.btn-green:hover{filter:brightness(1.05);transform:translateY(-1px);box-shadow:0 6px 12px ${T.green}40}

.btn-danger{background:${T.redBg};color:${T.red};border:1px solid transparent;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;border-radius:${T.radius};font-weight:600;transition:all .2s ease}
.btn-danger:hover{background:${T.red};color:#fff;box-shadow:0 4px 10px ${T.red}40;transform:translateY(-1px)}

/* Clean Modern Inputs */
.inp, .sel{width:100%;background:${T.isDark?"#09090b":"#F8FAFC"};border:1px solid ${T.border};border-radius:${T.radius};padding:10px 14px;color:${T.text};outline:none;transition:all .2s ease;font-size:13px}
.inp:hover, .sel:hover{border-color:${T.textMuted}}
.inp:focus, .sel:focus{background:${T.surface};border-color:${T.accent};box-shadow:0 0 0 3px ${T.accent}20}
.inp::placeholder{color:${T.textMuted}}
.sel{appearance:none;cursor:pointer}

/* Sidebar Nav Items */
.nav-item{display:flex;align-items:center;gap:12px;padding:10px 14px;margin:4px 12px;border-radius:${T.radius};cursor:pointer;transition:all .2s ease;color:${T.textSub};font-weight:500;font-size:14px;border:none;background:transparent;text-align:left;white-space:nowrap}
.nav-item:hover{background:${T.isDark?"#18181b":"#F1F5F9"};color:${T.text}}
.nav-item.active{background:${T.accentBg};color:${T.accent};font-weight:600}

.badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:${T.radiusFull};font-size:11px;font-weight:700;letter-spacing:0.02em}
.tag{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:${T.radiusFull};font-size:11px;font-weight:600}

/* Tables */
.trow{transition: background 0.15s ease}
.trow:hover{background:${T.isDark?"#18181b":"#F8FAFC"}}
.th{padding:14px 16px;font-weight:600;color:${T.textSub};font-size:11px;text-align:left;white-space:nowrap;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid ${T.border};background:${T.isDark?"#18181b":"#F8FAFC"}}
.th.r{text-align:right}
.td{padding:14px 16px;color:${T.text};font-size:13px;border-bottom:1px solid ${T.borderSubtle}}
.td.m{color:${T.textSub}}
.td.r{text-align:right}

/* Grids */
.kgrid{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:16px;align-items:stretch}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.fgrid .s2{grid-column:1/-1}
.filter-wrap{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.cb{width:16px;height:16px;accent-color:${T.accent};cursor:pointer;flex-shrink:0;border-radius:4px}

/* Modals */
.modal-overlay{background:rgba(0, 0, 0, 0.4);backdrop-filter:blur(4px)}

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
