import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import { createLandingPage } from './landing';
import { initMap } from './map';
import { loadConfig, saveConfig, type MapConfig } from './config';

let map: maplibregl.Map | null = null;

/**
 * Shows the landing page, removing any existing map instance.
 */
function showLandingPage(): void {
  // Remove existing map if any
  if (map) {
    map.remove();
    map = null;
  }

  // Create and show landing page with saved config
  createLandingPage((config: MapConfig) => {
    // Save config to localStorage
    saveConfig(config);
    // Initialize map with the config
    map = initMap('map', config, showLandingPage);
  }, loadConfig());
}

// Start the application by showing the landing page
showLandingPage();
