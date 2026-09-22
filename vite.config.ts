/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served from GitHub Pages at https://peteriron.github.io/order-me-app/
export default defineConfig({
  base: '/order-me-app/',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
