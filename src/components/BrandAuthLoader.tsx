import { DetectraLogoMark } from './DetectraLogo';

/** Full-screen auth bootstrap loader with brand logo. */
export default function BrandAuthLoader({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center px-6">
        <DetectraLogoMark size="lg" glow className="mx-auto justify-center mb-6" />
        <div
          className="w-10 h-10 border-2 border-cyan-500/80 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          role="status"
          aria-label="Loading"
        />
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  );
}
