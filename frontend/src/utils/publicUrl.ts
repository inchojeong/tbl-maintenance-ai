/**
 * Resolve a file under `public/` for both local (`/`) and GitHub Pages (`/repo/`).
 * Accepts paths with or without a leading slash.
 */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalized = path.replace(/^\/+/, "");
  return `${base}${normalized}`;
}
