import type { MapConfig, ControlType } from './config';
import {
  BASEMAP_OPTIONS,
  CONTROL_OPTIONS,
  getDefaultConfig,
} from './config';

/**
 * Creates and displays the landing page, invoking the callback when the user launches the map.
 *
 * @param onLaunch - Callback function invoked with the MapConfig when the user clicks Launch.
 * @param savedConfig - Previously saved configuration to pre-populate the form, if any.
 */
export function createLandingPage(
  onLaunch: (config: MapConfig) => void,
  savedConfig: MapConfig | null
): void {
  const landingEl = document.getElementById('landing');
  const mapEl = document.getElementById('map');

  if (!landingEl || !mapEl) {
    console.error('Landing or map container not found');
    return;
  }

  // Show landing, hide map
  landingEl.style.display = 'flex';
  mapEl.style.display = 'none';

  // Use saved config or defaults
  const config = savedConfig ?? getDefaultConfig();

  // Build the landing page HTML
  landingEl.innerHTML = buildLandingHTML(config);

  // Setup event handlers
  setupBasemapSelection(landingEl, config, () => launchMap(landingEl, mapEl, config, onLaunch));
  setupControlToggles(landingEl, config);
  setupLaunchButton(landingEl, mapEl, config, onLaunch);
  setupOpenFileButton();
}

/**
 * Builds the HTML string for the landing page.
 *
 * @param config - The current map configuration.
 * @returns The HTML string for the landing page.
 */
function buildLandingHTML(config: MapConfig): string {
  const basemapCards = BASEMAP_OPTIONS.map((basemap) => {
    const isSelected = basemap.id === config.basemapId;
    return `
      <label class="basemap-card ${isSelected ? 'selected' : ''}" data-basemap-id="${basemap.id}">
        <input
          type="radio"
          name="basemap"
          value="${basemap.id}"
          ${isSelected ? 'checked' : ''}
        />
        <div class="basemap-preview" style="background: ${getBasemapPreviewColor(basemap.id)}"></div>
        <span class="basemap-name">${basemap.name}</span>
      </label>
    `;
  }).join('');

  const controlItems = CONTROL_OPTIONS.map((control) => {
    const isEnabled = config.controls[control.type].enabled;
    return `
      <label class="control-item">
        <input
          type="checkbox"
          name="control-${control.type}"
          data-control-type="${control.type}"
          ${isEnabled ? 'checked' : ''}
        />
        <div class="control-info">
          <span class="control-label">${control.label}</span>
          <span class="control-description">${control.description}</span>
        </div>
      </label>
    `;
  }).join('');

  // Only show open file button if running in Electron
  const openFileSection = window.electronAPI ? `
      <section class="landing-section open-file-section">
        <button type="button" class="open-file-button" id="open-file-btn">
          Open Map File...
        </button>
      </section>
  ` : '';

  return `
    <div class="landing-container">
      <header class="landing-header">
        <h1>OpenMap Studio</h1>
        <p>Configure your map experience</p>
      </header>

      ${openFileSection}

      <section class="landing-section">
        <h2>Select Basemap</h2>
        <div class="basemap-grid">
          ${basemapCards}
        </div>
      </section>

      <section class="landing-section">
        <h2>Map Controls</h2>
        <div class="controls-list">
          ${controlItems}
        </div>
      </section>

      <div class="landing-actions">
        <button type="button" class="launch-button" id="launch-map">
          Launch Map
        </button>
      </div>
    </div>
  `;
}

/**
 * Gets a preview color for a basemap based on its id.
 *
 * @param basemapId - The basemap identifier.
 * @returns A CSS color string for the preview.
 */
function getBasemapPreviewColor(basemapId: string): string {
  const colors: Record<string, string> = {
    'liberty': 'linear-gradient(135deg, #f5f5dc 0%, #98d977 50%, #4a90a4 100%)',
    'bright': 'linear-gradient(135deg, #ffffff 0%, #e8e8e8 50%, #cccccc 100%)',
    'positron': 'linear-gradient(135deg, #f2f2f2 0%, #e0e0e0 50%, #c9c9c9 100%)',
    'dark-matter': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'carto-positron': 'linear-gradient(135deg, #fafafa 0%, #eeeeee 50%, #dddddd 100%)',
    'carto-voyager': 'linear-gradient(135deg, #fdf6e3 0%, #eee8d5 50%, #d3c6aa 100%)',
  };
  return colors[basemapId] || '#cccccc';
}

