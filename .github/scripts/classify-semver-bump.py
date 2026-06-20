#!/usr/bin/env python3
"""Classify a pull request as semver major/minor/patch and optionally sync the PR label.

The script is intentionally self-contained and only reads PR metadata/files through
GitHub's REST API. It should be run from trusted workflow code and must not rely
on executing files from the pull request payload itself.
"""

from __future__ import annotations

import json
import os
import re
import sys
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

API_ROOT = "https://api.github.com"
VERSION_LABELS = {
    "major": {
        "name": "semver:major",
        "color": "b60205",
        "description": "Breaking change; next release increments the major version.",
    },
    "minor": {
        "name": "semver:minor",
        "color": "0e8a16",
        "description": "New feature; next release increments the minor version.",
    },
    "patch": {
        "name": "semver:patch",
        "color": "1d76db",
        "description": "Fix, maintenance, docs, CI, or polish; next release increments the patch version.",
    },
}
LABEL_TO_BUMP = {meta["name"]: bump for bump, meta in VERSION_LABELS.items()}
SKIP_LABEL_VALUES = {"0", "false", "no", "off"}


@dataclass(frozen=True)
class Classification:
    bump: str
    reason: str


class GitHubApiError(RuntimeError):
    pass


def _request(
    method: str,
    url: str,
    token: str,
    payload: dict[str, Any] | None = None,
    *,
    allow_404: bool = False,
) -> tuple[Any, dict[str, str]]:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "e-grid-semver-labeler",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    request = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(request) as response:
            raw = response.read().decode("utf-8")
            body = json.loads(raw) if raw else None
            return body, dict(response.headers)
    except HTTPError as error:
        body = error.read().decode("utf-8")
        if allow_404 and error.code == 404:
            return None, dict(error.headers)
        raise GitHubApiError(f"{method} {url} failed with HTTP {error.code}: {body}") from error


def github_api(
    method: str,
    path: str,
    token: str,
    payload: dict[str, Any] | None = None,
    *,
    allow_404: bool = False,
) -> tuple[Any, dict[str, str]]:
    return _request(method, f"{API_ROOT}/{path.lstrip('/')}", token, payload, allow_404=allow_404)


def github_paginate(path: str, token: str) -> list[Any]:
    separator = "&" if "?" in path else "?"
    url = f"{API_ROOT}/{path.lstrip('/')}{separator}per_page=100"
    items: list[Any] = []

    while url:
        body, headers = _request("GET", url, token)
        if isinstance(body, list):
            items.extend(body)
        elif body is not None:
            items.append(body)

        next_url = None
        for chunk in headers.get("Link", "").split(","):
            match = re.match(r'\s*<([^>]+)>;\s*rel="next"\s*$', chunk)
            if match:
                next_url = match.group(1)
                break
        url = next_url

    return items


def normalize(value: str | None) -> str:
    return value or ""


def first_matching_regex(patterns: list[tuple[str, str]], text: str) -> str | None:
    for pattern, reason in patterns:
        if re.search(pattern, text, flags=re.IGNORECASE | re.MULTILINE):
            return reason
    return None


def explicit_override_from_metadata(title: str, body: str) -> Classification | None:
    """Return an explicit bump override only from a dedicated metadata line.

    This intentionally does not treat inline mentions such as `semver:major` in
    documentation or rule descriptions as an override.
    """
    candidates = [title, *body.splitlines()]
    override_pattern = re.compile(
        r"^\s*(?:semver|version|release|bump)(?:[-_ ]?bump)?\s*[:=]\s*(major|minor|patch)\s*$",
        flags=re.IGNORECASE,
    )
    for candidate in candidates:
        match = override_pattern.match(candidate.strip())
        if match:
            bump = match.group(1).lower()
            return Classification(bump, f"explicit PR metadata override: {candidate.strip()}")
    return None


