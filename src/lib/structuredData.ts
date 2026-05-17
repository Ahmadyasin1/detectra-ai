import { DETECTRA_LOGO_SRC, DETECTRA_SITE_URL } from '../constants/branding';
import {
  DETECTRA_PRODUCT,
  DETECTRA_SAME_AS,
  FOUNDER,
  NEXARIZA_ORG,
  NEXARIZA_SAME_AS,
  SEO_API_ORIGIN,
} from '../constants/seoEntities';
import { absoluteUrl } from '../constants/seo';

const IDS = {
  founder: `${DETECTRA_SITE_URL}/#founder-ahmad-yasin`,
  nexariza: `${NEXARIZA_ORG.url}/#organization`,
  detectra: `${DETECTRA_SITE_URL}/#organization`,
  website: `${DETECTRA_SITE_URL}/#website`,
  app: `${DETECTRA_SITE_URL}/#software`,
} as const;

/** JSON-LD @graph for crawlers — links Detectra, Nexariza, and Ahmad Yasin. */
export function buildStructuredDataGraph(pageDescription: string, pageUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': IDS.founder,
        name: FOUNDER.name,
        givenName: FOUNDER.givenName,
        familyName: FOUNDER.familyName,
        jobTitle: FOUNDER.jobTitle,
        description: FOUNDER.roleDescription,
        email: FOUNDER.email,
        url: FOUNDER.github,
        worksFor: { '@id': IDS.nexariza },
        affiliation: { '@id': IDS.nexariza },
        sameAs: [FOUNDER.github, NEXARIZA_ORG.aboutUrl],
        knowsAbout: [
          'Artificial Intelligence',
          'Computer Vision',
          'Multimodal Machine Learning',
          'Surveillance Analytics',
          'Detectra AI',
        ],
      },
      {
        '@type': 'Organization',
        '@id': IDS.nexariza,
        name: NEXARIZA_ORG.name,
        alternateName: NEXARIZA_ORG.alternateName,
        url: NEXARIZA_ORG.url,
        description: NEXARIZA_ORG.description,
        email: NEXARIZA_ORG.email,
        founder: { '@id': IDS.founder },
        sameAs: NEXARIZA_SAME_AS,
        subOrganization: { '@id': IDS.detectra },
      },
      {
        '@type': 'Organization',
        '@id': IDS.detectra,
        name: DETECTRA_PRODUCT.name,
        alternateName: DETECTRA_PRODUCT.alternateName,
        url: DETECTRA_SITE_URL,
        logo: absoluteUrl(DETECTRA_LOGO_SRC),
        description: DETECTRA_PRODUCT.description,
        founder: { '@id': IDS.founder },
        parentOrganization: { '@id': IDS.nexariza },
        brand: { '@id': IDS.nexariza },
        sameAs: DETECTRA_SAME_AS,
      },
      {
        '@type': 'WebSite',
        '@id': IDS.website,
        name: DETECTRA_PRODUCT.name,
        url: DETECTRA_SITE_URL,
        description: pageDescription,
        inLanguage: 'en',
        publisher: { '@id': IDS.nexariza },
        creator: { '@id': IDS.founder },
        about: [{ '@id': IDS.detectra }, { '@id': IDS.nexariza }],
        isPartOf: { '@id': IDS.nexariza },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${DETECTRA_SITE_URL}/analyze?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': IDS.app,
        name: DETECTRA_PRODUCT.name,
        applicationCategory: 'SecurityApplication',
        operatingSystem: 'Web',
        url: pageUrl,
        description: pageDescription,
        author: { '@id': IDS.nexariza },
        creator: { '@id': IDS.founder },
        provider: { '@id': IDS.nexariza },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        softwareHelp: SEO_API_ORIGIN,
        featureList: [
          'YOLOv8 segmentation and pose',
          'ByteTrack multi-object tracking',
          'Whisper speech transcription',
          'Multimodal fusion scoring',
          'Surveillance event ledger',
        ],
      },
      {
        '@type': 'WebAPI',
        name: 'Detectra AI Analysis API',
        url: SEO_API_ORIGIN,
        documentation: `${SEO_API_ORIGIN}/health`,
        provider: { '@id': IDS.nexariza },
      },
    ],
  };
}
