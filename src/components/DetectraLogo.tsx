import { Link } from 'react-router-dom';
import {
  DETECTRA_BRAND_NAME,
  DETECTRA_LOGO_MARK_2X_SRC,
  DETECTRA_LOGO_MARK_SRC,
  DETECTRA_LOGO_SRC,
  DETECTRA_TAGLINE,
} from '../constants/branding';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type LogoVariant = 'mark' | 'wordmark';

/** Icon frame — padding keeps the full mark visible without oversizing the bar. */
const MARK_FRAME: Record<LogoSize, string> = {
  xs: 'h-8 w-8 p-0.5',
  sm: 'h-10 w-10 p-0.5',
  md: 'h-11 w-11 p-0.5',
  lg: 'h-12 w-12 p-0.5',
  xl: 'h-14 w-14 p-1',
  '2xl': 'h-16 w-16 p-1',
};

/** Stacked icon + “DETECTRA AI” image — height-capped, width auto (full logo visible). */
const WORDMARK_FRAME: Record<LogoSize, string> = {
  xs: 'max-h-9 w-auto max-w-[4.75rem]',
  sm: 'max-h-11 w-auto max-w-[5.5rem]',
  md: 'max-h-[3.25rem] w-auto max-w-[7.25rem]',
  lg: 'max-h-[4.75rem] w-auto max-w-[15rem]',
  xl: 'max-h-[5.5rem] w-auto max-w-[17.5rem]',
  '2xl': 'max-h-24 w-auto max-w-[20rem]',
};

const TEXT_CLASS: Record<LogoSize, string> = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
  '2xl': 'text-3xl',
};

const TAGLINE_CLASS: Record<LogoSize, string> = {
  xs: 'text-[10px]',
  sm: 'text-[11px]',
  md: 'text-xs',
  lg: 'text-xs',
  xl: 'text-sm',
  '2xl': 'text-sm',
};

/** Crisp on dark backgrounds — no heavy drop-shadow (avoids muddy box). */
const MARK_IMG =
  'block max-h-full max-w-full h-auto w-auto object-contain object-center select-none';

const WORDMARK_IMG =
  'block h-full w-auto max-w-full object-contain object-center select-none';

type DetectraLogoProps = {
  size?: LogoSize;
  variant?: LogoVariant | 'auto';
  showText?: boolean;
  tagline?: string | null;
  className?: string;
  imgClassName?: string;
  linkToHome?: boolean;
  /** Soft glow behind icon — use on marketing sections, not the compact navbar. */
  glow?: boolean;
  /** Tighter row for header (smaller type, optional tagline). */
  compact?: boolean;
};

function resolveVariant(variant: LogoVariant | 'auto', showText: boolean): LogoVariant {
  if (variant !== 'auto') return variant;
  return showText ? 'mark' : 'wordmark';
}

export function DetectraLogoMark({
  size = 'md',
  variant = 'mark',
  className = '',
  imgClassName = '',
  alt = `${DETECTRA_BRAND_NAME} logo`,
  glow = false,
}: {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
  imgClassName?: string;
  alt?: string;
  glow?: boolean;
}) {
  const isMark = variant === 'mark';
  const src = isMark ? DETECTRA_LOGO_MARK_SRC : DETECTRA_LOGO_SRC;
  const srcSet = isMark
    ? `${DETECTRA_LOGO_MARK_SRC} 1x, ${DETECTRA_LOGO_MARK_2X_SRC} 2x`
    : undefined;
  const frame = isMark ? MARK_FRAME[size] : WORDMARK_FRAME[size];

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 overflow-visible ${
        isMark ? frame : `h-auto ${frame}`
      } ${className}`}
    >
      {glow && isMark && (
        <span
          className="pointer-events-none absolute inset-0 rounded-full bg-cyan-400/20 blur-lg scale-90"
          aria-hidden
        />
      )}
      <img
        src={src}
        srcSet={srcSet}
        alt={alt}
        className={`relative z-[1] ${isMark ? MARK_IMG : WORDMARK_IMG} ${imgClassName}`}
        decoding="async"
        loading="eager"
        fetchPriority="high"
      />
    </span>
  );
}

export default function DetectraLogo({
  size = 'sm',
  variant = 'auto',
  showText = true,
  tagline = DETECTRA_TAGLINE,
  className = '',
  imgClassName = '',
  linkToHome = false,
  glow = false,
  compact = false,
}: DetectraLogoProps) {
  const resolved = resolveVariant(variant, showText);
  const markSize = size;

  if (resolved === 'wordmark') {
    const wordmark = (
      <DetectraLogoMark
        size={size}
        variant="wordmark"
        className={className}
        imgClassName={imgClassName}
      />
    );
    if (linkToHome) {
      return (
        <Link
          to="/"
          className="inline-flex outline-none rounded-md focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400/70"
        >
          {wordmark}
        </Link>
      );
    }
    return wordmark;
  }

  const inner = (
    <div className={`flex items-center min-w-0 ${compact ? 'gap-2.5' : 'gap-3'} ${className}`}>
      <DetectraLogoMark
        size={markSize}
        variant="mark"
        imgClassName={imgClassName}
        glow={glow}
      />
      {showText && (
        <div className="flex flex-col justify-center leading-snug min-w-0">
          <span className={`text-white font-semibold tracking-tight ${TEXT_CLASS[size]}`}>
            {DETECTRA_BRAND_NAME}
          </span>
          {tagline && (
            <span
              className={
                compact
                  ? 'hidden lg:block text-[10px] leading-tight text-slate-400 mt-0.5 truncate max-w-[12rem]'
                  : `hidden sm:block text-slate-400 font-normal truncate ${TAGLINE_CLASS[size]}`
              }
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link
        to="/"
        className="inline-flex outline-none rounded-md focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400/70"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}
