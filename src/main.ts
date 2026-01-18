import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import { createLandingPage } from './landing';
import { initMap } from './map';
import { loadConfig, saveConfig, getDefaultConfig, type MapConfig } from './config';
import { mapState, parseOpenMapFile, fileStateToConfig } from './map-state';
import type { VectorDatasetControl } from 'maplibre-gl-components';
import type { LayerControl } from 'maplibre-gl-layer-control';
import type { VectorDatasetState } from './types/openmap-file';

let map: maplibregl.Map | null = null;
let vectorControl: VectorDatasetControl | null = null;
let layerControl: LayerControl | null = null;

/**
 * Shows the landing page, removing any existing map instance.
 *
 * @param config - Optional config to pre-populate the form. If not provided, uses saved config or defaults.
 */
function showLandingPage(config?: MapConfig): void {
  // Remove existing map if any
  if (map) {
    map.remove();
    map = null;
    mapState.map = null;
  }

  // Clear control references
  vectorControl = null;
  layerControl = null;

  // Reset map state
  mapState.reset();

  // Update menu state (map is closed)
  window.electronAPI?.updateMenuState(false);

  // Use provided config, saved config, or defaults
  const initialConfig = config ?? loadConfig() ?? getDefaultConfig();

  // Create and show landing page with config
  createLandingPage((launchConfig: MapConfig) => {
    // Save config to localStorage
    saveConfig(launchConfig);
    // Launch the map
    launchMap(launchConfig);
  }, initialConfig);
}

/**
 * Launches the map with the given configuration.
 *
 * @param config - The map configuration.
 * @returns The initialized map instance.
 */
