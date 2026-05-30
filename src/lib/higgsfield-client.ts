/**
 * Higgsfield AI — REST client (v1 API)
 *
 * Correct format reverse-engineered from the official JS SDK + live testing:
 *   https://github.com/higgsfield-ai/higgsfield-js
 *
 * Auth:      Two headers — hf-api-key (UUID) + hf-secret (64-char hex)
 *            HIGGSFIELD_API_KEY env var holds both parts joined by ":"
 *            (order-independent — we detect which part is the UUID)
 * Base URL:  https://platform.higgsfield.ai
 * Submit:    POST /v1/image2video/dop   body: { params: {...} }
 * Poll:      GET  /v1/job-sets/{id}
 * Docs:      https://docs.higgsfield.ai
 */

const BASE = "https://platform.higgsfield.ai";

/** DoP model tiers (Higgsfield's own image-to-video models) */
export const HF_DOP_MODELS = ["dop-turbo", "dop-standard", "dop-lite"] as const;
type DoPModel = typeof HF_DOP_MODELS[number];

/**
 * Parse HIGGSFIELD_API_KEY into { apiKey (UUID), secret (hex) }.
 * The key is "partA:partB" — we detect which part is the UUID so the
 * stored order doesn't matter.
 */
function getCredentials(): { apiKey: string; secret: string } {
  const raw = (process.env.HIGGSFIELD_API_KEY ?? "").trim();
  if (!raw) throw new Error("HIGGSFIELD_API_KEY is not set");

  const parts = raw.split(":");
  if (parts.length !== 2) {
    throw new Error('HIGGSFIELD_API_KEY must be "apiKey:secret" (two parts joined by ":")');
  }

  const [a, b] = parts;
  // The UUID part contains dashes OR is 32 hex chars; the secret is 64 hex chars.
  const isUuid = (s: string) => s.includes("-") || s.length <= 36;
  const apiKey = isUuid(a) ? a : b;
  const secret = isUuid(a) ? b : a;
  return { apiKey, secret };
}

function authHeaders(): Record<string, string> {
  const { apiKey, secret } = getCredentials();
  return { "hf-api-key": apiKey, "hf-secret": secret };
}

// ── Request / Response types ─────────────────────────────────────────────────

interface DoPParams {
  model:           DoPModel;
  prompt:          string;
  input_images:    Array<{ type: "image_url"; image_url: string }>;
  seed?:           number;
  enhance_prompt?: boolean;
}

interface JobResult { url: string; type: string }
interface Job {
  id:       string;
  status:   "queued" | "in_progress" | "completed" | "failed" | "nsfw" | "canceled";
  results?: { raw?: JobResult; min?: JobResult } | null;
}
interface JobSet {
  id:   string;
  jobs: Job[];
}

// ── Core: submit + poll ──────────────────────────────────────────────────────

/**
 * Submit a DoP image-to-video request and poll the JobSet until done.
 * Returns the video URL on success, throws on failure.
 */
