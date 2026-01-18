import maplibregl, { IControl } from 'maplibre-gl';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import {
  VectorDatasetControl,
  SearchControl,
  TerrainControl,
  InspectControl,
  BasemapControl,
} from 'maplibre-gl-components';
import type { MapConfig } from './config';
import { BASEMAP_OPTIONS } from './config';

/**
 * Custom control to navigate back to the home/landing page.
 */
class HomeControl implements IControl {
  private _container?: HTMLElement;
  private _onHome: () => void;

  /**
   * Creates a new HomeControl instance.
   *
   * @param onHome - Callback function to invoke when home button is clicked.
   */
  constructor(onHome: () => void) {
    this._onHome = onHome;
  }

  /**
   * Called when the control is added to the map.
   *
   * @returns The control's container element.
   */
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

  /**
   * Called when the control is removed from the map.
   */
  onRemove(): void {
    this._container?.remove();
    this._container = undefined;
  }
}

/**
 * Initializes a MapLibre GL map in the specified container with the given configuration.
 *
 * @param container - The ID of the HTML element to contain the map.
 * @param config - The map configuration specifying basemap and controls.
 * @param onSettings - Callback function to invoke when the home button is clicked.
 * @returns The initialized MapLibre map instance.
 */
export function initMap(
  container: string,
  config: MapConfig,
  onSettings: () => void
): maplibregl.Map {
  const map = new maplibregl.Map({
    container,
    style: config.basemapStyleUrl,
    center: config.initialCenter,
    zoom: config.initialZoom,
  });

  // Always add the home control
  map.addControl(new HomeControl(onSettings), 'top-left');

  // Add navigation control if enabled
  if (config.controls.navigation.enabled) {
    map.addControl(
      new maplibregl.NavigationControl(),
      config.controls.navigation.position
    );
  }

  // Add fullscreen control if enabled
  if (config.controls.fullscreen.enabled) {
    map.addControl(
      new maplibregl.FullscreenControl(),
      config.controls.fullscreen.position
    );
  }

  // Add globe control if enabled
  if (config.controls.globe.enabled) {
    map.addControl(
      new maplibregl.GlobeControl(),
      config.controls.globe.position
    );
  }

  // Add layer control if enabled
  if (config.controls.layerControl.enabled) {
    const layerControl = new LayerControl({
      collapsed: true,
      panelWidth: 360,
      panelMinWidth: 240,
      panelMaxWidth: 450,
      basemapStyleUrl: config.basemapStyleUrl,
    });
    map.addControl(layerControl, config.controls.layerControl.position);
  }

  // Add vector dataset control if enabled
  if (config.controls.vectorDataset.enabled) {
    const vectorControl = new VectorDatasetControl({
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
    map.addControl(vectorControl, config.controls.vectorDataset.position);
  }

  // Add search control if enabled
  if (config.controls.search.enabled) {
    const searchControl = new SearchControl({
      placeholder: 'Search for a place...',
      flyToZoom: 12,
      showMarker: true,
    });
    map.addControl(searchControl, config.controls.search.position);
  }

  // Add terrain control if enabled
  if (config.controls.terrain.enabled) {
    const terrainControl = new TerrainControl({
      exaggeration: 1.5,
      hillshade: true,
    });
    map.addControl(terrainControl, config.controls.terrain.position);
  }

  // Add inspect control if enabled
  if (config.controls.inspect.enabled) {
    const inspectControl = new InspectControl({
      highlightStyle: {
        strokeColor: '#ff6600',
        strokeWidth: 3,
      },
    });
    map.addControl(inspectControl, config.controls.inspect.position);
  }

  // Add basemap switcher control if enabled
  if (config.controls.basemapSwitcher.enabled) {
    // Convert BASEMAP_OPTIONS to the format expected by BasemapControl
    const basemaps = BASEMAP_OPTIONS.map((b) => ({
      id: b.id,
      name: b.name,
      styleUrl: b.styleUrl,
      type: 'style' as const,
    }));

    const basemapControl = new BasemapControl({
      basemaps,
      defaultBasemap: config.basemapId,
      displayMode: 'list',
      collapsed: true,
    });
    map.addControl(basemapControl, config.controls.basemapSwitcher.position);
  }

  return map;
}
