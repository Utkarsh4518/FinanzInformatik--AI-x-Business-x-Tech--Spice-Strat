from __future__ import annotations

import asyncio
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bridge.ai")

_gemini_key = os.getenv("GEMINI_API_KEY", "")
_openai_key = os.getenv("OPENAI_API_KEY", "")


def _has_gemini() -> bool:
    return bool(_gemini_key or os.getenv("GEMINI_API_KEY", ""))


def _has_openai() -> bool:
    return bool(_openai_key or os.getenv("OPENAI_API_KEY", ""))


GEMINI_MODELS = [
    "gemini-3.1-pro",
    "gemini-3-flash",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]

RETRYABLE_MARKERS = ("RESOURCE_EXHAUSTED", "429", "503", "UNAVAILABLE", "high demand")

# When a model ID is wrong or not enabled for the key, API often returns 404 / NOT_FOUND — try next model.
_GEMINI_TRY_NEXT_MODEL_MARKERS = (
    "404",
    "not found",
    "not_found",
    "NOT_FOUND",
    "does not exist",
    "invalid model",
    "unknown model",
    "model not found",
    "no such model",
    "is not supported for",
    "FAILED_PRECONDITION",
)


def _gemini_should_try_next_model(exc: BaseException) -> bool:
    err = str(exc).lower()
    return any(m.lower() in err for m in _GEMINI_TRY_NEXT_MODEL_MARKERS)


def _gemini_auth_fatal(exc: BaseException) -> bool:
    err = str(exc).lower()
    if "401" in err:
        return True
    if "api key" in err and ("invalid" in err or "not valid" in err):
        return True
    return False


def _sync_call_gemini(prompt: str) -> str:
    """Synchronous Gemini call -- runs in thread pool via asyncio.to_thread."""
    import time
    from google import genai

    key = os.getenv("GEMINI_API_KEY", _gemini_key)
    client = genai.Client(api_key=key)

    last_err: Exception | None = None
    for model_name in GEMINI_MODELS:
        for attempt in range(2):
            try:
                logger.info("Trying %s (attempt %d)", model_name, attempt + 1)
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                logger.info("Success with model: %s", model_name)
                return response.text or ""
            except Exception as exc:
                err_str = str(exc)
                logger.warning("Model %s attempt %d failed: %s", model_name, attempt + 1, err_str[:200])
                last_err = exc
                if _gemini_auth_fatal(exc):
                    raise
                if any(m in err_str for m in RETRYABLE_MARKERS):
                    if attempt == 0:
                        time.sleep(1)
                    continue
                if _gemini_should_try_next_model(exc):
                    logger.info("Skipping model %s (unavailable or 404), trying next", model_name)
                    break
                raise

    raise last_err or RuntimeError("All Gemini models failed")


async def _call_gemini(prompt: str) -> str:
    return await asyncio.wait_for(
        asyncio.to_thread(_sync_call_gemini, prompt),
        timeout=25,
    )


async def _call_openai(prompt: str) -> str:
    import httpx

    key = os.getenv("OPENAI_API_KEY", _openai_key)
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={
                "model": "gpt-3.5-turbo",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 1024,
            },
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def _call_llm(prompt: str) -> str:
    # 1) Manus (primary -- highest capability)
    try:
        from app.services.manus_service import _has_manus, call_manus
        if _has_manus():
            logger.info("Trying Manus (manus-1.6-max) as primary LLM")
            result = await call_manus(prompt, max_wait=90)
            if result:
                return result
            logger.warning("Manus returned empty/None, falling back to Gemini")
    except Exception as exc:
        logger.error("Manus call failed: %s; falling back to Gemini", str(exc)[:200])

    # 2) Gemini (fallback)
    try:
        if _has_gemini():
            return await _call_gemini(prompt)
        if _has_openai():
            return await _call_openai(prompt)
    except Exception as exc:
        logger.error("LLM fallback also failed: %s", str(exc)[:200])
    return _mock_response(prompt)


