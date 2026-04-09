import { promises as fs } from "node:fs";
import path from "node:path";
import { createId, safeJsonParse } from "@/lib/utils";
import { getAIProvider } from "@/lib/ai/factory";
import type {
  VoicePlaybackAsset,
  VoiceSession,
  VoiceSummaryMode,
  VoiceTranscription
} from "@/lib/types/domain";

const uploadDir = path.join(process.cwd(), "public", "uploads", "voice");

type TimestampRecord = {
  start: number;
  end: number;
  text: string;
  speaker?: string;
};

export class ElevenLabsService {
  private readonly apiKey = process.env.ELEVENLABS_API_KEY;
  private readonly voiceId = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
  private readonly ttsModel = process.env.ELEVENLABS_TTS_MODEL || "eleven_turbo_v2_5";
  private readonly ttsQualityModel = process.env.ELEVENLABS_TTS_QUALITY_MODEL || "eleven_multilingual_v2";
  private readonly sttModel = process.env.ELEVENLABS_STT_MODEL || "scribe_v1";

  private async ensureUploadDir() {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  private buildLocalAudioUrl(filename: string) {
    return `/api/voice/file/${filename}`;
  }

  private async saveBuffer(buffer: Buffer, extension: string) {
    await this.ensureUploadDir();
    const filename = `${createId("voice")}.${extension}`;
    await fs.writeFile(path.join(uploadDir, filename), buffer);
    return this.buildLocalAudioUrl(filename);
  }

  private fallbackTranscript(filename: string): VoiceTranscription {
    const transcript = "Live transcription fallback: audio was received but ElevenLabs is not configured. Provide ELEVENLABS_API_KEY to enable full transcription.";
    return {
      transcript,
      translatedTranscript: transcript,
      detectedLanguage: process.env.DEFAULT_SOURCE_LANGUAGE || "en",
      timestamps: [
        {
          start: 0,
          end: 4,
          text: transcript
        }
      ],
      speakers: [],
      audioUrl: filename
    };
  }

  async transcribeAudio(options: {
    fileBuffer: Buffer;
    filename: string;
    mimeType?: string;
    sourceLanguage?: string;
  }): Promise<VoiceTranscription> {
    const audioUrl = await this.saveBuffer(options.fileBuffer, options.filename.split(".").pop() || "webm");

    if (!this.apiKey) {
      return this.fallbackTranscript(audioUrl);
    }

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(options.fileBuffer)], { type: options.mimeType || "audio/webm" });
    formData.append("file", blob, options.filename);
    formData.append("model_id", this.sttModel);
    formData.append("diarize", "true");
    formData.append("tag_audio_events", "true");
    formData.append("timestamps_granularity", "word");
    if (options.sourceLanguage) {
      formData.append("language_code", options.sourceLanguage);
    }

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": this.apiKey
      },
      body: formData
    });

    if (!response.ok) {
      return this.fallbackTranscript(audioUrl);
    }

    const data = safeJsonParse<Record<string, unknown>>(await response.text(), {});
    const transcript = typeof data.text === "string" ? data.text : "";
    const language = typeof data.language_code === "string" ? data.language_code : process.env.DEFAULT_SOURCE_LANGUAGE || "en";
    const words = Array.isArray(data.words) ? data.words : [];
    const timestamps = words
      .map((word) => {
        const item = word as Record<string, unknown>;
        return {
          start: Number(item.start ?? 0),
          end: Number(item.end ?? 0),
          text: String(item.text ?? ""),
          speaker: item.speaker_id ? String(item.speaker_id) : undefined
        } satisfies TimestampRecord;
      })
      .filter((item) => item.text.length > 0);
    const speakers = [...new Set(timestamps.map((item) => item.speaker).filter(Boolean) as string[])];

    return {
      transcript,
      detectedLanguage: language,
      timestamps,
      speakers,
      audioUrl
    };
  }

  async transcribeRealtime(options: {
    fileBuffer: Buffer;
    filename: string;
    mimeType?: string;
    sourceLanguage?: string;
  }) {
    return this.transcribeAudio(options);
  }

  async synthesizeSpeech(options: {
    text: string;
    quality?: "fast" | "high";
    voiceId?: string;
  }): Promise<VoicePlaybackAsset> {
    if (!this.apiKey) {
      const fallbackText = options.text;
      return {
        audioUrl: "",
        text: fallbackText,
        quality: options.quality ?? "fast",
        voiceId: options.voiceId ?? this.voiceId
      };
    }

    const voiceId = options.voiceId ?? this.voiceId;
    const modelId = options.quality === "high" ? this.ttsQualityModel : this.ttsModel;
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": this.apiKey,
        Accept: "audio/mpeg"
      },
      body: JSON.stringify({
        text: options.text,
        model_id: modelId
      })
    });

    if (!response.ok) {
      return {
        audioUrl: "",
        text: options.text,
        quality: options.quality ?? "fast",
        voiceId
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const audioUrl = await this.saveBuffer(buffer, "mp3");
    return {
      audioUrl,
      text: options.text,
      quality: options.quality ?? "fast",
      voiceId
    };
  }

  async dubMedia(options: {
    fileBuffer: Buffer;
    filename: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  }) {
    if (!this.apiKey) {
      const audioUrl = await this.saveBuffer(options.fileBuffer, options.filename.split(".").pop() || "mp3");
      return {
        status: "queued" as const,
        message: "ElevenLabs dubbing is not configured. Stored the uploaded media locally instead.",
        audioUrl
      };
    }

    const formData = new FormData();
    formData.append("file", new Blob([new Uint8Array(options.fileBuffer)]), options.filename);
    formData.append("source_lang", options.sourceLanguage || process.env.DEFAULT_SOURCE_LANGUAGE || "en");
    formData.append("target_lang", options.targetLanguage || process.env.DEFAULT_TARGET_LANGUAGE || "de");
    formData.append("name", `specbridge-${createId("dub")}`);

    const response = await fetch("https://api.elevenlabs.io/v1/dubbing", {
      method: "POST",
      headers: {
        "xi-api-key": this.apiKey
      },
      body: formData
    });

    if (!response.ok) {
      return {
        status: "error" as const,
        message: "ElevenLabs dubbing request failed."
      };
    }

    const data = safeJsonParse<Record<string, unknown>>(await response.text(), {});
    return {
      status: "processing" as const,
      message: "Dubbing job submitted to ElevenLabs.",
      dubbingId: typeof data.dubbing_id === "string" ? data.dubbing_id : undefined
    };
  }
}

