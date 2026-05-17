import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-10 px-4">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon className="w-7 h-7 text-slate-500" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-slate-200">{title}</p>
      {description && (
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
