const deckLevels = [
  { id: "n1", label: "N1", file: "data/jlpt-n1.csv" },
  { id: "n2", label: "N2", file: "data/jlpt-n2.csv" },
  { id: "n3", label: "N3", file: "data/jlpt-n3.csv" },
  { id: "n4", label: "N4", file: "data/jlpt-n4.csv" },
  { id: "n5", label: "N5", file: "data/jlpt-n5.csv" },
];

const studyModes = {
  vocabulary: {
    id: "vocabulary",
    label: "JLPT Vocabulary",
    sourceKind: "vocabulary",
    itemLabel: "word",
    pluralLabel: "words",
    decks: deckLevels,
    setupTitle: "Choose vocabulary decks",
    setupDescription: "Select one or more JLPT levels for this vocabulary session.",
    overviewTitle: "Vocabulary lists",
    overviewDescription: "Choose a deck to inspect learned and remaining words.",
    overviewDeckLabel: "Vocabulary list deck",
    quizTitle: "Translate this word",
    rememberTitle: "To remember",
    rememberDescription: "Words you recognize but want to keep revisiting.",
    answerLabel: "English translation",
    answerPlaceholder: "Type an English meaning",
    knowButton: "I know this word",
    reviewRememberButton: "Review to remember",
  },
  vocabularyReverse: {
    id: "vocabularyReverse",
    label: "EN to Japanese",
    sourceKind: "vocabulary",
    itemLabel: "word",
    pluralLabel: "words",
    decks: deckLevels,
    setupTitle: "Choose English-to-Japanese decks",
    setupDescription: "Select one or more JLPT levels for this English-to-Japanese session.",
    overviewTitle: "English-to-Japanese vocabulary lists",
    overviewDescription: "Choose a deck to inspect learned and remaining words for this direction.",
    overviewDeckLabel: "English-to-Japanese list deck",
    quizTitle: "Write this in Japanese",
    rememberTitle: "English-to-Japanese to remember",
    rememberDescription: "Words you want to keep producing from English.",
    answerLabel: "Japanese word",
    answerPlaceholder: "Type Japanese, kana, or romaji",
    knowButton: "I can write this word",
    reviewRememberButton: "Review to remember",
    promptType: "meaning",
    answerType: "japanese",
  },
  kanji: {
    id: "kanji",
    label: "JLPT Kanji",
    sourceKind: "kanji",
    itemLabel: "kanji",
    pluralLabel: "kanji",
    decks: deckLevels.map((deck) => ({ ...deck, file: `data/kanji-${deck.id}.json`, type: "json" })),
    setupTitle: "Choose kanji decks",
    setupDescription: "Select one or more JLPT levels for this kanji session.",
    overviewTitle: "Kanji lists",
    overviewDescription: "Choose a deck to inspect learned and remaining kanji.",
    overviewDeckLabel: "Kanji list deck",
    quizTitle: "Give the English meaning",
    rememberTitle: "Kanji to remember",
    rememberDescription: "Kanji you recognize but want to keep revisiting.",
    answerLabel: "English meaning",
    answerPlaceholder: "Type an English meaning",
    knowButton: "I know this kanji",
    reviewRememberButton: "Review to remember",
  },
  grammar: {
    id: "grammar",
    label: "JLPT Grammar",
    sourceKind: "grammar",
    itemLabel: "grammar point",
    pluralLabel: "grammar points",
    decks: deckLevels.map((deck) => ({ ...deck, file: `data/grammar-${deck.id}.json`, type: "json" })),
    setupTitle: "Choose grammar decks",
    setupDescription: "Select one or more JLPT levels for this grammar session.",
    overviewTitle: "Grammar lists",
    overviewDescription: "Choose a deck to inspect learned and remaining grammar points.",
    overviewDeckLabel: "Grammar list deck",
    quizTitle: "Give the English meaning",
    rememberTitle: "Grammar to remember",
    rememberDescription: "Grammar points you recognize but want to keep revisiting.",
    answerLabel: "English meaning",
    answerPlaceholder: "Type an English meaning",
    knowButton: "I know this grammar",
    reviewRememberButton: "Review to remember",
  },
};

const storageKey = "jlpt-review-progress-v1";
const onboardingStorageKey = "study-jlpt-onboarding-dismissed-v1";
const statsKey = "__stats";
const state = {
  studyMode: null,
  allDecks: {
    vocabulary: new Map(),
    vocabularyReverse: new Map(),
    kanji: new Map(),
    grammar: new Map(),
  },
  kanjiVocabulary: new Map(),
  selectedIds: [],
  activeWords: [],
  currentWord: null,
  lastSubmittedAnswer: "",
  recentWordIds: [],
  failedWordIds: [],
  queueMode: "daily",
  sessionGoal: "open",
  sessionProgress: null,
  completionMessage: "",
  reviewMode: "normal",
  examples: {},
  progress: {},
  progressBackend: "browser",
  overviewDeckId: "n5",
  selectedListWordId: null,
  overviewSearch: "",
};

const els = {
  appTitle: document.querySelector("#appTitle"),
  modePanel: document.querySelector("#modePanel"),
  onboardingPanel: document.querySelector("#onboardingPanel"),
  dismissOnboarding: document.querySelector("#dismissOnboarding"),
  statsPanel: document.querySelector("#statsPanel"),
  reviewedTodayCount: document.querySelector("#reviewedTodayCount"),
  accuracyTodayCount: document.querySelector("#accuracyTodayCount"),
  learnedTodayCount: document.querySelector("#learnedTodayCount"),
  streakCount: document.querySelector("#streakCount"),
  hardestCount: document.querySelector("#hardestCount"),
  hardestItems: document.querySelector("#hardestItems"),
  setupPanel: document.querySelector("#setupPanel"),
  setupTitle: document.querySelector("#setupTitle"),
  setupDescription: document.querySelector("#setupTitle + p"),
  rememberPanel: document.querySelector("#rememberPanel"),
  rememberTitle: document.querySelector("#rememberTitle"),
  rememberDescription: document.querySelector("#rememberSummary"),
  quizPanel: document.querySelector("#quizPanel"),
  completePanel: document.querySelector("#completePanel"),
  overviewPanel: document.querySelector("#overviewPanel"),
  overviewTitle: document.querySelector("#overviewTitle"),
  overviewDescription: document.querySelector("#overviewSummary"),
  deckChoices: document.querySelector("#deckChoices"),
  startQuiz: document.querySelector("#startQuiz"),
  setupMessage: document.querySelector("#setupMessage"),
  startRememberQuiz: document.querySelector("#startRememberQuiz"),
  rememberSummary: document.querySelector("#rememberSummary"),
  rememberWords: document.querySelector("#rememberWords"),
  overviewDeckTabs: document.querySelector("#overviewDeckTabs"),
  overviewSummary: document.querySelector("#overviewSummary"),
  overviewSearch: document.querySelector("#overviewSearch"),
  wordDetailPanel: document.querySelector("#wordDetailPanel"),
  wordDetailDeck: document.querySelector("#wordDetailDeck"),
  wordDetailWord: document.querySelector("#wordDetailWord"),
  wordDetailMeaning: document.querySelector("#wordDetailMeaning"),
  wordDetailStatus: document.querySelector("#wordDetailStatus"),
  wordDetailExtra: document.querySelector("#wordDetailExtra"),
  setWordDue: document.querySelector("#setWordDue"),
  setWordLearned: document.querySelector("#setWordLearned"),
  setWordRemember: document.querySelector("#setWordRemember"),
  learnedWords: document.querySelector("#learnedWords"),
  dueWords: document.querySelector("#dueWords"),
  learnedListCount: document.querySelector("#learnedListCount"),
  dueListCount: document.querySelector("#dueListCount"),
  deckLabel: document.querySelector("#deckLabel"),
  quizTitle: document.querySelector("#quizTitle"),
  remainingCount: document.querySelector("#remainingCount"),
  learnedCount: document.querySelector("#learnedCount"),
  sessionProgressCount: document.querySelector("#sessionProgressCount"),
  backToMenu: document.querySelector("#backToMenu"),
  wordDisplay: document.querySelector("#wordDisplay"),
  answerForm: document.querySelector("#answerForm"),
  answerLabel: document.querySelector('label[for="answerInput"]'),
  answerInput: document.querySelector("#answerInput"),
  submitAnswer: document.querySelector("#submitAnswer"),
  dontKnow: document.querySelector("#dontKnow"),
  knowWord: document.querySelector("#knowWord"),
  toggleRemember: document.querySelector("#toggleRemember"),
  feedback: document.querySelector("#feedback"),
  resultLabel: document.querySelector("#resultLabel"),
  answerReveal: document.querySelector("#answerReveal"),
  exampleReveal: document.querySelector("#exampleReveal"),
  progressNote: document.querySelector("#progressNote"),
  nextWord: document.querySelector("#nextWord"),
  acceptAnswer: document.querySelector("#acceptAnswer"),
  exportProgress: document.querySelector("#exportProgress"),
  importProgress: document.querySelector("#importProgress"),
  importProgressFile: document.querySelector("#importProgressFile"),
  resetProgress: document.querySelector("#resetProgress"),
  chooseAgain: document.querySelector("#chooseAgain"),
  sessionGoal: document.querySelector("#sessionGoal"),
  roadmapPanel: document.querySelector("#roadmapPanel"),
  roadmapGrid: document.querySelector("#roadmapGrid"),
  mistakePanel: document.querySelector("#mistakePanel"),
  mistakeSummary: document.querySelector("#mistakeSummary"),
  mistakeNotebook: document.querySelector("#mistakeNotebook"),
  focusPanel: document.querySelector("#focusPanel"),
  focusTitle: document.querySelector("#focusTitle"),
  focusDescription: document.querySelector("#focusDescription"),
  focusAction: document.querySelector("#focusAction"),
  focusLearnedCount: document.querySelector("#focusLearnedCount"),
  focusDueCount: document.querySelector("#focusDueCount"),
  focusRememberCount: document.querySelector("#focusRememberCount"),
  focusCompletionCount: document.querySelector("#focusCompletionCount"),
};

