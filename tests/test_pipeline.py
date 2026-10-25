"""End-to-end test in demo mode: create project, build PDFs, check KDP sizes."""

import os
import tempfile
import time
import unittest

os.environ["IMAGE_PROVIDER"] = "demo"
os.environ["DATA_DIR"] = tempfile.mkdtemp()

from pypdf import PdfReader  # noqa: E402

from app import app  # noqa: E402
from coloring.formats import get_trim, inside_margin, kdp_min_inside_margin  # noqa: E402


def wait(client, pid, done):
    for _ in range(600):
        p = client.get(f"/api/projects/{pid}").get_json()
        if done(p):
            return p
        time.sleep(0.1)
    raise AssertionError("timeout")


class PipelineTest(unittest.TestCase):
    def test_kdp_margins(self):
        self.assertEqual(kdp_min_inside_margin(24), 0.375)
        self.assertEqual(kdp_min_inside_margin(151), 0.5)
        self.assertEqual(kdp_min_inside_margin(828), 0.875)
        self.assertGreaterEqual(inside_margin(100), 0.375)

    def test_rejects_too_few_images(self):
        r = app.test_client().post("/api/projects", json={"format": "8.5x11", "theme": "x", "count": 5})
        self.assertEqual(r.status_code, 400)

    def test_build_book(self):
        c = app.test_client()
        r = c.post("/api/projects", json={
            "format": "8.5x11", "theme": "dinosaurs", "count": 40, "title": "Dino Fun",
            "author": "Test Press", "scenes": ["T-rex on a skateboard"], "paper": "white",
        })
        self.assertEqual(r.status_code, 201, r.get_json())
        pid = r.get_json()["id"]
        wait(c, pid, lambda p: all(i["status"] == "done" for i in p["images"])
             and p["cover"]["status"] == "done")
        self.assertEqual(c.post(f"/api/projects/{pid}/build").status_code, 200)
        p = wait(c, pid, lambda p: p["build"]["status"] in ("done", "error"))
        self.assertEqual(p["build"]["status"], "done", p["build"])

        interior = PdfReader(os.path.join(os.environ["DATA_DIR"], pid, "interior.pdf"))
        self.assertEqual(len(interior.pages), 84)
        for page in interior.pages:
            self.assertAlmostEqual(float(page.mediabox.width), 8.5 * 72, places=2)
            self.assertAlmostEqual(float(page.mediabox.height), 11 * 72, places=2)
        # Blank back pages carry no content.
        self.assertEqual(interior.pages[5].extract_text().strip(), "")
        self.assertIn("/XObject", interior.pages[4]["/Resources"])
        self.assertNotIn("/XObject", interior.pages[5].get("/Resources", {}))

        cover = PdfReader(os.path.join(os.environ["DATA_DIR"], pid, "cover.pdf"))
        trim = get_trim("8.5x11")
        spine = 84 * 0.002252
        self.assertAlmostEqual(float(cover.pages[0].mediabox.width) / 72,
                               0.25 + 2 * trim.width + spine, places=3)
        self.assertAlmostEqual(float(cover.pages[0].mediabox.height) / 72, 11.25, places=3)

        # All fonts embedded (KDP requirement).
        for path in ("interior.pdf", "cover.pdf"):
            reader = PdfReader(os.path.join(os.environ["DATA_DIR"], pid, path))
            for page in reader.pages:
                for font in (page.get("/Resources", {}).get("/Font") or {}).values():
                    font = font.get_object()
                    desc = font.get("/FontDescriptor") or font["/DescendantFonts"][0].get_object()["/FontDescriptor"]
                    desc = desc.get_object()
                    self.assertTrue(any(k in desc for k in ("/FontFile", "/FontFile2", "/FontFile3")))


if __name__ == "__main__":
    unittest.main()
