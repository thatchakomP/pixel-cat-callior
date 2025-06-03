import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}', // App Router specific
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './store/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                // You'll need to ensure 'Press Start 2P' is available globally
                // (e.g., via Google Fonts in app/globals.css)
                pixel: ['"Press Start 2P"', 'cursive'],
            },
            colors: {
                'pixel-dark': '#2c0c3c',
                'pixel-medium': '#6a3c5a',
                'pixel-light': '#9a6b7e',
                'pixel-accent': '#c38b97',
                'pixel-bg': '#f0e6d6',
                'pixel-green': '#3d8c40',
                'pixel-red': '#cc3e3e',
            },
            // Custom shadows for 8-bit borders
            boxShadow: {
                'pixel-sm': '2px 2px 0px #000',
                'pixel-md': '4px 4px 0px #000',
                'pixel-lg': '6px 6px 0px #000',
                'pixel-inset-sm': 'inset 2px 2px 0px #2c0c3c',
            },
            borderWidth: {
                '3': '3px',
            },
        },
    },
    plugins: [],
}
export default config
