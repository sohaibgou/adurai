/**
 * ElevenLabs TTS — REST wrapper (no SDK dependency).
 * Requires ELEVENLABS_API_KEY in env.
 * Returns null gracefully if key is missing so video-without-audio still works.
 */

const API_BASE = "https://api.elevenlabs.io/v1";

/** Well-known pre-built voices for each avatar */
export const EL_VOICES = {
  rachel: "21m00Tcm4TlvDq8ikWAM", // female  · warm American
  bella:  "EXAVITQu4vr4xnSDxMaL", // female  · confident
  elli:   "MF3mGyEYCl7XYWbV9V6O", // female  · young energetic
  adam:   "pNInz6obpgDQGcFmaJgB", // male    · deep authoritative
  antoni: "ErXwobaYiN019PkySvjV", // male    · friendly conversational
  josh:   "TxGEqnHWrfWFTfGW9XjX", // male    · casual young
} as const;

/**
 * Convert text to speech via ElevenLabs.
 * @returns MP3 audio as a Buffer, or null if the API key is unset / request fails.
 */
export async function generateSpeech(
  text:    string,
  voiceId: string,
): Promise<Buffer | null> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    console.warn("[elevenlabs] ELEVENLABS_API_KEY not set — skipping TTS");
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/text-to-speech/${voiceId}`, {
      method:  "POST",
      headers: {
        "xi-api-key":   key,
        "Content-Type": "application/json",
        "Accept":       "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability:        0.50,
          similarity_boost: 0.75,
          style:            0.50,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      // 401=invalid key · 422=invalid voice ID · 429=quota exceeded
      console.error(`[elevenlabs] TTS ${res.status}:`, body.slice(0, 300));
      return null;
    }

    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.error("[elevenlabs] TTS exception:", e);
    return null;
  }
}
