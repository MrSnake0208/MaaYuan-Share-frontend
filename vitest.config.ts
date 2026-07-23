import react from '@vitejs/plugin-react'

import viteTsconfigPath from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), viteTsconfigPath()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
