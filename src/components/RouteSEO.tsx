import { useLocation } from 'react-router-dom';
import SEO from './SEO';
import { absoluteUrl, resolveSeoForPath } from '../constants/seo';

/** Updates document meta tags on every client route change. */
export default function RouteSEO() {
  const { pathname } = useLocation();
  const meta = resolveSeoForPath(pathname);

  return (
    <SEO
      title={meta.title}
      description={meta.description}
      url={absoluteUrl(meta.path)}
      noindex={meta.noindex}
    />
  );
}
