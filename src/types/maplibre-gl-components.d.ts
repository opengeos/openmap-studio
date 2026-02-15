declare module 'maplibre-gl-components/style.css';

declare module 'maplibre-gl-components' {
  export type ControlName = string;

  export interface ControlGrid {
    addControl(control: unknown): void;
    getAdapters(): unknown[];
  }

  export interface VectorDataset {
    id: string;
    filename: string;
    sourceId: string;
    layerIds: string[];
  }

  export interface VectorDatasetLoadEvent {
    dataset?: VectorDataset;
  }

  export class VectorDatasetControl {
    constructor(options?: Record<string, unknown>);
    on(event: 'load', handler: (event: VectorDatasetLoadEvent) => void): void;
    loadGeoJSON(data: GeoJSON.GeoJSON, filename?: string): void;
  }

  export const ALL_DEFAULT_CONTROLS: ControlName[];

  export function addControlGrid(map: unknown, options?: Record<string, unknown>): ControlGrid;
}
