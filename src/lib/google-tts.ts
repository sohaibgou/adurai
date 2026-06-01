/**
 * Google AI Studio (Gemini) TTS — Arabic voiceover for UGC videos.
 *
 * Uses the @google/genai SDK with GOOGLE_AI_KEY. The Gemini TTS models return
 * RAW PCM (signed 16-bit little-endian, 24 kHz, mono) with NO container header,
 * so we wrap the bytes in a WAV header before returning — fal's lip-sync and
 * higgsfield both require a real WAV served as audio/wav.
 *
 * Returns null gracefully (never throws) so the caller can fall back to the
 * video's native audio when TTS is unavailable.
 */
import { GoogleGenAI } from "@google/genai";

const TTS_MODEL = "gemini-2.5-flash-preview-tts";

// Gemini prebuilt voices are language-agnostic (they speak whatever the text
// is). These read Arabic naturally. Picked by avatar gender.
const FEMALE_VOICE = "Kore";   // firm, warm — good for female creators
const MALE_VOICE   = "Charon"; // informative, grounded — good for male creators

/** Build a 44-byte WAV header + PCM body for signed 16-bit mono little-endian. */
function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const byteRate   = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const header     = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4); // file size - 8
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);             // fmt chunk size (PCM)
  header.writeUInt16LE(1, 20);              // audio format = PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

/** Accent/dialect the synthesized voice should use. */
export type ArabicAccent =
  | "khaleeji"
  | "egyptian"
  | "levantine"
  | "darija"
  | "msa"
  | "default";

// Natural-language style directives steer Gemini's delivery + accent. The
// instruction (before the colon) shapes how it speaks; only the script is read.
const ACCENT_DIRECTIVE: Record<ArabicAccent, string> = {
  khaleeji:
    "Speak in an authentic Gulf Khaleeji Arabic accent (like a native speaker from Saudi Arabia or the UAE), warm and upbeat like a real social-media creator talking to a friend",
  egyptian:
    "Speak in an authentic Egyptian Arabic accent (Masri, like a native speaker from Cairo), warm and upbeat like a real social-media creator talking to a friend",
  levantine:
    "Speak in an authentic Levantine Arabic accent (Shami, like a native speaker from Lebanon, Syria, Jordan or Palestine), warm and upbeat like a real social-media creator talking to a friend",
  darija:
    "Speak in an authentic Moroccan Darija accent, casual and friendly like a real social-media creator talking to a friend",
  msa:
    "Speak in clear, natural Modern Standard Arabic, warm and upbeat like a real social-media creator talking to a friend",
  default:
    "Speak in a warm, natural, upbeat voice like a real social-media creator talking to a friend",
};

/**
 * Synthesize Arabic (or any) speech and return it as a WAV Buffer.
 * @param text   The script to speak (Arabic text supported).
 * @param gender "female" | "male" — selects a fitting prebuilt voice.
 * @param accent Accent to render. Arabic → "khaleeji", Darija → "darija".
 * @returns WAV audio Buffer, or null if the key is unset / request fails.
 */
export async function synthesizeArabicSpeech(
  text: string,
  gender: "female" | "male" = "female",
  accent: ArabicAccent = "khaleeji",
): Promise<Buffer | null> {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) {
    console.warn("[google-tts] GOOGLE_AI_KEY not set — skipping Arabic TTS");
    return null;
  }
  if (!text?.trim()) return null;

  const voiceName = gender === "male" ? MALE_VOICE : FEMALE_VOICE;

  // Documented Gemini controllability pattern: the directive before the colon
  // shapes delivery + accent; only the content after it is spoken.
  const prompt = `${ACCENT_DIRECTIVE[accent]}: ${text.trim()}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const b64  = part?.inlineData?.data;
    if (!b64) {
      console.error("[google-tts] No audio returned from Gemini TTS");
      return null;
    }

    const pcm = Buffer.from(b64, "base64");
    // Default Gemini TTS output: 24 kHz, 16-bit, mono. If the mimeType reports a
    // different rate, honor it.
    const mime = part?.inlineData?.mimeType ?? "";
    const rateMatch = mime.match(/rate=(\d+)/);
    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

    return pcmToWav(pcm, sampleRate);
  } catch (e) {
    console.error("[google-tts] TTS exception:", e instanceof Error ? e.message : e);
    return null;
  }
}
