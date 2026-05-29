/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_BUILD_ID: string;
  readonly VITE_API_URL: string;
  readonly VITE_API_SAME_ORIGIN: string;
  readonly VITE_API_DIRECT: string;
  readonly VITE_SITE_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
