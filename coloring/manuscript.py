"""Interior PDF (manuscript) for a KDP paperback coloring book.

Layout (no bleed, single pages, page 1 is a right-hand page):
  1  title page
  2  copyright page
  3  "This book belongs to"
  4  blank
  5  coloring page 1      (right-hand page, recto)
  6  blank                (back of the coloring page, so markers don't bleed through)
  7  coloring page 2
  ...
"""

import datetime
from pathlib import Path

from PIL import Image
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.pdfgen import canvas

from . import fonts
from .formats import (OUTSIDE_MARGIN, get_trim, inside_margin, interior_page_count,
                      live_area)
from .imaging import prepare_page

PT = 72  # points per inch


def _centered_lines(c, text, font, size, y, width, center_x, leading=1.25):
    lines = simpleSplit(text, font, size, width)
    c.setFont(font, size)
    for line in lines:
        c.drawCentredString(center_x, y, line)
        y -= size * leading
    return y


def build_interior(project: dict, image_paths: list[Path], out_path: Path) -> dict:
    fonts.register_pdf_fonts()
    trim = get_trim(project["format"])
    pages = interior_page_count(len(image_paths))
    page_w, page_h = trim.width * PT, trim.height * PT
    gutter = inside_margin(pages)
    live_w, live_h = live_area(trim, pages)

    c = canvas.Canvas(str(out_path), pagesize=(page_w, page_h), initialFontName=fonts.REGULAR)
    c.setTitle(project.get("title") or "Coloring Book")
    c.setAuthor(project.get("author") or "")
    c.setSubject(project.get("theme") or "")
    c.setCreator("Kolorowanki KDP")

    page_no = 0

    def box(recto: bool):
        """Left/bottom/width/height of the live area in points."""
        left = gutter if recto else OUTSIDE_MARGIN
        return left * PT, OUTSIDE_MARGIN * PT, live_w * PT, live_h * PT

    def finish_page():
        nonlocal page_no
        c.showPage()
        page_no += 1

    title = project.get("title") or "Coloring Book"
    subtitle = project.get("subtitle") or ""
    author = project.get("author") or ""

    # 1. Title page (recto)
    x, y, w, h = box(True)
    cx = x + w / 2
    ty = y + h * 0.66
    ty = _centered_lines(c, title, fonts.BOLD, min(44, w / 9), ty, w, cx)
    if subtitle:
        _centered_lines(c, subtitle, fonts.REGULAR, 18, ty - 18, w, cx)
    if author:
        _centered_lines(c, author, fonts.REGULAR, 16, y + h * 0.15, w, cx)
    finish_page()

    # 2. Copyright page (verso)
    x, y, w, h = box(False)
    year = datetime.date.today().year
    holder = author or title
    lines = [
        f"{title}",
        f"Copyright © {year} {holder}. All rights reserved.",
        "No part of this book may be reproduced, distributed, or transmitted in any form "
        "or by any means without the prior written permission of the publisher, "
        "except for personal, non-commercial coloring use.",
        "",
        "Tip: place a sheet of paper behind the page you are coloring.",
    ]
    ly = y + h * 0.3
    for line in lines:
        ly = _centered_lines(c, line, fonts.REGULAR, 9, ly, w, x + w / 2, leading=1.4) - 4
    finish_page()

    # 3. "This book belongs to" (recto)
    x, y, w, h = box(True)
    cx = x + w / 2
    c.setFont(fonts.BOLD, 30)
    c.drawCentredString(cx, y + h * 0.6, "This Book Belongs To")
    c.setLineWidth(2)
    c.line(x + w * 0.1, y + h * 0.45, x + w * 0.9, y + h * 0.45)
    c.roundRect(x + w * 0.05, y + h * 0.3, w * 0.9, h * 0.42, 24, stroke=1, fill=0)
    finish_page()

    # 4. Blank (verso)
    finish_page()

    # Coloring pages, each followed by a blank back side.
    for path in image_paths:
        x, y, w, h = box(True)
        with Image.open(path) as src:
            art = prepare_page(src, live_w, live_h)
        c.drawImage(ImageReader(art), x, y, width=w, height=h)
        finish_page()
        finish_page()

    c.save()
    assert page_no == pages, (page_no, pages)
    return {"page_count": pages, "inside_margin": gutter}
