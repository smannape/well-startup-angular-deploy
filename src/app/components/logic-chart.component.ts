import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-logic-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lc-wrap">
      <div class="lc-title">Orient · Startup Scoring Logic</div>
      <div class="lc-subtitle">How each closed well receives its startup priority score</div>
      <div class="lc-flow">

        <!-- Column 1: Inputs -->
        <div class="lc-col">
          <div class="col-head">Raw Inputs</div>
          <div class="lc-node input" *ngFor="let n of inputs">
            <span class="node-icon">{{n.icon}}</span>
            <div>
              <div class="node-label">{{n.label}}</div>
              <div class="node-sub">{{n.sub}}</div>
            </div>
          </div>
        </div>

        <!-- Arrow -->
        <div class="lc-arrow-col">
          <div class="arrow-line"></div>
          <span class="arrow-head">▶</span>
        </div>

        <!-- Column 2: Factors -->
        <div class="lc-col">
          <div class="col-head">Scoring Factors</div>
          <div class="lc-node factor" *ngFor="let f of factors">
            <div class="factor-weight" [style.color]="f.wcolor">{{f.weight}}</div>
            <div>
              <div class="node-label">{{f.label}}</div>
              <div class="node-sub">{{f.sub}}</div>
            </div>
          </div>
        </div>

        <!-- Arrow -->
        <div class="lc-arrow-col">
          <div class="arrow-line"></div>
          <span class="arrow-head">▶</span>
        </div>

        <!-- Column 3: Score box -->
        <div class="lc-col center-col">
          <div class="col-head">Final Score</div>
          <div class="score-box">
            <div class="score-title">Startup Score</div>
            <div class="score-formula">
              <span class="pos">+100</span> × Potential<br>
              <span class="pos">+30</span> × Freshness<br>
              <span class="neg">−25</span> × Severity<br>
              <span class="neg">−15</span> × WO Burden<br>
              <span class="neg">−10</span> × WC Risk<br>
              <span class="neg">−10</span> × Equip Risk
            </div>
            <div class="score-range">Range: 0 – 100+</div>
          </div>
        </div>

        <!-- Arrow -->
        <div class="lc-arrow-col">
          <div class="arrow-line"></div>
          <span class="arrow-head">▶</span>
        </div>

        <!-- Column 4: Buckets -->
        <div class="lc-col">
          <div class="col-head">Priority Bucket</div>
          <div class="lc-bucket" *ngFor="let b of buckets" [style.background]="b.color" [style.border-color]="b.color">
            <span class="bucket-p">{{b.p}}</span>
            <span class="bucket-label">{{b.label}}</span>
            <span class="bucket-score">score {{b.range}}</span>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .lc-wrap { padding:16px 20px; height:100%; overflow-y:auto; }
    .lc-title { font-size:13px; font-weight:600; letter-spacing:.14em; text-transform:uppercase;
      color:var(--orange-400); margin-bottom:4px; }
    .lc-subtitle { font-size:11px; color:var(--beige-400); margin-bottom:20px; letter-spacing:.06em; }

    .lc-flow { display:flex; align-items:center; gap:0; min-width:720px; }

    .lc-col { display:flex; flex-direction:column; gap:8px; min-width:160px; }
    .center-col { min-width:180px; }

    .col-head { font-size:9px; letter-spacing:.2em; text-transform:uppercase;
      color:var(--beige-500); margin-bottom:4px; padding-bottom:4px;
      border-bottom:1px solid var(--border-1); }

    .lc-node { display:flex; align-items:flex-start; gap:8px;
      background:var(--bg-2); border:1px solid var(--border-2);
      border-radius:3px; padding:8px 10px; }
    .lc-node.input { border-color:var(--beige-500); }
    .lc-node.factor { border-color:var(--orange-700); }
    .node-icon { font-size:14px; flex-shrink:0; margin-top:1px; }
    .node-label { font-size:11px; color:var(--beige-100); font-weight:500; }
    .node-sub { font-size:10px; color:var(--beige-400); margin-top:2px; }
    .factor-weight { font-family:"JetBrains Mono",monospace; font-size:13px; font-weight:700;
      flex-shrink:0; min-width:36px; padding-top:1px; }

    .lc-arrow-col { display:flex; align-items:center; padding:0 8px; flex-shrink:0; }
    .arrow-line { width:28px; height:2px; background:var(--border-2); }
    .arrow-head { color:var(--beige-400); font-size:12px; margin-left:-2px; }

    .score-box { background:#ff7a1a14; border:2px solid var(--orange-500);
      border-radius:4px; padding:14px 16px; text-align:center; }
    .score-title { font-size:13px; font-weight:700; color:var(--orange-400);
      letter-spacing:.1em; text-transform:uppercase; margin-bottom:10px; }
    .score-formula { font-family:"JetBrains Mono",monospace; font-size:11px;
      line-height:1.9; color:var(--beige-200); text-align:left; display:inline-block; }
    .pos { color:var(--good); font-weight:700; }
    .neg { color:var(--bad); font-weight:700; }
    .score-range { margin-top:10px; font-size:10px; color:var(--beige-400);
      letter-spacing:.1em; text-transform:uppercase; }

    .lc-bucket { display:flex; align-items:center; gap:8px;
      border-radius:3px; padding:8px 12px; border:1px solid; opacity:0.9; }
    .bucket-p { font-size:12px; font-weight:700; color:#1a1612;
      font-family:"JetBrains Mono",monospace; flex-shrink:0; }
    .bucket-label { font-size:11px; color:#1a1612; font-weight:600; flex:1; }
    .bucket-score { font-size:9px; color:#1a1612; opacity:0.7;
      letter-spacing:.06em; font-family:"JetBrains Mono",monospace; }
  `]
})
export class LogicChartComponent {
  inputs = [
    { icon: '🛢', label: 'Latest Oil / PGOR',  sub: 'BOPD from last well test' },
    { icon: '💧', label: 'Water Cut %',         sub: 'Latest WC measurement' },
    { icon: '⚡', label: 'ESP Run Life',         sub: 'Days since last changeout' },
    { icon: '🔧', label: 'Workover History',    sub: 'Count + last WO date' },
    { icon: '📋', label: 'Closure Reason',      sub: 'Operator-coded reason' },
  ];
  factors = [
    { weight: '+100', wcolor: '#6dd47e', label: 'Production Potential', sub: 'Normalised expected BOPD' },
    { weight: '+30',  wcolor: '#6dd47e', label: 'Freshness',            sub: 'Recency of last well test' },
    { weight: '−25',  wcolor: '#ef5a3a', label: 'Reason Severity',      sub: '1 (GC only) → 5 (major)' },
    { weight: '−15',  wcolor: '#ef5a3a', label: 'WO Burden',            sub: 'Workover frequency score' },
    { weight: '−10',  wcolor: '#ef5a3a', label: 'WC Risk',              sub: 'High WC penalty factor' },
    { weight: '−10',  wcolor: '#ef5a3a', label: 'Equipment Risk',       sub: 'ESP run life penalty' },
  ];
  buckets = [
    { p: 'P1', label: 'Quick Win',    range: '> 80',  color: '#ffb83d' },
    { p: 'P2', label: 'Surface Intv', range: '60–79', color: '#ff9849' },
    { p: 'P3', label: 'Rigless WO',   range: '40–59', color: '#cf6b3a' },
    { p: 'P4', label: 'Rig WO',       range: '20–39', color: '#8a4a2b' },
    { p: 'P5', label: 'Hold / RE',    range: '< 20',  color: '#665544' },
  ];
}
