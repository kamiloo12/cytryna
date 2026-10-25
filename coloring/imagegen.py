"""Image generation providers.

``openai`` uses the OpenAI Images API (gpt-image models). ``demo`` draws simple
placeholder line art locally so the whole pipeline can be tried without an
API key.
"""

import base64
import io
import math
import os
import random
import time

import requests
from PIL import Image, ImageDraw, ImageFont

from .fonts import FONT_REGULAR


class GenerationError(Exception):
    pass


def orientation_for(width: float, height: float) -> str:
    ratio = width / height
    if ratio > 1.15:
        return "landscape"
    if ratio < 0.87:
        return "portrait"
    return "square"


class OpenAIProvider:
    name = "openai"
    SIZES = {"portrait": "1024x1536", "landscape": "1536x1024", "square": "1024x1024"}

    def __init__(self, api_key: str, model: str, quality: str):
        self.api_key = api_key
        self.model = model
        self.quality = quality
        self.base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")

    def generate(self, prompt: str, orientation: str) -> Image.Image:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "size": self.SIZES[orientation],
            "quality": self.quality,
            "n": 1,
        }
        headers = {"Authorization": f"Bearer {self.api_key}"}
        last_error = None
        for attempt in range(4):
            try:
                resp = requests.post(
                    f"{self.base_url}/images/generations",
                    json=payload, headers=headers, timeout=300,
                )
            except requests.RequestException as e:
                last_error = f"Błąd połączenia: {e}"
                time.sleep(2 ** (attempt + 1))
                continue
            if resp.status_code == 200:
                return self._decode(resp.json())
            message = _error_message(resp)
            # Retry rate limits and server errors; anything else is final
            # (e.g. content policy, invalid key).
            if resp.status_code == 429 or resp.status_code >= 500:
                last_error = message
                time.sleep(2 ** (attempt + 2))
                continue
            raise GenerationError(message)
        raise GenerationError(last_error or "Nie udało się wygenerować obrazka")

    @staticmethod
    def _decode(data: dict) -> Image.Image:
        item = (data.get("data") or [{}])[0]
        if item.get("b64_json"):
            raw = base64.b64decode(item["b64_json"])
        elif item.get("url"):
            raw = requests.get(item["url"], timeout=120).content
        else:
            raise GenerationError("Odpowiedź API nie zawiera obrazka")
        img = Image.open(io.BytesIO(raw))
        img.load()
        return img


def _error_message(resp: requests.Response) -> str:
    try:
        err = resp.json().get("error", {})
        msg = err.get("message") or resp.text
    except ValueError:
        msg = resp.text
    return f"API {resp.status_code}: {msg[:500]}"


class DemoProvider:
    """Draws placeholder line art: random flowers, stars and clouds."""

    name = "demo"
    SIZES = {"portrait": (1024, 1536), "landscape": (1536, 1024), "square": (1024, 1024)}

    def generate(self, prompt: str, orientation: str, color: bool = False) -> Image.Image:
        w, h = self.SIZES[orientation]
        rnd = random.Random(prompt)
        bg = (255, 255, 255)
        img = Image.new("RGB", (w, h), bg)
        d = ImageDraw.Draw(img)
        line = 10
        palette = [(255, 196, 0), (255, 99, 132), (54, 162, 235), (75, 192, 120), (153, 102, 255)]

        if color:
            for y in range(h):
                t = y / h
                d.line([(0, y), (w, y)], fill=(int(120 + 100 * t), int(200 + 40 * t), 255))

        def fill():
            return rnd.choice(palette) if color else None

        # ground
        d.arc([-w // 2, int(h * 0.78), int(w * 1.5), int(h * 1.4)], 180, 360, fill="black", width=line)
        # sun
        cx, cy, r = int(w * 0.8), int(h * 0.15), int(min(w, h) * 0.08)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline="black", width=line, fill=fill())
        for k in range(10):
            a = 2 * math.pi * k / 10
            d.line([cx + math.cos(a) * r * 1.3, cy + math.sin(a) * r * 1.3,
                    cx + math.cos(a) * r * 1.8, cy + math.sin(a) * r * 1.8], fill="black", width=line)
        # clouds
        for _ in range(2):
            x, y = rnd.randint(60, w // 2), rnd.randint(80, int(h * 0.3))
            for dx, s in ((0, 60), (60, 80), (130, 60)):
                d.ellipse([x + dx - s, y - s, x + dx + s, y + s], outline="black", width=line,
                          fill=(255, 255, 255) if color else None)
        # flowers
        for _ in range(rnd.randint(3, 5)):
            fx = rnd.randint(120, w - 120)
            fy = rnd.randint(int(h * 0.5), int(h * 0.78))
            pr = rnd.randint(40, 70)
            d.line([fx, fy, fx, fy + int(h * 0.15)], fill="black", width=line)
            for k in range(6):
                a = 2 * math.pi * k / 6
                px, py = fx + math.cos(a) * pr, fy + math.sin(a) * pr
                d.ellipse([px - pr * 0.6, py - pr * 0.6, px + pr * 0.6, py + pr * 0.6],
                          outline="black", width=line, fill=fill())
            d.ellipse([fx - pr * 0.5, fy - pr * 0.5, fx + pr * 0.5, fy + pr * 0.5],
                      outline="black", width=line, fill=fill() or (255, 255, 255) if color else None)
        # star
        sx, sy, sr = int(w * 0.3), int(h * 0.38), int(min(w, h) * 0.12)
        pts = []
        for k in range(10):
            a = -math.pi / 2 + math.pi * k / 5
            rr = sr if k % 2 == 0 else sr * 0.45
            pts.append((sx + math.cos(a) * rr, sy + math.sin(a) * rr))
        d.polygon(pts, outline="black", width=line, fill=fill())

        if not color:
            font = ImageFont.truetype(FONT_REGULAR, 28)
            d.text((40, h - 60), "DEMO", fill="black", font=font)
        return img


def get_provider():
    provider = os.environ.get("IMAGE_PROVIDER", "").strip().lower()
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if provider == "demo" or (not provider and not api_key):
        return DemoProvider()
    if not api_key:
        raise GenerationError("Brak OPENAI_API_KEY – ustaw klucz albo IMAGE_PROVIDER=demo")
    return OpenAIProvider(
        api_key=api_key,
        model=os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-1"),
        quality=os.environ.get("OPENAI_IMAGE_QUALITY", "high"),
    )


def generate(prompt: str, orientation: str, color: bool = False) -> Image.Image:
    provider = get_provider()
    if isinstance(provider, DemoProvider):
        return provider.generate(prompt, orientation, color=color)
    return provider.generate(prompt, orientation)
