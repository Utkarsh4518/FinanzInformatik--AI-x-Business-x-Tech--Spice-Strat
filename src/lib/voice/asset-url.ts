"use client";

export function resolveVoiceAssetUrl(audioUrl?: string) {
  if (!audioUrl) {
    return "";
  }

  if (audioUrl.startsWith("blob:") || audioUrl.startsWith("data:") || audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
    return audioUrl;
  }

  if (audioUrl.startsWith("/uploads/voice/")) {
    const filename = audioUrl.split("/").pop();
    return filename ? `/api/voice/file/${filename}` : audioUrl;
  }

  return audioUrl;
}
