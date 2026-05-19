'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, X } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { useAuthStore } from '@/stores/auth-store';
import { api, cachedGet, invalidateCache } from '@/lib/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface ProgressRecord {
  id: string; date: string; weight: number | null;
  waist: number | null; chest: number | null; arms: number | null;
  legs: number | null; hips: number | null; notes: string | null;
}

const FIELDS = [
  { key: 'weight' as const, label: 'Peso', unit: 'kg', ph: '75' },
  { key: 'chest' as const, label: 'Pecho', unit: 'cm', ph: '95' },
  { key: 'arms' as const, label: 'Brazos', unit: 'cm', ph: '32' },
  { key: 'waist' as const, label: 'Cintura', unit: 'cm', ph: '80' },
  { key: 'legs' as const, label: 'Piernas', unit: 'cm', ph: '55' },
  { key: 'hips' as const, label: 'Cadera', unit: 'cm', ph: '90' },
];
const FONT = "'Plus Jakarta Sans', Inter, sans-serif";

export default function MyMeasurementsPage() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!user?.memberId) return;
    try {
      const res = await cachedGet<unknown>(`/api/v1/progress/${user.memberId}`, { ttl: 30_000 });
      const body = res as unknown as Record<string, unknown>;
      let arr: ProgressRecord[] = [];
      if (Array.isArray(body.data)) arr = body.data as ProgressRecord[];
      else if (body.data && typeof body.data === 'object' && Array.isArray((body.data as Record<string, unknown>).data))
        arr = (body.data as Record<string, unknown>).data as ProgressRecord[];
      setRecords(arr);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }, [user?.memberId]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.memberId) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { memberId: user.memberId };
      FIELDS.forEach(f => { if (formData[f.key]) body[f.key] = parseFloat(formData[f.key]); });
      if (notes) body.notes = notes;
      await api.post('/api/v1/progress', body);
      invalidateCache('/api/v1/progress');
      toast.success('Medidas registradas');
      setShowForm(false); setFormData({}); setNotes('');
      fetchRecords();
    } catch { toast.error('Error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await api.delete(`/api/v1/progress/${deleteId}`); invalidateCache('/api/v1/progress'); toast.success('Eliminado'); fetchRecords(); }
    catch { toast.error('Error'); }
    finally { setDeleteId(null); }
  };

  const getDiff = (curr: number | null, prev: number | null) => curr && prev ? curr - prev : null;

  return (
    <>
      {/* ===== MOBILE ===== */}
      <div className="md:hidden">
        {/* Header */}
        <div className="px-5 pt-2 pb-3 flex items-end justify-between reveal-up">
          <div>
            <p className="label-athletic text-[var(--gym-orange)]">/ Control corporal</p>
            <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
              MEDIDAS
            </h1>
          </div>
          <button onClick={() => setShowForm(true)}
            className="press fire-card w-12 h-12 rounded-2xl flex items-center justify-center">
            <Plus className="h-6 w-6 text-white" strokeWidth={3} />
          </button>
        </div>

        {loading ? (
          <div className="px-4 mt-4 space-y-3">
            <div className="h-44 rounded-3xl cm-skeleton" style={{ background: 'hsl(var(--secondary))' }} />
            <div className="grid grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl cm-skeleton" style={{ background: 'hsl(var(--secondary))' }} />)}</div>
          </div>
        ) : records.length === 0 ? (
          <div className="px-4 mt-6">
            <div className="cm-card rounded-3xl p-10 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" strokeWidth="2" strokeLinecap="round"><path d="M3 20h18M7 20V10M12 20V4M17 20v-8"/></svg>
              </div>
              <h3 className="text-[16px] font-black tracking-tight">Sin registros aún</h3>
              <p className="text-[12px] mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Empieza a trackear tu progreso</p>
              <button onClick={() => setShowForm(true)}
                className="mt-5 px-6 py-3 rounded-full text-[12px] font-black uppercase tracking-wider text-white"
                style={{ background: '#FF5A1F' }}>
                Registrar ahora
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Peso hero — negro brutal */}
            {records[0].weight && (
              <div className="px-4 mt-2 cm-anim-slide">
                <div className="relative overflow-hidden rounded-[28px] p-5" style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' }}>
                  <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl" style={{ background: 'rgba(255,90,31,0.3)' }} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF5A1F' }} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-white">Peso actual</span>
                      </div>
                      <span className="text-[10px] font-black uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {new Date(records[0].date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-[72px] font-black leading-[0.85] text-white tracking-tight">{records[0].weight}</span>
                      <div className="flex flex-col items-start pb-3 gap-2">
                        <span className="text-[18px] font-black" style={{ color: 'hsl(var(--muted-foreground))' }}>kg</span>
                        {records[1]?.weight && (() => {
                          const d = records[0].weight! - records[1].weight!;
                          return (
                            <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: d <= 0 ? 'rgba(22,163,74,0.2)' : 'rgba(239,68,68,0.2)' }}>
                              {d <= 0 ? <TrendingDown className="h-3 w-3" style={{ color: '#16A34A' }} strokeWidth={3} /> : <TrendingUp className="h-3 w-3" style={{ color: '#EF4444' }} strokeWidth={3} />}
                              <span className="text-[10px] font-black" style={{ color: d <= 0 ? '#16A34A' : '#EF4444' }}>{d.toFixed(1)}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid medidas */}
            <div className="px-4 mt-4 cm-anim-slide" style={{ animationDelay: '0.05s' }}>
              <p className="text-[14px] font-black tracking-tight mb-3 px-1">Medidas corporales</p>
              <div className="grid grid-cols-2 gap-3">
                {FIELDS.filter(f => f.key !== 'weight' && records[0][f.key]).map(f => {
                  const diff = getDiff(records[0][f.key], records[1]?.[f.key] ?? null);
                  return (
                    <div key={f.key} className="cm-card rounded-2xl p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.1em]" style={{ color: 'hsl(var(--muted-foreground))' }}>{f.label}</p>
                      <div className="flex items-end gap-1 mt-2">
                        <span className="text-[28px] font-black leading-none tracking-tight">{records[0][f.key]}</span>
                        <span className="text-[11px] font-black pb-0.5" style={{ color: '#A3A3A3' }}>{f.unit}</span>
                      </div>
                      {diff !== null && (
                        <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 mt-2" style={{ background: diff <= 0 ? '#DCFCE7' : '#FEE2E2' }}>
                          {diff <= 0 ? <TrendingDown className="h-2.5 w-2.5" style={{ color: '#16A34A' }} strokeWidth={3} /> : <TrendingUp className="h-2.5 w-2.5" style={{ color: '#EF4444' }} strokeWidth={3} />}
                          <span className="text-[9px] font-black" style={{ color: diff <= 0 ? '#16A34A' : '#EF4444' }}>{diff > 0 ? '+' : ''}{diff.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Historial */}
            {records.length > 1 && (
              <div className="px-4 mt-5 cm-anim-slide" style={{ animationDelay: '0.1s' }}>
                <p className="text-[14px] font-black tracking-tight mb-3 px-1">Historial <span className="text-[11px] font-bold" style={{ color: 'hsl(var(--muted-foreground))' }}>({records.length - 1})</span></p>
                <div className="cm-card rounded-2xl overflow-hidden">
                  {records.slice(1, 6).map((r, i, arr) => (
                    <div key={r.id} className={`flex items-center gap-3 p-4 ${i < arr.length - 1 ? 'border-b' : ''}`} style={{ borderColor: '#F5F5F7' }}>
                      <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ background: 'hsl(var(--secondary))' }}>
                        <span className="text-[13px] font-black leading-none">{new Date(r.date).getDate()}</span>
                        <span className="text-[7px] font-black uppercase mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {new Date(r.date).toLocaleDateString('es-PE', { month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-black">{new Date(r.date).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {r.weight && <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{ background: '#FFEDD5', color: '#FF5A1F' }}>{r.weight}kg</span>}
                          {r.waist && <span className="text-[10px] font-bold" style={{ color: 'hsl(var(--muted-foreground))' }}>Cintura {r.waist}</span>}
                        </div>
                      </div>
                      <button onClick={() => setDeleteId(r.id)} className="p-2" style={{ color: '#A3A3A3' }}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-4" />
          </>
        )}

        {/* Bottom sheet form */}
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-end">
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} onClick={() => setShowForm(false)} />
            <div className="relative w-full rounded-t-[28px] max-h-[88vh] overflow-y-auto reveal-up bg-card border-t border-border"
              style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                boxShadow: '0 -24px 64px -12px rgba(0,0,0,0.4)',
              }}>
              <div className="sheet-handle" />
              <div className="px-5 pb-6 pt-2">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="label-athletic text-[var(--gym-orange)]">/ Nueva medición</p>
                    <h3 className="font-display text-[22px] tracking-tight mt-1 text-foreground">Tus medidas hoy</h3>
                  </div>
                  <button onClick={() => setShowForm(false)} className="press w-9 h-9 rounded-full flex items-center justify-center bg-secondary border border-border text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    {FIELDS.map(f => (
                      <div key={f.key} className={f.key === 'weight' ? 'col-span-2' : ''}>
                        <label className="label-athletic text-muted-foreground mb-1.5 block">{f.label} ({f.unit})</label>
                        <input type="number" step="0.1" value={formData[f.key] || ''}
                          onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                          placeholder={f.ph}
                          className="w-full px-4 py-3 rounded-xl text-[14px] font-bold outline-none bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="label-athletic text-muted-foreground mb-1.5 block">Notas</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Observaciones…"
                      className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowForm(false)}
                      className="btn-ghost flex-1">Cancelar</button>
                    <button type="submit" disabled={submitting}
                      className="btn-fire flex-1 disabled:opacity-50">
                      {submitting ? 'Guardando…' : 'Registrar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== DESKTOP ===== */}
      <div className="hidden md:block space-y-6">
        <div className="flex items-end justify-between reveal-up">
          <div>
            <p className="label-athletic text-[var(--gym-orange)] mb-2">/ Control corporal</p>
            <h1 className="font-display tracking-tight leading-[0.92] text-foreground" style={{ fontSize: 'clamp(36px, 4.5vw, 56px)' }}>
              MIS MEDIDAS
            </h1>
            <p className="text-[14px] text-muted-foreground mt-2 max-w-xl">Registra y sigue la evolución de tu cuerpo</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-fire">
            <Plus className="h-4 w-4" strokeWidth={3} />
            Registrar medida
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-[1fr_400px] gap-5">
            <div className="h-64 rounded-3xl cm-skeleton bg-secondary" />
            <div className="h-64 rounded-3xl cm-skeleton bg-secondary" />
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-3xl p-16 text-center bg-card border border-border">
            <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" strokeWidth="2" strokeLinecap="round"><path d="M3 20h18M7 20V10M12 20V4M17 20v-8"/></svg>
            </div>
            <h3 className="text-[22px] font-black tracking-tight">Sin registros aún</h3>
            <p className="text-sm mt-2 text-muted-foreground">Empieza a trackear tu progreso corporal</p>
            <button onClick={() => setShowForm(true)}
              className="mt-6 px-6 py-3 rounded-full text-[12px] font-black uppercase tracking-wider text-white"
              style={{ background: '#FF5A1F' }}>
              Registrar primera medida
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_420px] gap-5">
            {/* Columna izq — Hero peso + Grid medidas */}
            <div className="space-y-5">
              {records[0].weight && (
                <div className="relative overflow-hidden rounded-3xl p-8" style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)', border: '1px solid #27272A' }}>
                  <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl" style={{ background: 'rgba(255,90,31,0.3)' }} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-5">
                      <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'rgba(255,90,31,0.15)' }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF5A1F' }} />
                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#FF5A1F' }}>Peso actual</span>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
                        {new Date(records[0].date).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-end gap-3">
                      <span className="text-[120px] font-black leading-[0.85] text-white tracking-tight">{records[0].weight}</span>
                      <div className="flex flex-col items-start pb-6 gap-2">
                        <span className="text-[28px] font-black" style={{ color: '#71717A' }}>kg</span>
                        {records[1]?.weight && (() => {
                          const d = records[0].weight! - records[1].weight!;
                          return (
                            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: d <= 0 ? 'rgba(132,204,22,0.2)' : 'rgba(244,63,94,0.2)' }}>
                              {d <= 0 ? <TrendingDown className="h-3.5 w-3.5" style={{ color: '#84CC16' }} strokeWidth={3} /> : <TrendingUp className="h-3.5 w-3.5" style={{ color: '#F43F5E' }} strokeWidth={3} />}
                              <span className="text-[11px] font-black" style={{ color: d <= 0 ? '#84CC16' : '#F43F5E' }}>{d.toFixed(1)} kg</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <p className="text-[13px] font-semibold mt-4" style={{ color: '#A1A1AA' }}>
                      {records.length} mediciones registradas
                    </p>
                  </div>
                </div>
              )}

              {/* Grid medidas */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.15em] mb-3 text-muted-foreground">Medidas corporales</p>
                <div className="grid grid-cols-3 gap-3">
                  {FIELDS.filter(f => f.key !== 'weight' && records[0][f.key]).map(f => {
                    const diff = getDiff(records[0][f.key], records[1]?.[f.key] ?? null);
                    return (
                      <div key={f.key} className="bg-card rounded-2xl p-5 border border-border">
                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">{f.label}</p>
                        <div className="flex items-end gap-1 mt-2">
                          <span className="text-[34px] font-black leading-none tracking-tight">{records[0][f.key]}</span>
                          <span className="text-[12px] font-black pb-1 text-muted-foreground">{f.unit}</span>
                        </div>
                        {diff !== null && (
                          <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 mt-2" style={{ background: diff <= 0 ? 'rgba(132,204,22,0.15)' : 'rgba(244,63,94,0.15)' }}>
                            {diff <= 0 ? <TrendingDown className="h-2.5 w-2.5" style={{ color: '#84CC16' }} strokeWidth={3} /> : <TrendingUp className="h-2.5 w-2.5" style={{ color: '#F43F5E' }} strokeWidth={3} />}
                            <span className="text-[9px] font-black" style={{ color: diff <= 0 ? '#84CC16' : '#F43F5E' }}>{diff > 0 ? '+' : ''}{diff.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Columna derecha — Historial */}
            <div className="bg-card rounded-3xl border border-border overflow-hidden">
              <div className="px-6 py-5 border-b border-border">
                <h3 className="text-[15px] font-black tracking-tight">Historial completo</h3>
                <p className="text-[11px] font-bold mt-1 text-muted-foreground">{records.length} registros</p>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {records.map((r, i) => (
                  <div key={r.id} className={`px-6 py-4 flex items-start gap-3 ${i < records.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0"
                      style={{ background: i === 0 ? '#FF5A1F' : 'hsl(var(--muted))' }}>
                      <span className="text-[11px] font-black leading-none" style={{ color: i === 0 ? '#FFFFFF' : undefined }}>{new Date(r.date).getDate()}</span>
                      <span className="text-[7px] font-black uppercase mt-0.5" style={{ color: i === 0 ? 'rgba(255,255,255,0.8)' : undefined }}>
                        {new Date(r.date).toLocaleDateString('es-PE', { month: 'short' })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-black">
                        {new Date(r.date).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {FIELDS.filter(f => r[f.key]).map(f => (
                          <span key={f.key} className="text-[10px] font-black px-2 py-0.5 rounded-md" style={{
                            background: f.key === 'weight' ? 'rgba(255,90,31,0.15)' : 'hsl(var(--secondary))',
                            color: f.key === 'weight' ? '#FF5A1F' : undefined,
                          }}>
                            {f.label}: {r[f.key]}{f.unit}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setDeleteId(r.id)} className="p-1.5 text-muted-foreground hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)} title="¿Eliminar?" description="Se eliminará esta medición" onConfirm={handleDelete} />
    </>
  );
}
