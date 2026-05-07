const LEGACY_STORAGE_KEY = "silevisBenchPressResults";
const DB_NAME = "silevisBenchPressDb";
const DB_VERSION = 1;
const RESULT_STORE = "results";
const META_STORE = "meta";
const INITIALIZED_KEY = "initialized";

const seedData = [
  { name: "Michał Nowak", heightCm: 180, bodyWeightKg: 85, liftedKg: 145 },
  { name: "Kamil Wójcik", heightCm: 175, bodyWeightKg: 80, liftedKg: 137.5 },
  { name: "Paweł Zieliński", heightCm: 185, bodyWeightKg: 105, liftedKg: 155 },
  { name: "Tomasz Krawczyk", heightCm: 178, bodyWeightKg: 90, liftedKg: 125 },
  { name: "Mateusz Lewandowski", heightCm: 172, bodyWeightKg: 75, liftedKg: 120 },
  { name: "Jakub Szymański", heightCm: 170, bodyWeightKg: 70, liftedKg: 115 },
  { name: "Łukasz Piotrowski", heightCm: 182, bodyWeightKg: 92, liftedKg: 130 },
  { name: "Marcin Dąbrowski", heightCm: 176, bodyWeightKg: 82, liftedKg: 110 }
];

const state = {
  results: [],
  searchTerm: "",
  sortBy: "points-desc",
  storageMode: "indexedDB"
};

const elements = {
  form: document.querySelector("#resultForm"),
  editingId: document.querySelector("#editingId"),
  nameInput: document.querySelector("#nameInput"),
  heightInput: document.querySelector("#heightInput"),
  bodyWeightInput: document.querySelector("#bodyWeightInput"),
  liftedInput: document.querySelector("#liftedInput"),
  formMessages: document.querySelector("#formMessages"),
  clearButton: document.querySelector("#clearButton"),
  rankingList: document.querySelector("#rankingList"),
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  formTitle: document.querySelector("#form-title"),
  exportJsonButton: document.querySelector("#exportJsonButton"),
  exportCsvButton: document.querySelector("#exportCsvButton"),
  storageStatus: document.querySelector("#storageStatus")
};

