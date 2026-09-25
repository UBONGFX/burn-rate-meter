import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // e2e/ holds Playwright specs, run separately via `npm run test:e2e`
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
