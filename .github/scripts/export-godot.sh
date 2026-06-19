#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <export-preset> <target>" >&2
  exit 64
fi

PRESET="$1"
TARGET="$2"

PROJECT_PATH="${PROJECT_PATH:-e-grid-2045}"
GODOT_VERSION="${GODOT_VERSION:-4.6.3}"
GODOT_STATUS="${GODOT_STATUS:-stable}"
GAME_NAME="${GAME_NAME:-E-Grid 2045}"
BUILD_ROOT="${BUILD_ROOT:-build}"
PACKAGE_ROOT="${PACKAGE_ROOT:-dist}"

VERSION_STRING="${GODOT_VERSION}-${GODOT_STATUS}"
TEMPLATE_VERSION="${GODOT_VERSION}.${GODOT_STATUS}"
DOWNLOAD_BASE="${GODOT_DOWNLOAD_BASE:-https://github.com/godotengine/godot-builds/releases/download/${VERSION_STRING}}"
GODOT_CACHE_DIR="${GODOT_CACHE_DIR:-${HOME}/.cache/egrid-godot/${VERSION_STRING}}"
GODOT_BIN="${GODOT_CACHE_DIR}/godot"
TEMPLATE_DIR="${HOME}/.local/share/godot/export_templates/${TEMPLATE_VERSION}"
ROOT_DIR="${GITHUB_WORKSPACE:-$(pwd)}"
PROJECT_ABS="$(cd "${ROOT_DIR}/${PROJECT_PATH}" && pwd)"
PACKAGE_DIR="${ROOT_DIR}/${PACKAGE_ROOT}"

sanitize_name() {
  local raw="$1"
  raw="${raw//\//-}"
  raw="${raw// /-}"
  printf '%s' "$raw" | tr -cd 'A-Za-z0-9._-'
}

install_godot() {
  mkdir -p "${GODOT_CACHE_DIR}"

  if [[ -x "${GODOT_BIN}" ]]; then
    "${GODOT_BIN}" --version
    return
  fi

  local archive="${GODOT_CACHE_DIR}/godot-linux.zip"
  local url="${DOWNLOAD_BASE}/Godot_v${VERSION_STRING}_linux.x86_64.zip"

  echo "Downloading Godot from ${url}"
  curl --fail --location --retry 3 --retry-delay 5 --output "${archive}" "${url}"
  unzip -q -o "${archive}" -d "${GODOT_CACHE_DIR}"

  local extracted
  extracted="$(find "${GODOT_CACHE_DIR}" -maxdepth 1 -type f -name "Godot_v${VERSION_STRING}_linux.x86_64*" | head -n 1)"
  if [[ -z "${extracted}" ]]; then
    echo "Could not find the Godot Linux binary in ${archive}" >&2
    exit 1
  fi

  mv "${extracted}" "${GODOT_BIN}"
  chmod +x "${GODOT_BIN}"
  "${GODOT_BIN}" --version
}

install_export_templates() {
  if [[ -d "${TEMPLATE_DIR}" ]] && [[ -n "$(find "${TEMPLATE_DIR}" -maxdepth 1 -type f -print -quit 2>/dev/null)" ]]; then
    echo "Using cached Godot export templates from ${TEMPLATE_DIR}"
    return
  fi

  mkdir -p "${GODOT_CACHE_DIR}"
  rm -rf "${TEMPLATE_DIR}" "${GODOT_CACHE_DIR}/templates"

  local archive="${GODOT_CACHE_DIR}/export_templates.tpz"
  local url="${DOWNLOAD_BASE}/Godot_v${VERSION_STRING}_export_templates.tpz"

  echo "Downloading Godot export templates from ${url}"
  curl --fail --location --retry 3 --retry-delay 5 --output "${archive}" "${url}"
  unzip -q -o "${archive}" -d "${GODOT_CACHE_DIR}"

  mkdir -p "${TEMPLATE_DIR}"
  cp -R "${GODOT_CACHE_DIR}/templates/." "${TEMPLATE_DIR}/"
}

case "${TARGET}" in
  linux)
    BUILD_DIR="${PROJECT_ABS}/${BUILD_ROOT}/linux"
    EXPORT_PATH="${BUILD_DIR}/${GAME_NAME}.x86_64"
    ;;
  windows)
    BUILD_DIR="${PROJECT_ABS}/${BUILD_ROOT}/windows"
    EXPORT_PATH="${BUILD_DIR}/${GAME_NAME}.exe"
    ;;
  macos)
    BUILD_DIR="${PROJECT_ABS}/${BUILD_ROOT}/macos"
    EXPORT_PATH="${BUILD_DIR}/${GAME_NAME}.zip"
    ;;
  web)
    BUILD_DIR="${PROJECT_ABS}/${BUILD_ROOT}/web"
    EXPORT_PATH="${BUILD_DIR}/index.html"
    ;;
  *)
    echo "Unsupported target: ${TARGET}" >&2
    exit 64
    ;;
esac

PACKAGE_BASENAME="$(sanitize_name "${PACKAGE_BASENAME:-e-grid-2045-${TARGET}}")"
if [[ -z "${PACKAGE_BASENAME}" ]]; then
  echo "PACKAGE_BASENAME is empty after sanitization" >&2
  exit 1
fi
PACKAGE_PATH="${PACKAGE_DIR}/${PACKAGE_BASENAME}.zip"

install_godot
install_export_templates

rm -rf "${BUILD_DIR}" "${PACKAGE_DIR}"
mkdir -p "${BUILD_DIR}" "${PACKAGE_DIR}"

echo "Importing Godot project at ${PROJECT_ABS}"
"${GODOT_BIN}" --headless --path "${PROJECT_ABS}" --import

echo "Exporting preset '${PRESET}' to ${EXPORT_PATH}"
"${GODOT_BIN}" --headless --path "${PROJECT_ABS}" --export-release "${PRESET}" "${EXPORT_PATH}"

if [[ "${TARGET}" == "linux" ]]; then
  chmod +x "${EXPORT_PATH}"
fi

if [[ "${TARGET}" == "web" ]]; then
  for required_file in index.html index.js index.pck index.wasm; do
    if [[ ! -f "${BUILD_DIR}/${required_file}" ]]; then
      echo "Missing expected Web export file: ${required_file}" >&2
      exit 1
    fi
  done
fi

if [[ "${TARGET}" == "macos" ]]; then
  cp "${EXPORT_PATH}" "${PACKAGE_PATH}"
else
  python3 - "${BUILD_DIR}" "${PACKAGE_PATH}" <<'PY'
import os
import sys
import zipfile

source, destination = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
    for root, _, files in os.walk(source):
        for filename in files:
            path = os.path.join(root, filename)
            arcname = os.path.relpath(path, source)
            info = zipfile.ZipInfo.from_file(path, arcname)
            with open(path, "rb") as handle:
                archive.writestr(info, handle.read(), zipfile.ZIP_DEFLATED)
PY
fi

echo "Created package: ${PACKAGE_PATH}"
