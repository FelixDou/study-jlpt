#!/usr/bin/env python3
"""Convert the downloaded JLPT kanji source into per-level app decks."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "kanji-jlpt-source.json"
OUT_DIR = ROOT / "data"


def main() -> None:
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    decks = {level: [] for level in ("n1", "n2", "n3", "n4", "n5")}

    for kanji, entry in source.items():
        level_value = entry.get("jlpt")
        if level_value not in {1, 2, 3, 4, 5}:
            continue

        level = f"n{level_value}"
        meanings = [item.strip() for item in entry.get("meanings", []) if item.strip()]
        on_readings = [item.strip() for item in entry.get("on_readings", []) if item.strip()]
        kun_readings = [item.strip() for item in entry.get("kun_readings", []) if item.strip()]
        if not meanings:
            continue

        decks[level].append(
            {
                "id": f"kanji:{level}:{kanji}",
                "deckId": level,
                "word": kanji,
                "reading": " / ".join(on_readings + kun_readings),
                "meaning": "; ".join(meanings),
                "kind": "kanji",
                "onReadings": on_readings,
                "kunReadings": kun_readings,
                "strokes": entry.get("stroke_count"),
                "frequency": entry.get("freq_mainichi_shinbun"),
                "grade": entry.get("grade"),
            }
        )

    for level, entries in decks.items():
        entries.sort(key=lambda item: (item["frequency"] is None, item["frequency"] or 999999, item["word"]))
        (OUT_DIR / f"kanji-{level}.json").write_text(
            json.dumps(entries, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"{level}: {len(entries)} kanji")


if __name__ == "__main__":
    main()
