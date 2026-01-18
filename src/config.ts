import type { ControlPosition } from 'maplibre-gl';

/**
 * Types of map controls that can be enabled/disabled.
 */
export type ControlType =
  | 'navigation'
  | 'fullscreen'
  | 'globe'
  | 'layerControl'
  | 'vectorDataset'
  | 'search'
  | 'terrain'
  | 'inspect'
  | 'basemapSwitcher';

/**
 * Configuration for an individual control.
 */
export interface ControlConfig {
  enabled: boolean;
  position: ControlPosition;
}

/**
 * Complete map configuration.
 */
export interface MapConfig {
  basemapStyleUrl: string;
  basemapId: string;
  controls: Record<ControlType, ControlConfig>;
  initialCenter: [number, number];
  initialZoom: number;
}

/**
 * Basemap definition.
 */
export interface BasemapOption {
  id: string;
  name: string;
  styleUrl: string;
  thumbnail?: string;
}

/**
 * Available basemap options (free, no API key required).
 */
export const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: 'liberty',
    name: 'OpenFreeMap Liberty',
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
  },
  {
    id: 'bright',
    name: 'OpenFreeMap Bright',
    styleUrl: 'https://tiles.openfreemap.org/styles/bright',
  },
  {
    id: 'positron',
    name: 'OpenFreeMap Positron',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
  },
  {
    id: 'dark-matter',
    name: 'Dark Matter',
    styleUrl: 'https://tiles.openfreemap.org/styles/dark',
  },
  {
    id: 'carto-positron',
    name: 'CartoDB Positron',
    styleUrl: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  },
  {
    id: 'carto-voyager',
    name: 'CartoDB Voyager',
    styleUrl: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  },
];

/**
 * Control metadata for display in the landing page.
 */
export interface ControlMeta {
  type: ControlType;
  label: string;
  description: string;
  defaultEnabled: boolean;
  defaultPosition: ControlPosition;
}

/**
 * Available controls with their metadata.
 */
export const CONTROL_OPTIONS: ControlMeta[] = [
  {
    type: 'navigation',
    label: 'Navigation',
    description: 'Zoom and rotation controls',
    defaultEnabled: true,
    defaultPosition: 'top-right',
  },
  {
    type: 'fullscreen',
    label: 'Fullscreen',
    description: 'Toggle fullscreen mode',
    defaultEnabled: true,
    defaultPosition: 'top-right',
  },
  {
    type: 'globe',
    label: 'Globe',
    description: '3D globe projection toggle',
    defaultEnabled: true,
    defaultPosition: 'top-right',
  },
  {
    type: 'layerControl',
    label: 'Layer Control',
    description: 'Manage map layers visibility',
    defaultEnabled: true,
    defaultPosition: 'top-right',
  },
  {
    type: 'vectorDataset',
    label: 'Vector Dataset',
    description: 'Upload GeoJSON files via drag-drop',
    defaultEnabled: true,
    defaultPosition: 'top-left',
  },
  {
    type: 'search',
    label: 'Search',
    description: 'Search for places using Nominatim',
    defaultEnabled: false,
    defaultPosition: 'top-left',
  },
  {
    type: 'terrain',
    label: '3D Terrain',
    description: 'Enable 3D terrain visualization',
    defaultEnabled: false,
    defaultPosition: 'top-right',
  },
  {
    type: 'inspect',
    label: 'Feature Inspector',
    description: 'Click features to view properties',
    defaultEnabled: false,
    defaultPosition: 'top-right',
  },
  {
    type: 'basemapSwitcher',
    label: 'Basemap Switcher',
    description: 'Switch basemaps from within the map',
    defaultEnabled: false,
    defaultPosition: 'bottom-left',
  },
];

const STORAGE_KEY = 'openmap-studio-config';

/**
 * Creates the default map configuration.
 *
 * @returns Default MapConfig object.
 */
export function getDefaultConfig(): MapConfig {
  const controls = {} as Record<ControlType, ControlConfig>;

  for (const control of CONTROL_OPTIONS) {
    controls[control.type] = {
      enabled: control.defaultEnabled,
      position: control.defaultPosition,
    };
  }

  return {
    basemapStyleUrl: BASEMAP_OPTIONS[0].styleUrl,
    basemapId: BASEMAP_OPTIONS[0].id,
    controls,
    initialCenter: [0, 20],
    initialZoom: 2,
  };
}

/**
 * Saves map configuration to localStorage.
 *
 * @param config - The MapConfig to save.
 */
export function saveConfig(config: MapConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Loads map configuration from localStorage.
 *
 * @returns The saved MapConfig, or null if none exists.
 */
export function loadConfig(): MapConfig | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as MapConfig;
  } catch {
    return null;
  }
}

/**
 * Loads config from localStorage, falling back to defaults.
 *
 * @returns The loaded or default MapConfig.
 */
export function loadOrDefaultConfig(): MapConfig {
  return loadConfig() ?? getDefaultConfig();
}
