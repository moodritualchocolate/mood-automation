import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1440px" },
    },
    extend: {
      colors: {
        // Surfaces · ramp
        bg:            "rgb(var(--bg) / <alpha-value>)",
        surface:       "rgb(var(--surface) / <alpha-value>)",
        "surface-2":   "rgb(var(--surface-2) / <alpha-value>)",
        "surface-3":   "rgb(var(--surface-3) / <alpha-value>)",
        elevated:      "rgb(var(--elevated) / <alpha-value>)",
        // Borders
        border:        "rgb(var(--border) / <alpha-value>)",
        "border-strong": "rgb(var(--border-strong) / <alpha-value>)",
        "border-soft": "rgb(var(--border-soft) / <alpha-value>)",
        // Foreground ramp
        fg:            "rgb(var(--fg) / <alpha-value>)",
        "fg-2":        "rgb(var(--fg-2) / <alpha-value>)",
        muted:         "rgb(var(--muted) / <alpha-value>)",
        faint:         "rgb(var(--faint) / <alpha-value>)",
        // Brand
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          2:       "rgb(var(--brand-2) / <alpha-value>)",
          fg:      "rgb(var(--brand-fg) / <alpha-value>)",
          soft:    "rgb(var(--brand-soft) / <alpha-value>)",
        },
        // Status
        accent:        "rgb(var(--accent) / <alpha-value>)",
        success:       "rgb(var(--success) / <alpha-value>)",
        "success-soft":"rgb(var(--success-soft) / <alpha-value>)",
        warning:       "rgb(var(--warning) / <alpha-value>)",
        "warning-soft":"rgb(var(--warning-soft) / <alpha-value>)",
        danger:        "rgb(var(--danger) / <alpha-value>)",
        "danger-soft": "rgb(var(--danger-soft) / <alpha-value>)",
        info:          "rgb(var(--info) / <alpha-value>)",
        "info-soft":   "rgb(var(--info-soft) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        // Tuned for a 14px body baseline · Linear-style scale
        "2xs": ["10.5px", { lineHeight: "14px", letterSpacing: "0.04em" }],
        xs:   ["12px",   { lineHeight: "16px" }],
        sm:   ["13.5px", { lineHeight: "19px" }],
        base: ["14px",   { lineHeight: "21px" }],
        md:   ["15px",   { lineHeight: "22px" }],
        lg:   ["16px",   { lineHeight: "23px" }],
        xl:   ["18px",   { lineHeight: "26px", letterSpacing: "-0.01em" }],
        "2xl":["22px",   { lineHeight: "28px", letterSpacing: "-0.015em" }],
        "3xl":["28px",   { lineHeight: "34px", letterSpacing: "-0.02em" }],
        "4xl":["36px",   { lineHeight: "42px", letterSpacing: "-0.024em" }],
        "5xl":["48px",   { lineHeight: "54px", letterSpacing: "-0.028em" }],
        "6xl":["64px",   { lineHeight: "68px", letterSpacing: "-0.032em" }],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "28px",
      },
      boxShadow: {
        // Token-resolved · respects light/dark via CSS variables in globals.css
        sm:       "var(--shadow-sm)",
        DEFAULT:  "var(--shadow)",
        card:     "var(--shadow)",
        elevated: "var(--shadow-md)",
        floating: "var(--shadow-lg)",
        focus:    "var(--shadow-focus)",
      },
      backgroundImage: {
        warm: "var(--grad-warm)",
        mesh: "var(--grad-mesh)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
        snap:   "cubic-bezier(0.2, 0.9, 0.3, 1)",
      },
      keyframes: {
        "fade-in":   { from: { opacity: "0", transform: "translateY(4px)" },  to: { opacity: "1", transform: "translateY(0)" } },
        "slide-up":  { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "scale-in":  { from: { opacity: "0", transform: "scale(0.96)" },      to: { opacity: "1", transform: "scale(1)" } },
        "shimmer":   { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "fade-in":  "fade-in 0.20s ease-out",
        "slide-up": "slide-up 0.26s cubic-bezier(0.16,1,0.3,1)",
        "scale-in": "scale-in 0.18s cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
};

export default config;