def classify(pr: dict[str, Any], files: list[dict[str, Any]]) -> Classification:
    title = normalize(pr.get("title"))
    body = normalize(pr.get("body"))
    title_and_body = f"{title}\n{body}"
    scanned_files = "\n".join(
        f"{file.get('filename', '')}\n{file.get('status', '')}\n{normalize(file.get('patch'))}"
        for file in files
    )
    full_scan = f"{title_and_body}\n{scanned_files}"

    explicit_override = explicit_override_from_metadata(title, body)
    if explicit_override is not None:
        return explicit_override

    major_reason = first_matching_regex(
        [
            (r"\bBREAKING[ -_]CHANGE\b", "contains BREAKING CHANGE marker"),
            (r"^\s*[a-z][a-z0-9_-]*(?:\([^)]+\))?!:", "uses Conventional Commits breaking-change marker"),
            (r"\bsemver-major\b", "contains semver-major marker"),
            (r"\bbreaking\b", "mentions a breaking change"),
            (r"\bincompatible\b", "mentions an incompatible change"),
            (r"\bmigration\s+(?:required|obligatoire)\b", "mentions a required migration"),
            (r"\brupture\b", "mentions a rupture/breaking change"),
        ],
        full_scan,
    )
    if major_reason:
        return Classification("major", major_reason)

    minor_reason = first_matching_regex(
        [
            (r"^\s*(?:feat|feature)(?:\([^)]+\))?:", "uses a feature-style Conventional Commit title/body"),
            (r"\bsemver-minor\b", "contains semver-minor marker"),
            (r"\b(?:feature|new feature|nouvelle fonctionnalit[eé])\b", "mentions a new feature"),
            (r"\b(?:add|adds|added|adding|introduce|introduces|implement|implements|implemented)\b", "mentions adding or implementing functionality"),
            (r"\b(?:ajout|ajoute|ajouter|impl[eé]mente|impl[eé]mentation|nouveau|nouvelle)\b", "mentions adding or implementing functionality"),
        ],
        title_and_body,
    )
    if minor_reason:
        return Classification("minor", minor_reason)

    added_runtime_file = next(
        (
            file.get("filename", "")
            for file in files
            if file.get("status") == "added"
            and file.get("filename", "").startswith(("e-grid-2045/", "web-game/src/", "landing/"))
        ),
        None,
    )
    if added_runtime_file:
        return Classification("minor", f"adds runtime file {added_runtime_file}")

    patch_reason = first_matching_regex(
        [
            (r"^\s*(?:fix|bugfix|hotfix|perf|refactor|docs|doc|ci|build|chore|style|test)(?:\([^)]+\))?:", "uses a patch/maintenance-style Conventional Commit title/body"),
            (r"\bsemver-patch\b", "contains semver-patch marker"),
        ],
        title_and_body,
    )
    if patch_reason:
        return Classification("patch", patch_reason)

    return Classification("patch", "default fallback when no major/minor signal is detected")


def ensure_label(repository: str, token: str, bump: str) -> None:
    meta = VERSION_LABELS[bump]
    encoded_label = quote(meta["name"], safe="")
    existing, _ = github_api("GET", f"repos/{repository}/labels/{encoded_label}", token, allow_404=True)
    if existing is None:
        github_api(
            "POST",
            f"repos/{repository}/labels",
            token,
            {"name": meta["name"], "color": meta["color"], "description": meta["description"]},
        )


def sync_pr_label(repository: str, pr_number: str, token: str, bump: str) -> None:
    desired_label = VERSION_LABELS[bump]["name"]
    for label_bump in VERSION_LABELS:
        ensure_label(repository, token, label_bump)

    labels, _ = github_api("GET", f"repos/{repository}/issues/{pr_number}/labels", token)
    current_semver_labels = [label["name"] for label in labels if label.get("name") in LABEL_TO_BUMP]

    for label in current_semver_labels:
        if label != desired_label:
            github_api("DELETE", f"repos/{repository}/issues/{pr_number}/labels/{quote(label, safe='')}", token, allow_404=True)

    if desired_label not in current_semver_labels:
        github_api("POST", f"repos/{repository}/issues/{pr_number}/labels", token, {"labels": [desired_label]})


def write_outputs(classification: Classification) -> None:
    output_path = os.environ.get("GITHUB_OUTPUT")
    if output_path:
        with open(output_path, "a", encoding="utf-8") as output_file:
            output_file.write(f"bump={classification.bump}\n")
            output_file.write(f"label={VERSION_LABELS[classification.bump]['name']}\n")
            output_file.write(f"reason={classification.reason}\n")

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as summary_file:
            summary_file.write("## PR version bump label\n\n")
            summary_file.write(f"- Label: `{VERSION_LABELS[classification.bump]['name']}`\n")
            summary_file.write(f"- Reason: {classification.reason}\n")


def should_sync_labels() -> bool:
    return os.environ.get("SYNC_LABELS", "true").strip().lower() not in SKIP_LABEL_VALUES


def main() -> int:
    repository = os.environ.get("GITHUB_REPOSITORY", "").strip()
    pr_number = os.environ.get("PR_NUMBER", "").strip()
    token = os.environ.get("GITHUB_TOKEN", "").strip()

    if not repository or not pr_number or not token:
        print("GITHUB_REPOSITORY, PR_NUMBER and GITHUB_TOKEN are required.", file=sys.stderr)
        return 2

    pr, _ = github_api("GET", f"repos/{repository}/pulls/{pr_number}", token)
    files = github_paginate(f"repos/{repository}/pulls/{pr_number}/files", token)
    classification = classify(pr, files)

    if should_sync_labels():
        sync_pr_label(repository, pr_number, token, classification.bump)

    write_outputs(classification)

    print(f"Classified PR #{pr_number} as {VERSION_LABELS[classification.bump]['name']}: {classification.reason}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
