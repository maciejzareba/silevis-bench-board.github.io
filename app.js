const DB_NAME = "silevisBenchPressDb";
const DB_VERSION = 2;
const META_STORE = "meta";
const LEGACY_BENCH_STORE = "results";
const INITIALIZED_SUFFIX = "initialized";

const benchSeedData = [
  { name: "Michał Nowak", heightCm: 180, bodyWeightKg: 85, liftedKg: 145 },
  { name: "Kamil Wójcik", heightCm: 175, bodyWeightKg: 80, liftedKg: 137.5 },
  { name: "Paweł Zieliński", heightCm: 185, bodyWeightKg: 105, liftedKg: 155 },
  { name: "Tomasz Krawczyk", heightCm: 178, bodyWeightKg: 90, liftedKg: 125 },
  { name: "Mateusz Lewandowski", heightCm: 172, bodyWeightKg: 75, liftedKg: 120 },
  { name: "Jakub Szymański", heightCm: 170, bodyWeightKg: 70, liftedKg: 115 },
  { name: "Łukasz Piotrowski", heightCm: 182, bodyWeightKg: 92, liftedKg: 130 },
  { name: "Marcin Dąbrowski", heightCm: 176, bodyWeightKg: 82, liftedKg: 110 }
];

const pullupSeedData = [
  { name: "Michał Nowak", heightCm: 180, bodyWeightKg: 85, reps: 14 },
  { name: "Kamil Wójcik", heightCm: 175, bodyWeightKg: 80, reps: 16 },
  { name: "Paweł Zieliński", heightCm: 185, bodyWeightKg: 105, reps: 10 },
  { name: "Tomasz Krawczyk", heightCm: 178, bodyWeightKg: 90, reps: 12 },
  { name: "Mateusz Lewandowski", heightCm: 172, bodyWeightKg: 75, reps: 18 },
  { name: "Jakub Szymański", heightCm: 170, bodyWeightKg: 70, reps: 20 },
  { name: "Łukasz Piotrowski", heightCm: 182, bodyWeightKg: 92, reps: 11 },
  { name: "Marcin Dąbrowski", heightCm: 176, bodyWeightKg: 82, reps: 13 }
];

function calculateBenchPressPoints({ liftedKg, bodyWeightKg, heightCm }) {
  if (liftedKg <= 0 || bodyWeightKg <= 0 || heightCm <= 0) {
    return 0;
  }

  const bodyWeightFactor = Math.pow(80 / bodyWeightKg, 0.67);
  const heightFactor = Math.pow(heightCm / 175, 0.25);

  const points = liftedKg * bodyWeightFactor * heightFactor;

  return Math.round(points * 10) / 10;
}

function calculatePullUpPoints({ reps, bodyWeightKg, heightCm }) {
  if (reps <= 0 || bodyWeightKg <= 0 || heightCm <= 0) {
    return 0;
  }

  const bodyWeightFactor = Math.pow(bodyWeightKg / 80, 0.67);
  const heightFactor = Math.pow(heightCm / 175, 0.15);
  const points = reps * 10 * bodyWeightFactor * heightFactor;

  return Math.round(points * 10) / 10;
}

const activities = {
  bench: {
    key: "bench",
    label: "Wyciskanie",
    subtitle: "Wyciskanie na klatę",
    boardTitle: "Najmocniejsza klata",
    formIcon: "♙",
    addTitle: "Dodaj wynik",
    editTitle: "Edytuj wynik",
    storeName: "benchResults",
    legacyStoreName: LEGACY_BENCH_STORE,
    legacyStorageKey: "silevisBenchPressResults",
    valueKey: "liftedKg",
    valueLabel: "Wynik na klatę (kg)",
    valuePlaceholder: "np. 125",
    valueMin: 20,
    valueMax: 300,
    valueStep: 0.5,
    valueUnit: "kg",
    valueUnitA11y: "kilogramów",
    valueSortLabel: "Wynik kg malejąco",
    valueValidationMessage: "Wynik na klatę musi być w zakresie od 20 do 300 kg.",
    csvValueHeader: "Wynik kg",
    fileSlug: "wyciskanie",
    seedData: benchSeedData,
    scoreInfo: "Punkty uwzględniają wynik, wagę ciała i wzrost zawodnika.",
    calculatePoints: calculateBenchPressPoints
  },
  pullups: {
    key: "pullups",
    label: "Podciąganie",
    subtitle: "Podciąganie na drążku",
    boardTitle: "Mistrzowie drążka",
    formIcon: "↟",
    addTitle: "Dodaj wynik",
    editTitle: "Edytuj wynik",
    storeName: "pullupResults",
    legacyStorageKey: "silevisPullUpResults",
    valueKey: "reps",
    valueLabel: "Liczba podciągnięć",
    valuePlaceholder: "np. 12",
    valueMin: 1,
    valueMax: 80,
    valueStep: 1,
    valueUnit: "powt.",
    valueUnitA11y: "powtórzeń",
    valueSortLabel: "Podciągnięcia malejąco",
    valueValidationMessage: "Liczba podciągnięć musi być w zakresie od 1 do 80.",
    csvValueHeader: "Podciągnięcia",
    fileSlug: "podciaganie",
    seedData: pullupSeedData,
    scoreInfo: "Punkty uwzględniają liczbę podciągnięć, wagę ciała i wzrost zawodnika.",
    calculatePoints: calculatePullUpPoints
  }
};

