#!/usr/bin/env python3
"""Extract JLPT grammar points from the local Anki package into app JSON decks."""

import json
import re
import sqlite3
import tempfile
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parents[1]
SOURCE_APKG = Path("/Users/felixdoublet/Downloads/Japanese_Grammar_6500_Example_sentences_for_all_850_GrPoints.apkg")
CONNECTION_APKG = Path("/Users/felixdoublet/Downloads/Nihongo-Kyoshi-complete.apkg")
OUT_DIR = ROOT / "data"
FIELD_SEPARATOR = "\x1f"
GRAMMAR_FIELDS = [
    "Notes/Vocab",
    "tip",
    "Grammar Point",
    "Example Japanese",
    "Example English",
    "Example Pronounciation",
    "Level",
    "Meaning",
    "Similar/Related Grammar Structures",
]


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag in {"br", "div", "p", "li", "tr"}:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"div", "p", "li", "tr"}:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        self.parts.append(data)

    def text(self) -> str:
        value = "".join(self.parts)
        value = unescape(value).replace("\xa0", " ")
        value = re.sub(r"[ \t\r\f\v]+", " ", value)
        value = re.sub(r"\n\s*\n+", "\n", value)
        return value.strip()


def html_to_text(value: str) -> str:
    parser = TextExtractor()
    parser.feed(value or "")
    return parser.text()


def compact_text(value: str) -> str:
    return re.sub(r"\s+", " ", html_to_text(value)).strip()


def clean_grammar_point(value: str) -> str:
    value = re.sub(r"^\d+(?=\D)", "", compact_text(value)).strip()
    value = re.sub(r"\s+tbet.*$", "", value).strip()
    value = re.sub(r"\s+volitional form$", "", value).strip()
    return value


def grammar_key(value: str) -> str:
    value = strip_reading_hint(clean_grammar_point(value))
    value = value.replace("～", "〜").replace("・", "/")
    value = re.sub(r"^[〜~]+", "", value)
    value = value.replace("・・・", "").replace("...", "").replace("…", "")
    value = value.replace(" ", "").replace("\u3000", "")
    value = value.replace("欲しい", "ほしい")
    value = value.replace("下さい", "ください")
    value = value.replace("事", "こと")
    value = value.replace("方", "かた")
    value = value.replace("無い", "ない")
    return value


def split_grammar_alternatives(value: str) -> list[str]:
    value = clean_grammar_point(value)
    parts = re.split(r"\s*/\s*|・", value)
    return [part.strip() for part in parts if part.strip()]


def strip_reading_hint(value: str) -> str:
    return re.sub(r"（[^）]+）", "", value).strip()


