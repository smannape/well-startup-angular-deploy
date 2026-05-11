export interface Well {
  well_name: string; field: string; reservoir: string; facility: string;
  priority: string; priority_label: string; reason_label: string; startup_score: number;
  al_method: string; contractor: string; well_type: string; team: string;
  latest_oil: number; latest_liquid: number; latest_wc: number; latest_gor: number;
  expected_oil: number; potential_oil: number; allowable_rate: number;
  latest_pgor_date: string; esp_run_life: number;
  install_date: string; commission_date: string; last_imp_activity: string;
  operational_status_date: string; closed_action_activity: string; closed_action_status: string;
  perf_top: number; perf_bottom: number; perforation_count: number; api_gravity: number;
  formations: string; wo_count: number;
  pe_comment: string; re_comment: string; fd_action_plan: string;
  x: number; y: number;
  /* ── Geo (computed from UTM 38N -> WGS84) ── */
  lat?: number; lon?: number;
  /* ── Well test history derived ── */
  recent_highest_oil?: number | null;
  recent_highest_oil_date?: string | null;
  oil_trend_pct?: number | null;
  /* ── Option-2 production-profile priority ── */
  priority_v2?: string | null;
  priority_v2_label?: string | null;
  /* ── WK Wells Review fields (from Excel) ── */
  h2s_ppm?: number | null;
  well_category?: string | null;
  pump_status_review?: string | null;
  remarks_review?: string | null;
  recommendation_review?: string | null;
  erl_pct?: number | null;
}

export interface Kpis {
  total_closed_wells: number; total_open_wells: number; total_wells_inventory: number;
  potential_oil_total_bopd: number;
  by_priority: Record<string, number>;
  potential_by_priority: Record<string, number>;
  by_facility: Record<string, number>;
  by_reason: Record<string, number>;
  by_priority_v2?: Record<string, number>;
  potential_by_priority_v2?: Record<string, number>;
}

export interface WellData { kpis: Kpis; wells: Well[]; }

export interface Workover {
  activity_type: string; activity_code: string;
  start_date: string; end_date: string;
  purpose: string; summary: string;
}

export interface WellTest {
  date: string;
  wh_press: number | null;
  wh_temp: number | null;
  flow_line_pressure: number | null;
  liquid_daily_rate: number | null;
  oil_daily_rate: number | null;
  gas_daily_rate: number | null;
  water_cut_percent: number | null;
  gas_oil_ratio: number | null;
  pip: number | null;
  pdp: number | null;
  frequency: number | null;
}

export const PRIORITY_COLORS: Record<string, string> = {
  P1: '#ffb83d', P2: '#ff9849', P3: '#cf6b3a', P4: '#8a4a2b', P5: '#4a3a30'
};

export const PRIORITY_DESC: Record<string, string> = {
  P1: 'Closed due to GC gathering capacity only — no downhole issues. Restart requires only an operations order. Highest recoverable oil with zero intervention cost.',
  P2: 'Requires surface or ESP intervention (changeout, resize, cable repair). Rigless operation, typically 1–3 days with HAL crew. High confidence on oil recovery.',
  P3: 'Requires rigless downhole workover via coiled tubing or wireline (acid job, sand control, scale treatment, tubing repair). 3–7 days. Good economics.',
  P4: 'Full rig workover needed (casing patch, reperforation, fish-in-hole, sidetrack). Higher cost and longer lead time. Justify with expected oil rate.',
  P5: 'Complex cases on hold pending reservoir engineering study or economic review. Do not commit resources until RE assessment complete.'
};

/* Production-Profile priority (Option 2) — based on oil rate, water cut, GOR and decline trend */
export const PRIORITY_DESC_V2: Record<string, string> = {
  P1: 'High oil rate, low water cut and low GOR. Stable or improving trend. Best-in-class producer — bring on first.',
  P2: 'Medium oil rate, medium water cut and medium GOR. Mid-tier production profile — second wave.',
  P3: 'Low oil, low water cut and low GOR (or declining trend). Marginal producer — review economics before startup.'
};