init();

async function init() {
  bindEvents();
  showModeMenu();

  if (window.location.protocol === "file:") {
    state.progressBackend = "browser";
    state.progress = loadBrowserProgress();
    els.setupMessage.textContent =
      "Decks cannot load from a file:// URL. Open https://felixdou.github.io/study-jlpt/ or run python3 server.py and use http://localhost:8001/.";
    els.startQuiz.disabled = true;
    renderOnboarding();
    renderProgressStats();
    return;
  }

  let loadedProgressFromFile = false;
  try {
    await loadProgress();
    loadedProgressFromFile = state.progressBackend === "file";
  } catch {
    state.progressBackend = "browser";
    state.progress = loadBrowserProgress();
  }

  try {
    await loadExamples();
    await loadDecks();
    els.setupMessage.textContent = `Decks loaded. Your progress is saved ${getProgressLocationLabel()}.`;
    renderOnboarding();
    renderProgressStats();
  } catch (error) {
    const progressNote = loadedProgressFromFile ? " Progress loaded successfully." : "";
    els.setupMessage.textContent = `Could not load decks: ${error.message}.${progressNote}`;
    els.startQuiz.disabled = true;
    renderOnboarding();
    renderProgressStats();
  }
}

function bindEvents() {
  els.appTitle.addEventListener("click", showModeMenu);
  els.dismissOnboarding.addEventListener("click", dismissOnboarding);
  els.modePanel.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mode-id]");
    if (!button) {
      return;
    }
    selectStudyMode(button.dataset.modeId);
  });
  els.startQuiz.addEventListener("click", startQuiz);
  document.querySelectorAll('input[name="queueMode"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.queueMode = getSelectedQueueMode();
      updateSetupMessage();
    });
  });
  els.sessionGoal.addEventListener("change", () => {
    state.sessionGoal = els.sessionGoal.value;
    updateSetupMessage();
  });
  els.startRememberQuiz.addEventListener("click", startRememberQuiz);
  els.answerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitAnswer(els.answerInput.value);
  });
  els.dontKnow.addEventListener("click", () => submitAnswer(""));
  els.knowWord.addEventListener("click", markCurrentWordLearned);
  els.toggleRemember.addEventListener("click", () => toggleRememberWord(state.currentWord));
  els.acceptAnswer.addEventListener("click", acceptLastAnswer);
  els.nextWord.addEventListener("click", showNextWord);
  els.backToMenu.addEventListener("click", showSetup);
  els.chooseAgain.addEventListener("click", showSetup);
  els.focusAction.addEventListener("click", () => {
    const modeId = els.focusAction.dataset.modeId;
    if (modeId) {
      selectStudyMode(modeId);
    }
  });
  els.resetProgress.addEventListener("click", resetProgress);
  els.exportProgress.addEventListener("click", exportProgress);
  els.importProgress.addEventListener("click", () => els.importProgressFile.click());
  els.importProgressFile.addEventListener("change", importProgress);
  els.learnedWords.addEventListener("click", handleWordListClick);
  els.dueWords.addEventListener("click", handleWordListClick);
  els.setWordDue.addEventListener("click", () => setSelectedWordCategory("due"));
  els.setWordLearned.addEventListener("click", () => setSelectedWordCategory("learned"));
  els.setWordRemember.addEventListener("click", () => setSelectedWordCategory("remember"));
  els.overviewSearch.addEventListener("input", () => {
    state.overviewSearch = els.overviewSearch.value.trim();
    state.selectedListWordId = null;
    renderOverviewLists();
  });
  els.overviewDeckTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-deck-id]");
    if (!button) {
      return;
    }
    state.overviewDeckId = button.dataset.deckId;
    renderOverviewLists();
  });
  els.rememberWords.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-remove-remember-id]");
    if (!button) {
      return;
    }
    const word = findWordById(button.dataset.removeRememberId);
    if (word) {
      toggleRememberWord(word, false);
    }
  });
}

function getModeConfig(modeId = state.studyMode) {
  return modeId ? studyModes[modeId] : null;
}

function getActiveDecks() {
  const mode = getModeConfig();
  return mode ? mode.decks : studyModes.vocabulary.decks;
}

function getActiveDeckMap() {
  return state.allDecks[state.studyMode] || state.allDecks.vocabulary;
}

function selectStudyMode(modeId) {
  if (!studyModes[modeId]) {
    return;
  }

  state.studyMode = modeId;
  state.reviewMode = "normal";
  state.selectedIds = [];
  state.currentWord = null;
  state.lastSubmittedAnswer = "";
  state.recentWordIds = [];
  state.failedWordIds = [];
  state.selectedListWordId = null;
  state.overviewSearch = "";
  state.overviewDeckId = "n5";
  applyModeText();
  showSetup();
}

function applyModeText() {
  const mode = getModeConfig();
  if (!mode) {
    return;
  }
  els.setupTitle.textContent = mode.setupTitle;
  els.setupDescription.textContent = mode.setupDescription;
  els.overviewTitle.textContent = mode.overviewTitle;
  els.overviewDescription.textContent = mode.overviewDescription;
  els.answerLabel.textContent = mode.answerLabel;
  els.answerInput.placeholder = mode.answerPlaceholder;
  els.knowWord.textContent = mode.knowButton;
}

function renderDeckChoices() {
  const decks = getActiveDecks();
  const selectedNow = new Set(
    Array.from(els.deckChoices.querySelectorAll("input:checked")).map((input) => input.value)
  );
  els.deckChoices.innerHTML = decks
    .map((deck) => {
      const words = getActiveDeckMap().get(deck.id) || [];
      const learned = words.filter((word) => isLearned(word)).length;
      const due = Math.max(words.length - learned, 0);
      const percent = words.length ? Math.round((learned / words.length) * 100) : 0;
      const progress = words.length ? `${learned}/${words.length} learned` : "Loading";
      const checked = selectedNow.size ? selectedNow.has(deck.id) : deck.id === "n5";
      return `
        <label class="deck-option">
          <input type="checkbox" value="${deck.id}" ${checked ? "checked" : ""}>
          <span>
            <strong>${deck.label}</strong>
            <small>${progress}</small>
            <span class="deck-progress" aria-hidden="true">
              <span style="width: ${percent}%"></span>
            </span>
            <em>${words.length ? `${due} due` : "Preparing deck"}</em>
          </span>
        </label>
      `;
    })
    .join("");
}

function renderRememberList() {
  const mode = getModeConfig();
  if (!mode) {
    return;
  }
  const rememberedWords = getAllWords().filter((word) => isToRemember(word));
  els.startRememberQuiz.disabled = rememberedWords.length === 0;
  els.rememberTitle.textContent = mode.rememberTitle;
  els.startRememberQuiz.textContent = mode.reviewRememberButton;
  els.rememberSummary.textContent = rememberedWords.length
    ? `${rememberedWords.length} ${rememberedWords.length === 1 ? mode.itemLabel : mode.pluralLabel} marked for extra review.`
    : `No ${mode.pluralLabel} marked yet. Add one after an item becomes learned.`;

  if (!rememberedWords.length) {
    els.rememberWords.innerHTML = `<p class="empty-list">No to-remember ${mode.pluralLabel} yet.</p>`;
    return;
  }

  const decks = getActiveDecks();
  els.rememberWords.innerHTML = rememberedWords
    .map((word) => {
      const display = getDisplayParts(word);
      const deck = decks.find((item) => item.id === word.deckId);
      const reading =
        display.wordText === display.readingText ? "" : `<span class="list-reading">${escapeHtml(display.readingText)}</span>`;
      return `
        <article class="remember-item">
          <div>
            <span class="remember-deck">${deck ? deck.label : word.deckId.toUpperCase()}</span>
            <strong>${escapeHtml(display.wordText)}</strong>
            ${reading}
          </div>
          <p>${escapeHtml(word.meaning)}</p>
          <button class="ghost-button compact-button" type="button" data-remove-remember-id="${escapeHtml(word.id)}">
            Remove
          </button>
        </article>
      `;
    })
    .join("");
}

function renderOverviewLists() {
  const mode = getModeConfig();
  if (!mode) {
    return;
  }
  const decks = getActiveDecks();
  const activeDeck = decks.find((deck) => deck.id === state.overviewDeckId) || decks[0];
  state.overviewDeckId = activeDeck.id;
  const selectedWord = state.selectedListWordId ? findWordById(state.selectedListWordId) : null;
  const searchQuery = normalizeSearchText(state.overviewSearch);
  if (selectedWord && !searchQuery && selectedWord.deckId !== activeDeck.id) {
    state.selectedListWordId = null;
  }

  els.overviewTitle.textContent = mode.overviewTitle;
  els.overviewDeckTabs.setAttribute("aria-label", mode.overviewDeckLabel);
  els.overviewDeckTabs.innerHTML = decks
    .map((deck) => {
      const words = getActiveDeckMap().get(deck.id) || [];
      const learned = words.filter((word) => isLearned(word)).length;
      const selected = deck.id === activeDeck.id ? 'aria-selected="true"' : "";
      return `
        <button class="deck-tab" type="button" data-deck-id="${deck.id}" ${selected}>
          ${deck.label}
          <span>${learned}/${words.length || 0}</span>
        </button>
      `;
    })
    .join("");

  const words = searchQuery ? getAllWords() : getActiveDeckMap().get(activeDeck.id) || [];
  const matchingWords = searchQuery
    ? words.filter((word) => normalizeSearchText(word.meaning).includes(searchQuery))
    : words;
  const learnedWords = matchingWords.filter((word) => isLearned(word));
  const dueWords = matchingWords.filter((word) => !isLearned(word));
  const totalLearned = words.filter((word) => isLearned(word)).length;
  const totalDue = words.length - totalLearned;

  els.overviewSummary.textContent = searchQuery
    ? `All decks: ${matchingWords.length} English match${matchingWords.length === 1 ? "" : "es"} found.`
    : `${activeDeck.label}: ${totalLearned}/${words.length} learned.`;
  els.learnedListCount.textContent = searchQuery ? `${learnedWords.length}/${totalLearned}` : totalLearned;
  els.dueListCount.textContent = searchQuery ? `${dueWords.length}/${totalDue}` : totalDue;
  els.learnedWords.innerHTML = renderWordList(learnedWords, searchQuery ? "No learned matches." : "No learned words yet.");
  els.dueWords.innerHTML = renderWordList(dueWords, searchQuery ? "No yet-to-learn matches." : "No words left in this deck.");
  renderWordDetail();
}

