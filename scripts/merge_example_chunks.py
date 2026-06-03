#!/usr/bin/env python3
import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CHUNK_DIR = ROOT / "data" / "example_chunks"
EXAMPLES_PATH = ROOT / "data" / "examples.json"
DECKS = ["n1", "n2", "n3", "n4", "n5"]


def main():
    valid_ids = load_valid_ids()
    examples = load_json(EXAMPLES_PATH) if EXAMPLES_PATH.exists() else {}
    chunk_paths = sorted(CHUNK_DIR.glob("*.json"))
    if not chunk_paths:
      raise SystemExit(f"No chunk files found in {CHUNK_DIR}")

    merged_count = 0
    for path in chunk_paths:
        chunk = load_json(path)
        if not isinstance(chunk, dict):
            raise SystemExit(f"{path} is not a JSON object")
        for key, value in chunk.items():
            if key not in valid_ids:
                raise SystemExit(f"{path} has unknown key: {key}")
            if not valid_example(value):
                raise SystemExit(f"{path} has invalid example for {key}")
            examples[key] = {
                "japanese": value["japanese"].strip(),
                "english": value["english"].strip(),
            }
            merged_count += 1

    save_json(EXAMPLES_PATH, examples)
    print(f"Merged {merged_count} chunk examples into {EXAMPLES_PATH}")
    print(f"Total examples: {len(examples)}")


def load_valid_ids():
    valid_ids = set()
    for deck in DECKS:
        path = ROOT / "data" / f"jlpt-{deck}.csv"
        with path.open("r", encoding="utf-8-sig", newline="") as file:
            for index, row in enumerate(csv.DictReader(file)):
                valid_ids.add(f'{deck}:{row["Word"]}:{row["Reading"]}:{row["Meaning"]}:{index}')
    return valid_ids


def load_json(path):
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_json(path, payload):
    temp_path = path.with_suffix(".json.tmp")
    with temp_path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2, sort_keys=True)
        file.write("\n")
    temp_path.replace(path)


def valid_example(value):
    return (
        isinstance(value, dict)
        and isinstance(value.get("japanese"), str)
        and isinstance(value.get("english"), str)
        and value["japanese"].strip()
        and value["english"].strip()
    )


if __name__ == "__main__":
    main()
