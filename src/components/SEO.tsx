import { Helmet } from 'react-helmet-async';
import { DETECTRA_LOGO_SRC, DETECTRA_BRAND_NAME } from '../constants/branding';
import { absoluteUrl, DEFAULT_SEO } from '../constants/seo';
import {
  FOUNDER,
  GLOBAL_SEO_KEYWORDS,
  NEXARIZA_ORG,
} from '../constants/seoEntities';
import { buildStructuredDataGraph } from '../lib/structuredData';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  noindex?: boolean;
  type?: 'website' | 'article';
}

export default function SEO({
  title = DEFAULT_SEO.title,
  description = DEFAULT_SEO.description,
  keywords = GLOBAL_SEO_KEYWORDS,
  image = DETECTRA_LOGO_SRC,
  url,
  noindex = false,
  type = 'website',
}: SEOProps) {
  const canonical =
    url ||
    (typeof window !== 'undefined' ? window.location.href : absoluteUrl(DEFAULT_SEO.path));
  const ogImage = image.startsWith('http') ? image : absoluteUrl(image);
  const metaAuthor = `${FOUNDER.name}, ${FOUNDER.jobTitle} @ ${NEXARIZA_ORG.name}`;
  const graph = buildStructuredDataGraph(description, canonical);

  return (
    <Helmet>
      <html lang="en" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={metaAuthor} />
      <meta name="creator" content={FOUNDER.name} />
      <meta name="publisher" content={NEXARIZA_ORG.name} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'} />
      <meta name="googlebot" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="theme-color" content="#22d3ee" />
      <meta name="application-name" content={DETECTRA_BRAND_NAME} />

      {/* Entity hints for crawlers (not rendered in page body) */}
      <meta name="subject" content={`${DETECTRA_BRAND_NAME} by ${NEXARIZA_ORG.name}`} />
      <meta name="classification" content="Artificial Intelligence, Video Surveillance, Security Software" />
      <meta name="owner" content={FOUNDER.name} />
      <meta name="copyright" content={NEXARIZA_ORG.name} />
      <meta name="referrer" content="strict-origin-when-cross-origin" />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={DETECTRA_BRAND_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="article:publisher" content={NEXARIZA_ORG.url} />
      <meta property="article:author" content={FOUNDER.github} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content="@detectra_ai" />

      <link rel="canonical" href={canonical} />
      <link rel="icon" type="image/png" href={DETECTRA_LOGO_SRC} />
      <link rel="apple-touch-icon" href={DETECTRA_LOGO_SRC} />
      <link rel="author" href={NEXARIZA_ORG.aboutUrl} />
      <link rel="publisher" href={NEXARIZA_ORG.url} />
      <link rel="me" href={FOUNDER.github} />

      <script type="application/ld+json">{JSON.stringify(graph)}</script>
    </Helmet>
  );
}
