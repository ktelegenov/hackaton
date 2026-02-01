from __future__ import annotations

import os
from pathlib import Path
from typing import Optional


class ReplicateNotConfigured(Exception):
    pass


def render_room(
    image_path: Path,
    output_path: Path,
    prompt: str,
    model: Optional[str] = None,
) -> Path:
    try:
        import replicate  # type: ignore
    except ImportError as exc:  # pragma: no cover - optional dependency
        raise ReplicateNotConfigured("Install replicate package to enable rendering.") from exc

    token = os.getenv("REPLICATE_API_TOKEN")
    if not token:
        raise ReplicateNotConfigured("Set REPLICATE_API_TOKEN to enable rendering.")

    model_name = model or "stability-ai/sdxl"
    with open(image_path, "rb") as handle:
        input_data = {
            "image": handle,
            "prompt": prompt,
        }
        output = replicate.run(model_name, input=input_data)

    if isinstance(output, list) and output:
        url = output[-1]
    else:
        url = output

    if not url:
        raise RuntimeError("Replicate returned no output URL.")

    output_path.write_bytes(_download_bytes(url))
    return output_path


def _download_bytes(url: str) -> bytes:
    import requests

    response = requests.get(url, timeout=60)
    response.raise_for_status()
    return response.content
