/**
 * Map configuration: basemap, initial view, and optional control toggles.
 */
export interface MapConfig {
  basemapStyleUrl: string;
  basemapId: string;
  initialCenter: [number, number];
  initialZoom: number;
  /** Show Layer Control on the map (default true). */
  layerControlEnabled: boolean;
  /** Show Control Grid on the map (default true). */
  controlGridEnabled: boolean;
}

/**
 * Basemap definition with optional thumbnail for realistic preview.
 */
export interface BasemapOption {
  id: string;
  name: string;
  styleUrl: string;
  /** Optional URL for a realistic map preview (tile or static image). */
  thumbnail?: string;
}

/**
 * Available basemap options (free, no API key required).
 * Thumbnails use tile previews for a realistic basemap icon.
 */
export const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: 'liberty',
    name: 'OpenFreeMap Liberty',
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
    thumbnail: 'https://assets.gishub.org/images/openfreemap_liberty.png',
  },
  {
    id: 'bright',
    name: 'OpenFreeMap Bright',
    styleUrl: 'https://tiles.openfreemap.org/styles/bright',
    thumbnail: 'https://assets.gishub.org/images/openfreemap_bright.png',
  },
  {
    id: 'positron',
    name: 'OpenFreeMap Positron',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
    thumbnail: 'https://assets.gishub.org/images/openfreemap_positron.png',
  },
  {
    id: 'dark-matter',
    name: 'CartoDB Dark Matter',
    styleUrl: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    thumbnail: 'https://assets.gishub.org/images/cartodb_dark_matter.png',
  },
  {
    id: 'carto-positron',
    name: 'CartoDB Positron',
    styleUrl: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    thumbnail: 'https://assets.gishub.org/images/cartodb_positron.png',
  },
  {
    id: 'carto-voyager',
    name: 'CartoDB Voyager',
    styleUrl: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    thumbnail: 'https://assets.gishub.org/images/cartodb_voyager.png',
  },
];

const STORAGE_KEY = 'openmap-studio-config';

/**
 * Creates the default map configuration.
 */
export function getDefaultConfig(): MapConfig {
  return {
    basemapStyleUrl: BASEMAP_OPTIONS[0].styleUrl,
    basemapId: BASEMAP_OPTIONS[0].id,
    initialCenter: [0, 20],
    initialZoom: 2,
    layerControlEnabled: true,
    controlGridEnabled: true,
  };
}

/**
 * Saves map configuration to localStorage.
 */
export function saveConfig(config: MapConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Loads map configuration from localStorage.
 */
export function loadConfig(): MapConfig | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved) as MapConfig;
    return {
      basemapStyleUrl: parsed.basemapStyleUrl,
      basemapId: parsed.basemapId,
      initialCenter: parsed.initialCenter ?? [0, 20],
      initialZoom: parsed.initialZoom ?? 2,
      layerControlEnabled: parsed.layerControlEnabled ?? true,
      controlGridEnabled: parsed.controlGridEnabled ?? true,
    };
  } catch {
    return null;
  }
}

/**
 * Loads config from localStorage, falling back to defaults.
 */
export function loadOrDefaultConfig(): MapConfig {
  return loadConfig() ?? getDefaultConfig();
}
