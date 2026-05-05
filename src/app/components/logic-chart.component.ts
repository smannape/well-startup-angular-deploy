import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logic-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sk-root">

      <div class="sk-header">
        <span class="sk-title">Startup Scoring — Signal Flow</span>
        <span class="sk-sub">Input signals (left) → weighted score → priority bucket (right) · band width = contribution</span>
      </div>

      <div class="sk-body">
        <svg [attr.viewBox]="'0 0 '+W+' '+H" preserveAspectRatio="xMidYMid meet" class="sk-svg">

          <!-- ── Flows (behind nodes) ── -->
          <path *ngFor="let f of flows"
            [attr.d]="f.d"
            [attr.fill]="f.color"
            [attr.opacity]="f.op"/>

          <!-- ── Input nodes (left) ── -->
          <g *ngFor="let n of inputNodes">
            <rect [attr.x]="LX" [attr.y]="n.y" [attr.width]="NW" [attr.height]="n.h"
              fill="#1e160d" stroke="#4a3820" stroke-width="1" rx="2"/>
            <text [attr.x]="LX + NW/2" [attr.y]="n.y + n.h * 0.36"
              text-anchor="middle" dominant-baseline="middle"
              font-size="13" font-family="sans-serif">{{n.icon}}</text>
            <text [attr.x]="LX + NW/2" [attr.y]="n.y + n.h * 0.67"
              text-anchor="middle" dominant-baseline="middle"
              fill="#c8b48a" font-size="9" font-family="JetBrains Mono,monospace"
              letter-spacing="0.03em">{{n.label}}</text>
          </g>

          <!-- ── Weight badges (right edge of each input node) ── -->
          <g *ngFor="let n of inputNodes">
            <rect [attr.x]="LX + NW + 3" [attr.y]="n.y + n.h/2 - 7"
              width="40" height="14" rx="2"
              [attr.fill]="n.pos ? '#1d3320' : '#3a1810'"/>
            <text [attr.x]="LX + NW + 23" [attr.y]="n.y + n.h/2 + 1"
              text-anchor="middle" dominant-baseline="middle"
              [attr.fill]="n.pos ? '#6dd47e' : '#ef8a6a'"
              font-size="8.5" font-family="JetBrains Mono,monospace" font-weight="700">{{n.wLabel}}</text>
          </g>

          <!-- ── Centre: score formula ── -->
          <rect [attr.x]="CX - 46" [attr.y]="MT"
            width="92" [attr.height]="H - MT - MB"
            fill="#ff7a1a04" stroke="#2a2014" stroke-width="1" rx="3"/>
          <text [attr.x]="CX" [attr.y]="MT + 10"
            text-anchor="middle" dominant-baseline="middle"
            fill="#4a3820" font-size="7.5" letter-spacing="0.18em"
            font-family="JetBrains Mono,monospace">STARTUP SCORE</text>
          <line [attr.x1]="CX - 36" [attr.y1]="MT + 16"
                [attr.x2]="CX + 36" [attr.y2]="MT + 16"
                stroke="#2a2014" stroke-width="0.8"/>
          <text *ngFor="let row of formula"
            [attr.x]="CX" [attr.y]="row.y"
            text-anchor="middle" dominant-baseline="middle"
            [attr.fill]="row.pos ? '#6dd47e' : '#ef8a6a'"
            font-size="8.5" font-family="JetBrains Mono,monospace" font-weight="600">{{row.text}}</text>

          <!-- ── Priority nodes (right) ── -->
          <g *ngFor="let p of priorityNodes">
            <rect [attr.x]="RX" [attr.y]="p.y" [attr.width]="NW" [attr.height]="p.h"
              [attr.fill]="p.color" rx="2"/>
            <!-- P label -->
            <text [attr.x]="RX + NW/2" [attr.y]="p.y + (p.h > 30 ? p.h*0.36 : p.h/2)"
              text-anchor="middle" dominant-baseline="middle"
              fill="#1a1612" font-size="11" font-weight="700"
              font-family="JetBrains Mono,monospace">{{p.p}}</text>
            <!-- well count -->
            <text *ngIf="p.h > 28"
              [attr.x]="RX + NW/2" [attr.y]="p.y + p.h * 0.68"
              text-anchor="middle" dominant-baseline="middle"
              fill="#1a1612" font-size="8" font-family="Inter,sans-serif">{{p.count}} wells</text>
            <!-- label to the right -->
            <text [attr.x]="RX + NW + 5" [attr.y]="p.y + p.h/2"
              dominant-baseline="middle"
              [attr.fill]="p.color" font-size="8.5"
              font-family="Inter,sans-serif">{{p.label}}</text>
          </g>

          <!-- ── Column headers ── -->
          <text [attr.x]="LX + NW/2" [attr.y]="MT - 6"
            text-anchor="middle" dominant-baseline="auto"
            fill="#5a4830" font-size="7.5" letter-spacing="0.16em"
            font-family="JetBrains Mono,monospace">INPUT SIGNALS</text>
          <text [attr.x]="RX + NW/2" [attr.y]="MT - 6"
            text-anchor="middle" dominant-baseline="auto"
            fill="#5a4830" font-size="7.5" letter-spacing="0.16em"
            font-family="JetBrains Mono,monospace">PRIORITY BUCKET</text>

        </svg>
      </div>

    </div>
  `,
  styles: [`
    .sk-root  { display:flex; flex-direction:column; height:100%; overflow:hidden;
                padding:8px 10px 4px; box-sizing:border-box; }
    .sk-header{ flex-shrink:0; margin-bottom:5px; }
    .sk-title { font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
                color:var(--orange-400); }
    .sk-sub   { display:block; font-size:9.5px; color:var(--beige-400); margin-top:2px;
                letter-spacing:.04em; }
    .sk-body  { flex:1; min-height:0; overflow:hidden; }
    .sk-svg   { display:block; width:100%; height:100%; }
  `]
})
export class LogicChartComponent {

  /* ── SVG canvas ─────────────────────────────────────── */
  readonly W  = 640;
  readonly H  = 250;
  readonly MT = 22;   // margin top (room for column headers)
  readonly MB = 8;
  readonly NW = 110;  // node width
  readonly LX = 8;    // left column x
  readonly RX = 522;  // right column x  (640 - 8 - 110)
  readonly CX = 315;  // centre of flow area  ((8+110 + 522) / 2)

  inputNodes:    any[] = [];
  priorityNodes: any[] = [];
  flows:         any[] = [];
  formula:       any[] = [];

  constructor() { this.build(); }

  build() {
    const usable = this.H - this.MT - this.MB;   // 220
    const gap    = 5;

    /* ── Input nodes ──────────────────────────────────── */
    const inputDefs = [
      { icon: '🛢', label: 'Oil Rate / PGOR', wLabel: '+130', pos: true  },
      { icon: '📋', label: 'Closure Reason',  wLabel:  '−25', pos: false },
      { icon: '🔧', label: 'WO History',      wLabel:  '−15', pos: false },
      { icon: '💧', label: 'Water Cut %',     wLabel:  '−10', pos: false },
      { icon: '⚡', label: 'ESP Run Life',    wLabel:  '−10', pos: false },
    ];
    const iH = (usable - gap * (inputDefs.length - 1)) / inputDefs.length;
    this.inputNodes = inputDefs.map((d, i) => ({
      ...d,
      y: this.MT + i * (iH + gap),
      h: iH,
    }));

    /* ── Priority nodes (sized by actual well count) ──── */
    const priDefs = [
      { p: 'P1', count: 12, color: '#ffb83d', label: 'Quick Win'    },
      { p: 'P2', count: 18, color: '#ff9849', label: 'Surface Intv' },
      { p: 'P3', count: 25, color: '#cf6b3a', label: 'Rigless WO'   },
      { p: 'P4', count: 24, color: '#8a4a2b', label: 'Rig WO'       },
      { p: 'P5', count: 43, color: '#5a4434', label: 'Hold / RE'    },
    ];
    const totalWells = priDefs.reduce((s, p) => s + p.count, 0); // 122
    const totalPH    = usable - gap * (priDefs.length - 1);       // 200

    let pY = this.MT;
    this.priorityNodes = priDefs.map(p => {
      const h = (p.count / totalWells) * totalPH;
      const node = { ...p, y: pY, h };
      pY += h + gap;
      return node;
    });

    /* ── Scoring formula rows (centre panel) ─────────── */
    const fRows = [
      { text: '+100 × Potential', pos: true  },
      { text:  '+30 × Freshness', pos: true  },
      { text:  '−25 × Severity',  pos: false },
      { text:  '−15 × WO Burden', pos: false },
      { text:   '−10 × WC Risk',  pos: false },
      { text: '−10 × Equip Risk', pos: false },
    ];
    const rowH  = (usable - 24) / fRows.length;
    this.formula = fRows.map((r, i) => ({
      ...r,
      y: this.MT + 24 + i * rowH + rowH / 2,
    }));

    /* ── Sankey flows ─────────────────────────────────── */
    const srcOff = this.inputNodes.map(() => 0);
    const tgtOff = this.priorityNodes.map(() => 0);
    this.flows   = [];

    // Control-point x values for smoother S-curves
    const cp1 = this.LX + this.NW + 52;
    const cp2 = this.RX - 52;

    for (let i = 0; i < this.inputNodes.length; i++) {
      for (let j = 0; j < this.priorityNodes.length; j++) {
        const inp = this.inputNodes[i];
        const pri = this.priorityNodes[j];
        const fH  = inp.h * (pri.count / totalWells);

        const sy0 = inp.y + srcOff[i];
        const sy1 = sy0  + fH;
        const ty0 = pri.y + tgtOff[j];
        const ty1 = ty0  + fH;

        const x0 = this.LX + this.NW;
        const x1 = this.RX;

        const d =
          `M${x0},${sy0} C${cp1},${sy0} ${cp2},${ty0} ${x1},${ty0}` +
          `L${x1},${ty1} C${cp2},${ty1} ${cp1},${sy1} ${x0},${sy1}Z`;

        // Positive inputs slightly brighter, negative slightly dimmer
        const op = inp.pos ? 0.38 : 0.26;
        this.flows.push({ d, color: pri.color, op });

        srcOff[i] += fH;
        tgtOff[j] += fH;
      }
    }
  }
}
