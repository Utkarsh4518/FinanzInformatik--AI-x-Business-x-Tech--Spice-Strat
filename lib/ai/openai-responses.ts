type JsonSchemaFormat = {
  type: "json_schema";
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
};

type StructuredResponseParams = {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  schema: JsonSchemaFormat;
};

type ResponsesApiResult = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

function extractOutputText(payload: ResponsesApiResult): string | null {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  for (const item of payload.output ?? []) {
    for (const contentItem of item.content ?? []) {
      if (typeof contentItem.text === "string" && contentItem.text.trim()) {
        return contentItem.text;
      }
    }
  }

  return null;
}

export async function createStructuredResponse<T>({
  model,
  systemPrompt,
  userPrompt,
  schema
}: StructuredResponseParams): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: userPrompt }]
        }
      ],
      text: {
        format: schema
      }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as ResponsesApiResult;
  const outputText = extractOutputText(payload);

  if (!outputText) {
    throw new Error("OpenAI response did not include structured text output.");
  }

  return JSON.parse(outputText) as T;
}
