from __future__ import annotations

import json
import re
from http.cookiejar import MozillaCookieJar
from pathlib import Path
from dataclasses import dataclass
from typing import Iterable, List, Optional

import requests
from bs4 import BeautifulSoup

ZILLOW_IMAGE_RE = re.compile(r"https?://[^\s'\"]*photos\.zillowstatic\.com[^\s'\"]+")
FLOORPLAN_HINTS = ("floor", "plan", "blueprint")


@dataclass(frozen=True)
class ImageCandidate:
    url: str
    alt: Optional[str] = None
    is_floorplan: bool = False


def _is_floorplan(text: Optional[str]) -> bool:
    if not text:
        return False
    lowered = text.lower()
    return any(hint in lowered for hint in FLOORPLAN_HINTS)


def _extract_from_img_tags(html: str) -> List[ImageCandidate]:
    soup = BeautifulSoup(html, "html.parser")
    candidates: List[ImageCandidate] = []
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src")
        if not src:
            continue
        if "photos.zillowstatic.com" not in src:
            continue
        alt = img.get("alt")
        candidates.append(ImageCandidate(url=src, alt=alt, is_floorplan=_is_floorplan(alt)))
    return candidates


def _extract_from_embedded_json(html: str) -> List[ImageCandidate]:
    candidates: List[ImageCandidate] = []

    next_data_match = re.search(r"__NEXT_DATA__\"\s*type=\"application/json\"[^>]*>(.*?)</script>", html, re.DOTALL)
    if next_data_match:
        try:
            payload = json.loads(next_data_match.group(1))
        except json.JSONDecodeError:
            payload = None
        if payload:
            candidates.extend(_walk_for_images(payload))

    return candidates


def _walk_for_images(payload: object) -> List[ImageCandidate]:
    candidates: List[ImageCandidate] = []

    if isinstance(payload, dict):
        for key, value in payload.items():
            if isinstance(value, (dict, list)):
                candidates.extend(_walk_for_images(value))
                continue
            if key.lower() in {"url", "imageurl", "image_url"} and isinstance(value, str):
                if "photos.zillowstatic.com" in value:
                    candidates.append(ImageCandidate(url=value, alt=None, is_floorplan=_is_floorplan(value)))
    elif isinstance(payload, list):
        for item in payload:
            candidates.extend(_walk_for_images(item))

    return candidates


def _extract_with_regex(html: str) -> List[ImageCandidate]:
    return [
        ImageCandidate(url=url, alt=None, is_floorplan=_is_floorplan(url))
        for url in ZILLOW_IMAGE_RE.findall(html)
    ]


def _dedupe(candidates: Iterable[ImageCandidate]) -> List[ImageCandidate]:
    seen = set()
    result: List[ImageCandidate] = []
    for candidate in candidates:
        if candidate.url in seen:
            continue
        seen.add(candidate.url)
        result.append(candidate)
    return result


def load_cookies(cookie_file: Path) -> requests.cookies.RequestsCookieJar:
    jar = MozillaCookieJar(str(cookie_file))
    jar.load(ignore_discard=True, ignore_expires=True)
    requests_jar = requests.cookies.RequestsCookieJar()
    for cookie in jar:
        requests_jar.set_cookie(cookie)
    return requests_jar


def crawl_zillow_images(
    url: str,
    timeout: int = 20,
    cookies: requests.cookies.RequestsCookieJar | None = None,
) -> List[ImageCandidate]:
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Referer": "https://www.zillow.com/",
    }

    session = requests.Session()
    session.headers.update(headers)
    if cookies:
        session.cookies.update(cookies)
    try:
        session.get("https://www.zillow.com/", timeout=timeout)
    except requests.RequestException:
        pass

    response = session.get(url, timeout=timeout)
    if response.status_code == 403:
        raise RuntimeError(
            "Zillow blocked the request (HTTP 403). Try again later or supply "
            "browser cookies if you have access."
        )
    response.raise_for_status()

    html = response.text
    candidates = []
    candidates.extend(_extract_from_img_tags(html))
    candidates.extend(_extract_from_embedded_json(html))
    candidates.extend(_extract_with_regex(html))

    return _dedupe(candidates)
