import type { MapConfig } from './config';
import { BASEMAP_OPTIONS, getDefaultConfig } from './config';

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
 */
function buildLandingHTML(config: MapConfig): string {
  const basemapCards = BASEMAP_OPTIONS.map((basemap) => {
    const isSelected = basemap.id === config.basemapId;
    const previewStyle = basemap.thumbnail
      ? `background-image: url(${basemap.thumbnail}); background-size: cover; background-position: center;`
      : `background: ${getBasemapPreviewColor(basemap.id)}`;
    return `
      <label class="basemap-card ${isSelected ? 'selected' : ''}" data-basemap-id="${basemap.id}">
        <input
          type="radio"
          name="basemap"
          value="${basemap.id}"
          ${isSelected ? 'checked' : ''}
        />
        <div class="basemap-preview" style="${previewStyle}"></div>
        <span class="basemap-name">${basemap.name}</span>
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
        <h2>Select Controls</h2>
        <div class="controls-list">
          <label class="control-item">
            <input type="checkbox" name="control-layer" id="control-layer" data-control="layerControl" ${config.layerControlEnabled ? 'checked' : ''} />
            <span class="control-label">Layer Control</span>
          </label>
          <label class="control-item">
            <input type="checkbox" name="control-grid" id="control-grid" data-control="controlGrid" ${config.controlGridEnabled ? 'checked' : ''} />
            <span class="control-label">Control Grid</span>
          </label>
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
 * Fallback gradient for basemap preview when thumbnail is missing or fails to load.
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
      cards.forEach((card) => {
        card.classList.toggle('selected', card.dataset.basemapId === radio.value);
      });

      const selectedBasemap = BASEMAP_OPTIONS.find((b) => b.id === radio.value);
      if (selectedBasemap) {
        config.basemapId = selectedBasemap.id;
        config.basemapStyleUrl = selectedBasemap.styleUrl;
      }
    });
  });

  cards.forEach((card) => {
    card.addEventListener('dblclick', () => {
      if (card.classList.contains('selected')) {
        onDoubleClickSelected();
      }
    });
  });
}

/**
 * Sets up event handlers for Layer Control and Control Grid toggles.
 */
function setupControlToggles(container: HTMLElement, config: MapConfig): void {
  container.querySelectorAll<HTMLInputElement>('input[data-control]').forEach((input) => {
    input.addEventListener('change', () => {
      const key = input.dataset.control as 'layerControl' | 'controlGrid';
      if (key === 'layerControl') config.layerControlEnabled = input.checked;
      if (key === 'controlGrid') config.controlGridEnabled = input.checked;
    });
  });
}

/**
 * Launches the map by hiding the landing page and invoking the callback.
 */
function launchMap(
  landingEl: HTMLElement,
  mapEl: HTMLElement,
  config: MapConfig,
  onLaunch: (config: MapConfig) => void
): void {
  landingEl.style.display = 'none';
  mapEl.style.display = 'block';
  onLaunch(config);
}

/**
 * Sets up the launch button event handler.
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
