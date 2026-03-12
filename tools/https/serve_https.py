from __future__ import annotations

import argparse
import ssl
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Serve a directory over HTTPS.")
    parser.add_argument("--host", default="0.0.0.0", help="Host or IP to bind.")
    parser.add_argument("--port", default=8443, type=int, help="TCP port to bind.")
    parser.add_argument("--dir", default=".", help="Directory to serve.")
    parser.add_argument("--cert", required=True, help="Path to the TLS certificate.")
    parser.add_argument("--key", required=True, help="Path to the TLS private key.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    directory = Path(args.dir).resolve()
    cert_path = Path(args.cert).resolve()
    key_path = Path(args.key).resolve()

    if not directory.exists():
        raise SystemExit(f"Directory not found: {directory}")
    if not cert_path.exists():
        raise SystemExit(f"Certificate not found: {cert_path}")
    if not key_path.exists():
        raise SystemExit(f"Private key not found: {key_path}")

    handler_class = partial(SimpleHTTPRequestHandler, directory=str(directory))
    httpd = ThreadingHTTPServer((args.host, args.port), handler_class)

    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile=str(cert_path), keyfile=str(key_path))
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

    print(f"Serving {directory} over HTTPS on https://{args.host}:{args.port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping HTTPS server.")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
