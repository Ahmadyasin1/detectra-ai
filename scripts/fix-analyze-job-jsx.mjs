import fs from 'fs';

const p = 'src/pages/AnalyzeJob.tsx';
let s = fs.readFileSync(p, 'utf8');
const divClose = '</' + 'motion.div>'.replace('motion.', '');

const replacements = [
  [
    '                  <p className="text-gray-500 text-sm">{currentStage.sub}</p>\n                )}\n              </motion.div>\n\n              <div className="flex flex-wrap justify-center gap-3 mt-6">',
    '                  <p className="text-gray-500 text-sm">{currentStage.sub}</p>\n                )}\n              </div>\n\n              <motion.div className="flex flex-wrap justify-center gap-3 mt-6">',
  ],
  [
    '                )}\n              </motion.div>\n\n              {isRunning && progress >= 85',
    '                )}\n              </div>\n\n              {isRunning && progress >= 85',
  ],
  [
    '                <motion.div className="min-w-0">',
    '                <div className="min-w-0">',
  ],
  [
    '                  <p className="text-gray-500 text-xs mt-1 font-mono truncate">{displayJob.job_id}</p>\n                </motion.div>',
    '                  <p className="text-gray-500 text-xs mt-1 font-mono truncate">{displayJob.job_id}</p>\n                </div>',
  ],
  [
    '                  </Link>\n                </motion.div>\n              )}\n            </motion.div>',
    '                  </Link>\n                </div>\n              )}\n            </motion.div>',
  ],
  [
    '              <motion.div className="flex flex-wrap justify-center gap-3 mt-6">',
    '              <div className="flex flex-wrap justify-center gap-3 mt-6">',
  ],
  [
    '              </motion.div>\n\n              {isRunning && progress >= 85',
    '              </div>\n\n              {isRunning && progress >= 85',
  ],
];

for (const [a, b] of replacements) {
  if (s.includes(a)) s = s.replace(a, b);
}

s = s.replace(
  'className="bg-transparent rounded-2xl border border-white/10 p-4"',
  'className="elite-card p-4 sm:p-5"',
);
s = s.replace(
  `<p className="text-gray-600 text-xs font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="status-dot-active" />
                  Activity Log
                </p>`,
  `<p className="elite-label mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" aria-hidden />
                  Activity log
                </p>`,
);
s = s.replace('max-h-32', 'max-h-36 analyzer-scroll');
s = s.replace(
  '<p key={i} className="text-gray-500 text-xs font-mono leading-relaxed">',
  '<p key={`${entry.time}-${entry.msg}-${i}`} className="text-gray-500 text-xs leading-relaxed">',
);
s = s.replace('<span className="capitalize">{entry.msg}</span>', '{entry.msg}');

fs.writeFileSync(p, s);
console.log('patched');
