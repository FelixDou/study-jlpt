# Study JLPT

Small local browser app for revising JLPT vocabulary, kanji, and grammar decks in `data/`.

## Public Website

The app can be hosted as a static website on GitHub Pages. On the public site, progress is saved in each visitor's browser storage. Users can still use `Export progress` and `Import progress` to back up or move progress between devices.

Do not commit `progress.json`; it is local private progress and is ignored by `.gitignore`.

### Deploy to GitHub Pages

1. Create a new GitHub repository, for example `study-jlpt`.
2. Push this folder to that repository.
3. In GitHub, open `Settings` -> `Pages`.
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Select the `main` branch and `/ (root)`.
6. Save. GitHub will publish the app at a URL like:

```text
https://YOUR-USERNAME.github.io/study-jlpt/
```

## Run

```bash
python3 server.py
```

Then open:

```text
http://[::]:8001/
```

The local server stores progress in `progress.json` next to the app files. This means learned items survive browser cache or site-data clearing as long as that file remains. On GitHub Pages there is no writable server, so progress is saved in browser storage instead.

## Behavior

- Choose `JLPT Vocabulary`, `EN -> Japanese`, `JLPT Kanji`, or `JLPT Grammar` from the Study JLPT main menu.
- Select one or more JLPT decks before starting. Each deck shows its learned count out of the total.
- Use the lists on the mode menu to inspect learned and yet-to-learn items for each deck.
- Search the lists across all decks by typing an English meaning.
- Click an item in the lists to inspect it at a larger size and manually set it to `0/2`, `learned`, or `to remember`.
- Mark learned items as `to remember` when they reach `2/2` or after pressing the `I know this...` button.
- Review `to remember` items from the mode menu. This mode repeats them indefinitely and does not change normal `2/2` progress.
- Click the `Study JLPT` title or `Main menu` during a quiz to return to the study-mode menu.
- Each prompt shows the Japanese word, with furigana when the written word differs from the reading.
- Kanji prompts show the kanji and ask for an English meaning. After answering, the app reveals the ON/KUN readings plus stroke/frequency details.
- Kanji answers and kanji detail views show JLPT vocabulary words from the local decks that use that kanji.
- Grammar prompts show the grammar point and ask for an English meaning. After answering, the app reveals connection/formation patterns from the second Anki deck when matched, related structures, notes when available, and example sentences.
- Type an English answer, choose `I don't know`, or use the `I know this...` button to mark the item learned immediately.
- If a correct answer is marked wrong, use `Accept my answer` to add progress and save that answer as accepted for the same item in future reviews.
- Use `Export progress` and `Import progress` in the header to back up or restore `progress.json` from the browser.
- After each answer, the app shows whether it was correct and reveals the CSV answer.
- Vocabulary answers also show a Japanese example sentence containing the word plus an English translation.
- Generated examples are loaded from `data/examples.json`.
- The quiz avoids recently asked items while enough alternatives remain, so a failed item is pushed later in the session instead of immediately reappearing.

## Generate Examples

The CSV decks contain 8,127 vocabulary entries. To generate one authored example sentence per word:

```bash
OPENAI_API_KEY=... python3 scripts/generate_examples.py
```

Useful options:

```bash
OPENAI_API_KEY=... python3 scripts/generate_examples.py --limit 100
OPENAI_API_KEY=... OPENAI_MODEL=your-model python3 scripts/generate_examples.py --batch-size 20
```

If examples are generated in chunk files under `data/example_chunks/`, merge them with:

```bash
python3 scripts/merge_example_chunks.py
```

## Extract Grammar Decks

The grammar decks are extracted from the local Anki package in `~/Downloads`:

```bash
python3 scripts/extract_grammar_decks.py
```

The extractor uses `Japanese_Grammar_6500_Example_sentences_for_all_850_GrPoints.apkg` for English meanings and example translations, then merges matching `接続` connection patterns from `Nihongo-Kyoshi-complete.apkg`. Any grammar point not matched in the second deck gets a generated connection pattern so every grammar card has a `USE` field.

- An item is marked learned after two correct answers total, not necessarily consecutive.
- Learned status is saved in `progress.json` by `server.py`. If the app is opened without `server.py`, it falls back to browser `localStorage`.
