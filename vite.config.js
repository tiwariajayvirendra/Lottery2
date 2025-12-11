import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // "/api": "https://lot2backen.onrender.com"
      "/api": "http://localhost:5000"
    }
  }
});
