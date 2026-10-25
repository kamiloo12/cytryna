"""Bundled TrueType fonts. KDP requires all fonts to be embedded in the PDF,
so we never use the non-embedded PDF base-14 fonts."""

from pathlib import Path

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONT_DIR = Path(__file__).resolve().parent.parent / "fonts"
FONT_REGULAR = str(FONT_DIR / "DejaVuSans.ttf")
FONT_BOLD = str(FONT_DIR / "DejaVuSans-Bold.ttf")

REGULAR = "BookSans"
BOLD = "BookSans-Bold"

_registered = False


def register_pdf_fonts() -> None:
    global _registered
    if _registered:
        return
    pdfmetrics.registerFont(TTFont(REGULAR, FONT_REGULAR))
    pdfmetrics.registerFont(TTFont(BOLD, FONT_BOLD))
    _registered = True