def _translate_llm_unavailable_fallback(text: str, target_audience: str) -> str:
    """When Gemini/OpenAI fails, never use generic _mock_response (it matched audience prompts)."""
    snippet = text.strip()[:2000]
    if not snippet:
        return "Translation unavailable: no source text and the AI service did not respond."
    if target_audience == "business":
        return (
            "The AI service could not complete this translation (check GEMINI_API_KEY, quotas, or model availability). "
            "Below is the original text in plain form so you still have the source:\n\n"
            f"{snippet}"
        )
    return (
        "The AI service could not complete this translation (check GEMINI_API_KEY, quotas, or model availability). "
        "Source text:\n\n"
        f"{snippet}"
    )


def _mock_response(prompt: str) -> str:
    lower = prompt.lower()

    if "impact" in lower or "roi" in lower:
        return (
            "The project delivers measurable business value: automated loan calculations "
            "reduce processing time by ~30%, eliminating manual spreadsheet errors. Customer "
            "satisfaction improves with faster approval turnaround. The tool integrates with "
            "existing workflows, requiring minimal training for staff. ROI is projected at "
            "2-3 months based on current processing volumes."
        )

    if "architecture" in lower or "tech stack" in lower or "setup" in lower:
        return (
            "The architecture follows a modular Python backend pattern:\n"
            "- Framework: FastAPI with async handlers\n"
            "- Validation: Pydantic schemas for all endpoints\n"
            "- Computation: Loan calculator module with amortization logic\n"
            "- Testing: pytest with parametrized test cases\n"
            "- Deployment: Docker-ready with uvicorn ASGI server\n\n"
            "To contribute: fork the repo, create a feature branch, submit a PR with tests."
        )

    if "jira" in lower or "ticket" in lower:
        return (
            "Here's a structured breakdown:\n\n"
            "TICKET-1: [Feature] Implement loan amortization calculator\n"
            "  - Acceptance: Given principal, rate, and term, returns monthly schedule\n"
            "  - Priority: High | Estimate: 3 story points\n\n"
            "TICKET-2: [Feature] Add API endpoint for rate comparison\n"
            "  - Acceptance: Compares up to 5 rates and returns optimal option\n"
            "  - Priority: Medium | Estimate: 2 story points\n\n"
            "TICKET-3: [Testing] Add edge case coverage for zero-interest loans\n"
            "  - Priority: Low | Estimate: 1 story point"
        )

    if "onboard" in lower or "new hire" in lower or "getting started" in lower:
        return (
            "Welcome to the project! Here's what you need to know:\n\n"
            "PURPOSE: We're building a loan calculation tool that automates financial "
            "computations for the company.\n\n"
            "FOR BUSINESS: Think of it as a smart calculator that removes manual work "
            "and speeds up loan approvals.\n\n"
            "FOR DEVELOPERS: Python/FastAPI backend, clean API design, good test coverage. "
            "Check the README for local setup instructions.\n\n"
            "KEY CONTACTS: Product owner manages requirements, tech lead handles architecture decisions."
        )

    return (
        "Based on the project context, this involves a modern web application with a "
        "Python backend designed for financial calculations. From a business perspective, "
        "it streamlines loan processing and reduces manual errors. From a technical "
        "perspective, it uses FastAPI with clean architecture patterns. I can explain "
        "any aspect in more detail -- just let me know if you'd like the business view "
        "or the technical deep-dive."
    )


_deepl_key = os.getenv("DEEPL_API_KEY", "")

DEEPL_LANG_MAP = {
    "en": "EN",
    "de": "DE",
    "fr": "FR",
    "es": "ES",
    "it": "IT",
    "nl": "NL",
    "pl": "PL",
    "pt": "PT-PT",
    "ja": "JA",
    "zh": "ZH",
}

LANG_NAMES = {"en": "English", "de": "German", "fr": "French", "es": "Spanish"}


