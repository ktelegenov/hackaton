from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Optional

ROOM_DEFAULTS = {
    "living": (6000, 15000),
    "kitchen": (12000, 35000),
    "bath": (8000, 22000),
    "bed": (4000, 12000),
    "dining": (5000, 14000),
    "hall": (2500, 6000),
    "office": (3000, 9000),
    "exterior": (7000, 20000),
    "other": (2500, 8000),
}


@dataclass(frozen=True)
class RoomEstimate:
    room_label: str
    low: int
    high: int


@dataclass(frozen=True)
class BudgetEstimate:
    rooms: List[RoomEstimate]

    @property
    def total_low(self) -> int:
        return sum(room.low for room in self.rooms)

    @property
    def total_high(self) -> int:
        return sum(room.high for room in self.rooms)


ROOM_ALIASES = {
    "living": ["living", "family", "great"],
    "kitchen": ["kitchen"],
    "bath": ["bath", "bathroom", "powder"],
    "bed": ["bed", "bedroom"],
    "dining": ["dining"],
    "hall": ["hall", "entry", "foyer"],
    "office": ["office", "study"],
    "exterior": ["exterior", "outside", "backyard", "front"],
}


def _normalize_room_label(label: Optional[str]) -> str:
    if not label:
        return "other"
    lowered = label.lower()
    for canonical, aliases in ROOM_ALIASES.items():
        if any(alias in lowered for alias in aliases):
            return canonical
    return "other"


def estimate_budget(room_labels: Iterable[str]) -> BudgetEstimate:
    rooms: List[RoomEstimate] = []
    for label in room_labels:
        canonical = _normalize_room_label(label)
        low, high = ROOM_DEFAULTS[canonical]
        rooms.append(RoomEstimate(room_label=label, low=low, high=high))
    return BudgetEstimate(rooms=rooms)
