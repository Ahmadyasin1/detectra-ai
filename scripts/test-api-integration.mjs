#!/usr/bin/env node
/**
 * Integration smoke test for Detectra API (local or Heroku).
 * Usage: node scripts/test-api-integration.mjs [baseUrl]
 */
const BASE = (
  process.argv[2] ||
  process.env.VITE_API_URL ||
  'https://detectra-ai-e00ebf89f84f.herokuapp.com'
).replace(/\/$/, '');

const FRONTEND_ORIGIN = process.env.TEST_ORIGIN || 'https://detectra-ai.vercel.app';

async function request(path, init = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(90_000) });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text.slice(0, 400);
  }
  return { url, ok: res.ok, status: res.status, headers: res.headers, json };
}

function header(res, name) {
  return res.headers.get(name) || res.headers.get(name.toLowerCase());
}

async function main() {
  let failed = false;
  const fail = (msg) => {
    console.error('FAIL:', msg);
    failed = true;
  };

  console.log(`\n═══ Detectra API integration test ═══`);
  console.log(`Base: ${BASE}\n`);

  const health = await request('/health');
  console.log('GET /health', health.status, health.ok ? 'OK' : '');
  if (!health.ok) {
    fail(health.json);
  } else {
    console.log('  status:', health.json.status);
    console.log('  models_loaded:', health.json.models_loaded);
    console.log('  version:', health.json.version);
    if (health.json.models) {
      console.log('  yolo_seg:', health.json.models.yolo_seg);
      console.log('  yolo_pose:', health.json.models.yolo_pose);
    }
  }

  const healthCors = await request('/health', {
    headers: { Origin: FRONTEND_ORIGIN },
  });
  const acao = header(healthCors, 'access-control-allow-origin');
  console.log('\nCORS GET /health (Origin:', FRONTEND_ORIGIN + ')');
  console.log('  access-control-allow-origin:', acao || '(none)');
  if (!healthCors.ok) fail('health with Origin header');

  const jobs = await request('/api/jobs');
  console.log('\nGET /api/jobs', jobs.status, jobs.ok ? 'OK' : '');
  if (!jobs.ok) {
    fail(jobs.json);
  } else if (Array.isArray(jobs.json)) {
    console.log('  job count:', jobs.json.length);
    if (jobs.json[0]) {
      const sample = jobs.json[0];
      console.log('  sample job:', sample.job_id, sample.status, `${sample.progress}%`);
    }
  }

  const myJobs = await request('/api/my-jobs', {
    headers: { Authorization: 'Bearer invalid-test' },
  });
  console.log('\nGET /api/my-jobs (invalid token)', myJobs.status, myJobs.ok ? 'OK' : '');
  if (myJobs.status !== 200 && myJobs.status !== 401) {
    fail(`unexpected status ${myJobs.status}`);
  }

  const openapi = await request('/api/openapi.json');
  console.log('\nGET /api/openapi.json', openapi.status, openapi.ok ? 'OK' : '');
  if (!openapi.ok) {
    fail('OpenAPI schema missing');
  } else if (openapi.json?.paths) {
    const paths = Object.keys(openapi.json.paths);
    const required = ['/api/analyze', '/api/jobs/{job_id}', '/health'];
    for (const p of required) {
      const found = paths.some((k) => k === p || k.startsWith(p.replace('{job_id}', '')));
      console.log('  route', p, found ? '✓' : '✗');
      if (!found && p !== '/health') fail(`missing route ${p}`);
    }
  }

  const stats = await request('/api/stats');
  console.log('\nGET /api/stats', stats.status, stats.ok ? 'OK' : '(optional)');

  console.log(failed ? '\nSome checks failed.\n' : '\nAll checks passed.\n');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