async def _translate_with_deepl(text: str, source_lang: str, target_lang: str) -> str | None:
    """Primary translation via DeepL API Free (500k chars/month, best EN<->DE quality)."""
    import httpx

    key = os.getenv("DEEPL_API_KEY", _deepl_key)
    if not key:
        return None

    base_url = "https://api-free.deepl.com" if key.endswith(":fx") else "https://api.deepl.com"
    tgt = DEEPL_LANG_MAP.get(target_lang, target_lang.upper())
    src = DEEPL_LANG_MAP.get(source_lang, source_lang.upper())

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{base_url}/v2/translate",
                headers={
                    "Authorization": f"DeepL-Auth-Key {key}",
                    "Content-Type": "application/json",
                },
                json={
                    "text": [text],
                    "source_lang": src,
                    "target_lang": tgt,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                translations = data.get("translations", [])
                if translations and translations[0].get("text"):
                    logger.info("DeepL translation successful (%s -> %s)", src, tgt)
                    return translations[0]["text"]
            else:
                logger.warning("DeepL API returned %d: %s", resp.status_code, resp.text[:200])
    except Exception as exc:
        logger.warning("DeepL call failed: %s", str(exc)[:150])
    return None


async def _translate_with_mymemory(text: str, source_lang: str, target_lang: str) -> str | None:
    """Last-resort fallback via MyMemory free API."""
    import httpx

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.mymemory.translated.net/get",
                params={"q": text[:500], "langpair": f"{source_lang}|{target_lang}"},
            )
            if resp.status_code == 200:
                data = resp.json()
                translated = data.get("responseData", {}).get("translatedText")
                if translated and isinstance(translated, str):
                    return translated
    except Exception:
        pass
    return None


async def translate_language(
    text: str,
    source_language: str = "en",
    target_language: str = "de",
    audience: str | None = None,
) -> tuple[str, str]:
    """Translate text between languages (e.g. EN<->DE) with optional audience rewriting.

    Returns (translated_text, rewritten_text).
    Priority: DeepL (best quality) -> Gemini 3.1 -> MyMemory (free fallback).
    """
    src_name = LANG_NAMES.get(source_language, source_language)
    tgt_name = LANG_NAMES.get(target_language, target_language)

    if source_language == target_language:
        return text, text

    # 1) DeepL -- purpose-built translator, best quality
    translated = await _translate_with_deepl(text, source_language, target_language)

    # 2) Gemini fallback
    if not translated:
        logger.info("DeepL unavailable, falling back to Gemini for translation")
        translate_prompt = (
            f"You are a professional {src_name}-to-{tgt_name} translator.\n"
            f"Translate the following {src_name} text into {tgt_name}.\n"
            f"IMPORTANT: Your entire response must be in {tgt_name}. "
            f"Do NOT summarize, do NOT explain, do NOT add commentary. "
            f"Return ONLY the {tgt_name} translation.\n\n"
            f"{text}"
        )
        result = await _call_llm(translate_prompt)
        if result != _mock_response(translate_prompt):
            translated = result

    # 3) MyMemory last resort
    if not translated:
        translated = await _translate_with_mymemory(text, source_language, target_language)

    if not translated:
        translated = f"[{target_language}] {text}"

    # Audience rewrite via Gemini (keeps target language)
    rewritten = translated
    if audience == "business":
        rewrite_prompt = (
            f"Rewrite the following {tgt_name} text in plain, non-technical business language. "
            f"Focus on impact and outcomes. "
            f"IMPORTANT: Your entire response MUST remain in {tgt_name}. Do NOT switch to {src_name}. "
            f"Return concise {tgt_name} text only.\n\n"
            f"{translated}"
        )
        rewritten = await _call_llm(rewrite_prompt)
        if rewritten == _mock_response(rewrite_prompt):
            rewritten = translated
    elif audience == "developer":
        rewrite_prompt = (
            f"Rewrite the following {tgt_name} text in concrete developer language with technical terms. "
            f"IMPORTANT: Your entire response MUST remain in {tgt_name}. Do NOT switch to {src_name}. "
            f"Return concise {tgt_name} text only.\n\n"
            f"{translated}"
        )
        rewritten = await _call_llm(rewrite_prompt)
        if rewritten == _mock_response(rewrite_prompt):
            rewritten = translated

    return translated, rewritten


