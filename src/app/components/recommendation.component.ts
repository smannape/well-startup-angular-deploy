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
  isReview?: boolean;   // flags cards sourced from KOC well review sheet
}

const URGENCY_ORDER: Record<Urgency, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const URGENCY_COLOR: Record<Urgency, string> = {
  critical: '#ef5a3a', high: '#ffb83d', medium: '#6dd47e', low: '#5a8aaa'
};
const URGENCY_BG: Record<Urgency, string> = {
  critical: '#2a0a0545', high: '#281e0045', medium: '#0f2a1045', low: '#0a1a2a45'
};

/* Map well_category from KOC review → urgency level */
function categoryUrgency(cat: string | null | undefined): Urgency {
  if (!cat) return 'low';
  const c = cat.toLowerCase();
  if (c.includes('grounded') || c.includes('problematic')) return 'high';
  if (c.includes('high viscous') || c.includes('low pi') ||
      c.includes('sensor') || c.includes('insulation') || c.includes('new commission')) return 'medium';
  return 'low';
}

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
            KOC Well Review · WO history · H₂S concentration · API gravity · ESP run life · Water cut · Closure reason
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
          <select [(ngModel)]="sourceFilter" (ngModelChange)="applyFilter()">
            <option value="">All Sources</option>
            <option value="review">KOC Review Only</option>
            <option value="engine">Rules Engine Only</option>
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
        <div class="sum-kpi">
          <span class="sum-v" style="color:#6dd47e">{{reviewCount}}</span>
          <span class="sum-l" style="color:var(--beige-400)">KOC REVIEW</span>
        </div>
      </div>

      <!-- ── Recommendation cards ── -->
      <div class="rec-list">

        <div class="rec-card" *ngFor="let r of filtered"
          [class.review-card]="r.isReview"
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
              <span *ngIf="r.isReview" class="rc-badge review-badge">📋 KOC REVIEW</span>
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

    /* KOC review cards get a subtle top accent */
    .review-card { border-top-color: rgba(109,212,126,0.25); }

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
    .pri-badge    { color:#1a1612; }
    .gc-badge     { color:var(--beige-200); background:var(--bg-3); border-color:var(--border-2); }
    .field-badge  { color:var(--orange-300); background:var(--bg-3); border-color:var(--orange-700); }
    .urgency-badge{ font-weight:700; }
    .cat-badge    { color:var(--beige-200); background:var(--bg-3); border-color:var(--border-2); }
    .review-badge { color:#6dd47e; background:#0f2a1040; border-color:#6dd47e40; }

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
  sourceFilter   = '';
  search         = '';

  allRecs:  Rec[] = [];
  filtered: Rec[] = [];

  get uniqueWells() {
    return new Set(this.filtered.map(r => r.wellName)).size;
  }
  get reviewCount() {
    return this.filtered.filter(r => r.isReview).length;
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

      /* ══════════════════════════════════════════════════════
         SECTION A — KOC WELL REVIEW (from WK Wells Review xlsx)
         These are direct engineer notes — shown first / prominently
         ══════════════════════════════════════════════════════ */

      /* A1. Direct recommendation from KOC Well Review sheet */
      if (w.recommendation_review) {
        const urgency = categoryUrgency(w.well_category);
        const catLabel = w.well_category || 'Normal';
        const h2sNote  = w.h2s_ppm && w.h2s_ppm > 0
          ? ` H₂S: ${(w.h2s_ppm / 1000).toFixed(0)}k PPM.` : '';
        const erlNote  = w.erl_pct != null
          ? ` ESP run life: ${w.erl_pct}%.` : '';
        const pumpNote = w.pump_status_review && w.pump_status_review !== 'Within Range'
          ? ` Pump status: ${w.pump_status_review}.` : '';
        const remarksNote = w.remarks_review
          ? `\nRemarks (KOC): "${w.remarks_review}"` : '';

        recs.push({ ...base, urgency, category: 'KOC Review', categoryIcon: '📋',
          isReview: true,
          title: w.recommendation_review,
          detail: `Well Category: ${catLabel}.${h2sNote}${erlNote}${pumpNote}${remarksNote}`,
          basedOn: 'KOC WK Wells Review — Apr 2026' });
      }

      /* A2. Grounded well — even if no explicit recommendation text */
      if (w.well_category === 'Grounded' && !w.recommendation_review) {
        recs.push({ ...base, urgency: 'high', category: 'KOC Review', categoryIcon: '📋',
          isReview: true,
          title: 'Grounded Well — Electrical Isolation Issue',
          detail: w.remarks_review
            ? `Remarks: "${w.remarks_review}". Grounded wells require full electrical checks ` +
              `(insulation resistance, cable integrity) before any energisation attempt.`
            : `Grounded well category. Perform MΩ test and cable inspection before startup.`,
          basedOn: 'KOC WK Wells Review — Apr 2026' });
      }

      /* ══════════════════════════════════════════════════════
         SECTION B — H₂S CONCENTRATION (from KOC review data)
         ══════════════════════════════════════════════════════ */

      if (w.h2s_ppm != null && w.h2s_ppm > 0) {
        if (w.h2s_ppm >= 30000) {
          recs.push({ ...base, urgency: 'critical', category: 'H₂S Safety', categoryIcon: '☠️',
            title: `Extreme H₂S — ${(w.h2s_ppm / 1000).toFixed(0)}k PPM · Mandatory Safety Protocol`,
            detail: `H₂S concentration of ${w.h2s_ppm.toLocaleString()} PPM is life-threatening. ` +
              `Before any site activity: (1) All personnel must wear SCBA — no exceptions, ` +
              `(2) Establish exclusion zone ≥ 100 m upwind, ` +
              `(3) Continuous H₂S monitoring with calibrated detectors (alarm at 10 PPM), ` +
              `(4) Muster point confirmed and medic on standby, ` +
              `(5) KOC HSE H₂S contingency plan must be active and briefed before wellsite entry. ` +
              `Do not proceed without KOC HSE sign-off.`,
            basedOn: 'KOC WK Wells Review — H₂S Data' });
        } else if (w.h2s_ppm >= 10000) {
          recs.push({ ...base, urgency: 'high', category: 'H₂S Safety', categoryIcon: '⚠️',
            title: `High H₂S — ${(w.h2s_ppm / 1000).toFixed(0)}k PPM · Enhanced Safety Precautions`,
            detail: `H₂S at ${w.h2s_ppm.toLocaleString()} PPM requires full H₂S safety protocol: ` +
              `(1) Personal H₂S monitor mandatory for all personnel, ` +
              `(2) Wind socks installed and checked, ` +
              `(3) Buddy system enforced at wellsite, ` +
              `(4) Ensure casing vent valve is functional to safely bleed gas before opening wellhead. ` +
              `Brief startup crew on emergency muster and evacuation procedure.`,
            basedOn: 'KOC WK Wells Review — H₂S Data' });
        } else if (w.h2s_ppm >= 1000) {
          recs.push({ ...base, urgency: 'medium', category: 'H₂S Safety', categoryIcon: '⚠️',
            title: `Elevated H₂S — ${w.h2s_ppm.toLocaleString()} PPM · Standard Precautions`,
            detail: `H₂S at ${w.h2s_ppm.toLocaleString()} PPM. Use personal H₂S detectors during ` +
              `all wellsite activities. Ensure wellhead area is well-ventilated. ` +
              `Brief startup crew and confirm emergency response procedure is known.`,
            basedOn: 'KOC WK Wells Review — H₂S Data' });
        }
      }

      /* ══════════════════════════════════════════════════════
         SECTION C — WELL CATEGORY (from KOC review data)
         ══════════════════════════════════════════════════════ */

      if (w.well_category === 'High Viscous / CT') {
        const hasCT = w.remarks_review && w.remarks_review.toLowerCase().includes('cip');
        recs.push({ ...base, urgency: 'medium', category: 'Well Condition', categoryIcon: '🧴',
          title: 'High Viscosity Crude — Chemical Injection Protocol Required',
          detail: hasCT
            ? `Viscous crude well (API: ${w.api_gravity || '?'}°). ${w.remarks_review}. ` +
              `Confirm Chemical Injection Pump (CIP) is connected and operational. ` +
              `Start at low frequency (30–35 Hz) and gradually increase after establishing flow.`
            : `Viscous crude well (API: ${w.api_gravity || '?'}°). ` +
              `Consider installing CIP for continuous downhole diluent injection. ` +
              `Start at low ESP frequency. Verify flowline is not cold-plugged before startup.`,
          basedOn: 'KOC WK Wells Review — Well Category' });
      }

      if (w.well_category === 'Problematic') {
        recs.push({ ...base, urgency: 'high', category: 'Well Condition', categoryIcon: '🔴',
          title: `Problematic Well — Detailed Engineering Review Required`,
          detail: w.remarks_review
            ? `Classified as Problematic by KOC review. Remarks: "${w.remarks_review}". ` +
              `Obtain PE/RE sign-off before committing to startup. Define specific startup conditions.`
            : `Classified as Problematic by KOC review. Do not start without PE/RE engineering review. ` +
              `Identify root cause of problematic classification before mobilising crew.`,
          basedOn: 'KOC WK Wells Review — Well Category' });
      }

      if (w.well_category === 'Low Pi') {
        recs.push({ ...base, urgency: 'medium', category: 'Well Condition', categoryIcon: '📉',
          title: `Low Productivity Index — Verify Pump Operating Point`,
          detail: `Well has low PI. Run a current inflow performance analysis before selecting ` +
            `ESP operating frequency. Risk of operating in downthrust if frequency is too high ` +
            `relative to reservoir deliverability. ` +
            `Recommend pump-off test or step-rate test within first 48 hrs of startup.`,
          basedOn: 'KOC WK Wells Review — Well Category' });
      }

      if (w.well_category === 'Sensor reading lost') {
        recs.push({ ...base, urgency: 'medium', category: 'Well Condition', categoryIcon: '📡',
          title: `Sensor Lost — Operate Blind Mode Protocol`,
          detail: `ESP downhole sensor (PDG/MFM) reading is lost. Startup must follow blind-mode ` +
            `protocol: (1) Monitor surface FLP and wellhead pressure only, ` +
            `(2) Calculate PIP indirectly from pump curves + surface data, ` +
            `(3) Flag for sensor replacement at next ESP changeout.`,
          basedOn: 'KOC WK Wells Review — Well Category' });
      }

      if (w.well_category === 'New Commission') {
        recs.push({ ...base, urgency: 'medium', category: 'Well Condition', categoryIcon: '🆕',
          title: `New Commission — Pre-Startup Commissioning Checklist`,
          detail: `Well is newly commissioned. Verify: (1) All commissioning punch list items closed, ` +
            `(2) HAL commissioning certificate obtained, ` +
            `(3) Wellhead pressure test completed, ` +
            `(4) First-well-test PGOR submitted to PE within 7 days of startup. ` +
            `${w.remarks_review ? 'Remarks: "' + w.remarks_review + '".' : ''}`,
          basedOn: 'KOC WK Wells Review — Well Category' });
      }

      /* ══════════════════════════════════════════════════════
         SECTION D — PUMP STATUS (from KOC review data)
         ══════════════════════════════════════════════════════ */

      if (w.pump_status_review === 'Downthrust') {
        recs.push({ ...base, urgency: 'high', category: 'ESP', categoryIcon: '⚡',
          title: `ESP in Downthrust — Frequency Adjustment Required`,
          detail: `Last PGOR indicates ESP operating in downthrust condition. ` +
            `Reduce operating frequency by 3–5 Hz increments until PDP/PIP ratio normalises. ` +
            `Do not startup at previous set frequency — rebalance pump operating point first. ` +
            `Monitor motor amps and vibration for the first 24 hours.`,
          basedOn: 'KOC WK Wells Review — Pump Status' });
      }

      if (w.pump_status_review === 'Upthrust') {
        recs.push({ ...base, urgency: 'high', category: 'ESP', categoryIcon: '⚡',
          title: `ESP in Upthrust — High Liquid Rate / Gas Interference`,
          detail: `Last PGOR shows ESP in upthrust condition — pump is overloaded with liquid ` +
            `or gas is causing surge. Increase frequency gradually to stabilise, or check for ` +
            `gas slug interference at intake. Monitor PIP closely after startup. ` +
            `If upthrust persists >2 hrs, shut in and contact HAL for pump review.`,
          basedOn: 'KOC WK Wells Review — Pump Status' });
      }

      /* ══════════════════════════════════════════════════════
         SECTION E — EXISTING RULES ENGINE (WO history, ESP,
                     API gravity, water cut, etc.)
         ══════════════════════════════════════════════════════ */

      /* E1. Closure reason */
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
            `liquid and oil handling quota. No surface or downhole intervention required.`,
          basedOn: 'Closure Reason' });
      }

      /* E2. ESP run life */
      if (w.esp_run_life > 900) {
        recs.push({ ...base, urgency: 'critical', category: 'ESP', categoryIcon: '⚡',
          title: `ESP Run Life Critical — ${w.esp_run_life} Days`,
          detail: `ESP has been running ${w.esp_run_life} days, well beyond the KOC ` +
            `P90 failure threshold (~730 days). Pre-emptive changeout is strongly recommended ` +
            `before startup to avoid in-service failure at peak production rate.`,
          basedOn: 'Equipment Data' });
      } else if (w.esp_run_life > 650) {
        recs.push({ ...base, urgency: 'high', category: 'ESP', categoryIcon: '⚡',
          title: `Long ESP Run Life — ${w.esp_run_life} Days`,
          detail: `ESP run life is ${w.esp_run_life} days (approaching P90 failure window). ` +
            `Plan a changeout within the next 3–6 months. ` +
            `Monitor motor temperature and vibration closely post-startup.`,
          basedOn: 'Equipment Data' });
      } else if (w.esp_run_life > 450) {
        recs.push({ ...base, urgency: 'medium', category: 'ESP', categoryIcon: '⚡',
          title: `Monitor ESP Run Life — ${w.esp_run_life} Days`,
          detail: `ESP run life is ${w.esp_run_life} days. ` +
            `Within acceptable range — schedule for regular vibration and current monitoring. ` +
            `Flag for changeout planning in 6–12 months.`,
          basedOn: 'Equipment Data' });
      }

      /* E3. API gravity — only if not already covered by well_category rules */
      if (w.api_gravity > 0 && w.well_category !== 'High Viscous / CT') {
        if (w.api_gravity < 22) {
          recs.push({ ...base, urgency: 'high', category: 'Chemical', categoryIcon: '🧪',
            title: `Heavy Oil (${w.api_gravity}° API) — Wax & Viscosity Risk`,
            detail: `API gravity of ${w.api_gravity}° indicates heavy crude. ` +
              `Inject paraffin inhibitor before startup. Verify flowline heat trace integrity. ` +
              `Start ESP at low frequency — avoid cold-start at minimum speed.`,
            basedOn: 'API Gravity' });
        } else if (w.api_gravity < 27) {
          recs.push({ ...base, urgency: 'medium', category: 'Chemical', categoryIcon: '🧪',
            title: `Medium-Heavy Oil (${w.api_gravity}° API) — Monitor Viscosity`,
            detail: `API gravity of ${w.api_gravity}° is medium-heavy. Monitor flowline ` +
              `pressure post-startup for wax build-up. If FLP rises >20 psi above baseline ` +
              `within 72 hrs, initiate paraffin inhibitor batch treatment.`,
            basedOn: 'API Gravity' });
        } else if (w.api_gravity > 38) {
          recs.push({ ...base, urgency: 'medium', category: 'Gas Handling', categoryIcon: '💨',
            title: `Light Oil (${w.api_gravity}° API) — Verify Gas Handling`,
            detail: `API gravity of ${w.api_gravity}° indicates light crude with potentially ` +
              `high GOR. Verify ${w.facility} separator gas handling capacity. ` +
              `Monitor PIP for gas interference signatures post-startup.`,
            basedOn: 'API Gravity' });
        }
      }

      /* E4. Water cut */
      if (w.latest_wc > 85) {
        recs.push({ ...base, urgency: 'high', category: 'Production', categoryIcon: '💧',
          title: `Very High Water Cut — ${w.latest_wc.toFixed(0)}% WC`,
          detail: `Water cut of ${w.latest_wc.toFixed(1)}% — verify ESP is rated for ` +
            `current liquid rate at actual WC. Confirm ${w.facility} water disposal capacity. ` +
            `Pump performance curve check against allowable ${w.allowable_rate.toFixed(0)} BLPD.`,
          basedOn: 'Production Data' });
      } else if (w.latest_wc > 65) {
        recs.push({ ...base, urgency: 'medium', category: 'Production', categoryIcon: '💧',
          title: `High Water Cut — ${w.latest_wc.toFixed(0)}% WC`,
          detail: `Water cut of ${w.latest_wc.toFixed(1)}% — verify pump operating point ` +
            `for liquid rate ${w.latest_liquid.toFixed(0)} BLPD. ` +
            `Monitor PDP/PIP ratio after startup for pump wear indicators.`,
          basedOn: 'Production Data' });
      }

      /* E5. WO history count */
      if (w.wo_count >= 6) {
        const types      = wos.map(wo => (wo.activity_type || '').toUpperCase());
        const rigCount   = types.filter(t => t.includes('WORKOVER')).length;
        const riglessCount = types.filter(t => t.includes('RIGLESS')).length;
        recs.push({ ...base, urgency: 'high', category: 'Workover', categoryIcon: '🔧',
          title: `High WO Frequency — ${w.wo_count} Workovers on Record`,
          detail: `${w.wo_count} workovers recorded (${rigCount} rig WOs, ${riglessCount} rigless). ` +
            `Recurring interventions suggest underlying mechanical or reservoir issue. ` +
            `Conduct root-cause analysis before committing to startup.`,
          basedOn: 'WO History' });
      } else if (w.wo_count >= 3) {
        recs.push({ ...base, urgency: 'medium', category: 'Workover', categoryIcon: '🔧',
          title: `Multiple WO History — ${w.wo_count} Interventions`,
          detail: `${w.wo_count} workover interventions on record. Review last WO report ` +
            `to ensure all issues were resolved. Flag for enhanced monitoring first 30 days.`,
          basedOn: 'WO History' });
      }

      /* E6. Sidetrack history */
      const hasST = wos.some(wo =>
        (wo.activity_type || '').toUpperCase().includes('SIDETRACK') ||
        w.well_name.includes('ST'));
      if (hasST) {
        recs.push({ ...base, urgency: 'medium', category: 'Reservoir', categoryIcon: '📐',
          title: 'Sidetrack Well — Verify Current Completion Integrity',
          detail: `Well has sidetrack history. Confirm active lateral and perforation interval, ` +
            `cement integrity, and packer hold before startup.`,
          basedOn: 'WO History / Well Name' });
      }

      /* E7. Recent WO < 120 days */
      if (wos.length > 0) {
        const lastWO      = wos[0];
        const daysSinceWO = this.daysSince(lastWO.end_date || lastWO.start_date || '');
        if (daysSinceWO < 120 && daysSinceWO > 0) {
          recs.push({ ...base, urgency: 'medium', category: 'Verification', categoryIcon: '✅',
            title: `Recent WO — Verify Post-WO Performance Target`,
            detail: `Last workover (${lastWO.activity_type || 'WO'}) completed ` +
              `${daysSinceWO} days ago. Confirm post-WO production target achieved ` +
              `and all punch list items closed before declaring well ready.`,
            basedOn: 'WO History' });
        }
      }

      /* E8. Stale PGOR */
      const pgorAge = this.daysSince(w.latest_pgor_date);
      if (pgorAge > 365) {
        recs.push({ ...base, urgency: 'medium', category: 'Production', categoryIcon: '📊',
          title: `Stale PGOR — ${pgorAge} Days Since Last Well Test`,
          detail: `Last PGOR test was ${w.latest_pgor_date || 'unknown'} (${pgorAge} days ago). ` +
            `Schedule a well test within 14 days of startup to validate expected oil rate ` +
            `of ${w.expected_oil.toFixed(0)} BOPD.`,
          basedOn: 'Production Data' });
      } else if (pgorAge > 180) {
        recs.push({ ...base, urgency: 'low', category: 'Production', categoryIcon: '📊',
          title: `PGOR Approaching Expiry — ${pgorAge} Days Old`,
          detail: `PGOR is ${pgorAge} days old. Schedule a fresh well test within ` +
            `30 days of startup. Last recorded: ${w.latest_oil.toFixed(0)} BOPD, ${w.latest_wc.toFixed(0)}% WC.`,
          basedOn: 'Production Data' });
      }

      /* E9. P5 Hold wells */
      if (w.priority === 'P5') {
        recs.push({ ...base, urgency: 'low', category: 'Reservoir', categoryIcon: '📋',
          title: 'P5 Well — RE Assessment Required Before Startup',
          detail: `Well is classified P5 (Hold/RE Assessment). Do not proceed with startup ` +
            `planning until Reservoir Engineering completes economic and technical review.`,
          basedOn: 'Priority Score' });
      }

    }

    /* Sort: review cards float to top within their urgency tier, then by well name */
    return recs.sort((a, b) =>
      URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] ||
      (b.isReview ? 1 : 0) - (a.isReview ? 1 : 0) ||
      a.wellName.localeCompare(b.wellName));
  }

  applyFilter() {
    let r = this.allRecs;
    if (this.urgencyFilter)  r = r.filter(x => x.urgency === this.urgencyFilter);
    if (this.categoryFilter) r = r.filter(x => x.category === this.categoryFilter);
    if (this.gcFilter)       r = r.filter(x => x.facility === this.gcFilter);
    if (this.priFilter)      r = r.filter(x => x.priority === this.priFilter);
    if (this.sourceFilter === 'review') r = r.filter(x => x.isReview);
    if (this.sourceFilter === 'engine') r = r.filter(x => !x.isReview);
    if (this.search)         r = r.filter(x =>
      x.wellName.toLowerCase().includes(this.search.toLowerCase()) ||
      x.title.toLowerCase().includes(this.search.toLowerCase()));
    this.filtered = r;
  }
}
