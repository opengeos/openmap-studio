import type { MapConfig } from '../config';

/**
 * Represents a saved layer style with paint and layout properties.
 */
export interface SavedLayerStyle {
  /** Layer ID */
  layerId: string;
  /** Layer type (fill, line, circle, symbol, etc.) */
  type: string;
  /** Paint properties */
  paint?: Record<string, unknown>;
  /** Layout properties */
  layout?: Record<string, unknown>;
}

/**
 * Represents a saved vector dataset in the .openmap file format.
 */
export interface VectorDatasetState {
  /** Unique identifier for the dataset */
  id: string;
  /** Display name for the dataset */
  name: string;
  /** GeoJSON data */
  geojson: GeoJSON.GeoJSON;
  /** Whether the layer is currently visible */
  visible: boolean;
  /** Layer IDs created for this dataset on the map */
  layerIds?: string[];
  /** Saved layer styles (paint/layout properties for each layer) */
  layerStyles?: SavedLayerStyle[];
}

/**
 * Padding values for the map viewport.
 */
export interface PaddingState {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Represents the current viewport state of the map.
 */
export interface ViewportState {
  /** Center coordinates [longitude, latitude] */
  center: [number, number];
  /** Zoom level */
  zoom: number;
  /** Bearing in degrees */
  bearing: number;
  /** Pitch in degrees */
  pitch: number;
  /** Padding */
  padding?: PaddingState;
}

/**
 * Represents the full map rendering state beyond viewport.
 */
export interface MapRenderState {
  /** Map projection (mercator, globe, etc.) */
  projection?: string;
  /** Terrain configuration */
  terrain?: {
    source: string;
    exaggeration?: number;
  } | null;
  /** Sky configuration */
  sky?: Record<string, unknown> | null;
  /** Fog/atmosphere configuration */
  fog?: Record<string, unknown> | null;
}

/**
 * Complete file format for .openmap files.
 */
export interface OpenMapFileState {
  /** File format version */
  version: string;
  /** ISO timestamp when the file was saved */
  savedAt: string;
  /** Map configuration (basemap, controls, initial view) */
  config: MapConfig;
  /** Current viewport state */
  viewport: ViewportState;
  /** Map rendering state (terrain, sky, fog, projection) */
  renderState?: MapRenderState;
  /** Loaded vector datasets */
  datasets: VectorDatasetState[];
}

/**
 * Current file format version.
 */
export const OPENMAP_FILE_VERSION = '1.0';

/**
 * File extension for OpenMap Studio files.
 */
export const OPENMAP_FILE_EXTENSION = '.openmap';
