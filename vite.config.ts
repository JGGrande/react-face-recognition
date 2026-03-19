import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

function resolveBasePath() {
  const basePath = process.env.VITE_BASE_PATH?.trim()

  if (!basePath) {
    return "/"
  }

  const withLeadingSlash = basePath.startsWith("/")
    ? basePath
    : `/${basePath}`

  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`
}

// https://vite.dev/config/
export default defineConfig({
  base: resolveBasePath(),
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined
          }

          if (
            id.includes("@tensorflow/tfjs") ||
            id.includes("@tensorflow-models/face-detection")
          ) {
            return "engine-tensorflow"
          }

          if (id.includes("@mediapipe/tasks-vision")) {
            return "engine-mediapipe"
          }

          if (id.includes("face-api.js")) {
            return "engine-faceapi"
          }

          return undefined
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
