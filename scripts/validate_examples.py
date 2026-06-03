#!/usr/bin/env python3
import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
EXAMPLES_PATH = DATA_DIR / "examples.json"
DECKS = ["n1", "n2", "n3", "n4", "n5"]


def main():
    examples = json.loads(EXAMPLES_PATH.read_text(encoding="utf-8"))
    total_expected = 0
    total_missing = 0
    for deck in DECKS:
        expected = load_expected(deck)
        missing = [key for key in expected if key not in examples]
        present = len(expected) - len(missing)
        total_expected += len(expected)
        total_missing += len(missing)
        print(f"{deck.upper()}: {present}/{len(expected)} examples, missing {len(missing)}")
        if missing:
            print(f"  first missing: {missing[0]}")
    unknown = [key for key in examples if not any(key in load_expected(deck) for deck in DECKS)]
    print(f"Total: {total_expected - total_missing}/{total_expected} examples, missing {total_missing}")
    print(f"Unknown keys: {len(unknown)}")


def load_expected(deck):
    expected = set()
    with (DATA_DIR / f"jlpt-{deck}.csv").open("r", encoding="utf-8-sig", newline="") as file:
        for index, row in enumerate(csv.DictReader(file)):
            expected.add(f'{deck}:{row["Word"]}:{row["Reading"]}:{row["Meaning"]}:{index}')
    return expected


if __name__ == "__main__":
    main()
