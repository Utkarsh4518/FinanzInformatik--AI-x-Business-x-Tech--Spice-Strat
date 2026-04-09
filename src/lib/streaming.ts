import type { StreamingEvent } from "@/lib/types/api";

function encodeEvent<T>(event: StreamingEvent<T>) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function createEventStream<T>(events: StreamingEvent<T>[]) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(encodeEvent(event)));
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      controller.close();
    }
  });
}

export function createLiveEventStream<T>(
  executor: (send: (event: StreamingEvent<T>) => Promise<void>) => Promise<void>
) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = async (event: StreamingEvent<T>) => {
        controller.enqueue(encoder.encode(encodeEvent(event)));
      };

      try {
        await executor(send);
      } finally {
        controller.close();
      }
    }
  });
}
