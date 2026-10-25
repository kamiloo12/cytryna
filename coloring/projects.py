"""Project storage on disk and background generation jobs."""

import json
import os
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from . import imagegen, prompts
from .cover import build_cover
from .formats import (get_trim, interior_page_count, live_area, max_images,
                      min_images, specs)
from .manuscript import build_interior

DATA_DIR = Path(os.environ.get("DATA_DIR", Path(__file__).resolve().parent.parent / "projects"))
WORKERS = int(os.environ.get("GENERATION_WORKERS", "3"))

_lock = threading.RLock()
_executor = ThreadPoolExecutor(max_workers=WORKERS)


def _dir(pid: str) -> Path:
    if not pid or not all(ch.isalnum() for ch in pid):
        raise KeyError(pid)
    return DATA_DIR / pid


def _save(project: dict) -> None:
    d = _dir(project["id"])
    d.mkdir(parents=True, exist_ok=True)
    tmp = d / "project.json.tmp"
    tmp.write_text(json.dumps(project, ensure_ascii=False, indent=2))
    tmp.replace(d / "project.json")


def load(pid: str) -> dict:
    path = _dir(pid) / "project.json"
    if not path.exists():
        raise KeyError(pid)
    with _lock:
        return json.loads(path.read_text())


def list_projects() -> list[dict]:
    if not DATA_DIR.exists():
        return []
    items = []
    for p in DATA_DIR.glob("*/project.json"):
        try:
            data = json.loads(p.read_text())
        except (OSError, ValueError):
            continue
        items.append({k: data.get(k) for k in ("id", "title", "theme", "format", "created_at")}
                     | {"image_count": len(data.get("images", []))})
    return sorted(items, key=lambda x: x.get("created_at") or 0, reverse=True)


def _update(pid: str, fn) -> dict:
    with _lock:
        project = load(pid)
        fn(project)
        _save(project)
        return project


def file_path(pid: str, name: str) -> Path:
    base = _dir(pid).resolve()
    path = (base / name).resolve()
    if base not in path.parents:
        raise KeyError(name)
    return path


def orientation(project: dict) -> str:
    trim = get_trim(project["format"])
    w, h = live_area(trim, interior_page_count(len(project["images"])))
    return imagegen.orientation_for(w, h)


def create(data: dict) -> dict:
    trim = get_trim(data.get("format", ""))
    theme = (data.get("theme") or "").strip()
    if not theme:
        raise ValueError("Podaj temat główny kolorowanki")
    try:
        count = int(data.get("count"))
    except (TypeError, ValueError):
        raise ValueError("Podaj liczbę obrazków")
    if not (min_images() <= count <= max_images()):
        raise ValueError(
            f"Liczba obrazków musi być w zakresie {min_images()}–{max_images()} "
            f"(KDP wymaga min. 24 stron)"
        )
    scenes = [str(s).strip() for s in (data.get("scenes") or [])][:count]
    scenes += [""] * (count - len(scenes))
    paper = data.get("paper") if data.get("paper") in ("white", "cream") else "white"
    age = data.get("age") if data.get("age") in prompts.AGE_GROUPS else prompts.DEFAULT_AGE

    pid = uuid.uuid4().hex[:12]
    project = {
        "id": pid,
        "created_at": time.time(),
        "title": (data.get("title") or theme).strip(),
        "subtitle": (data.get("subtitle") or "").strip(),
        "author": (data.get("author") or "").strip(),
        "description": (data.get("description") or "").strip(),
        "theme": theme,
        "age": age,
        "format": trim.id,
        "paper": paper,
        "with_cover": bool(data.get("with_cover", True)),
        "images": [
            {"index": i, "scene": s, "status": "pending", "error": None, "file": None, "version": 0}
            for i, s in enumerate(scenes)
        ],
        "cover": {"status": "pending" if data.get("with_cover", True) else "skipped",
                  "error": None, "file": None, "version": 0},
        "build": {"status": "idle", "error": None, "interior": None, "cover": None},
        "provider": imagegen.get_provider().name,
    }
    with _lock:
        _save(project)
    for i in range(count):
        _executor.submit(_generate_page, pid, i)
    if project["with_cover"]:
        _executor.submit(_generate_cover, pid)
    return project


