import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Well, PRIORITY_COLORS } from '../models/well.model';

interface RtTag {
  abbr: string; label: string; unit: string;
  min: number; max: number; warnHi: number; alarmHi: number; warnLo: number; alarmLo: number;
}
interface TagReading { tag: RtTag; value: number; pct: number; status: 'ok' | 'warn' | 'alarm'; }
interface WellRow { well: Well; readings: TagReading[]; overallStatus: 'ok' | 'warn' | 'alarm'; }

@Component({
  selector: 'app-rt-surveillance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rt-root">

      <!-- ── Demo banner ── -->
      <div class="demo-banner">
        <span class="demo-dot"></span>
        POST START-IN SURVEILLANCE — Demo values derived from last stored well parameters.
        Live SCADA feed will replace these values once RT integration is active.
        <span class="demo-ts">Snapshot: 30-Apr-2026 00:00 AST</span>
      </div>

      <!-- ── Header + filters ── -->
      <div class="rt-header">
        <div class="rt-title-area">
          <div class="rt-title">Post Start-In Surveillance</div>
          <div class="rt-sub">ESP Telemetry — FLP · PDP · PIP · Intake Temp · Discharge Temp · Frequency</div>
        </div>
        <div class="rt-filters">
          <input class="rt-search" placeholder="Search well…"
            [(ngModel)]="search" (ngModelChange)="applyFilter()"/>
          <select [(ngModel)]="gcFilter" (ngModelChange)="applyFilter()">
            <option value="">All GCs</option>
            <option *ngFor="let f of facilities" [value]="f">{{f}}</option>
          </select>
          <select [(ngModel)]="priFilter" (ngModelChange)="applyFilter()">
            <option value="">All Priorities</option>
            <option *ngFor="let p of priorities" [value]="p">{{p}}</option>
          </select>
          <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()">
            <option value="">All Status</option>
            <option value="alarm">Alarm</option>
            <option value="warn">Warning</option>
            <option value="ok">Normal</option>
          </select>
        </div>
      </div>

      <!-- ── Alarm summary strip ── -->
      <div class="alarm-strip">
        <div class="alarm-kpi alarm">
          <span class="ak-v">{{alarmCount}}</span>
          <span class="ak-l">ALARM</span>
        </div>
        <div class="alarm-kpi warn">
          <span class="ak-v">{{warnCount}}</span>
          <span class="ak-l">WARNING</span>
        </div>
        <div class="alarm-kpi ok">
          <span class="ak-v">{{okCount}}</span>
          <span class="ak-l">NORMAL</span>
        </div>
        <div class="alarm-kpi total">
          <span class="ak-v">{{filtered.length}}</span>
          <span class="ak-l">WELLS SHOWN</span>
        </div>
        <div class="tag-legend">
          <span *ngFor="let t of TAGS" class="tleg">{{t.abbr}}<em>{{t.unit}}</em></span>
        </div>
      </div>

      <!-- ── Main table ── -->
      <div class="rt-table-wrap">
        <table class="rt-table">
          <thead>
            <tr>
              <th class="col-well">Well</th>
              <th class="col-gc">GC</th>
              <th class="col-status">Status</th>
              <th *ngFor="let t of TAGS" class="col-param">
                <span class="th-abbr">{{t.abbr}}</span>
                <span class="th-unit">{{t.unit}}</span>
              </th>
              <th class="col-ts">Last Reading</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of filtered" [class.row-alarm]="row.overallStatus==='alarm'"
              [class.row-warn]="row.overallStatus==='warn'">

              <!-- Well name -->
              <td class="col-well">
                <span class="pri-dot" [style.background]="colors[row.well.priority]"></span>
                <span class="wname">{{row.well.well_name}}</span>
              </td>

              <!-- GC -->
              <td class="col-gc">{{row.well.facility}}</td>

              <!-- Overall status -->
              <td class="col-status">
                <span class="status-badge" [class]="'sb-'+row.overallStatus">
                  {{row.overallStatus === 'ok' ? 'NORMAL' : row.overallStatus === 'warn' ? 'WARN' : 'ALARM'}}
                </span>
              </td>

              <!-- Parameter cells -->
              <td *ngFor="let r of row.readings" class="col-param pcell"
                [class.pcell-ok]="r.status==='ok'"
                [class.pcell-warn]="r.status==='warn'"
                [class.pcell-alarm]="r.status==='alarm'">
                <span class="pval" [class]="'pval-'+r.status">{{r.value | number:'1.0-1'}}</span>
                <div class="pbar-wrap">
                  <div class="pbar-fill" [class]="'pbar-'+r.status" [style.width.%]="r.pct"></div>
                </div>
              </td>

              <!-- Timestamp -->
              <td class="col-ts ts-val">30-Apr-26 23:{{row.well.well_name | slice:3:5}}:00</td>
            </tr>
          </tbody>
        </table>

        <div class="no-results" *ngIf="!filtered.length">
          No wells match the current filters.
        </div>
      </div>

    </div>
  `,
  styles: [`
    .rt-root { display:flex; flex-direction:column; height:100%; overflow:hidden; }

    /* ── Demo banner ── */
    .demo-banner {
      flex-shrink:0; background:#1a100540; border-bottom:1px solid #4a3020;
      padding:6px 16px; font-size:10px; letter-spacing:.1em; color:#c8a060;
      display:flex; align-items:center; gap:10px;
    }
    .demo-dot { width:8px; height:8px; border-radius:50%; background:#ef5a3a;
      flex-shrink:0; animation:blink 1.8s infinite; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
    .demo-ts { margin-left:auto; color:var(--beige-400); font-family:"JetBrains Mono",monospace; }

    /* ── Header ── */
    .rt-header { flex-shrink:0; display:flex; align-items:flex-start; gap:20px; flex-wrap:wrap;
      padding:10px 16px 8px; border-bottom:1px solid var(--border-1); background:var(--bg-1); }
    .rt-title-area { flex:1; }
    .rt-title { font-size:13px; font-weight:700; letter-spacing:.16em;
      text-transform:uppercase; color:var(--orange-400); }
    .rt-sub { font-size:10px; color:var(--beige-400); margin-top:2px; letter-spacing:.06em; }
    .rt-filters { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .rt-search { min-width:160px; }
    .rt-filters select { min-width:110px; }

    /* ── Alarm strip ── */
    .alarm-strip { flex-shrink:0; display:flex; align-items:center; gap:0;
      background:var(--bg-2); border-bottom:1px solid var(--border-1); }
    .alarm-kpi { display:flex; flex-direction:column; align-items:center;
      padding:7px 20px; border-right:1px solid var(--border-1); }
    .alarm-kpi.alarm .ak-v { color:#ef5a3a; }
    .alarm-kpi.warn  .ak-v { color:#ffb83d; }
    .alarm-kpi.ok    .ak-v { color:#6dd47e; }
    .alarm-kpi.total .ak-v { color:var(--orange-400); }
    .ak-v { font-family:"JetBrains Mono",monospace; font-size:20px; font-weight:700; line-height:1; }
    .ak-l { font-size:8px; letter-spacing:.18em; text-transform:uppercase;
      color:var(--beige-400); margin-top:2px; }
    .tag-legend { display:flex; gap:14px; padding:0 18px; margin-left:auto; }
    .tleg { font-size:10px; color:var(--beige-300); font-family:"JetBrains Mono",monospace;
      letter-spacing:.06em; display:flex; flex-direction:column; align-items:center; }
    .tleg em { font-size:8px; color:var(--beige-500); font-style:normal; }

    /* ── Table wrapper ── */
    .rt-table-wrap { flex:1; overflow:auto; }
    .rt-table { width:100%; border-collapse:collapse; font-size:11px; }

    .rt-table thead th {
      position:sticky; top:0; z-index:2;
      background:var(--bg-2); padding:6px 10px;
      text-align:center; white-space:nowrap;
      border-bottom:2px solid var(--border-2);
      font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:var(--beige-300);
    }
    .rt-table thead th.col-well,
    .rt-table thead th.col-gc  { text-align:left; }
    .th-abbr { display:block; color:var(--beige-100); font-size:10px; letter-spacing:.08em; }
    .th-unit { display:block; color:var(--beige-500); font-size:8px; margin-top:1px; }

    .rt-table tbody tr { border-bottom:1px solid var(--border-1); transition:background .1s; }
    .rt-table tbody tr:hover { background:var(--bg-2); }
    .rt-table tbody tr.row-alarm { background:#2a080460; }
    .rt-table tbody tr.row-warn  { background:#28200060; }

    /* ── Row cells ── */
    .col-well { padding:6px 12px; white-space:nowrap; }
    .col-gc   { padding:6px 10px; color:var(--beige-300);
      font-family:"JetBrains Mono",monospace; font-size:10px; white-space:nowrap; }
    .col-status { padding:6px 10px; text-align:center; white-space:nowrap; }
    .col-ts { padding:6px 10px; text-align:center; white-space:nowrap; }
    .col-param { min-width:78px; }

    .pri-dot { display:inline-block; width:8px; height:8px; border-radius:2px;
      margin-right:7px; flex-shrink:0; vertical-align:middle; }
    .wname { font-family:"JetBrains Mono",monospace; color:var(--orange-300);
      font-weight:600; font-size:11px; vertical-align:middle; }

    /* ── Status badge ── */
    .status-badge { font-size:8px; font-weight:700; letter-spacing:.14em;
      padding:2px 6px; border-radius:2px; font-family:"JetBrains Mono",monospace; }
    .sb-ok    { background:#0f2a0f; color:#6dd47e; border:1px solid #1a4a1a; }
    .sb-warn  { background:#281e00; color:#ffb83d; border:1px solid #4a3a00; }
    .sb-alarm { background:#2a0a00; color:#ef5a3a; border:1px solid #5a1a0a; }

    /* ── Parameter cell ── */
    .pcell { padding:6px 10px 8px; text-align:right; position:relative; }
    .pcell-ok    { }
    .pcell-warn  { background:#281e0430; }
    .pcell-alarm { background:#2a0a0530; }

    .pval { font-family:"JetBrains Mono",monospace; font-size:12px; font-weight:700;
      display:block; line-height:1.1; }
    .pval-ok    { color:#6dd47e; }
    .pval-warn  { color:#ffb83d; }
    .pval-alarm { color:#ef5a3a; }

    .pbar-wrap { position:absolute; bottom:2px; left:4px; right:4px;
      height:2px; background:var(--bg-3); border-radius:1px; }
    .pbar-fill { height:100%; border-radius:1px; transition:width .3s; }
    .pbar-ok    { background:#6dd47e; }
    .pbar-warn  { background:#ffb83d; }
    .pbar-alarm { background:#ef5a3a; }

    .ts-val { font-family:"JetBrains Mono",monospace; font-size:9px; color:var(--beige-400); }

    .no-results { padding:40px; text-align:center;
      color:var(--beige-500); font-size:12px; letter-spacing:.14em; text-transform:uppercase; }
  `]
})
export class RtSurveillanceComponent implements OnChanges {
  @Input() wells: Well[] = [];

  colors    = PRIORITY_COLORS;
  priorities = ['P1','P2','P3','P4','P5'];
  facilities: string[] = [];

  search       = '';
  gcFilter     = '';
  priFilter    = '';
  statusFilter = '';

  allRows:  WellRow[] = [];
  filtered: WellRow[] = [];

  get alarmCount() { return this.filtered.filter(r => r.overallStatus === 'alarm').length; }
  get warnCount()  { return this.filtered.filter(r => r.overallStatus === 'warn').length; }
  get okCount()    { return this.filtered.filter(r => r.overallStatus === 'ok').length; }

  /* ── ESP parameter definitions ── */
  readonly TAGS: RtTag[] = [
    { abbr:'FLP',   label:'Flowline Pressure',   unit:'psi',
      min:30,  max:280,  warnHi:180, alarmHi:230, warnLo:40,  alarmLo:32 },
    { abbr:'PDP',   label:'Pump Disch. Pressure', unit:'psi',
      min:400, max:3200, warnHi:2600,alarmHi:3000,warnLo:500, alarmLo:420 },
    { abbr:'PIP',   label:'Pump Intake Pressure', unit:'psi',
      min:100, max:1000, warnHi:850, alarmHi:950, warnLo:150, alarmLo:120 },
    { abbr:'T-IN',  label:'Intake Temperature',   unit:'°F',
      min:100, max:240,  warnHi:200, alarmHi:220, warnLo:110, alarmLo:102 },
    { abbr:'T-DIS', label:'Discharge Temperature',unit:'°F',
      min:140, max:320,  warnHi:270, alarmHi:300, warnLo:150, alarmLo:142 },
    { abbr:'FREQ',  label:'Motor Frequency',       unit:'Hz',
      min:30,  max:65,   warnHi:60,  alarmHi:63,  warnLo:35,  alarmLo:32  },
  ];

  ngOnChanges() {
    this.facilities = [...new Set(this.wells.map(w => w.facility).filter(Boolean))].sort();
    this.allRows    = this.wells.map(w => this.buildRow(w));
    this.applyFilter();
  }

  /* Deterministic pseudo-random from string */
  private hash(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h;
  }

  private dummyValue(wellName: string, ti: number): number {
    const h = this.hash(wellName + '|' + ti);
    // 80 % of values in comfortable mid-range, 15 % warning, 5 % alarm
    const roll  = h % 100;
    const tag   = this.TAGS[ti];
    const range = tag.max - tag.min;
    if (roll < 5) {
      // alarm zone (hi side)
      return +(tag.warnHi + (h % 100) / 100 * (tag.alarmHi - tag.warnHi)).toFixed(1);
    } else if (roll < 20) {
      // warn zone
      return +(tag.warnHi * 0.9 + (h % 1000) / 1000 * (tag.warnHi * 0.1)).toFixed(1);
    } else {
      // normal zone (40–85 % of range from min)
      return +(tag.min + range * (0.40 + (h % 10000) / 10000 * 0.45)).toFixed(1);
    }
  }

  private tagStatus(tag: RtTag, v: number): 'ok' | 'warn' | 'alarm' {
    if (v >= tag.alarmHi || v <= tag.alarmLo) return 'alarm';
    if (v >= tag.warnHi  || v <= tag.warnLo)  return 'warn';
    return 'ok';
  }

  private buildRow(well: Well): WellRow {
    const readings: TagReading[] = this.TAGS.map((tag, ti) => {
      const value  = this.dummyValue(well.well_name, ti);
      const pct    = Math.min(100, Math.max(0,
        ((value - tag.min) / (tag.max - tag.min)) * 100));
      const status = this.tagStatus(tag, value);
      return { tag, value, pct, status };
    });
    const overallStatus =
      readings.some(r => r.status === 'alarm') ? 'alarm' :
      readings.some(r => r.status === 'warn')  ? 'warn'  : 'ok';
    return { well, readings, overallStatus };
  }

  applyFilter() {
    let rows = this.allRows;
    if (this.gcFilter)     rows = rows.filter(r => r.well.facility === this.gcFilter);
    if (this.priFilter)    rows = rows.filter(r => r.well.priority === this.priFilter);
    if (this.statusFilter) rows = rows.filter(r => r.overallStatus === this.statusFilter);
    if (this.search)       rows = rows.filter(r =>
      r.well.well_name.toLowerCase().includes(this.search.toLowerCase()));
    // Sort: alarms first, then warns, then ok; within group by well name
    const order = { alarm: 0, warn: 1, ok: 2 };
    this.filtered = rows.sort((a, b) =>
      order[a.overallStatus] - order[b.overallStatus] ||
      a.well.well_name.localeCompare(b.well.well_name));
  }
}
