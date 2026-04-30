import React from 'react';

interface Theme {
  name: string;
  sub: string;
  p: string;
  s: string;
  bg: string;
  sur: string;
  t1: string;
  t2: string;
  acc: string;
  sw: string[];
}

export const THEMES: Record<string, Theme> = {
  A: { name: "Professional", sub: "CAP-inspired", p: "#0B3A5A", s: "#D9A441", bg: "#F7F9FB", sur: "#fff", t1: "#0B3A5A", t2: "#4A5B6C", acc: "#0E6B66", sw: ["#0B3A5A", "#D9A441", "#0E6B66"] },
  B: { name: "Couple-friendly", sub: "Warm & soft", p: "#c45", s: "#FFD3B6", bg: "#FFF8F5", sur: "#fff", t1: "#4A4A4A", t2: "#7A7A7A", acc: "#3a9fd8", sw: ["#c45", "#FFD3B6", "#3a9fd8"] },
  C: { name: "Productivity", sub: "Bold & fast", p: "#0052CC", s: "#36B37E", bg: "#F4F5F7", sur: "#fff", t1: "#172B4D", t2: "#6B778C", acc: "#FF5630", sw: ["#0052CC", "#36B37E", "#FF5630"] },
  D: { name: "Dark mode", sub: "Elegant", p: "#1E88E5", s: "#90CAF9", bg: "#121212", sur: "#1E1E1E", t1: "#FFFFFF", t2: "#B0BEC5", acc: "#FFAB40", sw: ["#1E88E5", "#90CAF9", "#FFAB40"] }
};

export const ThemeWrapper: React.FC<{ themeKey?: string; children: React.ReactNode }> = ({ themeKey = 'A', children }) => {
  const theme = THEMES[themeKey] || THEMES.A;

  const style = {
    '--p': theme.p,
    '--s': theme.s,
    '--bg': theme.bg,
    '--sur': theme.sur,
    '--t1': theme.t1,
    '--t2': theme.t2,
    '--acc': theme.acc,
  } as React.CSSProperties;

  return (
    <div style={style} className="min-h-screen bg-[var(--bg)] font-sans transition-colors duration-300">
      {children}
    </div>
  );
};
