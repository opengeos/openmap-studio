import type { Map as MapLibreMap, LayerSpecification } from 'maplibre-gl';
import type { MapConfig } from './config';
import type {
  OpenMapFileState,
  ViewportState,
  VectorDatasetState,
  SavedLayerStyle,
  MapRenderState,
} from './types/openmap-file';
import { OPENMAP_FILE_VERSION } from './types/openmap-file';

/**
 * Manages the state of the current map file.
 */
class MapStateManager {
  private _currentFilePath: string | null = null;
  private _isDirty: boolean = false;
  private _config: MapConfig | null = null;
  private _map: MapLibreMap | null = null;
  private _datasets: VectorDatasetState[] = [];

  /**
   * Gets the current file path.
   */
  get currentFilePath(): string | null {
    return this._currentFilePath;
  }

  /**
   * Sets the current file path.
   */
  set currentFilePath(path: string | null) {
    this._currentFilePath = path;
  }

  /**
   * Gets whether there are unsaved changes.
   */
  get isDirty(): boolean {
    return this._isDirty;
  }

  /**
   * Sets the dirty state.
   */
  set isDirty(dirty: boolean) {
    this._isDirty = dirty;
  }

  /**
   * Gets the current config.
   */
  get config(): MapConfig | null {
    return this._config;
  }

  /**
   * Sets the current config.
   */
  set config(config: MapConfig | null) {
    this._config = config;
  }

  /**
   * Sets the current map instance.
   */
  set map(map: MapLibreMap | null) {
    this._map = map;
  }

  /**
   * Gets the stored datasets.
   */
  get datasets(): VectorDatasetState[] {
    return this._datasets;
  }

  /**
   * Sets the datasets.
   */
  set datasets(datasets: VectorDatasetState[]) {
    this._datasets = datasets;
  }

  /**
   * Captures the current viewport state from the map.
   *
   * @returns The current viewport state.
   */
  getViewportState(): ViewportState {
    if (!this._map) {
      return {
        center: [0, 20],
        zoom: 2,
        bearing: 0,
        pitch: 0,
      };
    }

    const center = this._map.getCenter();
    const padding = this._map.getPadding();
    return {
      center: [center.lng, center.lat],
      zoom: this._map.getZoom(),
      bearing: this._map.getBearing(),
      pitch: this._map.getPitch(),
      padding: {
        top: padding.top ?? 0,
        bottom: padding.bottom ?? 0,
        left: padding.left ?? 0,
        right: padding.right ?? 0,
      },
    };
  }

  /**
   * Captures the current map rendering state (terrain, sky, fog, projection).
   *
   * @returns The current render state.
   */
  getRenderState(): MapRenderState {
    if (!this._map) {
      return {};
    }

    const style = this._map.getStyle();
    const terrain = this._map.getTerrain?.() ?? null;
    // getProjection returns ProjectionSpecification which may have 'type' instead of 'name'
    const projectionSpec = this._map.getProjection?.();
    const projection = (projectionSpec as { type?: string; name?: string })?.type
      ?? (projectionSpec as { type?: string; name?: string })?.name
      ?? 'mercator';

    return {
      projection,
      terrain: terrain ? {
        source: terrain.source,
        exaggeration: terrain.exaggeration,
      } : null,
      sky: style?.sky ?? null,
      // fog may be stored as 'fog' or as part of the style
      fog: (style as unknown as { fog?: Record<string, unknown> })?.fog ?? null,
    };
  }

  /**
   * Captures the current layer styles for a list of layer IDs.
   *
   * @param layerIds - Array of layer IDs to capture styles for.
   * @returns Array of saved layer styles.
   */
  captureLayerStyles(layerIds: string[]): SavedLayerStyle[] {
    if (!this._map) return [];

    const styles: SavedLayerStyle[] = [];
    const mapStyle = this._map.getStyle();

    for (const layerId of layerIds) {
      const layer = mapStyle.layers.find((l: LayerSpecification) => l.id === layerId);
      if (layer) {
        styles.push({
          layerId,
          type: layer.type,
          paint: (layer as LayerSpecification & { paint?: Record<string, unknown> }).paint,
          layout: (layer as LayerSpecification & { layout?: Record<string, unknown> }).layout,
        });
      }
    }

    return styles;
  }

  /**
   * Updates datasets with current layer styles from the map.
   */
  updateDatasetStyles(): void {
    if (!this._map) return;

    this._datasets = this._datasets.map(dataset => {
      if (dataset.layerIds && dataset.layerIds.length > 0) {
        return {
          ...dataset,
          layerStyles: this.captureLayerStyles(dataset.layerIds),
        };
      }
      return dataset;
    });
  }

  /**
   * Serializes the current map state to an OpenMapFileState object.
   *
   * @returns The serialized file state.
   */
  serialize(): OpenMapFileState | null {
    if (!this._config) return null;

    // Capture current layer styles before serializing
    this.updateDatasetStyles();

    return {
      version: OPENMAP_FILE_VERSION,
      savedAt: new Date().toISOString(),
      config: this._config,
      viewport: this.getViewportState(),
      renderState: this.getRenderState(),
      datasets: this._datasets,
    };
  }

  /**
   * Serializes the current map state to a JSON string.
   *
   * @returns The JSON string representation.
   */
  toJSON(): string | null {
    const state = this.serialize();
    if (!state) return null;
    return JSON.stringify(state, null, 2);
  }

  /**
   * Resets the state manager to initial values.
   */
  reset(): void {
    this._currentFilePath = null;
    this._isDirty = false;
    this._config = null;
    this._map = null;
    this._datasets = [];
  }
}

/**
 * Global map state manager instance.
 */
export const mapState = new MapStateManager();

/**
 * Parses an OpenMapFileState from a JSON string.
 *
 * @param content - The JSON string to parse.
 * @returns The parsed file state.
 * @throws Error if the content is invalid.
 */
export function parseOpenMapFile(content: string): OpenMapFileState {
  const state = JSON.parse(content) as OpenMapFileState;

  // Validate required fields
  if (!state.version) {
    throw new Error('Invalid OpenMap file: missing version');
  }
  if (!state.config) {
    throw new Error('Invalid OpenMap file: missing config');
  }
  if (!state.viewport) {
    throw new Error('Invalid OpenMap file: missing viewport');
  }

  // Ensure datasets array exists
  if (!state.datasets) {
    state.datasets = [];
  }

  return state;
}

/**
 * Creates a MapConfig from an OpenMapFileState, applying the saved viewport.
 *
 * @param fileState - The file state to convert.
 * @returns The MapConfig with viewport applied.
 */
export function fileStateToConfig(fileState: OpenMapFileState): MapConfig {
  // Apply viewport to the config's initial values
  return {
    ...fileState.config,
    initialCenter: fileState.viewport.center,
    initialZoom: fileState.viewport.zoom,
  };
}
