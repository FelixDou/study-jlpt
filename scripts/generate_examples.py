#!/usr/bin/env python3
import argparse
import csv
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
EXAMPLES_PATH = DATA_DIR / "examples.json"
DECKS = [
    ("n1", DATA_DIR / "jlpt-n1.csv"),
    ("n2", DATA_DIR / "jlpt-n2.csv"),
    ("n3", DATA_DIR / "jlpt-n3.csv"),
    ("n4", DATA_DIR / "jlpt-n4.csv"),
    ("n5", DATA_DIR / "jlpt-n5.csv"),
]


def main():
    parser = argparse.ArgumentParser(description="Generate per-word Japanese example sentences.")
    parser.add_argument("--model", default=os.environ.get("OPENAI_MODEL", "gpt-4.1-mini"))
    parser.add_argument("--batch-size", type=int, default=25)
    parser.add_argument("--limit", type=int, default=0, help="Generate at most this many new examples.")
    parser.add_argument("--sleep", type=float, default=0.5, help="Seconds to sleep between API calls.")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("OPENAI_API_KEY is required.")

    examples = load_examples()
    words = [word for word in load_words() if word["id"] not in examples]
    if args.limit:
        words = words[: args.limit]

    print(f"{len(examples)} existing examples")
    print(f"{len(words)} examples to generate")

    for start in range(0, len(words), args.batch_size):
        batch = words[start : start + args.batch_size]
        generated = generate_batch(api_key, args.model, batch)
        for item in generated:
            if not valid_example(item):
                continue
            examples[item["id"]] = {
                "japanese": item["japanese"].strip(),
                "english": item["english"].strip(),
            }
        save_examples(examples)
        print(f"saved {len(examples)} examples")
        time.sleep(args.sleep)


def load_words():
    words = []
    for deck_id, path in DECKS:
        with path.open("r", encoding="utf-8-sig", newline="") as file:
            for index, row in enumerate(csv.DictReader(file)):
                words.append(
                    {
                        "id": f'{deck_id}:{row["Word"]}:{row["Reading"]}:{row["Meaning"]}:{index}',
                        "deck": deck_id.upper(),
                        "word": row["Word"],
                        "reading": row["Reading"],
                        "meaning": row["Meaning"],
                    }
                )
    return words


def load_examples():
    if not EXAMPLES_PATH.exists():
        return {}
    with EXAMPLES_PATH.open("r", encoding="utf-8") as file:
        payload = json.load(file)
    return payload if isinstance(payload, dict) else {}


def save_examples(examples):
    temp_path = EXAMPLES_PATH.with_suffix(".json.tmp")
    with temp_path.open("w", encoding="utf-8") as file:
        json.dump(examples, file, ensure_ascii=False, indent=2, sort_keys=True)
        file.write("\n")
    temp_path.replace(EXAMPLES_PATH)


def generate_batch(api_key, model, batch):
    prompt = {
        "task": "Create one natural Japanese example sentence and one English translation for each vocabulary item.",
        "rules": [
            "Return only JSON with this shape: {\"examples\":[{\"id\":\"...\",\"japanese\":\"...\",\"english\":\"...\"}]}",
            "The Japanese sentence must naturally use the vocabulary item or one listed alternative.",
            "Do not use a generic quoted-word pattern.",
            "Keep sentences short and useful for language study.",
            "English must translate the Japanese sentence, not only define the word.",
            "Use polite or neutral everyday Japanese.",
            "For kana-only, katakana, prefixes, suffixes, counters, or grammar fragments, make a natural sentence using that form.",
        ],
        "items": batch,
    }
    body = json.dumps(
        {
            "model": model,
            "input": [
                {
                    "role": "system",
                    "content": "You generate concise, natural Japanese study examples with accurate English translations.",
                },
                {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)},
            ],
            "text": {"format": {"type": "json_object"}},
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI API error {error.code}: {detail}") from error

    text = extract_response_text(payload)
    parsed = json.loads(text)
    return parsed.get("examples", [])


def extract_response_text(payload):
    chunks = []
    for item in payload.get("output", []):
        for content in item.get("content", []):
            if content.get("type") == "output_text":
                chunks.append(content.get("text", ""))
    return "".join(chunks)


def valid_example(item):
    return (
        isinstance(item, dict)
        and isinstance(item.get("id"), str)
        and isinstance(item.get("japanese"), str)
        and isinstance(item.get("english"), str)
        and item["japanese"].strip()
        and item["english"].strip()
    )


if __name__ == "__main__":
    main()
