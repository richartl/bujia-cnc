const STORAGE_KEY = "bujiaCnc.libraryPreferences";

export function loadUserPreferences(storage = window.localStorage) {
  const rawPreferences = storage.getItem(STORAGE_KEY);
  if (!rawPreferences) return {};
  return JSON.parse(rawPreferences);
}

export function saveUserPreferences(preferences, storage = window.localStorage) {
  const safePreferences = preferences && typeof preferences === "object" ? preferences : {};
  storage.setItem(STORAGE_KEY, JSON.stringify(safePreferences));
  return safePreferences;
}

export function clearUserPreferences(storage = window.localStorage) {
  storage.removeItem(STORAGE_KEY);
}

export function mergeDefaultsWithPreferences(defaults = {}, preferences = {}) {
  return { ...defaults, ...preferences };
}
