import { defineConfig } from "wxt";
// @ts-ignore
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    web_accessible_resources: [
      {
        resources: ['iframe.html'],
        matches: ['<all_urls>'],
      },
    ],
    permissions: ['storage']
  },
  modules: ["@wxt-dev/module-react"],
  srcDir: 'src',
  vite: () => ({
    plugins: [tailwindcss()],
  }),

});
