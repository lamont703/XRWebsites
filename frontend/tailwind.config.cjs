/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Ensure all components are scanned for Tailwind classes
  ],
  safelist: [], // Ensures critical classes are not removed (empty unless needed)
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: true, // Keep Tailwind's default CSS reset
  },
  purge: {
    enabled: process.env.NODE_ENV === 'production', // Enable only in production builds
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    options: {
      safelist: ["bg-red-500", "text-center"], // Manually keep critical classes
      blocklist: [], // Remove unused classes if necessary
    },
  },
}
