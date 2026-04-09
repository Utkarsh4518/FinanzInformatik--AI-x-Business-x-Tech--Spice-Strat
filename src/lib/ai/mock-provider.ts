import { demoAnalysis, demoCodebaseAnswer, demoDiffExplanation } from "@/lib/demo/data";
import { sleep } from "@/lib/utils";
import type { StreamingEvent } from "@/lib/types/api";
import type { AIProvider } from "@/lib/ai/provider";
import type {
  CodebaseAnswer,
  ConnectionTestResult,
  DiffExplanation,
  RequirementAnalysis
} from "@/lib/types/domain";

export class MockAIProvider implements AIProvider {
  id = "mock";

  async generateRequirementAnalysis(_prompt: string): Promise<RequirementAnalysis> {
    await sleep(200);
    return demoAnalysis;
  }

  async generateCodebaseAnswer(_prompt: string): Promise<CodebaseAnswer> {
    await sleep(120);
    return demoCodebaseAnswer;
  }

  async generateDiffExplanation(_prompt: string): Promise<DiffExplanation> {
    await sleep(160);
    return demoDiffExplanation;
  }

  async generateText(prompt: string): Promise<string> {
    await sleep(90);
    return prompt;
  }

  async *streamStructured<T>(events: StreamingEvent<T>[]) {
    for (const event of events) {
      await sleep(220);
      yield event;
    }
  }

  async embed(text: string): Promise<number[]> {
    const normalized = text.slice(0, 24).padEnd(24, " ");
    return normalized.split("").map((char) => Number((char.charCodeAt(0) % 31) / 31).toFixed(4)).map(Number);
  }

  async testConnection(): Promise<ConnectionTestResult> {
    await sleep(180);
    return {
      provider: "mock",
      status: "success",
      message: "Mock AI provider is active. Demo-grade responses are available.",
      latencyMs: 180
    };
  }
}
