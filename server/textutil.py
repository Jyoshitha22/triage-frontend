
"""Small pure helpers (no third-party imports, so they're easy to unit test)."""
import re


def split_text(text: str, limit: int = 900) -> list:
    """Split text into chunks <= limit characters at sentence boundaries.
    Sarvam's translate endpoint accepts at most 1000 characters per call."""
    text = (text or "").strip()
    if not text:
        return []
    if len(text) <= limit:
        return [text]
    sentences = re.split(r"(?<=[.!?\u0964\u0965])\s+", text)
    chunks, cur = [], ""
    for s in sentences:
        while len(s) > limit:
            cut = s.rfind(" ", 0, limit)
            cut = cut if cut > 0 else limit
            piece, s = s[:cut], s[cut:].lstrip()
            if cur:
                chunks.append(cur)
                cur = ""
            chunks.append(piece)
        if not s:
            continue
        if cur and len(cur) + 1 + len(s) > limit:
            chunks.append(cur)
            cur = s
        else:
            cur = f"{cur} {s}".strip()
    if cur:
        chunks.append(cur)
    return chunks