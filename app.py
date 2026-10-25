"""Kolorowanki KDP – web app for generating children's coloring books."""

import os
from pathlib import Path

from flask import Flask, jsonify, render_template, request, send_file


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env(Path(__file__).resolve().parent / ".env")

from coloring import imagegen, projects, prompts  # noqa: E402
from coloring.formats import (MIN_PAGES, TRIM_SIZES, get_trim, max_images,  # noqa: E402
                              min_images, specs)

app = Flask(__name__)


@app.errorhandler(KeyError)
def not_found(_e):
    return jsonify(error="Nie znaleziono"), 404


@app.errorhandler(ValueError)
def bad_request(e):
    return jsonify(error=str(e)), 400


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/config")
def config():
    try:
        provider = imagegen.get_provider().name
        provider_error = None
    except imagegen.GenerationError as e:
        provider, provider_error = None, str(e)
    return jsonify(
        formats=[t.to_dict() for t in TRIM_SIZES],
        ages=[{"id": k, "label": v["label"]} for k, v in prompts.AGE_GROUPS.items()],
        default_age=prompts.DEFAULT_AGE,
        min_images=min_images(),
        max_images=max_images(),
        min_pages=MIN_PAGES,
        provider=provider,
        provider_error=provider_error,
        model=os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-1") if provider == "openai" else None,
    )


@app.get("/api/specs")
def get_specs():
    trim = get_trim(request.args.get("format", "8.5x11"))
    count = int(request.args.get("count", min_images()))
    paper = request.args.get("paper", "white")
    if paper not in ("white", "cream"):
        paper = "white"
    return jsonify(specs(trim, count, paper))


@app.get("/api/projects")
def list_projects():
    return jsonify(projects.list_projects())


@app.post("/api/projects")
def create_project():
    project = projects.create(request.get_json(force=True) or {})
    return jsonify(projects.with_specs(project)), 201


@app.get("/api/projects/<pid>")
def get_project(pid):
    return jsonify(projects.with_specs(projects.load(pid)))


@app.post("/api/projects/<pid>/images/<int:index>/regenerate")
def regenerate_image(pid, index):
    data = request.get_json(silent=True) or {}
    return jsonify(projects.with_specs(projects.regenerate_page(pid, index, data.get("scene"))))


@app.post("/api/projects/<pid>/cover/regenerate")
def regenerate_cover(pid):
    return jsonify(projects.with_specs(projects.regenerate_cover(pid)))


@app.post("/api/projects/<pid>/build")
def build(pid):
    return jsonify(projects.with_specs(projects.build(pid)))


@app.get("/api/projects/<pid>/files/<path:name>")
def get_file(pid, name):
    path = projects.file_path(pid, name)
    if not path.is_file():
        raise KeyError(name)
    download = request.args.get("download") == "1"
    project = projects.load(pid)
    slug = "".join(ch if ch.isalnum() else "-" for ch in project["title"]).strip("-")[:60] or "coloring-book"
    return send_file(path, as_attachment=download,
                     download_name=f"{slug}-{path.name}" if download else None)


if __name__ == "__main__":
    projects.resume_unfinished()
    app.run(host=os.environ.get("HOST", "127.0.0.1"), port=int(os.environ.get("PORT", "5000")),
            debug=False, threaded=True)