function launchMap(config: MapConfig): maplibregl.Map {
  // Store config in state manager
  mapState.config = config;

  console.log('[launchMap] initializing map with onLayerRename callback');
  // Initialize map with the config
  const result = initMap('map', config, showLandingPage, {
    onLayerRename: (layerId, oldName, newName) => {
      console.log('[onLayerRename] layerId:', layerId, 'oldName:', oldName, 'newName:', newName);

      // Find the dataset that contains this layer ID
      const datasetIndex = mapState.datasets.findIndex(d =>
        d.layerIds?.includes(layerId)
      );
      console.log('[onLayerRename] found datasetIndex:', datasetIndex);

      if (datasetIndex !== -1) {
        const updatedDatasets = [...mapState.datasets];
        updatedDatasets[datasetIndex] = {
          ...updatedDatasets[datasetIndex],
          name: newName,
        };
        mapState.datasets = updatedDatasets;
        mapState.isDirty = true;
        console.log('[onLayerRename] updated dataset name to:', newName);
      }
    },
  });
  map = result.map;
  vectorControl = result.vectorControl;
  layerControl = result.layerControl;
  mapState.map = map;

  // Set up dataset event listeners if vector control is enabled
  if (vectorControl) {
    vectorControl.on('load', (event) => {
      if (event.dataset && map) {
        // Check if this dataset already exists (e.g., when restoring from file)
        const existingIndex = mapState.datasets.findIndex(d => d.name === event.dataset!.filename);
        if (existingIndex !== -1) {
          // Update the layerIds for the existing dataset (IDs change when reloaded)
          const existingDataset = mapState.datasets[existingIndex];
          const updatedDatasets = [...mapState.datasets];
          updatedDatasets[existingIndex] = {
            ...existingDataset,
            layerIds: event.dataset!.layerIds,
          };
          mapState.datasets = updatedDatasets;

          // Set custom names in LayerControl for the restored layers
          if (layerControl && existingDataset.name) {
            const lc = layerControl as unknown as {
              state: { customLayerNames: Map<string, string>; layerStates: Record<string, { name?: string }> };
              updateLayerStatesFromMap: () => void;
            };
            event.dataset!.layerIds.forEach((layerId: string) => {
              lc.state.customLayerNames.set(layerId, existingDataset.name);
              // Also update layerStates for persistence
              if (lc.state.layerStates[layerId]) {
                lc.state.layerStates[layerId].name = existingDataset.name;
              }
              console.log('[dataset load] set custom name for layer:', layerId, '->', existingDataset.name);
            });
            // Force LayerControl to refresh its display
            setTimeout(() => {
              lc.updateLayerStatesFromMap();
            }, 100);
          }

          // Restore layer styles if saved
          if (existingDataset.layerStyles && existingDataset.layerStyles.length > 0 && map) {
            // Create a mapping from old layer IDs to new layer IDs by index/type
            const newLayerIds = event.dataset!.layerIds;
            const oldStyles = existingDataset.layerStyles;

            // Match by layer type (fill, line, circle, etc.)
            oldStyles.forEach(savedStyle => {
              // Find matching new layer by type
              const matchingNewLayerId = newLayerIds.find(newId => {
                const layer = map!.getLayer(newId);
                return layer && layer.type === savedStyle.type;
              });

              if (matchingNewLayerId) {
                // Apply saved paint properties
                if (savedStyle.paint) {
                  Object.entries(savedStyle.paint).forEach(([prop, value]) => {
                    try {
                      map!.setPaintProperty(matchingNewLayerId, prop, value);
                    } catch (e) {
                      console.warn(`Failed to set paint property ${prop}:`, e);
                    }
                  });
                }
                // Apply saved layout properties
                if (savedStyle.layout) {
                  Object.entries(savedStyle.layout).forEach(([prop, value]) => {
                    try {
                      map!.setLayoutProperty(matchingNewLayerId, prop, value);
                    } catch (e) {
                      console.warn(`Failed to set layout property ${prop}:`, e);
                    }
                  });
                }
                console.log('[dataset load] restored style for layer:', matchingNewLayerId);
              }
            });
          }

          console.log('[dataset load] updated layerIds for existing dataset:', event.dataset!.filename);
          return;
        }

        // Get the GeoJSON data from the map source
        const source = map.getSource(event.dataset.sourceId);
        console.log('[dataset load] id:', event.dataset.id, 'filename:', event.dataset.filename, 'sourceId:', event.dataset.sourceId, 'layerIds:', event.dataset.layerIds);
        if (source && source.type === 'geojson') {
          // Access the internal data - MapLibre stores it in _data
          const geojsonData = (source as maplibregl.GeoJSONSource).serialize().data;
          if (geojsonData && typeof geojsonData === 'object') {
            const datasetState: VectorDatasetState = {
              id: event.dataset.id,
              name: event.dataset.filename,
              geojson: geojsonData as GeoJSON.GeoJSON,
              visible: true,
              layerIds: event.dataset.layerIds,
            };
            mapState.datasets = [...mapState.datasets, datasetState];
            mapState.isDirty = true;
            console.log('[dataset load] stored dataset with name:', event.dataset.filename, 'layerIds:', event.dataset.layerIds);
          }
        }
      }
    });
  }

  // Update menu state (map is open)
  window.electronAPI?.updateMenuState(true);

  // Mark as dirty since viewport will change from initial position
  map.on('moveend', () => {
    mapState.isDirty = true;
  });

  return map;
}

/**
 * Handles the New Map menu command.
 */
function handleNewMap(): void {
  // Reset to landing with default config
  showLandingPage(getDefaultConfig());
}

/**
 * Handles the Open Map menu command.
 *
 * @param filePath - Path to the opened file.
 * @param content - Contents of the file.
 */
