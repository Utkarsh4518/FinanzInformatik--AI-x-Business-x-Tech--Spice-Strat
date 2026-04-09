import { MockAIProvider } from "@/lib/ai/mock-provider";
import type { AIProvider } from "@/lib/ai/provider";
import type {
  CodebaseAnswer,
  ConnectionTestResult,
  DiffExplanation,
  RequirementAnalysis
} from "@/lib/types/domain";

type JsonRecord = Record<string, unknown>;

type ProviderConfig = {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
  embeddingModel?: string;
};

function stripJsonFence(value: string) {
  return value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();
}

async function parseJsonResponse<T>(response: Response) {
  if (!response.ok) {
    throw new Error(`LLM request failed with status ${response.status}.`);
  }

  const json = (await response.json()) as JsonRecord;
  return json as T;
}

export class CompatibleAIProvider implements AIProvider {
  id: string;
  private readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.id = config.provider;
  }

  private async requestJson<T>(prompt: string, systemPrompt: string) {
    if (this.config.provider === "gemini-compatible") {
      return this.requestGeminiJson<T>(prompt, systemPrompt);
    }

    return this.requestOpenAiCompatibleJson<T>(prompt, systemPrompt);
  }

  private async requestText(prompt: string, systemPrompt: string) {
    if (this.config.provider === "gemini-compatible") {
      const endpoint = `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.2
          },
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ]
        })
      });
      const data = await parseJsonResponse<{
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      }>(response);
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ]
      })
    });
    const data = await parseJsonResponse<{ choices?: Array<{ message?: { content?: string } }> }>(response);
    return data.choices?.[0]?.message?.content ?? "";
  }

  private async requestOpenAiCompatibleJson<T>(prompt: string, systemPrompt: string) {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await parseJsonResponse<{ choices?: Array<{ message?: { content?: string } }> }>(response);
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("The AI provider returned an empty response.");
    }

    return JSON.parse(stripJsonFence(content)) as T;
  }

  private async requestGeminiJson<T>(prompt: string, systemPrompt: string) {
    const endpoint = `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await parseJsonResponse<{
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    }>(response);
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error("The Gemini-compatible provider returned an empty response.");
    }

    return JSON.parse(stripJsonFence(content)) as T;
  }

  async generateRequirementAnalysis(prompt: string): Promise<RequirementAnalysis> {
    return this.requestJson<RequirementAnalysis>(
      prompt,
      "Return strict JSON with keys: summary, userStory, acceptanceCriteria, ambiguities, edgeCases, outOfScope, uiSuggestions, technicalImpactSummary, technicalTasks, tests."
    );
  }

  async generateCodebaseAnswer(prompt: string): Promise<CodebaseAnswer> {
    return this.requestJson<CodebaseAnswer>(
      prompt,
      "Return strict JSON with keys: question, mode, answer, businessExplanation, developerExplanation, relatedFiles, riskNotes, citations."
    );
  }

  async generateDiffExplanation(prompt: string): Promise<DiffExplanation> {
    return this.requestJson<DiffExplanation>(
      prompt,
      "Return strict JSON with keys: executiveSummary, userImpact, technicalChanges, businessValue, sideEffects, nonImplementedItems, releaseNote, demoScript, changedFiles."
    );
  }

  async generateText(prompt: string, systemPrompt = "Return plain text only.") {
    return this.requestText(prompt, systemPrompt);
  }

  async *streamStructured<T>(events: import("@/lib/types/api").StreamingEvent<T>[]) {
    for (const event of events) {
      yield event;
    }
  }

  async embed(text: string): Promise<number[]> {
    if (this.config.provider === "gemini-compatible" || !this.config.embeddingModel) {
      return new MockAIProvider().embed(text);
    }

    const response = await fetch(`${this.config.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.embeddingModel,
        input: text
      })
    });

    if (!response.ok) {
      return new MockAIProvider().embed(text);
    }

    const data = await parseJsonResponse<{ data?: Array<{ embedding?: number[] }> }>(response);
    const embedding = data.data?.[0]?.embedding;
    return embedding ?? new MockAIProvider().embed(text);
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startedAt = Date.now();
    try {
      if (this.config.provider === "gemini-compatible") {
        await fetch(`${this.config.baseUrl}/models/${this.config.model}?key=${this.config.apiKey}`);
      } else {
        await fetch(`${this.config.baseUrl}/models`, {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`
          }
        });
      }

      return {
        provider: this.config.provider,
        status: "success",
        message: `${this.config.provider} connection is available.`,
        latencyMs: Date.now() - startedAt
      };
    } catch (error) {
      return {
        provider: this.config.provider,
        status: "error",
        message: error instanceof Error ? error.message : "Connection failed."
      };
    }
  }
}
