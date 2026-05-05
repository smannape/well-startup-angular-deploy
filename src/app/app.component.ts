import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from './services/data.service';
import { Well, PRIORITY_COLORS, PRIORITY_DESC } from './models/well.model';
import { WellMapComponent }         from './components/well-map.component';
import { PriorityChartComponent }   from './components/priority-chart.component';
import { LogicChartComponent }      from './components/logic-chart.component';
import { WellTableComponent }       from './components/well-table.component';
import { WellDetailComponent }      from './components/well-detail.component';
import { WellSequencingComponent }  from './components/well-sequencing.component';

type Tab = 'observe' | 'orient' | 'decide' | 'act' | 'sequence';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    WellMapComponent, PriorityChartComponent, LogicChartComponent,
    WellTableComponent, WellDetailComponent, WellSequencingComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="app" *ngIf="ds.loaded(); else loading">

    <!-- ── TOPBAR ──────────────────────────────────────────── -->
    <header class="topbar">
      <div class="brand">
        <svg class="logo-icon" width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="3" fill="#ff7a1a" opacity=".12"/>
          <!-- derrick frame -->
          <line x1="16" y1="3"  x2="5"  y2="28" stroke="#ff9849" stroke-width="1.5"/>
          <line x1="16" y1="3"  x2="27" y2="28" stroke="#ff9849" stroke-width="1.5"/>
          <line x1="8"  y1="20" x2="24" y2="20" stroke="#ff9849" stroke-width="1.2"/>
          <line x1="10" y1="14" x2="22" y2="14" stroke="#ff9849" stroke-width="1.2"/>
          <line x1="13" y1="8"  x2="19" y2="8"  stroke="#ff9849" stroke-width="1.2"/>
          <!-- base -->
          <line x1="4"  y1="28" x2="28" y2="28" stroke="#ff7a1a" stroke-width="2"/>
          <!-- crown dot -->
          <circle cx="16" cy="3" r="2" fill="#ffb83d"/>
        </svg>
        <div class="brand-text">
          <span class="brand-main">WELL STARTUP</span>
          <span class="brand-sep">/</span>
          <span class="brand-sub">DECISION CONSOLE</span>
        </div>
        <span class="brand-pill">HAL · ESP · WK</span>
      </div>
      <div class="topbar-meta" *ngIf="ds.kpis() as k">
        <span>Inventory <b>{{k.total_wells_inventory}}</b></span>
        <span>Closed <b>{{k.total_closed_wells}}</b></span>
        <span>Open <b>{{k.total_open_wells}}</b></span>
        <span>Recoverable <b>{{(k.potential_oil_total_bopd/1000).toFixed(0)}}k BOPD</b></span>
      </div>
    </header>

    <!-- ── TAB NAV ─────────────────────────────────────────── -->
    <nav class="tab-nav">
      <button *ngFor="let t of tabs" class="tab-btn"
        [class.active]="activeTab()===t.id"
        (click)="activeTab.set(t.id)">
        <span class="tab-num">{{t.num}}</span>
        <span class="tab-label">{{t.label}}</span>
        <span class="tab-sub">{{t.sub}}</span>
      </button>
    </nav>

    <!-- ── SEQUENCING TAB (full-width) ─────────────────────── -->
    <app-well-sequencing *ngIf="activeTab()==='sequence'"
      [wells]="ds.wells()" class="seq-full"/>

    <!-- ── MAIN 3-COL LAYOUT ───────────────────────────────── -->
    <div class="main" *ngIf="activeTab()!=='sequence'">

      <!-- LEFT: Filters + Priority -->
      <aside class="left">
        <div class="sidebar-section">
          <div class="sidebar-title">Search</div>
          <input placeholder="Well name…" [ngModel]="searchFilter()" (ngModelChange)="searchFilter.set($event)"/>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-title">Startup Priority</div>
          <div class="priority-list">
            <div class="priority-item" [class.active]="priorityFilter()===''">
              <span class="swatch" style="background:var(--beige-400)"></span>
              <span class="plabel">All <small>{{ds.kpis()?.total_closed_wells}}</small></span>
              <span class="pcount" (click)="priorityFilter.set('')">{{ds.wells().length}}</span>
            </div>
            <div class="priority-item" *ngFor="let p of ['P1','P2','P3','P4','P5']"
              [class.active]="priorityFilter()===p"
              (click)="priorityFilter.set(priorityFilter()===p?'':p)">
              <span class="swatch" [style.background]="colors[p]"></span>
              <span class="plabel">{{p}} <small>{{pDesc[p] | slice:0:22}}…</small></span>
              <span class="pcount">{{ds.kpis()?.by_priority?.[p]??0}}</span>
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
            <label>Team</label>
            <select [ngModel]="teamFilter()" (ngModelChange)="teamFilter.set($event)">
              <option value="">All Teams</option>
              <option *ngFor="let t of dTeams">{{t}}</option>
            </select>
          </div>
        </div>
      </aside>

      <!-- CENTER -->
      <section class="center">
        <!-- KPI strip -->
        <div class="kpi-strip" *ngIf="ds.kpis() as k">
          <div class="kpi">
            <div class="kk">P1 Quick-Win Wells</div>
            <div class="kv accent">{{k.by_priority?.['P1']??0}}</div>
            <div class="ks">{{(k.potential_by_priority?.['P1']??0)|number:'1.0-0'}} BOPD recoverable</div>
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
            <div class="ks">BOPD potential across all P</div>
          </div>
          <div class="kpi">
            <div class="kk">Filtered Wells</div>
            <div class="kv">{{filtered().length}}</div>
            <div class="ks">matching current selection</div>
          </div>
        </div>

        <!-- Map panel -->
        <div class="panel map-panel">
          <div class="panel-head">
            <h3>{{tabLabel()}} · Field Map — West Kuwait</h3>
            <span class="pmeta">{{filtered().length}} wells · dot size = potential · color = priority</span>
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
              <h3>Act · Candidate Queue</h3>
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
      </section>

      <!-- RIGHT: Well Detail -->
      <aside class="right">
        <app-well-detail [well]="selectedWellObj()" [workovers]="selectedWOs()"/>
      </aside>
    </div>
  </div>

  <ng-template #loading>
    <div class="loading-state" style="height:100vh">
      <div class="spin"></div>Loading well data…
    </div>
  </ng-template>
  `,
  styles: [`
    /* ── root layout ── */
    .app { display:grid; grid-template-rows:56px 44px 1fr; height:100vh; }
    .seq-full { grid-row:3; overflow:hidden; }

    /* ── topbar ── */
    .topbar {
      display:flex; align-items:center; gap:18px; padding:0 20px;
      background:linear-gradient(180deg,#251d14,var(--bg-1));
      border-bottom:1px solid var(--border-1); box-shadow:var(--shadow);
    }
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

    /* ── main 3-col ── */
    .main { display:grid; grid-template-columns:240px 1fr 380px;
      overflow:hidden; height:100%; }
    .left  { background:var(--bg-1); border-right:1px solid var(--border-1); overflow-y:auto; }
    .center{ overflow:hidden; display:grid; grid-template-rows:auto 1fr auto; background:var(--bg-0); }
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

    /* ── KPI strip ── */
    .kpi-strip { display:grid; grid-template-columns:repeat(5,1fr); gap:1px;
      background:var(--border-1); border-bottom:1px solid var(--border-1); }
    .kpi { background:var(--bg-1); padding:10px 14px; }
    .kk { font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--beige-400); }
    .kv { font-family:"JetBrains Mono",monospace; font-size:20px; font-weight:600;
      color:var(--beige-100); margin-top:2px; }
    .kv.accent { color:var(--orange-400); }
    .ks { font-size:10px; color:var(--beige-300); margin-top:1px; }

    /* ── panel ── */
    .panel { background:var(--bg-1); border:1px solid var(--border-1);
      border-radius:2px; margin:10px; display:flex; flex-direction:column; overflow:hidden; }
    .map-panel { margin-bottom:0; flex:1; }
    .panel-head { display:flex; align-items:center; justify-content:space-between;
      padding:9px 14px; border-bottom:1px solid var(--border-1);
      background:linear-gradient(180deg,#2b231a,var(--bg-1)); flex-shrink:0; }
    .panel-head h3 { margin:0; font-size:11px; letter-spacing:.22em; text-transform:uppercase;
      color:var(--beige-200); font-weight:600; }
    .pmeta { font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--beige-400); }
    .panel-body { flex:1; min-height:0; position:relative; overflow:hidden; }

    /* ── bottom strip ── */
    .bottom-strip { display:grid; grid-template-columns:2fr 1.4fr; gap:1px;
      background:var(--border-1); border-top:1px solid var(--border-1); height:240px; }
  `]
})
export class AppComponent implements OnInit {
  ds = inject(DataService);

  activeTab    = signal<Tab>('decide');
  selectedWell = signal('');
  priorityFilter  = signal('');
  facilityFilter  = signal('');
  reservoirFilter = signal('');
  teamFilter      = signal('');
  searchFilter    = signal('');

  colors = PRIORITY_COLORS;
  pDesc  = PRIORITY_DESC;

  tabs = [
    { id: 'observe'  as Tab, num:'1', label:'Observe',   sub:'· Inventory & Signals' },
    { id: 'orient'   as Tab, num:'2', label:'Orient',    sub:'· Cause & Severity' },
    { id: 'decide'   as Tab, num:'3', label:'Decide',    sub:'· Priority & Plan' },
    { id: 'act'      as Tab, num:'4', label:'Act',       sub:'· Startup Queue' },
    { id: 'sequence' as Tab, num:'5', label:'Sequencing',sub:'· Launch Order' },
  ];

  get dFacilities() { return [...new Set(this.ds.wells().map(w=>w.facility))].sort(); }
  get dReservoirs()  { return [...new Set(this.ds.wells().map(w=>w.reservoir))].sort(); }
  get dTeams()       { return [...new Set(this.ds.wells().map(w=>w.team))].sort(); }

  filtered = computed(() => {
    const p=this.priorityFilter(), f=this.facilityFilter(),
          r=this.reservoirFilter(), t=this.teamFilter(), s=this.searchFilter().toLowerCase();
    return this.ds.wells()
      .filter(w =>
        (!p || w.priority===p) &&
        (!f || w.facility===f) &&
        (!r || w.reservoir===r) &&
        (!t || w.team===t) &&
        (!s || w.well_name.toLowerCase().includes(s))
      )
      .sort((a,b) => a.priority.localeCompare(b.priority) || (b.startup_score||0)-(a.startup_score||0));
  });

  selectedWellObj = computed(() =>
    this.ds.wells().find(w => w.well_name === this.selectedWell()) ?? null
  );

  selectedWOs = computed(() =>
    (this.ds.woMap()[this.selectedWell()] ?? [])
      .slice().sort((a,b)=>(b.start_date||'').localeCompare(a.start_date||''))
  );

  tabLabel = computed(() => {
    const t = this.tabs.find(x=>x.id===this.activeTab());
    return t ? t.label : '';
  });

  ngOnInit() { this.ds.load(); }
}
