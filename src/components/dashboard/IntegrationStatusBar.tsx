import { Cloud, Database, Server, User, Cpu, Zap } from 'lucide-react';
import type { IntegrationSnapshot } from '../../lib/integration';

function Pill({
  ok,
  label,
  detail,
  icon: Icon,
  accent,
}: {
  ok: boolean;
  label: string;
  detail?: string;
  icon: typeof Server;
  accent?: 'purple' | 'cyan';
}) {
  const baseClass = accent === 'purple'
    ? 'border-purple-500/30 bg-purple-500/10 text-purple-200'
    : accent === 'cyan'
    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
    : ok
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
    : 'border-amber-500/25 bg-amber-500/10 text-amber-200/90';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${baseClass}`}
      title={detail}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{label}</span>
    </span>
  );
}

export default function IntegrationStatusBar({ snapshot }: { snapshot: IntegrationSnapshot }) {
  const { api, auth, storage } = snapshot;

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-md"
      role="status"
      aria-label="Platform integration status"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 w-full sm:w-auto sm:mr-1">
        Connected stack
      </span>
      <Pill
        icon={Server}
        ok={api.online && api.modelsLoaded}
        label={
          !snapshot.healthKnown
            ? 'Checking API…'
            : api.online
              ? api.modelsLoaded
                ? 'ML API'
                : 'API warming'
              : 'API offline'
        }
        detail={api.version ? `Detectra API ${api.version}` : undefined}
      />
      <Pill
        icon={User}
        ok={auth.configured && auth.signedIn}
        label={
          !auth.configured
            ? 'Auth (guest)'
            : auth.signedIn
              ? 'Signed in'
              : 'Sign in for history'
        }
        detail={auth.userId ? `User ${auth.userId.slice(0, 8)}…` : undefined}
      />
      <Pill
        icon={Database}
        ok={storage.configured}
        label={storage.configured ? `Storage · ${storage.bucket}` : 'Storage off'}
      />
      <Pill
        icon={Cloud}
        ok={snapshot.healthKnown && api.serverSupabaseSync}
        label={
          !snapshot.healthKnown
            ? 'Checking sync…'
            : api.serverSupabaseSync
              ? 'Server ↔ DB sync'
              : 'Server DB sync off'
        }
        detail={
          !snapshot.healthKnown
            ? 'Waiting for health check'
            : api.serverSupabaseSync
              ? 'API syncs job history to Supabase in real-time'
              : 'Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in backend .env, then restart'
        }
      />

      {/* GPU / CPU mode pill — shown when health is known */}
      {snapshot.healthKnown && (
        <Pill
          icon={api.gpuMode ? Zap : Cpu}
          ok={api.gpuMode ?? false}
          accent={api.gpuMode ? 'purple' : undefined}
          label={
            api.gpuMode
              ? `GPU · ${api.gpuName?.split(' ').slice(-2).join(' ') ?? 'CUDA'}`
              : 'CPU mode'
          }
          detail={
            api.gpuMode
              ? `GPU accelerated · ${api.yoloModel ?? ''} · Whisper ${api.whisperModel ?? ''}`
              : `CPU inference · ${api.yoloModel ?? ''} · Whisper ${api.whisperModel ?? ''}`
          }
        />
      )}

      {/* Active AI modules badge */}
      {snapshot.healthKnown && api.activeModules && api.activeModules.length > 0 && (
        <Pill
          icon={Zap}
          ok
          accent="cyan"
          label={`${api.activeModules.length} modules`}
          detail={`Active: ${api.activeModules.join(' · ')}`}
        />
      )}
    </div>
  );
}
