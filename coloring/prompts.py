"""Prompt templates for coloring pages and covers."""

AGE_GROUPS = {
    "toddler": {
        "label": "Maluchy (2–4 lata)",
        "style": (
            "extremely simple design for toddlers, very thick bold outlines, "
            "a few big shapes, large areas to color, minimal background, "
            "cute and friendly"
        ),
    },
    "kids": {
        "label": "Dzieci (4–8 lat)",
        "style": (
            "simple design for young kids, thick clean outlines, "
            "medium-large areas to color, light simple background, "
            "cute cartoon style"
        ),
    },
    "older": {
        "label": "Starsze dzieci (8–12 lat)",
        "style": (
            "more detailed design for older kids, clean medium-weight outlines, "
            "more elements and a full background, still clear closed shapes"
        ),
    },
}

DEFAULT_AGE = "kids"


def page_prompt(theme: str, scene: str, age: str, index: int, aspect: str) -> str:
    style = AGE_GROUPS.get(age, AGE_GROUPS[DEFAULT_AGE])["style"]
    scene = scene.strip() or f"a fun scene #{index + 1} related to the theme"
    return (
        "Black and white coloring book page for children. "
        f"Main theme: {theme.strip()}. "
        f"Scene: {scene}. "
        f"Style: {style}. "
        "Pure black line art on a pure white background. "
        "No color, no gray, no shading, no gradients, no hatching, no filled black areas. "
        "All shapes closed so they are easy to color. "
        "No text, no letters, no numbers, no signature, no watermark, no border or frame. "
        f"{aspect} composition, the whole subject fits inside the image with white space around it."
    )


def cover_prompt(theme: str, title: str, age: str, aspect: str) -> str:
    style = AGE_GROUPS.get(age, AGE_GROUPS[DEFAULT_AGE])["style"]
    return (
        "Front cover illustration for a children's coloring book, "
        f"theme: {theme.strip()}. "
        "Bright, cheerful, full-color cartoon illustration with bold outlines, "
        f"matching the inside pages ({style}). "
        "Leave calm, uncluttered space in the upper third for a title that will be added later. "
        "Do not draw any text, letters, numbers, logos or watermarks. "
        f"{aspect} composition, artwork fills the whole image edge to edge."
    )
