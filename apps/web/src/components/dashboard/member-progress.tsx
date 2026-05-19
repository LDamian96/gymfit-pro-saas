'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, ArrowLeft, Ruler } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ProgressRecord {
  id: string;
  date: string;
  weight: number | null;
  waist: number | null;
  chest: number | null;
  arms: number | null;
  legs: number | null;
  hips: number | null;
  notes: string | null;
}

interface MemberProgressProps {
  memberId: string;
  memberName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberProgress({ memberId, memberName, open, onOpenChange }: MemberProgressProps) {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [arms, setArms] = useState('');
  const [legs, setLegs] = useState('');
  const [hips, setHips] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/progress/${memberId}`);
      const body = res as unknown as Record<string, unknown>;
      let arr: ProgressRecord[] = [];
      if (Array.isArray(body.data)) arr = body.data as ProgressRecord[];
      else if (body.data && typeof body.data === 'object' && Array.isArray((body.data as Record<string, unknown>).data)) {
        arr = (body.data as Record<string, unknown>).data as ProgressRecord[];
      }
      setRecords(arr);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }, [memberId]);

  useEffect(() => {
    if (open) { setView('list'); fetchRecords(); }
  }, [open, fetchRecords]);

  const openForm = () => {
    setWeight(''); setWaist(''); setChest(''); setArms(''); setLegs(''); setHips(''); setNotes('');
    setView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/v1/progress', {
        memberId,
        weight: weight ? parseFloat(weight) : undefined,
        waist: waist ? parseFloat(waist) : undefined,
        chest: chest ? parseFloat(chest) : undefined,
        arms: arms ? parseFloat(arms) : undefined,
        legs: legs ? parseFloat(legs) : undefined,
        hips: hips ? parseFloat(hips) : undefined,
        notes: notes || undefined,
      });
      toast.success('Medidas registradas');
      setView('list');
      fetchRecords();
    } catch { toast.error('Error al registrar'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await api.delete(`/api/v1/progress/${deleteId}`); toast.success('Eliminado'); fetchRecords(); }
    catch { toast.error('Error'); }
    finally { setDeleteId(null); }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {view === 'form' ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => setView('list')} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
                  <span>Registrar Medidas</span>
                </div>
              ) : (
                <>
                  <span>Medidas — {memberName}</span>
                  <button onClick={openForm} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90">
                    <Plus className="h-3.5 w-3.5" /> Registrar
                  </button>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Form */}
          {view === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Peso */}
              <div>
                <label className="text-xs font-bold text-foreground">Peso (kg)</label>
                <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="75.5"
                  className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:border-primary/50" />
              </div>

              {/* Medidas corporales */}
              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1"><Ruler className="h-3 w-3" /> Medidas corporales (cm)</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Cintura</label>
                    <input type="number" step="0.1" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="80"
                      className="w-full px-2.5 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Pecho</label>
                    <input type="number" step="0.1" value={chest} onChange={(e) => setChest(e.target.value)} placeholder="95"
                      className="w-full px-2.5 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Brazos</label>
                    <input type="number" step="0.1" value={arms} onChange={(e) => setArms(e.target.value)} placeholder="32"
                      className="w-full px-2.5 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Piernas</label>
                    <input type="number" step="0.1" value={legs} onChange={(e) => setLegs(e.target.value)} placeholder="55"
                      className="w-full px-2.5 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Cadera</label>
                    <input type="number" step="0.1" value={hips} onChange={(e) => setHips(e.target.value)} placeholder="90"
                      className="w-full px-2.5 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:border-primary/50" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Notas</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Observaciones..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary/50 resize-none" />
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setView('list')} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary">Cancelar</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50">
                  {submitting ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          )}

          {/* Lista */}
          {view === 'list' && (
            <>
              {loading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Cargando...</div>
              ) : records.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Sin registros. ¡Registra las primeras medidas!</div>
              ) : (
                <div className="space-y-2">
                  {records.map((r) => (
                    <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(r.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {r.weight && <span className="text-xs"><span className="text-muted-foreground">Peso:</span> <span className="font-bold text-foreground">{r.weight}kg</span></span>}
                          {r.waist && <span className="text-xs"><span className="text-muted-foreground">Cintura:</span> <span className="font-bold text-foreground">{r.waist}cm</span></span>}
                          {r.chest && <span className="text-xs"><span className="text-muted-foreground">Pecho:</span> <span className="font-bold text-foreground">{r.chest}cm</span></span>}
                          {r.arms && <span className="text-xs"><span className="text-muted-foreground">Brazos:</span> <span className="font-bold text-foreground">{r.arms}cm</span></span>}
                          {r.legs && <span className="text-xs"><span className="text-muted-foreground">Piernas:</span> <span className="font-bold text-foreground">{r.legs}cm</span></span>}
                          {r.hips && <span className="text-xs"><span className="text-muted-foreground">Cadera:</span> <span className="font-bold text-foreground">{r.hips}cm</span></span>}
                        </div>
                        {r.notes && <p className="text-[10px] text-muted-foreground mt-1 italic">{r.notes}</p>}
                      </div>
                      <button onClick={() => setDeleteId(r.id)} className="p-1.5 text-muted-foreground hover:text-red-600 rounded-lg shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="¿Eliminar registro?" description="Se eliminará esta medición." onConfirm={handleDelete} />
    </>
  );
}
