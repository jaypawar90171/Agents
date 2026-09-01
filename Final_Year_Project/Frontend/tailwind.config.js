/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
      colors: {
        background: {
          DEFAULT: 'hsl(var(--background))',
          dark: 'hsl(var(--background-dark))',
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          dark: 'hsl(var(--foreground-dark))',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          dark: 'hsl(var(--surface-dark))',
        },
        'surface-container-lowest': {
          DEFAULT: 'hsl(var(--surface-container-lowest))',
          dark: 'hsl(var(--surface-container-lowest-dark))',
        },
        'surface-container-low': {
          DEFAULT: 'hsl(var(--surface-container-low))',
          dark: 'hsl(var(--surface-container-low-dark))',
        },
        'surface-container': {
          DEFAULT: 'hsl(var(--surface-container))',
          dark: 'hsl(var(--surface-container-dark))',
        },
        'surface-container-high': {
          DEFAULT: 'hsl(var(--surface-container-high))',
          dark: 'hsl(var(--surface-container-high-dark))',
        },
        'on-surface': {
          DEFAULT: 'hsl(var(--on-surface))',
          dark: 'hsl(var(--on-surface-dark))',
        },
        'on-background': {
          DEFAULT: 'hsl(var(--on-background))',
          dark: 'hsl(var(--on-background-dark))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          dark: 'hsl(var(--primary-dark))',
        },
        'on-primary': {
          DEFAULT: 'hsl(var(--on-primary))',
          dark: 'hsl(var(--on-primary-dark))',
        },
        'primary-container': {
          DEFAULT: 'hsl(var(--primary-container))',
          dark: 'hsl(var(--primary-container-dark))',
        },
        'on-primary-container': {
          DEFAULT: 'hsl(var(--on-primary-container))',
          dark: 'hsl(var(--on-primary-container-dark))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          dark: 'hsl(var(--secondary-dark))',
        },
        'on-secondary': {
          DEFAULT: 'hsl(var(--on-secondary))',
          dark: 'hsl(var(--on-secondary-dark))',
        },
        'secondary-container': {
          DEFAULT: 'hsl(var(--secondary-container))',
          dark: 'hsl(var(--secondary-container-dark))',
        },
        'on-secondary-container': {
          DEFAULT: 'hsl(var(--on-secondary-container))',
          dark: 'hsl(var(--on-secondary-container-dark))',
        },
        tertiary: {
          DEFAULT: 'hsl(var(--tertiary))',
          dark: 'hsl(var(--tertiary-dark))',
        },
        'on-tertiary': {
          DEFAULT: 'hsl(var(--on-tertiary))',
          dark: 'hsl(var(--on-tertiary-dark))',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          dark: 'hsl(var(--error-dark))',
        },
        'on-error': {
          DEFAULT: 'hsl(var(--on-error))',
          dark: 'hsl(var(--on-error-dark))',
        },
        outline: {
          DEFAULT: 'hsl(var(--outline))',
          dark: 'hsl(var(--outline-dark))',
        },
        'outline-variant': {
          DEFAULT: 'hsl(var(--outline-variant))',
          dark: 'hsl(var(--outline-variant-dark))',
        },
        'surface-dim': {
          DEFAULT: 'hsl(var(--surface-dim))',
          dark: 'hsl(var(--surface-dim-dark))',
        },
        'surface-bright': {
          DEFAULT: 'hsl(var(--surface-bright))',
          dark: 'hsl(var(--surface-bright-dark))',
        },
        'surface-variant': {
          DEFAULT: 'hsl(var(--surface-variant))',
          dark: 'hsl(var(--surface-variant-dark))',
        },
        'on-surface-variant': {
          DEFAULT: 'hsl(var(--on-surface-variant))',
          dark: 'hsl(var(--on-surface-variant-dark))',
        },
        'inverse-surface': {
          DEFAULT: 'hsl(var(--inverse-surface))',
          dark: 'hsl(var(--inverse-surface-dark))',
        },
        'inverse-on-surface': {
          DEFAULT: 'hsl(var(--inverse-on-surface))',
          dark: 'hsl(var(--inverse-on-surface-dark))',
        },
        'inverse-primary': {
          DEFAULT: 'hsl(var(--inverse-primary))',
          dark: 'hsl(var(--inverse-primary-dark))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        headline: ["Noto Serif", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        label: ["Public Sans", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Noto Serif", "Georgia", "serif"],
      }
    }
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms"), require("@tailwindcss/container-queries")],
}

