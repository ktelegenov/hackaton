from __future__ import annotations

import re
from dataclasses import dataclass
from http.cookiejar import MozillaCookieJar
from pathlib import Path
from typing import Iterable, List, Optional
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

IMAGE_RE = re.compile(r"https?://[^\s'\"<>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^\s'\"<>]*)?", re.IGNORECASE)
FLOORPLAN_HINTS = ("floor", "plan", "blueprint")
NEGATIVE_HINTS = (
    "logo",
    "icon",
    "sprite",
    "favicon",
    "avatar",
    "agent",
    "profile",
    "map",
    "facebook",
    "twitter",
    "instagram",
    "pin",
    "badge",
    "equal-housing",
    "/images/footer/",
    "footer/flags",
)
POSITIVE_HINTS = (
    "listing",
    "home",
    "property",
    "photo",
    "photos",
    "gallery",
    "media",
    "res",
    "image",
    "images",
)


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


def _is_likely_listing_image(url: str, alt: Optional[str]) -> bool:
    lowered = url.lower()
    if any(neg in lowered for neg in NEGATIVE_HINTS):
        return False
    if alt and any(neg in alt.lower() for neg in NEGATIVE_HINTS):
        return False

    if "cdn-redfin.com/photo" in lowered:
        return "/bigphoto/" in lowered and "/images/footer/" not in lowered

    if any(pos in lowered for pos in POSITIVE_HINTS):
        return True
    if alt and any(pos in alt.lower() for pos in POSITIVE_HINTS):
        return True
    return False


def _extract_from_img_tags(html: str) -> List[ImageCandidate]:
    soup = BeautifulSoup(html, "html.parser")
    candidates: List[ImageCandidate] = []
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-lazy")
        if not src:
            continue
        alt = img.get("alt")
        if not _is_likely_listing_image(src, alt):
            continue
        candidates.append(ImageCandidate(url=src, alt=alt, is_floorplan=_is_floorplan(alt)))
    return candidates


def _extract_with_regex(html: str) -> List[ImageCandidate]:
    return [
        ImageCandidate(url=url, alt=None, is_floorplan=_is_floorplan(url))
        for url in IMAGE_RE.findall(html)
        if _is_likely_listing_image(url, None)
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


def _base_url(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}/"


def crawl_listing_images(
    url: str,
    timeout: int = 20,
    cookies: requests.cookies.RequestsCookieJar | None = None,
) -> List[ImageCandidate]:
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Referer": _base_url(url),
    }

    session = requests.Session()
    session.headers.update(headers)
    if cookies:
        session.cookies.update(cookies)

    try:
        session.get(_base_url(url), timeout=timeout)
    except requests.RequestException:
        pass

    response = session.get(url, timeout=timeout)
    if response.status_code == 403:
        raise RuntimeError("Listing site blocked the request (HTTP 403). Try with cookies.")
    response.raise_for_status()

    html = response.text
    candidates = []
    candidates.extend(_extract_from_img_tags(html))
    candidates.extend(_extract_with_regex(html))

    return _dedupe(candidates)
