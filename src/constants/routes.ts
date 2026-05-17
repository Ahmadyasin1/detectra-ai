/** Where users land after sign-in or sign-up. */
export const POST_AUTH_PATH = '/analyze';

/** Paths safe to show while the auth modal is open (not auth-gated). */
export const PUBLIC_ROUTE_PREFIXES = [
  '/',
  '/demo',
  '/capabilities',
  '/pricing',
  '/contact',
  '/team',
  '/fyp-project',
  '/project',
  '/timeline',
  '/research',
  '/architecture',
  '/pipeline',
  '/business-case',
] as const;

export function isPublicRoute(pathname: string): boolean {
  if (pathname === '/signin' || pathname === '/signup') return false;
  if (pathname === '/analyze' || pathname.startsWith('/analyze/')) return false;
  if (pathname === '/profile') return false;
  return PUBLIC_ROUTE_PREFIXES.some(
    (p) => pathname === p || (p !== '/' && pathname.startsWith(p)),
  );
}