function calculateBenchPressPoints({ liftedKg, bodyWeightKg, heightCm }) {
  if (liftedKg <= 0 || bodyWeightKg <= 0 || heightCm <= 0) {
    return 0;
  }

  const bodyWeightFactor = Math.pow(80 / bodyWeightKg, 0.67);
  const heightFactor = Math.pow(heightCm / 175, 0.25);

  const points = liftedKg * bodyWeightFactor * heightFactor;

  return Math.round(points * 10) / 10;
}

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `silevis-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createResult(data, existingId = generateId(), updatedAt = new Date().toISOString()) {
  const liftedKg = Number(data.liftedKg);
  const bodyWeightKg = Number(data.bodyWeightKg);
  const heightCm = Number(data.heightCm);

  return {
    id: existingId,
    name: String(data.name || "").trim(),
    heightCm,
    bodyWeightKg,
    liftedKg,
    points: calculateBenchPressPoints({ liftedKg, bodyWeightKg, heightCm }),
    updatedAt
  };
}

function normalizeLoadedResults(results) {
  if (!Array.isArray(results)) {
    return [];
  }

  return results
    .filter((item) => item && String(item.name || "").trim())
    .map((item) => createResult(item, item.id || generateId(), item.updatedAt || new Date().toISOString()));
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

      if (!db.objectStoreNames.contains(RESULT_STORE)) {
        db.createObjectStore(RESULT_STORE, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Nie udało się otworzyć lokalnej bazy."));
    request.onblocked = () => reject(new Error("Dostęp do lokalnej bazy jest zablokowany."));
  });
}

async function getAllIndexedDbResults() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(RESULT_STORE, "readonly");
    const store = transaction.objectStore(RESULT_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(normalizeLoadedResults(request.result));
    request.onerror = () => reject(request.error || new Error("Nie udało się odczytać wyników."));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("Nie udało się odczytać lokalnej bazy."));
    };
  });
}

async function getIndexedDbInitialized() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(META_STORE, "readonly");
    const store = transaction.objectStore(META_STORE);
    const request = store.get(INITIALIZED_KEY);

    request.onsuccess = () => resolve(Boolean(request.result?.value));
    request.onerror = () => reject(request.error || new Error("Nie udało się odczytać ustawień bazy."));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("Nie udało się odczytać ustawień bazy."));
    };
  });
}

async function saveIndexedDbResults(results) {
  const db = await openDatabase();
  const normalizedResults = normalizeLoadedResults(results);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([RESULT_STORE, META_STORE], "readwrite");
    const resultStore = transaction.objectStore(RESULT_STORE);
    const metaStore = transaction.objectStore(META_STORE);

    resultStore.clear();
    normalizedResults.forEach((result) => resultStore.put(result));
    metaStore.put({
      key: INITIALIZED_KEY,
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

function loadLocalStorageResults() {
  try {
    const rawResults = localStorage.getItem(LEGACY_STORAGE_KEY);

    if (rawResults === null) {
      return null;
    }

    return normalizeLoadedResults(JSON.parse(rawResults));
  } catch (error) {
    return null;
  }
}

function saveLocalStorageResults(results) {
  localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(normalizeLoadedResults(results)));
}

async function loadResults() {
  try {
    const [indexedResults, isInitialized] = await Promise.all([
      getAllIndexedDbResults(),
      getIndexedDbInitialized()
    ]);

    state.storageMode = "indexedDB";

    if (indexedResults.length > 0 || isInitialized) {
      return indexedResults;
    }

    const legacyResults = loadLocalStorageResults();

    if (legacyResults && legacyResults.length > 0) {
      await saveIndexedDbResults(legacyResults);
      return legacyResults;
    }

    const seededResults = seedData.map((item) => createResult(item));
    await saveIndexedDbResults(seededResults);
    return seededResults;
  } catch (error) {
    state.storageMode = "localStorage";

    const legacyResults = loadLocalStorageResults();

    if (legacyResults !== null) {
      return legacyResults;
    }

    const seededResults = seedData.map((item) => createResult(item));

    try {
      saveLocalStorageResults(seededResults);
    } catch (storageError) {
      state.storageMode = "memory";
    }

    return seededResults;
  }
}

async function saveResults(results = state.results) {
  const normalizedResults = normalizeLoadedResults(results);

  if (state.storageMode === "memory") {
    updateStorageInfo();
    return false;
  }

  if (state.storageMode === "localStorage") {
    try {
      saveLocalStorageResults(normalizedResults);
      updateStorageInfo();
      return true;
    } catch (error) {
      state.storageMode = "memory";
      updateStorageInfo();
      return false;
    }
  }

  try {
    await saveIndexedDbResults(normalizedResults);
    state.storageMode = "indexedDB";
    updateStorageInfo();
    return true;
  } catch (error) {
    state.storageMode = "localStorage";

    try {
      saveLocalStorageResults(normalizedResults);
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

function sortResults(results) {
  const sortedResults = [...results];

  if (state.sortBy === "lifted-desc") {
    return sortedResults.sort((a, b) => b.liftedKg - a.liftedKg || b.points - a.points || a.name.localeCompare(b.name, "pl"));
  }

  if (state.sortBy === "name-asc") {
    return sortedResults.sort((a, b) => a.name.localeCompare(b.name, "pl"));
  }

  return sortedResults.sort((a, b) => b.points - a.points || b.liftedKg - a.liftedKg || a.name.localeCompare(b.name, "pl"));
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

function renderLoading() {
  elements.rankingList.innerHTML = `
    <div class="empty-state" data-testid="silevis-loading-state">
      <strong>Ładowanie tablicy</strong>
      <p>Sprawdzam lokalną bazę wyników.</p>
    </div>
  `;
}

function renderRanking() {
  const visibleResults = sortResults(filterResults(state.results));

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
      <div class="lifted-value" aria-label="${formatNumber(result.liftedKg)} kilogramów">
        <strong>${formatNumber(result.liftedKg)}</strong>
        <span>kg</span>
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

  if (!isInRange(formData.liftedKg, 20, 300)) {
    messages.push("Wynik na klatę musi być w zakresie od 20 do 300 kg.");
  }

  return messages;
}

function isInRange(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
}

function getFormData() {
  return {
    name: elements.nameInput.value,
    heightCm: elements.heightInput.value,
    bodyWeightKg: elements.bodyWeightInput.value,
    liftedKg: elements.liftedInput.value
  };
}

function renderMessages(messages, type = "error") {
  elements.formMessages.innerHTML = messages
    .map((message) => `<div class="message ${type}">${escapeHtml(message)}</div>`)
    .join("");
}

async function handleSubmit(event) {
  event.preventDefault();

  const formData = getFormData();
  const validationMessages = validateForm(formData);

  if (validationMessages.length > 0) {
    renderMessages(validationMessages);
    return;
  }

  const editingId = elements.editingId.value;
  const normalizedName = normalizeText(formData.name.trim());
  const existingByName = state.results.find((result) => normalizeText(result.name) === normalizedName);
  const resultId = editingId || existingByName?.id || generateId();
  const nextResult = createResult(formData, resultId);

  state.results = [
    nextResult,
    ...state.results.filter((result) => result.id !== resultId)
  ];

  const isPersisted = await saveResults();
  renderRanking();
  clearForm();

  if (isPersisted) {
    renderMessages(["Wynik został zapisany lokalnie."], "success");
    return;
  }

  renderMessages(["Wynik jest widoczny tylko w tej sesji. Przeglądarka zablokowała zapis lokalny."]);
}

function clearForm() {
  elements.form.reset();
  elements.editingId.value = "";
  elements.formTitle.textContent = "Dodaj wynik";
  elements.formMessages.innerHTML = "";
}

function fillForm(result) {
  elements.editingId.value = result.id;
  elements.nameInput.value = result.name;
  elements.heightInput.value = result.heightCm;
  elements.bodyWeightInput.value = result.bodyWeightKg;
  elements.liftedInput.value = result.liftedKg;
  elements.formTitle.textContent = "Edytuj wynik";
  elements.formMessages.innerHTML = "";
  elements.nameInput.focus();
}

function handleRankingClick(event) {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const row = button.closest(".ranking-row");
  const result = state.results.find((item) => item.id === row?.dataset.id);

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

  state.results = state.results.filter((item) => item.id !== result.id);
  const isPersisted = await saveResults();
  renderRanking();

  if (isPersisted) {
    renderMessages(["Wynik został usunięty."], "success");
    return;
  }

  renderMessages(["Wynik usunięto tylko z bieżącej sesji. Przeglądarka zablokowała zapis lokalny."]);
}

function getExportPayload() {
  return {
    app: "Silevis – Tablica wyników",
    exportedAt: new Date().toISOString(),
    storage: state.storageMode,
    count: state.results.length,
    results: sortResults(state.results)
  };
}

function createExportFileName(extension) {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `silevis-tablica-wynikow-${timestamp}.${extension}`;
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

function exportJsonData() {
  const payload = getExportPayload();
  const content = JSON.stringify(payload, null, 2);

  downloadFile(createExportFileName("json"), content, "application/json;charset=utf-8");
  renderMessages(["Eksport JSON został pobrany."], "success");
}

function csvEscape(value) {
  const text = String(value ?? "");

  if (/[;"\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function exportCsvData() {
  const rows = sortResults(state.results).map((result, index) => [
    index + 1,
    result.name,
    result.heightCm,
    result.bodyWeightKg,
    result.liftedKg,
    result.points,
    result.updatedAt
  ]);
  const header = ["Miejsce", "Pracownik", "Wzrost cm", "Waga ciała kg", "Wynik kg", "Punkty", "Aktualizacja"];
  const content = [header, ...rows]
    .map((row) => row.map(csvEscape).join(";"))
    .join("\r\n");

  downloadFile(createExportFileName("csv"), `\uFEFF${content}`, "text/csv;charset=utf-8");
  renderMessages(["Eksport CSV został pobrany."], "success");
}

function updateStorageInfo() {
  if (state.storageMode === "indexedDB") {
    elements.storageStatus.textContent = "Dane są zapisywane w lokalnej bazie przeglądarki IndexedDB.";
    return;
  }

  if (state.storageMode === "localStorage") {
    elements.storageStatus.textContent = "Dane są zapisywane w localStorage jako tryb awaryjny.";
    return;
  }

  elements.storageStatus.textContent = "Zapis lokalny jest zablokowany. Dane działają tylko w bieżącej sesji.";
}

function bindEvents() {
  elements.form.addEventListener("submit", handleSubmit);
  elements.clearButton.addEventListener("click", clearForm);
  elements.rankingList.addEventListener("click", handleRankingClick);
  elements.exportJsonButton.addEventListener("click", exportJsonData);
  elements.exportCsvButton.addEventListener("click", exportCsvData);

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
  renderLoading();
  state.results = await loadResults();
  renderRanking();
  updateStorageInfo();
}

init();