def infer_single_connection(point: str, meaning: str) -> str:
    point = strip_reading_hint(point)
    normalized = point.replace("～", "〜").replace("~", "〜").strip()

    manual = {
        "いつも": "Standalone adverb: いつも + phrase",
        "お": "お + N / V（ます形）ます",
        "ご": "ご + N / V（ます形）ます",
        "しかし": "Standalone conjunction: しかし + sentence",
        "そして": "Standalone conjunction: sentence。 そして + next sentence",
        "それから": "Standalone connector: sentence。 それから + next sentence",
        "とても": "とても + adjective / adverb",
        "どうして": "どうして + sentence / question",
        "なぜ": "なぜ + sentence / question",
        "ぜひ": "ぜひ + request / invitation / volitional expression",
        "もし": "もし + conditional phrase",
        "もう": "もう + verb / adjective / noun phrase",
        "まだ": "まだ + verb / adjective / noun phrase",
        "また": "また + sentence / verb phrase",
        "まるで": "まるで + noun / phrase + のようだ",
        "あるいは": "N / phrase / sentence + あるいは + N / phrase / sentence",
        "いきなり": "いきなり + verb phrase",
        "いよいよ": "いよいよ + sentence / verb phrase",
        "いわゆる": "いわゆる + N",
        "おまけに": "sentence。 おまけに + sentence",
        "かえって": "かえって + sentence",
        "さすが": "さすが + sentence / N",
        "さらに": "さらに + sentence / adjective / adverb",
        "さて": "さて + sentence",
        "しばらく": "しばらく + verb phrase",
        "すでに": "すでに + verb phrase",
        "すなわち": "sentence。 すなわち + explanation",
        "せいぜい": "せいぜい + quantity / phrase",
        "つい": "つい + verb phrase",
        "ついに": "ついに + verb phrase",
        "つまり": "sentence。 つまり + explanation",
        "とにかく": "とにかく + sentence",
        "なんか": "N / phrase + なんか",
        "なんて": "N / phrase / sentence + なんて",
        "ぴったり": "ぴったり + verb / adjective / noun phrase",
        "ほとんど": "ほとんど + verb / adjective / noun phrase",
        "まさか": "まさか + sentence / question",
        "わざと": "わざと + verb phrase",
        "あくまでも": "あくまでも + phrase / sentence",
        "あらかじめ": "あらかじめ + verb phrase",
        "いかなる": "いかなる + N + も / でも",
        "いかに": "いかに + adjective / adverb / sentence",
        "いかにも": "いかにも + adjective / noun phrase",
        "およそ": "およそ + quantity / phrase",
        "かつて": "かつて + verb phrase",
    }
    if normalized in manual:
        return manual[normalized]

    if "〜" in normalized:
        if normalized.startswith("〜"):
            suffix = normalized.lstrip("〜")
            if suffix.startswith("て"):
                return f"V（て形）+ {suffix}"
            if suffix.startswith("た"):
                return f"V（た形）+ {suffix}"
            if suffix.startswith("ない"):
                return f"V（ない形）+ {suffix}"
            if suffix.startswith("ず"):
                return f"V（ない形）ない + {suffix}"
            if suffix.startswith("ば"):
                return f"V（ば形）+ {suffix}"
            if suffix.startswith("方") or suffix.startswith("かた"):
                return f"V（ます形）ます + {suffix}"
            return f"V / い-adj / な-adj / N + {suffix}"
        if normalized.endswith("〜"):
            prefix = normalized.rstrip("〜")
            return f"{prefix} + V / い-adj / な-adj / N"
        return normalized.replace("〜", " + ... + ")

    starts = [
        ("て", "V（て形）"),
        ("た", "V（た形）"),
        ("ない", "V（ない形）"),
        ("なかった", "V（ない形過去）"),
        ("ず", "V（ない形）ない"),
        ("ます", "V（ます形）"),
        ("よう", "V（意向形）"),
        ("ば", "V（ば形）"),
    ]
    for prefix, base in starts:
        if normalized.startswith(prefix):
            return f"{base} + {normalized}"

    if normalized.startswith("お") and "ください" in normalized:
        return f"お + V（ます形）ます + {normalized.removeprefix('お')}"
    if normalized.startswith("お") and "になる" in normalized:
        return "お + V（ます形）ます + になる"
    if normalized.startswith("お") and "願う" in normalized:
        return "お + V（ます形）ます + 願う"

    exact_suffix = {
        "があります": "N + があります",
        "がいます": "N + がいます",
        "じゃない": "N / な-adj + じゃない",
        "ではない": "N / な-adj + ではない",
        "いたします": "N / V（ます形）ます + いたします",
        "いらっしゃる": "N / location + に / へ + いらっしゃる",
        "ございます": "N + がございます / adjective stem + ございます",
        "かしら": "sentence / phrase + かしら",
        "さ": "adjective stem + さ",
        "さえ": "N / particle phrase + さえ",
        "くらい": "N / quantity / phrase + くらい",
        "ぐらい": "N / quantity / phrase + ぐらい",
    }
    if normalized in exact_suffix:
        return exact_suffix[normalized]

    if normalized.endswith("がある") or normalized.endswith("ことがある"):
        return f"V（た形）+ {normalized}"
    if normalized.endswith("ことができる"):
        return f"V（辞書形）+ {normalized}"
    if normalized.endswith("必要") or normalized.endswith("必要（がひつよう）"):
        return f"N / V（辞書形）こと + {normalized}"
    if normalized.endswith("がする"):
        return f"N + {normalized}"
    if normalized.endswith("になる") or normalized.endswith("にする"):
        return f"N / adjective stem + {normalized}"
    if normalized.endswith("だ") or normalized.endswith("です"):
        return f"N / な-adj + {normalized}"

    if len(normalized) <= 2 and re.search(r"[はがをにでとへもやのか]", normalized):
        return f"N / phrase / sentence + {normalized}"
    if meaning.lower().startswith(("but", "however", "although", "and", "or")):
        return f"sentence / phrase + {normalized} + sentence / phrase"

    return f"Fixed expression / pattern: {normalized}"


def infer_connection_pattern(grammar_point: str, meaning: str) -> str:
    patterns = []
    for part in split_grammar_alternatives(grammar_point):
        pattern = infer_single_connection(part, meaning)
        if pattern not in patterns:
            patterns.append(pattern)
    return "\n".join(patterns)


