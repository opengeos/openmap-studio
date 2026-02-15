import maplibregl, { IControl } from 'maplibre-gl';
import { LayerControl, type CustomLayerAdapter } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import {
  addControlGrid,
  ALL_DEFAULT_CONTROLS,
  VectorDatasetControl,
  type ControlGrid,
} from 'maplibre-gl-components';
import type { MapConfig } from './config';

/**
 * Callback for when a layer is renamed.
 */
export type LayerRenameCallback = (layerId: string, oldName: string, newName: string) => void;

/**
 * Result object returned from initMap.
 */
export interface InitMapResult {
  map: maplibregl.Map;
  vectorControl: VectorDatasetControl | null;
  layerControl: LayerControl | null;
  controlGrid: ControlGrid | null;
}

/**
 * Custom control to navigate back to the home/landing page.
 */
class HomeControl implements IControl {
  private _container?: HTMLElement;
  private _onHome: () => void;

  constructor(onHome: () => void) {
    this._onHome = onHome;
  }

  onAdd(): HTMLElement {
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

    const button = document.createElement('button');
    button.type = 'button';
    button.title = 'Home';
    button.className = 'home-control-btn';
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>`;
    button.addEventListener('click', this._onHome);

    this._container.appendChild(button);
    return this._container;
  }

  onRemove(): void {
    this._container?.remove();
    this._container = undefined;
  }
}

/**
 * Options for initializing the map.
 */
export interface InitMapOptions {
  onLayerRename?: LayerRenameCallback;
}

/**
 * Initializes a MapLibre GL map. Layer Control and Control Grid are added when enabled in config.
 */
export function initMap(
  container: string,
  config: MapConfig,
  onSettings: () => void,
  options?: InitMapOptions
): InitMapResult {
  const map = new maplibregl.Map({
    container,
    style: config.basemapStyleUrl,
    center: config.initialCenter,
    zoom: config.initialZoom,
  });

  let vectorControl: VectorDatasetControl | null = null;
  let controlGrid: ControlGrid | null = null;

  // Always add the home control
  map.addControl(new HomeControl(onSettings), 'top-left');

  let layerControl: LayerControl | null = null;

  if (config.layerControlEnabled) {
    layerControl = new LayerControl({
      collapsed: true,
      panelWidth: 360,
      panelMinWidth: 240,
      panelMaxWidth: 450,
      basemapStyleUrl: config.basemapStyleUrl,
      onLayerRename: options?.onLayerRename,
    });
    map.addControl(layerControl, 'top-right');
  }

  if (config.controlGridEnabled) {
    // All 26 default controls minus vectorDataset; we add our own with custom options
    const gridControlNames = ALL_DEFAULT_CONTROLS.filter((n: string) => n !== 'vectorDataset');
    controlGrid = addControlGrid(map as any, {
      title: 'Map Tools',
      position: 'top-right',
      defaultControls: [...gridControlNames],
      basemapStyleUrl: config.basemapStyleUrl,
      collapsible: true,
      collapsed: true,
      showRowColumnControls: true,
    });

    const ourVectorControl = new VectorDatasetControl({
      fitBounds: true,
      fitBoundsPadding: 50,
      defaultStyle: {
        fillColor: '#3388ff',
        fillOpacity: 0.3,
        strokeColor: '#3388ff',
        strokeWidth: 2,
        circleRadius: 6,
        circleColor: '#3388ff',
      },
    });
    controlGrid.addControl(ourVectorControl);
    vectorControl = ourVectorControl;

    if (layerControl) {
      const adapters = controlGrid.getAdapters() as CustomLayerAdapter[];
      adapters.forEach((adapter: CustomLayerAdapter) => {
        layerControl!.registerCustomAdapter(adapter);
      });
    }
  }

  return { map, vectorControl, layerControl, controlGrid };
}
