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
  round:   { name: "Round",   icon: "○", radius: "16px", radiusXl: "24px", radiusFull: "999px" },
  rounded: { name: "Rounded", icon: "◻", radius: "12px", radiusXl: "20px", radiusFull: "99px"  },
  sharp:   { name: "Sharp",   icon: "□", radius: "0px",  radiusXl: "0px",  radiusFull: "2px"  },
};

function buildTokens(accentKey = "copper", isDark = false, customColor = null) {
  let p = ACCENT_PRESETS[accentKey] || ACCENT_PRESETS.copper;
  if (customColor && /^#[0-9a-fA-F]{6}$/.test(customColor)) p = { light: customColor, dark: customColor };
  const accent = isDark ? p.dark : p.light;
  const accentDark = p.light;

  if (isDark) return {
    bgGradient: "radial-gradient(circle at 15% 0%, #1f1f2e, #09090b 50%)",
    bg: "#09090b",
    surfaceGlass: "rgba(24, 24, 27, 0.55)", 
    surfaceStrong: "rgba(39, 39, 42, 0.7)", 
    border: "rgba(255, 255, 255, 0.08)",
    borderSubtle: "rgba(255, 255, 255, 0.04)",
    shadow: "0 4px 12px -1px rgba(0, 0, 0, 0.4)",
    shadowLg: "0 12px 28px -3px rgba(0, 0, 0, 0.6)",
    shadowXl: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
    accent, accentDark, accentBg: accent + "25",
    text: "#FAFAFA", textSub: "#A1A1AA", textMuted: "#71717A",
    green: "#4ADE80", greenBg: "rgba(74,222,128,0.15)", blue: "#60A5FA", blueBg: "rgba(96,165,250,0.15)",
    red: "#F87171", redBg: "rgba(248,113,113,0.15)", amber: "#FBBF24", amberBg: "rgba(251,191,36,0.15)",
    sidebarBg: "rgba(9, 9, 11, 0.65)", 
    sidebarW: 260, isDark: true, displayFont: "'Inter', sans-serif"
  };

  return {
    bgGradient: "radial-gradient(circle at 15% 0%, #E2E8F0, #F4F7F9 40%)",
    bg: "#F4F7F9",
    surfaceGlass: "rgba(255, 255, 255, 0.65)", 
    surfaceStrong: "rgba(255, 255, 255, 0.9)",
    border: "rgba(255, 255, 255, 0.6)",
    borderSubtle: "rgba(255, 255, 255, 0.3)",
    shadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
    shadowLg: "0 12px 24px rgba(0, 0, 0, 0.06)",
    shadowXl: "0 24px 48px rgba(0, 0, 0, 0.08)",
    accent, accentDark, accentBg: accent + "15",
    text: "#0F172A", textSub: "#475569", textMuted: "#94A3B8",
    green: "#10B981", greenBg: "#D1FAE5", blue: "#3B82F6", blueBg: "#DBEAFE",
    red: "#EF4444", redBg: "#FEE2E2", amber: "#F59E0B", amberBg: "#FEF3C7",
    sidebarBg: "rgba(255, 255, 255, 0.55)", 
    sidebarW: 260, isDark: false, displayFont: "'Inter', sans-serif"
  };
}

export function buildTheme(themeId = "modern", accentKey = "copper", isDark = false, customColor = null, bgImage = "", cornerStyle = "rounded") {
  const base = buildTokens(accentKey, isDark, customColor);
  const corners = CORNER_STYLES[cornerStyle] || CORNER_STYLES.rounded;
  return { ...base, radius: corners.radius, radiusXl: corners.radiusXl, radiusFull: corners.radiusFull };
}

export const ThemeCtx = createContext(buildTheme());
export const useT = () => useContext(ThemeCtx);
export const THEMES = { modern: { name: "Liquid Glass", desc: "Frosted translucent layers", icon: "💧" } };
export const COPPER = buildTheme("modern","copper",false);
export const DARK   = buildTheme("modern","copper",true);

export const makeCSS = T => `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

*{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;max-width:100vw}
body{font-family:${T.displayFont};background:${T.bgGradient};background-attachment:fixed;min-height:100vh;color:${T.text};-webkit-font-smoothing:antialiased}

::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:${T.isDark?"#3f3f46":"#cbd5e1"};border-radius:${T.radiusFull}}
::-webkit-scrollbar-thumb:hover{background:${T.textMuted}}

input,select,textarea,button{font-family:${T.displayFont};font-size:13px}
select option{background:${T.isDark?"#18181b":"#fff"};color:${T.text}}

/* Liquid Spring Animations */
@keyframes popIn {
  0% { opacity: 0; transform: scale(0.92) translateY(15px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes dropIn {
  0% { opacity: 0; transform: scale(0.92) translateY(-15px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* Base liquid elastic transition for all interactive elements */
.liquid-trans { transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }

.fade-up { animation: popIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.spring-in { animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.spring-down { animation: dropIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; transform-origin: top; }

/* True Glassmorphism */
.glass {
  background: ${T.surfaceGlass};
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid ${T.border};
  box-shadow: ${T.shadow};
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.glass:hover {
  box-shadow: ${T.shadowLg};
  transform: scale(1.015) translateY(-3px);
  background: ${T.surfaceStrong};
}
.glass-strong {
  background: ${T.surfaceStrong};
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid ${T.border};
  box-shadow: ${T.shadowXl};
}

/* Wiggle & Recoil Buttons */
.btn-copper, .btn-green, .btn-danger, .btn-ghost { transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
.btn-copper{background:${T.accent};color:#fff;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:${T.radius};font-weight:600;white-space:nowrap;box-shadow:0 4px 12px ${T.accent}40}
.btn-copper:hover{transform:scale(1.06) translateY(-2px);box-shadow:0 8px 20px ${T.accent}60}
.btn-copper:active{transform:scale(0.95);box-shadow:0 2px 4px ${T.accent}40;transition:all 0.1s}

.btn-ghost{background:transparent;color:${T.textSub};border:1px solid transparent;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:${T.radius};font-weight:600;white-space:nowrap}
.btn-ghost:hover{background:${T.isDark?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.6)"};color:${T.text};transform:scale(1.04) translateY(-1px)}
.btn-ghost:active{transform:scale(0.95)}

.btn-green{background:${T.green};color:#fff;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:${T.radius};font-weight:600;white-space:nowrap;box-shadow:0 4px 12px ${T.green}40}
.btn-green:hover{transform:scale(1.06) translateY(-2px);box-shadow:0 8px 20px ${T.green}60}

.btn-danger{background:${T.redBg};color:${T.red};border:1px solid transparent;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;border-radius:${T.radius};font-weight:600}
.btn-danger:hover{background:${T.red};color:#fff;transform:scale(1.06) translateY(-2px);box-shadow:0 6px 16px ${T.red}50}

/* Liquid Inputs */
.inp, .sel{width:100%;background:${T.isDark?"rgba(0,0,0,0.3)":"rgba(255,255,255,0.4)"};backdrop-filter:blur(10px);border:1px solid ${T.border};border-radius:${T.radius};padding:10px 14px;color:${T.text};outline:none;transition:all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);font-size:13px}
.inp:hover, .sel:hover{background:${T.surfaceGlass}}
.inp:focus, .sel:focus{background:${T.surfaceStrong};border-color:${T.accent};box-shadow:0 0 0 4px ${T.accentBg};transform:scale(1.01)}
.inp::placeholder{color:${T.textMuted}}
.sel{appearance:none;cursor:pointer}

/* Sidebar Nav Items */
.nav-item{display:flex;align-items:center;gap:12px;padding:10px 14px;margin:4px 12px;border-radius:${T.radius};cursor:pointer;transition:all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);color:${T.textSub};font-weight:600;font-size:14px;border:none;background:transparent;text-align:left;white-space:nowrap;overflow:hidden}
.nav-item:hover{background:${T.isDark?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.6)"};color:${T.text};transform:translateX(4px)}
.nav-item.active{background:${T.accentBg};color:${T.accent};transform:translateX(6px)}

/* Sidebar Layout Fix */
body.sidebar-collapsed .main-wrap { margin-left: calc(88px + 24px) !important; }

.badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:${T.radiusFull};font-size:11px;font-weight:700;letter-spacing:0.02em}
.tag{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:${T.radiusFull};font-size:11px;font-weight:600}

/* Tables */
.trow{transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)}
.trow:hover{background:${T.isDark?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.4)"};transform:scale(1.005)}
.th{padding:14px 16px;font-weight:700;color:${T.textSub};font-size:11px;text-align:left;white-space:nowrap;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid ${T.border};background:${T.isDark?"rgba(0,0,0,0.2)":"rgba(255,255,255,0.3)"}}
.th.r{text-align:right}
.td{padding:14px 16px;color:${T.text};font-size:13px;border-bottom:1px solid ${T.borderSubtle}}
.td.m{color:${T.textSub}}
.td.r{text-align:right}

/* Grids */
.kgrid{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:16px;align-items:stretch}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.fgrid .s2{grid-column:1/-1}
.filter-wrap{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.cb{width:16px;height:16px;accent-color:${T.accent};cursor:pointer;flex-shrink:0;border-radius:4px;transition:all 0.3s}
.cb:hover{transform:scale(1.1)}

/* Modals */
.modal-overlay{background:rgba(0, 0, 0, 0.3);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}

/* Mobile Adjustments */
.mobile-nav{display:none}
.settings-tabs{display:flex;flex-wrap:wrap;gap:8px}

@media(max-width:768px){
  .mobile-nav{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:100;background:${T.surfaceGlass};backdrop-filter:blur(24px);border-top:1px solid ${T.border};justify-content:space-evenly;align-items:stretch;padding-bottom:env(safe-area-inset-bottom,0px)}
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
