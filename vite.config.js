import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig ({
  build: {
    lib: {
      entry: resolve(__dirname, "src/direflow-components/chat-component/App.jsx"),
      name: "chat-component",
      fileName: "index",
    },
    rollupOptions: {
      external: ["react"],
    },
  },
});