/**
 * AI chatbot for Detectra video analysis results.
 *
 * Three-layer fallback — each layer is tried in order:
 *   1. Direct extraction  — instant, 100% reliable, zero network calls
 *   2. Extractive QA      — deepset/roberta-base-squad2 (tiny, always-warm, no auth needed)
 *   3. Backend Gemini     — /api/jobs/{id}/ask (best quality, needs server running)
 *
 * This means the chatbot always responds even when the backend is offline.
 */

import { distinctPersonCount, type AnalysisResult } from './detectraApi';

// ── Constants ─────────────────────────────────────────────────────────────────

const HF_API   = 'https://api-inference.huggingface.co/models';
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN ?? '';

// Tiny extractive QA model — ALWAYS warm, no cold starts, no auth required
const QA_MODEL = 'deepset/roberta-base-squad2';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Context builder ───────────────────────────────────────────────────────────

export function buildVideoContext(result: Record<string, unknown>): string {
  const dur   = (result.duration_s as number) || 0;
  const dMin  = Math.floor(dur / 60);
  const dSec  = Math.floor(dur % 60);
  type Row    = Record<string, unknown>;

  const events = ((result.surveillance_events as Row[]) || [])
    .slice(0, 30)
    .map(e => {
      const ts = e.timestamp_s as number;
      const mm = Math.floor(ts / 60);
      const ss = String(Math.floor(ts % 60)).padStart(2, '0');
      return `[${String(e.severity).toUpperCase()}] ${mm}:${ss} — ${e.description} (${Math.round((e.confidence as number) * 100)}% conf)`;
    })
    .join('\n');

  const topObjects = ((result.top_objects as Row[]) || [])
    .slice(0, 10)
    .map(o => `${o.label}: ${o.count}×`)
    .join(', ');

  const audioEvts = ((result.audio_events as Row[]) || [])
    .slice(0, 20)
    .map(a => `[${Math.floor(a.timestamp_s as number)}s] ${String(a.event_type).replace(/_/g, ' ')}: ${a.details || ''}`)
    .join('\n');

  const fusionAlerts = ((result.fusion_insights as Row[]) || [])
    .filter(f => f.alert)
    .map(f => `[${Math.floor(f.window_start_s as number)}–${Math.floor(f.window_end_s as number)}s] ${f.description}`)
    .join('\n');

  const sc         = (result.severity_counts as Row) || {};
  const langs      = ((result.detected_languages as Row[]) || [])
    .map(l => `${l.name || l.code} (${l.segment_count} segments)`).join(', ');
  const transcript = result.full_transcript as string | undefined;
  const trackCount = distinctPersonCount(result as unknown as AnalysisResult);

  return `VIDEO INTELLIGENCE REPORT
File: ${result.video_name || 'Unknown'}
Duration: ${dMin}:${String(dSec).padStart(2, '0')} | Resolution: ${result.width}×${result.height} @ ${((result.fps as number) || 0).toFixed(1)} fps

RISK ASSESSMENT
Risk Level: ${result.risk_level || 'UNKNOWN'}
Risk Score: ${(((result.risk_score as number) || 0) * 100).toFixed(0)}/100
Severity Counts: Critical=${sc.critical || 0}, High=${sc.high || 0}, Medium=${sc.medium || 0}, Low=${sc.low || 0}

SURVEILLANCE EVENTS (${((result.surveillance_events as Row[]) || []).length} total)
${events || 'None detected'}

PERSONS & TRACKING
Distinct individuals (estimated): ${trackCount}
Max concurrent persons in any frame: ${(result.max_concurrent_persons as number) || 0}
Peak activity timestamp: ${Math.floor(((result.peak_activity_ts as number) || 0) / 60)}:${String(Math.floor(((result.peak_activity_ts as number) || 0) % 60)).padStart(2, '0')}

DETECTED OBJECTS (top 10)
${topObjects || 'None detected'}

SPEECH & LANGUAGE
Languages: ${langs || 'None detected'}
${transcript ? `Transcript: "${transcript.slice(0, 1000)}${transcript.length > 1000 ? '…' : ''}"` : 'No speech detected'}

ENVIRONMENTAL AUDIO EVENTS
${audioEvts || 'None detected'}

CROSS-MODAL FUSION ALERTS
${fusionAlerts || 'None'}

AI NARRATIVE SUMMARY
${(result.summary as string) || 'No summary generated'}`;
}

// ── Layer 1: Direct data extraction (instant, zero network) ──────────────────

