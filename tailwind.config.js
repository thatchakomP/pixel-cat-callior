// tailwind.config.js (or .ts if you chose that conversion for config files)
/** @type {import('tailwindcss').Config} */ // Add JSDoc for types if .js
const config = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './store/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                pixel: ['"Press Start 2P"', 'cursive'],
            },
            colors: {
                // Your custom pixel palette - THESE MUST BE EXACTLY AS DEFINED
                'pixel-blue-dark': '#111827',
                'pixel-blue-medium': '#1F2937',
                'pixel-blue-light': '#3B82F6',
                'pixel-blue-text': '#BFDBFE',
                'pixel-blue-frame': '#E0E7FF',
                'pixel-yellow': '#FBBF24',
                'pixel-orange': '#F97316',
                'pixel-red-error': '#EF4444',
                'pixel-green-success': '#22C55E',
            },
            borderRadius: {
                'pixel-sm': '4px',
                'pixel-md': '8px',
                'pixel-lg': '12px',
            },
            boxShadow: {
                'pixel-sm': '2px 2px 0px #000',
                'pixel-md': '4px 4px 0px #000',
                'pixel-lg': '6px 6px 0px #000',
                'pixel-inset-sm': 'inset 2px 2px 0px #000',
            },
            borderWidth: {
                3: '3px',
            },
        },
    },
    plugins: [],
}
module.exports = config // Use module.exports for .js files
// If using .ts, it's export default config;