async def translate_text(text: str, target_audience: str, context: str | None = None) -> str:
    if target_audience == "business":
        prompt = (
            "You are a bridge between technical and business teams. "
            "Translate the following technical text into clear, non-technical business language. "
            "Focus on impact, value, and outcomes rather than implementation details. "
            "Keep it concise and professional.\n\n"
            "IMPORTANT: Provide the FULL translated text directly in your response. "
            "Do NOT say 'see attached' or 'the document is attached below'. "
            "Do NOT add meta-commentary about the translation process. "
            "Just provide the translated content itself.\n\n"
            f"Technical text:\n{text}"
        )
    else:
        prompt = (
            "You are a bridge between business and technical teams. "
            "Translate the following business description into precise technical language. "
            "Include relevant technical terms, architecture patterns, and implementation details.\n\n"
            "IMPORTANT: Provide the FULL translated text directly in your response. "
            "Do NOT say 'see attached' or 'the document is attached below'. "
            "Do NOT add meta-commentary about the translation process. "
            "Just provide the translated content itself.\n\n"
            f"Business text:\n{text}"
        )

    if context:
        prompt += f"\n\nAdditional context:\n{context}"

    try:
        from app.services.manus_service import _has_manus, call_manus
        if _has_manus():
            result = await call_manus(prompt, max_wait=90)
            if result and result.strip():
                return result.strip()
            logger.warning("translate_text: Manus returned empty, trying Gemini")
    except Exception as exc:
        logger.error("translate_text Manus error: %s", str(exc)[:200])

    try:
        if _has_gemini():
            result = (await _call_gemini(prompt)).strip()
            if result:
                return result
        if _has_openai():
            result = (await _call_openai(prompt)).strip()
            if result:
                return result
    except Exception as exc:
        logger.error("translate_text LLM fallback error: %s", str(exc)[:200])

    return _translate_llm_unavailable_fallback(text, target_audience)


async def chat_response(message: str, mode: str, context: str | None = None, history: list[dict] | None = None) -> str:
    persona = (
        "a friendly business analyst who explains things in plain, non-technical language with focus on impact and value"
        if mode == "business"
        else "a senior software engineer who gives precise technical explanations with relevant code patterns and architecture details"
    )

    prompt = (
        f"You are {persona}. You are part of 'synapse', a collaboration tool that helps "
        f"business and tech teams understand each other.\n\n"
        f"CRITICAL RULES:\n"
        f"- ALWAYS provide your full answer INLINE in your response. Never say 'see attached', "
        f"'the document is attached below', or reference any external documents.\n"
        f"- When asked to translate, summarize, or explain something, provide the ACTUAL "
        f"translated/summarized/explained content directly in your response.\n"
        f"- When asked about a project overview or what a project does, give a specific, "
        f"substantive answer based on the context provided. If context is available, use it. "
        f"If no context is available, ask the user to select a project first or give a "
        f"helpful general answer about synapse itself.\n"
        f"- Use markdown formatting (headers, bullet points, bold) to structure your response clearly.\n"
        f"- Be specific and actionable, never vague or meta.\n\n"
    )

    if context:
        prompt += f"Project context:\n{context}\n\n"

    if history:
        prompt += "Conversation so far:\n"
        for msg in history[-6:]:
            role = msg.get("role", "user")
            prompt += f"{role}: {msg.get('content', '')}\n"
        prompt += "\n"

    prompt += f"User message: {message}\n\nRespond helpfully, concisely, and with substance. Use markdown formatting."
    return await _call_llm(prompt)


