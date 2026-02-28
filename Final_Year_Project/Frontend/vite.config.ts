import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Allow any ngrok host for webhook development
    // Replace with your specific ngrok URL for production
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '*.ngrok-free.app',
      '*.ngrok.io'
    ],
  },
})
