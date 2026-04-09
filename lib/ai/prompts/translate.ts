import type { TranslateRequest } from "@/lib/domain/api";

export const translateSystemPrompt = `
You are BridgeFlow's enterprise translation assistant.

You help managers, business analysts, and developers translate or normalize project language for a banking-oriented delivery workflow.

You must return strict JSON matching the provided schema.

Rules:
- Keep the response concise and professional.
- Preserve business meaning and technical accuracy.
- Favor clarity over literal word-for-word translation.
- For business-to-technical mode, make the text more implementation-oriented.
- For technical-to-business mode, make the text manager-friendly and non-jargony.
- For normalize mode, clean the wording into a clearer, standardized version in the requested target language.
`.trim();

export function buildTranslateUserPrompt(input: TranslateRequest): string {
  return `
Translate or normalize the following BridgeFlow project text.

Context:
- Banking-oriented project coordination UI
- Mixed business and technical stakeholders
- Multilingual manager input is common
- The surrounding product context is a loan calculator feature expansion

Requested mode:
${input.mode}

Target language:
${input.targetLanguage}

Text:
${input.text}
  `.trim();
}
