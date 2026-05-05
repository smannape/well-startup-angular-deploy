import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Well, Kpis, WellData, Workover } from '../models/well.model';

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  wells    = signal<Well[]>([]);
  kpis     = signal<Kpis | null>(null);
  woMap    = signal<Record<string, Workover[]>>({});
  loaded   = signal(false);

  load() {
    this.http.get<WellData>('assets/data/wells.json').subscribe(d => {
      this.wells.set(d.wells);
      this.kpis.set(d.kpis);
      this.loaded.set(true);
    });
    this.http.get<Record<string, Workover[]>>('assets/data/workovers.json').subscribe(d => {
      this.woMap.set(d);
    });
  }
}
