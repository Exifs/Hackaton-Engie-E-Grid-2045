#!/usr/bin/env python3
import re
import sys
from pathlib import Path


BUILD_NUMBER = "001"
ROOT_DIR = Path(__file__).resolve().parents[2]
PROJECT_FILE = ROOT_DIR / "e-grid-2045" / "project.godot"
MENU_SCENE_FILE = ROOT_DIR / "e-grid-2045" / "scenes" / "main_menu.tscn"


def fail(message: str) -> None:
    print(f"sync-release-version: {message}", file=sys.stderr)
    raise SystemExit(1)


def normalize_version(raw_tag: str) -> str:
    tag = raw_tag.strip()
    if tag.startswith("refs/tags/"):
        tag = tag.removeprefix("refs/tags/")

    if not tag:
        fail("missing release tag")

    version = tag[1:] if tag[0] in {"v", "V"} else tag
    if not re.fullmatch(r"\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?", version):
        fail(f"unsupported release tag '{raw_tag}', expected vMAJOR.MINOR.PATCH")

    return version


def replace_once(path: Path, pattern: str, replacement: str) -> None:
    with path.open("r", encoding="utf-8", newline="") as handle:
        text = handle.read()

    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.MULTILINE)
    if count != 1:
        fail(f"expected exactly one match for {pattern!r} in {path}")

    if updated != text:
        with path.open("w", encoding="utf-8", newline="") as handle:
            handle.write(updated)


def main() -> None:
    if len(sys.argv) != 2:
        fail("usage: sync-release-version.py <tag>")

    version = normalize_version(sys.argv[1])
    display_text = f"V{version.upper()}:{BUILD_NUMBER}"

    replace_once(
        PROJECT_FILE,
        r'^config/version="[^"]*"',
        f'config/version="{version}"',
    )
    replace_once(
        PROJECT_FILE,
        r'^config/build_number="[^"]*"',
        f'config/build_number="{BUILD_NUMBER}"',
    )
    replace_once(
        MENU_SCENE_FILE,
        r'^display_text = "V[^"]*"',
        f'display_text = "{display_text}"',
    )

    print(f"Synced release version {version} ({display_text})")


if __name__ == "__main__":
    main()