export class VoiceTranslationService {
  private async translateWithFallbackApi(text: string, sourceLanguage: string, targetLanguage: string) {
    try {
      const url = new URL("https://api.mymemory.translated.net/get");
      url.searchParams.set("q", text);
      url.searchParams.set("langpair", `${sourceLanguage}|${targetLanguage}`);
      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        return null;
      }

      const payload = safeJsonParse<Record<string, unknown>>(await response.text(), {});
      const responseData = payload.responseData as Record<string, unknown> | undefined;
      const translatedText = typeof responseData?.translatedText === "string" ? responseData.translatedText : null;
      return translatedText;
    } catch {
      return null;
    }
  }

  async translateText(options: {
    text: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  }) {
    const provider = getAIProvider();
    const sourceLanguage = options.sourceLanguage || process.env.DEFAULT_SOURCE_LANGUAGE || "en";
    const targetLanguage = options.targetLanguage || process.env.DEFAULT_TARGET_LANGUAGE || "de";
    if (sourceLanguage === targetLanguage) {
      return options.text;
    }
    if (provider.id === "mock") {
      const fallbackTranslation = await this.translateWithFallbackApi(options.text, sourceLanguage, targetLanguage);
      return fallbackTranslation || `[${targetLanguage}] ${options.text}`;
    }

    const prompt = [
      "Translate the text faithfully and return plain text only.",
      `Source language: ${sourceLanguage}`,
      `Target language: ${targetLanguage}`,
      options.text
    ].join("\n\n");
    const translated = (await provider.generateText(prompt, "You are a professional translator. Return plain translated text only.")).trim();
    if (translated) {
      return translated;
    }

    const fallbackTranslation = await this.translateWithFallbackApi(options.text, sourceLanguage, targetLanguage);
    return fallbackTranslation || `[${targetLanguage}] ${options.text}`;
  }

  async rewriteForBusiness(text: string) {
    const provider = getAIProvider();
    if (provider.id === "mock") {
      return text;
    }
    return (await provider.generateText(text, "Rewrite this in plain business language. Return concise text only.")).trim() || text;
  }

  async rewriteForDeveloper(text: string) {
    const provider = getAIProvider();
    if (provider.id === "mock") {
      return text;
    }
    return (await provider.generateText(text, "Rewrite this in concrete developer language. Return concise text only.")).trim() || text;
  }

  async summarizeSession(transcript: string): Promise<VoiceSession["summary"]> {
    const provider = getAIProvider();
    if (provider.id === "mock") {
      return {
        decisions: ["Discussion transcript captured."],
        openQuestions: ["Review transcript for unresolved requirements."],
        risks: ["Live AI summarization is using fallback mode."],
        nextTasks: ["Confirm the recorded decisions in the shared spec."]
      };
    }

    const prompt = [
      "Summarize the meeting transcript into JSON with keys decisions, openQuestions, risks, nextTasks.",
      transcript
    ].join("\n\n");
    const text = await provider.generateText(
      prompt,
      "Return JSON only with keys decisions, openQuestions, risks, nextTasks. Each key must map to an array of strings."
    );
    const parsed = safeJsonParse<Record<string, unknown>>(text, {});
    return {
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions.map(String) : [],
      openQuestions: Array.isArray(parsed.openQuestions) ? parsed.openQuestions.map(String) : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
      nextTasks: Array.isArray(parsed.nextTasks) ? parsed.nextTasks.map(String) : []
    };
  }
}

export const elevenLabsService = new ElevenLabsService();
export const voiceTranslationService = new VoiceTranslationService();
