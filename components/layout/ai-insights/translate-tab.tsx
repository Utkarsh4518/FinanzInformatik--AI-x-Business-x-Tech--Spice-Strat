"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  ApiItemResponse,
  TranslateRequest,
  TranslateResponse
} from "@/lib/domain/api";
import type { AppRole, Ticket } from "@/lib/domain/models";

type TranslateTabProps = {
  currentRole: AppRole;
  managerRawInput: string;
  selectedTicket: Ticket | null;
};

type TranslationSource = "manager-input" | "ticket-business" | "ticket-technical";

type SourceOption = {
  id: TranslationSource;
  text: string;
};

const sourceLabels: Record<TranslationSource, string> = {
  "manager-input": "Manager Raw Input",
  "ticket-business": "Selected Ticket Business Summary",
  "ticket-technical": "Selected Ticket Technical Summary"
};

const targetLanguageOptions: TranslateRequest["targetLanguage"][] = [
  "English",
  "German"
];

const roleCopy: Record<
  AppRole,
  {
    label: string;
    recommendedMode: TranslateRequest["mode"];
    recommendedSource: TranslationSource;
    summary: string;
  }
> = {
  manager: {
    label: "Manager",
    recommendedMode: "normalize",
    recommendedSource: "manager-input",
    summary:
      "Normalize messy multilingual notes into a cleaner manager-ready project brief."
  },
  analyst: {
    label: "Analyst",
    recommendedMode: "technical-to-business",
    recommendedSource: "ticket-technical",
    summary:
      "Turn implementation-heavy details into business-friendly scope and stakeholder language."
  },
  developer: {
    label: "Developer",
    recommendedMode: "business-to-technical",
    recommendedSource: "ticket-business",
    summary:
      "Translate business intent into implementation wording, dependencies, and delivery-ready detail."
  }
};

function resolvePreferredSource(
  preferredSource: TranslationSource,
  availableSources: SourceOption[]
) {
  if (availableSources.some((entry) => entry.id === preferredSource)) {
    return preferredSource;
  }

  return availableSources[0]?.id ?? "manager-input";
}

export function TranslateTab({
  currentRole,
  managerRawInput,
  selectedTicket
}: TranslateTabProps) {
  const availableSources = useMemo(() => {
    const sources: SourceOption[] = [];

    if (managerRawInput.trim()) {
      sources.push({ id: "manager-input", text: managerRawInput });
    }

    if (selectedTicket?.businessSummary.trim()) {
      sources.push({
        id: "ticket-business",
        text: selectedTicket.businessSummary
      });
    }

    if (selectedTicket?.technicalSummary.trim()) {
      sources.push({
        id: "ticket-technical",
        text: selectedTicket.technicalSummary
      });
    }

    return sources;
  }, [managerRawInput, selectedTicket]);

  const rolePreset = roleCopy[currentRole];
  const [source, setSource] = useState<TranslationSource>("manager-input");
  const [mode, setMode] = useState<TranslateRequest["mode"]>("normalize");
  const [targetLanguage, setTargetLanguage] =
    useState<TranslateRequest["targetLanguage"]>("English");
  const [result, setResult] = useState<TranslateResponse | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSource(resolvePreferredSource(rolePreset.recommendedSource, availableSources));
    setMode(rolePreset.recommendedMode);
    setResult(null);
    setError(null);
  }, [availableSources, rolePreset.recommendedMode, rolePreset.recommendedSource]);

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Role Translation Focus
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{rolePreset.summary}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {rolePreset.label} View
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-slate-50/90 p-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Recommended Source
            </div>
            <p className="mt-2 text-sm text-slate-700">
              {sourceLabels[resolvePreferredSource(rolePreset.recommendedSource, availableSources)]}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-slate-50/90 p-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Recommended Mode
            </div>
            <p className="mt-2 text-sm text-slate-700">{rolePreset.recommendedMode}</p>
          </div>
        </div>
      </div>

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
              {availableSources.length ? (
                availableSources.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {sourceLabels[entry.id]}
                  </option>
                ))
              ) : (
                <option value="manager-input">No source text available</option>
              )}
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
                <option value="normalize">normalize</option>
                <option value="business-to-technical">business-to-technical</option>
                <option value="technical-to-business">technical-to-business</option>
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
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Selected Text Preview
              </div>
              <button
                type="button"
                onClick={() => {
                  setSource(
                    resolvePreferredSource(rolePreset.recommendedSource, availableSources)
                  );
                  setMode(rolePreset.recommendedMode);
                  setResult(null);
                  setError(null);
                }}
                className="text-xs font-medium text-slate-600 transition hover:text-slate-900"
              >
                Use role defaults
              </button>
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