const algorithmDescriptions = {
  bench: {
    title: "Wyciskanie na klatę",
    factors: [
      "podniesiony ciężar",
      "waga ciała zawodnika",
      "wzrost zawodnika"
    ],
    formula: "punkty = podniesione kg × (80 / waga ciała) ^ 0.67 × (wzrost / 175) ^ 0.25",
    exampleTitle: "Zawodnik:",
    example: [
      "wynik: 120 kg",
      "waga: 80 kg",
      "wzrost: 175 cm"
    ],
    examplePoints: "Punkty: 120 pkt",
    paragraphs: [
      "W wyciskaniu ranking nie jest liczony tylko po liczbie podniesionych kilogramów.",
      "Wartości 80 kg i 175 cm są wartościami referencyjnymi. Dla osoby o takiej wadze i wzroście punkty są równe podniesionym kilogramom.",
      "Osoba lżejsza dostaje lekki bonus, ponieważ podniesiony ciężar jest większy względem jej masy ciała. Osoba cięższa ma wynik lekko skorygowany w dół, ale nie za mocno. Wzrost ma mały wpływ, ponieważ wyższe osoby często mają dłuższy zakres ruchu.",
      "Ranking sortowany jest po liczbie punktów, ale na tablicy pokazujemy również realny wynik w kilogramach."
    ]
  },
  pullups: {
    title: "Podciąganie",
    factors: [
      "liczbę powtórzeń",
      "wagę ciała zawodnika",
      "wzrost zawodnika"
    ],
    formula: "punkty = liczba powtórzeń × 10 × (waga ciała / 80) ^ 0.67 × (wzrost / 175) ^ 0.15",
    exampleTitle: "Zawodnik:",
    example: [
      "podciągnięcia: 12",
      "waga: 80 kg",
      "wzrost: 175 cm"
    ],
    examplePoints: "Punkty: 120 pkt",
    paragraphs: [
      "W podciąganiu ranking nie powinien być liczony tylko po liczbie powtórzeń, bo osoba cięższa musi podciągnąć większą masę ciała.",
      "W podciąganiu osoba cięższa dostaje lekki bonus, bo każde powtórzenie wymaga podniesienia większej masy ciała. Wzrost ma tylko mały wpływ, ponieważ wyższe osoby często mają dłuższy zakres ruchu.",
      "Ranking sortowany jest po liczbie punktów, ale na tablicy pokazujemy też liczbę wykonanych powtórzeń."
    ]
  }
};

const state = {
  currentActivity: "bench",
  resultsByActivity: {
    bench: [],
    pullups: []
  },
  searchTerm: "",
  sortBy: "points-desc",
  storageMode: "indexedDB"
};

const elements = {
  activitySubtitle: document.querySelector("#activitySubtitle"),
  activityTabs: document.querySelectorAll("[data-activity]"),
  form: document.querySelector("#resultForm"),
  editingId: document.querySelector("#editingId"),
  nameInput: document.querySelector("#nameInput"),
  heightInput: document.querySelector("#heightInput"),
  bodyWeightInput: document.querySelector("#bodyWeightInput"),
  valueInput: document.querySelector("#liftedInput"),
  valueFieldLabel: document.querySelector("#valueFieldLabel"),
  formMessages: document.querySelector("#formMessages"),
  clearButton: document.querySelector("#clearButton"),
  rankingList: document.querySelector("#rankingList"),
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  valueSortOption: document.querySelector("#valueSortOption"),
  boardTitle: document.querySelector("#ranking-title"),
  boardNote: document.querySelector("#boardNote"),
  formTitle: document.querySelector("#form-title"),
  formIcon: document.querySelector(".form-card-title span"),
  exportJsonButton: document.querySelector("#exportJsonButton"),
  exportCsvButton: document.querySelector("#exportCsvButton"),
  importJsonButton: document.querySelector("#importJsonButton"),
  importJsonInput: document.querySelector("#importJsonInput"),
  clearAllDataButton: document.querySelector("#clearAllDataButton"),
  storageStatus: document.querySelector("#storageStatus"),
  scoreInfoText: document.querySelector("#scoreInfoText"),
  algorithmInfoButton: document.querySelector("#algorithmInfoButton"),
  algorithmModal: document.querySelector("#algorithmModal"),
  algorithmModalContent: document.querySelector("#algorithmModalContent"),
  algorithmModalClose: document.querySelector("#algorithmModalClose")
};

