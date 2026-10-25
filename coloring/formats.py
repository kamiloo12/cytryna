"""Trim sizes and Amazon KDP paperback rules used for coloring books.

All dimensions are in inches unless stated otherwise. Values follow the KDP
"Paperback manuscript formatting" and "Cover calculator" guidelines:
https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W7VL6
"""

from dataclasses import dataclass, asdict

DPI = 300
BLEED = 0.125

# Minimum KDP page count for a paperback and the max for B&W interiors.
MIN_PAGES = 24
MAX_PAGES = 828

# Spine text is allowed only for books with MORE than 79 pages.
SPINE_TEXT_MIN_PAGES = 80

# Paper thickness per page (inches) for black & white interiors.
PAPER_THICKNESS = {
    "white": 0.002252,
    "cream": 0.0025,
}

# Our margins on the outside edges (top, bottom, outer). KDP minimum is
# 0.25" without bleed; we use 0.5" so line art never gets near the cut.
OUTSIDE_MARGIN = 0.5
# Extra room added on top of the KDP minimum gutter.
GUTTER_SAFETY = 0.125


@dataclass(frozen=True)
class TrimSize:
    id: str
    width: float
    height: float
    label: str
    note: str

    @property
    def is_square(self) -> bool:
        return abs(self.width - self.height) < 0.01

    def to_dict(self) -> dict:
        d = asdict(self)
        d["is_square"] = self.is_square
        return d


# The most popular coloring-book trims on the US Amazon market.
TRIM_SIZES = [
    TrimSize("8.5x11", 8.5, 11.0, '8.5" x 11" (21,59 x 27,94 cm)',
             "Najpopularniejszy format kolorowanek w USA (US Letter)"),
    TrimSize("8.25x11", 8.25, 11.0, '8.25" x 11" (20,96 x 27,94 cm)',
             "Prawie Letter, często wybierany przy dużej liczbie stron"),
    TrimSize("8x10", 8.0, 10.0, '8" x 10" (20,32 x 25,4 cm)',
             "Popularny format książeczek dla dzieci"),
    TrimSize("8.5x8.5", 8.5, 8.5, '8.5" x 8.5" (21,59 x 21,59 cm)',
             "Kwadrat – kolorowanki dla maluchów"),
    TrimSize("8.25x8.25", 8.25, 8.25, '8.25" x 8.25" (20,96 x 20,96 cm)',
             "Kwadrat – nieco mniejszy"),
    TrimSize("7x10", 7.0, 10.0, '7" x 10" (17,78 x 25,4 cm)',
             "Zeszyty ćwiczeń i aktywności"),
    TrimSize("6x9", 6.0, 9.0, '6" x 9" (15,24 x 22,86 cm)',
             "Mała kolorowanka podróżna"),
]

TRIM_BY_ID = {t.id: t for t in TRIM_SIZES}


def get_trim(trim_id: str) -> TrimSize:
    try:
        return TRIM_BY_ID[trim_id]
    except KeyError:
        raise ValueError(f"Nieznany format: {trim_id}")


def kdp_min_inside_margin(page_count: int) -> float:
    """Minimum gutter (inside margin) required by KDP for a page count."""
    if page_count <= 150:
        return 0.375
    if page_count <= 300:
        return 0.5
    if page_count <= 500:
        return 0.625
    if page_count <= 700:
        return 0.75
    return 0.875


def inside_margin(page_count: int) -> float:
    return max(kdp_min_inside_margin(page_count) + GUTTER_SAFETY, OUTSIDE_MARGIN)


def spine_width(page_count: int, paper: str = "white") -> float:
    return page_count * PAPER_THICKNESS[paper]


def cover_size(trim: TrimSize, page_count: int, paper: str = "white") -> tuple[float, float]:
    """Full-wrap cover size (width, height) including bleed."""
    spine = spine_width(page_count, paper)
    width = BLEED + trim.width + spine + trim.width + BLEED
    height = BLEED + trim.height + BLEED
    return width, height


# Front matter: title page, copyright page, "This book belongs to", blank.
FRONT_MATTER_PAGES = 4


def interior_page_count(image_count: int) -> int:
    # Every coloring page is followed by a blank back page.
    return FRONT_MATTER_PAGES + 2 * image_count


def min_images() -> int:
    return -(-(MIN_PAGES - FRONT_MATTER_PAGES) // 2)


def max_images() -> int:
    return (MAX_PAGES - FRONT_MATTER_PAGES) // 2


def live_area(trim: TrimSize, page_count: int) -> tuple[float, float]:
    """Usable width/height inside margins for a coloring page."""
    w = trim.width - OUTSIDE_MARGIN - inside_margin(page_count)
    h = trim.height - 2 * OUTSIDE_MARGIN
    return w, h


def specs(trim: TrimSize, image_count: int, paper: str = "white") -> dict:
    pages = interior_page_count(image_count)
    cw, ch = cover_size(trim, pages, paper)
    lw, lh = live_area(trim, pages)
    return {
        "trim": trim.to_dict(),
        "image_count": image_count,
        "page_count": pages,
        "page_count_ok": MIN_PAGES <= pages <= MAX_PAGES,
        "bleed": "Bez spadu (No bleed) – wnętrze",
        "margins": {
            "outside": OUTSIDE_MARGIN,
            "top": OUTSIDE_MARGIN,
            "bottom": OUTSIDE_MARGIN,
            "inside": inside_margin(page_count=pages),
            "kdp_min_inside": kdp_min_inside_margin(pages),
        },
        "live_area": {"width": round(lw, 3), "height": round(lh, 3)},
        "paper": paper,
        "spine_width": round(spine_width(pages, paper), 4),
        "spine_text": pages >= SPINE_TEXT_MIN_PAGES,
        "cover": {"width": round(cw, 4), "height": round(ch, 4)},
        "dpi": DPI,
    }
