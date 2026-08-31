"""
Convert the diploma thesis .docx into a plain-text .md working copy so
Claude Code subagents (thesis-editor, reference-finder, structure-logic-reviewer)
can read/edit it as text. Word-specific formatting (styles, alignment, page
breaks, etc.) is NOT preserved -- that stays the user's job in Word.

Usage: python scripts/thesis-docx-to-md.py
Reads:  akedil-aidyn-diploma-thesis2.docx  (repo root)
Writes: akedil-aidyn-diploma-thesis2.md    (repo root)
"""
import re
import docx

ROOT = __import__("pathlib").Path(__file__).resolve().parent.parent
SRC = ROOT / "akedil-aidyn-diploma-thesis2.docx"
DST = ROOT / "akedil-aidyn-diploma-thesis2.md"

HEADING_RE = re.compile(r"^Heading (\d+)$")


def para_to_md(p):
    text = p.text.strip()
    if not text:
        return ""
    style = p.style.name if p.style else "Normal"
    m = HEADING_RE.match(style)
    if m:
        level = min(int(m.group(1)), 6)
        return f"{'#' * level} {text}"
    if style.startswith("List") or style.lower().startswith("bullet"):
        return f"- {text}"
    return text


def main():
    d = docx.Document(str(SRC))
    # one docx paragraph == one md paragraph, separated by a blank line,
    # so subagents can address/edit individual paragraphs unambiguously.
    blocks = [para_to_md(p) for p in d.paragraphs]
    blocks = [b for b in blocks if b != ""]
    DST.write_text("\n\n".join(blocks).strip() + "\n", encoding="utf-8")
    print(f"wrote {DST} ({len(blocks)} paragraphs)")


if __name__ == "__main__":
    main()
