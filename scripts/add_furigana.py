#!/usr/bin/env python3
"""Add furigana to example sentences.

Writes a "furigana" field next to each example's "japanese" sentence, using a
compact ruby syntax the app understands:

    {母|はは}は{玄関|げんかん}に{季節|きせつ}の{花|はな}を{生|い}けた。

Removing the braces and readings gives back the original sentence exactly.

Updates data/examples.json and the examples inside data/grammar-n*.json.
Safe to re-run (for example after regenerating examples).

Requires: pip install fugashi unidic-lite
"""
import json
import re
import sys
from pathlib import Path

import fugashi

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
KANJI_RE = re.compile(r"[㐀-鿿豈-﫿々〆ヶ]")
RUN_RE = re.compile(r"[㐀-鿿豈-﫿々〆ヶ]+|[^㐀-鿿豈-﫿々〆ヶ]+")

tagger = fugashi.Tagger()


def to_hiragana(value):
    return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in value)


def align(surface, reading):
    """Split one token into (text, reading) pieces so okurigana stay bare."""
    if not KANJI_RE.search(surface):
        return [(surface, "")]
    if not reading or reading == "*":
        return [(surface, "")]
    runs = RUN_RE.findall(surface)
    pattern = "".join(
        "(.+?)" if KANJI_RE.match(run) else f"({re.escape(to_hiragana(run))})" for run in runs
    )
    match = re.fullmatch(pattern, reading)
    if not match:
        return [(surface, reading)]
    pieces = []
    for run, run_reading in zip(runs, match.groups()):
        pieces.append((run, run_reading if KANJI_RE.match(run) else ""))
    return pieces


# The tagger reads numerals and counters separately, so sound changes get lost
# (一週間 → いち・しゅうかん). These rules restore the usual readings.
READING_OVERRIDES = {"日本": "にほん"}
COUNTERS = {
    "回": "かい", "個": "こ", "冊": "さつ", "本": "ほん", "杯": "はい", "分": "ふん",
    "匹": "ひき", "週間": "しゅうかん", "週": "しゅう", "歳": "さい", "才": "さい",
    "階": "かい", "足": "そく", "軒": "けん", "泊": "はく", "頭": "とう", "点": "てん",
    "着": "ちゃく", "件": "けん", "通": "つう", "切れ": "きれ", "杯目": "はいめ",
}
SOKUON_NUMERALS = {"一": "いっ", "六": "ろっ", "八": "はっ", "十": "じゅっ"}
SOKUON_ROWS = "かきくけこさしすせそたちつてとはひふへほ"
H_TO_P = str.maketrans("はひふへほ", "ぱぴぷぺぽ")
VOICED_AFTER_N = {"本": "ぼん", "杯": "ばい", "匹": "びき", "階": "がい", "足": "ぞく", "軒": "げん", "分": "ぷん"}


def fix_readings(tokens):
    for index, (surface, reading) in enumerate(tokens):
        if surface in READING_OVERRIDES:
            tokens[index] = (surface, READING_OVERRIDES[surface])
    for index in range(len(tokens) - 1):
        numeral, _ = tokens[index]
        counter, counter_reading = tokens[index + 1]
        if counter not in COUNTERS:
            continue
        base = COUNTERS[counter]
        # Only when the tagger read it as this counter (keeps 何分 = なにぶん etc.).
        if counter_reading not in (base, base[0].translate(H_TO_P) + base[1:], VOICED_AFTER_N.get(counter)):
            continue
        if numeral in SOKUON_NUMERALS and base[0] in SOKUON_ROWS:
            tokens[index] = (numeral, SOKUON_NUMERALS[numeral])
            tokens[index + 1] = (counter, base[0].translate(H_TO_P) + base[1:])
        elif numeral in ("三", "何") and counter in VOICED_AFTER_N:
            tokens[index + 1] = (counter, VOICED_AFTER_N[counter])
        elif numeral == "四" and counter == "分":
            tokens[index + 1] = (counter, "ぷん")
    return tokens


def build_furigana(sentence):
    if not KANJI_RE.search(sentence) or any(c in sentence for c in "{}|"):
        return None
    tokens = fix_readings(
        [(word.surface, to_hiragana(getattr(word.feature, "kana", "") or "")) for word in tagger(sentence)]
    )
    out = []
    rebuilt = []
    position = 0
    for surface, reading in tokens:
        start = sentence.find(surface, position)
        if start < 0:
            return None
        if start > position:  # whitespace skipped by the tagger
            gap = sentence[position:start]
            out.append(gap)
            rebuilt.append(gap)
        for text, text_reading in align(surface, reading):
            rebuilt.append(text)
            if text_reading and text_reading != to_hiragana(text):
                out.append(f"{{{text}|{text_reading}}}")
            else:
                out.append(text)
        position = start + len(surface)
    tail = sentence[position:]
    out.append(tail)
    rebuilt.append(tail)
    if "".join(rebuilt) != sentence:
        return None
    return "".join(out)


def annotate(example):
    furigana = build_furigana(example.get("japanese", ""))
    if furigana:
        example["furigana"] = furigana
    else:
        example.pop("furigana", None)
    return bool(furigana)


def main():
    total = annotated = 0

    examples_path = DATA / "examples.json"
    examples = json.loads(examples_path.read_text(encoding="utf-8"))
    for example in examples.values():
        total += 1
        annotated += annotate(example)
    with examples_path.open("w", encoding="utf-8") as file:
        json.dump(examples, file, ensure_ascii=False, indent=2, sort_keys=True)
        file.write("\n")

    for path in sorted(DATA.glob("grammar-n*.json")):
        items = json.loads(path.read_text(encoding="utf-8"))
        for item in items:
            for example in item.get("examples") or []:
                total += 1
                annotated += annotate(example)
        path.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Added furigana to {annotated}/{total} example sentences.", file=sys.stderr)


if __name__ == "__main__":
    main()