async def generate_ticket_content(requirement: str, mode: str, context: str | None = None) -> tuple[str, str]:
    """Use LLM to generate a Jira ticket summary + description from a natural-language requirement.

    When context is provided (e.g. commit diffs, repo README), the AI uses it to produce
    a technically accurate and detailed ticket -- even from vague business language.
    """
    prompt = (
        "You are a senior project management assistant for 'synapse', a collaboration tool "
        "that helps business and tech teams work together.\n\n"
        "Your task: Convert a user's requirement into a professional Jira ticket.\n"
        "Generate:\n"
        "1. A concise, actionable summary (one line, max 80 chars)\n"
        "2. A detailed description with:\n"
        "   - Clear problem statement\n"
        "   - Acceptance criteria (bullet points)\n"
        "   - Technical implementation notes (based on context if available)\n"
        "   - Priority suggestion and estimated effort\n\n"
    )

    if mode == "business":
        prompt += (
            "The requirement comes from a BUSINESS user who may use non-technical language.\n"
            "Translate their intent into a proper technical ticket with clear developer instructions.\n"
            "Make the description actionable for developers while keeping the summary business-readable.\n"
        )
    else:
        prompt += (
            "The requirement comes from a DEVELOPER.\n"
            "Include technical details, API contracts, edge cases, and architecture notes.\n"
        )

    if context:
        prompt += (
            f"\n--- CODEBASE CONTEXT ---\n"
            f"Use this context to make the ticket specific and technically accurate. "
            f"Reference actual files, patterns, and code structure from the context below:\n\n"
            f"{context[:4000]}\n"
            f"--- END CONTEXT ---\n\n"
        )

    prompt += (
        f"\nUser's requirement:\n\"{requirement}\"\n\n"
        "Respond in EXACTLY this format (no markdown, no extra text):\n"
        "SUMMARY: <one line summary>\n"
        "DESCRIPTION: <multi-line description with acceptance criteria>"
    )

    raw = await _call_llm(prompt)

    summary = requirement[:80]
    description = raw

    for line in raw.split("\n"):
        if line.strip().upper().startswith("SUMMARY:"):
            summary = line.split(":", 1)[1].strip()[:80]
            break

    desc_start = raw.upper().find("DESCRIPTION:")
    if desc_start != -1:
        description = raw[desc_start + len("DESCRIPTION:"):].strip()

    return summary, description


async def explain_commit(
    commit_message: str,
    files_changed: list[dict],
    mode: str = "business",
) -> str:
    file_summaries = []
    for f in files_changed[:20]:
        patch = f.get("patch", "")[:800]
        file_summaries.append(
            f"- {f.get('filename', '?')} ({f.get('status', 'modified')}): "
            f"+{f.get('additions', 0)} -{f.get('deletions', 0)}\n{patch}"
        )
    files_text = "\n".join(file_summaries) if file_summaries else "(no file details available)"

    if mode == "business":
        prompt = (
            "You are a friendly business analyst explaining a software update to non-technical stakeholders.\n\n"
            "Given this commit (code update), explain:\n"
            "1. WHAT changed, in plain everyday language (no code jargon)\n"
            "2. WHY it matters -- impact on the product, users, or business\n"
            "3. Any risks or things to watch out for\n\n"
            "Keep it concise (3-5 bullet points). Use analogies if helpful.\n\n"
            f"Commit message: {commit_message}\n\n"
            f"Files changed:\n{files_text}"
        )
    else:
        prompt = (
            "You are a senior software engineer doing a code review.\n\n"
            "Analyze this commit and provide:\n"
            "1. Technical summary of the changes\n"
            "2. Architecture impact and design patterns used\n"
            "3. Potential issues, edge cases, or tech debt introduced\n"
            "4. Suggestions for improvement if any\n\n"
            "Be precise and use proper technical terminology.\n\n"
            f"Commit message: {commit_message}\n\n"
            f"Diff:\n{files_text}"
        )

    try:
        from app.services.manus_service import _has_manus, call_manus
        if _has_manus():
            result = await call_manus(prompt, max_wait=120)
            if result and result.strip():
                return result.strip()
            logger.warning("explain_commit: Manus returned empty, trying Gemini")
    except Exception as exc:
        logger.error("explain_commit Manus error: %s", str(exc)[:200])

    try:
        if _has_gemini():
            result = (await _call_gemini(prompt)).strip()
            if result:
                return result
        if _has_openai():
            result = (await _call_openai(prompt)).strip()
            if result:
                return result
    except Exception as exc:
        logger.error("explain_commit LLM fallback error: %s", str(exc)[:200])

    return (
        "AI explanation is currently unavailable. "
        f"This commit modified {len(files_changed)} file(s) with message: {commit_message[:200]}"
    )
