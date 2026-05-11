import { Component, Input, Output, EventEmitter, OnChanges, ElementRef, ViewChild,
         AfterViewInit, ChangeDetectionStrategy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Well, PRIORITY_COLORS } from '../models/well.model';

declare const L: any;

@Component({
  selector: 'app-well-map',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="map-wrap" #wrap>
      <div #mapEl class="leaflet-host"></div>

      <div class="map-legend">
        <div class="item" *ngFor="let p of legendKeys">
          <span class="dot" [style.background]="colors[p] || '#888'"></span>{{p}}
        </div>
        <div class="item legend-sep"><span class="ring"></span>= selected</div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; height:100%; width:100%; }
    .map-wrap { position:relative; height:100%; width:100%; }
    .leaflet-host {
      position:absolute; inset:0;
      background:#1a1410;
    }
    /* Tone the OSM tiles down to fit the dark theme */
    :host ::ng-deep .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) saturate(.7) brightness(.85); }
    :host ::ng-deep .leaflet-container { background:#14110d; outline:none; font-family:'Inter',sans-serif; }
    :host ::ng-deep .leaflet-popup-content-wrapper {
      background:#14110df0; color:var(--beige-100); border:1px solid var(--orange-700);
      border-radius:2px; box-shadow:0 6px 20px #000a;
    }
    :host ::ng-deep .leaflet-popup-tip { background:#14110d; border:1px solid var(--orange-700); }
    :host ::ng-deep .leaflet-popup-content {
      font-family:'JetBrains Mono', monospace; font-size:11px; margin:8px 12px; min-width:170px;
    }
    :host ::ng-deep .popup-name { color:var(--orange-400); font-weight:700; font-size:12px; margin-bottom:4px; }
    :host ::ng-deep .popup-row  { display:flex; justify-content:space-between; gap:8px; }
    :host ::ng-deep .popup-row span:first-child { color:var(--beige-400); }
    :host ::ng-deep .leaflet-control-zoom a {
      background:#2a221a; color:var(--orange-400); border-color:var(--border-2);
    }
    :host ::ng-deep .leaflet-control-zoom a:hover { background:#3a2e22; }
    :host ::ng-deep .leaflet-control-attribution {
      background:#14110dcc; color:var(--beige-400); font-size:9px;
    }
    :host ::ng-deep .leaflet-control-attribution a { color:var(--orange-300); }

    .map-legend {
      position:absolute; bottom:8px; left:8px; z-index:500;
      background:#14110dcc; backdrop-filter:blur(6px);
      border:1px solid var(--border-1); padding:6px 9px;
      font-size:10px; letter-spacing:.1em; text-transform:uppercase;
      color:var(--beige-300); display:flex; gap:10px;
    }
    .map-legend .item { display:flex; align-items:center; gap:5px; }
    .map-legend .dot  { width:10px; height:10px; border-radius:50%; display:inline-block; }
    .map-legend .ring { width:10px; height:10px; border-radius:50%;
      border:2px solid #fff; background:transparent; }
    .legend-sep { padding-left:6px; border-left:1px solid var(--border-1); }
  `]
})
export class WellMapComponent implements OnChanges, AfterViewInit {
  @Input() wells: Well[] = [];
  @Input() selectedWell = '';
  @Input() facilityFilter = '';
  @Input() priorityMode: 'v1' | 'v2' = 'v1';
  @Output() wellClick = new EventEmitter<string>();

  @ViewChild('wrap')  wrapRef!: ElementRef<HTMLDivElement>;
  @ViewChild('mapEl') mapRef!: ElementRef<HTMLDivElement>;

  colors = PRIORITY_COLORS;
  legendKeys: string[] = ['P1','P2','P3','P4','P5'];

  private map: any = null;
  private markerLayer: any = null;
  private markerByWell: Record<string, any> = {};

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 0);
  }
  ngOnChanges(c: SimpleChanges) {
    if (!this.map) return;
    if (c['priorityMode']) {
      this.legendKeys = this.priorityMode === 'v2' ? ['P1','P2','P3'] : ['P1','P2','P3','P4','P5'];
    }
    this.renderMarkers();
  }

  private initMap() {
    if (typeof L === 'undefined' || !this.mapRef) return;
    const el = this.mapRef.nativeElement;

    this.map = L.map(el, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      worldCopyJump: false,
    }).setView([28.95, 47.45], 11);   // West Kuwait — Umm Gudair / Minagish

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);
    this.renderMarkers();
    this.fitToWells();

    setTimeout(() => this.map.invalidateSize(), 200);
    window.addEventListener('resize', () => this.map?.invalidateSize());
  }

  private getPriority(w: Well): string {
    return this.priorityMode === 'v2' ? (w.priority_v2 || 'P3') : w.priority;
  }

  private renderMarkers() {
    if (!this.markerLayer) return;
    this.markerLayer.clearLayers();
    this.markerByWell = {};

    for (const w of this.wells) {
      if (w.lat == null || w.lon == null) continue;
      const isSelected = w.well_name === this.selectedWell;
      const muted = !!this.facilityFilter && w.facility !== this.facilityFilter;
      const pri = this.getPriority(w);
      const color = (this.colors as any)[pri] || '#888';
      const r = Math.min(4 + (w.potential_oil || 0) / 1500, 9);

      const marker = L.circleMarker([w.lat, w.lon], {
        radius: isSelected ? r + 3 : r,
        color: isSelected ? '#ffffff' : color,
        weight: isSelected ? 2.5 : 1,
        fillColor: color,
        fillOpacity: muted ? 0.18 : 0.85,
      });

      const popupHtml = `
        <div class="popup-name">${w.well_name}</div>
        <div class="popup-row"><span>GC</span><span>${w.facility || ''}</span></div>
        <div class="popup-row"><span>Reservoir</span><span>${w.reservoir || ''}</span></div>
        <div class="popup-row"><span>Priority</span><span>${pri}</span></div>
        <div class="popup-row"><span>Potential</span><span>${Math.round(w.potential_oil || 0)} BOPD</span></div>
        <div class="popup-row"><span>Score</span><span>${(w.startup_score || 0).toFixed(1)}</span></div>
      `;
      marker.bindPopup(popupHtml, { closeButton: false });
      marker.on('mouseover', () => marker.openPopup());
      marker.on('mouseout',  () => marker.closePopup());
      marker.on('click', () => this.wellClick.emit(w.well_name));

      marker.addTo(this.markerLayer);
      this.markerByWell[w.well_name] = marker;
    }
  }

  private fitToWells() {
    const pts = this.wells.filter(w => w.lat != null && w.lon != null);
    if (!pts.length) return;
    const bounds = L.latLngBounds(pts.map(w => [w.lat as number, w.lon as number]));
    this.map.fitBounds(bounds, { padding: [30, 30] });
  }
}
