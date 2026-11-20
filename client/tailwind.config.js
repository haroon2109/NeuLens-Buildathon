import animate from 'tailwindcss-animate';
import defaultColors from 'tailwindcss/colors';

/**
 * Colours resolve from the CSS custom properties in src/styles/tokens.css.
 * That file is the only place a palette hex may be written; the rgb() wrapper
 * keeps Tailwind's slash-opacity syntax working (`bg-forest/40`).
 */
const token = (name) => `rgb(var(--nl-${name}-rgb) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // ─── shadcn/ui semantic tokens ───────────────────────────
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        // `text-muted` is the portal's secondary-text colour. The old shadcn
        // default here was a pale cream, which made body copy invisible.
        muted: {
          DEFAULT: token('muted'),
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },

        // ─── NeuLens brand palette as bare utilities ──────────────
        // Portal screens write `bg-warm`, `border-line`, `text-ink`, etc.
        // These entries make those classes resolve to the public-site palette.
        sage: { DEFAULT: token('sage'), dark: token('sage-dark'), deep: token('sage-deep') },
        mint: { DEFAULT: token('mint'), soft: token('mint-soft') },
        warm: token('warm'),
        forest: { DEFAULT: token('forest'), deep: token('forest-deep') },
        ink: token('ink'),
        body: token('body'),
        line: { DEFAULT: token('line'), strong: token('line-strong') },
        // Bare accents used with opacity modifiers (bg-amber/10, border-rose/60)
        amber: { DEFAULT: token('warning') },
        rose: { DEFAULT: token('rose') },
        // Isolated accents; declared in tokens.css so components stay hex-free.
        mist: token('mist'),
        clay: { DEFAULT: token('clay'), deep: token('clay-deep') },
        'mint-haze': token('mint-haze'),
        'mint-veil': token('mint-veil'),

        // ─── NeuLens formalized palette ───────────────────────────
        nl: {
          // Public-site brand palette (sage, mint, warm white, forest)
          sage:          token('sage'),
          'sage-dark':   token('sage-dark'),
          'sage-deep':   token('sage-deep'),
          mint:          token('mint'),
          'mint-soft':   token('mint-soft'),
          warm:          token('warm'),
          forest:        token('forest'),
          'forest-deep': token('forest-deep'),
          ink:           token('ink'),
          body:          token('body'),
          muted:         token('muted'),
          line:          token('line'),
          // Product/portal tokens
          navy:          'var(--nl-navy)',
          blue:          'var(--nl-blue)',
          'blue-hover':  'var(--nl-blue-hover)',
          'blue-light':  'var(--nl-blue-light)',
          'text':        'var(--nl-text-primary)',
          'text-secondary': 'var(--nl-text-secondary)',
          'text-muted':  'var(--nl-text-muted)',
          bg:            'var(--nl-bg)',
          surface:       'var(--nl-surface)',
          border:        'var(--nl-border)',
          'border-strong': 'var(--nl-border-strong)',
          success:       'var(--nl-success)',
          warning:       'var(--nl-warning)',
          error:         'var(--nl-error)',
        },
        // Existing screens were written against Tailwind's stock neutral and
        // brand scales. Remapping those scales keeps every screen on the same
        // sage / mint / forest palette as the public site without rewriting
        // hundreds of classNames.
        // Every scale below is a name for the same brand ramp. They are kept
        // so existing classNames still resolve; the values come from tokens.css.
        slate: {
          50: token('sand-50'), 100: token('sand-100'), 200: token('line'), 300: token('line-strong'),
          400: token('sand-400'), 500: token('muted'), 600: token('body'), 700: token('sand-700'),
          800: token('sand-800'), 900: token('ink'), 950: token('ink-950'),
        },
        blue: {
          50: token('mint-soft'), 100: token('mint'), 200: token('mint-200'), 300: token('sage'),
          400: token('sage-dark'), 500: token('forest-500'), 600: token('sage-deep'), 700: token('forest'),
          800: token('forest-deep'), 900: token('forest-900'), 950: token('forest-950'),
        },
        sky: {
          50: token('tint-50'), 100: token('tint-100'), 200: token('tint-200'), 300: token('tint-300'),
          400: token('tint-400'), 500: token('tint-500'), 600: token('sage-deep'), 700: token('forest'),
          800: token('forest-deep'), 900: token('forest-900'), 950: token('forest-950'),
        },
        indigo: {
          50: token('tint-50'), 100: token('tint-100'), 200: token('tint-200'), 300: token('tint-300'),
          400: token('tint-400'), 500: token('tint-500'), 600: token('sage-deep'), 700: token('forest'),
          800: token('forest-deep'), 900: token('forest-900'), 950: token('forest-950'),
        },
        violet: {
          50: token('tint-50'), 100: token('tint-100'), 200: token('tint-200'), 300: token('tint-300'),
          400: token('tint-400'), 500: token('tint-500'), 600: token('sage-deep'), 700: token('forest'),
          800: token('forest-deep'), 900: token('forest-900'), 950: token('forest-950'),
        },
        purple: {
          50: token('tint-50'), 100: token('tint-100'), 200: token('tint-200'), 300: token('tint-300'),
          400: token('tint-400'), 500: token('tint-500'), 600: token('sage-deep'), 700: token('forest'),
          800: token('forest-deep'), 900: token('forest-900'), 950: token('forest-950'),
        },
        // Clinician portal scale
        medical: {
          50: token('mint-soft'), 100: token('mint'), 200: token('mint-200'), 300: token('sage'),
          400: token('sage-dark'), 500: token('forest-500'), 600: token('sage-deep'), 700: token('forest'),
          800: token('forest-deep'), 900: token('forest-900'), 950: token('forest-950'),
        },
        // Legacy aliases kept for backward-compat with existing classNames
        health: {
          blue:    { DEFAULT: token('forest'), light: token('mint'), dark: token('forest-deep'), deep: token('ink') },
          teal:    { DEFAULT: token('teal'), light: token('teal-light') },
          green:   { DEFAULT: token('success'), light: token('success-light') },
          orange:  { DEFAULT: token('warning'), light: token('warning-light') },
          red:     { DEFAULT: token('error'), light: token('error-light') },
          purple:  { DEFAULT: token('sage-deep'), light: token('mint') },
          // Stock Tailwind neutrals, not brand colours: reference the
          // framework's own scale instead of restating its hexes.
          gray: defaultColors.slate,
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        card: '0 4px 20px -2px rgba(27, 51, 43, 0.05), 0 2px 6px -1px rgba(27, 51, 43, 0.02)',
        'card-hover': '0 12px 30px -4px rgba(27, 51, 43, 0.08), 0 4px 10px -2px rgba(27, 51, 43, 0.03)',
        pill: '0 4px 14px 0 rgba(47, 94, 78, 0.22)',
        elevated: '0 24px 70px -48px rgba(27, 51, 43, 0.28), 0 2px 8px rgba(27, 51, 43, 0.035)',
        glass: '0 8px 30px 0 rgba(27, 51, 43, 0.04)',
        healthRing: '0 0 20px rgba(47, 94, 78, 0.18)',
      },
      backgroundImage: {
        'card-glow': 'radial-gradient(circle at 50% 50%, rgba(47, 94, 78, 0.07), transparent 70%)',
        'radial-glow': 'radial-gradient(circle at 50% 50%, rgba(47, 94, 78, 0.10), transparent 75%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        }
      }
    },
  },
  plugins: [animate],
}
