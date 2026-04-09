import type { TranslateRequest, TranslateResponse } from "@/lib/domain/api";

function detectLanguage(text: string) {
  const lowered = text.toLowerCase();
  const germanSignals = ["und", "kredit", "berechnung", "laufzeit", "bitte"];
  const germanMatches = germanSignals.filter((signal) => lowered.includes(signal));

  return germanMatches.length >= 2 ? "German" : "English";
}

export function buildMockTranslateResponse(
  input: TranslateRequest
): TranslateResponse {
  const detectedLanguage = detectLanguage(input.text);
  const normalizedText = input.text.replace(/\s+/g, " ").trim();

  if (input.mode === "business-to-technical") {
    return {
      sourceLanguageDetected: detectedLanguage,
      translatedText:
        input.targetLanguage === "German"
          ? `Technische Fassung: Die Anforderung wird als umsetzbare Arbeitspakete, Validierungsregeln und Verantwortlichkeiten fuer die Erweiterung des Kreditrechners beschrieben. Ausgangstext: ${normalizedText}`
          : `Technical framing: This request is expressed as implementation work covering calculation logic, validation behavior, UI changes, and ownership for the loan calculator extension. Source text: ${normalizedText}`,
      conciseExplanation:
        "Converted the text into a more implementation-oriented version while preserving the underlying business intent."
    };
  }

  if (input.mode === "technical-to-business") {
    return {
      sourceLanguageDetected: detectedLanguage,
      translatedText:
        input.targetLanguage === "German"
          ? `Business-Fassung: Die Arbeit wurde in eine managerfreundliche Beschreibung mit Fokus auf Umfang, Auswirkungen und Risiken fuer die Kreditrechner-Erweiterung umformuliert. Ausgangstext: ${normalizedText}`
          : `Business framing: The content is rewritten for managers with emphasis on scope, delivery impact, and visible risk around the loan calculator update. Source text: ${normalizedText}`,
      conciseExplanation:
        "Converted technical wording into a clearer business-facing summary suitable for manager review."
    };
  }

  return {
    sourceLanguageDetected: detectedLanguage,
    translatedText:
      input.targetLanguage === "German"
        ? `Normalisierte Fassung: ${normalizedText}`
        : `Normalized version: ${normalizedText}`,
    conciseExplanation:
      "Cleaned and standardized the wording into a clearer version in the requested target language."
  };
}