def _generate_page(pid: str, index: int) -> None:
    def start(p):
        p["images"][index].update(status="generating", error=None)

    project = _update(pid, start)
    item = project["images"][index]
    aspect = orientation(project)
    prompt = prompts.page_prompt(project["theme"], item["scene"], project["age"], index, aspect)
    try:
        img = imagegen.generate(prompt, aspect)
        version = item["version"] + 1
        name = f"images/page_{index + 1:03d}_v{version}.png"
        path = file_path(pid, name)
        path.parent.mkdir(parents=True, exist_ok=True)
        img.save(path)
    except Exception as e:  # noqa: BLE001 - shown to the user
        _update(pid, lambda p: p["images"][index].update(status="error", error=str(e)))
        return

    def done(p):
        old = p["images"][index].get("file")
        p["images"][index].update(status="done", file=name, version=version, prompt=prompt)
        p["build"]["status"] = "stale" if p["build"]["status"] == "done" else p["build"]["status"]
        _remove(pid, old)

    _update(pid, done)


def _generate_cover(pid: str) -> None:
    project = _update(pid, lambda p: p["cover"].update(status="generating", error=None))
    trim = get_trim(project["format"])
    aspect = imagegen.orientation_for(trim.width, trim.height)
    prompt = prompts.cover_prompt(project["theme"], project["title"], project["age"], aspect)
    try:
        img = imagegen.generate(prompt, aspect, color=True)
        version = project["cover"]["version"] + 1
        name = f"images/cover_v{version}.png"
        path = file_path(pid, name)
        path.parent.mkdir(parents=True, exist_ok=True)
        img.save(path)
    except Exception as e:  # noqa: BLE001
        _update(pid, lambda p: p["cover"].update(status="error", error=str(e)))
        return

    def done(p):
        old = p["cover"].get("file")
        p["cover"].update(status="done", file=name, version=version)
        p["build"]["status"] = "stale" if p["build"]["status"] == "done" else p["build"]["status"]
        _remove(pid, old)

    _update(pid, done)


def _remove(pid: str, name: str | None) -> None:
    if name:
        try:
            file_path(pid, name).unlink(missing_ok=True)
        except KeyError:
            pass


def regenerate_page(pid: str, index: int, scene: str | None) -> dict:
    def mark(p):
        if not 0 <= index < len(p["images"]):
            raise KeyError(index)
        if p["images"][index]["status"] in ("pending", "generating"):
            raise ValueError("Ten obrazek jest właśnie generowany")
        if scene is not None:
            p["images"][index]["scene"] = scene.strip()
        p["images"][index].update(status="pending", error=None)

    project = _update(pid, mark)
    _executor.submit(_generate_page, pid, index)
    return project


def regenerate_cover(pid: str) -> dict:
    def mark(p):
        if p["cover"]["status"] in ("pending", "generating"):
            raise ValueError("Okładka jest właśnie generowana")
        p["with_cover"] = True
        p["cover"].update(status="pending", error=None)

    project = _update(pid, mark)
    _executor.submit(_generate_cover, pid)
    return project


def build(pid: str) -> dict:
    project = load(pid)
    missing = [i["index"] + 1 for i in project["images"] if i["status"] != "done"]
    if missing:
        raise ValueError(f"Nie wszystkie obrazki są gotowe (brakuje: {', '.join(map(str, missing))})")
    if project["build"]["status"] == "building":
        raise ValueError("Manuskrypt jest już budowany")
    project = _update(pid, lambda p: p["build"].update(status="building", error=None))
    _executor.submit(_build, pid)
    return project


def _build(pid: str) -> None:
    project = load(pid)
    try:
        images = [file_path(pid, i["file"]) for i in project["images"]]
        info = build_interior(project, images, file_path(pid, "interior.pdf"))
        cover_info = None
        if project["with_cover"]:
            cover_img = file_path(pid, project["cover"]["file"]) if project["cover"].get("file") else None
            cover_info = build_cover(project, info["page_count"], cover_img, file_path(pid, "cover.pdf"))
    except Exception as e:  # noqa: BLE001
        _update(pid, lambda p: p["build"].update(status="error", error=str(e)))
        return

    def done(p):
        p["build"].update(
            status="done", error=None, built_at=time.time(),
            interior="interior.pdf", cover="cover.pdf" if cover_info else None,
            interior_info=info, cover_info=cover_info,
        )

    _update(pid, done)


def with_specs(project: dict) -> dict:
    return project | {
        "specs": specs(get_trim(project["format"]), len(project["images"]), project["paper"])
    }


def resume_unfinished() -> None:
    """Re-queue work interrupted by a server restart."""
    for item in list_projects():
        pid = item["id"]
        project = load(pid)
        for img in project["images"]:
            if img["status"] in ("pending", "generating"):
                _executor.submit(_generate_page, pid, img["index"])
        if project["cover"]["status"] in ("pending", "generating"):
            _executor.submit(_generate_cover, pid)
        if project["build"]["status"] == "building":
            _executor.submit(_build, pid)
