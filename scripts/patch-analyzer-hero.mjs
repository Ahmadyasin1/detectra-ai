import fs from 'fs';

const p = 'src/components/dashboard/AnalyzerUI.tsx';
const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
const insert = [
  '              {backendStatus ? (',
  '                <HeroMetricRow label="Backend" value={backendStatus} tone="cyan" />',
  '              ) : null}',
  '              {version ? <HeroMetricRow label="API version" value={version} tone="cyan" /> : null}',
];
const idx = lines.findIndex((l) => l.includes('tone={modelsReady'));
const closeIdx = lines.findIndex((l, i) => i > idx && l.trim() === '/>');
const divClose = lines.findIndex((l, i) => i > closeIdx && /^\s*<\/div>\s*$/.test(l));
lines.splice(divClose, 0, ...insert);
fs.writeFileSync(p, lines.join('\n'));
console.log('ok');
