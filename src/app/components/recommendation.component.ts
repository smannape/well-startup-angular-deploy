import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Well, Workover, PRIORITY_COLORS } from '../models/well.model';

type Urgency = 'critical' | 'high' | 'medium' | 'low';

interface Rec {
  wellName: string;
  priority: string;
  facility: string;
  field: string;
  urgency: Urgency;
  category: string;
  categoryIcon: string;
  title: string;
  detail: string;
  basedOn: string;
}

const URGENCY_ORDER: Record<Urgency, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const URGENCY_COLOR: Record<Urgency, string> = {
  critical: '#ef5a3a', high: '#ffb83d', medium: '#6dd47e', low: '#5a8aaa'
};
const URGENCY_BG: Record<Urgency, string> = {
  critical: '#2a0a0545', high: '#281e0045', medium: '#0f2a1045', low: '#0a1a2a45'
};

@Component({
  selector: 'app-recommendation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rec-root">

      <!-- ── Header ── -->
      <div class="rec-header">
        <div class="rec-title-area">
          <div class="rec-title">Well Intervention Recommendations</div>
          <div class="rec-sub">
            Derived from WO history patterns · API gravity · ESP run life · Water cut · Closure reason
          </div>
        </div>
        <div class="rec-filters">
          <select [(ngModel)]="urgencyFilter" (ngModelChange)="applyFilter()">
            <option value="">All Urgency</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select [(ngModel)]="categoryFilter" (ngModelChange)="applyFilter()">
            <option value="">All Categories</option>
            <option *ngFor="let c of categories" [value]="c">{{c}}</option>
          </select>
          <select [(ngModel)]="gcFilter" (ngModelChange)="applyFilter()">
            <option value="">All GCs</option>
            <option *ngFor="let f of facilities" [value]="f">{{f}}</option>
          </select>
          <select [(ngModel)]="priFilter" (ngModelChange)="applyFilter()">
            <option value="">All Priorities</option>
            <option *ngFor="let p of priorities" [value]="p">{{p}}</option>
          </select>
          <input placeholder="Search well…" [(ngModel)]="search" (ngModelChange)="applyFilter()"
            style="min-width:140px"/>
        </div>
      </div>

      <!-- ── Summary strip ── -->
      <div class="summary-strip">
        <div class="sum-kpi" *ngFor="let u of urgencies">
          <span class="sum-v" [style.color]="urgencyColor[u]">{{countBy(u)}}</span>
          <span class="sum-l" [style.color]="urgencyColor[u]">{{u | uppercase}}</span>
        </div>
        <div class="sum-kpi">
          <span class="sum-v" style="color:var(--orange-400)">{{filtered.length}}</span>
          <span class="sum-l" style="color:var(--beige-400)">SHOWN</span>
        </div>
        <div class="sum-kpi">
          <span class="sum-v" style="color:var(--beige-200)">{{uniqueWells}}</span>
          <span class="sum-l" style="color:var(--beige-400)">WELLS</span>
        </div>
      </div>

      <!-- ── Recommendation cards ── -->
      <div class="rec-list">

        <div class="rec-card" *ngFor="let r of filtered"
          [style.border-left-color]="urgencyColor[r.urgency]"
          [style.background]="urgencyBg[r.urgency]">

          <!-- Card header row -->
          <div class="rc-head">
            <div class="rc-well-info">
              <span class="rc-dot" [style.background]="colors[r.priority]"></span>
              <span class="rc-name">{{r.wellName}}</span>
              <span class="rc-badge pri-badge" [style.background]="colors[r.priority]">{{r.priority}}</span>
              <span class="rc-badge gc-badge">{{r.facility}}</span>
              <span class="rc-badge field-badge">{{r.field}}</span>
            </div>
            <div class="rc-badges-right">
              <span class="rc-badge urgency-badge"
                [style.background]="urgencyBg[r.urgency]"
                [style.color]="urgencyColor[r.urgency]"
                [style.border-color]="urgencyColor[r.urgency]">
                {{r.urgency | uppercase}}
              </span>
              <span class="rc-badge cat-badge">
                {{r.categoryIcon}} {{r.category}}
              </span>
            </div>
          </div>

          <!-- Title + detail -->
          <div class="rc-title">{{r.title}}</div>
          <div class="rc-detail">{{r.detail}}</div>

          <!-- Footer -->
          <div class="rc-footer">
            <span class="rc-source">📌 Based on: {{r.basedOn}}</span>
          </div>

        </div>

        <div class="no-results" *ngIf="!filtered.length">
          No recommendations match the current filters.
        </div>

      </div>
    </div>
  `,
  styles: [`
    .rec-root { display:flex; flex-direction:column; height:100%; overflow:hidden; }

    /* ── Header ── */
    .rec-header { flex-shrink:0; display:flex; align-items:flex-start; gap:20px; flex-wrap:wrap;
      padding:10px 16px 8px; border-bottom:1px solid var(--border-1); background:var(--bg-1); }
    .rec-title-area { flex:1; }
    .rec-title { font-size:13px; font-weight:700; letter-spacing:.16em;
      text-transform:uppercase; color:var(--orange-400); }
    .rec-sub { font-size:10px; color:var(--beige-400); margin-top:2px; letter-spacing:.04em; }
    .rec-filters { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    .rec-filters select { min-width:130px; }

    /* ── Summary strip ── */
    .summary-strip { flex-shrink:0; display:flex; gap:0;
      background:var(--bg-2); border-bottom:1px solid var(--border-1); }
    .sum-kpi { flex:0 0 auto; padding:8px 20px; border-right:1px solid var(--border-1);
      display:flex; flex-direction:column; gap:2px; align-items:center; }
    .sum-v { font-family:"JetBrains Mono",monospace; font-size:20px; font-weight:700; line-height:1; }
    .sum-l { font-size:8px; letter-spacing:.18em; text-transform:uppercase; margin-top:1px; }

    /* ── Card list ── */
    .rec-list { flex:1; overflow-y:auto; padding:12px 16px; display:flex;
      flex-direction:column; gap:8px; }

    .rec-card { border-left:3px solid; border-radius:3px;
      padding:10px 14px; display:flex; flex-direction:column; gap:5px;
      border-top:1px solid var(--border-1); border-right:1px solid var(--border-1);
      border-bottom:1px solid var(--border-1); }

    /* ── Card header ── */
    .rc-head { display:flex; align-items:center; justify-content:space-between;
      flex-wrap:wrap; gap:6px; }
    .rc-well-info { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
    .rc-dot  { width:8px; height:8px; border-radius:2px; flex-shrink:0; }
    .rc-name { font-family:"JetBrains Mono",monospace; font-size:13px; font-weight:700;
      color:var(--orange-300); letter-spacing:.05em; }
    .rc-badges-right { display:flex; gap:5px; align-items:center; flex-wrap:wrap; }

    .rc-badge { font-size:9px; letter-spacing:.12em; text-transform:uppercase;
      padding:2px 7px; border-radius:2px; font-weight:600; border:1px solid transparent; }
    .pri-badge   { color:#1a1612; }
    .gc-badge    { color:var(--beige-200); background:var(--bg-3); border-color:var(--border-2); }
    .field-badge { color:var(--orange-300); background:var(--bg-3); border-color:var(--orange-700); }
    .urgency-badge { font-weight:700; }
    .cat-badge   { color:var(--beige-200); background:var(--bg-3); border-color:var(--border-2); }

    .rc-title  { font-size:12px; font-weight:700; color:var(--beige-100);
      letter-spacing:.04em; }
    .rc-detail { font-size:11px; color:var(--beige-300); line-height:1.65; }
    .rc-footer { padding-top:4px; border-top:1px solid var(--border-1); }
    .rc-source { font-size:9.5px; color:var(--beige-500); letter-spacing:.06em; }

    .no-results { padding:40px; text-align:center;
      color:var(--beige-500); font-size:12px; letter-spacing:.14em; text-transform:uppercase; }
  `]
})
export class RecommendationComponent implements OnChanges {
  @Input() wells: Well[] = [];
  @Input() woMap: Record<string, Workover[]> = {};

  colors       = PRIORITY_COLORS;
  urgencyColor = URGENCY_COLOR;
  urgencyBg    = URGENCY_BG;

  urgencies  = ['critical','high','medium','low'] as Urgency[];
  priorities = ['P1','P2','P3','P4','P5'];
  facilities: string[] = [];
  categories: string[] = [];

  urgencyFilter  = '';
  categoryFilter = '';
  gcFilter       = '';
  priFilter      = '';
  search         = '';

  allRecs:  Rec[] = [];
  filtered: Rec[] = [];

  get uniqueWells() {
    return new Set(this.filtered.map(r => r.wellName)).size;
  }
  countBy(u: Urgency) { return this.filtered.filter(r => r.urgency === u).length; }

  ngOnChanges() {
    this.facilities = [...new Set(this.wells.map(w => w.facility).filter(Boolean))].sort();
    this.allRecs    = this.buildAllRecs();
    this.categories = [...new Set(this.allRecs.map(r => r.category))].sort();
    this.applyFilter();
  }

  private daysSince(dateStr: string): number {
    if (!dateStr) return 9999;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 9999;
    return Math.floor((new Date('2026-04-30').getTime() - d.getTime()) / 86_400_000);
  }

  private buildAllRecs(): Rec[] {
    const recs: Rec[] = [];

    for (const w of this.wells) {
      const wos  = (this.woMap[w.well_name] || [])
        .slice().sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''));
      const base = { wellName: w.well_name, priority: w.priority,
                     facility: w.facility, field: w.field };

      /* ── 1. Closure reason ─────────────────────────────── */
      if (w.reason_label === 'ESP Failure') {
        recs.push({ ...base, urgency: 'critical', category: 'ESP', categoryIcon: '⚡',
          title: 'ESP Failure — Pre-Startup Checks Required',
          detail: `Well is closed due to ESP failure. Before restart: ` +
            `(1) Motor insulation resistance test (>50 MΩ), ` +
            `(2) Cable continuity & megger test, ` +
            `(3) Confirm replacement ESP is installed and function-tested. ` +
            `Do not energise without HAL sign-off on all three checks.`,
          basedOn: 'Closure Reason' });
      }

      if (w.reason_label === 'Workover Required') {
        recs.push({ ...base, urgency: 'high', category: 'Workover', categoryIcon: '🔧',
          title: 'Pending Workover — Do Not Start Without WO Completion',
          detail: `Well is flagged for workover. ` +
            `Define WO scope (rigless vs rig), obtain engineering approval, ` +
            `and complete the workover before any startup attempt. ` +
            `Action status: ${w.closed_action_status || 'Not set'}.`,
          basedOn: 'Closure Reason' });
      }

      if (w.reason_label === 'GC Capacity') {
        recs.push({ ...base, urgency: 'low', category: 'Operations', categoryIcon: '🏭',
          title: 'GC Capacity Restart — Confirm Throughput Availability',
          detail: `Well was shut in due to ${w.facility} gathering capacity constraint only — ` +
            `no downhole issue. Before restart, confirm ${w.facility} has available ` +
            `liquid and oil handling quota. No surface or downhole intervention required. ` +
            `Coordinate with GC operations team for production slot.`,
          basedOn: 'Closure Reason' });
      }

      /* ── 2. ESP run life ────────────────────────────────── */
      if (w.esp_run_life > 900) {
        recs.push({ ...base, urgency: 'critical', category: 'ESP', categoryIcon: '⚡',
          title: `ESP Run Life Critical — ${w.esp_run_life} Days`,
          detail: `ESP has been running ${w.esp_run_life} days, well beyond the KOC ` +
            `P90 failure threshold (~730 days). Pre-emptive changeout is strongly recommended ` +
            `before startup to avoid in-service failure at peak production rate. ` +
            `Contact HAL for pump sizing review using current PGOR data.`,
          basedOn: 'Equipment Data' });
      } else if (w.esp_run_life > 650) {
        recs.push({ ...base, urgency: 'high', category: 'ESP', categoryIcon: '⚡',
          title: `Long ESP Run Life — ${w.esp_run_life} Days`,
          detail: `ESP run life is ${w.esp_run_life} days (approaching P90 failure window). ` +
            `Plan a changeout within the next 3–6 months. ` +
            `Monitor motor temperature and vibration closely post-startup. ` +
            `Ensure a pump unit is on standby in HAL yard.`,
          basedOn: 'Equipment Data' });
      } else if (w.esp_run_life > 450 && w.esp_run_life <= 650) {
        recs.push({ ...base, urgency: 'medium', category: 'ESP', categoryIcon: '⚡',
          title: `Monitor ESP Run Life — ${w.esp_run_life} Days`,
          detail: `ESP run life is ${w.esp_run_life} days. ` +
            `Within acceptable operating range but schedule for regular vibration ` +
            `and current monitoring. Flag for changeout planning in 6–12 months.`,
          basedOn: 'Equipment Data' });
      }

      /* ── 3. API gravity ─────────────────────────────────── */
      if (w.api_gravity > 0) {
        if (w.api_gravity < 22) {
          recs.push({ ...base, urgency: 'high', category: 'Chemical', categoryIcon: '🧪',
            title: `Heavy Oil (${w.api_gravity}° API) — Wax & Viscosity Risk`,
            detail: `API gravity of ${w.api_gravity}° indicates heavy crude with elevated pour ` +
              `point and wax deposition risk. Recommend: ` +
              `(1) Inject paraffin inhibitor downhole before startup, ` +
              `(2) Verify flowline heat trace / insulation integrity, ` +
              `(3) Increase ESP frequency gradually — avoid cold-start at low speed. ` +
              `Consider downhole chemical injection mandrel installation.`,
            basedOn: 'API Gravity' });
        } else if (w.api_gravity < 27) {
          recs.push({ ...base, urgency: 'medium', category: 'Chemical', categoryIcon: '🧪',
            title: `Medium-Heavy Oil (${w.api_gravity}° API) — Monitor Viscosity`,
            detail: `API gravity of ${w.api_gravity}° is medium-heavy. Monitor flowline ` +
              `pressure (FLP) post-startup for signs of wax build-up. ` +
              `If FLP rises >20 psi above baseline within 72 hrs, initiate ` +
              `paraffin inhibitor batch treatment. Check separator performance.`,
            basedOn: 'API Gravity' });
        } else if (w.api_gravity > 38) {
          recs.push({ ...base, urgency: 'medium', category: 'Gas Handling', categoryIcon: '💨',
            title: `Light Oil (${w.api_gravity}° API) — Verify Gas Handling`,
            detail: `API gravity of ${w.api_gravity}° indicates light crude with potentially ` +
              `high GOR. Verify ${w.facility} separator capacity for additional gas load. ` +
              `Check ESP gas handler stage performance at expected production rate. ` +
              `Monitor pump intake pressure (PIP) for gas interference signatures.`,
            basedOn: 'API Gravity' });
        }
      }

      /* ── 4. Water cut ───────────────────────────────────── */
      if (w.latest_wc > 85) {
        recs.push({ ...base, urgency: 'high', category: 'Production', categoryIcon: '💧',
          title: `Very High Water Cut — ${w.latest_wc.toFixed(0)}% WC`,
          detail: `Water cut of ${w.latest_wc.toFixed(1)}% requires careful pump sizing. ` +
            `Verify ESP is rated for current liquid rate at actual WC. ` +
            `Confirm ${w.facility} water disposal/injection capacity is not at limit. ` +
            `Run pump performance curve check against allowable rate of ${w.allowable_rate.toFixed(0)} BLPD.`,
          basedOn: 'Production Data' });
      } else if (w.latest_wc > 65) {
        recs.push({ ...base, urgency: 'medium', category: 'Production', categoryIcon: '💧',
          title: `High Water Cut — ${w.latest_wc.toFixed(0)}% WC`,
          detail: `Water cut of ${w.latest_wc.toFixed(1)}% — verify pump operating point ` +
            `is on the correct portion of the pump curve for liquid rate ` +
            `${w.latest_liquid.toFixed(0)} BLPD. ` +
            `Monitor PDP and PIP ratio after startup for pump wear indicators.`,
          basedOn: 'Production Data' });
      }

      /* ── 5. WO history analysis ─────────────────────────── */
      if (w.wo_count >= 6) {
        const types = wos.map(wo => (wo.activity_type || '').toUpperCase());
        const rigCount     = types.filter(t => t.includes('WORKOVER')).length;
        const riglessCount = types.filter(t => t.includes('RIGLESS')).length;
        recs.push({ ...base, urgency: 'high', category: 'Workover', categoryIcon: '🔧',
          title: `High WO Frequency — ${w.wo_count} Workovers on Record`,
          detail: `${w.wo_count} workovers recorded (${rigCount} rig WOs, ${riglessCount} rigless). ` +
            `Recurring interventions suggest an underlying mechanical or reservoir issue. ` +
            `Conduct root-cause analysis before committing to startup. ` +
            `Review last WO report for unresolved findings.`,
          basedOn: 'WO History' });
      } else if (w.wo_count >= 3 && w.wo_count < 6) {
        recs.push({ ...base, urgency: 'medium', category: 'Workover', categoryIcon: '🔧',
          title: `Multiple WO History — ${w.wo_count} Interventions`,
          detail: `${w.wo_count} workover interventions on record. Review last WO report ` +
            `to ensure all identified issues were resolved. ` +
            `Flag well for enhanced monitoring during first 30 days of production.`,
          basedOn: 'WO History' });
      }

      /* ── 6. Sidetrack in WO history ─────────────────────── */
      const hasST = wos.some(wo =>
        (wo.activity_type || '').toUpperCase().includes('SIDETRACK') ||
        w.well_name.includes('ST'));
      if (hasST) {
        recs.push({ ...base, urgency: 'medium', category: 'Reservoir', categoryIcon: '📐',
          title: 'Sidetrack Well — Verify Current Completion Integrity',
          detail: `Well has sidetrack completion history. Before startup: ` +
            `(1) Confirm the active lateral and perforation interval in WELLVIEW, ` +
            `(2) Verify cement integrity of the original wellbore is not communicating, ` +
            `(3) Ensure tubing hanger and packer are holding — run pressure test if last ` +
            `sidetrack was >2 years ago.`,
          basedOn: 'WO History / Well Name' });
      }

      /* ── 7. Recent WO < 120 days ────────────────────────── */
      if (wos.length > 0) {
        const lastWO      = wos[0];
        const daysSinceWO = this.daysSince(lastWO.end_date || lastWO.start_date || '');
        if (daysSinceWO < 120 && daysSinceWO > 0) {
          recs.push({ ...base, urgency: 'medium', category: 'Verification', categoryIcon: '✅',
            title: `Recent WO — Verify Post-WO Performance Target`,
            detail: `Last workover (${lastWO.activity_type || 'WO'}) completed ` +
              `${daysSinceWO} days ago. Verify that post-WO production target was ` +
              `achieved and all punch list items were closed. ` +
              `Obtain HAL completion report sign-off before declaring well ready.`,
            basedOn: 'WO History' });
        }
      }

      /* ── 8. Stale PGOR (>180 days) ──────────────────────── */
      const pgorAge = this.daysSince(w.latest_pgor_date);
      if (pgorAge > 365) {
        recs.push({ ...base, urgency: 'medium', category: 'Production', categoryIcon: '📊',
          title: `Stale PGOR — ${pgorAge} Days Since Last Well Test`,
          detail: `Last PGOR test was ${w.latest_pgor_date || 'unknown'} (${pgorAge} days ago). ` +
            `Production forecast may be inaccurate. Schedule a well test within 14 days ` +
            `of startup to update the PGOR file and validate expected oil rate ` +
            `of ${w.expected_oil.toFixed(0)} BOPD.`,
          basedOn: 'Production Data' });
      } else if (pgorAge > 180 && pgorAge <= 365) {
        recs.push({ ...base, urgency: 'low', category: 'Production', categoryIcon: '📊',
          title: `PGOR Approaching Expiry — ${pgorAge} Days Old`,
          detail: `PGOR is ${pgorAge} days old. Schedule a fresh well test within ` +
            `30 days of startup to confirm well performance. Last recorded: ` +
            `${w.latest_oil.toFixed(0)} BOPD oil, ${w.latest_wc.toFixed(0)}% WC.`,
          basedOn: 'Production Data' });
      }

      /* ── 9. P5 Hold wells ────────────────────────────────── */
      if (w.priority === 'P5') {
        recs.push({ ...base, urgency: 'low', category: 'Reservoir', categoryIcon: '📋',
          title: 'P5 Well — RE Assessment Required Before Startup',
          detail: `Well is classified P5 (Hold/RE Assessment). Do not proceed with ` +
            `startup planning until Reservoir Engineering team completes economic ` +
            `and technical review. RE study should address: reservoir pressure support, ` +
            `abandonment risk, and incremental recovery justification.`,
          basedOn: 'Priority Score' });
      }

    }

    /* Sort: critical → high → medium → low, then by well name */
    return recs.sort((a, b) =>
      URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] ||
      a.wellName.localeCompare(b.wellName));
  }

  applyFilter() {
    let r = this.allRecs;
    if (this.urgencyFilter)  r = r.filter(x => x.urgency === this.urgencyFilter);
    if (this.categoryFilter) r = r.filter(x => x.category === this.categoryFilter);
    if (this.gcFilter)       r = r.filter(x => x.facility === this.gcFilter);
    if (this.priFilter)      r = r.filter(x => x.priority === this.priFilter);
    if (this.search)         r = r.filter(x =>
      x.wellName.toLowerCase().includes(this.search.toLowerCase()) ||
      x.title.toLowerCase().includes(this.search.toLowerCase()));
    this.filtered = r;
  }
}
