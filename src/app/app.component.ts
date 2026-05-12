import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from './services/data.service';
import { Well, PRIORITY_COLORS, PRIORITY_DESC } from './models/well.model';
import { WellMapComponent }          from './components/well-map.component';
import { PriorityChartComponent }    from './components/priority-chart.component';
import { LogicChartComponent }       from './components/logic-chart.component';
import { WellTableComponent }        from './components/well-table.component';
import { WellDetailComponent }       from './components/well-detail.component';
import { WellSequencingComponent }   from './components/well-sequencing.component';
import { WellPerformanceComponent }  from './components/well-performance.component';
import { RecommendationComponent }   from './components/recommendation.component';
import { SplashComponent }           from './components/splash.component';

type Tab = 'observe' | 'orient' | 'decide' | 'act' | 'performance' | 'recommend';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    WellMapComponent, PriorityChartComponent, LogicChartComponent,
    WellTableComponent, WellDetailComponent, WellSequencingComponent,
    WellPerformanceComponent, RecommendationComponent, SplashComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <app-splash *ngIf="showSplash()" (done)="showSplash.set(false)"/>

  <div class="app" *ngIf="!showSplash() && (ds.loaded()); else loading">

    <!-- ── TOPBAR ── -->
    <header class="topbar">
      <div class="brand">
        <svg class="logo-icon" width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="3" fill="#ff7a1a" opacity=".12"/>
          <line x1="16" y1="3"  x2="5"  y2="28" stroke="#ff9849" stroke-width="1.5"/>
          <line x1="16" y1="3"  x2="27" y2="28" stroke="#ff9849" stroke-width="1.5"/>
          <line x1="8"  y1="20" x2="24" y2="20" stroke="#ff9849" stroke-width="1.2"/>
          <line x1="10" y1="14" x2="22" y2="14" stroke="#ff9849" stroke-width="1.2"/>
          <line x1="13" y1="8"  x2="19" y2="8"  stroke="#ff9849" stroke-width="1.2"/>
          <line x1="4"  y1="28" x2="28" y2="28" stroke="#ff7a1a" stroke-width="2"/>
          <circle cx="16" cy="3" r="2" fill="#ffb83d"/>
        </svg>
        <div class="brand-text">
          <span class="brand-main">WELL STARTUP</span>
          <span class="brand-sep">/</span>
          <span class="brand-sub">DECISION CONSOLE</span>
        </div>
        <span class="brand-pill">HAL · MN · UG · WK</span>
      </div>
      <div class="topbar-meta" *ngIf="ds.kpis() as k">
        <span>Inventory <b>{{k.total_wells_inventory}}</b></span>
        <span>Closed <b>{{k.total_closed_wells}}</b></span>
        <span>Open <b>{{k.total_open_wells}}</b></span>
        <span>Recoverable <b>{{(k.potential_oil_total_bopd/1000).toFixed(0)}}k BOPD</b></span>
      </div>
    </header>

    <!-- ── TAB NAV (Sequencing removed; now embedded in ACT) ── -->
    <nav class="tab-nav">
      <button *ngFor="let t of tabs" class="tab-btn"
        [class.active]="activeTab()===t.id"
        (click)="onTabClick(t.id)">
        <span class="tab-num">{{t.num}}</span>
        <span class="tab-label">{{t.label}}</span>
        <span class="tab-sub">{{t.sub}}</span>
      </button>
    </nav>

    <!-- ── TAB SWITCH LOADER (2s graphic) ── -->
    <div class="tab-loader" *ngIf="tabLoading()">
      <div class="tl-grid"></div>
      <div class="tl-scan"></div>
      <div class="tl-content">
        <div class="tl-radar">
          <div class="tl-sweep"></div>
          <div class="tl-ring r1"></div>
          <div class="tl-ring r2"></div>
          <div class="tl-ring r3"></div>
          <div class="tl-cross h"></div>
          <div class="tl-cross v"></div>
          <div class="tl-center"></div>
        </div>
        <div class="tl-meta">
          <div class="tl-label">LOADING</div>
          <div class="tl-tab">{{tabLabel()}}</div>
          <div class="tl-tag">{{tabSub()}}</div>
          <div class="tl-bar"><div class="tl-fill"></div></div>
        </div>
      </div>
    </div>

    <!-- ── FULL-WIDTH TABS ── -->
    <app-well-performance *ngIf="!tabLoading() && activeTab()==='performance'"
      [wells]="ds.wells()" [testMap]="ds.testMap()" class="seq-full"/>
    <app-recommendation  *ngIf="!tabLoading() && activeTab()==='recommend'"
      [wells]="ds.wells()" [woMap]="ds.woMap()" class="seq-full"/>

    <!-- ══════════════════════════════════════════════════════
         OBSERVE TAB — minimal: just well location (map) + history
         ══════════════════════════════════════════════════════ -->
    <div class="observe-layout" *ngIf="!tabLoading() && activeTab()==='observe'">
      <div class="panel observe-map-panel">
        <div class="panel-head">
          <h3>Observe · Well Location — West Kuwait</h3>
          <span class="pmeta">{{ds.wells().length}} wells · zoom & pan supported</span>
        </div>
        <div class="panel-body">
          <app-well-map
            [wells]="ds.wells()"
            [selectedWell]="selectedWell()"
            (wellClick)="selectedWell.set($event)"/>
        </div>
      </div>
      <aside class="observe-right">
        <app-well-detail [well]="selectedWellObj()" [workovers]="selectedWOs()"/>
      </aside>
    </div>

    <!-- ══════════════════════════════════════════════════════
         MAIN 3-COL LAYOUT — used by Orient / Decide / Act
         ══════════════════════════════════════════════════════ -->
    <div class="main" *ngIf="!tabLoading() && isThreeCol()">

      <aside class="left">

        <div class="sidebar-section">
          <div class="sidebar-title">Search</div>
          <input placeholder="Well name…" [ngModel]="searchFilter()" (ngModelChange)="searchFilter.set($event)"/>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-title">Production Profile Priority</div>
          <div class="psub">Oil rate · Water cut · GOR · Decline trend</div>
          <div class="priority-list">
            <div class="priority-item" [class.active]="priorityFilter()===''">
              <span class="swatch" style="background:var(--beige-400)"></span>
              <span class="plabel">All <small>profiles</small></span>
              <span class="pcount" (click)="priorityFilter.set('')">{{ds.wells().length}}</span>
            </div>
            <div class="priority-item" *ngFor="let p of priorityKeys"
              [class.active]="priorityFilter()===p"
              (click)="priorityFilter.set(priorityFilter()===p?'':p)">
              <span class="swatch" [style.background]="colors[p]"></span>
              <span class="plabel">{{p}} <small>{{priorityDesc[p] | slice:0:24}}…</small></span>
              <span class="pcount">{{priorityCount(p)}}</span>
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-title">Filters</div>
          <div class="filter-row">
            <label>Gathering Center</label>
            <select [ngModel]="facilityFilter()" (ngModelChange)="facilityFilter.set($event)">
              <option value="">All GCs</option>
              <option *ngFor="let f of dFacilities">{{f}}</option>
            </select>
          </div>
          <div class="filter-row">
            <label>Reservoir</label>
            <select [ngModel]="reservoirFilter()" (ngModelChange)="reservoirFilter.set($event)">
              <option value="">All Reservoirs</option>
              <option *ngFor="let r of dReservoirs">{{r}}</option>
            </select>
          </div>
          <div class="filter-row">
            <label>Field</label>
            <select [ngModel]="fieldFilter()" (ngModelChange)="fieldFilter.set($event)">
              <option value="">All Fields</option>
              <option *ngFor="let f of dFields">{{f}}</option>
            </select>
          </div>
        </div>
      </aside>

      <section class="center">

        <!-- KPI strip -->
        <div class="kpi-strip" *ngIf="ds.kpis() as k">
          <div class="kpi">
            <div class="kk">P1 Best Producers</div>
            <div class="kv accent">{{priorityCount('P1')}}</div>
            <div class="ks">{{topBucketPotential() | number:'1.0-0'}} BOPD recoverable</div>
          </div>
          <div class="kpi">
            <div class="kk">Closed Inventory</div>
            <div class="kv">{{k.total_closed_wells}}</div>
            <div class="ks">of {{k.total_wells_inventory}} total wells</div>
          </div>
          <div class="kpi">
            <div class="kk">GC Capacity Closures</div>
            <div class="kv accent">{{k.by_reason?.['GC Capacity']??0}}</div>
            <div class="ks">low-effort restart candidates</div>
          </div>
          <div class="kpi">
            <div class="kk">Total Recoverable</div>
            <div class="kv accent">{{(k.potential_oil_total_bopd/1000).toFixed(0)}}k</div>
            <div class="ks">BOPD potential</div>
          </div>
          <div class="kpi">
            <div class="kk">Filtered Wells</div>
            <div class="kv">{{filtered().length}}</div>
            <div class="ks">matching selection</div>
          </div>
        </div>

        <!-- Map panel (Leaflet) -->
        <div class="panel map-panel">
          <div class="panel-head">
            <h3>{{tabLabel()}} · Field Map — West Kuwait</h3>
            <span class="pmeta">{{filtered().length}} wells · Production Profile priority</span>
          </div>
          <div class="panel-body">
            <app-well-map
              [wells]="filtered()"
              [selectedWell]="selectedWell()"
              [facilityFilter]="facilityFilter()"
              (wellClick)="selectedWell.set($event)"/>
          </div>
        </div>

        <!-- Bottom strip: chart + table -->
        <div class="bottom-strip">
          <div class="panel" style="margin:0;border:none;border-radius:0">
            <div class="panel-head">
              <h3>{{activeTab()==='orient' ? 'Orient · Scoring Logic' : 'Decide · Priority × Recoverable Oil'}}</h3>
              <span class="pmeta">{{activeTab()==='orient' ? 'Observe → Orient → Score → Bucket' : 'BOPD potential by priority bucket'}}</span>
            </div>
            <div class="panel-body">
              <app-logic-chart    *ngIf="activeTab()==='orient'"/>
              <app-priority-chart *ngIf="activeTab()!=='orient'" [kpis]="ds.kpis()"/>
            </div>
          </div>
          <div class="panel" style="margin:0;border:none;border-radius:0">
            <div class="panel-head">
              <h3>{{activeTab()==='act' ? 'Act · Startup Queue + Sequencing' : 'Act · Candidate Queue'}}</h3>
              <span class="pmeta">{{filtered().length}} wells · click to select</span>
            </div>
            <div class="panel-body">
              <app-well-table
                [wells]="filtered()"
                [selectedWell]="selectedWell()"
                (wellClick)="selectedWell.set($event)"/>
            </div>
          </div>
        </div>

        <!-- ACT tab only: embedded sequencing strip ─────────── -->
        <div class="seq-embed" *ngIf="activeTab()==='act'">
          <app-well-sequencing [wells]="filtered()"/>
        </div>

      </section>

      <aside class="right">
        <app-well-detail [well]="selectedWellObj()" [workovers]="selectedWOs()"/>
      </aside>
    </div>
  </div>

  <ng-template #loading>
    <div class="loading-state" style="height:100vh" *ngIf="!showSplash()">
      <div class="spin"></div>Loading well data…
    </div>
  </ng-template>
  `,
  styles: [`
    .app { display:grid; grid-template-rows:56px 44px 1fr; height:100vh; }
    .seq-full { grid-row:3; overflow:hidden; }

    /* ── topbar ── */
    .topbar { display:flex; align-items:center; gap:18px; padding:0 20px;
      background:linear-gradient(180deg,#251d14,var(--bg-1));
      border-bottom:1px solid var(--border-1); box-shadow:var(--shadow); }
    .brand { display:flex; align-items:center; gap:12px; }
    .logo-icon { flex-shrink:0; }
    .brand-text { display:flex; align-items:center; gap:6px; }
    .brand-main { font-weight:700; letter-spacing:.2em; text-transform:uppercase;
      font-size:13px; color:var(--beige-50); }
    .brand-sep { color:var(--beige-400); }
    .brand-sub { font-size:13px; color:var(--beige-200); letter-spacing:.12em; }
    .brand-pill { font-size:10px; letter-spacing:.16em; padding:3px 8px;
      border:1px solid var(--border-2); border-radius:2px; color:var(--orange-400); }
    .topbar-meta { margin-left:auto; display:flex; gap:22px;
      font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--beige-300); }
    .topbar-meta b { color:var(--orange-400); font-weight:600; }

    /* ── tab nav ── */
    .tab-nav { display:flex; background:var(--bg-1); border-bottom:1px solid var(--border-1);
      padding:0 20px; align-items:stretch; }
    .tab-btn { display:flex; align-items:center; gap:8px; padding:0 20px;
      font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--beige-400);
      border-right:1px solid var(--border-1); position:relative; transition:color .18s,background .18s;
      border-bottom:none; cursor:pointer; }
    .tab-btn:hover { color:var(--beige-100); background:var(--bg-2); }
    .tab-btn.active { color:var(--orange-400); background:linear-gradient(180deg,transparent,#ff7a1a14); }
    .tab-btn.active::after { content:""; position:absolute; left:0; right:0; bottom:0;
      height:2px; background:var(--orange-500); }
    .tab-num { width:20px; height:20px; border-radius:50%; display:inline-flex;
      align-items:center; justify-content:center; border:1px solid var(--border-2);
      color:var(--beige-300); font-size:11px; font-weight:700; }
    .tab-btn.active .tab-num { border-color:var(--orange-500); color:var(--orange-400);
      background:#ff7a1a18; }
    .tab-sub { opacity:.6; font-size:10px; letter-spacing:.06em; text-transform:none; }

    /* ── OBSERVE layout (map + history only) ── */
    .observe-layout { grid-row:3; display:grid; grid-template-columns:1fr 380px;
      overflow:hidden; height:100%; background:var(--bg-0); }
    .observe-map-panel { margin:10px; display:flex; flex-direction:column; overflow:hidden;
      background:var(--bg-1); border:1px solid var(--border-1); border-radius:2px; }
    .observe-right { background:var(--bg-1); border-left:1px solid var(--border-1); overflow-y:auto; }

    /* ── main 3-col ── */
    .main { display:grid; grid-template-columns:240px 1fr 380px;
      overflow:hidden; height:100%; }
    .left  { background:var(--bg-1); border-right:1px solid var(--border-1); overflow-y:auto; }
    .center{ overflow:hidden auto; display:flex; flex-direction:column; background:var(--bg-0); }
    .right { background:var(--bg-1); border-left:1px solid var(--border-1); overflow-y:auto; }

    /* ── sidebar ── */
    .sidebar-section { padding:14px 14px 8px; border-bottom:1px solid var(--border-1); }
    .sidebar-title { font-size:10px; letter-spacing:.22em; text-transform:uppercase;
      color:var(--beige-400); margin-bottom:10px; }
    .sidebar-section input, .sidebar-section select { width:100%; }
    .filter-row { display:flex; flex-direction:column; gap:4px; margin-bottom:10px; }
    .filter-row label { font-size:10px; letter-spacing:.12em; text-transform:uppercase;
      color:var(--beige-300); }
    .priority-list { display:flex; flex-direction:column; gap:4px; }
    .priority-item { display:grid; grid-template-columns:12px 1fr auto; gap:8px;
      align-items:center; padding:7px 10px; background:var(--bg-2);
      border:1px solid var(--border-1); cursor:pointer; border-radius:2px; transition:.15s; }
    .priority-item:hover { border-color:var(--orange-600); background:var(--bg-3); }
    .priority-item.active { border-color:var(--orange-500); background:#ff7a1a14; }
    .swatch { width:12px; height:12px; border-radius:2px; }
    .plabel { font-size:11px; color:var(--beige-100); }
    .plabel small { display:block; color:var(--beige-400); font-size:9px; }
    .pcount { font-family:"JetBrains Mono",monospace; color:var(--orange-300);
      font-size:12px; font-weight:600; }

    /* ── Production-profile section subtitle ── */
    .psub { font-size:9px; color:var(--beige-500); margin-top:-4px;
      margin-bottom:10px; letter-spacing:.04em; }

    /* ── KPI strip ── */
    .kpi-strip { display:grid; grid-template-columns:repeat(5,1fr); gap:1px;
      background:var(--border-1); border-bottom:1px solid var(--border-1); flex-shrink:0; }
    .kpi { background:var(--bg-1); padding:10px 14px; }
    .kk { font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--beige-400); }
    .kv { font-family:"JetBrains Mono",monospace; font-size:20px; font-weight:600;
      color:var(--beige-100); margin-top:2px; }
    .kv.accent { color:var(--orange-400); }
    .ks { font-size:10px; color:var(--beige-300); margin-top:1px; }

    /* ── panel ── */
    .panel { background:var(--bg-1); border:1px solid var(--border-1);
      border-radius:2px; margin:10px; display:flex; flex-direction:column; overflow:hidden; }
    .map-panel { margin-bottom:0; flex:1 1 380px; min-height:340px; }
    .observe-map-panel .panel-body { flex:1; }
    .panel-head { display:flex; align-items:center; justify-content:space-between;
      padding:9px 14px; border-bottom:1px solid var(--border-1);
      background:linear-gradient(180deg,#2b231a,var(--bg-1)); flex-shrink:0; }
    .panel-head h3 { margin:0; font-size:11px; letter-spacing:.22em; text-transform:uppercase;
      color:var(--beige-200); font-weight:600; }
    .pmeta { font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--beige-400); }
    .panel-body { flex:1; min-height:0; position:relative; overflow:hidden; }

    /* ── bottom strip ── */
    .bottom-strip { display:grid; grid-template-columns:2fr 1.4fr; gap:1px;
      background:var(--border-1); border-top:1px solid var(--border-1);
      height:240px; flex-shrink:0; }

    /* ── ACT-tab embedded sequencing ── */
    .seq-embed { flex-shrink:0; border-top:1px solid var(--border-1); min-height:520px;
      background:var(--bg-0); }
    .seq-embed app-well-sequencing { display:block; height:100%; }

    /* ────────────────────────────────────────────────────
       TAB SWITCH LOADER (2 second OODA-radar graphic)
       ──────────────────────────────────────────────────── */
    .tab-loader { grid-row:3; position:relative; overflow:hidden;
      background:radial-gradient(circle at 50% 50%, #221b13 0%, #14110d 70%); }
    .tl-grid { position:absolute; inset:0; opacity:.35;
      background-image:
        linear-gradient(rgba(255,122,26,.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,122,26,.08) 1px, transparent 1px);
      background-size:36px 36px; }
    .tl-scan { position:absolute; left:0; right:0; height:2px;
      background:linear-gradient(90deg, transparent, #ff7a1a99, transparent);
      animation: tl-scan 1.5s linear forwards; box-shadow:0 0 12px #ff7a1a66; }
    @keyframes tl-scan {
      0%   { top:0%;   opacity:.0; }
      10%  { opacity:1; }
      90%  { opacity:1; }
      100% { top:100%; opacity:0; }
    }
    .tl-content { position:absolute; inset:0; display:flex;
      align-items:center; justify-content:center; gap:36px; }

    /* Radar */
    .tl-radar { position:relative; width:140px; height:140px; flex-shrink:0; }
    .tl-radar .tl-sweep {
      position:absolute; inset:0; border-radius:50%;
      background: conic-gradient(from 0deg,
        rgba(255,122,26,0) 0deg,
        rgba(255,122,26,0) 270deg,
        rgba(255,184,61,0.55) 350deg,
        rgba(255,184,61,0) 360deg);
      animation: tl-spin 1s linear infinite;
      filter:drop-shadow(0 0 6px #ff7a1aaa);
    }
    @keyframes tl-spin { to { transform:rotate(360deg); } }
    .tl-radar .tl-ring {
      position:absolute; border:1px solid #ff7a1a55; border-radius:50%;
    }
    .tl-radar .tl-ring.r1 { inset:6px;  }
    .tl-radar .tl-ring.r2 { inset:30px; }
    .tl-radar .tl-ring.r3 { inset:54px; }
    .tl-radar .tl-cross {
      position:absolute; background:#ff7a1a44;
    }
    .tl-radar .tl-cross.h { left:0; right:0; top:50%; height:1px; }
    .tl-radar .tl-cross.v { top:0; bottom:0; left:50%; width:1px; }
    .tl-radar .tl-center {
      position:absolute; left:50%; top:50%;
      width:8px; height:8px; border-radius:50%;
      background:#ffb83d;
      transform:translate(-50%, -50%);
      box-shadow:0 0 12px #ffb83daa, 0 0 24px #ff7a1a66;
      animation: tl-pulse 0.9s ease-in-out infinite;
    }
    @keyframes tl-pulse {
      0%, 100% { transform:translate(-50%,-50%) scale(1);   opacity:1;   }
      50%      { transform:translate(-50%,-50%) scale(1.6); opacity:.5;  }
    }

    /* Meta block */
    .tl-meta { display:flex; flex-direction:column; min-width:260px; }
    .tl-meta .tl-label { font-family:'JetBrains Mono', monospace;
      font-size:9.5px; letter-spacing:.42em; color:var(--beige-400); }
    .tl-meta .tl-tab { font-size:26px; font-weight:700; letter-spacing:.18em;
      color:var(--orange-400); margin-top:6px; text-transform:uppercase;
      font-family:'JetBrains Mono', monospace; line-height:1; }
    .tl-meta .tl-tag { font-size:10px; color:var(--beige-300); margin-top:6px;
      letter-spacing:.06em; }
    .tl-meta .tl-bar {
      width:260px; height:3px; background:var(--bg-2); margin-top:18px; overflow:hidden;
      border:1px solid var(--border-1); border-radius:1px;
    }
    .tl-meta .tl-fill {
      height:100%; width:0%;
      background:linear-gradient(90deg, #ff7a1a, #ffb83d, #ff7a1a);
      animation: tl-fill 1.5s ease-out forwards;
      box-shadow:0 0 8px #ff7a1a99;
    }
    @keyframes tl-fill { to { width:100%; } }
  `]
})
export class AppComponent implements OnInit {
  ds = inject(DataService);

  showSplash    = signal(true);
  activeTab     = signal<Tab>('observe');
  tabLoading    = signal(false);
  selectedWell  = signal('');
  priorityFilter  = signal('');
  facilityFilter  = signal('');
  reservoirFilter = signal('');
  fieldFilter     = signal('');
  searchFilter    = signal('');

  colors = PRIORITY_COLORS;
  priorityKeys: string[] = ['P1','P2','P3'];
  priorityDesc: Record<string,string> = PRIORITY_DESC;

  tabs = [
    { id: 'observe'   as Tab, num:'1', label:'Observe',       sub:'· Location & History' },
    { id: 'orient'    as Tab, num:'2', label:'Orient',        sub:'· Cause & Severity' },
    { id: 'decide'    as Tab, num:'3', label:'Decide',        sub:'· Priority & Plan' },
    { id: 'act'       as Tab, num:'4', label:'Act',           sub:'· Queue & Sequencing' },
    { id: 'performance' as Tab, num:'5', label:'Well Performance', sub:'· Test History Charts' },
    { id: 'recommend' as Tab, num:'6', label:'Recommendation',sub:'· Intervention Guide' },
  ];

  isThreeCol = computed(() =>
    (['orient','decide','act'] as Tab[]).includes(this.activeTab()));

  get dFacilities() { return [...new Set(this.ds.wells().map(w=>w.facility).filter(Boolean))].sort(); }
  get dReservoirs() { return [...new Set(this.ds.wells().map(w=>w.reservoir).filter(Boolean))].sort(); }
  get dFields()     { return [...new Set(this.ds.wells().map(w=>w.field).filter(Boolean))].sort(); }

  priorityCount(p: string): number {
    return this.ds.wells().filter(w => w.priority === p).length;
  }
  topBucketPotential(): number {
    return this.ds.wells()
      .filter(w => w.priority === 'P1')
      .reduce((s, w) => s + (w.potential_oil || 0), 0);
  }

  filtered = computed(() => {
    const p=this.priorityFilter(), f=this.facilityFilter(),
          r=this.reservoirFilter(), fl=this.fieldFilter(), s=this.searchFilter().toLowerCase();
    return this.ds.wells()
      .filter(w =>
        (!p  || w.priority===p) &&
        (!f  || w.facility===f) &&
        (!r  || w.reservoir===r) &&
        (!fl || w.field===fl) &&
        (!s  || w.well_name.toLowerCase().includes(s))
      )
      .sort((a,b) =>
        a.priority.localeCompare(b.priority)
        || (b.recent_highest_oil || b.potential_oil || 0) - (a.recent_highest_oil || a.potential_oil || 0));
  });

  selectedWellObj = computed(() =>
    this.ds.wells().find(w => w.well_name === this.selectedWell()) ?? null);

  selectedWOs = computed(() =>
    (this.ds.woMap()[this.selectedWell()] ?? [])
      .slice().sort((a,b)=>(b.start_date||'').localeCompare(a.start_date||'')));

  tabLabel = computed(() => {
    const t = this.tabs.find(x=>x.id===this.activeTab());
    return t ? t.label : '';
  });

  tabSub = computed(() => {
    const t = this.tabs.find(x=>x.id===this.activeTab());
    return t ? t.sub.replace(/^·\s*/, '') : '';
  });

  onTabClick(id: Tab) {
    if (id === this.activeTab()) return;
    this.activeTab.set(id);
    this.tabLoading.set(true);
    setTimeout(() => this.tabLoading.set(false), 1500);
  }

  ngOnInit() { this.ds.load(); }
}
