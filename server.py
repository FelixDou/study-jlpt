#!/usr/bin/env python3
import json
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PROGRESS_PATH = ROOT / "progress.json"


class ReviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path == "/api/progress":
            self.send_json(read_progress())
            return
        super().do_GET()

    def do_PUT(self):
        if self.path != "/api/progress":
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        length = int(self.headers.get("Content-Length", "0"))
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            self.send_error(HTTPStatus.BAD_REQUEST, "Invalid JSON")
            return

        if not isinstance(payload, dict):
            self.send_error(HTTPStatus.BAD_REQUEST, "Progress must be a JSON object")
            return

        write_progress(payload)
        self.send_json({"ok": True, "progress": payload})

    def send_json(self, payload):
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def read_progress():
    if not PROGRESS_PATH.exists():
        return {}
    try:
        with PROGRESS_PATH.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except (OSError, json.JSONDecodeError):
        return {}
    return payload if isinstance(payload, dict) else {}


def write_progress(payload):
    temp_path = PROGRESS_PATH.with_suffix(".json.tmp")
    with temp_path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2, sort_keys=True)
        file.write("\n")
    temp_path.replace(PROGRESS_PATH)


def main():
    server = ThreadingHTTPServer(("localhost", 8001), ReviewHandler)
    print("Serving JLPT Review on http://localhost:8001/")
    print(f"Progress file: {PROGRESS_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
