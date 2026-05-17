import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import type { ReactNode } from 'react';

type Variant = 'info' | 'success' | 'warning' | 'error';

const STYLES: Record<Variant, { box: string; icon: string; Icon: typeof Info }> = {
  info: {
    box: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100/90',
    icon: 'text-cyan-400',
    Icon: Info,
  },
  success: {
    box: 'border-green-500/30 bg-green-500/10 text-green-100/90',
    icon: 'text-green-400',
    Icon: CheckCircle,
  },
  warning: {
    box: 'border-amber-500/30 bg-amber-500/10 text-amber-100/90',
    icon: 'text-amber-400',
    Icon: AlertCircle,
  },
  error: {
    box: 'border-red-500/30 bg-red-500/10 text-red-100/90',
    icon: 'text-red-400',
    Icon: AlertCircle,
  },
};

export default function UserBanner({
  variant = 'info',
  title,
  children,
  onDismiss,
  action,
}: {
  variant?: Variant;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  action?: ReactNode;
}) {
  const { box, icon, Icon } = STYLES[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 flex gap-3 ${box}`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${icon}`} aria-hidden />
      <div className="flex-1 min-w-0 text-sm leading-relaxed">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
      {(action || onDismiss) && (
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {action}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
