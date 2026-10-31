
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Configure Vite for React, Tailwind CSS, and shadcn/ui.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  // Allows imports like "@/components/ui/button"
  // instead of long relative paths.
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