def load_connection_patterns() -> dict[str, dict]:
    if not CONNECTION_APKG.exists():
        return {}

    patterns: dict[str, dict] = {}
    with tempfile.TemporaryDirectory() as temp_dir:
        with ZipFile(CONNECTION_APKG) as archive:
            archive.extract("collection.anki2", temp_dir)

        connection = sqlite3.connect(Path(temp_dir) / "collection.anki2")
        try:
            rows = connection.execute("select tags, flds from notes").fetchall()
        finally:
            connection.close()

    for tags, raw_fields in rows:
        fields = raw_fields.split(FIELD_SEPARATOR)
        if len(fields) < 5:
            continue

        grammar_point = clean_grammar_point(fields[0])
        meaning_japanese = html_to_text(fields[1])
        connection_pattern = html_to_text(fields[2])
        level = compact_text(fields[3]).lower()
        usage_notes = html_to_text(fields[4])
        if not grammar_point or not connection_pattern:
            continue

        payload = {
            "connection": connection_pattern,
            "connectionSourcePoint": grammar_point,
            "connectionLevel": level if level in {"n1", "n2", "n3", "n4", "n5"} else "",
            "usageJapanese": meaning_japanese,
            "usageNotes": usage_notes,
            "tags": tags.strip(),
            "connectionSource": "Nihongo-Kyoshi-complete.apkg",
        }
        keys = {grammar_key(grammar_point)}
        keys.update(grammar_key(part) for part in split_grammar_alternatives(grammar_point))
        for key in keys:
            if key:
                patterns.setdefault(key, payload)

    return patterns


def main() -> None:
    if not SOURCE_APKG.exists():
        raise SystemExit(f"Missing source deck: {SOURCE_APKG}")

    connection_patterns = load_connection_patterns()
    grouped: dict[tuple[str, str], dict] = {}
    with tempfile.TemporaryDirectory() as temp_dir:
        with ZipFile(SOURCE_APKG) as archive:
            archive.extract("collection.anki2", temp_dir)

        connection = sqlite3.connect(Path(temp_dir) / "collection.anki2")
        try:
            rows = connection.execute("select id, flds from notes").fetchall()
        finally:
            connection.close()

    for note_id, raw_fields in rows:
        fields = raw_fields.split(FIELD_SEPARATOR)
        if len(fields) != len(GRAMMAR_FIELDS):
            continue
        record = dict(zip(GRAMMAR_FIELDS, fields))
        grammar_point = clean_grammar_point(record["Grammar Point"])
        level = compact_text(record["Level"]).lower()
        meaning = compact_text(record["Meaning"])
        if level not in {"n1", "n2", "n3", "n4", "n5"} or not grammar_point or not meaning:
            continue

        key = (level, grammar_point)
        item = grouped.setdefault(
            key,
            {
                "id": f"grammar:{level}:{grammar_point}",
                "deckId": level,
                "kind": "grammar",
                "word": grammar_point,
                "reading": "",
                "meaning": meaning,
                "related": html_to_text(record["Similar/Related Grammar Structures"]),
                "notes": html_to_text(record["Notes/Vocab"]),
                "connection": "",
                "connectionSourcePoint": "",
                "connectionSource": "",
                "usageJapanese": "",
                "usageNotes": "",
                "examples": [],
            },
        )
        connection = connection_patterns.get(grammar_key(grammar_point))
        if connection and not item["connection"]:
            item.update(connection)
        elif not item["connection"]:
            item["connection"] = infer_connection_pattern(grammar_point, meaning)
            item["connectionSourcePoint"] = grammar_point
            item["connectionSource"] = "generated"

        japanese = compact_text(record["Example Japanese"])
        english = compact_text(record["Example English"])
        pronunciation = compact_text(record["Example Pronounciation"])
        if japanese and english:
            example_key = (japanese, english)
            if not any((entry["japanese"], entry["english"]) == example_key for entry in item["examples"]):
                item["examples"].append(
                    {
                        "japanese": japanese,
                        "english": english,
                        "pronunciation": pronunciation,
                        "sourceNoteId": note_id,
                    }
                )

    by_level = {level: [] for level in ("n1", "n2", "n3", "n4", "n5")}
    for (level, _grammar_point), item in grouped.items():
        item["exampleCount"] = len(item["examples"])
        by_level[level].append(item)

    for level, items in by_level.items():
        items.sort(key=lambda item: item["word"])
        (OUT_DIR / f"grammar-{level}.json").write_text(
            json.dumps(items, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"{level}: {len(items)} grammar points, {sum(item['exampleCount'] for item in items)} examples")
    total = sum(len(items) for items in by_level.values())
    source_backed = sum(
        1
        for items in by_level.values()
        for item in items
        if item.get("connectionSource") == "Nihongo-Kyoshi-complete.apkg"
    )
    generated = sum(
        1 for items in by_level.values() for item in items if item.get("connectionSource") == "generated"
    )
    complete = sum(1 for items in by_level.values() for item in items if item.get("connection"))
    print(f"connection patterns complete: {complete}/{total}")
    print(f"source-backed: {source_backed}; generated: {generated}")


if __name__ == "__main__":
    main()