function handleOpenMap(filePath: string, content: string): void {
  try {
    const fileState = parseOpenMapFile(content);
    const config = fileStateToConfig(fileState);

    // Store file path
    mapState.currentFilePath = filePath;

    // Remove existing map if any
    if (map) {
      map.remove();
      map = null;
    }

    // Hide landing, show map container
    const landingEl = document.getElementById('landing');
    const mapEl = document.getElementById('map');
    if (landingEl) landingEl.style.display = 'none';
    if (mapEl) mapEl.style.display = 'block';

    // Launch the map with the restored config
    const newMap = launchMap(config);

    // Store viewport values, render state, and datasets for later application
    const { center, zoom, bearing, pitch, padding } = fileState.viewport;
    const renderState = fileState.renderState;
    const savedDatasets = fileState.datasets;

    // Apply saved state after map loads
    newMap.on('load', () => {
      // Apply saved viewport - jumpTo ensures all values are applied together
      newMap.jumpTo({
        center: center,
        zoom: zoom,
        bearing: bearing,
        pitch: pitch,
      });

      // Apply padding if saved
      if (padding) {
        newMap.setPadding(padding);
      }

      // Apply render state (projection, terrain, sky, fog)
      if (renderState) {
        // Apply projection
        if (renderState.projection && renderState.projection !== 'mercator') {
          newMap.setProjection?.({ type: renderState.projection as 'globe' | 'mercator' });
        }

        // Apply terrain
        if (renderState.terrain) {
          newMap.setTerrain?.(renderState.terrain);
        }

        // Apply sky
        if (renderState.sky) {
          newMap.setSky?.(renderState.sky as maplibregl.SkySpecification);
        }

        // Apply fog (cast via unknown as type may not be exported)
        if (renderState.fog) {
          const mapWithFog = newMap as unknown as { setFog?: (fog: unknown) => void };
          mapWithFog.setFog?.(renderState.fog);
        }
      }

      // Restore saved datasets using vectorControl
      if (vectorControl && savedDatasets.length > 0) {
        // Pre-populate mapState.datasets so they aren't duplicated by 'load' event
        mapState.datasets = savedDatasets;

        // Load each dataset onto the map
        savedDatasets.forEach((dataset) => {
          vectorControl!.loadGeoJSON(dataset.geojson, dataset.name);
        });

        // Re-apply viewport after datasets load (fitBounds overrides our jumpTo)
        setTimeout(() => {
          newMap.jumpTo({
            center: center,
            zoom: zoom,
            bearing: bearing,
            pitch: pitch,
          });
        }, 100);
      }

      // Reset dirty state after loading
      mapState.isDirty = false;
    });
  } catch (error) {
    console.error('Failed to open map file:', error);
    alert(`Failed to open map file: ${(error as Error).message}`);
  }
}

/**
 * Handles the Save Map menu command.
 */
async function handleSaveMap(): Promise<void> {
  if (!mapState.currentFilePath) {
    // No current file, trigger Save As instead
    await handleSaveMapAs();
    return;
  }

  await saveToFile(mapState.currentFilePath);
}

/**
 * Handles the Save Map As menu command.
 */
async function handleSaveMapAs(): Promise<void> {
  const electronAPI = window.electronAPI;
  if (!electronAPI) return;

  const result = await electronAPI.showSaveDialog(mapState.currentFilePath ?? undefined);
  if (result.canceled || !result.filePath) return;

  await saveToFile(result.filePath);
}

/**
 * Saves the current map state to the specified file.
 *
 * @param filePath - Path to save the file to.
 */
async function saveToFile(filePath: string): Promise<void> {
  const electronAPI = window.electronAPI;
  if (!electronAPI) return;

  const json = mapState.toJSON();
  if (!json) {
    console.error('Failed to serialize map state');
    return;
  }

  try {
    await electronAPI.writeFile(filePath, json);
    mapState.currentFilePath = filePath;
    mapState.isDirty = false;
  } catch (error) {
    console.error('Failed to save file:', error);
  }
}

/**
 * Handles the Close Map menu command.
 */
function handleCloseMap(): void {
  // Return to landing page
  showLandingPage();
}

/**
 * Sets up menu event listeners.
 */
function setupMenuListeners(): void {
  const electronAPI = window.electronAPI;
  if (!electronAPI) return;

  electronAPI.onNewMap(() => {
    handleNewMap();
  });

  electronAPI.onOpenMap((filePath, content) => {
    handleOpenMap(filePath, content);
  });

  electronAPI.onSaveMap(() => {
    handleSaveMap().catch(err => console.error('Save failed:', err));
  });

  electronAPI.onSaveMapAs(() => {
    handleSaveMapAs().catch(err => console.error('Save As failed:', err));
  });

  electronAPI.onCloseMap(() => {
    handleCloseMap();
  });
}

/**
 * Sets up listener for open file events from landing page button.
 */
function setupOpenFileListener(): void {
  window.addEventListener('openmap:open-file', ((event: CustomEvent<{ filePath: string; content: string }>) => {
    handleOpenMap(event.detail.filePath, event.detail.content);
  }) as EventListener);
}

// Initialize the application
setupMenuListeners();
setupOpenFileListener();
showLandingPage();