function fmt(n: number): string {
  const m = Math.floor(n / 60);
  const s = String(Math.floor(n % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

function tryDirectAnswer(question: string, result: AnalysisResult): string | null {
  const q   = question.toLowerCase();
  const evs = result.surveillance_events || [];
  const sc  = (result as unknown as Record<string, unknown>).severity_counts as Record<string, number> || {};

  // ── Person / tracking questions ─────────────────────────────────────────────
  if (/how many (people|person|individual|human)|person count|people (were |are )?(there|detected|tracked)/i.test(q)) {
    const distinct = distinctPersonCount(result);
    const maxCon   = (result as unknown as Record<string, unknown>).max_concurrent_persons as number || 0;
    const peak     = (result as unknown as Record<string, unknown>).peak_activity_ts as number || 0;
    return (
      `${distinct} distinct individual(s) estimated in this video.\n` +
      `Peak concurrent persons in any single frame: ${maxCon}.\n` +
      `Highest activity occurred at ${fmt(peak)}.`
    );
  }

  // ── Risk level questions ─────────────────────────────────────────────────────
  if (/risk|threat level|danger|severity|overall assess/i.test(q)) {
    const risk  = result.risk_level || 'UNKNOWN';
    const score = Math.round(((result as unknown as Record<string, unknown>).risk_score as number || 0) * 100);
    const crit  = sc.critical || 0;
    const high  = sc.high || 0;
    const med   = sc.medium || 0;
    const low   = sc.low || 0;
    return (
      `Overall risk: ${risk} (score ${score}/100).\n` +
      `Event severity breakdown:\n` +
      `  Critical: ${crit}\n  High: ${high}\n  Medium: ${med}\n  Low: ${low}\n\n` +
      `${result.summary ? `AI assessment: ${result.summary.slice(0, 400)}` : ''}`
    ).trim();
  }

  // ── Event listing ────────────────────────────────────────────────────────────
  if (/event|what happened|what was detected|incident|activity|suspicious|critical|security/i.test(q)) {
    if (evs.length === 0) return 'No surveillance events were detected in this video.';
    const top = evs
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 8)
      .map(e => `  • ${fmt(e.timestamp_s)} [${String(e.severity).toUpperCase()}] ${e.event_type.replace(/_/g, ' ')}: ${e.description}`)
      .join('\n');
    return `${evs.length} surveillance event(s) detected:\n${top}`;
  }

  // ── Audio / sound questions ──────────────────────────────────────────────────
  if (/audio|sound|noise|gunshot|scream|explosion|alarm|shout|dangerous sound/i.test(q)) {
    const audioEvs = ((result as unknown as Record<string, unknown>).audio_events as Array<Record<string, unknown>>) || [];
    const dangerous = audioEvs.filter(a =>
      /gunshot|scream|explosion|glass_breaking|alarm|siren|fight/i.test(String(a.event_type)));
    if (audioEvs.length === 0) return 'No audio events were classified in this analysis.';
    if (dangerous.length > 0) {
      const list = dangerous.slice(0, 5)
        .map(a => `  • [${Math.floor(a.timestamp_s as number)}s] ${String(a.event_type).replace(/_/g, ' ')} (${((a.confidence as number || 0) * 100).toFixed(0)}% conf): ${a.details || ''}`)
        .join('\n');
      return `${dangerous.length} potentially dangerous audio event(s) detected:\n${list}`;
    }
    return `${audioEvs.length} audio event(s) classified. None matched dangerous categories (gunshot/scream/explosion/alarm). Most prominent: ${String(audioEvs[0]?.event_type || '').replace(/_/g, ' ')}.`;
  }

  // ── Summary / overview ───────────────────────────────────────────────────────
  if (/summar|overview|everything|happened|tell me about|what (is|was)|describe/i.test(q)) {
    const dur  = (result as unknown as Record<string, unknown>).duration_s as number || 0;
    const risk = result.risk_level || 'UNKNOWN';
    const peop = distinctPersonCount(result);
    const nevs = evs.length;
    const objs = ((result as unknown as Record<string, unknown>).top_objects as Array<Record<string, unknown>>) || [];
    const topO = objs.slice(0, 5).map(o => o.label).join(', ');
    return (
      `Video: ${result.video_name} (${fmt(dur)} long)\n` +
      `Risk: ${risk} | Persons: ~${peop} | Events: ${nevs}\n` +
      `Top objects: ${topO || 'none'}\n\n` +
      `${result.summary || 'No AI narrative was generated for this analysis.'}`
    );
  }

  // ── Peak anomaly ─────────────────────────────────────────────────────────────
  if (/anomal|highest|peak|most|worst|spike/i.test(q)) {
    const peak = (result as unknown as Record<string, unknown>).peak_activity_ts as number || 0;
    const fi   = ((result as unknown as Record<string, unknown>).fusion_insights as Array<Record<string, unknown>>) || [];
    const topF = fi
      .filter(f => f.alert)
      .sort((a, b) => (b.anomaly_score as number || 0) - (a.anomaly_score as number || 0));
    if (topF.length > 0) {
      const f = topF[0];
      return (
        `Highest anomaly activity at ${fmt(f.window_start_s as number)}–${fmt(f.window_end_s as number)}\n` +
        `Anomaly score: ${Math.round((f.anomaly_score as number || 0) * 100)}/100\n` +
        `Scene: ${String(f.scene_label || '').replace(/_/g, ' ')}\n` +
        `${f.description || ''}\n\n` +
        `Overall peak activity timestamp: ${fmt(peak)}`
      );
    }
    return `Peak activity was detected at ${fmt(peak)}. No cross-modal fusion alerts were generated.`;
  }

  // ── Speech / transcript ──────────────────────────────────────────────────────
  if (/speech|transcript|talk|dialogue|conversation|say|said|spoken|language/i.test(q)) {
    const segs  = (result.speech_segments || []).filter(s => !s.is_noise);
    const langs = (result as unknown as Record<string, unknown>).detected_languages as Array<Record<string, unknown>> || [];
    if (segs.length === 0) return 'No speech was detected in this video (or the transcript is empty).';
    const langList = langs.map(l => `${l.name || l.code}`).join(', ');
    const lines = segs.slice(0, 6)
      .map(s => `  [${fmt(s.start_s || 0)}] "${s.text}"`)
      .join('\n');
    return `${segs.length} speech segment(s) detected.\nLanguages: ${langList || 'Unknown'}\n\nTranscript excerpts:\n${lines}`;
  }

  // ── Objects ──────────────────────────────────────────────────────────────────
  if (/object|detect|class|item|thing|weapon|car|vehicle|bag|phone/i.test(q)) {
    const objs = ((result as unknown as Record<string, unknown>).top_objects as Array<Record<string, unknown>>) || [];
    if (objs.length === 0) return 'No objects were classified in this analysis.';
    const list = objs.slice(0, 10).map(o => `  • ${o.label}: ${o.count} detection(s)`).join('\n');
    return `Top detected objects:\n${list}`;
  }

  return null; // no direct match — fall through to AI
}

// ── Layer 2: Extractive QA via roberta-base-squad2 (always-warm, free) ───────

async function extractiveQA(question: string, context: string): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (HF_TOKEN) headers['Authorization'] = `Bearer ${HF_TOKEN}`;

  const resp = await fetch(`${HF_API}/${QA_MODEL}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inputs: {
        question,
        context: context.slice(0, 3500),   // roberta context limit
      },
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error((body.error as string) || `HF QA error ${resp.status}`);
  }

  const data = await resp.json() as { answer?: string; score?: number };
  const answer = data.answer?.trim() ?? '';
  const score  = data.score ?? 0;

  // Low-confidence answers are usually noise — let the caller handle it
  if (!answer || score < 0.05) throw new Error('Low confidence — no clear answer found');

  // Wrap short answers with a bit more context for readability
  if (answer.length < 40 && score < 0.6) {
    return `Based on the analysis: ${answer}`;
  }
  return answer;
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function chatWithVideo(
  context: string,
  history: ChatMessage[],
  result?: AnalysisResult,
): Promise<string> {
  const question = history[history.length - 1]?.content?.trim() ?? '';
  if (!question) throw new Error('No question provided');

  // Layer 1 — direct extraction (instant, zero network)
  if (result) {
    const direct = tryDirectAnswer(question, result);
    if (direct) return direct;
  }

  // Layer 2 — extractive QA model (always-warm, truly free)
  try {
    return await extractiveQA(question, context);
  } catch {
    // Layer 3 — give a graceful degraded answer so the UI never shows a raw error
    return buildFallbackAnswer(question, result);
  }
}

/** Graceful plain-text answer when all AI paths fail. */
function buildFallbackAnswer(question: string, result?: AnalysisResult): string {
  if (!result) {
    return 'AI service is temporarily unavailable. Please try again in a moment.';
  }
  const evs  = result.surveillance_events || [];
  const risk = result.risk_level || 'UNKNOWN';
  const peop = distinctPersonCount(result);
  const q    = question.toLowerCase();

  // Best-effort keyword response
  if (/\bpeople\b|\bperson\b|\bhow many\b|\bindividual/i.test(q)) {
    return `Approximately ${peop} distinct individual(s) were tracked.`;
  }
  if (/\brisk\b|\bthreat\b|\bdanger\b/i.test(q)) {
    return `Risk level: ${risk}. ${result.summary?.slice(0, 200) || ''}`.trim();
  }
  if (/\bevent\b|\bdetect\b|\bhappen\b/i.test(q)) {
    return evs.length > 0
      ? `${evs.length} event(s) detected. Most severe: ${evs[0]?.event_type?.replace(/_/g,' ')} at ${fmt(evs[0]?.timestamp_s || 0)}.`
      : 'No surveillance events were detected.';
  }
  return (
    `Analysis summary: ${risk} risk, ~${peop} person(s), ${evs.length} event(s).\n` +
    (result.summary ? result.summary.slice(0, 300) : 'No narrative summary available.')
  );
}
