import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Local: `/` (default)
 * GitHub Pages: set VITE_BASE_PATH (e.g. `/repo-name/`) in CI via configure-pages.
 */
function resolveBase(): string {
  const raw = process.env.VITE_BASE_PATH?.trim();
  if (!raw || raw === "/") return "/";
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const presentationDir = path.resolve(frontendDir, "../presentation");
const SKIP_TOP = new Set(["scripts", "node_modules"]);

function shouldCopyPresentationFile(src: string): boolean {
  const rel = path.relative(presentationDir, src);
  if (!rel || rel.startsWith("..")) return true;
  const top = rel.split(path.sep)[0];
  if (SKIP_TOP.has(top)) return false;
  if (src.endsWith(".mjs")) return false;
  return true;
}

function copyPresentationTo(dest: string) {
  if (!fs.existsSync(presentationDir)) return;
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(presentationDir, dest, {
    recursive: true,
    filter: shouldCopyPresentationFile,
  });
}

/** Serve / copy `../presentation` as `/presentation/` — isolated from app CSS/JS. */
function presentationPlugin(): Plugin {
  const mime: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".webp": "image/webp",
  };

  return {
    name: "isolated-presentation",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = (req.url ?? "").split("?")[0];
        const marker = "/presentation";
        const idx = raw.indexOf(marker);
        if (idx === -1) return next();

        let rel = decodeURIComponent(raw.slice(idx + marker.length));
        if (!rel || rel === "/") rel = "/index.html";
        const file = path.normalize(path.join(presentationDir, rel));
        if (!file.startsWith(presentationDir)) return next();

        let target = file;
        if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
          target = path.join(target, "index.html");
        }
        if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
          return next();
        }

        res.setHeader(
          "Content-Type",
          mime[path.extname(target).toLowerCase()] || "application/octet-stream",
        );
        fs.createReadStream(target).pipe(res);
      });
    },
    closeBundle() {
      copyPresentationTo(path.resolve(frontendDir, "dist/presentation"));
    },
  };
}

export default defineConfig({
  base: resolveBase(),
  plugins: [react(), tailwindcss(), presentationPlugin()],
  server: {
    port: 5173,
    host: true,
    watch: {
      // Large OneDrive-synced PDFs can throw EBUSY on fs.watch
      ignored: ["**/public/manuals/**/*.pdf"],
    },
  },
  test: {
    environment: "node",
    globals: true,
  },
});
