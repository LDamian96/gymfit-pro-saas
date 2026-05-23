'use client';

import { useState, useEffect, useCallback } from 'react';
import { ScanLine, AlertTriangle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { cachedGet } from '@/lib/api';
import { useBranchContext } from '@/stores/branch-context-store';
import { BranchContextBadge } from '@/components/dashboard/branch-context-switcher';
import { toast } from 'sonner';

interface AttendanceRow {
  id: string;
  timestamp: string;
  isDuplicate: boolean;
  overLimit: boolean;
  memberName: string;
  avatar: string | null;
  weeklyVisitLimit: number | null;
  membershipFrequency: string | null;
  branch: { id: string; name: string } | null;
  scannedBy: string | null;
}

interface HistoryResp {
  items: AttendanceRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const FREQ_LABEL: Record<string, string> = {
  DAILY: 'Diario',
  INTERDAILY: 'Interdiario',
  CUSTOM: 'Personalizado',
  UNLIMITED: 'Ilimitado',
};

// YYYY-MM-DD de hoy en local.
function todayStr(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
function shiftDay(date: string, delta: number): string {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default function AttendancePage() {
  // Sede activa viene del CONTEXTO GLOBAL del sidebar.
  const branchFilter = useBranchContext((s) => s.activeBranchId);
  // Por defecto: HOY. Un solo día — se puede retroceder/avanzar o elegir fecha exacta.
  const [date, setDate] = useState(todayStr());
  const [page, setPage] = useState(1);
  const [data, setData] = useState<HistoryResp | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page, limit: 25 };
      if (branchFilter) params.branchId = branchFilter;
      // Un solo día: from = to = fecha elegida (el backend cubre hasta 23:59).
      if (date) { params.from = date; params.to = date; }
      const res = await cachedGet<{ data: HistoryResp }>('/api/v1/checkin/history', { params, ttl: 10_000 });
      // El backend devuelve { success, data: {...} } → cachedGet quita .data del axios,
      // queda { success, data }. Tomamos .data.
      const body = res as unknown as { data: HistoryResp };
      setData(body.data ?? (res as unknown as HistoryResp));
      setLoaded(true);
    } catch {
      toast.error('Error al cargar el historial');
      setLoaded(true);
    }
  }, [page, branchFilter, date]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => { setPage(1); }, [branchFilter, date]);

  const rows = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="md:space-y-6">
      <div className="reveal-up">
        <Header eyebrow="Asistencias" title="Historial" description="Todos los ingresos registrados, ordenados por fecha. Los que excedieron su plan salen marcados.">
          <BranchContextBadge />
        </Header>
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Asistencias</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          HISTORIAL
        </h1>
      </div>

      <div className="px-4 md:px-0 space-y-4">
        {/* Filtros de fecha — día por día (defecto HOY) */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
            <button onClick={() => setDate((d) => shiftDay(d, -1))}
              className="press w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary" aria-label="Día anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 px-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value || todayStr())}
                className="bg-transparent text-[13px] outline-none" aria-label="Fecha" />
            </div>
            <button disabled={date >= todayStr()} onClick={() => setDate((d) => shiftDay(d, 1))}
              className="press w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary disabled:opacity-30" aria-label="Día siguiente">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {date !== todayStr() && (
            <button onClick={() => setDate(todayStr())}
              className="text-[12px] font-black px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/70">
              Hoy
            </button>
          )}
          <div className="md:hidden">
            <BranchContextBadge />
          </div>
          {data && (
            <span className="ml-auto text-[12px] font-black text-muted-foreground tabular-nums">
              {data.total} ingresos · {new Date(date + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>

        {/* Tabla */}
        {loaded && rows.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <ScanLine className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-[14px] font-bold">Sin asistencias en este rango</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <th className="text-left px-4 py-3">Cliente</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Sede</th>
                    <th className="text-left px-4 py-3">Fecha</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Hora</th>
                    <th className="text-left px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const t = fmt(r.timestamp);
                    return (
                      <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/40">
                        <td className="px-4 py-3 font-bold">{r.memberName}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.branch?.name ?? '—'}</td>
                        <td className="px-4 py-3 tabular-nums">{t.date}</td>
                        <td className="px-4 py-3 tabular-nums hidden sm:table-cell text-muted-foreground">{t.time}</td>
                        <td className="px-4 py-3">
                          {r.overLimit ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wide" style={{ background: 'rgba(220,38,38,0.15)', color: '#DC2626' }}>
                              <AlertTriangle className="h-3 w-3" />
                              Vino · excedió{r.weeklyVisitLimit ? ` (máx ${r.weeklyVisitLimit}/sem)` : ''}
                            </span>
                          ) : r.isDuplicate ? (
                            <span className="inline-flex items-center text-[10px] font-black px-2 py-1 rounded uppercase tracking-wide bg-secondary text-muted-foreground">
                              Duplicado
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-black px-2 py-1 rounded uppercase tracking-wide" style={{ background: 'rgba(22,163,74,0.15)', color: '#16A34A' }}>
                              OK{r.membershipFrequency && FREQ_LABEL[r.membershipFrequency] ? ` · ${FREQ_LABEL[r.membershipFrequency]}` : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground tabular-nums">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="press w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 bg-card border border-border">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="press w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 bg-card border border-border">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
