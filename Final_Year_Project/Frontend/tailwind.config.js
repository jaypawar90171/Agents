/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
			"outline-variant": "#c3c6d5",
			"on-primary-container": "#e7ebff",
			"on-background": "#1b1c1d",
			"inverse-on-surface": "#f2f0f1",
			"surface-container": "#efedee",
			"on-tertiary": "#ffffff",
			"surface-tint": "#2259bf",
			"on-secondary-fixed": "#171c20",
			"tertiary-container": "#bfab49",
			"primary-fixed-dim": "#b1c5ff",
			"on-tertiary-fixed-variant": "#524600",
			"surface-container-high": "#e9e8e9",
			"inverse-surface": "#303031",
			"on-tertiary-container": "#4a3f00",
			"on-primary-fixed": "#001946",
			"on-secondary": "#ffffff",
			"primary-fixed": "#d9e2ff",
			"tertiary-fixed-dim": "#dcc661",
			"surface-variant": "#e3e2e3",
			"on-error": "#ffffff",
			"on-primary": "#ffffff",
			"error": "#ba1a1a",
			"tertiary-fixed": "#f9e37a",
			"primary": "#094cb2",
			"on-tertiary-fixed": "#211b00",
			"inverse-primary": "#b1c5ff",
			"error-container": "#ffdad6",
			"surface-dim": "#dbdadb",
			"secondary-container": "#dfe3e8",
			"primary-container": "#3366cc",
			"background": "#faf9fa",
			"surface-container-lowest": "#ffffff",
			"tertiary": "#6d5e00",
			"surface": "#faf9fa",
			"on-surface": "#1b1c1d",
			"on-primary-fixed-variant": "#00419d",
			"secondary": "#5a5f63",
			"on-secondary-container": "#606569",
			"on-error-container": "#93000a",
			"surface-bright": "#faf9fa",
			"surface-container-highest": "#e3e2e3",
			"secondary-fixed-dim": "#c2c7cc",
			"on-secondary-fixed-variant": "#42474b",
			"secondary-fixed": "#dfe3e8",
			"on-surface-variant": "#434653",
			"surface-container-low": "#f5f3f4",
			"outline": "#737784",
  			foreground: 'hsl(var(--foreground))',
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
		fontFamily: {
			headline: ["Noto Serif"],
			body: ["Inter"],
			label: ["Public Sans"]
		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms"), require("@tailwindcss/container-queries")],
}

