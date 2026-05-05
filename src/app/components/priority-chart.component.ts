import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Kpis, PRIORITY_COLORS, PRIORITY_DESC } from '../models/well.model';

@Component({
  selector: 'app-priority-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-wrap" *ngIf="kpis">
      <svg viewBox="0 0 640 200" preserveAspectRatio="none" style="width:100%;height:160px">
        <!-- grid lines -->
        <line *ngFor="let y of gridYs" [attr.x1]="ml" [attr.x2]="640-mr"
          [attr.y1]="y.py" [attr.y2]="y.py" stroke="#3a2f23" stroke-dasharray="2 4"/>
        <text *ngFor="let y of gridYs" [attr.x]="ml-6" [attr.y]="y.py+3"
          text-anchor="end" fill="#8a7a5d" font-size="10" font-family="JetBrains Mono">{{y.label}}</text>
        <!-- bars -->
        <g *ngFor="let d of bars">
          <rect [attr.x]="d.x" [attr.y]="d.y" [attr.width]="bw" [attr.height]="d.h"
            [attr.fill]="colors[d.p]" rx="2"/>
          <text [attr.x]="d.x+bw/2" [attr.y]="d.y-6" text-anchor="middle"
            fill="#ece1c7" font-size="10" font-family="JetBrains Mono">{{d.wells}} wells</text>
          <text *ngIf="d.h>26" [attr.x]="d.x+bw/2" [attr.y]="d.y+17" text-anchor="middle"
            fill="#1a1612" font-size="11" font-weight="700" font-family="JetBrains Mono">{{d.potLabel}}</text>
          <text [attr.x]="d.x+bw/2" [attr.y]="200-mb+16" text-anchor="middle"
            fill="#d8c8a3" font-size="11" letter-spacing="0.1em">{{d.p}}</text>
        </g>
      </svg>
      <!-- P1-P5 descriptions -->
      <div class="p-descs">
        <div class="p-desc" *ngFor="let p of priorities">
          <span class="pill" [style.background]="colors[p]">{{p}}</span>
          <span class="txt">{{descs[p]}}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-wrap { height:100%; overflow-y:auto; padding:8px 12px; }
    .p-descs { display:flex; flex-direction:column; gap:6px; margin-top:8px; }
    .p-desc { display:flex; gap:10px; align-items:flex-start; }
    .pill { flex-shrink:0; display:inline-block; padding:2px 7px; border-radius:2px;
      font-size:10px; font-weight:700; letter-spacing:.14em; color:#1a1612; }
    .txt { font-size:11px; color:var(--beige-300); line-height:1.6; }
  `]
})
export class PriorityChartComponent implements OnChanges {
  @Input() kpis!: Kpis | null;
  colors = PRIORITY_COLORS;
  descs  = PRIORITY_DESC;
  priorities = ['P1','P2','P3','P4','P5'];
  ml=40; mr=20; mt=28; mb=36; bw=70;
  bars: any[] = [];
  gridYs: any[] = [];
  W=640; H=200;

  ngOnChanges() { this.build(); }

  build() {
    if (!this.kpis) return;
    const data = this.priorities.map(p => ({
      p, wells: this.kpis!.by_priority[p]||0,
      potential: Math.round(this.kpis!.potential_by_priority[p]||0)
    }));
    const max = Math.max(...data.map(d=>d.potential))||1;
    const n = data.length;
    const total = this.W - this.ml - this.mr;
    const bw = total/n * 0.6;
    const gap = total/n * 0.4;
    this.bw = bw;
    const chartH = this.H - this.mt - this.mb;
    this.bars = data.map((d,i) => {
      const x = this.ml + i*(bw+gap) + gap/2;
      const h = chartH * d.potential / max;
      const y = this.H - this.mb - h;
      return { ...d, x, y, h, potLabel: (d.potential/1000).toFixed(0)+'k' };
    });
    this.gridYs = [0,1,2,3,4].map(i => ({
      py: this.mt + chartH*i/4,
      label: ((max*(1-i/4))/1000).toFixed(0)+'k'
    }));
  }
}
