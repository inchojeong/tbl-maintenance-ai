/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_PROXY_MODEL: string;
  readonly VITE_GLTF_MODEL_PATH: string;
  readonly VITE_DEBUG_3D?: string;
  /** Set at build time for GitHub Pages (e.g. `/repo-name/`). Local default `/`. */
  readonly VITE_BASE_PATH?: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
