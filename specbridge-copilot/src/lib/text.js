const { BLOCKER_WORDS, QUESTION_WORDS } = require("../types/domain");

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractTextFromAdf(node) {
  if (!node) {
    return "";
  }

  if (typeof node === "string") {
    return node;
  }

  if (Array.isArray(node)) {
    return normalizeWhitespace(node.map(extractTextFromAdf).join("\n"));
  }

  const ownText = typeof node.text === "string" ? node.text : "";
  const children = Array.isArray(node.content) ? node.content.map(extractTextFromAdf).join("\n") : "";
  const separator = node.type === "paragraph" || node.type === "heading" || node.type === "listItem" ? "\n" : " ";

  return normalizeWhitespace([ownText, children].filter(Boolean).join(separator));
}

function buildAdfDocument(text) {
  const paragraphs = normalizeWhitespace(text)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      type: "paragraph",
      content: [{ type: "text", text: paragraph }]
    }));

  return {
    type: "doc",
    version: 1,
    content: paragraphs.length
      ? paragraphs
      : [
          {
            type: "paragraph",
            content: [{ type: "text", text: " " }]
          }
        ]
  };
}

function tokenize(text) {
  return normalizeWhitespace(text)
    .toLowerCase()
    .split(/[^a-z0-9+#.-]+/g)
    .filter((token) => token.length > 2);
}

function uniqueStrings(values) {
  return [...new Set((values || []).map((value) => normalizeWhitespace(value)).filter(Boolean))];
}

function extractQuestionCandidates(text) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return [];
  }

  return uniqueStrings(
    normalized
      .split(/\n|(?<=[?!.])/g)
      .map((line) => line.trim())
      .filter((line) => {
        if (!line) {
          return false;
        }

        const lower = line.toLowerCase();
        return line.includes("?") || QUESTION_WORDS.some((word) => lower.startsWith(`${word} `));
      })
  );
}

function findBlockers(text) {
  const lower = normalizeWhitespace(text).toLowerCase();
  return BLOCKER_WORDS.filter((word) => lower.includes(word));
}

function deterministicNumber(seed, min, max) {
  const normalized = String(seed || "specbridge");
  let hash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(index);
    hash |= 0;
  }

  const range = max - min + 1;
  return min + (Math.abs(hash) % range);
}

function toIsoNow() {
  return new Date().toISOString();
}

module.exports = {
  buildAdfDocument,
  deterministicNumber,
  extractQuestionCandidates,
  extractTextFromAdf,
  findBlockers,
  normalizeWhitespace,
  toIsoNow,
  tokenize,
  uniqueStrings
};
