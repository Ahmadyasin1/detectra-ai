import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls to top on every route change so each page opens at the top.
 * Honors hash links (e.g. /#how-it-works) when the target exists.
 */
export default function ScrollRestoration() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ block: 'start', behavior: 'auto' });
        return;
      }
    }

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.getElementById('main-content')?.scrollTo?.(0, 0);
  }, [pathname, hash]);

  return null;
}
