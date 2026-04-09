const STABILITY_THRESHOLD = 65;

const LIFECYCLE_ORDER = [
  "created",
  "analyzed",
  "recommended_assignee",
  "clarification_requested",
  "clarified",
  "assigned",
  "status_changed",
  "review_started",
  "changes_requested",
  "approved",
  "done",
];

const DOMAIN_KEYWORDS = {
  frontend: ["button", "page", "screen", "layout", "ui", "ux", "widget", "form", "frontend"],
  api: ["api", "endpoint", "contract", "webhook", "integration", "service", "schema"],
  data: ["report", "export", "sql", "database", "warehouse", "etl", "data", "dashboard"],
  auth: ["login", "permission", "oauth", "access", "role", "session", "authentication"],
  payments: ["payment", "billing", "invoice", "checkout", "pricing", "refund"],
  platform: ["deploy", "pipeline", "queue", "infrastructure", "config", "ops", "monitoring"]
};

const STACK_KEYWORDS = {
  react: ["react", "next.js", "nextjs", "component", "tailwind", "frontend", "ui"],
  node: ["node", "express", "typescript", "javascript", "resolver", "forge"],
  java: ["java", "spring", "kotlin", "jvm"],
  python: ["python", "fastapi", "django", "data"],
  cloud: ["aws", "queue", "lambda", "infrastructure", "deploy", "monitoring"],
  database: ["sql", "postgres", "mysql", "migration", "schema", "query"]
};

const VAGUE_PATTERNS = [
  /\bmaybe\b/gi,
  /\bsomehow\b/gi,
  /\betc\b/gi,
  /\basap\b/gi,
  /\bquick(ly)?\b/gi,
  /\beasy\b/gi,
  /\bimprove\b/gi,
  /\boptimi[sz]e\b/gi,
  /\bkind of\b/gi,
  /\bsomething\b/gi,
  /\bnice to have\b/gi
];

const QUESTION_WORDS = [
  "what",
  "why",
  "how",
  "when",
  "where",
  "who",
  "can",
  "could",
  "should",
  "would",
  "is",
  "are",
  "do",
  "does"
];

const BLOCKER_WORDS = ["blocked", "blocker", "dependency", "waiting", "cannot", "can't", "stuck"];

module.exports = {
  BLOCKER_WORDS,
  DOMAIN_KEYWORDS,
  LIFECYCLE_ORDER,
  QUESTION_WORDS,
  STACK_KEYWORDS,
  STABILITY_THRESHOLD,
  VAGUE_PATTERNS
};
