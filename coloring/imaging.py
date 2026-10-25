"""Image post-processing for print (300 DPI)."""

from PIL import Image, ImageOps

from .formats import DPI


def clean_line_art(img: Image.Image) -> Image.Image:
    """Grayscale, white background, solid black lines, light shading removed."""
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
        img = Image.alpha_composite(bg, img)
    gray = img.convert("L")
    gray = ImageOps.autocontrast(gray, cutoff=1)

    # Push near-white to white and dark to black, keep a short ramp in
    # between so upscaled edges stay smooth instead of jagged.
    lo, hi = 90, 200

    def level(v: int) -> int:
        if v <= lo:
            return 0
        if v >= hi:
            return 255
        return int((v - lo) * 255 / (hi - lo))

    return gray.point(level)


def crop_to_content(gray: Image.Image, pad_ratio: float = 0.02) -> Image.Image:
    """Trim empty white border so the art uses the full live area."""
    inverted = ImageOps.invert(gray)
    bbox = inverted.point(lambda v: 255 if v > 40 else 0).getbbox()
    if not bbox:
        return gray
    pad = int(max(gray.size) * pad_ratio)
    l, t, r, b = bbox
    return gray.crop((max(0, l - pad), max(0, t - pad),
                      min(gray.width, r + pad), min(gray.height, b + pad)))


def fit_to_box(img: Image.Image, box_w_in: float, box_h_in: float, fill=255) -> Image.Image:
    """Scale to fit (contain) a box at print DPI, centered on a blank canvas."""
    tw, th = round(box_w_in * DPI), round(box_h_in * DPI)
    scale = min(tw / img.width, th / img.height)
    nw, nh = max(1, round(img.width * scale)), max(1, round(img.height * scale))
    resized = img.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new(img.mode, (tw, th), fill)
    canvas.paste(resized, ((tw - nw) // 2, (th - nh) // 2))
    return canvas


def cover_crop(img: Image.Image, box_w_in: float, box_h_in: float) -> Image.Image:
    """Scale to fill (cover) a box at print DPI, cropping the overflow."""
    tw, th = round(box_w_in * DPI), round(box_h_in * DPI)
    return ImageOps.fit(img.convert("RGB"), (tw, th), Image.LANCZOS)


def prepare_page(img: Image.Image, box_w_in: float, box_h_in: float) -> Image.Image:
    art = crop_to_content(clean_line_art(img))
    return fit_to_box(art, box_w_in, box_h_in)


def average_color(img: Image.Image) -> tuple[int, int, int]:
    small = img.convert("RGB").resize((1, 1), Image.LANCZOS)
    return small.getpixel((0, 0))

