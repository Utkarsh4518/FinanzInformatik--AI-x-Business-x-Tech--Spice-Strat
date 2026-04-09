import { CompatibleAIProvider } from "@/lib/ai/compatible-provider";
import { MockAIProvider } from "@/lib/ai/mock-provider";
import type { AIProvider } from "@/lib/ai/provider";

export function getAIProvider(): AIProvider {
  const provider = process.env.LLM_PROVIDER?.toLowerCase();
  const apiKey = process.env.LLM_API_KEY;

  if (!provider || !apiKey) {
    return new MockAIProvider();
  }

  if (provider === "openai-compatible") {
    return new CompatibleAIProvider({
      provider,
      apiKey,
      model: process.env.LLM_MODEL ?? "gpt-4.1-mini",
      embeddingModel: process.env.LLM_EMBEDDING_MODEL ?? "text-embedding-3-small",
      baseUrl: process.env.LLM_BASE_URL ?? "https://api.openai.com/v1"
    });
  }

  if (provider === "groq-compatible") {
    return new CompatibleAIProvider({
      provider,
      apiKey,
      model: process.env.LLM_MODEL ?? "llama-3.3-70b-versatile",
      baseUrl: process.env.LLM_BASE_URL ?? "https://api.groq.com/openai/v1"
    });
  }

  if (provider === "ollama-local") {
    return new CompatibleAIProvider({
      provider,
      apiKey,
      model: process.env.LLM_MODEL ?? "llama3.1",
      embeddingModel: process.env.LLM_EMBEDDING_MODEL ?? "nomic-embed-text",
      baseUrl: process.env.LLM_BASE_URL ?? "http://127.0.0.1:11434/v1"
    });
  }

  if (provider === "gemini-compatible") {
    return new CompatibleAIProvider({
      provider,
      apiKey,
      model: process.env.LLM_MODEL ?? "gemini-2.0-flash",
      baseUrl: process.env.LLM_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta"
    });
  }

  return new MockAIProvider();
}
