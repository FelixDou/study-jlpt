# Study JLPT

Study JLPT is a lightweight web app for reviewing Japanese vocabulary, kanji, and grammar from JLPT N5 to N1.

Open the app here:

https://felixdou.github.io/study-jlpt/

## What You Can Study

- Vocabulary: Japanese word to English meaning
- Reverse vocabulary: English meaning to Japanese word, kana, or romaji
- Kanji: kanji to English meaning, with readings and useful vocabulary
- Grammar: grammar point to English meaning, with usage patterns and example sentences

## How Reviews Work

Choose one or more JLPT levels, then answer the prompt shown on screen. After each answer, the app shows whether you were correct and reveals the expected answer.

An item is considered learned after two correct answers. Learned items stop appearing in normal review. If you already know an item, use the "I know this..." button to mark it learned immediately.

If an answer is marked wrong but you think it should be accepted, use "Accept my answer" to save that answer for next time.

## Extra Review

Some words are worth keeping fresh even after you recognize them. Mark those as "to remember" and review them separately. To-remember review repeats indefinitely and does not change normal learned progress.

## Progress

On the public website, progress is saved in your browser. Use the header buttons to export or import your progress if you want a backup or want to move progress to another device.

When running the app locally with `server.py`, progress can also be saved to a local `progress.json` file.

## Local Use

If you want to run the app on your own machine:

```bash
python3 server.py
```

Then open:

```text
http://localhost:8001/
```

## Notes For Contributors

The app is intentionally static-site friendly. GitHub Pages serves `index.html`, `styles.css`, `app.js`, and the files in `data/` directly. There is no account system or cloud database.

Useful maintenance scripts:

```bash
python3 scripts/validate_examples.py
python3 scripts/merge_example_chunks.py
python3 scripts/prepare_kanji_decks.py
python3 scripts/extract_grammar_decks.py
```

To generate new vocabulary example sentences, use:

```bash
OPENAI_API_KEY=... python3 scripts/generate_examples.py
```
