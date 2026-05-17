import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  ShieldCheck,
  Lock,
  Zap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { HeroBackground, HeroButtonPrimary, HeroButtonSecondary } from '../PageHero';

/* ── Command hero ─────────────────────────────────────────────────────────── */

export function AnalyzerCommandHero({
  onUpload,
  onRefresh,
  apiOnline,
  jobsCount,
  modelsReady,
  backendStatus,
  version,
  accountLinked,
  cloudSync,
}: {
  onUpload: () => void;
  onRefresh: () => void;
  apiOnline: boolean;
  jobsCount: number;
  modelsReady: boolean;
  backendStatus?: string;
  version?: string;
  accountLinked?: boolean;
  cloudSync?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="analyzer-hero relative overflow-hidden rounded-3xl border border-white/[0.08]">
      <HeroBackground />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-[100px] sm:h-96 sm:w-96"
        animate={reduceMotion ? undefined : { opacity: [0.35, 0.55, 0.35], scale: [1, 1.06, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div className="relative z-10 grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_min(340px,38%)] lg:items-center lg:gap-10">
        <div className="max-w-xl">
          <span className="analyzer-badge mb-4 inline-flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${apiOnline ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-red-400'}`}
              aria-hidden
            />
            Secure analysis workspace
          </span>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.35rem] lg:leading-[1.12]">
            Intelligence{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-400 bg-clip-text text-transparent">
              Command Center
            </span>
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-gray-400 sm:text-base">
            Upload footage once. Detectra runs vision, audio, and fusion on a single timeline — then
            delivers labeled video, scored alerts, and export-ready reports you can trust in briefings.
          </p>

          <motion.div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <HeroButtonPrimary onClick={onUpload} className="min-h-[48px] shadow-lg shadow-cyan-500/15">
              Upload & analyze
            </HeroButtonPrimary>
            <HeroButtonSecondary onClick={onRefresh} className="min-h-[48px]">
              Sync jobs
            </HeroButtonSecondary>
          </motion.div>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-500/80" aria-hidden />
              Enterprise-grade pipeline
            </li>
            <li className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-cyan-500/80" aria-hidden />
              Private by default
            </li>
            <li className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-cyan-500/80" aria-hidden />
              Real-time progress
            </li>
          </ul>
        </div>

        <div className="analyzer-hero-visual relative mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">
          <div className="analyzer-orb-ring absolute inset-0 m-auto h-48 w-48 sm:h-56 sm:w-56" aria-hidden />
          <motion.div
            className="analyzer-hero-panel relative mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
              System snapshot
            </p>
            <div className="mt-4 space-y-3">
              <HeroMetricRow
                label="Analysis engine"
                value={apiOnline ? 'Operational' : 'Offline'}
                tone={apiOnline ? 'success' : 'danger'}
              />
              <HeroMetricRow label="Saved analyses" value={String(jobsCount)} tone="cyan" />
              <HeroMetricRow
                label="AI models"
                value={modelsReady ? 'Loaded & ready' : 'Warming up...'}
                tone={modelsReady ? 'cyan' : 'warn'}
              />
              {backendStatus ? (
                <HeroMetricRow label="Backend" value={backendStatus} tone="cyan" />
              ) : null}
              {version ? <HeroMetricRow label="API version" value={version} tone="cyan" /> : null}
              <HeroMetricRow
                label="Your account"
                value={accountLinked ? 'Linked · private history' : 'Guest session'}
                tone={accountLinked ? 'success' : 'warn'}
              />
              <HeroMetricRow
                label="Cloud sync"
                value={cloudSync ? 'API ↔ Supabase' : 'Client-only saves'}
                tone={cloudSync ? 'success' : 'warn'}
              />
            </div>
            <motion.div
              className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"
              aria-hidden
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                animate={reduceMotion ? undefined : { width: ['28%', '72%', '48%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: '55%' }}
              />
            </motion.div>
            <p className="mt-2 text-[10px] text-gray-500">Multimodal fusion active</p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

function HeroMetricRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'danger' | 'cyan' | 'warn';
}) {
  const valueClass =
    tone === 'success'
      ? 'text-emerald-300'
      : tone === 'danger'
        ? 'text-red-300'
        : tone === 'warn'
          ? 'text-amber-300'
          : 'text-cyan-300';

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-semibold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

/* ── Status rail ──────────────────────────────────────────────────────────── */

export function AnalyzerStatusRail({
  apiOnline,
  backendStatus,
  version,
  onRefresh,
}: {
  apiOnline: boolean;
  backendStatus: string;
  version?: string;
  onRefresh: () => void;
}) {
  return (
    <div className="analyzer-status-rail flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <span
          className={`analyzer-status-pill ${apiOnline ? 'analyzer-status-pill--ok' : 'analyzer-status-pill--err'}`}
        >
          <span className="analyzer-status-dot" aria-hidden />
          {apiOnline ? 'Engine online' : 'Engine offline'}
        </span>
        <span className="hidden h-4 w-px bg-white/10 sm:block" aria-hidden />
        <span className="text-sm text-gray-400">{backendStatus}</span>
        {version && (
          <span className="analyzer-mono rounded-md border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] text-gray-500">
            {version}
          </span>
        )}
      </div>
      <button type="button" onClick={onRefresh} className="analyzer-btn-ghost min-h-[40px] gap-2 px-3 text-sm">
        <span className="sr-only">Refresh</span>
        Refresh
      </button>
    </div>
  );
}

/* ── KPI tile ─────────────────────────────────────────────────────────────── */

export function AnalyzerKpi({
  icon: Icon,
  label,
  value,
  valueClassName = 'text-white',
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  valueClassName?: string;
  hint?: string;
}) {
  return (
    <div className="analyzer-kpi group">
      <motion.div className="analyzer-kpi-icon" aria-hidden>
        <Icon className="h-5 w-5 text-cyan-400/90" />
      </motion.div>
      <p className={`analyzer-kpi-value ${valueClassName}`}>{value}</p>
      <p className="analyzer-kpi-label">{label}</p>
      {hint && <p className="mt-1 text-[10px] text-gray-600">{hint}</p>}
    </div>
  );
}

/* ── Section chrome ───────────────────────────────────────────────────────── */

export function AnalyzerSection({
  title,
  icon: Icon,
  children,
  action,
  className = '',
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`analyzer-vault ${className}`}>
      <header className="analyzer-vault-header">
        <h2 className="analyzer-vault-title">
          {Icon && <Icon className="h-4 w-4 text-cyan-400" aria-hidden />}
          {title}
        </h2>
        {action}
      </header>
      <div className="analyzer-vault-body">{children}</div>
    </section>
  );
}

/* ── Filter pills ─────────────────────────────────────────────────────────── */

export const JOB_FILTERS = [
  { id: 'all' as const, label: 'All' },
  { id: 'completed' as const, label: 'Done' },
  { id: 'running' as const, label: 'Running' },
  { id: 'pending' as const, label: 'Queued' },
  { id: 'failed' as const, label: 'Failed' },
] as const;

export type JobFilterId = (typeof JOB_FILTERS)[number]['id'];

export function JobFilterPills({
  value,
  onChange,
}: {
  value: JobFilterId;
  onChange: (v: JobFilterId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter jobs">
      {JOB_FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          role="tab"
          aria-selected={value === f.id}
          onClick={() => onChange(f.id)}
          className={`analyzer-filter-pill ${value === f.id ? 'analyzer-filter-pill--active' : ''}`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

/* ── Collapsible advanced ─────────────────────────────────────────────────── */

export function AnalyzerCollapsible({
  title,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="analyzer-vault analyzer-vault--subtle">
      <button
        type="button"
        onClick={onToggle}
        className="analyzer-vault-header w-full text-left"
        aria-expanded={open}
      >
        <span className="analyzer-vault-title">
          {Icon && <Icon className="h-4 w-4 text-gray-500" aria-hidden />}
          {title}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {open && <div className="analyzer-vault-body border-t border-white/[0.06] pt-4">{children}</div>}
    </div>
  );
}

/* ── Trust panel ──────────────────────────────────────────────────────────── */

export function AnalyzerTrustPanel() {
  const items = [
    { title: 'Explainable AI', desc: 'Every alert links to timestamped evidence.' },
    { title: 'Audit-ready exports', desc: 'HTML reports, JSON, and labeled video.' },
    { title: 'Fusion scoring', desc: 'Vision + audio combined for fewer false positives.' },
  ];

  return (
    <aside className="analyzer-vault analyzer-trust h-full">
      <header className="analyzer-vault-header">
        <h2 className="analyzer-vault-title">
          <ShieldCheck className="h-4 w-4 text-emerald-400/90" aria-hidden />
          Why teams trust Detectra
        </h2>
      </header>
      <ul className="analyzer-vault-body space-y-4">
        {items.map((item) => (
          <li key={item.title} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-gray-200">{item.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ── Empty workspace ────────────────────────────────────────────────────────── */

export function AnalyzerWorkspaceEmpty({ onUpload, onViewCompleted }: { onUpload: () => void; onViewCompleted: () => void }) {
  const steps = [
    { n: '01', title: 'Upload footage', desc: 'Drag MP4, MOV, or MKV — up to 500 MB.' },
    { n: '02', title: 'AI analyzes', desc: 'Track progress live across every pipeline stage.' },
    { n: '03', title: 'Review & export', desc: 'Open results for charts, ledger, and downloads.' },
  ];

  return (
    <div className="analyzer-empty-workspace">
      <div className="analyzer-empty-glow" aria-hidden />
      <div className="relative z-10">
        <p className="elite-label mb-2">Your analysis canvas</p>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Ready when you are
        </h2>
        <p className="mt-2 max-w-lg text-sm text-gray-400">
          Select a job from the library or upload new footage. Metrics, charts, and the security
          ledger appear here instantly.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onUpload} className="analyzer-btn-primary min-h-[48px] px-6">
            Start new analysis
          </button>
          <button type="button" onClick={onViewCompleted} className="analyzer-btn-ghost min-h-[48px] px-5">
            Browse completed
          </button>
        </div>
        <ol className="mt-10 grid gap-3 sm:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="analyzer-step-card">
              <span className="analyzer-step-num">{s.n}</span>
              <p className="mt-3 text-sm font-semibold text-white">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
