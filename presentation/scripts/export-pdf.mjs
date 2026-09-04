/**
 * Capture every 1920×1080 slide into one landscape PDF.
 * Usage (from presentation/scripts): npm install && node export-pdf.mjs
 */
import { createReadStream, existsSync, statSync, writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { PDFDocument } from "pdf-lib";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const OUT = path.join(ROOT, "aircraft-maintenance-ai-deck.pdf");

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.EDGE_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/microsoft-edge",
].filter(Boolean);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function findBrowser() {
  for (const p of CHROME_CANDIDATES) {
    if (existsSync(p)) return p;
  }
  throw new Error("Chrome/Edge not found. Set CHROME_PATH.");
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let rel = decodeURIComponent((req.url || "/").split("?")[0]);
      if (rel === "/" || rel === "") rel = "/index.html";
      const file = path.normalize(path.join(ROOT, rel));
      if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
        res.statusCode = 404;
        res.end("not found");
        return;
      }
      res.setHeader("Content-Type", MIME[path.extname(file).toLowerCase()] || "application/octet-stream");
      createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const executablePath = findBrowser();
  const { server, port } = await startServer();
  const tmp = mkdtempSync(path.join(os.tmpdir(), "deck-pdf-"));

  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  await page.goto(`http://127.0.0.1:${port}/index.html?export=1`, {
    waitUntil: "load",
    timeout: 60000,
  });
  await page.waitForFunction(() => window.__deck && window.__deck.count > 0);
  const count = await page.evaluate(() => window.__deck.count);

  const pngs = [];
  for (let i = 0; i < count; i++) {
    await page.evaluate((idx) => window.__deck.go(idx), i);
    await sleep(800);
    const file = path.join(tmp, `slide-${String(i + 1).padStart(2, "0")}.png`);
    await page.locator("#stage").screenshot({ path: file, type: "png" });
    pngs.push(file);
  }
  await browser.close();
  server.close();

  const pdf = await PDFDocument.create();
  for (const file of pngs) {
    const img = await pdf.embedPng(readFileSync(file));
    const p = pdf.addPage([1920, 1080]);
    p.drawImage(img, { x: 0, y: 0, width: 1920, height: 1080 });
  }
  writeFileSync(OUT, await pdf.save());
  rmSync(tmp, { recursive: true, force: true });
  console.log("Wrote", OUT, `(${count} pages)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
