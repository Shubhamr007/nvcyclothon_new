"""Small local server for the Saffron Route storefront and file uploads.

Run with: python3 server.py
Files are accepted only after a visitor explicitly selects or drops them in the browser.
"""
import cgi
import json
import os
import re
import uuid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 4173
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB per file
MAX_FILES = 10


def clean_filename(name):
    """Keep only a harmless basename and preserve a compact extension."""
    name = os.path.basename(name or "upload")
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    return name[:120] or "upload"


class AppHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/upload":
            self.send_error(404)
            return
        content_type = self.headers.get("Content-Type", "")
        if not content_type.startswith("multipart/form-data"):
            self.send_error(400, "Expected multipart form data")
            return
        form = cgi.FieldStorage(fp=self.rfile, headers=self.headers,
                                environ={"REQUEST_METHOD": "POST", "CONTENT_TYPE": content_type})
        # FieldStorage.getlist() returns file contents for uploads; retain the
        # FieldStorage objects themselves so filename and stream are available.
        fields = form["files"] if "files" in form else []
        entries = fields if isinstance(fields, list) else [fields]
        if not entries or len(entries) > MAX_FILES:
            self.send_error(400, "Upload between 1 and 10 files")
            return
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        saved = []
        for entry in entries:
            if not getattr(entry, "file", None) or not entry.filename:
                continue
            data = entry.file.read(MAX_FILE_SIZE + 1)
            if len(data) > MAX_FILE_SIZE:
                self.send_error(413, "Each file must be 25 MB or less")
                return
            filename = clean_filename(entry.filename)
            stored_name = f"{uuid.uuid4().hex}_{filename}"
            with open(os.path.join(UPLOAD_DIR, stored_name), "wb") as destination:
                destination.write(data)
            saved.append(stored_name)
        self.send_response(201)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"count": len(saved), "files": saved}).encode())


if __name__ == "__main__":
    print(f"Saffron Route is running at http://localhost:{PORT}")
    ThreadingHTTPServer(("", PORT), AppHandler).serve_forever()
