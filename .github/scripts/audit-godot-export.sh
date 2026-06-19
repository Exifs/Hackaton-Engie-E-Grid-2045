#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 4 ]]; then
  echo "Usage: $0 <godot-bin> <project-abs> <build-dir> <target>" >&2
  exit 64
fi

GODOT_BIN="$1"
PROJECT_ABS="$2"
BUILD_DIR="$3"
TARGET="$4"

REQUIRED_SOURCE_PATHS=(
  "data/buildings.csv"
  "data/tutorial_first_loop.json"
  "scenes/ui/game/e_grid_build_palette.tscn"
  "scenes/ui/tutorial/TutorialOverlay.tscn"
  "scripts/ui/game/e_grid_build_palette.gd"
  "scripts/tutorial/TutorialManager.gd"
  "scripts/ui/tutorial/TutorialHighlighter.gd"
  "scripts/ui/tutorial/TutorialOverlay.gd"
)

python3 - "${PROJECT_ABS}" "${REQUIRED_SOURCE_PATHS[@]}" <<'PY'
import os
import sys

project = sys.argv[1]
failures = []

for relative in sys.argv[2:]:
    current = project
    for part in relative.split("/"):
        try:
            entries = os.listdir(current)
        except OSError as exc:
            failures.append(f"{relative}: cannot list {current}: {exc}")
            break
        if part not in entries:
            matches = [entry for entry in entries if entry.lower() == part.lower()]
            hint = f" (case differs: {matches[0]})" if matches else ""
            failures.append(f"{relative}: missing exact path component {part}{hint}")
            break
        current = os.path.join(current, part)

if failures:
    for failure in failures:
        print(f"Export source case audit failed: {failure}", file=sys.stderr)
    sys.exit(1)
PY

TMP_DIR=""
cleanup() {
  if [[ -n "${TMP_DIR}" && -d "${TMP_DIR}" ]]; then
    rm -rf "${TMP_DIR}"
  fi
}
trap cleanup EXIT

find_pck() {
  local search_root="$1"
  find "${search_root}" -type f -name '*.pck' | sort | head -n 1
}

PCK_PATH="$(find_pck "${BUILD_DIR}")"
if [[ -z "${PCK_PATH}" ]]; then
  archive="$(find "${BUILD_DIR}" -maxdepth 1 -type f -name '*.zip' | sort | head -n 1)"
  if [[ -n "${archive}" ]]; then
    TMP_DIR="$(mktemp -d)"
    unzip -q "${archive}" -d "${TMP_DIR}"
    PCK_PATH="$(find_pck "${TMP_DIR}")"
  fi
fi

if [[ -z "${PCK_PATH}" ]]; then
  echo "No .pck found for exported ${TARGET} build in ${BUILD_DIR}" >&2
  exit 1
fi

echo "Auditing exported ${TARGET} pack: ${PCK_PATH}"
"${GODOT_BIN}" --headless --main-pack "${PCK_PATH}" --script "res://scripts/test/e_grid_export_runtime_smoke_test.gd" -- --egrid-export-diagnostics