function renderWordList(words, emptyText) {
  if (!words.length) {
    return `<p class="empty-list">${emptyText}</p>`;
  }

  return words
    .map((word) => {
      const progress = getWordProgress(word);
      const display = getDisplayParts(word);
      const selected = state.selectedListWordId === word.id ? 'aria-selected="true"' : "";
      const reading =
        display.wordText === display.readingText ? "" : `<span class="list-reading">${escapeHtml(display.readingText)}</span>`;
      return `
        <button class="word-list-item" type="button" data-word-id="${escapeHtml(word.id)}" ${selected}>
          <div>
            <strong>${escapeHtml(display.wordText)}</strong>
            ${reading}
          </div>
          <p>${escapeHtml(word.meaning)}</p>
          <small>${getWordStatusText(word, progress)}</small>
        </button>
      `;
    })
    .join("");
}

function handleWordListClick(event) {
  const button = event.target.closest("button[data-word-id]");
  if (!button) {
    return;
  }
  state.selectedListWordId = button.dataset.wordId;
  renderOverviewLists();
}

function renderWordDetail() {
  const word = state.selectedListWordId ? findWordById(state.selectedListWordId) : null;
  if (!word) {
    els.wordDetailPanel.classList.add("hidden");
    return;
  }

  const deck = getActiveDecks().find((item) => item.id === word.deckId);
  const progress = getWordProgress(word);
  els.wordDetailDeck.textContent = deck ? deck.label : word.deckId.toUpperCase();
  els.wordDetailWord.innerHTML = formatWord(word);
  els.wordDetailMeaning.textContent = word.meaning;
  els.wordDetailStatus.textContent = getWordStatusText(word, progress);
  if (word.kind === "kanji") {
    els.wordDetailExtra.innerHTML = renderAssociatedWords(word, "compact");
  } else if (word.kind === "grammar") {
    els.wordDetailExtra.innerHTML = renderGrammarDetails(word, "compact");
  } else {
    els.wordDetailExtra.innerHTML = "";
  }
  els.setWordRemember.textContent = isToRemember(word) ? "Keep to remember" : "Set to remember";
  els.wordDetailPanel.classList.remove("hidden");
}

function dismissOnboarding() {
  localStorage.setItem(onboardingStorageKey, "true");
  renderOnboarding();
}

function renderOnboarding() {
  const dismissed = localStorage.getItem(onboardingStorageKey) === "true";
  els.onboardingPanel.classList.toggle("hidden", dismissed || Boolean(state.studyMode));
}

function renderProgressStats() {
  const stats = getStatsProgress();
  const events = Array.isArray(stats.events) ? stats.events : [];
  const todayKey = getLocalDateKey(new Date());
  const todayEvents = events.filter((event) => event.day === todayKey);
  const todayCorrect = todayEvents.filter((event) => event.correct).length;
  const learnedToday = new Set(todayEvents.filter((event) => event.learnedAfter).map((event) => event.itemId)).size;
  const accuracy = todayEvents.length ? Math.round((todayCorrect / todayEvents.length) * 100) : 0;
  const streak = getReviewStreak(events);
  const hardestItems = getHardestItems(events);

  els.reviewedTodayCount.textContent = todayEvents.length;
  els.accuracyTodayCount.textContent = `${accuracy}%`;
  els.learnedTodayCount.textContent = learnedToday;
  els.streakCount.textContent = streak;
  els.hardestCount.textContent = hardestItems.length;
  els.hardestItems.innerHTML = hardestItems.length
    ? hardestItems
        .map(({ word, wrong, attempts }) => {
          const display = getDisplayParts(word);
          return `
            <article class="hardest-item">
              <div>
                <span class="remember-deck">${escapeHtml(getModeLabelForWord(word))}</span>
                <strong>${escapeHtml(display.wordText)}</strong>
                ${
                  display.wordText === display.readingText
                    ? ""
                    : `<span class="list-reading">${escapeHtml(display.readingText)}</span>`
                }
              </div>
              <p>${escapeHtml(word.meaning)}</p>
              <small>${wrong}/${attempts} missed</small>
            </article>
          `;
        })
        .join("")
    : `<p class="empty-list">No hard items yet.</p>`;
  renderModeCardProgress();
  renderRoadmap();
  renderMistakeNotebook(events);
}

function renderModeCardProgress() {
  Object.values(studyModes).forEach((mode) => {
    const summary = getModeSummary(mode);
    const { learned, total, due } = summary;
    const percent = total ? Math.round((learned / total) * 100) : 0;
    const progressEl = document.querySelector(`[data-mode-progress="${mode.id}"]`);
    const meterEl = document.querySelector(`[data-mode-meter="${mode.id}"]`);

    if (progressEl) {
      progressEl.textContent = total ? `${learned}/${total} learned · ${due} due` : "Loading decks";
    }
    if (meterEl) {
      meterEl.style.width = `${percent}%`;
    }
  });
  renderFocusPanel();
}

function getModeSummary(mode) {
  const words = mode.decks.flatMap((deck) => state.allDecks[mode.id].get(deck.id) || []);
  const learned = words.filter((word) => isLearned(word)).length;
  const remembered = words.filter((word) => isToRemember(word)).length;
  const total = words.length;
  const due = Math.max(total - learned, 0);
  const percent = total ? Math.round((learned / total) * 100) : 0;
  return { mode, words, learned, remembered, total, due, percent };
}

function renderFocusPanel() {
  const summaries = Object.values(studyModes).map(getModeSummary);
  const total = summaries.reduce((sum, summary) => sum + summary.total, 0);
  const learned = summaries.reduce((sum, summary) => sum + summary.learned, 0);
  const due = summaries.reduce((sum, summary) => sum + summary.due, 0);
  const remembered = summaries.reduce((sum, summary) => sum + summary.remembered, 0);
  const completion = total ? Math.round((learned / total) * 100) : 0;
  const readySummaries = summaries.filter((summary) => summary.total > 0);
  const recommended = readySummaries
    .filter((summary) => summary.due > 0)
    .sort((a, b) => a.percent - b.percent || b.due - a.due || a.mode.label.localeCompare(b.mode.label))[0];

  els.focusLearnedCount.textContent = learned;
  els.focusDueCount.textContent = due;
  els.focusRememberCount.textContent = remembered;
  els.focusCompletionCount.textContent = `${completion}%`;

  if (!total) {
    els.focusTitle.textContent = "Loading your study map";
    els.focusDescription.textContent = "Deck progress will appear here once the study paths are ready.";
    els.focusAction.textContent = "Open recommended path";
    els.focusAction.disabled = true;
    delete els.focusAction.dataset.modeId;
    return;
  }

  if (!recommended) {
    els.focusTitle.textContent = "Everything is learned";
    els.focusDescription.textContent = remembered
      ? `${remembered} item${remembered === 1 ? "" : "s"} remain in to-remember review.`
      : "All loaded study paths are complete. You can reset progress or review saved to-remember items.";
    els.focusAction.textContent = "Open vocabulary";
    els.focusAction.dataset.modeId = "vocabulary";
    els.focusAction.disabled = false;
    return;
  }

  els.focusTitle.textContent = `Continue with ${recommended.mode.label}`;
  els.focusDescription.textContent = `${recommended.due} ${recommended.mode.pluralLabel} still due. This path is ${recommended.percent}% learned.`;
  els.focusAction.textContent = `Open ${recommended.mode.label}`;
  els.focusAction.dataset.modeId = recommended.mode.id;
  els.focusAction.disabled = false;
}

function renderRoadmap() {
  els.roadmapGrid.innerHTML = deckLevels
    .slice()
    .reverse()
    .map((deck) => {
      const rows = Object.values(studyModes)
        .map((mode) => {
          const words = state.allDecks[mode.id].get(deck.id) || [];
          const learned = words.filter((word) => isLearned(word)).length;
          const percent = words.length ? Math.round((learned / words.length) * 100) : 0;
          return `
            <div class="roadmap-row">
              <span>${escapeHtml(mode.label)}</span>
              <strong>${learned}/${words.length || 0}</strong>
              <span class="roadmap-meter" aria-hidden="true"><span style="width: ${percent}%"></span></span>
            </div>
          `;
        })
        .join("");
      return `
        <article class="roadmap-card">
          <div class="roadmap-level">
            <strong>${deck.label}</strong>
            <span>JLPT level</span>
          </div>
          <div class="roadmap-rows">${rows}</div>
        </article>
      `;
    })
    .join("");
}

function renderMistakeNotebook(events) {
  const hardestItems = getHardestItems(events, 8);
  els.mistakeSummary.textContent = hardestItems.length
    ? `${hardestItems.length} recurring item${hardestItems.length === 1 ? "" : "s"} found from your review history.`
    : "Your most missed items will appear here after review sessions.";
  els.mistakeNotebook.innerHTML = hardestItems.length
    ? hardestItems
        .map(({ word, wrong, attempts }) => {
          const display = getDisplayParts(word);
          const deck = word.deckId ? word.deckId.toUpperCase() : "";
          const reading =
            display.wordText === display.readingText ? "" : `<span class="list-reading">${escapeHtml(display.readingText)}</span>`;
          return `
            <article class="mistake-item">
              <div>
                <span class="remember-deck">${escapeHtml(getModeLabelForWord(word))}</span>
                ${deck ? `<span class="remember-deck">${escapeHtml(deck)}</span>` : ""}
                <strong>${escapeHtml(display.wordText)}</strong>
                ${reading}
              </div>
              <p>${escapeHtml(word.meaning)}</p>
              <small>${wrong}/${attempts} missed</small>
            </article>
          `;
        })
        .join("")
    : `<p class="empty-list">No mistakes recorded yet.</p>`;
}

