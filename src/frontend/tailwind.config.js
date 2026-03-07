import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        /* Primary UI font — Sora */
        sans: ["'Sora'", "'Segoe UI'", "system-ui", "sans-serif"],
        /* Monospace data font — JetBrains Mono for spec values / logic feed */
        mono: ["'JetBrains Mono'", "'Courier New'", "monospace"],
        data: ["'JetBrains Mono'", "'Courier New'", "monospace"],
      },
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        surface: {
          DEFAULT: "oklch(var(--surface))",
          raised: "oklch(var(--surface-raised))",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
        /* Semantic status tokens */
        status: {
          ok:      "oklch(var(--status-ok))",
          warning: "oklch(var(--status-warning))",
          offline: "oklch(var(--status-offline))",
        },
        /* Terminal legacy tokens (for semantic status use only) */
        terminal: {
          green: "oklch(var(--terminal-green))",
          "green-dim": "oklch(var(--terminal-green-dim))",
          "green-glow": "oklch(var(--terminal-green-glow))",
          amber: "oklch(var(--terminal-amber))",
          "amber-dim": "oklch(var(--terminal-amber-dim))",
          bg: "oklch(var(--terminal-bg))",
          surface: "oklch(var(--terminal-surface))",
          "surface-raised": "oklch(var(--terminal-surface-raised))",
          border: "oklch(var(--terminal-border))",
          muted: "oklch(var(--terminal-muted))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",          /* 8px */
        md: "calc(var(--radius) - 2px)", /* 6px */
        sm: "calc(var(--radius) - 4px)", /* 4px */
      },
      boxShadow: {
        card: "0 2px 12px oklch(0 0 0 / 0.35), 0 1px 3px oklch(0 0 0 / 0.2)",
        "card-sm": "0 1px 6px oklch(0 0 0 / 0.25)",
        "card-hover": "0 4px 20px oklch(0 0 0 / 0.4), 0 2px 6px oklch(0 0 0 / 0.25)",
        input: "inset 0 1px 3px oklch(0 0 0 / 0.3)",
        "input-focus": "0 0 0 2px oklch(var(--primary) / 0.35)",
        /* Remove glow shadows */
        xs: "0 1px 2px 0 oklch(0 0 0 / 0.08)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
