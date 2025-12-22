import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Uncomment the next line to allow access from other devices on the same network
    // host: '0.0.0.0',
  },
  resolve: {
    alias: {
      // Sets up a handy '@' alias to the project's 'src' directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Improves build performance and provides better debugging info
    sourcemap: true,
  },
  // Note: Environment variables are now handled by Vite's standard `import.meta.env`
  // and do not need to be defined here unless you have a specific, non-standard use case.
  // The CEREBRAS_API_KEY is a runtime variable, not a build-time one, so it's not defined here.
});
