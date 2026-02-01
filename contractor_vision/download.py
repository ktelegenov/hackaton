from __future__ import annotations

import hashlib
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional
from urllib.parse import urlparse

import requests


@dataclass(frozen=True)
class DownloadedImage:
    source_url: str
    local_path: Path
    alt: Optional[str] = None
    is_floorplan: bool = False


def _safe_extension(url: str) -> str:
    parsed = urlparse(url)
    ext = Path(parsed.path).suffix
    if not ext or len(ext) > 5:
        return ".jpg"
    return ext


def _hash_url(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]


def _load_manifest(output_dir: Path) -> dict:
    manifest_path = output_dir / "manifest.json"
    if not manifest_path.exists():
        return {}
    try:
        return json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def _save_manifest(output_dir: Path, manifest: dict) -> None:
    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def download_images(
    images: Iterable[tuple[str, Optional[str], bool]],
    output_dir: Path,
    timeout: int = 30,
) -> List[DownloadedImage]:
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = _load_manifest(output_dir)
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    }
    downloaded: List[DownloadedImage] = []

    for url, alt, is_floorplan in images:
        name = f"{_hash_url(url)}{_safe_extension(url)}"
        dest = output_dir / name
        if dest.exists():
            manifest[name] = {
                "source_url": url,
                "alt": alt,
                "is_floorplan": is_floorplan,
            }
            downloaded.append(DownloadedImage(url, dest, alt=alt, is_floorplan=is_floorplan))
            continue

        response = requests.get(url, headers=headers, timeout=timeout, stream=True)
        response.raise_for_status()
        with open(dest, "wb") as handle:
            for chunk in response.iter_content(chunk_size=1024 * 128):
                if chunk:
                    handle.write(chunk)

        manifest[name] = {
            "source_url": url,
            "alt": alt,
            "is_floorplan": is_floorplan,
        }

        downloaded.append(DownloadedImage(url, dest, alt=alt, is_floorplan=is_floorplan))

    _save_manifest(output_dir, manifest)
    return downloaded
