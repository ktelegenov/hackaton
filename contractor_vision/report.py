from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List

from jinja2 import Environment, FileSystemLoader, select_autoescape

from contractor_vision.estimate import BudgetEstimate


@dataclass(frozen=True)
class RoomAsset:
    label: str
    original_path: Path
    renovated_path: Path | None
    is_floorplan: bool = False


@dataclass(frozen=True)
class ReportData:
    address: str
    source_url: str
    design_style: str
    executive_summary: str
    assets: List[RoomAsset]
    budget: BudgetEstimate


def build_report(data: ReportData, output_dir: Path) -> Path:
    env = Environment(
        loader=FileSystemLoader(str(Path(__file__).parent / "templates")),
        autoescape=select_autoescape(["html"]),
    )
    template = env.get_template("report.html.j2")

    html = template.render(
        address=data.address,
        source_url=data.source_url,
        design_style=data.design_style,
        executive_summary=data.executive_summary,
        assets=data.assets,
        budget=data.budget,
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "report.html"
    output_path.write_text(html, encoding="utf-8")
    return output_path
