import {
  loadUserPreferences,
  mergeDefaultsWithPreferences,
  saveUserPreferences,
} from "./storage.js";

const CONFIG_PATHS = {
  tools: "config/tools.json",
  materials: "config/materials.json",
  machines: "config/machines.json",
  strategies: "config/strategies.json",
  defaults: "config/defaults.json",
};

export function createEmptyLibrary(loadError = null) {
  return {
    tools: [],
    materials: [],
    machines: [],
    strategies: [],
    defaults: {},
    preferences: {},
    selected: {},
    loadError,
  };
}

export async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path}: ${response.status}`);
  }
  return response.json();
}

export async function loadLibrary({ paths = CONFIG_PATHS, storage = window.localStorage } = {}) {
  try {
    const [tools, materials, machines, strategies, defaults] = await Promise.all([
      loadJson(paths.tools),
      loadJson(paths.materials),
      loadJson(paths.machines),
      loadJson(paths.strategies),
      loadJson(paths.defaults),
    ]);

    const preferences = loadUserPreferences(storage);
    const selected = mergeDefaultsWithPreferences(defaults, preferences);

    return {
      tools,
      materials,
      machines,
      strategies,
      defaults,
      preferences,
      selected,
      loadError: null,
    };
  } catch (error) {
    return createEmptyLibrary(error instanceof Error ? error.message : String(error));
  }
}

export function findById(items, id) {
  return items.find((item) => item.id === id) ?? null;
}

export function findToolById(library, id) {
  return findById(library.tools, id);
}

export function findMaterialById(library, id) {
  return findById(library.materials, id);
}

export function findMachineById(library, id) {
  return findById(library.machines, id);
}

export function findStrategyById(library, id) {
  return findById(library.strategies, id);
}

export function filterTools(library, predicate) {
  return library.tools.filter(predicate);
}

export function filterMaterials(library, predicate) {
  return library.materials.filter(predicate);
}

export function filterMachines(library, predicate) {
  return library.machines.filter(predicate);
}

export function updateSelection(library, selection, storage = window.localStorage) {
  const selected = { ...library.selected, ...selection };
  const preferences = {
    toolId: selected.toolId,
    materialId: selected.materialId,
    machineId: selected.machineId,
    strategyId: selected.strategyId,
  };

  saveUserPreferences(preferences, storage);

  return {
    ...library,
    selected,
    preferences,
  };
}

export function getSelectedContext(library) {
  return {
    tool: findToolById(library, library.selected.toolId),
    material: findMaterialById(library, library.selected.materialId),
    machine: findMachineById(library, library.selected.machineId),
    strategy: findStrategyById(library, library.selected.strategyId),
  };
}
