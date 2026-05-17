/** Primary brand asset — full wordmark used site-wide. */
export const DETECTRA_LOGO_SRC = '/detectra-logo.png';

/** @deprecated Use DETECTRA_LOGO_SRC — kept for backward compatibility. */
export const DETECTRA_LOGO_MARK_SRC = DETECTRA_LOGO_SRC;

export const DETECTRA_BRAND_NAME = 'Detectra AI';

export const NEXARIZA_BRAND_NAME = 'Nexariza AI';

export const DETECTRA_TAGLINE = 'Multimodal video intelligence for security teams';

export const DETECTRA_SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://detectra-ai.vercel.app';
