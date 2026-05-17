import fs from 'fs';

const p = 'src/pages/Dashboard.tsx';
let s = fs.readFileSync(p, 'utf8');
const divClose = '</' + 'div' + '>';

const insightsStart = s.indexOf('              {alertsFeed.length > 0 && (');
const insightsEnd = s.indexOf('          <JobLibraryPanel');
if (insightsStart >= 0 && insightsEnd > insightsStart) {
  const block = [
    '              {alertsFeed.length > 0 && (',
    '                <AnalyzerSection title="Live insights" icon={Bell}>',
    '                  <div className="max-h-48 space-y-2 overflow-y-auto analyzer-scroll">',
    '                    {alertsFeed.map((e) => (',
    '                      <div',
    '                        key={e.id}',
    '                        className={`analyzer-insight-card ${e.isCrit ? \'analyzer-insight-card--critical\' : \'analyzer-insight-card--warn\'}`}',
    '                      >',
    '                        <div className="mb-1 flex items-center justify-between gap-2">',
    '                          <span className={`text-[10px] font-bold uppercase ${e.isCrit ? \'text-rose-400\' : \'text-amber-400\'}`}>',
    '                            {e.event_type.replace(/_/g, \' \')}',
    '                          </span>',
    '                          <span className="analyzer-mono text-[10px] text-gray-600">{e.timestamp}</span>',
    '                        ' + divClose,
    '                        <p className="text-xs leading-relaxed text-gray-300">{e.description}</p>',
    '                      ' + divClose,
    '                    ))}',
    '                  ' + divClose,
    '                </AnalyzerSection>',
    '              )}',
    '            ' + divClose,
    '          </section>',
    '          ' + divClose,
  ].join('\n');
  s = s.slice(0, insightsStart) + block + '\n\n          ' + s.slice(insightsEnd);
}

s = s.replace(/(>\s*Upload video\s*<\/button>\s*)<\/motion\.div>/, `$1${divClose}`);

s = s.replace(/â€"/g, '-');
s = s.replace(/â€¦/g, '...');
s = s.replace(/Â \|/g, ' | ');
s = s.replace(/MKV Â \|  max/g, 'MKV · max');
s = s.replace("value={r ? 'Ready' : 'â€”'}", "value={r ? 'Ready' : '-'}");
s = s.replace('jobs={jobs}', 'jobs={displayJobs}');
s = s.replace(/Uploadingâ€¦/g, 'Uploading...');
s = s.replace(/processor â€” is/g, 'processor - is');

fs.writeFileSync(p, s);
console.log('patched');