/**
 * Sets up event handlers for basemap selection.
 *
 * @param container - The landing page container element.
 * @param config - The map configuration to update.
 * @param onDoubleClickSelected - Callback when double-clicking on the selected basemap.
 */
function setupBasemapSelection(
  container: HTMLElement,
  config: MapConfig,
  onDoubleClickSelected: () => void
): void {
  const radios = container.querySelectorAll<HTMLInputElement>('input[name="basemap"]');
  const cards = container.querySelectorAll<HTMLElement>('.basemap-card');

  radios.forEach((radio) => {
    radio.addEventListener('change', () => {
      // Update selection state
      cards.forEach((card) => {
        card.classList.toggle('selected', card.dataset.basemapId === radio.value);
      });

      // Update config
      const selectedBasemap = BASEMAP_OPTIONS.find((b) => b.id === radio.value);
      if (selectedBasemap) {
        config.basemapId = selectedBasemap.id;
        config.basemapStyleUrl = selectedBasemap.styleUrl;
      }
    });
  });

  // Double-click on selected basemap to launch map
  cards.forEach((card) => {
    card.addEventListener('dblclick', () => {
      if (card.classList.contains('selected')) {
        onDoubleClickSelected();
      }
    });
  });
}

/**
 * Sets up event handlers for control toggle checkboxes.
 *
 * @param container - The landing page container element.
 * @param config - The map configuration to update.
 */
function setupControlToggles(container: HTMLElement, config: MapConfig): void {
  const checkboxes = container.querySelectorAll<HTMLInputElement>('input[data-control-type]');

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const controlType = checkbox.dataset.controlType as ControlType;
      if (controlType && config.controls[controlType]) {
        config.controls[controlType].enabled = checkbox.checked;
      }
    });
  });
}

/**
 * Launches the map by hiding the landing page and invoking the callback.
 *
 * @param landingEl - The landing page container element.
 * @param mapEl - The map container element.
 * @param config - The map configuration.
 * @param onLaunch - Callback to invoke with the config when launching.
 */
function launchMap(
  landingEl: HTMLElement,
  mapEl: HTMLElement,
  config: MapConfig,
  onLaunch: (config: MapConfig) => void
): void {
  // Hide landing, show map
  landingEl.style.display = 'none';
  mapEl.style.display = 'block';

  // Invoke callback with current config
  onLaunch(config);
}

/**
 * Sets up the launch button event handler.
 *
 * @param landingEl - The landing page container element.
 * @param mapEl - The map container element.
 * @param config - The map configuration.
 * @param onLaunch - Callback to invoke with the config when launching.
 */
function setupLaunchButton(
  landingEl: HTMLElement,
  mapEl: HTMLElement,
  config: MapConfig,
  onLaunch: (config: MapConfig) => void
): void {
  const launchBtn = document.getElementById('launch-map');
  if (!launchBtn) return;

  launchBtn.addEventListener('click', () => {
    launchMap(landingEl, mapEl, config, onLaunch);
  });
}

/**
 * Sets up the open file button event handler.
 */
function setupOpenFileButton(): void {
  const openBtn = document.getElementById('open-file-btn');
  if (!openBtn || !window.electronAPI) return;

  openBtn.addEventListener('click', async () => {
    const result = await window.electronAPI!.showOpenDialog();
    if (!result.canceled && result.filePath && result.content) {
      // Dispatch a custom event that main.ts will handle
      window.dispatchEvent(new CustomEvent('openmap:open-file', {
        detail: { filePath: result.filePath, content: result.content }
      }));
    }
  });
}

/**
 * Hides the landing page and shows the map container.
 */
export function hideLandingPage(): void {
  const landingEl = document.getElementById('landing');
  const mapEl = document.getElementById('map');

  if (landingEl) landingEl.style.display = 'none';
  if (mapEl) mapEl.style.display = 'block';
}

/**
 * Shows the landing page and hides the map container.
 */
export function showLandingPage(): void {
  const landingEl = document.getElementById('landing');
  const mapEl = document.getElementById('map');

  if (landingEl) landingEl.style.display = 'flex';
  if (mapEl) mapEl.style.display = 'none';
}
