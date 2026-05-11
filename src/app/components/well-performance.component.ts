import { Component, Input, OnChanges, ChangeDetectionStrategy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Well, WellTest } from '../models/well.model';

interface SeriesDef {
  key: keyof WellTest;
  label: string;
  unit: string;
  color: string;
  axis: 'left' | 'right';
  enabled: boolean;
}

interface ChartPoint { d: Date; y: number; }
interface ChartSeries { def: SeriesDef; pts: ChartPoint[]; path: string; dots: { cx:number; cy:number; v:number; date:string }[]; }

@Component({
  selector: 'app-well-performance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wp-root">

      <!-- ── Header + filters ── -->
      <div class="wp-header">
        <div class="wp-title-area">
          <div class="wp-title">Well Performance</div>
          <div class="wp-sub">Historical well-test rates · all values from KOC well-test snapshots</div>
        </div>
        <div class="wp-filters">
          <div class="filter-grp">
            <label>Gathering Center</label>
            <select [(ngModel)]="gcFilter" (ngModelChange)="onGcChange()">
              <option value="">All GCs</option>
              <option *ngFor="let f of facilities" [value]="f">{{f}}</option>
            </select>
          </div>
          <div class="filter-grp">
            <label>Well Name</label>
            <select [(ngModel)]="wellFilter" (ngModelChange)="onWellChange()">
              <option *ngFor="let w of filteredWellNames" [value]="w">{{w}}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ── KPI summary strip ── -->
      <div class="wp-stats" *ngIf="selectedWell as sw">
        <div class="stat">
          <span class="stat-k">Well</span>
          <span class="stat-v accent">{{sw.well_name}}</span>
        </div>
        <div class="stat">
          <span class="stat-k">Field · GC</span>
          <span class="stat-v">{{sw.field}} · {{sw.facility}}</span>
        </div>
        <div class="stat">
          <span class="stat-k">Reservoir</span>
          <span class="stat-v">{{sw.reservoir}}</span>
        </div>
        <div class="stat">
          <span class="stat-k">Test Count</span>
          <span class="stat-v">{{tests.length}}</span>
        </div>
        <div class="stat">
          <span class="stat-k">Date Range</span>
          <span class="stat-v">{{dateRangeLabel}}</span>
        </div>
        <div class="stat">
          <span class="stat-k">Peak Oil</span>
          <span class="stat-v green">{{peakOil | number:'1.0-0'}} BOPD</span>
        </div>
        <div class="stat">
          <span class="stat-k">Latest Oil</span>
          <span class="stat-v">{{latestOil | number:'1.0-0'}} BOPD</span>
        </div>
      </div>

      <!-- ── Series toggle ── -->
      <div class="series-toggle">
        <label *ngFor="let s of series; let i = index" class="series-chip"
          [class.on]="s.enabled" [style.--c]="s.color">
          <input type="checkbox" [checked]="s.enabled" (change)="toggleSeries(i)"/>
          <span class="dot"></span>
          <span class="lbl">{{s.label}} <small>({{s.unit}})</small></span>
        </label>
      </div>

      <!-- ── Chart ── -->
      <div class="chart-wrap">
        <svg *ngIf="chartReady" [attr.viewBox]="'0 0 ' + W + ' ' + H" class="chart-svg">

          <!-- background -->
          <rect [attr.width]="W" [attr.height]="H" fill="#14110d"/>

          <!-- grid Y (left axis) -->
          <g class="grid">
            <line *ngFor="let g of yGridLeft" [attr.x1]="ml" [attr.x2]="W-mr"
              [attr.y1]="g.py" [attr.y2]="g.py" stroke="#2a2218" stroke-dasharray="2 3"/>
            <text *ngFor="let g of yGridLeft" [attr.x]="ml-6" [attr.y]="g.py+3"
              text-anchor="end" fill="#8a7a5d" font-size="10" font-family="JetBrains Mono">{{g.label}}</text>
          </g>
          <!-- Y right axis labels -->
          <g class="grid" *ngIf="hasRightAxis">
            <text *ngFor="let g of yGridRight" [attr.x]="W-mr+6" [attr.y]="g.py+3"
              text-anchor="start" fill="#b88a3a" font-size="10" font-family="JetBrains Mono">{{g.label}}</text>
          </g>

          <!-- X axis ticks -->
          <g class="grid">
            <line *ngFor="let t of xTicks" [attr.x1]="t.px" [attr.x2]="t.px"
              [attr.y1]="mt" [attr.y2]="H-mb" stroke="#2a2218" stroke-dasharray="2 3"/>
            <text *ngFor="let t of xTicks" [attr.x]="t.px" [attr.y]="H-mb+16"
              text-anchor="middle" fill="#8a7a5d" font-size="10"
              font-family="JetBrains Mono">{{t.label}}</text>
          </g>

          <!-- axis labels -->
          <text [attr.x]="ml-30" [attr.y]="mt-8" fill="#b88a3a"
            font-size="9" letter-spacing="2" text-transform="uppercase">{{leftAxisLabel}}</text>
          <text *ngIf="hasRightAxis" [attr.x]="W-mr-30" [attr.y]="mt-8" fill="#b88a3a"
            font-size="9" letter-spacing="2">{{rightAxisLabel}}</text>

          <!-- series paths -->
          <g *ngFor="let s of chartSeries">
            <path [attr.d]="s.path" [attr.stroke]="s.def.color"
              stroke-width="1.8" fill="none" stroke-linejoin="round"
              stroke-linecap="round"/>
            <circle *ngFor="let p of s.dots" [attr.cx]="p.cx" [attr.cy]="p.cy"
              r="2.2" [attr.fill]="s.def.color" opacity="0.85"
              (mouseenter)="tip = {x:p.cx, y:p.cy, label:s.def.label, color:s.def.color,
                value: (p.v | number:'1.0-2'), unit:s.def.unit, date:p.date}"
              (mouseleave)="tip = null"/>
          </g>

          <!-- tooltip -->
          <g *ngIf="tip">
            <rect [attr.x]="tip.x + 10" [attr.y]="tip.y - 28" width="150" height="36"
              fill="#1a1612e8" [attr.stroke]="tip.color" stroke-width="1" rx="2"/>
            <text [attr.x]="tip.x + 18" [attr.y]="tip.y - 12"
              fill="#ece1c7" font-size="10" font-family="JetBrains Mono">{{tip.label}}</text>
            <text [attr.x]="tip.x + 18" [attr.y]="tip.y + 2"
              [attr.fill]="tip.color" font-size="11" font-weight="700"
              font-family="JetBrains Mono">{{tip.value}} {{tip.unit}}</text>
            <text [attr.x]="tip.x + 18" [attr.y]="tip.y + 14"
              fill="#8a7a5d" font-size="9" font-family="JetBrains Mono">{{tip.date}}</text>
          </g>

          <!-- frame -->
          <line [attr.x1]="ml" [attr.x2]="ml" [attr.y1]="mt" [attr.y2]="H-mb" stroke="#3a2f23"/>
          <line [attr.x1]="ml" [attr.x2]="W-mr" [attr.y1]="H-mb" [attr.y2]="H-mb" stroke="#3a2f23"/>
          <line *ngIf="hasRightAxis" [attr.x1]="W-mr" [attr.x2]="W-mr" [attr.y1]="mt" [attr.y2]="H-mb" stroke="#3a2f23"/>
        </svg>

        <div *ngIf="!chartReady" class="no-data">
          No well-test history available for this selection.
        </div>
      </div>

    </div>
  `,
  styles: [`
    .wp-root { display:flex; flex-direction:column; height:100%; background:var(--bg-0);
      overflow:hidden; }

    /* Header */
    .wp-header { flex-shrink:0; display:flex; align-items:flex-start; gap:20px; flex-wrap:wrap;
      padding:12px 18px 10px; border-bottom:1px solid var(--border-1); background:var(--bg-1); }
    .wp-title-area { flex:1; min-width:240px; }
    .wp-title { font-size:14px; font-weight:700; letter-spacing:.18em;
      text-transform:uppercase; color:var(--orange-400); }
    .wp-sub { font-size:10px; color:var(--beige-400); margin-top:2px; letter-spacing:.05em; }
    .wp-filters { display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end; }
    .filter-grp { display:flex; flex-direction:column; gap:3px; }
    .filter-grp label { font-size:9.5px; letter-spacing:.16em; text-transform:uppercase;
      color:var(--beige-400); }
    .filter-grp select { min-width:160px; }

    /* KPI strip */
    .wp-stats { flex-shrink:0; display:flex; gap:0;
      background:var(--bg-2); border-bottom:1px solid var(--border-1); overflow-x:auto; }
    .stat { padding:7px 18px; border-right:1px solid var(--border-1);
      display:flex; flex-direction:column; gap:2px; min-width:130px; }
    .stat-k { font-size:9px; letter-spacing:.18em; text-transform:uppercase;
      color:var(--beige-400); }
    .stat-v { font-family:"JetBrains Mono",monospace; font-size:13px; font-weight:600;
      color:var(--beige-100); }
    .stat-v.accent { color:var(--orange-400); font-size:14px; }
    .stat-v.green  { color:#6dd47e; }

    /* Series toggle */
    .series-toggle { flex-shrink:0; display:flex; gap:8px; flex-wrap:wrap;
      padding:8px 18px; border-bottom:1px solid var(--border-1); background:var(--bg-1); }
    .series-chip { display:inline-flex; align-items:center; gap:6px; cursor:pointer;
      padding:4px 9px; border:1px solid var(--border-1); border-radius:2px;
      background:var(--bg-2); transition:.15s;
      font-size:10px; letter-spacing:.08em; text-transform:uppercase;
      color:var(--beige-400); }
    .series-chip input { display:none; }
    .series-chip .dot { width:10px; height:10px; border-radius:50%; background:var(--c); opacity:.4; }
    .series-chip:hover { border-color:var(--c); color:var(--beige-100); }
    .series-chip.on { border-color:var(--c); color:var(--beige-100);
      background:color-mix(in srgb, var(--c) 12%, var(--bg-2)); }
    .series-chip.on .dot { opacity:1; box-shadow:0 0 6px var(--c); }
    .series-chip small { color:var(--beige-500); letter-spacing:.02em; text-transform:none; }

    /* Chart */
    .chart-wrap { flex:1; min-height:0; padding:6px 14px 12px; position:relative; }
    .chart-svg  { width:100%; height:100%; display:block; }
    .no-data { display:flex; align-items:center; justify-content:center; height:100%;
      color:var(--beige-500); font-size:12px; letter-spacing:.14em; text-transform:uppercase; }
  `]
})
export class WellPerformanceComponent implements OnChanges {
  @Input() wells: Well[] = [];
  @Input() testMap: Record<string, WellTest[]> = {};

  /* Filters */
  gcFilter   = '';
  wellFilter = '';

  series: SeriesDef[] = [
    { key: 'oil_daily_rate',    label: 'Oil',    unit: 'BOPD',    color: '#6dd47e', axis: 'left',  enabled: true  },
    { key: 'liquid_daily_rate', label: 'Liquid', unit: 'BLPD',    color: '#ffb83d', axis: 'left',  enabled: true  },
    { key: 'gas_daily_rate',    label: 'Gas',    unit: 'MSCF/D',  color: '#ff7a1a', axis: 'left',  enabled: false },
    { key: 'water_cut_percent', label: 'WC',     unit: '%',       color: '#5aa8d9', axis: 'right', enabled: true  },
    { key: 'gas_oil_ratio',     label: 'GOR',    unit: 'scf/stb', color: '#b66dd4', axis: 'right', enabled: false },
    { key: 'frequency',         label: 'Freq',   unit: 'Hz',      color: '#d4b06d', axis: 'right', enabled: false },
  ];

  /* Computed view-model */
  facilities: string[] = [];
  wellNames: string[]  = [];
  filteredWellNames: string[] = [];
  selectedWell: Well | null = null;
  tests: WellTest[] = [];
  peakOil = 0;
  latestOil = 0;
  dateRangeLabel = '—';

  /* Chart geometry */
  W = 1000; H = 420; ml = 60; mr = 60; mt = 20; mb = 36;
  chartReady = false;
  hasRightAxis = true;
  leftAxisLabel  = 'BPD / MSCF/D';
  rightAxisLabel = '% · GOR · Hz';
  xTicks: { px: number; label: string }[] = [];
  yGridLeft: { py: number; label: string }[] = [];
  yGridRight: { py: number; label: string }[] = [];
  chartSeries: ChartSeries[] = [];
  tip: any = null;

  ngOnChanges(_c: SimpleChanges) {
    this.facilities = [...new Set(this.wells.map(w => w.facility).filter(Boolean))].sort();
    this.wellNames  = [...this.wells].map(w => w.well_name).sort();
    this.refreshWellList();
    if (!this.wellFilter && this.filteredWellNames.length) {
      // Default to the top-priority well with a sizeable test history
      const wellsWithHist = this.filteredWellNames.filter(n => (this.testMap[n] || []).length > 4);
      this.wellFilter = wellsWithHist[0] || this.filteredWellNames[0];
    }
    this.recompute();
  }

  onGcChange() {
    this.refreshWellList();
    if (this.filteredWellNames.length && !this.filteredWellNames.includes(this.wellFilter)) {
      this.wellFilter = this.filteredWellNames[0];
    }
    this.recompute();
  }
  onWellChange() { this.recompute(); }
  toggleSeries(i: number) { this.series[i].enabled = !this.series[i].enabled; this.buildChart(); }

  private refreshWellList() {
    const pool = this.gcFilter
      ? this.wells.filter(w => w.facility === this.gcFilter)
      : this.wells;
    // prefer wells with test data first
    this.filteredWellNames = pool
      .map(w => w.well_name)
      .sort((a, b) => {
        const da = (this.testMap[a] || []).length;
        const db = (this.testMap[b] || []).length;
        return db - da || a.localeCompare(b);
      });
  }

  private recompute() {
    this.selectedWell = this.wells.find(w => w.well_name === this.wellFilter) || null;
    this.tests = (this.testMap[this.wellFilter] || [])
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));

    if (this.tests.length) {
      const oils = this.tests.map(t => t.oil_daily_rate ?? 0);
      this.peakOil   = Math.max(...oils);
      this.latestOil = oils[oils.length - 1];
      this.dateRangeLabel = `${this.tests[0].date} → ${this.tests[this.tests.length-1].date}`;
    } else {
      this.peakOil = 0; this.latestOil = 0; this.dateRangeLabel = '—';
    }

    this.buildChart();
  }

  private buildChart() {
    if (!this.tests.length) { this.chartReady = false; return; }

    const enabled = this.series.filter(s => s.enabled);
    if (!enabled.length) { this.chartReady = false; return; }

    // Compute axis ranges
    const leftSeries  = enabled.filter(s => s.axis === 'left');
    const rightSeries = enabled.filter(s => s.axis === 'right');
    this.hasRightAxis = rightSeries.length > 0;

    const leftValues: number[] = [];
    const rightValues: number[] = [];
    for (const t of this.tests) {
      for (const s of leftSeries) {
        const v = this.scaledValue(t, s);
        if (v != null && isFinite(v)) leftValues.push(v);
      }
      for (const s of rightSeries) {
        const v = this.scaledValue(t, s);
        if (v != null && isFinite(v)) rightValues.push(v);
      }
    }
    const leftMax  = Math.max(1, ...leftValues);
    const rightMax = Math.max(1, ...rightValues);

    // X scale (time)
    const t0 = new Date(this.tests[0].date).getTime();
    const t1 = new Date(this.tests[this.tests.length - 1].date).getTime();
    const tRange = Math.max(1, t1 - t0);

    const xOf = (d: Date) => this.ml + (d.getTime() - t0) / tRange * (this.W - this.ml - this.mr);
    const yLeft  = (v: number) => this.H - this.mb - (v / leftMax) * (this.H - this.mt - this.mb);
    const yRight = (v: number) => this.H - this.mb - (v / rightMax) * (this.H - this.mt - this.mb);

    // Build series paths
    this.chartSeries = enabled.map(def => {
      const pts: ChartPoint[] = [];
      const dots: { cx:number; cy:number; v:number; date:string }[] = [];
      for (const t of this.tests) {
        const raw = t[def.key] as number | null;
        if (raw == null || !isFinite(raw)) continue;
        const v = this.scaledValue(t, def)!;
        const d = new Date(t.date);
        const cx = xOf(d);
        const cy = def.axis === 'left' ? yLeft(v) : yRight(v);
        pts.push({ d, y: cy });
        dots.push({ cx, cy, v: raw, date: t.date });
      }
      const path = pts.length
        ? 'M' + pts.map((p, i) => `${xOf(p.d)},${p.y}`).join(' L')
        : '';
      return { def, pts, path, dots };
    });

    // Axis ticks
    this.yGridLeft  = this.buildYGrid(leftMax,  yLeft,  v => this.fmtRate(v));
    this.yGridRight = this.buildYGrid(rightMax, yRight, v => this.fmtPct(v));
    this.xTicks     = this.buildXTicks(t0, t1, xOf);

    // Axis labels
    const leftLabels  = leftSeries.map(s => s.unit).filter((v,i,a)=>a.indexOf(v)===i).join(' · ');
    const rightLabels = rightSeries.map(s => s.unit).filter((v,i,a)=>a.indexOf(v)===i).join(' · ');
    this.leftAxisLabel  = leftLabels || '';
    this.rightAxisLabel = rightLabels || '';

    this.chartReady = true;
  }

  /** Scale gas rate to MSCF/D to keep it in the same ballpark as BOPD/BLPD. */
  private scaledValue(t: WellTest, s: SeriesDef): number | null {
    const v = t[s.key] as number | null;
    if (v == null) return null;
    if (s.key === 'gas_daily_rate') return v / 1000;   // SCF/D -> MSCF/D
    return v;
  }

  private buildYGrid(max: number, scaleY: (v:number)=>number, fmt: (v:number)=>string) {
    const steps = 5;
    const out: { py: number; label: string }[] = [];
    for (let i = 0; i <= steps; i++) {
      const v = max * i / steps;
      out.push({ py: scaleY(v), label: fmt(v) });
    }
    return out;
  }
  private buildXTicks(t0: number, t1: number, xOf: (d: Date)=>number) {
    const ticks: { px:number; label:string }[] = [];
    const years0 = new Date(t0).getFullYear();
    const years1 = new Date(t1).getFullYear();
    const range = years1 - years0;
    const step = range > 16 ? 4 : range > 8 ? 2 : 1;
    for (let y = years0; y <= years1; y += step) {
      const d = new Date(`${y}-01-01`);
      if (d.getTime() < t0 || d.getTime() > t1) continue;
      ticks.push({ px: xOf(d), label: String(y) });
    }
    if (!ticks.length) {
      ticks.push({ px: xOf(new Date(t0)), label: new Date(t0).toISOString().slice(0,10) });
      ticks.push({ px: xOf(new Date(t1)), label: new Date(t1).toISOString().slice(0,10) });
    }
    return ticks;
  }
  private fmtRate(v: number): string {
    if (v >= 10000) return (v/1000).toFixed(0)+'k';
    if (v >= 1000)  return (v/1000).toFixed(1)+'k';
    return v.toFixed(0);
  }
  private fmtPct(v: number): string {
    if (v >= 1000)  return (v/1000).toFixed(1)+'k';
    return v.toFixed(0);
  }
}