function getActivityConfig(activityKey = state.currentActivity) {
  return activities[activityKey] || activities.bench;
}

function getCurrentResults() {
  return state.resultsByActivity[state.currentActivity] || [];
}

function setCurrentResults(results) {
  state.resultsByActivity[state.currentActivity] = results;
}

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `silevis-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getResultValue(result, config) {
  return Number(result?.[config.valueKey]);
}

function createResult(data, config, existingId = generateId(), updatedAt = new Date().toISOString()) {
  const value = Number(data[config.valueKey]);
  const bodyWeightKg = Number(data.bodyWeightKg);
  const heightCm = Number(data.heightCm);
  const baseResult = {
    id: existingId,
    discipline: config.key,
    name: String(data.name || "").trim(),
    heightCm,
    bodyWeightKg,
    [config.valueKey]: value,
    updatedAt
  };

  return {
    ...baseResult,
    points: config.calculatePoints(baseResult)
  };
}

function getLoadedValue(item, config) {
  if (item?.[config.valueKey] !== undefined) {
    return item[config.valueKey];
  }

  if (config.valueKey === "liftedKg" && item?.value !== undefined) {
    return item.value;
  }

  if (config.valueKey === "reps" && item?.pullUps !== undefined) {
    return item.pullUps;
  }

  return undefined;
}

function normalizeLoadedResults(results, activityKey = state.currentActivity) {
  const config = getActivityConfig(activityKey);

  if (!Array.isArray(results)) {
    return [];
  }

  return results
    .filter((item) => {
      const value = Number(getLoadedValue(item, config));
      return item && String(item.name || "").trim() && Number.isFinite(value);
    })
    .map((item) => createResult({
      name: item.name,
      heightCm: item.heightCm,
      bodyWeightKg: item.bodyWeightKg,
      [config.valueKey]: getLoadedValue(item, config)
    }, config, item.id || generateId(), item.updatedAt || new Date().toISOString()));
}

function getInitializedKey(activityKey) {
  return `${activityKey}:${INITIALIZED_SUFFIX}`;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB jest niedostępne w tej przeglądarce."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      Object.values(activities).forEach((activity) => {
        if (!db.objectStoreNames.contains(activity.storeName)) {
          db.createObjectStore(activity.storeName, { keyPath: "id" });
        }
      });

      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Nie udało się otworzyć lokalnej bazy."));
    request.onblocked = () => reject(new Error("Dostęp do lokalnej bazy jest zablokowany."));
  });
}

async function getAllFromIndexedDbStore(storeName, activityKey) {
  const db = await openDatabase();

  if (!db.objectStoreNames.contains(storeName)) {
    db.close();
    return [];
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(normalizeLoadedResults(request.result, activityKey));
    request.onerror = () => reject(request.error || new Error("Nie udało się odczytać wyników."));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("Nie udało się odczytać lokalnej bazy."));
    };
  });
}

async function getIndexedDbInitialized(activityKey) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(META_STORE, "readonly");
    const store = transaction.objectStore(META_STORE);
    const request = store.get(getInitializedKey(activityKey));

    request.onsuccess = () => resolve(Boolean(request.result?.value));
    request.onerror = () => reject(request.error || new Error("Nie udało się odczytać ustawień bazy."));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("Nie udało się odczytać ustawień bazy."));
    };
  });
}

async function saveIndexedDbResults(activityKey, results) {
  const config = getActivityConfig(activityKey);
  const db = await openDatabase();
  const normalizedResults = normalizeLoadedResults(results, activityKey);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([config.storeName, META_STORE], "readwrite");
    const resultStore = transaction.objectStore(config.storeName);
    const metaStore = transaction.objectStore(META_STORE);

    resultStore.clear();
    normalizedResults.forEach((result) => resultStore.put(result));
    metaStore.put({
      key: getInitializedKey(activityKey),
      value: true,
      updatedAt: new Date().toISOString()
    });

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("Nie udało się zapisać lokalnej bazy."));
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error || new Error("Zapis lokalnej bazy został przerwany."));
    };
  });
}

function loadLocalStorageResults(activityKey) {
  const config = getActivityConfig(activityKey);

  try {
    const rawResults = localStorage.getItem(config.legacyStorageKey);

    if (rawResults === null) {
      return null;
    }

    return normalizeLoadedResults(JSON.parse(rawResults), activityKey);
  } catch (error) {
    return null;
  }
}

function saveLocalStorageResults(activityKey, results) {
  const config = getActivityConfig(activityKey);
  localStorage.setItem(config.legacyStorageKey, JSON.stringify(normalizeLoadedResults(results, activityKey)));
}

async function loadResults(activityKey) {
  const config = getActivityConfig(activityKey);

  try {
    const indexedResults = await getAllFromIndexedDbStore(config.storeName, activityKey);
    const isInitialized = await getIndexedDbInitialized(activityKey);

    state.storageMode = "indexedDB";

    if (indexedResults.length > 0 || isInitialized) {
      return indexedResults;
    }

    if (config.legacyStoreName) {
      const legacyIndexedResults = await getAllFromIndexedDbStore(config.legacyStoreName, activityKey);

      if (legacyIndexedResults.length > 0) {
        await saveIndexedDbResults(activityKey, legacyIndexedResults);
        return legacyIndexedResults;
      }
    }

    const legacyLocalResults = loadLocalStorageResults(activityKey);

    if (legacyLocalResults && legacyLocalResults.length > 0) {
      await saveIndexedDbResults(activityKey, legacyLocalResults);
      return legacyLocalResults;
    }

    const seededResults = config.seedData.map((item) => createResult(item, config));
    await saveIndexedDbResults(activityKey, seededResults);
    return seededResults;
  } catch (error) {
    state.storageMode = "localStorage";

    const legacyLocalResults = loadLocalStorageResults(activityKey);

    if (legacyLocalResults !== null) {
      return legacyLocalResults;
    }

    const seededResults = config.seedData.map((item) => createResult(item, config));

    try {
      saveLocalStorageResults(activityKey, seededResults);
    } catch (storageError) {
      state.storageMode = "memory";
    }

    return seededResults;
  }
}

async function saveResults(activityKey = state.currentActivity, results = state.resultsByActivity[activityKey]) {
  const normalizedResults = normalizeLoadedResults(results, activityKey);

  if (state.storageMode === "memory") {
    updateStorageInfo();
    return false;
  }

  if (state.storageMode === "localStorage") {
    try {
      saveLocalStorageResults(activityKey, normalizedResults);
      updateStorageInfo();
      return true;
    } catch (error) {
      state.storageMode = "memory";
      updateStorageInfo();
      return false;
    }
  }

  try {
    await saveIndexedDbResults(activityKey, normalizedResults);
    state.storageMode = "indexedDB";
    updateStorageInfo();
    return true;
  } catch (error) {
    state.storageMode = "localStorage";

    try {
      saveLocalStorageResults(activityKey, normalizedResults);
      updateStorageInfo();
      return true;
    } catch (storageError) {
      state.storageMode = "memory";
      updateStorageInfo();
      return false;
    }
  }
}

function normalizeText(value) {
  return value
    .toLocaleLowerCase("pl-PL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function filterResults(results) {
  const searchTerm = normalizeText(state.searchTerm.trim());

  if (!searchTerm) {
    return results;
  }

  return results.filter((result) => normalizeText(result.name).includes(searchTerm));
}

function sortResults(results, activityKey = state.currentActivity) {
  const config = getActivityConfig(activityKey);
  const sortedResults = [...results];

  if (state.sortBy === "value-desc") {
    return sortedResults.sort((a, b) => getResultValue(b, config) - getResultValue(a, config) || b.points - a.points || a.name.localeCompare(b.name, "pl"));
  }

  if (state.sortBy === "name-asc") {
    return sortedResults.sort((a, b) => a.name.localeCompare(b.name, "pl"));
  }

  return sortedResults.sort((a, b) => b.points - a.points || getResultValue(b, config) - getResultValue(a, config) || a.name.localeCompare(b.name, "pl"));
}

function formatNumber(value) {
  return new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 1
  }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("pl-PL") || "")
    .join("");
}

function getMedalClass(place) {
  if (place === 1) {
    return "gold";
  }

  if (place === 2) {
    return "silver";
  }

  if (place === 3) {
    return "bronze";
  }

  return "";
}

function updateActivityUi() {
  const config = getActivityConfig();

  document.body.dataset.activity = config.key;
  elements.activitySubtitle.textContent = config.subtitle;
  elements.boardTitle.textContent = config.boardTitle;
  elements.boardNote.textContent = "wg punktów";
  elements.formTitle.textContent = config.addTitle;
  elements.formIcon.textContent = config.formIcon;
  elements.valueFieldLabel.textContent = config.valueLabel;
  elements.valueInput.name = config.valueKey;
  elements.valueInput.min = config.valueMin;
  elements.valueInput.max = config.valueMax;
  elements.valueInput.step = config.valueStep;
  elements.valueInput.placeholder = config.valuePlaceholder;
  elements.valueSortOption.textContent = config.valueSortLabel;
  elements.scoreInfoText.textContent = config.scoreInfo;

  elements.activityTabs.forEach((tab) => {
    const isActive = tab.dataset.activity === config.key;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
}

function buildList(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderAlgorithmModalContent() {
  const description = algorithmDescriptions[state.currentActivity] || algorithmDescriptions.bench;
  const firstParagraph = description.paragraphs[0];
  const otherParagraphs = description.paragraphs.slice(1);

  elements.algorithmModalContent.innerHTML = `
    <p class="eyebrow">Punktacja</p>
    <h2 id="algorithmModalTitle">Jak liczymy punkty?</h2>
    <p>W aplikacji każda konkurencja ma swój własny sposób liczenia punktów. Dzięki temu ranking jest bardziej sprawiedliwy i nie opiera się tylko na jednej prostej wartości.</p>

    <h3>${escapeHtml(description.title)}</h3>
    <p>${escapeHtml(firstParagraph)} Punkty uwzględniają:</p>
    <ul>${buildList(description.factors)}</ul>

    <h4>Wzór:</h4>
    <pre><code>${escapeHtml(description.formula)}</code></pre>

    <h4>Przykład:</h4>
    <p>${escapeHtml(description.exampleTitle)}</p>
    <ul>${buildList(description.example)}</ul>
    <p><strong>${escapeHtml(description.examplePoints)}</strong></p>

    ${otherParagraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
  `;
}

function openAlgorithmModal() {
  renderAlgorithmModalContent();
  elements.algorithmModal.hidden = false;
  document.body.classList.add("is-modal-open");
  elements.algorithmModalClose.focus();
}

function closeAlgorithmModal() {
  elements.algorithmModal.hidden = true;
  document.body.classList.remove("is-modal-open");
  elements.algorithmInfoButton.focus();
}

function renderLoading() {
  elements.rankingList.innerHTML = `
    <div class="empty-state" data-testid="silevis-loading-state">
      <strong>Ładowanie tablicy</strong>
      <p>Sprawdzam lokalną bazę wyników.</p>
    </div>
  `;
}

function renderRanking() {
  const config = getActivityConfig();
  const visibleResults = sortResults(filterResults(getCurrentResults()), config.key);

  elements.rankingList.innerHTML = "";

  if (visibleResults.length === 0) {
    const isFiltering = state.searchTerm.trim().length > 0;

    elements.rankingList.innerHTML = `
      <div class="empty-state" data-testid="silevis-empty-state">
        <strong>${isFiltering ? "Brak wyników" : "Tablica jest pusta"}</strong>
        <p>${isFiltering ? "Nie znaleziono pracownika pasującego do wyszukiwania." : "Dodaj pierwszy wynik po prawej stronie."}</p>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  visibleResults.forEach((result, index) => {
    const place = index + 1;
    const medalClass = getMedalClass(place);
    const value = getResultValue(result, config);
    const row = document.createElement("article");
    row.className = `ranking-row ${place <= 3 ? "is-podium" : ""}`;
    row.dataset.id = result.id;
    row.dataset.testid = "silevis-ranking-row";

    row.innerHTML = `
      <div class="rank-badge ${place <= 3 ? `medal ${medalClass}` : ""}" aria-label="Miejsce ${place}">
        ${place}
      </div>
      <div class="avatar" aria-hidden="true">${getInitials(result.name)}</div>
      <div class="employee">
        <span class="employee-name">${escapeHtml(result.name)}</span>
        <span class="updated">Aktualizacja: ${formatDate(result.updatedAt)}</span>
      </div>
      <div class="lifted-value" aria-label="${formatNumber(value)} ${config.valueUnitA11y}">
        <strong>${formatNumber(value)}</strong>
        <span>${config.valueUnit}</span>
      </div>
      <div class="points">${formatNumber(result.points)} pkt</div>
      <div class="row-actions">
        <button type="button" class="edit-button" data-action="edit">Edytuj</button>
        <button type="button" class="delete-button" data-action="delete">Usuń</button>
      </div>
    `;

    fragment.append(row);
  });

  elements.rankingList.append(fragment);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function validateForm(formData) {
  const config = getActivityConfig();
  const messages = [];

  if (!formData.name.trim()) {
    messages.push("Imię i nazwisko pracownika jest wymagane.");
  }

  if (!isInRange(formData.heightCm, 120, 230)) {
    messages.push("Wzrost musi być w zakresie od 120 do 230 cm.");
  }

  if (!isInRange(formData.bodyWeightKg, 40, 200)) {
    messages.push("Waga ciała musi być w zakresie od 40 do 200 kg.");
  }

  if (!isInRange(formData[config.valueKey], config.valueMin, config.valueMax)) {
    messages.push(config.valueValidationMessage);
  }

  return messages;
}

function isInRange(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
}

function isValidResult(result, activityKey = state.currentActivity) {
  const config = getActivityConfig(activityKey);

  return Boolean(result.name.trim())
    && isInRange(result.heightCm, 120, 230)
    && isInRange(result.bodyWeightKg, 40, 200)
    && isInRange(getResultValue(result, config), config.valueMin, config.valueMax);
}

function getFormData() {
  const config = getActivityConfig();

  return {
    name: elements.nameInput.value,
    heightCm: elements.heightInput.value,
    bodyWeightKg: elements.bodyWeightInput.value,
    [config.valueKey]: elements.valueInput.value
  };
}

function renderMessages(messages, type = "error") {
  elements.formMessages.innerHTML = messages
    .map((message) => `<div class="message ${type}">${escapeHtml(message)}</div>`)
    .join("");
}

async function handleSubmit(event) {
  event.preventDefault();

  const config = getActivityConfig();
  const formData = getFormData();
  const validationMessages = validateForm(formData);

  if (validationMessages.length > 0) {
    renderMessages(validationMessages);
    return;
  }

  const editingId = elements.editingId.value;
  const normalizedName = normalizeText(formData.name.trim());
  const existingByName = getCurrentResults().find((result) => normalizeText(result.name) === normalizedName);
  const resultId = editingId || existingByName?.id || generateId();
  const nextResult = createResult(formData, config, resultId);

  setCurrentResults([
    nextResult,
    ...getCurrentResults().filter((result) => result.id !== resultId)
  ]);

  const isPersisted = await saveResults(config.key, getCurrentResults());
  renderRanking();
  clearForm();

  if (isPersisted) {
    renderMessages(["Wynik został zapisany lokalnie."], "success");
    return;
  }

  renderMessages(["Wynik jest widoczny tylko w tej sesji. Przeglądarka zablokowała zapis lokalny."]);
}

function clearForm() {
  const config = getActivityConfig();

  elements.form.reset();
  elements.editingId.value = "";
  elements.formTitle.textContent = config.addTitle;
  elements.formMessages.innerHTML = "";
}

function fillForm(result) {
  const config = getActivityConfig();

  elements.editingId.value = result.id;
  elements.nameInput.value = result.name;
  elements.heightInput.value = result.heightCm;
  elements.bodyWeightInput.value = result.bodyWeightKg;
  elements.valueInput.value = getResultValue(result, config);
  elements.formTitle.textContent = config.editTitle;
  elements.formMessages.innerHTML = "";
  elements.nameInput.focus();
}

function handleRankingClick(event) {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const row = button.closest(".ranking-row");
  const result = getCurrentResults().find((item) => item.id === row?.dataset.id);

  if (!result) {
    return;
  }

  if (button.dataset.action === "edit") {
    fillForm(result);
    return;
  }

  if (button.dataset.action === "delete") {
    deleteResult(result);
  }
}

async function deleteResult(result) {
  const confirmed = window.confirm(`Czy na pewno usunąć wynik pracownika ${result.name}?`);

  if (!confirmed) {
    return;
  }

  const config = getActivityConfig();

  setCurrentResults(getCurrentResults().filter((item) => item.id !== result.id));
  const isPersisted = await saveResults(config.key, getCurrentResults());
  renderRanking();

  if (isPersisted) {
    renderMessages(["Wynik został usunięty."], "success");
    return;
  }

  renderMessages(["Wynik usunięto tylko z bieżącej sesji. Przeglądarka zablokowała zapis lokalny."]);
}

function getExportPayload() {
  const config = getActivityConfig();

  return {
    app: "Silevis – Tablica wyników",
    activity: config.key,
    discipline: config.label,
    exportedAt: new Date().toISOString(),
    storage: state.storageMode,
    count: getCurrentResults().length,
    results: sortResults(getCurrentResults(), config.key)
  };
}

function createExportFileName(extension) {
  const config = getActivityConfig();
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `silevis-tablica-wynikow-${config.fileSlug}-${timestamp}.${extension}`;
}

function downloadFile(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportJsonData(showMessage = true) {
  const payload = getExportPayload();
  const content = JSON.stringify(payload, null, 2);

  downloadFile(createExportFileName("json"), content, "application/json;charset=utf-8");

  if (showMessage) {
    renderMessages(["Eksport JSON został pobrany."], "success");
  }
}

function csvEscape(value) {
  const text = String(value ?? "");

  if (/[;"\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function exportCsvData() {
  const config = getActivityConfig();
  const rows = sortResults(getCurrentResults(), config.key).map((result, index) => [
    index + 1,
    result.name,
    result.heightCm,
    result.bodyWeightKg,
    getResultValue(result, config),
    result.points,
    result.updatedAt
  ]);
  const header = ["Miejsce", "Pracownik", "Wzrost cm", "Waga ciała kg", config.csvValueHeader, "Punkty", "Aktualizacja"];
  const content = [header, ...rows]
    .map((row) => row.map(csvEscape).join(";"))
    .join("\r\n");

  downloadFile(createExportFileName("csv"), `\uFEFF${content}`, "text/csv;charset=utf-8");
  renderMessages(["Eksport CSV został pobrany."], "success");
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Nie udało się odczytać pliku."));
    reader.readAsText(file);
  });
}

function getImportActivityKey(payload, rawResults) {
  const hints = [
    payload?.activity,
    payload?.activityKey,
    payload?.discipline,
    ...rawResults.map((result) => result?.discipline)
  ]
    .filter(Boolean)
    .join(" ");
  const normalizedHints = normalizeText(hints);

  if (normalizedHints.includes("pullups") || normalizedHints.includes("podciag") || normalizedHints.includes("draz")) {
    return "pullups";
  }

  if (normalizedHints.includes("bench") || normalizedHints.includes("wycisk") || normalizedHints.includes("klat")) {
    return "bench";
  }

  return state.currentActivity;
}

function parseImportPayload(content) {
  const payload = JSON.parse(content);
  const rawResults = Array.isArray(payload) ? payload : payload?.results;

  if (!Array.isArray(rawResults)) {
    throw new Error("Plik JSON musi zawierać tablicę wyników lub pole results.");
  }

  const activityKey = getImportActivityKey(Array.isArray(payload) ? {} : payload, rawResults);
  const normalizedResults = normalizeLoadedResults(rawResults, activityKey);
  const validResults = normalizedResults.filter((result) => isValidResult(result, activityKey));

  if (validResults.length === 0) {
    throw new Error("Nie znaleziono poprawnych wyników do importu.");
  }

  return {
    activityKey,
    results: validResults,
    skippedCount: rawResults.length - validResults.length
  };
}

function mergeImportedResults(activityKey, importedResults) {
  const currentResults = state.resultsByActivity[activityKey] || [];
  const resultByName = new Map();
  let addedCount = 0;
  let updatedCount = 0;

  currentResults.forEach((result) => {
    resultByName.set(normalizeText(result.name), result);
  });

  importedResults.forEach((importedResult) => {
    const nameKey = normalizeText(importedResult.name);
    const existingResult = resultByName.get(nameKey);

    if (existingResult) {
      resultByName.set(nameKey, {
        ...importedResult,
        id: existingResult.id
      });
      updatedCount += 1;
      return;
    }

    resultByName.set(nameKey, importedResult);
    addedCount += 1;
  });

  state.resultsByActivity[activityKey] = Array.from(resultByName.values());

  return {
    addedCount,
    updatedCount
  };
}

async function handleImportJsonFile(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  try {
    const content = await readFileAsText(file);
    const importData = parseImportPayload(content);
    const config = getActivityConfig(importData.activityKey);
    const mergeInfo = mergeImportedResults(importData.activityKey, importData.results);

    if (importData.activityKey !== state.currentActivity) {
      state.currentActivity = importData.activityKey;
      updateActivityUi();
      clearForm();
    }

    const isPersisted = await saveResults(importData.activityKey, state.resultsByActivity[importData.activityKey]);
    renderRanking();
    clearForm();

    const summary = [
      `Import zakończony: ${config.label}.`,
      `Dodano: ${mergeInfo.addedCount}.`,
      `Zaktualizowano: ${mergeInfo.updatedCount}.`
    ];

    if (importData.skippedCount > 0) {
      summary.push(`Pominięto niepoprawne rekordy: ${importData.skippedCount}.`);
    }

    if (!isPersisted) {
      summary.push("Zapis lokalny jest zablokowany, więc dane działają tylko w bieżącej sesji.");
      renderMessages(summary);
      return;
    }

    renderMessages(summary, "success");
  } catch (error) {
    renderMessages([error.message || "Nie udało się zaimportować pliku JSON."]);
  } finally {
    elements.importJsonInput.value = "";
  }
}

async function clearAllData() {
  const config = getActivityConfig();

  if (getCurrentResults().length === 0) {
    renderMessages([`Zakładka ${config.label} nie ma danych do wyczyszczenia.`]);
    return;
  }

  const shouldDownloadBackup = window.confirm(`Czy chcesz pobrać kopię JSON zakładki ${config.label} przed wyczyszczeniem?\n\nOK = pobierz kopię\nAnuluj = przejdź dalej bez kopii`);

  if (shouldDownloadBackup) {
    exportJsonData(false);
  }

  const confirmed = window.confirm(`Czy na pewno wyczyścić wszystkie dane w zakładce ${config.label}?\n\nTej operacji nie można cofnąć.`);

  if (!confirmed) {
    renderMessages(["Czyszczenie danych zostało anulowane."]);
    return;
  }

  setCurrentResults([]);
  const isPersisted = await saveResults(config.key, []);
  renderRanking();
  clearForm();

  if (isPersisted) {
    renderMessages([`Wyczyszczono wszystkie dane w zakładce ${config.label}.`], "success");
    return;
  }

  renderMessages(["Dane wyczyszczono tylko w bieżącej sesji. Przeglądarka zablokowała zapis lokalny."]);
}

function updateStorageInfo() {
  if (state.storageMode === "indexedDB") {
    elements.storageStatus.textContent = "Dane są zapisywane osobno dla każdej zakładki w lokalnej bazie IndexedDB.";
    return;
  }

  if (state.storageMode === "localStorage") {
    elements.storageStatus.textContent = "Dane są zapisywane osobno dla każdej zakładki w localStorage jako tryb awaryjny.";
    return;
  }

  elements.storageStatus.textContent = "Zapis lokalny jest zablokowany. Dane działają tylko w bieżącej sesji.";
}

function switchActivity(activityKey) {
  if (!activities[activityKey] || activityKey === state.currentActivity) {
    return;
  }

  state.currentActivity = activityKey;
  clearForm();
  updateActivityUi();
  renderRanking();
  updateStorageInfo();
}

function bindEvents() {
  elements.form.addEventListener("submit", handleSubmit);
  elements.clearButton.addEventListener("click", clearForm);
  elements.rankingList.addEventListener("click", handleRankingClick);
  elements.exportJsonButton.addEventListener("click", exportJsonData);
  elements.exportCsvButton.addEventListener("click", exportCsvData);
  elements.importJsonButton.addEventListener("click", () => elements.importJsonInput.click());
  elements.importJsonInput.addEventListener("change", handleImportJsonFile);
  elements.clearAllDataButton.addEventListener("click", clearAllData);
  elements.algorithmInfoButton.addEventListener("click", openAlgorithmModal);
  elements.algorithmModalClose.addEventListener("click", closeAlgorithmModal);
  elements.algorithmModal.addEventListener("click", (event) => {
    if (event.target === elements.algorithmModal) {
      closeAlgorithmModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.algorithmModal.hidden) {
      closeAlgorithmModal();
    }
  });

  elements.activityTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchActivity(tab.dataset.activity));
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    renderRanking();
  });

  elements.sortSelect.addEventListener("change", (event) => {
    state.sortBy = event.target.value;
    renderRanking();
  });
}

async function init() {
  bindEvents();
  updateActivityUi();
  renderLoading();

  for (const activityKey of Object.keys(activities)) {
    state.resultsByActivity[activityKey] = await loadResults(activityKey);
  }

  renderRanking();
  updateStorageInfo();
}

init();
