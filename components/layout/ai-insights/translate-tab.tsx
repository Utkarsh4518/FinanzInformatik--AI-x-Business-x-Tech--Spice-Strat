"use client";

import { useEffect, useMemo, useState } from "react";

import type { ApiItemResponse, TranslateRequest, TranslateResponse } from "@/lib/domain/api";
import type { Ticket } from "@/lib/domain/models";

type TranslateTabProps = {
  managerRawInput: string;
  selectedTicket: Ticket | null;
};

type TranslationSource = "manager-input" | "ticket-business" | "ticket-technical";

const sourceLabels: Record<TranslationSource, string> = {
  "manager-input": "Manager Raw Input",
  "ticket-business": "Selected Ticket Business Summary",
  "ticket-technical": "Selected Ticket Technical Summary"
};

const modeOptions: TranslateRequest["mode"][] = [
  "normalize",
  "business-to-technical",
  "technical-to-business"
];

const targetLanguageOptions: TranslateRequest["targetLanguage"][] = [
  "English",
  "German"
];

export function TranslateTab({
  managerRawInput,
  selectedTicket
}: TranslateTabProps) {
  const availableSources = useMemo(() => {
    const sources: { id: TranslationSource; text: string }[] = [
      { id: "manager-input", text: managerRawInput }
    ];

    if (selectedTicket?.businessSummary) {
      sources.push({
        id: "ticket-business",
        text: selectedTicket.businessSummary
      });
    }

    if (selectedTicket?.technicalSummary) {
      sources.push({
        id: "ticket-technical",
        text: selectedTicket.technicalSummary
      });
    }

    return sources;
  }, [managerRawInput, selectedTicket]);

  const [source, setSource] = useState<TranslationSource>("manager-input");
  const [mode, setMode] = useState<TranslateRequest["mode"]>("normalize");
  const [targetLanguage, setTargetLanguage] =
    useState<TranslateRequest["targetLanguage"]>("English");
  const [result, setResult] = useState<TranslateResponse | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!availableSources.some((entry) => entry.id === source)) {
      setSource(availableSources[0]?.id ?? "manager-input");
    }
  }, [availableSources, source]);

  const selectedSourceText =
    availableSources.find((entry) => entry.id === source)?.text ?? "";

  async function handleTranslate() {
    if (!selectedSourceText.trim()) {
      setError("Select a source with available text before translating.");
      return;
    }

    try {
      setIsTranslating(true);
      setError(null);

      const response = await fetch("/api/ai/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: selectedSourceText,
          targetLanguage,
          mode
        } satisfies TranslateRequest)
      });

      if (!response.ok) {
        throw new Error("Translation request failed.");
      }

      const payload = (await response.json()) as ApiItemResponse<TranslateResponse>;
      setResult(payload.data);
    } catch (translateError) {
      setError(
        translateError instanceof Error
          ? translateError.message
          : "Translation request failed."
      );
    } finally {
      setIsTranslating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white/95 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Translate Source
        </div>

        <div className="mt-4 grid gap-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Source Content
            </span>
            <select
              value={source}
              onChange={(event) => setSource(event.target.value as TranslationSource)}
              className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
            >
              {availableSources.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {sourceLabels[entry.id]}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Mode
              </span>
              <select
                value={mode}
                onChange={(event) =>
                  setMode(event.target.value as TranslateRequest["mode"])
                }
                className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                {modeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Target Language
              </span>
              <select
                value={targetLanguage}
                onChange={(event) =>
                  setTargetLanguage(
                    event.target.value as TranslateRequest["targetLanguage"]
                  )
                }
                className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                {targetLanguageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-line bg-slate-50/90 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Selected Text Preview
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {selectedSourceText || "No source text available."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleTranslate()}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {isTranslating ? "Translating..." : "Translate"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="rounded-2xl border border-line bg-white/95 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Translation Result
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Source: {result.sourceLanguageDetected}
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-line bg-slate-50/90 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Translated Text
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {result.translatedText}
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-line bg-slate-50/90 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Explanation
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {result.conciseExplanation}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
