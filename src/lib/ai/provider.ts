import type { StreamingEvent } from "@/lib/types/api";
import type {
  CodebaseAnswer,
  ConnectionTestResult,
  DiffExplanation,
  RequirementAnalysis
} from "@/lib/types/domain";

export interface AIProvider {
  id: string;
  generateRequirementAnalysis(prompt: string): Promise<RequirementAnalysis>;
  generateCodebaseAnswer(prompt: string): Promise<CodebaseAnswer>;
  generateDiffExplanation(prompt: string): Promise<DiffExplanation>;
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
  streamStructured<T>(events: StreamingEvent<T>[]): AsyncGenerator<StreamingEvent<T>>;
  embed(text: string): Promise<number[]>;
  testConnection(): Promise<ConnectionTestResult>;
}
