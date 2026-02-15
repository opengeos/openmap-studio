import maplibregl, { type IControl, type Map as MapLibreMap } from 'maplibre-gl';

/**
 * Approximate meters per pixel at a given latitude and zoom (Web Mercator).
 * https://wiki.openstreetmap.org/wiki/Zoom_levels
 */
function metersPerPixel(lat: number, zoom: number): number {
  const earthCirc = 40_075_016.686;
  return (earthCirc * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom + 8);
}

/**
 * Pick a "nice" scale bar length and label (e.g. 100, 50, 25 km).
 */
function niceScale(metersPerPx: number, barWidthPx: number): { meters: number; label: string } {
  const totalMeters = metersPerPx * barWidthPx;
  const magnitude = Math.pow(10, Math.floor(Math.log10(totalMeters)));
  const normalized = totalMeters / magnitude;
  let nice = magnitude;
  if (normalized < 1.5) nice = magnitude * 1;
  else if (normalized < 3) nice = magnitude * 2;
  else if (normalized < 7) nice = magnitude * 5;
  else nice = magnitude * 10;

  if (nice >= 1000) {
    const km = nice / 1000;
    return { meters: nice, label: km >= 1 ? `${km} km` : `${nice} m` };
  }
  return { meters: nice, label: `${Math.round(nice)} m` };
}

/**
 * Scale bar control: shows an approximate scale (e.g. "100 km") at bottom-left.
 */
export class ScaleBarControl implements IControl {
  private _map?: MapLibreMap;
  private _container?: HTMLElement;
  private _barWidthPx = 80;
  private _updateRef?: () => void;

  onAdd(map: MapLibreMap): HTMLElement {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl openmap-scale-bar';
    this._container.setAttribute('aria-label', 'Map scale');

    const bar = document.createElement('div');
    bar.className = 'openmap-scale-bar-line';
    const label = document.createElement('span');
    label.className = 'openmap-scale-bar-label';

    this._container.appendChild(bar);
    this._container.appendChild(label);

    this._updateRef = () => this._update(bar, label);
    map.on('moveend', this._updateRef);
    map.on('zoomend', this._updateRef);
    this._updateRef();

    return this._container;
  }

  private _update(bar: HTMLElement, label: HTMLElement): void {
    if (!this._map) return;
    const center = this._map.getCenter();
    const zoom = this._map.getZoom();
    const mpp = metersPerPixel(center.lat, zoom);
    const { meters, label: text } = niceScale(mpp, this._barWidthPx);
    const widthPx = meters / mpp;
    bar.style.width = `${Math.min(this._barWidthPx, Math.round(widthPx))}px`;
    label.textContent = text;
  }

  onRemove(): void {
    if (this._map && this._updateRef) {
      this._map.off('moveend', this._updateRef);
      this._map.off('zoomend', this._updateRef);
    }
    this._container?.remove();
    this._map = undefined;
    this._container = undefined;
  }
}

/**
 * Mouse position control: shows longitude, latitude and zoom under the cursor.
 */
export class MousePositionControl implements IControl {
  private _map?: MapLibreMap;
  private _container?: HTMLElement;
  private _onMouseMove?: (e: maplibregl.MapMouseEvent) => void;
  private _onMouseOut?: () => void;

  onAdd(map: MapLibreMap): HTMLElement {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl openmap-mouse-position';
    this._container.setAttribute('aria-label', 'Mouse position');
    this._container.textContent = 'lng, lat — zoom';

    this._onMouseMove = (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      const zoom = map.getZoom();
      this._container!.textContent = `${lng.toFixed(5)}, ${lat.toFixed(5)} — zoom ${zoom.toFixed(1)}`;
    };
    this._onMouseOut = () => {
      this._container!.textContent = 'lng, lat — zoom';
    };
    map.on('mousemove', this._onMouseMove);
    map.on('mouseout', this._onMouseOut);

    return this._container;
  }

  onRemove(): void {
    if (this._map && this._onMouseMove && this._onMouseOut) {
      this._map.off('mousemove', this._onMouseMove);
      this._map.off('mouseout', this._onMouseOut);
    }
    this._container?.remove();
    this._map = undefined;
    this._container = undefined;
  }
}
