import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Well, PRIORITY_COLORS } from '../models/well.model';

@Component({
  selector: 'app-well-sequencing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seq-root">
      <div class="seq-header">
        <div class="seq-title-area">
          <div class="seq-title">Well Sequencing</div>
          <div class="seq-sub">Ordered by Production-Profile priority then recent peak oil rate — best producers start first</div>
        </div>
        <div class="seq-filters">
          <div class="filter-grp">
            <label>Gathering Center</label>
            <select [(ngModel)]="gcFilter" (ngModelChange)="applyFilters()">
              <option value="">All GCs</option>
              <option *ngFor="let f of facilities" [value]="f">{{f}}</option>
            </select>
          </div>
          <div class="filter-grp">
            <label>Priority</label>
            <select [(ngModel)]="priorityFilter" (ngModelChange)="applyFilters()">
              <option value="">All Priorities</option>
              <option *ngFor="let p of priorities" [value]="p">{{p}}</option>
            </select>
          </div>
          <div class="filter-grp">
            <label>Reservoir</label>
            <select [(ngModel)]="reservoirFilter" (ngModelChange)="applyFilters()">
              <option value="">All Reservoirs</option>
              <option *ngFor="let r of reservoirs" [value]="r">{{r}}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="seq-stats" *ngIf="filtered.length">
        <div class="stat">
          <span class="stat-v">{{filtered.length}}</span>
          <span class="stat-k">Wells in Queue</span>
        </div>
        <div class="stat">
          <span class="stat-v green">{{totalPeakOil | number:'1.0-0'}}</span>
          <span class="stat-k">Total Peak BOPD</span>
        </div>
        <div class="stat">
          <span class="stat-v">{{totalExpected | number:'1.0-0'}}</span>
          <span class="stat-k">Total Expected BOPD</span>
        </div>
        <div class="stat">
          <span class="stat-v">{{avgWC | number:'1.0-0'}}%</span>
          <span class="stat-k">Avg Water Cut</span>
        </div>
      </div>

      <div class="seq-grid">
        <div class="seq-card" *ngFor="let w of filtered; let i=index"
          [class.p1]="w.priority==='P1'" [class.p2]="w.priority==='P2'"
          [class.p3]="w.priority==='P3'">

          <div class="card-rank">#{{i+1}}</div>

          <div class="card-head">
            <span class="card-name">{{w.well_name}}</span>
            <span class="card-priority" [style.background]="colors[w.priority]">{{w.priority}}</span>
          </div>

          <div class="card-bopd">
            <span class="bopd-val">{{(w.recent_highest_oil ?? w.expected_oil) | number:'1.0-0'}}</span>
            <span class="bopd-unit">BOPD<small>peak</small></span>
          </div>

          <div class="card-trend" *ngIf="w.oil_trend_pct != null"
            [class.up]="(w.oil_trend_pct ?? 0) > 0"
            [class.down]="(w.oil_trend_pct ?? 0) < 0">
            <span class="t-arrow">{{(w.oil_trend_pct ?? 0) > 0 ? '▲' : (w.oil_trend_pct ?? 0) < 0 ? '▼' : '▬'}}</span>
            <span class="t-val">{{w.oil_trend_pct > 0 ? '+' : ''}}{{w.oil_trend_pct | number:'1.1-1'}}%</span>
            <span class="t-lbl">trend</span>
          </div>

          <div class="card-meta">
            <div class="meta-row">
              <span class="meta-k">GC</span>
              <span class="meta-v">{{w.facility}}</span>
            </div>
            <div class="meta-row">
              <span class="meta-k">Reservoir</span>
              <span class="meta-v">{{w.reservoir}}</span>
            </div>
            <div class="meta-row">
              <span class="meta-k">Latest Oil</span>
              <span class="meta-v">{{w.latest_oil | number:'1.0-0'}} BOPD</span>
            </div>
            <div class="meta-row">
              <span class="meta-k">WC %</span>
              <span class="meta-v">{{w.latest_wc | number:'1.0-0'}}%</span>
            </div>
            <div class="meta-row">
              <span class="meta-k">GOR</span>
              <span class="meta-v">{{w.latest_gor | number:'1.0-0'}}</span>
            </div>
          </div>

          <div class="card-footer">
            <span class="esp-badge red" *ngIf="(w.esp_run_life || 0) > 700">
              <span class="blink red"></span>ESP {{w.esp_run_life}} d
            </span>
            <span class="esp-badge green" *ngIf="(w.esp_run_life || 0) > 0 && (w.esp_run_life || 0) < 500">
              <span class="blink green"></span>ESP {{w.esp_run_life}} d
            </span>
            <span class="profile-badge">{{w.priority_label}}</span>
          </div>
        </div>

        <div class="no-results" *ngIf="!filtered.length">
          No wells match the selected filters.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seq-root { display:flex; flex-direction:column; height:100%; overflow:hidden; }

    .seq-header { padding:14px 16px 10px;
      border-bottom:1px solid var(--border-1); background:var(--bg-1);
      display:flex; align-items:flex-start; gap:24px; flex-wrap:wrap; }
    .seq-title-area { flex:1; }
    .seq-title { font-size:13px; font-weight:700; letter-spacing:.16em;
      text-transform:uppercase; color:var(--orange-400); }
    .seq-sub { font-size:11px; color:var(--beige-400); margin-top:3px; }

    .seq-filters { display:flex; gap:12px; flex-wrap:wrap; }
    .filter-grp { display:flex; flex-direction:column; gap:3px; }
    .filter-grp label { font-size:9px; letter-spacing:.18em; text-transform:uppercase;
      color:var(--beige-400); }
    .filter-grp select { font-size:11px; padding:5px 8px; min-width:130px; }

    .seq-stats { display:flex; gap:0; background:var(--bg-2);
      border-bottom:1px solid var(--border-1); }
    .stat { flex:1; padding:10px 16px; border-right:1px solid var(--border-1);
      display:flex; flex-direction:column; gap:2px; }
    .stat:last-child { border-right:none; }
    .stat-v { font-family:"JetBrains Mono",monospace; font-size:18px; font-weight:700;
      color:var(--orange-400); }
    .stat-v.green { color:#6dd47e; }
    .stat-k { font-size:9px; letter-spacing:.16em; text-transform:uppercase;
      color:var(--beige-400); }

    .seq-grid { flex:1; overflow-y:auto; padding:14px;
      display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
      gap:10px; align-content:start; }

    .seq-card { background:var(--bg-2); border:1px solid var(--border-1);
      border-radius:4px; padding:12px 12px 10px; position:relative; display:flex;
      flex-direction:column; gap:8px; transition:border-color .15s, background .15s; }
    .seq-card:hover { border-color:var(--border-2); background:var(--bg-3); }
    .seq-card.p1 { border-left:3px solid #6dd47e; }
    .seq-card.p2 { border-left:3px solid #ffb83d; }
    .seq-card.p3 { border-left:3px solid #cf6b3a; }

    .card-rank { position:absolute; top:8px; right:10px;
      font-family:"JetBrains Mono",monospace; font-size:10px;
      color:var(--beige-500); font-weight:700; }

    .card-head { display:flex; align-items:center; justify-content:space-between; }
    .card-name { font-size:14px; font-weight:700; color:var(--orange-300);
      font-family:"JetBrains Mono",monospace; letter-spacing:.06em; }
    .card-priority { font-size:9px; font-weight:700; color:#1a1612;
      padding:2px 6px; border-radius:2px; letter-spacing:.12em; }

    .card-bopd { display:flex; align-items:baseline; gap:5px; }
    .bopd-val { font-family:"JetBrains Mono",monospace; font-size:26px;
      font-weight:700; color:#6dd47e; line-height:1; }
    .bopd-unit { font-size:11px; color:var(--beige-400); letter-spacing:.1em; text-transform:uppercase;
      display:flex; flex-direction:column; line-height:1.1; }
    .bopd-unit small { color:var(--beige-500); font-size:8.5px; }

    .card-trend { display:inline-flex; align-items:center; gap:5px;
      font-family:"JetBrains Mono",monospace; font-size:10px;
      color:var(--beige-400); }
    .card-trend .t-arrow { width:10px; text-align:center; }
    .card-trend.up   { color:#6dd47e; }
    .card-trend.down { color:#ef5a3a; }
    .card-trend .t-lbl { color:var(--beige-500); letter-spacing:.1em;
      text-transform:uppercase; font-size:8.5px; }

    .card-meta { display:flex; flex-direction:column; gap:3px; }
    .meta-row { display:flex; justify-content:space-between; font-size:10px; }
    .meta-k { color:var(--beige-500); letter-spacing:.08em; text-transform:uppercase; }
    .meta-v { color:var(--beige-200); font-family:"JetBrains Mono",monospace; }

    .card-footer { display:flex; flex-wrap:wrap; gap:5px; padding-top:5px;
      border-top:1px solid var(--border-1); }
    .esp-badge { display:inline-flex; align-items:center; gap:5px;
      font-size:9px; padding:2px 6px; border-radius:2px; font-weight:600;
      letter-spacing:.08em; font-family:"JetBrains Mono",monospace; }
    .esp-badge.red   { background:#3a1410; color:#ef5a3a; border:1px solid #ef5a3a55; }
    .esp-badge.green { background:#0f2a14; color:#6dd47e; border:1px solid #6dd47e55; }
    .esp-badge .blink {
      width:6px; height:6px; border-radius:50%;
    }
    .esp-badge .blink.red   { background:#ef3a2a; animation: esp-blink-red 1.1s infinite; }
    .esp-badge .blink.green { background:#6dd47e; animation: esp-blink-green 1.3s infinite; }
    @keyframes esp-blink-red {
      0%   { box-shadow:0 0 0 0 rgba(239,58,42,0.85); opacity:1;   }
      70%  { box-shadow:0 0 0 6px rgba(239,58,42,0);  opacity:.55; }
      100% { box-shadow:0 0 0 0 rgba(239,58,42,0);     opacity:1;   }
    }
    @keyframes esp-blink-green {
      0%   { box-shadow:0 0 0 0 rgba(109,212,126,0.85); opacity:1;   }
      70%  { box-shadow:0 0 0 6px rgba(109,212,126,0);  opacity:.55; }
      100% { box-shadow:0 0 0 0 rgba(109,212,126,0);     opacity:1;   }
    }
    .profile-badge { font-size:9px; padding:2px 6px; border-radius:2px;
      letter-spacing:.05em; color:var(--beige-300); background:var(--bg-3);
      border:1px solid var(--border-2); }

    .no-results { grid-column:1/-1; text-align:center; padding:40px;
      color:var(--beige-500); font-size:12px; letter-spacing:.14em; text-transform:uppercase; }
  `]
})
export class WellSequencingComponent implements OnChanges {
  @Input() wells: Well[] = [];

  colors = PRIORITY_COLORS;
  priorities = ['P1','P2','P3'];
  facilities: string[] = [];
  reservoirs: string[] = [];

  gcFilter       = '';
  priorityFilter = '';
  reservoirFilter= '';

  filtered: Well[] = [];
  totalPeakOil  = 0;
  totalExpected = 0;
  avgWC         = 0;

  ngOnChanges() {
    this.facilities = [...new Set(this.wells.map(w => w.facility).filter(Boolean))].sort();
    this.reservoirs = [...new Set(this.wells.map(w => w.reservoir).filter(Boolean))].sort();
    this.applyFilters();
  }

  applyFilters() {
    const priOrder: Record<string, number> = { P1: 0, P2: 1, P3: 2 };
    this.filtered = this.wells
      .filter(w =>
        (!this.gcFilter        || w.facility  === this.gcFilter) &&
        (!this.priorityFilter  || w.priority  === this.priorityFilter) &&
        (!this.reservoirFilter || w.reservoir === this.reservoirFilter)
      )
      .sort((a, b) =>
        (priOrder[a.priority] ?? 9) - (priOrder[b.priority] ?? 9)
        || (b.recent_highest_oil || b.expected_oil || 0) - (a.recent_highest_oil || a.expected_oil || 0));

    this.totalPeakOil  = this.filtered.reduce((s, w) => s + (w.recent_highest_oil || w.expected_oil || 0), 0);
    this.totalExpected = this.filtered.reduce((s, w) => s + (w.expected_oil || 0), 0);
    this.avgWC = this.filtered.length
      ? this.filtered.reduce((s, w) => s + (w.latest_wc || 0), 0) / this.filtered.length
      : 0;
  }
}
