import { DetectraNavLogo } from './DetectraLogo';

/** Navbar logo — Detectra wordmark only (no parent-company line in the header). */
export function BrandNavLogo({ className = '' }: { className?: string }) {
  return <DetectraNavLogo className={className} />;
}
