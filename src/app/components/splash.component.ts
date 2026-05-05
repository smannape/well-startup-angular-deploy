import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash" [class.exit]="exiting" (click)="skip()">

      <!-- ── Grid background ── -->
      <div class="bg-grid"></div>

      <!-- ── Scanline overlay ── -->
      <div class="scanlines"></div>

      <!-- ── Radar (all relative to center) ── -->
      <div class="radar-origin">
        <div class="radar-sweep"></div>
        <div class="radar-fan"></div>
        <div class="ring r1"></div>
        <div class="ring r2"></div>
        <div class="ring r3"></div>
        <div class="ring r4"></div>
        <div class="center-dot"></div>
      </div>

      <!-- ── OODA compass labels ── -->
      <div class="ooda-n">
        <span class="compass-mark">▲</span>
        <span class="ooda-word">OBSERVE</span>
      </div>
      <div class="ooda-e">
        <span class="ooda-word">ORIENT</span>
        <span class="compass-mark">▶</span>
      </div>
      <div class="ooda-s">
        <span class="ooda-word">DECIDE</span>
        <span class="compass-mark">▼</span>
      </div>
      <div class="ooda-w">
        <span class="compass-mark">◀</span>
        <span class="ooda-word">ACT</span>
      </div>

      <!-- ── Left data panel ── -->
      <div class="side-panel left-panel">
        <div class="sp-head">WELL INVENTORY SCAN</div>
        <div class="sp-div">──────────────────</div>
        <div class="sp-row"><span class="sk">GC-17</span><span class="sv">22 WELLS</span></div>
        <div class="sp-row"><span class="sk">GC-18</span><span class="sv">19 WELLS</span></div>
        <div class="sp-row"><span class="sk">GC-27</span><span class="sv">45 WELLS</span></div>
        <div class="sp-row"><span class="sk">GC-28</span><span class="sv">36 WELLS</span></div>
        <div class="sp-div">──────────────────</div>
        <div class="sp-row"><span class="sk">CLOSED</span><span class="sv hi">121</span></div>
        <div class="sp-row"><span class="sk">OPEN</span><span class="sv">1</span></div>
        <div class="sp-row"><span class="sk">TOTAL</span><span class="sv">122</span></div>
        <div class="sp-div">──────────────────</div>
        <div class="sp-row"><span class="sk">METHOD</span><span class="sv">ESP · PCP · WI</span></div>
        <div class="sp-row"><span class="sk">FIELD</span><span class="sv hi">MN · UG</span></div>
        <div class="sp-row"><span class="sk">CONTRACTOR</span><span class="sv hi">HAL</span></div>
        <div class="sp-div">──────────────────</div>
        <div class="sp-row"><span class="sk">GC CAPACITY</span><span class="sv">112 WELLS</span></div>
        <div class="sp-row"><span class="sk">ESP FAILURE</span><span class="sv">5 WELLS</span></div>
      </div>

      <!-- ── Right data panel ── -->
      <div class="side-panel right-panel">
        <div class="sp-head">SYSTEM DIAGNOSTICS</div>
        <div class="sp-div">──────────────────</div>
        <div class="sp-row"><span class="sk">SCORING ENGINE</span><span class="sv ok">■ ONLINE</span></div>
        <div class="sp-row"><span class="sk">PGOR DATA</span><span class="sv ok">■ LOADED</span></div>
        <div class="sp-row"><span class="sk">WO HISTORY</span><span class="sv ok">■ 620 REC</span></div>
        <div class="sp-row"><span class="sk">API CALIBRATION</span><span class="sv ok">■ ACTIVE</span></div>
        <div class="sp-row"><span class="sk">RECOMMENDATIONS</span><span class="sv ok">■ READY</span></div>
        <div class="sp-row"><span class="sk">RT TELEMETRY</span><span class="sv warn">□ OFFLINE</span></div>
        <div class="sp-div">──────────────────</div>
        <div class="sp-head sub">RECOVERABLE OIL</div>
        <div class="sp-big">79,461 BOPD</div>
        <div class="sp-div">──────────────────</div>
        <div class="sp-row"><span class="sk">P1 QUICK WIN</span><span class="sv hi">12 WELLS</span></div>
        <div class="sp-row"><span class="sk">P2 SURFACE</span><span class="sv">18 WELLS</span></div>
        <div class="sp-row"><span class="sk">P3 RIGLESS</span><span class="sv">25 WELLS</span></div>
        <div class="sp-row"><span class="sk">P4 RIG WO</span><span class="sv">24 WELLS</span></div>
        <div class="sp-row"><span class="sk">P5 HOLD</span><span class="sv">43 WELLS</span></div>
      </div>

      <!-- ── Centre brand ── -->
      <div class="brand-center">
        <svg class="brand-logo" width="80" height="80" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="3" fill="#ff7a1a" opacity=".12"/>
          <line x1="16" y1="3"  x2="5"  y2="28" stroke="#ff9849" stroke-width="1.5"/>
          <line x1="16" y1="3"  x2="27" y2="28" stroke="#ff9849" stroke-width="1.5"/>
          <line x1="8"  y1="20" x2="24" y2="20" stroke="#ff9849" stroke-width="1.1"/>
          <line x1="10" y1="14" x2="22" y2="14" stroke="#ff9849" stroke-width="1.1"/>
          <line x1="13" y1="8"  x2="19" y2="8"  stroke="#ff9849" stroke-width="1.1"/>
          <line x1="4"  y1="28" x2="28" y2="28" stroke="#ff7a1a" stroke-width="2"/>
          <circle cx="16" cy="3" r="2.5" fill="#ffb83d"/>
        </svg>

        <div class="brand-main">WELL STARTUP</div>
        <div class="brand-slash">/</div>
        <div class="brand-sub">DECISION CONSOLE</div>
        <div class="brand-pill">HAL · MN · UG · WEST KUWAIT</div>
        <div class="brand-ooda">OBSERVE · ORIENT · DECIDE · ACT</div>
        <div class="brand-version">KOC PRODUCTION ENGINEERING · v2.0 · APR 2026</div>
      </div>

      <!-- ── Bottom bar ── -->
      <div class="bottom-bar">
        <div class="init-line">
          <span class="init-cursor">▶</span>
          <span class="init-text">{{phases[phase]}}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill"></div>
        </div>
        <div class="skip-hint">◆ CLICK ANYWHERE TO ENTER ◆</div>
      </div>

    </div>
  `,
  styles: [`
    /* ── Base ─────────────────────────────────────────────── */
    .splash {
      position: fixed; inset: 0; z-index: 9999;
      background: #0d0a06;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; cursor: pointer;
      animation: splash-fade-in 0.9s ease forwards;
    }
    .splash.exit { animation: splash-fade-out 0.65s ease forwards; pointer-events: none; }

    @keyframes splash-fade-in  { from { opacity: 0; } to { opacity: 1; } }
    @keyframes splash-fade-out { to   { opacity: 0; transform: scale(1.04); } }

    /* ── Grid ─────────────────────────────────────────────── */
    .bg-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,120,26,0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,120,26,0.07) 1px, transparent 1px);
      background-size: 52px 52px;
    }

    /* ── Scanlines ─────────────────────────────────────────── */
    .scanlines {
      position: absolute; inset: 0; pointer-events: none;
      background: repeating-linear-gradient(
        0deg, transparent, transparent 3px,
        rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px
      );
    }

    /* ── Radar ─────────────────────────────────────────────── */
    .radar-origin {
      position: absolute; top: 50%; left: 50%;
      width: 0; height: 0;
    }

    /* Sweep arm */
    .radar-sweep {
      position: absolute;
      width: 2px; height: 320px;
      bottom: 0; left: -1px;
      background: linear-gradient(to top, rgba(255,120,26,0.95), transparent);
      transform-origin: 1px 100%;
      animation: spin 5s linear infinite;
      filter: blur(0.5px);
    }

    /* Fan glow behind sweep */
    .radar-fan {
      position: absolute;
      width: 0; height: 0;
      bottom: 0; left: 0;
      border-style: solid;
      border-width: 0 90px 320px 0;
      border-color: transparent rgba(255,120,26,0.06) transparent transparent;
      transform-origin: 0 100%;
      animation: spin 5s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    /* Rings */
    .ring {
      position: absolute; top: 0; left: 0;
      border-radius: 50%;
      border: 1px solid rgba(255,152,73,0.45);
      animation: ring-out 5s ease-out infinite;
    }
    .r1 { animation-delay: 0s; }
    .r2 { animation-delay: 1.25s; }
    .r3 { animation-delay: 2.5s; }
    .r4 { animation-delay: 3.75s; }

    @keyframes ring-out {
      0%   { width: 40px;  height: 40px;  transform: translate(-50%,-50%); opacity: 0.8; }
      100% { width: 900px; height: 900px; transform: translate(-50%,-50%); opacity: 0; }
    }

    /* Center dot */
    .center-dot {
      position: absolute; width: 10px; height: 10px;
      background: #ffb83d; border-radius: 50%;
      top: 0; left: 0; transform: translate(-50%,-50%);
      box-shadow: 0 0 8px #ff9849, 0 0 20px rgba(255,120,26,0.5);
      animation: dot-glow 2s ease-in-out infinite;
    }
    @keyframes dot-glow {
      0%,100% { box-shadow: 0 0 8px #ff9849, 0 0 20px rgba(255,120,26,0.4); }
      50%     { box-shadow: 0 0 14px #ffb83d, 0 0 36px rgba(255,120,26,0.7); }
    }

    /* ── OODA compass ──────────────────────────────────────── */
    .ooda-n, .ooda-e, .ooda-s, .ooda-w {
      position: absolute; display: flex; align-items: center; gap: 7px;
      opacity: 0; animation: ooda-in 1.2s ease forwards;
    }
    .ooda-n { top: 9%;    left: 50%; transform: translateX(-50%); flex-direction: column; animation-delay: 0.4s; }
    .ooda-e { right: 4%;  top: 50%;  transform: translateY(-50%);                         animation-delay: 0.7s; }
    .ooda-s { bottom: 9%; left: 50%; transform: translateX(-50%); flex-direction: column-reverse; animation-delay: 1.0s; }
    .ooda-w { left: 4%;   top: 50%;  transform: translateY(-50%); flex-direction: row-reverse; animation-delay: 1.3s; }
    @keyframes ooda-in { from { opacity: 0; } to { opacity: 1; } }

    .ooda-word {
      font-family: "JetBrains Mono", monospace;
      font-size: 11px; font-weight: 700;
      letter-spacing: 0.32em; text-transform: uppercase;
      color: rgba(255,152,73,0.65);
    }
    .compass-mark {
      font-size: 9px;
      color: rgba(255,120,26,0.4);
    }

    /* ── Side panels ───────────────────────────────────────── */
    .side-panel {
      position: absolute; top: 50%; transform: translateY(-50%);
      font-family: "JetBrains Mono", monospace;
      font-size: 10px; line-height: 1.85;
      opacity: 0;
    }
    .left-panel  { left: 2%;  animation: panel-left  1s ease 0.6s forwards; }
    .right-panel { right: 2%; animation: panel-right 1s ease 0.8s forwards; }
    @keyframes panel-left  {
      from { opacity: 0; transform: translate(-14px, -50%); }
      to   { opacity: 1; transform: translate(0, -50%); }
    }
    @keyframes panel-right {
      from { opacity: 0; transform: translate(14px, -50%); }
      to   { opacity: 1; transform: translate(0, -50%); }
    }

    .sp-head { font-size: 9px; letter-spacing: 0.2em; color: rgba(255,152,73,0.65); }
    .sp-head.sub { margin-top: 4px; }
    .sp-div  { color: rgba(200,180,138,0.18); letter-spacing: 0.05em; }
    .sp-row  { display: flex; gap: 14px; }
    .right-panel .sp-row { flex-direction: row-reverse; }
    .sk { color: rgba(200,180,138,0.35); }
    .sv { color: rgba(200,180,138,0.6); }
    .sv.hi   { color: rgba(255,184,61,0.9); font-weight: 700; }
    .sv.ok   { color: rgba(109,212,126,0.8); }
    .sv.warn { color: rgba(239,90,58,0.8); }
    .sp-big  { font-size: 17px; font-weight: 700; color: rgba(255,152,73,0.9);
               letter-spacing: 0.06em; margin: 3px 0; text-align: right; }
    .left-panel .sp-big { text-align: left; }

    /* ── Brand center ──────────────────────────────────────── */
    .brand-center {
      position: relative; z-index: 2;
      display: flex; flex-direction: column; align-items: center;
      gap: 3px; text-align: center;
    }
    .brand-logo {
      margin-bottom: 10px;
      filter: drop-shadow(0 0 24px rgba(255,120,26,0.5));
      opacity: 0;
      animation: brand-pop 1s cubic-bezier(0.34,1.56,0.64,1) 0.2s forwards;
    }
    @keyframes brand-pop {
      from { opacity: 0; transform: scale(0.7); }
      to   { opacity: 1; transform: scale(1); }
    }
    .brand-main {
      font-family: "JetBrains Mono", monospace;
      font-size: clamp(28px, 4vw, 46px);
      font-weight: 700; letter-spacing: 0.28em;
      color: #ece1c7;
      text-shadow: 0 0 50px rgba(255,120,26,0.25);
      opacity: 0;
      animation: brand-up 0.9s ease 0.4s forwards;
    }
    .brand-slash {
      font-size: clamp(20px, 3vw, 30px);
      color: rgba(255,152,73,0.55);
      opacity: 0;
      animation: brand-up 0.9s ease 0.55s forwards;
    }
    .brand-sub {
      font-family: "JetBrains Mono", monospace;
      font-size: clamp(14px, 2vw, 20px);
      letter-spacing: 0.22em; color: rgba(200,180,138,0.75);
      opacity: 0;
      animation: brand-up 0.9s ease 0.7s forwards;
    }
    @keyframes brand-up {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .brand-pill {
      margin-top: 14px;
      font-family: "JetBrains Mono", monospace;
      font-size: 11px; letter-spacing: 0.18em;
      color: rgba(255,152,73,0.8);
      border: 1px solid rgba(255,120,26,0.3);
      padding: 4px 16px; border-radius: 2px;
      opacity: 0;
      animation: brand-up 0.9s ease 0.9s forwards;
    }
    .brand-ooda {
      font-family: "JetBrains Mono", monospace;
      font-size: 10px; letter-spacing: 0.28em;
      color: rgba(200,180,138,0.35); margin-top: 8px;
      opacity: 0;
      animation: brand-up 0.9s ease 1.1s forwards;
    }
    .brand-version {
      font-size: 8.5px; letter-spacing: 0.14em;
      color: rgba(200,180,138,0.2); margin-top: 6px;
      opacity: 0;
      animation: brand-up 0.9s ease 1.3s forwards;
    }

    /* ── Bottom bar ────────────────────────────────────────── */
    .bottom-bar {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 10px 28px 18px;
      display: flex; flex-direction: column; gap: 8px;
      opacity: 0;
      animation: brand-up 0.8s ease 1.5s forwards;
    }
    .init-line {
      display: flex; align-items: center; gap: 10px;
    }
    .init-cursor {
      font-size: 9px; color: rgba(255,120,26,0.8);
      animation: cursor-blink 0.8s steps(1) infinite;
    }
    @keyframes cursor-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
    .init-text {
      font-family: "JetBrains Mono", monospace;
      font-size: 10px; letter-spacing: 0.1em;
      color: rgba(200,180,138,0.55);
    }
    .progress-track {
      height: 2px; background: rgba(255,120,26,0.1);
      border-radius: 1px; overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #ff5a00, #ff9849, #ffb83d);
      width: 0;
      animation: prog-fill 3.8s linear 0.3s forwards;
    }
    @keyframes prog-fill { to { width: 100%; } }
    .skip-hint {
      text-align: center;
      font-family: "JetBrains Mono", monospace;
      font-size: 8px; letter-spacing: 0.32em;
      color: rgba(200,180,138,0.22);
      animation: hint-blink 2s ease-in-out infinite;
    }
    @keyframes hint-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  `]
})
export class SplashComponent implements OnInit, OnDestroy {
  @Output() done = new EventEmitter<void>();

  exiting = false;
  phase   = 0;

  readonly phases = [
    'Initializing decision engine...',
    'Loading well inventory — 122 HAL wells, West Kuwait...',
    'Calibrating startup scoring model...',
    'Building intervention recommendation engine...',
    'Connecting ESP telemetry channel...',
    'All systems nominal — launching console.',
  ];

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit() {
    this.phases.forEach((_, i) => {
      this.timers.push(setTimeout(() => { this.phase = i; }, i * 640));
    });
    // Auto-exit after progress bar completes
    this.timers.push(setTimeout(() => this.exit(), 4600));
  }

  ngOnDestroy() { this.timers.forEach(clearTimeout); }

  skip() { this.exit(); }

  private exit() {
    if (this.exiting) return;
    this.exiting = true;
    setTimeout(() => this.done.emit(), 680);
  }
}
