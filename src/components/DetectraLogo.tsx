import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DETECTRA_BRAND_NAME,
  DETECTRA_LOGO_SRC,
  DETECTRA_TAGLINE,
} from '../constants/branding';

export type LogoSize = 'xs' | 'sm' | 'auth' | 'md' | 'lg' | 'xl' | '2xl';

const FRAME: Record<LogoSize, string> = {
  xs: 'h-8 max-w-[88px]',
  sm: 'h-9 max-w-[104px]',
  auth: 'h-9 max-w-[108px]',
  md: 'h-11 max-w-[128px]',
  lg: 'h-14 max-w-[168px]',
  xl: 'h-[4.25rem] max-w-[220px]',
  '2xl': 'h-20 max-w-[280px]',
};

const IMG_CLASS =
  'h-full w-auto max-w-full object-contain object-left select-none brightness-[1.06] contrast-[1.05] saturate-[1.1] drop-shadow-[0_2px_24px_rgba(34,211,238,0.35)]';

type LogoBaseProps = {
  size?: LogoSize;
  className?: string;
  imgClassName?: string;
  alt?: string;
  glow?: boolean;
};

/** Brand wordmark — always uses `/detectra-logo.png`. */
export function DetectraLogoMark({
  size = 'md',
  className = '',
  imgClassName = '',
  alt = `${DETECTRA_BRAND_NAME} logo`,
  glow = false,
}: LogoBaseProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const img = imgFailed ? (
    <span
      className={`flex h-full items-center text-sm font-bold tracking-tight text-cyan-300 ${imgClassName}`}
      aria-label={alt}
    >
      {DETECTRA_BRAND_NAME}
    </span>
  ) : (
    <img
      src={DETECTRA_LOGO_SRC}
      alt={alt}
      width={280}
      height={80}
      className={`${IMG_CLASS} ${imgClassName}`}
      decoding="async"
      loading="eager"
      fetchPriority="high"
      onError={() => setImgFailed(true)}
    />
  );

  return (
    <span
      className={`inline-flex items-center justify-start shrink-0 ${FRAME[size]} ${className}`}
    >
      {glow ? (
        <span className="relative inline-flex h-full w-full items-center">
          <span
            aria-hidden
            className="absolute inset-0 scale-110 rounded-full bg-cyan-400/12 blur-xl"
          />
          <span className="relative">{img}</span>
        </span>
      ) : (
        img
      )}
    </span>
  );
}

/** Navbar — wordmark links home. */
export function DetectraNavLogo({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 rounded-lg ${className}`}
      aria-label={`${DETECTRA_BRAND_NAME} home`}
    >
      <DetectraLogoMark size="md" />
    </Link>
  );
}

type DetectraLogoProps = LogoBaseProps & {
  tagline?: string | null;
  showTagline?: boolean;
  linkToHome?: boolean;
};

/** Footer / marketing — logo with optional tagline. */
export default function DetectraLogo({
  size = 'sm',
  className = '',
  imgClassName = '',
  tagline = DETECTRA_TAGLINE,
  showTagline = false,
  linkToHome = false,
  glow = false,
}: DetectraLogoProps) {
  const inner = (
    <LogoWithTagline
      size={size}
      className={className}
      imgClassName={imgClassName}
      tagline={showTagline ? tagline : null}
      glow={glow}
    />
  );

  if (linkToHome) {
    return (
      <Link
        to="/"
        className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 rounded-lg"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

function LogoWithTagline({
  size,
  className,
  imgClassName,
  tagline,
  glow,
}: {
  size: LogoSize;
  className: string;
  imgClassName: string;
  tagline: string | null;
  glow: boolean;
}) {
  return (
    <div className={`flex flex-col items-start gap-2 min-w-0 ${className}`}>
      <DetectraLogoMark size={size} imgClassName={imgClassName} glow={glow} />
      {tagline && (
        <p className="text-gray-500 text-xs sm:text-sm font-medium max-w-xs leading-snug">
          {tagline}
        </p>
      )}
    </div>
  );
}
