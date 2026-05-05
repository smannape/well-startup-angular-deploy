import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Well, PRIORITY_COLORS } from '../models/well.model';

@Component({
  selector: 'app-well-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tbl-wrap">
      <table class="well-table">
        <thead>
          <tr>
            <th>P</th><th>Well</th><th>GC</th><th>Reservoir</th>
            <th>Reason</th><th>AL</th>
            <th style="text-align:right">Potential</th>
            <th style="text-align:right">WC%</th>
            <th style="text-align:right">WOs</th>
            <th style="text-align:right">Score</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let w of wells" [class.selected]="w.well_name===selectedWell"
            (click)="wellClick.emit(w.well_name)">
            <td><span class="priority-pill" [style.background]="colors[w.priority]">{{w.priority}}</span></td>
            <td class="well-cell">{{w.well_name}}</td>
            <td>{{w.facility}}</td>
            <td>{{w.reservoir}}</td>
            <td style="color:var(--beige-200)">{{w.reason_label}}</td>
            <td>{{w.al_method}}</td>
            <td style="text-align:right">{{w.potential_oil | number:'1.0-0'}}</td>
            <td style="text-align:right">{{w.latest_wc | number:'1.0-0'}}</td>
            <td style="text-align:right">{{w.wo_count}}</td>
            <td style="text-align:right;color:var(--warn)">{{w.startup_score | number:'1.1-1'}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .tbl-wrap { overflow:auto; height:100%; }
    .well-table { width:100%; border-collapse:collapse; font-size:11px; }
    .well-table thead th {
      position:sticky; top:0; background:var(--bg-2); text-align:left;
      font-size:10px; letter-spacing:.14em; text-transform:uppercase;
      color:var(--beige-300); padding:8px 10px; border-bottom:1px solid var(--border-1);
    }
    .well-table tbody td {
      padding:6px 10px; border-bottom:1px solid var(--border-1);
      font-family:"JetBrains Mono",monospace; color:var(--beige-100);
    }
    .well-table tbody tr { cursor:pointer; }
    .well-table tbody tr:hover { background:var(--bg-2); }
    .well-table tbody tr.selected { background:#ff7a1a1c; }
    .well-cell { color:var(--orange-300); font-weight:600; }
  `]
})
export class WellTableComponent {
  @Input() wells: Well[] = [];
  @Input() selectedWell = '';
  @Output() wellClick = new EventEmitter<string>();
  colors = PRIORITY_COLORS;
}
