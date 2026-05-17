import { checkHealth, type ApiHealth } from './detectraApi';
import { isSupabaseConfigured } from './supabase';

export type IntegrationSnapshot = {
  /** False until the first health request finishes (success or failure). */
  healthKnown: boolean;
  api: {
    online: boolean;
    version?: string;
    modelsLoaded: boolean;
    serverSupabaseSync: boolean;
    onHeroku?: boolean;
  };
  auth: {
    configured: boolean;
    signedIn: boolean;
    userId?: string;
  };
  storage: {
    configured: boolean;
    bucket: string;
  };
  /** All required pieces for signed-in full stack (API + auth + storage). */
  fullyIntegrated: boolean;
  /** API reachable and models ready — uploads can run. */
  canAnalyze: boolean;
};

const STORAGE_BUCKET =
  (import.meta.env.VITE_SUPABASE_STORAGE_BUCKET as string | undefined) || 'videos';

export function buildIntegrationSnapshot(
  health: ApiHealth | null,
  options: { userId?: string | null; apiOnline: boolean; healthKnown?: boolean },
): IntegrationSnapshot {
  const authConfigured = isSupabaseConfigured;
  const signedIn = Boolean(options.userId);
  const healthKnown = options.healthKnown ?? health !== null;
  const apiOnline = options.apiOnline;
  const modelsLoaded = Boolean(health?.models_loaded);
  const serverSupabaseSync = healthKnown && Boolean(health?.supabase_configured);

  return {
    healthKnown,
    api: {
      online: apiOnline,
      version: health?.version,
      modelsLoaded,
      serverSupabaseSync,
      onHeroku: health?.on_heroku,
    },
    auth: {
      configured: authConfigured,
      signedIn,
      userId: options.userId ?? undefined,
    },
    storage: {
      configured: authConfigured,
      bucket: STORAGE_BUCKET,
    },
    canAnalyze: apiOnline && modelsLoaded,
    fullyIntegrated: apiOnline && authConfigured && signedIn && serverSupabaseSync,
  };
}

export async function probePlatformHealth(): Promise<{
  health: ApiHealth | null;
  apiOnline: boolean;
}> {
  try {
    const health = await checkHealth();
    return { health, apiOnline: health.status === 'online' };
  } catch {
    return { health: null, apiOnline: false };
  }
}
