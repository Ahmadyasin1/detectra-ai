/**
 * SEO-only entity graph (meta tags + JSON-LD). Not rendered in page UI.
 * Links Detectra AI ↔ Nexariza AI ↔ Ahmad Yasin for search discovery.
 */

export const SEO_API_ORIGIN = 'https://detectra-ai-e00ebf89f84f.herokuapp.com';

export const NEXARIZA_ORG = {
  name: 'Nexariza AI',
  alternateName: ['NEXARIZA-AI', 'Nexariza', 'Nexariza AI Labs'],
  url: 'https://nexariza.com',
  aboutUrl: 'https://nexariza.com/about',
  servicesUrl: 'https://nexariza.com/services',
  portfolioUrl: 'https://nexariza.com/portfolio',
  email: 'contact@nexariza.com',
  description:
    'Nexariza AI builds purpose-built AI and full-stack products for security, automation, and intelligent video systems. Parent company behind Detectra AI.',
} as const;

export const FOUNDER = {
  name: 'Ahmad Yasin',
  givenName: 'Ahmad',
  familyName: 'Yasin',
  jobTitle: 'Founder',
  worksFor: NEXARIZA_ORG.name,
  email: 'ahmad@nexariza.ai',
  github: 'https://github.com/Ahmadyasin1',
  roleDescription:
    'Founder at Nexariza AI (NEXARIZA-AI). Creator of Detectra AI multimodal video intelligence for surveillance and security operations.',
} as const;

export const DETECTRA_PRODUCT = {
  name: 'Detectra AI',
  alternateName: ['Detectra', 'DetectraAI', 'Detecra AI'],
  description:
    'Detectra AI is a professional multimodal video intelligence platform by Nexariza AI — YOLOv8, ByteTrack, Whisper, and fusion scoring for surveillance review.',
} as const;

/** Keywords injected into meta only (never shown as on-page copy). */
export const GLOBAL_SEO_KEYWORDS: string[] = [
  'Detectra AI',
  'Detectra',
  'Detecra AI',
  'Nexariza AI',
  'NEXARIZA-AI',
  'Nexariza',
  'nexariza.com',
  'Ahmad Yasin',
  'Ahmad Yasin founder',
  'Nexariza AI founder',
  'multimodal video intelligence',
  'surveillance AI',
  'YOLOv8 surveillance',
  'ByteTrack',
  'Whisper transcription',
  'video evidence analysis',
  'security operations center',
  'University of Central Punjab',
  'FYP AI project',
  'intelligent detection systems',
];

export const NEXARIZA_SAME_AS: string[] = [
  NEXARIZA_ORG.url,
  NEXARIZA_ORG.aboutUrl,
  NEXARIZA_ORG.servicesUrl,
  NEXARIZA_ORG.portfolioUrl,
  'https://github.com/nexariza',
  FOUNDER.github,
];

export const DETECTRA_SAME_AS: string[] = [
  'https://detectra-ai.vercel.app',
  SEO_API_ORIGIN,
  FOUNDER.github,
  ...NEXARIZA_SAME_AS,
];
