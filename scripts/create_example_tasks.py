#!/usr/bin/env python3
import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
TASK_DIR = DATA_DIR / "example_tasks"
CHUNK_SIZE = 200
DECKS = ["n1", "n2", "n3", "n4", "n5"]


def main():
    TASK_DIR.mkdir(parents=True, exist_ok=True)
    created = 0
    for deck in DECKS:
        words = load_deck(deck)
        for start in range(0, len(words), CHUNK_SIZE):
            end = min(start + CHUNK_SIZE, len(words))
            path = TASK_DIR / f"{deck}-{start:04d}-{end - 1:04d}.json"
            payload = {
                "deck": deck,
                "start": start,
                "end": end - 1,
                "items": words[start:end],
            }
            path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            created += 1
    print(f"Created {created} task files in {TASK_DIR}")


def load_deck(deck):
    path = DATA_DIR / f"jlpt-{deck}.csv"
    words = []
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        for index, row in enumerate(csv.DictReader(file)):
            words.append(
                {
                    "id": f'{deck}:{row["Word"]}:{row["Reading"]}:{row["Meaning"]}:{index}',
                    "deck": deck.upper(),
                    "index": index,
                    "word": row["Word"],
                    "reading": row["Reading"],
                    "meaning": row["Meaning"],
                }
            )
    return words


if __name__ == "__main__":
    main()
