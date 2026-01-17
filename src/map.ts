import maplibregl from 'maplibre-gl'
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';

/**
 * Initializes a MapLibre GL map in the specified container.
 *
 * @param container - The ID of the HTML element to contain the map.
 * @returns The initialized MapLibre map instance.
 */
export function initMap(container: string): maplibregl.Map {

  const BASEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
  const map = new maplibregl.Map({
    container,
    style: BASEMAP_STYLE_URL,
    center: [0, 20],
    zoom: 2
  })

  map.addControl(new maplibregl.NavigationControl(), 'top-right')
  map.addControl(new maplibregl.FullscreenControl(), 'top-right')
  map.addControl(new maplibregl.GlobeControl(), 'top-right')

  const layerControl = new LayerControl({
    collapsed: true,
    panelWidth: 360,
    panelMinWidth: 240,
    panelMaxWidth: 450,
    basemapStyleUrl: BASEMAP_STYLE_URL
  });

  map.addControl(layerControl, 'top-right');


  return map
}
