import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown, Search, ArrowRight, Mail, MessageCircle } from 'lucide-react';
import PageHero from '../components/PageHero';

const FAQS = [
  {
    category: 'Getting started',
    items: [
      {
        q: 'What is Detectra AI?',
        a: 'Detectra AI is a multimodal video intelligence platform that automatically analyses surveillance, body-cam, or any video footage using 15+ AI modules — detecting objects, people, actions, speech, audio events, and safety incidents. It produces labelled video, HTML reports, PDF briefs, and structured JSON.',
      },
      {
        q: 'Do I need a GPU to run Detectra AI?',
        a: 'No. The entire pipeline is CPU-optimised using quantised models and efficient inference paths. It runs on any standard server, cloud VM, or developer laptop. A dedicated GPU accelerates processing but is never required.',
      },
      {
        q: 'What video formats are supported?',
        a: 'MP4, AVI, MOV, MKV, and WebM. Files up to 500 MB per upload. Longer recordings can be split into segments before uploading.',
      },
      {
        q: 'How quickly does analysis complete?',
        a: 'On a 4-core CPU server, a 1-minute video takes roughly 4–6 minutes end-to-end (model load + analysis + report generation). A 10-minute video takes 20–30 minutes. Professional and Enterprise plans get priority queue access.',
      },
    ],
  },
  {
    category: 'AI pipeline',
    items: [
      {
        q: 'Which AI models does Detectra use?',
        a: 'YOLOv8s-Seg + ByteTrack for object detection and person tracking; YOLOv8n-Pose for skeleton key-points and action classification; faster-whisper for speech transcription; PANNs CNN14 for audio event detection; Places365 for scene classification; ST-GCN for skeleton action recognition; ViT-B/16 for logo detection; MediaPipe for face intelligence; and a 4-head cross-attention transformer as the fusion engine.',
      },
      {
        q: 'What surveillance events can be automatically detected?',
        a: 'Falls, fights, loitering, crowd surges, stampedes, fire/smoke (HSV), tailgating, intrusions, weapon proximity, abandoned objects, person vanishing, and more — 28+ event types in total with per-event severity scoring.',
      },
      {
        q: 'How does the cross-modal fusion work?',
        a: 'A 4-head cross-attention transformer fuses visual, audio, speech, and pose feature vectors across 10-second windows. It produces a per-window anomaly score (0–1) and flags windows that exceed risk thresholds, providing a unified risk timeline across all modalities.',
      },
      {
        q: 'How accurate is the speech transcription?',
        a: 'Detectra uses OpenAI Whisper (faster-whisper, medium model) which achieves <5% WER on clear speech in 50+ languages. A multilingual chunking pass improves language detection in mixed-language recordings. Hallucination filters suppress common Whisper artefacts.',
      },
    ],
  },
  {
    category: 'Privacy & security',
    items: [
      {
        q: 'Are my videos private?',
        a: 'Yes. Videos are processed on your own server instance and never shared with third parties. The AI Q&A feature sends only the text analysis report (not video frames) to a language model. Self-hosted deployments keep all data on your own infrastructure.',
      },
      {
        q: 'Can I self-host Detectra AI?',
        a: 'Yes. The full backend is open-source (FastAPI + Python) and runs with Docker. The frontend is React + Vite and can be hosted on Vercel, Netlify, or any static host. Enterprise customers receive assisted deployment and private cloud configuration.',
      },
      {
        q: 'Is the analysis result suitable for legal evidence?',
        a: 'Detectra generates timestamped, structured reports with per-event confidence scores. The labelled video with overlay annotations and the HTML/PDF report can be presented as supplementary digital evidence. We recommend consulting a legal professional for jurisdiction-specific requirements.',
      },
    ],
  },
  {
    category: 'Exports & integrations',
    items: [
      {
        q: 'What export formats are available?',
        a: 'Every completed job produces: a labelled MP4 with bounding-box overlays, an HTML intelligence report, a PDF brief, a CSV of all events, a Word document narrative, a movement heatmap PNG, and a RAG-ready JSON that can feed directly into AI pipelines or SIEMs.',
      },
      {
        q: 'How does the AI Q&A (RAG) feature work?',
        a: 'After analysis, the full intelligence report (events, persons, speech, audio, risk score) is indexed as context. You can ask natural-language questions — "Were there any falls in the first 30 seconds?", "Who was near the exit?" — and get answers grounded in actual video data via a Mistral-7B or Gemini 1.5 Flash LLM.',
      },
      {
        q: 'Is there a REST API?',
        a: 'Yes. Every feature is accessible via the documented REST API at /api/docs. Submit videos, poll job status, retrieve results, download exports, and stream real-time progress via WebSocket. API keys are available on Professional and Enterprise plans.',
      },
    ],
  },
  {
    category: 'Billing & plans',
    items: [
      {
        q: 'Is there a free tier?',
        a: 'Yes. The Free plan allows 3 videos per month (up to 5 minutes each) with full object detection, audio classification, and basic risk reporting — no credit card required.',
      },
      {
        q: 'Can I cancel my subscription at any time?',
        a: 'Yes. Monthly subscriptions can be cancelled any time; you retain access until the end of the billing period. Annual subscriptions include a 14-day refund window from the date of purchase.',
      },
      {
        q: 'Do you offer discounts for academic or NGO use?',
        a: 'Yes. University departments, independent researchers, and registered non-profits can apply for a 50% discount on Professional plans. Contact us at the email below with your institution details.',
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const rm = useReducedMotion();

  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden group hover:border-white/15 transition-colors">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="text-sm font-semibold text-gray-200 leading-snug pr-4">{q}</span>
        <span className={`mt-0.5 shrink-0 rounded-lg border p-1 transition-all ${open ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' : 'border-white/10 bg-white/5 text-gray-500'}`}>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={rm ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-4">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [search, setSearch] = useState('');
  const rm = useReducedMotion();

  const filtered = FAQS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        !search ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-transparent">
      <PageHero
        badge="FAQ"
        title="Frequently asked questions"
        description="Everything you need to know about Detectra AI — from model specs to billing."
      />

      <section className="section-y">
        <div className="page-shell max-w-3xl mx-auto">
          {/* Search */}
          <motion.div
            initial={rm ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative mb-10"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions…"
              aria-label="Search FAQ"
              className="w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 focus:bg-white/8 transition min-h-[52px]"
            />
          </motion.div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No results for "{search}"</p>
              <button onClick={() => setSearch('')} className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              {filtered.map((cat) => (
                <div key={cat.category}>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400/70 mb-4 px-1">
                    {cat.category}
                  </h2>
                  <div className="space-y-2">
                    {cat.items.map((item) => (
                      <FAQItem key={item.q} {...item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Still have questions */}
          <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.03] p-7 sm:p-9 text-center">
            <Mail className="h-10 w-10 text-cyan-400 mx-auto mb-3" aria-hidden />
            <h3 className="text-white font-bold text-base sm:text-lg mb-2">Still have questions?</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
              Our team usually replies within 24 hours. You can also browse the live demo before reaching out.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition min-h-[48px]"
              >
                Contact us <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition min-h-[48px]"
              >
                View live demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
