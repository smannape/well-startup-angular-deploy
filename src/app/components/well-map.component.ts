import { Component, Input, Output, EventEmitter, OnChanges, ElementRef, ViewChild, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Well, PRIORITY_COLORS } from '../models/well.model';

@Component({
  selector: 'app-well-map',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="map-wrap" #wrap>
      <svg [attr.viewBox]="'0 0 '+W+' '+H" preserveAspectRatio="none" class="map-svg" *ngIf="wells.length">
        <defs>
          <radialGradient id="mapbg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="#221b13"/>
            <stop offset="100%" stop-color="#14110d"/>
          </radialGradient>
        </defs>
        <rect [attr.width]="W" [attr.height]="H" fill="url(#mapbg)"/>
        <!-- grid lines -->
        <g class="map-grid">
          <line *ngFor="let gl of gridLinesX"
            [attr.x1]="gl[0]" [attr.y1]="gl[1]" [attr.x2]="gl[2]" [attr.y2]="gl[3]"/>
          <line *ngFor="let gl of gridLinesY"
            [attr.x1]="gl[0]" [attr.y1]="gl[1]" [attr.x2]="gl[2]" [attr.y2]="gl[3]"/>
        </g>
        <!-- dots -->
        <circle *ngFor="let w of projected" class="map-dot"
          [class.selected]="w.well_name === selectedWell"
          [attr.cx]="w.px" [attr.cy]="w.py"
          [attr.r]="w.well_name === selectedWell ? 6 : w.r"
          [attr.fill]="colors[w.priority]"
          [attr.opacity]="facilityFilter && w.facility !== facilityFilter ? 0.12 : 0.85"
          (click)="wellClick.emit(w.well_name)"
          (mouseenter)="showTip(w, $event)"
          (mouseleave)="tip=null"
        />
        <!-- GC labels -->
        <text *ngFor="let gc of gcLabels" [attr.x]="gc.x" [attr.y]="gc.y"
          fill="#8a7a5d" font-size="11" font-family="JetBrains Mono" text-anchor="middle"
          letter-spacing="0.08em">{{gc.name}}</text>
      </svg>
      <!-- tooltip -->
      <div class="tooltip" *ngIf="tip" [style.left.px]="tip.lx" [style.top.px]="tip.ty">
        <div class="name">{{tip.well_name}}</div>
        <div class="row"><span>GC</span><span>{{tip.facility}}</span></div>
        <div class="row"><span>Reservoir</span><span>{{tip.reservoir}}</span></div>
        <div class="row"><span>Priority</span><span>{{tip.priority}}</span></div>
        <div class="row"><span>Potential</span><span>{{tip.potential_oil | number:'1.0-0'}} BOPD</span></div>
        <div class="row"><span>Score</span><span>{{tip.startup_score | number:'1.1-1'}}</span></div>
      </div>
      <!-- legend -->
      <div class="map-legend">
        <div class="item" *ngFor="let p of ['P1','P2','P3','P4','P5']">
          <span class="dot" [style.background]="colors[p]"></span>{{p}}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-wrap { position:relative; height:100%; width:100%; }
    .map-svg  { display:block; width:100%; height:100%; }
    .map-grid line { stroke:#322820; stroke-width:0.4; }
    .map-dot { transition:r .15s; cursor:pointer; }
    .map-dot:hover { stroke:var(--orange-500); stroke-width:1.5; }
    .map-dot.selected { stroke:#fff; stroke-width:2.5; }
    .map-legend {
      position:absolute; bottom:10px; left:10px;
      background:#14110dcc; backdrop-filter:blur(6px);
      border:1px solid var(--border-1); padding:8px 10px;
      font-size:10px; letter-spacing:.1em; text-transform:uppercase;
      color:var(--beige-300); display:flex; gap:14px;
    }
    .map-legend .item { display:flex; align-items:center; gap:6px; }
    .map-legend .dot  { width:10px; height:10px; border-radius:50%; }
    .tooltip {
      position:absolute; background:#14110df0; border:1px solid var(--orange-700);
      padding:8px 10px; font-size:11px; pointer-events:none; z-index:50;
      min-width:180px; font-family:"JetBrains Mono",monospace; color:var(--beige-100);
    }
    .tooltip .name { color:var(--orange-400); font-weight:700; font-size:12px; margin-bottom:4px; }
    .tooltip .row { display:flex; justify-content:space-between; gap:8px; }
    .tooltip .row span:first-child { color:var(--beige-400); }
  `]
})
export class WellMapComponent implements OnChanges, AfterViewInit {
  @Input() wells: Well[] = [];
  @Input() selectedWell = '';
  @Input() facilityFilter = '';
  @Output() wellClick = new EventEmitter<string>();
  @ViewChild('wrap') wrapRef!: ElementRef<HTMLDivElement>;

  colors = PRIORITY_COLORS;
  W = 700; H = 420;
  projected: any[] = [];
  gridLinesX: number[][] = [];
  gridLinesY: number[][] = [];
  gcLabels: any[] = [];
  tip: any = null;

  private proj!: (x: number, y: number) => [number, number];

  ngAfterViewInit() { this.recalc(); }
  ngOnChanges() { this.recalc(); }

  private recalc() {
    const el = this.wrapRef?.nativeElement;
    if (el) { this.W = el.clientWidth || 700; this.H = el.clientHeight || 420; }
    const pts = this.wells.filter(w => w.x != null && w.y != null);
    if (!pts.length) return;
    let mnX=Infinity,mxX=-Infinity,mnY=Infinity,mxY=-Infinity;
    for (const p of pts){ if(p.x<mnX)mnX=p.x; if(p.x>mxX)mxX=p.x; if(p.y<mnY)mnY=p.y; if(p.y>mxY)mxY=p.y; }
    const pad=40, xR=mxX-mnX||1, yR=mxY-mnY||1;
    const sc=Math.min((this.W-pad*2)/xR,(this.H-pad*2)/yR);
    const ox=(this.W-xR*sc)/2-mnX*sc, oy=(this.H-yR*sc)/2+mxY*sc;
    this.proj=(x,y)=>[x*sc+ox,-y*sc+oy];

    const step=5000;
    this.gridLinesX=[];
    for(let gx=Math.floor(mnX/step)*step;gx<=mxX;gx+=step){
      const a=this.proj(gx,mnY), b=this.proj(gx,mxY);
      this.gridLinesX.push([a[0],a[1],b[0],b[1]]);
    }
    this.gridLinesY=[];
    for(let gy=Math.floor(mnY/step)*step;gy<=mxY;gy+=step){
      const a=this.proj(mnX,gy), b=this.proj(mxX,gy);
      this.gridLinesY.push([a[0],a[1],b[0],b[1]]);
    }

    this.projected = pts.map(w => {
      const [px,py]=this.proj(w.x,w.y);
      return { ...w, px, py, r: Math.min(2+(w.potential_oil||0)/800,5.5) };
    });

    // GC label centroids
    const gcMap: Record<string,{sx:number,sy:number,n:number}> = {};
    for (const w of pts) {
      if (!gcMap[w.facility]) gcMap[w.facility]={sx:0,sy:0,n:0};
      const [px,py]=this.proj(w.x,w.y);
      gcMap[w.facility].sx+=px; gcMap[w.facility].sy+=py; gcMap[w.facility].n++;
    }
    this.gcLabels = Object.entries(gcMap).map(([name,v])=>({
      name, x: v.sx/v.n, y: v.sy/v.n - 14
    }));
  }

  showTip(w: any, e: MouseEvent) {
    const rect = this.wrapRef.nativeElement.getBoundingClientRect();
    this.tip = { ...w, lx: e.clientX-rect.left+14, ty: e.clientY-rect.top-70 };
  }
}