async function submitAndPoll(params: DoPParams): Promise<string> {
  const headers = { ...authHeaders(), "Content-Type": "application/json" };

  // 1. Submit — body wrapped in { params: {...} }
  const submitRes = await fetch(`${BASE}/v1/image2video/dop`, {
    method:  "POST",
    headers,
    body:    JSON.stringify({ params }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`Higgsfield submit ${submitRes.status}: ${err.slice(0, 300)}`);
  }

  const jobSet = await submitRes.json() as JobSet;
  if (!jobSet.id) throw new Error("Higgsfield: no JobSet id in submit response");

  console.log(`[higgsfield] Submitted ${params.model} → job-set: ${jobSet.id}`);

  // 2. Poll /v1/job-sets/{id} every 4 s, up to 5 min
  const POLL_MS = 4_000;
  const MAX_MS  = 5 * 60 * 1_000;
  const started = Date.now();

  while (Date.now() - started < MAX_MS) {
    await new Promise(r => setTimeout(r, POLL_MS));

    const pollRes = await fetch(`${BASE}/v1/job-sets/${jobSet.id}`, {
      headers: authHeaders(),
    });

    if (!pollRes.ok) {
      console.warn(`[higgsfield] Poll HTTP ${pollRes.status} — retrying…`);
      continue;
    }

    const poll    = await pollRes.json() as JobSet;
    const job     = poll.jobs?.[0];
    const elapsed = Math.round((Date.now() - started) / 1_000);
    console.log(`[higgsfield] ${params.model} → ${job?.status ?? "unknown"} (${elapsed}s)`);

    if (!job) continue;

    if (job.status === "completed") {
      const url = job.results?.raw?.url ?? job.results?.min?.url;
      if (!url) throw new Error("Higgsfield: completed but no video URL in results");
      return url;
    }

    if (job.status === "failed" || job.status === "nsfw" || job.status === "canceled") {
      throw new Error(`Higgsfield: job ${job.status}`);
    }
    // queued | in_progress → keep polling
  }

  throw new Error(`Higgsfield: timed out after ${MAX_MS / 1_000}s`);
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface HFVideoParams {
  imageUrl: string;
  prompt:   string;
}

/**
 * Try DoP models in order (turbo → standard → lite).
 * Returns { url, model } on first success, throws if all fail.
 */
export async function generateHFVideoWithFallback(
  params: HFVideoParams,
): Promise<{ url: string; model: string }> {
  const errors: string[] = [];

  for (const model of HF_DOP_MODELS) {
    try {
      console.log(`[higgsfield] Trying dop/${model}…`);
      const url = await submitAndPoll({
        model,
        prompt:         params.prompt,
        input_images:   [{ type: "image_url", image_url: params.imageUrl }],
        enhance_prompt: false,
      });
      console.log(`[higgsfield] ✓ ${model} succeeded`);
      return { url, model: `higgsfield-ai/dop/${model}` };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[higgsfield] ${model} failed:`, msg.slice(0, 200));
      errors.push(`${model}: ${msg.slice(0, 100)}`);
      // "Not enough credits" → no point trying other models, fail fast
      if (msg.includes("Not enough credits") || msg.includes("403")) {
        throw new Error(`Higgsfield: Not enough credits. Add credits at https://cloud.higgsfield.ai`);
      }
    }
  }

  throw new Error(`All Higgsfield DoP models failed:\n${errors.join("\n")}`);
}

/** True when the API key is configured. */
export function higgsFieldAvailable(): boolean {
  return !!(process.env.HIGGSFIELD_API_KEY ?? "").trim();
}

// ── Speak (lip-sync talking avatar) ──────────────────────────────────────────
//
// This is the model Higgsfield's UGC Marketing Studio uses: it takes a portrait
// image + a voiceover audio clip (WAV) and renders a video where the person
// speaks the audio with accurate lip-sync. Endpoint: /v1/speak/higgsfield.
//
// IMPORTANT: input_audio MUST be a WAV file served with Content-Type audio/wav.
// MP3 (and mislabelled wavs) are rejected with HTTP 400 "invalid_audio_format".

interface SpeakParams {
  input_image: { type: "image_url"; image_url: string };
  input_audio: { type: "audio_url"; audio_url: string };
  prompt:      string;
  quality:     "mid" | "high";
  duration:    5 | 10 | 15;
  seed?:       number;
}

export interface HFSpeakArgs {
  imageUrl:    string;
  audioUrl:    string;
  prompt?:     string;
  quality?:    "mid" | "high";
  duration?:   5 | 10 | 15;
  /** Called on each poll tick so callers can surface real progress. */
  onProgress?: (status: Job["status"], elapsedSec: number) => void;
}

/**
 * Submit a Speak lip-sync request and poll the JobSet until done.
 * Returns the video URL on success, throws on failure.
 */
export async function generateSpeakVideo(
  args: HFSpeakArgs,
): Promise<{ url: string; model: string }> {
  const params: SpeakParams = {
    input_image: { type: "image_url", image_url: args.imageUrl },
    input_audio: { type: "audio_url", audio_url: args.audioUrl },
    prompt:      args.prompt   ?? "person speaking naturally to the camera, authentic UGC selfie video",
    quality:     args.quality  ?? "high",
    duration:    args.duration ?? 5,
  };

  const headers = { ...authHeaders(), "Content-Type": "application/json" };

  // 1. Submit
  const submitRes = await fetch(`${BASE}/v1/speak/higgsfield`, {
    method:  "POST",
    headers,
    body:    JSON.stringify({ params }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    if (err.includes("Not enough credits") || submitRes.status === 403) {
      throw new Error("Higgsfield: Not enough credits. Add credits at https://cloud.higgsfield.ai");
    }
    throw new Error(`Higgsfield Speak submit ${submitRes.status}: ${err.slice(0, 300)}`);
  }

  const jobSet = await submitRes.json() as JobSet;
  if (!jobSet.id) throw new Error("Higgsfield Speak: no JobSet id in submit response");
  console.log(`[higgsfield] Submitted speak → job-set: ${jobSet.id}`);

  // 2. Poll
  const POLL_MS = 4_000;
  const MAX_MS  = 6 * 60 * 1_000;
  const started = Date.now();

  while (Date.now() - started < MAX_MS) {
    await new Promise(r => setTimeout(r, POLL_MS));

    const pollRes = await fetch(`${BASE}/v1/job-sets/${jobSet.id}`, { headers: authHeaders() });
    if (!pollRes.ok) {
      console.warn(`[higgsfield] Speak poll HTTP ${pollRes.status} — retrying…`);
      continue;
    }

    const poll    = await pollRes.json() as JobSet;
    const job     = poll.jobs?.[0];
    const elapsed = Math.round((Date.now() - started) / 1_000);
    console.log(`[higgsfield] speak → ${job?.status ?? "unknown"} (${elapsed}s)`);

    if (!job) continue;
    args.onProgress?.(job.status, elapsed);

    if (job.status === "completed") {
      const url = job.results?.raw?.url ?? job.results?.min?.url;
      if (!url) throw new Error("Higgsfield Speak: completed but no video URL in results");
      return { url, model: "higgsfield-ai/speak" };
    }
    if (job.status === "failed" || job.status === "nsfw" || job.status === "canceled") {
      throw new Error(`Higgsfield Speak: job ${job.status}`);
    }
    // queued | in_progress → keep polling
  }

  throw new Error(`Higgsfield Speak: timed out after ${MAX_MS / 1_000}s`);
}

// ── Seedance 2.0 (image-to-video, real body motion) ──────────────────────────
//
// This is the model Higgsfield's UGC studio uses for authentic creator motion:
// takes a single first-frame image + a text prompt and animates real movement
// (person picks up / shows the product). Endpoint: /v1/image2video/seedance.
//
// Schema (reverse-engineered from the API's echoed input_params):
//   input_image:  { type:"image_url", image_url }   (required)
//   prompts:      string[]                           (motion prompt, as a list)
//   duration:     5 | 10
//   resolution:   "480" | "720" | "1080"             (note: no "p")
//   aspect_ratio: "auto" follows the input image
//   model:        "seedance_pro"
// Output is a SILENT video — caller must mux the voiceover separately.

export interface HFSeedanceArgs {
  imageUrl:    string;
  prompt:      string;
  duration?:   5 | 10;
  resolution?: "480" | "720" | "1080";
  onProgress?: (status: Job["status"], elapsedSec: number) => void;
}

export async function generateSeedanceVideo(
  args: HFSeedanceArgs,
): Promise<{ url: string; model: string }> {
  const params = {
    input_image:    { type: "image_url" as const, image_url: args.imageUrl },
    prompts:        [args.prompt],
    duration:       args.duration   ?? 5,
    resolution:     args.resolution ?? "1080",
    aspect_ratio:   "auto",
    model:          "seedance_pro",
    enhance_prompt: true,
  };

  const headers = { ...authHeaders(), "Content-Type": "application/json" };

  const submitRes = await fetch(`${BASE}/v1/image2video/seedance`, {
    method:  "POST",
    headers,
    body:    JSON.stringify({ params }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    if (err.includes("Not enough credits") || submitRes.status === 403) {
      throw new Error("Higgsfield: Not enough credits. Add credits at https://cloud.higgsfield.ai");
    }
    throw new Error(`Higgsfield Seedance submit ${submitRes.status}: ${err.slice(0, 300)}`);
  }

  const jobSet = await submitRes.json() as JobSet;
  if (!jobSet.id) throw new Error("Higgsfield Seedance: no JobSet id in submit response");
  console.log(`[higgsfield] Submitted seedance → job-set: ${jobSet.id}`);

  const POLL_MS = 4_000;
  const MAX_MS  = 6 * 60 * 1_000;
  const started = Date.now();

  while (Date.now() - started < MAX_MS) {
    await new Promise(r => setTimeout(r, POLL_MS));

    const pollRes = await fetch(`${BASE}/v1/job-sets/${jobSet.id}`, { headers: authHeaders() });
    if (!pollRes.ok) {
      console.warn(`[higgsfield] Seedance poll HTTP ${pollRes.status} — retrying…`);
      continue;
    }

    const poll    = await pollRes.json() as JobSet;
    const job     = poll.jobs?.[0];
    const elapsed = Math.round((Date.now() - started) / 1_000);
    console.log(`[higgsfield] seedance → ${job?.status ?? "unknown"} (${elapsed}s)`);

    if (!job) continue;
    args.onProgress?.(job.status, elapsed);

    if (job.status === "completed") {
      const url = job.results?.raw?.url ?? job.results?.min?.url;
      if (!url) throw new Error("Higgsfield Seedance: completed but no video URL in results");
      return { url, model: "higgsfield-ai/seedance" };
    }
    if (job.status === "failed" || job.status === "nsfw" || job.status === "canceled") {
      throw new Error(`Higgsfield Seedance: job ${job.status}`);
    }
  }

  throw new Error(`Higgsfield Seedance: timed out after ${MAX_MS / 1_000}s`);
}
