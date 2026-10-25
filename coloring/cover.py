"""Full-wrap paperback cover PDF (back + spine + front, with 0.125" bleed)."""

from pathlib import Path

from PIL import Image
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.pdfgen import canvas

from . import fonts
from .formats import (BLEED, SPINE_TEXT_MIN_PAGES, cover_size, get_trim,
                      spine_width)
from .imaging import average_color, cover_crop

PT = 72
SAFE = 0.375          # keep text this far from the trim line
SPINE_SAFE = 0.0625   # KDP: spine text needs 0.0625" on each side
BARCODE_W, BARCODE_H = 2.0, 1.2


def _rgb(color):
    return tuple(v / 255 for v in color)


def _darken(color, factor=0.55):
    return tuple(int(v * factor) for v in color)


def build_cover(project: dict, page_count: int, cover_image: Path | None, out_path: Path) -> dict:
    fonts.register_pdf_fonts()
    trim = get_trim(project["format"])
    paper = project.get("paper", "white")
    spine = spine_width(page_count, paper)
    total_w, total_h = cover_size(trim, page_count, paper)

    c = canvas.Canvas(str(out_path), pagesize=(total_w * PT, total_h * PT),
                      initialFontName=fonts.REGULAR)
    c.setTitle(f"{project.get('title', 'Coloring Book')} – cover")

    front_x = BLEED + trim.width + spine  # left edge of front trim area
    art = None
    base = (255, 214, 102)
    if cover_image and cover_image.exists():
        with Image.open(cover_image) as src:
            art = src.convert("RGB")
            base = average_color(art)
    back_color = _darken(base, 0.9)
    spine_color = _darken(base, 0.55)

    # Back panel (incl. left bleed) and spine background.
    c.setFillColorRGB(*_rgb(back_color))
    c.rect(0, 0, (BLEED + trim.width) * PT, total_h * PT, stroke=0, fill=1)
    c.setFillColorRGB(*_rgb(spine_color))
    c.rect((BLEED + trim.width) * PT, 0, spine * PT, total_h * PT, stroke=0, fill=1)

    # Front panel artwork extends into right/top/bottom bleed.
    front_w, front_h = trim.width + BLEED, trim.height + 2 * BLEED
    if art is not None:
        img = cover_crop(art, front_w, front_h)
        c.drawImage(ImageReader(img), front_x * PT, 0, width=front_w * PT, height=front_h * PT)
    else:
        c.setFillColorRGB(*_rgb(base))
        c.rect(front_x * PT, 0, front_w * PT, front_h * PT, stroke=0, fill=1)

    title = project.get("title") or "Coloring Book"
    subtitle = project.get("subtitle") or ""
    author = project.get("author") or ""

    # Front title on a translucent white band in the upper third.
    text_w = (trim.width - 2 * SAFE) * PT
    cx = (front_x + trim.width / 2) * PT
    title_size = min(48, text_w / 8)
    title_lines = simpleSplit(title, fonts.BOLD, title_size, text_w * 0.92)
    sub_lines = simpleSplit(subtitle, fonts.REGULAR, 20, text_w * 0.92) if subtitle else []
    band_h = len(title_lines) * title_size * 1.2 + len(sub_lines) * 26 + 36
    band_top = (BLEED + trim.height - SAFE) * PT
    c.saveState()
    c.setFillColorRGB(1, 1, 1)
    c.setFillAlpha(0.85)
    c.roundRect((front_x + SAFE) * PT, band_top - band_h, text_w, band_h, 18, stroke=0, fill=1)
    c.restoreState()
    c.setFillColorRGB(*_rgb(_darken(base, 0.35)))
    y = band_top - 18 - title_size
    c.setFont(fonts.BOLD, title_size)
    for line in title_lines:
        c.drawCentredString(cx, y, line)
        y -= title_size * 1.2
    y += title_size * 1.2 - 26 - 4
    c.setFont(fonts.REGULAR, 20)
    for line in sub_lines:
        c.drawCentredString(cx, y, line)
        y -= 26
    if author:
        c.saveState()
        c.setFillColorRGB(1, 1, 1)
        c.setFillAlpha(0.85)
        aw = c.stringWidth(author, fonts.BOLD, 16) + 32
        c.roundRect(cx - aw / 2, (BLEED + SAFE) * PT, aw, 30, 12, stroke=0, fill=1)
        c.restoreState()
        c.setFillColorRGB(*_rgb(_darken(base, 0.35)))
        c.setFont(fonts.BOLD, 16)
        c.drawCentredString(cx, (BLEED + SAFE) * PT + 10, author)

    # Spine text (only allowed for books with more than 79 pages).
    # Below ~5 pt the text is unreadable on a thin spine, so we skip it.
    usable = (spine - 2 * SPINE_SAFE) * PT
    size = min(18, usable * 0.75)
    spine_text = page_count >= SPINE_TEXT_MIN_PAGES and size >= 5
    if spine_text:
        label = f"{title}  \u2022  {author}" if author else title
        max_len = (trim.height - 2 * SAFE) * PT
        while size > 5 and c.stringWidth(label, fonts.BOLD, size) > max_len:
            size -= 0.5
        c.saveState()
        c.translate((BLEED + trim.width + spine / 2) * PT, total_h * PT / 2)
        c.rotate(-90)
        c.setFillColorRGB(1, 1, 1)
        c.setFont(fonts.BOLD, size)
        c.drawCentredString(0, -size * 0.35, label)
        c.restoreState()

    # Back cover: short description, barcode area left empty (bottom right).
    back_left = (BLEED + SAFE) * PT
    back_w = (trim.width - 2 * SAFE) * PT
    blurb = project.get("description") or (
        f"A fun coloring book for kids: {project.get('theme', '')}. "
        f"{len(project.get('images', []))} single-sided coloring pages with a blank back "
        "side, so markers won't bleed through."
    )
    c.setFillColorRGB(*_rgb(_darken(base, 0.25)))
    c.setFont(fonts.REGULAR, 14)
    y = (BLEED + trim.height - SAFE) * PT - 20
    for line in simpleSplit(blurb, fonts.REGULAR, 14, back_w):
        c.drawString(back_left, y, line)
        y -= 20

    # Visual hint where KDP will place the barcode (kept clear and white).
    bx = (BLEED + trim.width - SAFE - BARCODE_W) * PT
    by = (BLEED + SAFE) * PT
    c.setFillColorRGB(1, 1, 1)
    c.rect(bx, by, BARCODE_W * PT, BARCODE_H * PT, stroke=0, fill=1)

    c.save()
    return {
        "width": round(total_w, 4),
        "height": round(total_h, 4),
        "spine_width": round(spine, 4),
        "spine_text": spine_text,
    }
