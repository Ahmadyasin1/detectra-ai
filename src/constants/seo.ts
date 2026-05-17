import { DETECTRA_SITE_URL } from './branding';

export type SeoRouteMeta = {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
};

/** SEO suffix — meta/JSON-LD only, not shown in page UI. */
export const SEO_BYLINE =
  ' Product of Nexariza AI (nexariza.com). Founded by Ahmad Yasin, Founder @ NEXARIZA-AI.';

export function withSeoByline(description: string, include = true): string {
  if (!include || description.includes('Nexariza AI')) return description;
  return description + SEO_BYLINE;
}

function page(
  title: string,
  description: string,
  path: string,
  opts?: { noindex?: boolean; seoByline?: boolean },
): SeoRouteMeta {
  return {
    title,
    description: withSeoByline(description, opts?.seoByline !== false),
    path,
    noindex: opts?.noindex,
  };
}

export const DEFAULT_SEO: SeoRouteMeta = page(
  'Detectra AI — Multimodal Video Intelligence | Nexariza AI',
  'Detectra AI analyzes surveillance footage with YOLOv8, ByteTrack, Whisper, and fusion AI — incident detection, transcripts, and investigation reports for security teams.',
  '/',
);

/** Per-route titles and descriptions (path → meta). */
export const ROUTE_SEO: Record<string, SeoRouteMeta> = {
  '/': DEFAULT_SEO,
  '/fyp-project': page(
    'FYP Project — Detectra AI | Nexariza AI',
    'Final Year Project: unified multimodal video analysis for object detection, tracking, speech, and surveillance events.',
    '/fyp-project',
  ),
  '/timeline': page(
    'Project Timeline — Detectra AI',
    'Development milestones for the Detectra AI multimodal surveillance platform by Nexariza AI.',
    '/timeline',
  ),
  '/research': page(
    'Research & Literature — Detectra AI',
    'Academic foundations, datasets, and related work behind Detectra AI multimodal fusion.',
    '/research',
  ),
  '/demo': page(
    'Detection Demo — Detectra AI',
    'Interactive preview of Detectra AI perception, tracking, and alert capabilities.',
    '/demo',
  ),
  '/architecture': page(
    'System Architecture — Detectra AI',
    'Technical architecture: parallel inference workers, fusion engine, and scalable API on Heroku.',
    '/architecture',
  ),
  '/pipeline': page(
    'Analysis Pipeline — Detectra AI',
    'End-to-end pipeline from ingest to YOLO, Whisper, fusion scoring, and RAG reports.',
    '/pipeline',
  ),
  '/capabilities': page(
    'Capabilities — Detectra AI',
    'Object detection, pose, speech, audio events, and multimodal threat fusion for security teams.',
    '/capabilities',
  ),
  '/pricing': page(
    'Pricing — Detectra AI',
    'Plans for teams running Detectra AI multimodal video intelligence at scale.',
    '/pricing',
  ),
  '/team': page(
    'Team — Detectra AI',
    'Detectra AI and Nexariza AI team; FYP supervision at University of Central Punjab.',
    '/team',
  ),
  '/business-case': page(
    'Business Case — Detectra AI',
    'Market opportunity, use cases, and ROI for AI-powered surveillance review.',
    '/business-case',
  ),
  '/contact': page(
    'Contact — Detectra AI & Nexariza AI',
    'Contact Detectra AI and Nexariza AI for demos, partnerships, and multimodal video intelligence support.',
    '/contact',
  ),
  '/signin': page(
    'Sign In — Detectra AI',
    'Sign in to upload footage, track jobs, and access investigation reports.',
    '/signin',
    { seoByline: false },
  ),
  '/signup': page(
    'Create Account — Detectra AI',
    'Create a free Detectra AI account for multimodal video analysis.',
    '/signup',
    { seoByline: false },
  ),
  '/profile': page(
    'Profile — Detectra AI',
    'Manage your Detectra AI account and preferences.',
    '/profile',
    { noindex: true, seoByline: false },
  ),
  '/analyze': page(
    'Analyze — Detectra AI',
    'Upload surveillance video for multimodal AI analysis, live metrics, and evidence ledger.',
    '/analyze',
    { noindex: true, seoByline: false },
  ),
};

export function resolveSeoForPath(pathname: string): SeoRouteMeta {
  const base = pathname.split('?')[0].replace(/\/$/, '') || '/';

  if (ROUTE_SEO[base]) return ROUTE_SEO[base];

  if (base.startsWith('/analyze/progress/')) {
    return page(
      'Analysis in Progress — Detectra AI',
      'Real-time multimodal analysis progress for your uploaded evidence.',
      base,
      { noindex: true, seoByline: false },
    );
  }
  if (base.startsWith('/analyze/results/')) {
    return page(
      'Analysis Results — Detectra AI',
      'Surveillance events, transcripts, fusion insights, and exportable reports.',
      base,
      { noindex: true, seoByline: false },
    );
  }

  if (base !== '/' && !ROUTE_SEO[base]) {
    return {
      title: 'Page Not Found — Detectra AI',
      description: DEFAULT_SEO.description,
      path: base,
      noindex: true,
    };
  }

  return DEFAULT_SEO;
}

export function absoluteUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${DETECTRA_SITE_URL}${p}`;
}
