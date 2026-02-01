from __future__ import annotations

import argparse
from pathlib import Path
from typing import List

from contractor_vision.download import download_images
from contractor_vision.estimate import estimate_budget
from contractor_vision.report import ReportData, RoomAsset, build_report
from contractor_vision.replicate_client import ReplicateNotConfigured, render_room
from contractor_vision.listings import crawl_listing_images, load_cookies
from contractor_vision.zillow import crawl_zillow_images


def _infer_label(alt: str | None, url: str) -> str:
    for source in (alt or "", url):
        lowered = source.lower()
        if "kitchen" in lowered:
            return "Kitchen"
        if "bath" in lowered:
            return "Bathroom"
        if "bed" in lowered:
            return "Bedroom"
        if "living" in lowered or "family" in lowered:
            return "Living Room"
        if "dining" in lowered:
            return "Dining Room"
        if "floor" in lowered:
            return "Floor Plan"
    return "Room"


def run(
    url: str,
    output: Path,
    design_style: str,
    address: str,
    use_replicate: bool,
    cookies_path: Path | None,
) -> Path:
    cookies = load_cookies(cookies_path) if cookies_path else None
    if "zillow.com" in url:
        images = crawl_zillow_images(url, cookies=cookies)
    else:
        images = crawl_listing_images(url, cookies=cookies)
    if not images:
        raise RuntimeError("No images found on the Zillow page.")

    downloaded = download_images(
        [(img.url, img.alt, img.is_floorplan) for img in images],
        output / "images",
    )

    assets: List[RoomAsset] = []
    for item in downloaded:
        label = _infer_label(item.alt, item.source_url)
        renovated_path = None
        if use_replicate and not item.is_floorplan:
            try:
                renovated_path = output / "renders" / item.local_path.name
                renovated_path.parent.mkdir(parents=True, exist_ok=True)
                render_room(
                    item.local_path,
                    renovated_path,
                    prompt=f"{design_style} interior design render of a {label}",
                )
            except ReplicateNotConfigured:
                renovated_path = None

        assets.append(
            RoomAsset(
                label=label,
                original_path=item.local_path,
                renovated_path=renovated_path,
                is_floorplan=item.is_floorplan,
            )
        )

    budget = estimate_budget([asset.label for asset in assets if not asset.is_floorplan])
    executive_summary = (
        f"Generated concept renders for {len(assets)} spaces with a {design_style} style. "
        f"Estimated renovation range totals ${budget.total_low:,.0f} to ${budget.total_high:,.0f}."
    )

    report = build_report(
        ReportData(
            address=address or "Zillow Listing",
            source_url=url,
            design_style=design_style,
            executive_summary=executive_summary,
            assets=assets,
            budget=budget,
        ),
        output,
    )
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Contractor Vision Zillow crawler")
    parser.add_argument("url", help="Zillow listing URL")
    parser.add_argument("--out", default="output", help="Output directory")
    parser.add_argument("--style", default="Modern coastal", help="Design style prompt")
    parser.add_argument("--address", default="", help="Listing address")
    parser.add_argument("--use-replicate", action="store_true", help="Generate renders using Replicate")
    parser.add_argument("--cookies", default="", help="Path to Netscape cookie file for Zillow")

    args = parser.parse_args()
    output = Path(args.out)
    cookies_path = Path(args.cookies) if args.cookies else None
    report = run(
        args.url,
        output,
        design_style=args.style,
        address=args.address,
        use_replicate=args.use_replicate,
        cookies_path=cookies_path,
    )
    print(f"Report generated at {report}")


if __name__ == "__main__":
    main()
