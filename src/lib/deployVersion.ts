const STORAGE_KEY = 'detectra_deploy_build_id';

const embeddedBuildId = (import.meta.env.VITE_APP_BUILD_ID as string | undefined)?.trim() || '';

export type DeployMeta = { buildId: string; builtAt?: string };

export async function fetchDeployMeta(): Promise<DeployMeta | null> {
  try {
    const res = await fetch(`/version.json?cb=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as DeployMeta;
    return data?.buildId ? data : null;
  } catch {
    return null;
  }
}

export async function purgeClientCaches(): Promise<void> {
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }
}

/** Drop stale bundles/SW from prior deployments; reload once when server build id changed. */
export async function ensureLatestDeploy(): Promise<void> {
  const remote = await fetchDeployMeta();
  if (!remote?.buildId) return;

  const stored = localStorage.getItem(STORAGE_KEY);
  const staleBundle = Boolean(embeddedBuildId && embeddedBuildId !== remote.buildId);
  const staleStorage = Boolean(stored && stored !== remote.buildId);

  if (!staleBundle && !staleStorage) {
    localStorage.setItem(STORAGE_KEY, remote.buildId);
    return;
  }

  if (sessionStorage.getItem('detectra_deploy_reload') === remote.buildId) {
    localStorage.setItem(STORAGE_KEY, remote.buildId);
    return;
  }

  sessionStorage.setItem('detectra_deploy_reload', remote.buildId);
  await purgeClientCaches();
  localStorage.setItem(STORAGE_KEY, remote.buildId);
  const url = new URL(window.location.href);
  url.searchParams.set('_deploy', remote.buildId);
  window.location.replace(url.toString());
}

export function registerDeployWatcher(): () => void {
  let busy = false;

  const check = async () => {
    if (busy || document.visibilityState === 'hidden') return;
    busy = true;
    try {
      const remote = await fetchDeployMeta();
      if (!remote?.buildId) return;
      const stored = localStorage.getItem(STORAGE_KEY);
      const stale =
        (embeddedBuildId && embeddedBuildId !== remote.buildId) ||
        (stored && stored !== remote.buildId);
      if (stale) await ensureLatestDeploy();
    } finally {
      busy = false;
    }
  };

  const onVisible = () => {
    if (document.visibilityState === 'visible') void check();
  };

  window.addEventListener('focus', check);
  document.addEventListener('visibilitychange', onVisible);
  const interval = window.setInterval(check, 5 * 60_000);

  return () => {
    window.removeEventListener('focus', check);
    document.removeEventListener('visibilitychange', onVisible);
    clearInterval(interval);
  };
}

export async function registerDeployServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register(`/sw.js?build=${embeddedBuildId || 'dev'}`, {
      scope: '/',
      updateViaCache: 'none',
    });
    const reg = await navigator.serviceWorker.ready;
    await reg.update();
  } catch {
    /* optional */
  }
}
