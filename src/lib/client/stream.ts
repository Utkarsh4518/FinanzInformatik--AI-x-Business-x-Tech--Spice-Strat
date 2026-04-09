"use client";

import type { StreamingEvent } from "@/lib/types/api";

export async function consumeEventStream<T>(
  response: Response,
  onEvent: (event: StreamingEvent<T>) => void
) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    return;
  }

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      if (!part.startsWith("data: ")) {
        continue;
      }
      onEvent(JSON.parse(part.slice(6)) as StreamingEvent<T>);
    }
  }
}
