#!/usr/bin/env node
/** Smoke-test Heroku API + confirm CORS headers for production frontend. */
const BASE = (
  process.argv[2] ||
  process.env.VITE_API_URL ||
  'https://detectra-ai-e00ebf89f84f.herokuapp.com'
).replace(/\/$/, '');

async function get(path, init = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text.slice(0, 300);
  }
  return { url, ok: res.ok, status: res.status, headers: Object.fromEntries(res.headers), json };
}

async function main() {
  console.log(`API base: ${BASE}\n`);

  const health = await get('/health');
  console.log('GET /health', health.status, health.ok ? 'OK' : 'FAIL');
  if (!health.ok) {
    console.log(health.json);
    process.exit(1);
  }
  console.log('  models_loaded:', health.json.models_loaded);
  console.log('  version:', health.json.version);

  const corsProbe = await get('/health', {
    headers: { Origin: 'https://detectra-ai.vercel.app' },
  });
  const acao = corsProbe.headers['access-control-allow-origin'];
  console.log('\nCORS (Origin: detectra-ai.vercel.app)');
  console.log('  access-control-allow-origin:', acao || '(none — check ALLOWED_ORIGINS on Heroku)');

  const jobs = await get('/api/jobs');
  console.log('\nGET /api/jobs', jobs.status, jobs.ok ? 'OK' : 'FAIL');
  if (Array.isArray(jobs.json)) console.log('  jobs:', jobs.json.length);

  console.log('\nAll checks passed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
