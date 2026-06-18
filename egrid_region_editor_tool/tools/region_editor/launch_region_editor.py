#!/usr/bin/env python3
"""Launch a local HTTP server for the E-Grid Region Shape Editor."""
from __future__ import annotations

import functools
import http.server
import socketserver
import threading
import webbrowser
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parents[2]
PORT = 8765


def main() -> None:
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(PACKAGE_ROOT))
    with socketserver.TCPServer(("127.0.0.1", PORT), handler) as httpd:
        url = f"http://127.0.0.1:{PORT}/tools/region_editor/region_shape_editor.html"
        print(f"Serving {PACKAGE_ROOT}")
        print(f"Open {url}")
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
