import os

genai = None
_genai_import_attempted = False


def _get_genai():
    global genai, _genai_import_attempted
    if not _genai_import_attempted:
        _genai_import_attempted = True
        try:
            import google.generativeai as imported_genai
            genai = imported_genai
        except ImportError:
            genai = None
    return genai


def _get_api_key() -> str | None:
    return os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")


def heavy_ai_enabled() -> bool:
    value = os.getenv("ENABLE_GEMINI")
    if value is None:
        return True # Default to true if key is present
    return value.strip().lower() in {"1", "true", "yes", "on"}


def gemini_available() -> bool:
    has_key = bool(_get_api_key())
    is_enabled = heavy_ai_enabled()
    has_module = _get_genai() is not None
    return has_key and is_enabled and has_module


def _configure_model():
    api_key = _get_api_key()
    genai_module = _get_genai()
    if not genai_module or not api_key:
        return None
    genai_module.configure(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    return genai_module.GenerativeModel(model_name)


def generate_text(prompt: str, *, temperature: float = 0.2, max_output_tokens: int = 512) -> str | None:
    model = _configure_model()
    if model is None:
        return None
    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": temperature,
            "max_output_tokens": max_output_tokens,
        },
    )
    text = getattr(response, "text", None)
    if text:
        return text.strip()
    return None
