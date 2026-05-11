import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Well, Workover, PRIORITY_COLORS } from '../models/well.model';

@Component({
  selector: 'app-well-detail',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="detail" *ngIf="!well">
      <div class="section-h">Well Detail</div>
      <p class="hint">Click a dot on the map or a row in the table to view full well history, workovers and engineering notes.</p>
    </div>
    <div class="detail" *ngIf="well">
      <h2 class="well-name">{{well.well_name}}</h2>
      <div class="well-sub">{{[well.field, well.reservoir, well.facility].join(' · ')}}</div>
      <div class="badges">
        <span class="badge priority" [style.background]="colors[well.priority]">
          {{well.priority}} · {{well.priority_label}}
        </span>
        <span class="badge al">{{well.al_method}}</span>
        <span class="badge">{{well.contractor}}</span>
        <span class="badge">{{well.well_type}}</span>
      </div>

      <div class="kv">
        <span class="k">Closure Reason</span><span class="v">{{well.reason_label}}</span>
        <span class="k">Closed Since</span><span class="v">{{well.operational_status_date}}</span>
        <span class="k">Action</span><span class="v">{{well.closed_action_activity}}</span>
        <span class="k">Status</span><span class="v">{{well.closed_action_status}}</span>
        <span class="k">Startup Score</span>
        <span class="v" [style.color]="colors[well.priority]">{{well.startup_score | number:'1.1-1'}}</span>
      </div>

      <div class="section-h">Production Snapshot</div>
      <div class="kv">
        <span class="k">Latest Oil</span><span class="v">{{well.latest_oil | number:'1.0-0'}} BOPD</span>
        <span class="k">Latest Liquid</span><span class="v">{{well.latest_liquid | number:'1.0-0'}} BLPD</span>
        <span class="k">Water Cut</span><span class="v">{{well.latest_wc | number:'1.1-1'}} %</span>
        <span class="k">GOR</span><span class="v">{{well.latest_gor | number:'1.0-0'}} scf/stb</span>
        <span class="k">Expected Oil</span><span class="v">{{well.expected_oil | number:'1.0-0'}} BOPD</span>
        <span class="k">Recent Highest Oil</span>
        <span class="v oil-high">
          {{(well.recent_highest_oil ?? well.potential_oil) | number:'1.0-0'}} BOPD
          <small *ngIf="well.recent_highest_oil_date" class="oil-date">({{well.recent_highest_oil_date}})</small>
        </span>
        <span class="k">Oil Trend</span>
        <span class="v" [class.trend-down]="(well.oil_trend_pct ?? 0) < 0"
                       [class.trend-up]="(well.oil_trend_pct ?? 0) > 0">
          <ng-container *ngIf="well.oil_trend_pct != null; else noTrend">
            {{well.oil_trend_pct > 0 ? '+' : ''}}{{well.oil_trend_pct | number:'1.1-1'}} %
          </ng-container>
          <ng-template #noTrend>—</ng-template>
        </span>
        <span class="k">Last PGOR Date</span><span class="v">{{well.latest_pgor_date}}</span>
        <span class="k">Allowable</span><span class="v">{{well.allowable_rate | number:'1.0-0'}} BLPD</span>
      </div>

      <div class="section-h">Equipment</div>
      <div class="kv">
        <span class="k">AL Method</span><span class="v">{{well.al_method}}</span>
        <span class="k">Contractor</span><span class="v">{{well.contractor}}</span>
        <span class="k">ESP Run Life</span>
        <span class="v esp-cell">
          {{well.esp_run_life}} days
          <span *ngIf="well.esp_run_life > 700" class="esp-blinker red"
            title="ESP run life exceeds 700 days — review for replacement"></span>
          <span *ngIf="well.esp_run_life > 0 && well.esp_run_life < 500" class="esp-blinker green"
            title="ESP run life below 500 days — healthy / newly installed"></span>
        </span>
        <span class="k">Install Date</span><span class="v">{{well.install_date}}</span>
        <span class="k">Last Activity</span><span class="v">{{well.last_imp_activity}}</span>
      </div>

      <div class="section-h">Reservoir / Perforations</div>
      <div class="kv">
        <span class="k">Reservoir</span><span class="v">{{well.reservoir}}</span>
        <span class="k">Formations</span><span class="v">{{well.formations}}</span>
        <span class="k">Perf Interval</span>
        <span class="v">{{well.perf_top | number:'1.0-0'}} – {{well.perf_bottom | number:'1.0-0'}} ft</span>
        <span class="k">Perf Count</span><span class="v">{{well.perforation_count}}</span>
        <span class="k">API Gravity</span><span class="v">{{well.api_gravity | number:'1.1-1'}}°</span>
      </div>

      <div class="section-h">Workover History ({{well.wo_count}})</div>
      <div class="wo-list">
        <div class="wo-item" *ngFor="let w of workovers | slice:0:8">
          <div class="wo-top">
            <span class="wo-type">{{w.activity_type}}{{w.activity_code ? ' · '+w.activity_code : ''}}</span>
            <span class="wo-date">{{w.start_date}} → {{w.end_date}}</span>
          </div>
          <div class="wo-purpose" *ngIf="w.purpose">{{w.purpose}}</div>
          <div class="wo-summary" *ngIf="w.summary">{{w.summary.slice(0,220)}}{{w.summary.length>220?'…':''}}</div>
        </div>
        <div *ngIf="!workovers.length" class="no-wo">No workover records.</div>
      </div>

      <ng-container *ngIf="well.pe_comment || well.re_comment || well.fd_action_plan">
        <div class="section-h">Engineering Notes</div>
        <div class="note" *ngIf="well.pe_comment"><b class="note-tag">PE:</b> {{well.pe_comment}}</div>
        <div class="note" *ngIf="well.re_comment"><b class="note-tag">RE:</b> {{well.re_comment}}</div>
        <div class="note" *ngIf="well.fd_action_plan"><b class="note-tag">FD:</b> {{well.fd_action_plan}}</div>
      </ng-container>
    </div>
  `,
  styles: [`
    .detail { padding:14px; }
    .hint { font-size:11px; color:var(--beige-500); line-height:1.7; margin-top:8px; }
    .well-name { font-size:22px; font-weight:700; color:var(--orange-400);
      letter-spacing:.04em; margin-bottom:4px; }
    .well-sub { font-size:11px; letter-spacing:.12em; text-transform:uppercase;
      color:var(--beige-300); margin-bottom:12px; }
    .badges { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
    .badge { font-size:10px; letter-spacing:.16em; text-transform:uppercase;
      padding:3px 8px; border:1px solid var(--border-2); border-radius:2px;
      color:var(--beige-100); background:var(--bg-2); }
    .badge.priority { color:#1a1612; font-weight:700; border-color:transparent; }
    .badge.al { color:var(--orange-300); border-color:var(--orange-700); }
    .kv { display:grid; grid-template-columns:130px 1fr; gap:4px 12px;
      font-size:12px; margin-bottom:12px; }
    .kv .k { color:var(--beige-400); font-size:10px; letter-spacing:.14em;
      text-transform:uppercase; align-self:center; }
    .kv .v { color:var(--beige-100); font-family:"JetBrains Mono",monospace; }
    .section-h { font-size:10px; letter-spacing:.22em; text-transform:uppercase;
      color:var(--beige-400); margin:14px 0 8px; padding-bottom:4px;
      border-bottom:1px solid var(--border-1); }
    .wo-list { display:flex; flex-direction:column; gap:6px; }
    .wo-item { border-left:2px solid var(--orange-600); padding:6px 0 6px 10px; font-size:11px; }
    .wo-top { display:flex; justify-content:space-between; gap:8px; }
    .wo-type { color:var(--orange-300); font-weight:600; letter-spacing:.06em; }
    .wo-date { color:var(--beige-400); font-family:"JetBrains Mono",monospace; font-size:10px; }
    .wo-purpose { color:var(--beige-100); margin-top:2px; }
    .wo-summary { color:var(--beige-300); font-size:10px; line-height:1.5; margin-top:3px; }
    .no-wo { font-size:11px; color:var(--beige-500); }
    .note { font-size:11px; margin-bottom:6px; line-height:1.6; }
    .note-tag { color:var(--orange-400); }

    /* Recent-highest-oil — green emphasis */
    .oil-high { color:#6dd47e !important; font-weight:600; }
    .oil-high .oil-date { color:#6dd47e99; font-family:'JetBrains Mono',monospace;
      font-size:10px; margin-left:6px; }
    .trend-up   { color:#6dd47e; }
    .trend-down { color:#ef5a3a; }

    /* ESP run-life status dots — red >700d, green <500d */
    .esp-cell { display:inline-flex; align-items:center; gap:8px; }
    .esp-blinker {
      width:10px; height:10px; border-radius:50%;
      display:inline-block;
    }
    .esp-blinker.red {
      background:#ef3a2a;
      animation: esp-blink-red 1.1s infinite;
    }
    .esp-blinker.green {
      background:#6dd47e;
      animation: esp-blink-green 1.3s infinite;
    }
    @keyframes esp-blink-red {
      0%   { box-shadow:0 0 0 0 rgba(239,58,42,0.85); opacity:1;   }
      70%  { box-shadow:0 0 0 10px rgba(239,58,42,0);  opacity:.55; }
      100% { box-shadow:0 0 0 0 rgba(239,58,42,0);     opacity:1;   }
    }
    @keyframes esp-blink-green {
      0%   { box-shadow:0 0 0 0 rgba(109,212,126,0.85); opacity:1;   }
      70%  { box-shadow:0 0 0 10px rgba(109,212,126,0);  opacity:.55; }
      100% { box-shadow:0 0 0 0 rgba(109,212,126,0);     opacity:1;   }
    }
  `]
})
export class WellDetailComponent {
  @Input() well: Well | null = null;
  @Input() workovers: Workover[] = [];
  colors = PRIORITY_COLORS;
}