function recordReviewEvent({ word, isCorrect, learnedAfter, manual }) {
  if (!word) {
    return;
  }
  const stats = getStatsProgress();
  const now = new Date();
  const events = Array.isArray(stats.events) ? stats.events : [];
  events.push({
    at: now.toISOString(),
    day: getLocalDateKey(now),
    mode: state.studyMode,
    reviewMode: state.reviewMode,
    deckId: word.deckId,
    itemId: word.id,
    correct: Boolean(isCorrect),
    learnedAfter: Boolean(learnedAfter),
    manual: Boolean(manual),
  });
  stats.events = events.slice(-2500);
  state.progress[statsKey] = stats;
}

function getStatsProgress() {
  const stats = state.progress[statsKey];
  if (stats && typeof stats === "object" && !Array.isArray(stats)) {
    return stats;
  }
  const nextStats = { events: [] };
  state.progress[statsKey] = nextStats;
  return nextStats;
}

function getReviewStreak(events) {
  const reviewedDays = new Set(events.map((event) => event.day).filter(Boolean));
  let cursor = new Date();
  let streak = 0;
  while (reviewedDays.has(getLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function getHardestItems(events, limit = 3) {
  const byItem = new Map();
  events.forEach((event) => {
    if (!event.itemId) {
      return;
    }
    const item = byItem.get(event.itemId) || { attempts: 0, wrong: 0 };
    item.attempts += 1;
    if (!event.correct) {
      item.wrong += 1;
    }
    byItem.set(event.itemId, item);
  });

  return Array.from(byItem.entries())
    .map(([itemId, item]) => ({ ...item, itemId, word: findAnyWordById(itemId) }))
    .filter((item) => item.word && item.wrong > 0)
    .sort((a, b) => {
      const rateDiff = b.wrong / b.attempts - a.wrong / a.attempts;
      if (rateDiff !== 0) {
        return rateDiff;
      }
      return b.wrong - a.wrong || b.attempts - a.attempts;
    })
    .slice(0, limit);
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getModeLabelForWord(word) {
  const mode = Object.values(studyModes).find((item) => state.allDecks[item.id].get(word.deckId)?.some((entry) => entry.id === word.id));
  return mode ? mode.label : word.deckId.toUpperCase();
}

function setSelectedWordCategory(category) {
  const word = state.selectedListWordId ? findWordById(state.selectedListWordId) : null;
  if (!word) {
    return;
  }

  const progress = getWordProgress(word);
  if (category === "due") {
    progress.correctCount = 0;
    progress.toRemember = false;
    progress.manuallyLearned = false;
  } else if (category === "learned") {
    progress.correctCount = 2;
    progress.toRemember = false;
    progress.manuallyLearned = true;
  } else if (category === "remember") {
    progress.correctCount = 2;
    progress.toRemember = true;
    progress.manuallyLearned = true;
    progress.toRememberUpdatedAt = new Date().toISOString();
  }

  progress.lastManualStatusChangeAt = new Date().toISOString();
  state.progress[word.id] = progress;
  saveProgress();
  renderDeckChoices();
  renderRememberList();
  renderOverviewLists();
  updateStats();
}

async function loadDecks() {
  await Promise.all(
    Object.values(studyModes).map(async (mode) => {
      const loaded = await Promise.all(
        mode.decks.map(async (deck) => {
          const response = await fetch(deck.file, { cache: "no-store" });
          if (!response.ok) {
            throw new Error(`${mode.label} ${deck.label} returned ${response.status}`);
          }
          if (deck.type === "json") {
            return [deck.id, await response.json()];
          }
          const text = await response.text();
          const rows = parseCsv(text);
          return [
            deck.id,
            rows.map((row, index) => ({
              id:
                mode.id === "vocabulary"
                  ? `${deck.id}:${row.Word}:${row.Reading}:${row.Meaning}:${index}`
                  : `${mode.id}:${deck.id}:${row.Word}:${row.Reading}:${row.Meaning}:${index}`,
              sourceId: `${deck.id}:${row.Word}:${row.Reading}:${row.Meaning}:${index}`,
              deckId: deck.id,
              kind: mode.sourceKind || mode.id,
              word: row.Word,
              reading: row.Reading,
              meaning: row.Meaning,
            })),
          ];
        })
      );

      loaded.forEach(([deckId, words]) => state.allDecks[mode.id].set(deckId, words));
    })
  );
  buildKanjiVocabularyIndex();
}

function buildKanjiVocabularyIndex() {
  const levelOrder = new Map([["n5", 0], ["n4", 1], ["n3", 2], ["n2", 3], ["n1", 4]]);
  const vocabularyWords = studyModes.vocabulary.decks.flatMap((deck) =>
    state.allDecks.vocabulary.get(deck.id) || []
  );
  const kanjiItems = studyModes.kanji.decks.flatMap((deck) => state.allDecks.kanji.get(deck.id) || []);
  const index = new Map();

  kanjiItems.forEach((kanji) => {
    const seen = new Set();
    const relatedWords = vocabularyWords
      .filter((word) => word.word.includes(kanji.word))
      .filter((word) => {
        const key = `${word.word}|${word.reading}|${word.meaning}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const levelDiff = (levelOrder.get(a.deckId) ?? 99) - (levelOrder.get(b.deckId) ?? 99);
        if (levelDiff !== 0) {
          return levelDiff;
        }
        return a.word.length - b.word.length || a.word.localeCompare(b.word, "ja");
      });
    index.set(kanji.word, relatedWords);
  });

  state.kanjiVocabulary = index;
}

function parseCsv(text) {
  const rows = [];
  let cell = "";
  let row = [];
  let inQuotes = false;
  const cleanText = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < cleanText.length; i += 1) {
    const char = cleanText[i];
    const next = cleanText[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  const headers = rows.shift().map((header) => header.trim());
  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, (values[index] || "").trim()]))
  );
}

function startQuiz() {
  const mode = getModeConfig();
  if (!mode) {
    showModeMenu();
    return;
  }
  state.reviewMode = "normal";
  state.queueMode = getSelectedQueueMode();
  state.sessionGoal = els.sessionGoal.value;
  state.sessionProgress = createSessionProgress(state.sessionGoal);
  state.recentWordIds = [];
  state.failedWordIds = [];
  state.selectedIds = Array.from(els.deckChoices.querySelectorAll("input:checked")).map((input) => input.value);

  if (state.selectedIds.length === 0) {
    els.setupMessage.textContent = "Select at least one deck.";
    return;
  }

  state.activeWords = getSelectedWords();
  if (state.activeWords.length === 0) {
    showComplete();
    return;
  }

  els.deckLabel.textContent = `${getQueueModeLabel(state.queueMode)} · ${state.selectedIds.map((id) => id.toUpperCase()).join(" + ")}`;
  els.quizTitle.textContent = mode.quizTitle;
  els.modePanel.classList.add("hidden");
  els.focusPanel.classList.add("hidden");
  els.onboardingPanel.classList.add("hidden");
  els.statsPanel.classList.add("hidden");
  els.roadmapPanel.classList.add("hidden");
  els.mistakePanel.classList.add("hidden");
  els.setupPanel.classList.add("hidden");
  els.rememberPanel.classList.add("hidden");
  els.overviewPanel.classList.add("hidden");
  els.completePanel.classList.add("hidden");
  els.quizPanel.classList.remove("hidden");
  updateStats();
  showNextWord();
}

function startRememberQuiz() {
  const mode = getModeConfig();
  if (!mode) {
    showModeMenu();
    return;
  }
  const rememberedWords = getAllWords().filter((word) => isToRemember(word));
  if (rememberedWords.length === 0) {
    els.setupMessage.textContent = `No to-remember ${mode.pluralLabel} to review.`;
    return;
  }

  state.reviewMode = "remember";
  state.queueMode = "remember";
  state.sessionGoal = "open";
  state.sessionProgress = createSessionProgress("open");
  state.recentWordIds = [];
  state.failedWordIds = [];
  state.selectedIds = [];
  state.activeWords = rememberedWords;
  els.deckLabel.textContent = "To remember";
  els.quizTitle.textContent = `Review this ${mode.itemLabel}`;
  els.modePanel.classList.add("hidden");
  els.focusPanel.classList.add("hidden");
  els.onboardingPanel.classList.add("hidden");
  els.statsPanel.classList.add("hidden");
  els.roadmapPanel.classList.add("hidden");
  els.mistakePanel.classList.add("hidden");
  els.setupPanel.classList.add("hidden");
  els.rememberPanel.classList.add("hidden");
  els.overviewPanel.classList.add("hidden");
  els.completePanel.classList.add("hidden");
  els.quizPanel.classList.remove("hidden");
  updateStats();
  showNextWord();
}

function getSelectedWords() {
  if (state.reviewMode === "remember") {
    return getAllWords().filter((word) => isToRemember(word));
  }

  const selectedWords = state.selectedIds.flatMap((deckId) => getActiveDeckMap().get(deckId) || []);
  const dueWords = selectedWords.filter((word) => !isLearned(word));
  if (state.queueMode === "random") {
    return dueWords;
  }

  if (state.queueMode === "weak") {
    const weakWords = sortWeakItems(selectedWords).filter((word) => getMistakeStatsForWord(word).wrong > 0);
    return weakWords.length ? weakWords : dueWords;
  }

  const weakDueWords = sortWeakItems(dueWords).slice(0, 30);
  const rememberWords = selectedWords.filter((word) => isToRemember(word)).slice(0, 30);
  const retentionWords = selectedWords
    .filter((word) => isLearned(word) && !isToRemember(word))
    .sort((a, b) => getLastReviewedTime(a) - getLastReviewedTime(b))
    .slice(0, Math.min(20, Math.ceil(selectedWords.length * 0.08)));
  return uniqueWords([...weakDueWords, ...dueWords, ...rememberWords, ...retentionWords]);
}

function getSelectedQueueMode() {
  return document.querySelector('input[name="queueMode"]:checked')?.value || "daily";
}

function getQueueModeLabel(queueMode) {
  return {
    daily: "Today",
    weak: "Weak items",
    random: "Random due",
    remember: "To remember",
  }[queueMode] || "Review";
}

function createSessionProgress(goal) {
  return {
    goal,
    reviewed: 0,
    learned: 0,
    startedAt: Date.now(),
  };
}

function registerSessionProgress({ learnedAfter = false } = {}) {
  if (!state.sessionProgress) {
    state.sessionProgress = createSessionProgress(state.sessionGoal);
  }
  state.sessionProgress.reviewed += 1;
  if (learnedAfter) {
    registerSessionLearned();
  }
}

function registerSessionLearned() {
  if (!state.sessionProgress) {
    state.sessionProgress = createSessionProgress(state.sessionGoal);
  }
  state.sessionProgress.learned += 1;
}

function isSessionGoalReached() {
  const progress = state.sessionProgress;
  if (!progress || progress.goal === "open" || progress.reviewed === 0) {
    return false;
  }
  if (progress.goal === "20") {
    return progress.reviewed >= 20;
  }
  if (progress.goal === "10m") {
    return Date.now() - progress.startedAt >= 10 * 60 * 1000;
  }
  if (progress.goal === "5learned") {
    return progress.learned >= 5;
  }
  return false;
}

function getSessionGoalCompletionMessage() {
  const progress = state.sessionProgress || createSessionProgress(state.sessionGoal);
  if (progress.goal === "20") {
    return `Goal reached: ${progress.reviewed} items reviewed.`;
  }
  if (progress.goal === "10m") {
    return `Goal reached: 10 minutes of review completed with ${progress.reviewed} items reviewed.`;
  }
  if (progress.goal === "5learned") {
    return `Goal reached: ${progress.learned} items learned in this session.`;
  }
  return "Session goal reached.";
}

function updateSetupMessage() {
  const mode = getModeConfig();
  if (!mode || els.setupPanel.classList.contains("hidden")) {
    return;
  }
  const queue = getQueueModeLabel(getSelectedQueueMode()).toLowerCase();
  const goal = getSessionGoalLabel(els.sessionGoal.value).toLowerCase();
  els.setupMessage.textContent = `Choose decks for a ${queue} ${mode.itemLabel} session · ${goal}.`;
}

function getSessionGoalLabel(goal = state.sessionGoal) {
  return {
    open: "Open review",
    "20": "20 items",
    "10m": "10 minutes",
    "5learned": "5 learned",
  }[goal] || "Open review";
}

function uniqueWords(words) {
  const seen = new Set();
  return words.filter((word) => {
    if (!word || seen.has(word.id)) {
      return false;
    }
    seen.add(word.id);
    return true;
  });
}

function getMistakeStatsForWord(word) {
  const events = Array.isArray(getStatsProgress().events) ? getStatsProgress().events : [];
  return events.reduce(
    (stats, event) => {
      if (event.itemId !== word.id) {
        return stats;
      }
      stats.attempts += 1;
      if (!event.correct) {
        stats.wrong += 1;
      }
      return stats;
    },
    { attempts: 0, wrong: 0 }
  );
}

function sortWeakItems(words) {
  return [...words].sort((a, b) => {
    const aStats = getMistakeStatsForWord(a);
    const bStats = getMistakeStatsForWord(b);
    const aRate = aStats.attempts ? aStats.wrong / aStats.attempts : 0;
    const bRate = bStats.attempts ? bStats.wrong / bStats.attempts : 0;
    return bRate - aRate || bStats.wrong - aStats.wrong || bStats.attempts - aStats.attempts;
  });
}

function getLastReviewedTime(word) {
  const progress = getWordProgress(word);
  const timestamp = progress.lastAnsweredAt || progress.lastRememberReviewedAt || progress.lastManualStatusChangeAt;
  return timestamp ? new Date(timestamp).getTime() || 0 : 0;
}

function showNextWord() {
  if (isSessionGoalReached()) {
    state.completionMessage = getSessionGoalCompletionMessage();
    showComplete();
    return;
  }

  state.activeWords = getSelectedWords();
  if (state.activeWords.length === 0) {
    if (state.reviewMode === "remember") {
      showSetup();
      els.setupMessage.textContent = `No to-remember ${getModeConfig().pluralLabel} to review.`;
    } else {
      showComplete();
    }
    return;
  }

  state.currentWord = pickRandomWord(state.activeWords, state.currentWord);
  rememberAskedWord(state.currentWord, state.activeWords.length);
  els.wordDisplay.innerHTML = formatPrompt(state.currentWord);
  els.wordDisplay.classList.toggle("grammar-display", state.currentWord.kind === "grammar");
  els.wordDisplay.classList.toggle("english-display", getModeConfig().promptType === "meaning");
  els.answerInput.value = "";
  state.lastSubmittedAnswer = "";
  els.answerInput.disabled = false;
  els.submitAnswer.disabled = false;
  els.dontKnow.disabled = false;
  els.knowWord.disabled = false;
  els.knowWord.classList.toggle("hidden", state.reviewMode === "remember");
  els.feedback.className = "feedback hidden";
  els.exampleReveal.innerHTML = "";
  els.acceptAnswer.classList.add("hidden");
  els.acceptAnswer.disabled = false;
  els.toggleRemember.classList.add("hidden");
  updateStats();
  els.answerInput.focus();
}

function submitAnswer(rawAnswer) {
  if (!state.currentWord || els.submitAnswer.disabled) {
    return;
  }

  const answer = rawAnswer.trim();
  state.lastSubmittedAnswer = answer;
  const isCorrect = answer.length > 0 && isCorrectAnswer(answer, state.currentWord);
  const wordProgress = getWordProgress(state.currentWord);
  const correctBefore = wordProgress.correctCount || 0;

  if (state.reviewMode === "remember") {
    wordProgress.rememberAttempts = (wordProgress.rememberAttempts || 0) + 1;
    wordProgress.lastRememberReviewedAt = new Date().toISOString();
  } else if (isCorrect) {
    wordProgress.correctCount = Math.min(2, wordProgress.correctCount + 1);
  }
  const learnedAfter = state.reviewMode !== "remember" && correctBefore < 2 && wordProgress.correctCount >= 2;
  updateFailureCooldown(state.currentWord, isCorrect);
  if (state.reviewMode !== "remember") {
    wordProgress.attempts += 1;
    wordProgress.lastAnsweredAt = new Date().toISOString();
  }
  recordReviewEvent({
    word: state.currentWord,
    isCorrect,
    learnedAfter,
    manual: false,
  });
  registerSessionProgress({ learnedAfter });
  if (state.reviewMode === "remember") {
    state.progress[state.currentWord.id] = wordProgress;
    saveProgress();
  } else {
    state.progress[state.currentWord.id] = wordProgress;
    saveProgress();
  }

  els.resultLabel.textContent = isCorrect ? "Correct" : "Incorrect";
  els.answerReveal.textContent = getAnswerRevealText(state.currentWord);
  els.exampleReveal.innerHTML = renderExample(state.currentWord);
  if (state.reviewMode === "remember") {
    els.progressNote.textContent = "To-remember review does not change normal 2/2 progress.";
  } else {
    const itemLabel = getModeConfig().itemLabel;
    els.progressNote.textContent =
      wordProgress.correctCount >= 2
        ? `Learned. This ${itemLabel} will no longer appear.`
        : `${wordProgress.correctCount}/2 correct answers for this ${itemLabel}.`;
  }
  els.feedback.className = `feedback ${isCorrect ? "correct" : "incorrect"}`;
  els.answerInput.disabled = true;
  els.submitAnswer.disabled = true;
  els.dontKnow.disabled = true;
  els.knowWord.disabled = true;
  updateStats();
  renderDeckChoices();
  renderRememberList();
  renderOverviewLists();
  renderProgressStats();
  updateRememberAction();
  updateAcceptAnswerAction(isCorrect);
  els.nextWord.focus();
}

function markCurrentWordLearned() {
  if (!state.currentWord || els.knowWord.disabled) {
    return;
  }

  const wordProgress = getWordProgress(state.currentWord);
  const correctBefore = wordProgress.correctCount || 0;
  wordProgress.correctCount = 2;
  wordProgress.attempts += 1;
  wordProgress.manuallyLearned = true;
  wordProgress.lastAnsweredAt = new Date().toISOString();
  updateFailureCooldown(state.currentWord, true);
  recordReviewEvent({
    word: state.currentWord,
    isCorrect: true,
    learnedAfter: correctBefore < 2,
    manual: true,
  });
  registerSessionProgress({ learnedAfter: correctBefore < 2 });
  state.progress[state.currentWord.id] = wordProgress;
  saveProgress();

  els.resultLabel.textContent = "Marked learned";
  els.answerReveal.textContent = getAnswerRevealText(state.currentWord);
  els.exampleReveal.innerHTML = renderExample(state.currentWord);
  els.progressNote.textContent = `This ${getModeConfig().itemLabel} has been moved to learned and will no longer appear.`;
  els.feedback.className = "feedback correct";
  els.answerInput.disabled = true;
  els.submitAnswer.disabled = true;
  els.dontKnow.disabled = true;
  els.knowWord.disabled = true;
  updateStats();
  renderDeckChoices();
  renderRememberList();
  renderOverviewLists();
  renderProgressStats();
  updateRememberAction();
  els.nextWord.focus();
}

function updateRememberAction() {
  if (!state.currentWord || !isLearned(state.currentWord)) {
    els.toggleRemember.classList.add("hidden");
    return;
  }

  els.toggleRemember.classList.remove("hidden");
  els.toggleRemember.textContent = isToRemember(state.currentWord) ? "Remove from remember" : "Add to remember";
}

function updateAcceptAnswerAction(isCorrect) {
  const canAccept =
    state.currentWord &&
    state.reviewMode !== "remember" &&
    !isCorrect &&
    state.lastSubmittedAnswer.trim().length > 0;
  els.acceptAnswer.classList.toggle("hidden", !canAccept);
  els.acceptAnswer.disabled = !canAccept;
}

function acceptLastAnswer() {
  if (!state.currentWord || els.acceptAnswer.disabled) {
    return;
  }

  const normalizedAnswer =
    getModeConfig().answerType === "japanese"
      ? normalizeJapaneseFreeAnswer(state.lastSubmittedAnswer)
      : normalizeAnswer(state.lastSubmittedAnswer);
  if (!normalizedAnswer) {
    return;
  }

  const wordProgress = getWordProgress(state.currentWord);
  const correctBefore = wordProgress.correctCount || 0;
  const acceptedAnswers = new Set(wordProgress.acceptedAnswers || []);
  acceptedAnswers.add(normalizedAnswer);
  wordProgress.acceptedAnswers = Array.from(acceptedAnswers).sort();
  wordProgress.correctCount = Math.min(2, (wordProgress.correctCount || 0) + 1);
  if (correctBefore < 2 && wordProgress.correctCount >= 2) {
    registerSessionLearned();
  }
  wordProgress.lastAcceptedAnswerAt = new Date().toISOString();
  state.progress[state.currentWord.id] = wordProgress;
  updateFailureCooldown(state.currentWord, true);
  saveProgress();

  els.resultLabel.textContent = "Accepted";
  els.feedback.className = "feedback correct";
  els.acceptAnswer.classList.add("hidden");
  els.acceptAnswer.disabled = true;
  const itemLabel = getModeConfig().itemLabel;
  els.progressNote.textContent =
    wordProgress.correctCount >= 2
      ? `Learned. This ${itemLabel} will no longer appear. Your answer was saved for this item.`
      : `${wordProgress.correctCount}/2 correct answers for this ${itemLabel}. Your answer was saved for this item.`;
  updateStats();
  renderDeckChoices();
  renderRememberList();
  renderOverviewLists();
  renderProgressStats();
  updateRememberAction();
}

function toggleRememberWord(word, forceValue = null) {
  if (!word) {
    return;
  }

  const wordProgress = getWordProgress(word);
  const nextValue = forceValue === null ? !Boolean(wordProgress.toRemember) : forceValue;
  wordProgress.toRemember = nextValue;
  wordProgress.toRememberUpdatedAt = new Date().toISOString();
  state.progress[word.id] = wordProgress;
  saveProgress();

  renderDeckChoices();
  renderRememberList();
  renderOverviewLists();
  updateStats();

  if (state.currentWord && state.currentWord.id === word.id) {
    updateRememberAction();
    els.progressNote.textContent = nextValue
      ? "Added to to-remember review. Normal learned progress is unchanged."
      : "Removed from to-remember review. Normal learned progress is unchanged.";
  }
}

function getAcceptedAnswers(word) {
  if (getModeConfig().answerType === "japanese") {
    return getAcceptedJapaneseAnswers(word);
  }

  const meaning = word.meaning;
  const withoutParentheses = meaning.replace(/\([^)]*\)/g, " ");
  const pieces = [meaning, withoutParentheses]
    .flatMap((value) => value.split(/[,;/]| or | and /i))
    .map(normalizeAnswer)
    .filter(Boolean);
  const customAnswers = (getWordProgress(word).acceptedAnswers || []).map(normalizeAnswer).filter(Boolean);
  return Array.from(new Set([normalizeAnswer(meaning), normalizeAnswer(withoutParentheses), ...pieces, ...customAnswers]));
}

function isCorrectAnswer(answer, word) {
  const accepted = getAcceptedAnswers(word);
  return getModeConfig().answerType === "japanese"
    ? isAcceptedJapaneseAnswer(answer, accepted)
    : isAcceptedAnswer(answer, accepted);
}

function getAcceptedJapaneseAnswers(word) {
  const japaneseForms = splitJapaneseAnswerAlternatives(word.word);
  const readingForms = splitJapaneseAnswerAlternatives(word.reading);
  const customAnswers = (getWordProgress(word).acceptedAnswers || []).map(normalizeJapaneseFreeAnswer).filter(Boolean);
  const accepted = [];

  japaneseForms.forEach((form) => {
    accepted.push(normalizeJapaneseScriptAnswer(form));
    accepted.push(normalizeJapaneseFreeAnswer(form));
  });
  readingForms.forEach((form) => {
    accepted.push(normalizeJapaneseScriptAnswer(form));
    accepted.push(normalizeJapaneseFreeAnswer(form));
    expandRomajiVariants(kanaToRomaji(form)).forEach((variant) => accepted.push(variant));
  });

  return Array.from(new Set([...accepted, ...customAnswers].filter(Boolean)));
}

function isAcceptedJapaneseAnswer(answer, acceptedAnswers) {
  const scriptAnswer = normalizeJapaneseScriptAnswer(answer);
  const freeAnswer = normalizeJapaneseFreeAnswer(answer);
  const romajiAnswers = expandRomajiVariants(answer);
  return [scriptAnswer, freeAnswer, ...romajiAnswers].some((candidate) => candidate && acceptedAnswers.includes(candidate));
}

function isAcceptedAnswer(answer, acceptedAnswers) {
  const normalized = normalizeAnswer(answer);
  if (!normalized) {
    return false;
  }
  if (acceptedAnswers.includes(normalized)) {
    return true;
  }
  if (acceptedAnswers.some((accepted) => isCloseEnglishAnswer(normalized, accepted))) {
    return true;
  }

  const answerTokens = normalized.split(" ").filter(Boolean);
  if (!answerTokens.length || (answerTokens.length === 1 && answerTokens[0].length < 3)) {
    return false;
  }
  const answerStems = answerTokens.map(stemEnglishToken);
  const answerCoreStems = answerTokens.filter((token) => !isOptionalAnswerToken(token)).map(stemEnglishToken);
  return acceptedAnswers.some((accepted) => {
    const acceptedTokens = accepted.split(" ").filter(Boolean);
    if (answerTokens.length === 1 && acceptedTokens.length !== 1) {
      return isHeadNounAnswer(answerStems[0], acceptedTokens);
    }
    const acceptedStems = new Set(acceptedTokens.map(stemEnglishToken));
    const acceptedCoreStems = new Set(acceptedTokens.filter((token) => !isOptionalAnswerToken(token)).map(stemEnglishToken));
    if (answerCoreStems.length && answerCoreStems.every((stem) => acceptedCoreStems.has(stem))) {
      return true;
    }
    if (isCloseTokenSet(answerStems, acceptedTokens.map(stemEnglishToken))) {
      return true;
    }
    return answerStems.every((stem) => acceptedStems.has(stem));
  });
}

function isCloseEnglishAnswer(answer, accepted) {
  if (answer.length < 5 || accepted.length < 5) {
    return false;
  }
  const distance = levenshteinDistance(answer, accepted);
  const longest = Math.max(answer.length, accepted.length);
  return distance <= 1 || (distance <= 2 && 1 - distance / longest >= 0.84);
}

function isCloseTokenSet(answerStems, acceptedStems) {
  if (answerStems.length < 2 || acceptedStems.length < 2) {
    return false;
  }
  const accepted = new Set(acceptedStems);
  const matched = answerStems.filter((stem) => accepted.has(stem)).length;
  return matched >= Math.max(2, Math.ceil(Math.min(answerStems.length, acceptedStems.length) * 0.8));
}

function levenshteinDistance(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const nextDiagonal = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      diagonal = nextDiagonal;
    }
  }
  return previous[b.length];
}

function isOptionalAnswerToken(token) {
  return ["some", "any", "certain", "particular"].includes(token);
}

function isHeadNounAnswer(answerStem, acceptedTokens) {
  if (acceptedTokens.length < 2 || acceptedTokens.length > 3) {
    return false;
  }
  const acceptedStems = acceptedTokens.map(stemEnglishToken);
  const lastStem = acceptedStems[acceptedStems.length - 1];
  if (answerStem !== lastStem) {
    return false;
  }
  const qualifiers = new Set([
    "cook",
    "cooked",
    "uncook",
    "uncooked",
    "raw",
    "boiled",
    "fried",
    "steamed",
    "hot",
    "cold",
    "big",
    "small",
    "old",
    "new",
    "young",
    "main",
    "formal",
    "informal",
    "polite",
    "humble",
    "honorific",
  ]);
  return acceptedStems.slice(0, -1).every((stem) => qualifiers.has(stem));
}

function stemEnglishToken(token) {
  const irregular = {
    cooked: "cook",
    exception: "except",
    excepting: "except",
    exceptions: "except",
    safe: "safety",
    safely: "safety",
    secure: "security",
    securely: "security",
    uncooked: "uncook",
  };
  if (irregular[token]) {
    return irregular[token];
  }
  if (token.length > 5 && token.endsWith("ing")) {
    return token.slice(0, -3);
  }
  if (token.length > 5 && token.endsWith("ed")) {
    return token.slice(0, -2);
  }
  if (token.length > 6 && token.endsWith("ions")) {
    return token.slice(0, -4);
  }
  if (token.length > 5 && token.endsWith("ion")) {
    return token.slice(0, -3);
  }
  if (token.length > 4 && token.endsWith("s")) {
    return token.slice(0, -1);
  }
  return token;
}

function renderExample(word) {
  if (word.kind === "kanji") {
    const onReadings = word.onReadings && word.onReadings.length ? word.onReadings.join(" / ") : "None listed";
    const kunReadings = word.kunReadings && word.kunReadings.length ? word.kunReadings.join(" / ") : "None listed";
    const details = [
      word.strokes ? `${word.strokes} strokes` : "",
      word.frequency ? `frequency rank ${word.frequency}` : "",
      word.grade ? `grade ${word.grade}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return `
      <div class="example-box">
        <p><span>ON</span>${escapeHtml(onReadings)}</p>
        <p><span>KUN</span>${escapeHtml(kunReadings)}</p>
        ${details ? `<p><span>INFO</span>${escapeHtml(details)}</p>` : ""}
      </div>
      ${renderAssociatedWords(word)}
    `;
  }

  if (word.kind === "grammar") {
    return renderGrammarDetails(word);
  }

  const example = state.examples[word.sourceId || word.id];
  if (!example) {
    return `
      <div class="example-box">
        <p><span>例</span>No generated example for this word yet.</p>
        <p><span>EN</span>Run <code>OPENAI_API_KEY=... python3 scripts/generate_examples.py</code> to generate authored examples.</p>
      </div>
    `;
  }
  return `
    <div class="example-box">
      <p><span>例</span>${escapeHtml(example.japanese)}</p>
      <p><span>EN</span>${escapeHtml(example.english)}</p>
    </div>
  `;
}

function renderGrammarDetails(word, density = "full") {
  const examples = word.examples || [];
  const connection = word.connection
    ? `<p class="grammar-connection"><span>USE</span>${escapeHtml(word.connection)}</p>`
    : `<p class="grammar-connection"><span>USE</span>Fixed expression / pattern: ${escapeHtml(word.word)}</p>`;
  const usageJapanese = word.usageJapanese ? `<p><span>JP</span>${escapeHtml(word.usageJapanese)}</p>` : "";
  const usageNotes = word.usageNotes ? `<p><span>NOTE</span>${escapeHtml(word.usageNotes)}</p>` : "";
  const related = word.related ? `<p><span>RELATED</span>${escapeHtml(word.related)}</p>` : "";
  return `
    <div class="example-box grammar-info">
      ${connection}
      ${usageJapanese}
      ${usageNotes}
      ${related}
      <p><span>EX</span>${examples.length} example sentence${examples.length === 1 ? "" : "s"}</p>
    </div>
    <div class="grammar-examples ${density}">
      <div class="associated-heading">
        <strong>Example sentences</strong>
        <span>${examples.length}</span>
      </div>
      ${
        examples.length
          ? `<div class="grammar-example-list">
              ${examples
                .map(
                  (example) => `
                    <article class="grammar-example-item">
                      <p class="jp-example">${escapeHtml(example.japanese)}</p>
                      <p>${escapeHtml(example.english)}</p>
                      ${example.pronunciation ? `<small>${escapeHtml(example.pronunciation)}</small>` : ""}
                    </article>
                  `
                )
                .join("")}
            </div>`
          : `<p class="empty-list">No examples found for this grammar point.</p>`
      }
    </div>
  `;
}

function renderAssociatedWords(kanji, density = "full") {
  const words = state.kanjiVocabulary.get(kanji.word) || [];
  if (!words.length) {
    return `
      <div class="associated-words ${density}">
        <div class="associated-heading">
          <strong>Important words using ${escapeHtml(kanji.word)}</strong>
          <span>0</span>
        </div>
        <p class="empty-list">No matching vocabulary words found in the JLPT vocabulary decks.</p>
      </div>
    `;
  }

  return `
    <div class="associated-words ${density}">
      <div class="associated-heading">
        <strong>Important words using ${escapeHtml(kanji.word)}</strong>
        <span>${words.length}</span>
      </div>
      <div class="associated-list">
        ${words
          .map((word) => {
            const display = getDisplayParts(word);
            const reading =
              display.wordText === display.readingText
                ? ""
                : `<span class="list-reading">${escapeHtml(display.readingText)}</span>`;
            return `
              <article class="associated-item">
                <div>
                  <span class="remember-deck">${word.deckId.toUpperCase()}</span>
                  <strong>${escapeHtml(display.wordText)}</strong>
                  ${reading}
                </div>
                <p>${escapeHtml(word.meaning)}</p>
              </article>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function normalizeAnswer(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(to|a|an|the)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeJapaneseScriptAnswer(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/[・\s、。.,;；/／|｜\-〜～~()[\]{}"'’‘“”]+/g, "")
    .trim();
}

function normalizeJapaneseFreeAnswer(value) {
  const compact = normalizeJapaneseScriptAnswer(value);
  if (!compact) {
    return "";
  }
  return containsKana(compact) && !containsKanji(compact) ? normalizeRomajiAnswer(kanaToRomaji(compact)) : compact;
}

function normalizeRomajiAnswer(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/ō/g, "ou")
    .replace(/ū/g, "uu")
    .replace(/ā/g, "aa")
    .replace(/ē/g, "ee")
    .replace(/ī/g, "ii")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function containsKana(value) {
  return /[\u3040-\u30ff]/.test(value);
}

function containsKanji(value) {
  return /[\u3400-\u9fff]/.test(value);
}

function splitJapaneseAnswerAlternatives(value) {
  return stripJapaneseAnswerContext(value)
    .split(/[;；、,／/|｜]/)
    .map((part) => stripJapaneseAnswerContext(part).trim())
    .filter(Boolean);
}

function stripJapaneseAnswerContext(value) {
  return value
    .replace(/^[（(][^）)]*[）)]\s*/g, "")
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/^[~〜～]+/, "")
    .trim();
}

function expandRomajiVariants(value) {
  const base = normalizeRomajiAnswer(value);
  if (!base) {
    return [];
  }

  const variants = new Set([base]);
  const substitutions = [
    [/shi/g, "si"],
    [/si/g, "shi"],
    [/chi/g, "ti"],
    [/ti/g, "chi"],
    [/tsu/g, "tu"],
    [/tu/g, "tsu"],
    [/fu/g, "hu"],
    [/hu/g, "fu"],
    [/ji/g, "zi"],
    [/zi/g, "ji"],
  ];
  Array.from(variants).forEach((candidate) => {
    substitutions.forEach(([pattern, replacement]) => {
      variants.add(candidate.replace(pattern, replacement));
    });
  });
  Array.from(variants).forEach((candidate) => {
    variants.add(candidate.replace(/ou/g, "oo"));
    variants.add(candidate.replace(/ou/g, "o"));
    variants.add(candidate.replace(/uu/g, "u"));
  });
  return Array.from(variants);
}

function kanaToRomaji(value) {
  const kana = value.normalize("NFKC").replace(/[\u30a1-\u30f6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60)
  );
  const digraphs = {
    きゃ: "kya", きゅ: "kyu", きょ: "kyo",
    しゃ: "sha", しゅ: "shu", しょ: "sho",
    ちゃ: "cha", ちゅ: "chu", ちょ: "cho",
    にゃ: "nya", にゅ: "nyu", にょ: "nyo",
    ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
    みゃ: "mya", みゅ: "myu", みょ: "myo",
    りゃ: "rya", りゅ: "ryu", りょ: "ryo",
    ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
    じゃ: "ja", じゅ: "ju", じょ: "jo",
    びゃ: "bya", びゅ: "byu", びょ: "byo",
    ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
  };
  const singles = {
    あ: "a", い: "i", う: "u", え: "e", お: "o",
    か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
    さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
    た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
    な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
    は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
    ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
    や: "ya", ゆ: "yu", よ: "yo",
    ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
    わ: "wa", を: "wo", ん: "n",
    が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
    ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
    だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
    ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
    ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
    ゔ: "vu", ゐ: "wi", ゑ: "we",
    ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o",
    ゃ: "ya", ゅ: "yu", ょ: "yo", ゎ: "wa",
  };
  let romaji = "";
  let doubleNext = false;

  for (let index = 0; index < kana.length; index += 1) {
    const char = kana[index];
    if (char === "っ") {
      doubleNext = true;
      continue;
    }
    if (char === "ー") {
      const lastVowel = romaji.match(/[aeiou]$/);
      if (lastVowel) {
        romaji += lastVowel[0];
      }
      continue;
    }

    const pair = kana.slice(index, index + 2);
    let syllable = digraphs[pair];
    if (syllable) {
      index += 1;
    } else {
      syllable = singles[char] || char;
    }
    if (doubleNext && /^[bcdfghjklmnpqrstvwxyz]/.test(syllable)) {
      romaji += syllable[0];
    }
    romaji += syllable;
    doubleNext = false;
  }

  return romaji;
}

function formatWord(word) {
  if (word.kind === "kanji" || word.kind === "grammar") {
    return escapeHtml(word.word);
  }

  const wordParts = splitAlternatives(word.word);
  const readingParts = splitAlternatives(word.reading);

  return wordParts
    .map((wordPart, index) => {
      const readingPart =
        wordParts.length === 1 && readingParts.length > 1 ? readingParts.join(" / ") : readingParts[index] || readingParts[0] || "";
      const safeWord = escapeHtml(wordPart);
      const safeReading = escapeHtml(readingPart);
      if (!readingPart || wordPart === readingPart) {
        return safeWord;
      }
      return `<ruby>${safeWord}<rt>${safeReading}</rt></ruby>`;
    })
    .join('<span class="word-separator">/</span>');
}

function formatPrompt(word) {
  if (getModeConfig().promptType === "meaning") {
    return `<span class="english-prompt">${escapeHtml(word.meaning)}</span>`;
  }
  return formatWord(word);
}

function getAnswerRevealText(word) {
  if (getModeConfig().answerType === "japanese") {
    const display = getDisplayParts(word);
    const reading = display.wordText === display.readingText ? "" : ` [${display.readingText}]`;
    return `Answer: ${display.wordText}${reading} - ${word.meaning}`;
  }
  return `Answer: ${word.meaning}`;
}

function getDisplayParts(word) {
  return {
    wordText: splitAlternatives(word.word).join(" / "),
    readingText: splitAlternatives(word.reading).join(" / "),
  };
}

function splitAlternatives(value) {
  return value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getAllWords() {
  return getActiveDecks().flatMap((deck) => getActiveDeckMap().get(deck.id) || []);
}

function findWordById(wordId) {
  return getAllWords().find((word) => word.id === wordId);
}

function getAllStudyItems() {
  return Object.values(studyModes).flatMap((mode) => mode.decks.flatMap((deck) => state.allDecks[mode.id].get(deck.id) || []));
}

function findAnyWordById(wordId) {
  return getAllStudyItems().find((word) => word.id === wordId);
}

function pickRandomWord(words, previousWord) {
  if (words.length <= 1) {
    return words[0];
  }

  const recentIds = new Set(state.recentWordIds);
  const failedIds = new Set(state.failedWordIds);
  let candidates = words.filter((word) => !recentIds.has(word.id) && !failedIds.has(word.id));
  if (candidates.length === 0) {
    candidates = words.filter((word) => !failedIds.has(word.id));
  }
  if (candidates.length === 0) {
    candidates = words.filter((word) => !previousWord || word.id !== previousWord.id);
  }
  if (candidates.length === 0) {
    candidates = words;
  }
  if (state.reviewMode !== "remember" && (state.queueMode === "weak" || state.queueMode === "daily")) {
    candidates = rankQueueCandidates(candidates).slice(0, Math.min(candidates.length, 40));
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function rankQueueCandidates(words) {
  return [...words].sort((a, b) => getQueuePriority(b) - getQueuePriority(a));
}

function getQueuePriority(word) {
  const stats = getMistakeStatsForWord(word);
  const rate = stats.attempts ? stats.wrong / stats.attempts : 0;
  const ageHours = Math.min(168, Math.max(0, (Date.now() - getLastReviewedTime(word)) / 36e5 || 168));
  if (state.queueMode === "weak") {
    return rate * 10 + stats.wrong + ageHours / 168;
  }
  return (isLearned(word) ? 0 : 4) + (isToRemember(word) ? 3 : 0) + rate * 4 + Math.min(stats.wrong, 5) + ageHours / 168;
}

function rememberAskedWord(word, poolSize) {
  if (!word) {
    return;
  }

  const maxRecent = getRecentLimit(poolSize);
  state.recentWordIds = state.recentWordIds.filter((id) => id !== word.id);
  state.recentWordIds.push(word.id);
  if (state.recentWordIds.length > maxRecent) {
    state.recentWordIds = state.recentWordIds.slice(-maxRecent);
  }
}

function updateFailureCooldown(word, isCorrect) {
  if (!word) {
    return;
  }

  state.failedWordIds = state.failedWordIds.filter((id) => id !== word.id);
  if (!isCorrect) {
    state.failedWordIds.push(word.id);
  }

  const maxFailed = getFailureLimit(state.activeWords.length || getSelectedWords().length);
  if (state.failedWordIds.length > maxFailed) {
    state.failedWordIds = state.failedWordIds.slice(-maxFailed);
  }
}

function getRecentLimit(poolSize) {
  if (poolSize <= 2) {
    return 1;
  }
  return Math.min(30, Math.max(6, Math.floor(poolSize / 2)));
}

function getFailureLimit(poolSize) {
  if (poolSize <= 2) {
    return 1;
  }
  return Math.min(60, Math.max(12, Math.floor(poolSize * 0.75)));
}

function getWordProgress(word) {
  return state.progress[word.id] || { correctCount: 0, attempts: 0, lastAnsweredAt: null, toRemember: false };
}

function isLearned(word) {
  return getWordProgress(word).correctCount >= 2;
}

function isToRemember(word) {
  return Boolean(getWordProgress(word).toRemember);
}

function normalizeSearchText(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function getWordStatusText(word, progress = getWordProgress(word)) {
  const baseStatus = `${Math.min(progress.correctCount || 0, 2)}/2 correct`;
  if (isToRemember(word)) {
    return `${baseStatus} · to remember`;
  }
  if ((progress.correctCount || 0) >= 2) {
    return `${baseStatus} · learned`;
  }
  return baseStatus;
}

function updateStats() {
  els.sessionProgressCount.textContent = getSessionProgressText();
  if (state.reviewMode === "remember") {
    const rememberedWords = getAllWords().filter((word) => isToRemember(word));
    els.remainingCount.textContent = rememberedWords.length;
    els.learnedCount.textContent = "∞";
    return;
  }

  const selectedWords = state.selectedIds.flatMap((deckId) => getActiveDeckMap().get(deckId) || []);
  const learned = selectedWords.filter((word) => isLearned(word)).length;
  const remaining = selectedWords.length - learned;
  els.remainingCount.textContent = remaining;
  els.learnedCount.textContent = learned;
}

function getSessionProgressText() {
  const progress = state.sessionProgress || createSessionProgress(state.sessionGoal);
  if (progress.goal === "20") {
    return `${progress.reviewed}/20`;
  }
  if (progress.goal === "10m") {
    const elapsedMinutes = Math.min(10, Math.floor((Date.now() - progress.startedAt) / 60000));
    return `${elapsedMinutes}/10m`;
  }
  if (progress.goal === "5learned") {
    return `${progress.learned}/5`;
  }
  return String(progress.reviewed || 0);
}

function showModeMenu() {
  state.studyMode = null;
  state.reviewMode = "normal";
  state.currentWord = null;
  els.modePanel.classList.remove("hidden");
  els.focusPanel.classList.remove("hidden");
  renderOnboarding();
  els.statsPanel.classList.remove("hidden");
  els.roadmapPanel.classList.remove("hidden");
  els.mistakePanel.classList.remove("hidden");
  els.setupPanel.classList.add("hidden");
  els.rememberPanel.classList.add("hidden");
  els.overviewPanel.classList.add("hidden");
  els.quizPanel.classList.add("hidden");
  els.completePanel.classList.add("hidden");
  renderProgressStats();
}

function showSetup() {
  if (!state.studyMode) {
    showModeMenu();
    return;
  }
  applyModeText();
  state.reviewMode = "normal";
  els.modePanel.classList.add("hidden");
  els.focusPanel.classList.add("hidden");
  els.onboardingPanel.classList.add("hidden");
  els.statsPanel.classList.add("hidden");
  els.roadmapPanel.classList.add("hidden");
  els.mistakePanel.classList.add("hidden");
  els.setupPanel.classList.remove("hidden");
  els.rememberPanel.classList.remove("hidden");
  els.overviewPanel.classList.remove("hidden");
  els.quizPanel.classList.add("hidden");
  els.completePanel.classList.add("hidden");
  renderDeckChoices();
  renderRememberList();
  renderOverviewLists();
  updateSetupMessage();
}

function showComplete() {
  const mode = getModeConfig();
  els.quizPanel.classList.add("hidden");
  els.modePanel.classList.add("hidden");
  els.focusPanel.classList.add("hidden");
  els.onboardingPanel.classList.add("hidden");
  els.statsPanel.classList.add("hidden");
  els.roadmapPanel.classList.add("hidden");
  els.mistakePanel.classList.add("hidden");
  els.setupPanel.classList.add("hidden");
  els.rememberPanel.classList.add("hidden");
  els.overviewPanel.classList.add("hidden");
  els.completePanel.classList.remove("hidden");
  document.querySelector("#completeTitle").textContent = state.completionMessage ? "Session complete" : "Deck complete";
  els.completePanel.querySelector("p").textContent =
    state.completionMessage ||
    `Every ${mode ? mode.itemLabel : "item"} in the selected decks has reached two correct answers and is marked learned.`;
  state.completionMessage = "";
}

function resetProgress() {
  if (!window.confirm("Reset learned words and answer history?")) {
    return;
  }
  state.progress = {};
  saveProgress();
  updateStats();
  renderDeckChoices();
  renderRememberList();
  renderOverviewLists();
  renderProgressStats();
  els.setupMessage.textContent = "Progress reset.";
  if (!els.quizPanel.classList.contains("hidden")) {
    showNextWord();
  }
}

function exportProgress() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "Study JLPT",
    progress: state.progress,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2) + "\n"], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `study-jlpt-progress-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function importProgress(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  try {
    const payload = JSON.parse(await file.text());
    const nextProgress = payload && payload.progress && typeof payload.progress === "object" ? payload.progress : payload;
    if (!nextProgress || Array.isArray(nextProgress) || typeof nextProgress !== "object") {
      throw new Error("Progress file must contain a JSON object.");
    }
    if (!window.confirm("Import this progress file and replace the current progress?")) {
      return;
    }

    state.progress = nextProgress;
    await saveProgress();
    updateStats();
    renderDeckChoices();
    renderRememberList();
    renderOverviewLists();
    renderProgressStats();
    els.setupMessage.textContent = `Progress imported from ${file.name}.`;
    if (!els.quizPanel.classList.contains("hidden")) {
      showNextWord();
    }
  } catch (error) {
    window.alert(`Could not import progress: ${error.message}`);
  } finally {
    els.importProgressFile.value = "";
  }
}

async function loadProgress() {
  const browserProgress = loadBrowserProgress();
  try {
    const response = await fetch("/api/progress", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Progress API returned ${response.status}`);
    }
    const fileProgress = await response.json();
    state.progressBackend = "file";
    state.progress = Object.keys(fileProgress).length ? fileProgress : browserProgress;
    if (Object.keys(browserProgress).length && !Object.keys(fileProgress).length) {
      await saveProgress();
    }
    return;
  } catch {
    state.progressBackend = "browser";
    state.progress = browserProgress;
  }
}

async function loadExamples() {
  try {
    const response = await fetch("data/examples.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Examples returned ${response.status}`);
    }
    const payload = await response.json();
    state.examples = payload && typeof payload === "object" ? payload : {};
  } catch {
    state.examples = {};
  }
}

function loadBrowserProgress() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

async function saveProgress() {
  localStorage.setItem(storageKey, JSON.stringify(state.progress));
  if (state.progressBackend !== "file") {
    return;
  }
  try {
    const response = await fetch("/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.progress),
    });
    if (!response.ok) {
      throw new Error(`Progress API returned ${response.status}`);
    }
  } catch {
    state.progressBackend = "browser";
    els.setupMessage.textContent = "Could not write progress file. Falling back to browser storage.";
  }
}

function getProgressLocationLabel() {
  return state.progressBackend === "file" ? "to progress.json in this folder" : "in this browser";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}
