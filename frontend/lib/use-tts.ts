"use client";

import { useCallback, useRef, useState } from "react";

import { api } from "@/lib/api";

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      stop();
      if (!text.trim()) return;

      setIsSpeaking(true);
      try {
        const response = await api.post("/tts", { text: text.slice(0, 5000) }, {
          responseType: "blob",
          timeout: 30000,
        });

        const blob = new Blob([response.data], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        urlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          urlRef.current = null;
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          urlRef.current = null;
        };

        await audio.play();
      } catch {
        setIsSpeaking(false);
      }
    },
    [stop],
  );

  return { isSpeaking, speak, stop };
}
