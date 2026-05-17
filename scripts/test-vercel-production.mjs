#!/usr/bin/env node
/**
 * Smoke test production: Vercel frontend proxy + Heroku API.
 * Usage: node scripts/test-vercel-production.mjs
 */
const VERCEL = (process.env.VERCEL_URL || 'https://detectra-ai.vercel.app').replace(/\/$/, '');
const HEROKU = (
  process.env.VITE_API_URL || 'https://detectra-ai-e00ebf89f84f.herokuapp.com'
).replace(/\/$/, '');

async function get(base, path) {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(60_000),
    headers: path === '/health' ? { Origin: VERCEL } : {},
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text.slice(0, 300);
  }
  return { url, ok: res.ok, status: res.status, json, acao: res.headers.get('access-control-allow-origin') };
}

async function main() {
  let failed = false;
  const fail = (m) => {
    console.error('FAIL:', m);
    failed = true;
  };

  console.log('\n═══ Vercel + Heroku production test ═══\n');

  const vHealth = await get(VERCEL, '/health');
  console.log('Vercel proxy GET /health', vHealth.status, vHealth.ok ? 'OK' : '');
  if (!vHealth.ok || vHealth.json?.status !== 'online') fail('Vercel /health proxy');

  const version = await get(VERCEL, '/version.json');
  console.log('GET /version.json', version.status, version.json?.buildId || version.json);
  if (!version.ok || !version.json?.buildId) fail('version.json missing buildId (deploy cache bust)');

  const hHealth = await get(HEROKU, '/health');
  console.log('Heroku GET /health', hHealth.status, hHealth.ok ? 'OK' : '');
  if (!hHealth.ok) fail('Heroku health');

  const vJobs = await get(VERCEL, '/api/jobs');
  console.log('Vercel proxy GET /api/jobs', vJobs.status, Array.isArray(vJobs.json) ? `${vJobs.json.length} jobs` : vJobs.json);

  const sample = Array.isArray(vJobs.json) ? vJobs.json[0] : null;
  if (sample?.job_id) {
    const st = await get(VERCEL, `/api/jobs/${sample.job_id}`);
    console.log(`  job ${sample.job_id}:`, st.json?.status, `${st.json?.progress ?? '?'}%`, st.json?.stage);
    const res = await get(VERCEL, `/api/jobs/${sample.job_id}/result`);
    console.log('  result endpoint:', res.status, res.status === 200 ? 'OK' : res.json?.detail || res.json);
  }

  console.log(failed ? '\nSome checks failed.\n' : '\nProduction checks passed.\n');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
