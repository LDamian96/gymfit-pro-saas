'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Building, MapPin, Phone, Users, ScanLine, X, Power } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { api, cachedGet, invalidateCache, unwrap } from '@/lib/api';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { toast } from 'sonner';

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { users: number; checkIns: number };
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await cachedGet<unknown>('/api/v1/branches', { ttl: 30_000 });
      const data = unwrap<Branch[]>(res);
      setBranches(Array.isArray(data) ? data : []);
    } catch {
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const openCreate = () => {
    setEditing(null);
    setName(''); setAddress(''); setPhone('');
    setFormOpen(true);
  };

  const openEdit = (b: Branch) => {
    setEditing(b);
    setName(b.name); setAddress(b.address || ''); setPhone(b.phone || '');
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      };
      if (editing) {
        await api.patch(`/api/v1/branches/${editing.id}`, body);
        toast.success('Sucursal actualizada');
      } else {
        await api.post('/api/v1/branches', body);
        toast.success('Sucursal creada');
      }
      invalidateCache('/api/v1/branches');
      setFormOpen(false);
      fetchBranches();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/v1/branches/${deleteId}`);
      invalidateCache('/api/v1/branches');
      toast.success('Sucursal desactivada');
      fetchBranches();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleteId(null);
    }
  };

  // Reactivar una sucursal inactiva (o desactivar una activa).
  const handleToggleActive = async (b: Branch) => {
    try {
      await api.patch(`/api/v1/branches/${b.id}`, { isActive: !b.isActive });
      invalidateCache('/api/v1/branches');
      toast.success(b.isActive ? 'Sucursal desactivada' : 'Sucursal activada');
      fetchBranches();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  return (
    <div className="md:space-y-6">
      <div className="reveal-up">
        <Header eyebrow="Locales" title="Sucursales" description="Gestiona los locales de tu gimnasio">
          <button onClick={openCreate} className="btn-fire">
            <Plus className="h-4 w-4" strokeWidth={3} /> Nueva sucursal
          </button>
        </Header>
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Locales</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          SUCURSALES
        </h1>
      </div>

      {!loading && branches.length === 0 && (
        <div className="text-center py-12 px-6 anim-fade">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: 'rgba(255,90,31,0.12)' }}>
            <Building className="h-7 w-7" style={{ color: '#FF5A1F' }} />
          </div>
          <p className="text-[14px] font-black mb-1">Sin sucursales registradas</p>
          <p className="text-[12px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Crea la primera sucursal para empezar a asignar staff y clientes.
          </p>
        </div>
      )}

      {!loading && branches.length > 0 && (
        <div className="px-4 md:px-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 anim-stagger" key={`branches-${branches.length}`}>
          {branches.map((b) => (
            <div key={b.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-all lift">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' }}>
                    <Building className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-black truncate">{b.name}</h3>
                    {!b.isActive && (
                      <span className="inline-flex mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-secondary text-muted-foreground">
                        Inactiva
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(b)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" title="Editar">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {b.isActive ? (
                    <button onClick={() => setDeleteId(b.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors" title="Desactivar">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button onClick={() => handleToggleActive(b)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg transition-colors" title="Activar sucursal">
                      <Power className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {b.address && (
                  <div className="flex items-start gap-2 text-[12px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /> <span className="break-words">{b.address}</span>
                  </div>
                )}
                {b.phone && (
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <Phone className="h-3.5 w-3.5 shrink-0" /> {b.phone}
                  </div>
                )}
                {!b.address && !b.phone && (
                  <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Sin dirección ni teléfono</p>
                )}
              </div>

              <div className="flex items-center gap-5 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <div>
                    <p className="text-[14px] font-black tabular-nums leading-none">{b._count?.users ?? 0}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Personal</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ScanLine className="h-3.5 w-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <div>
                    <p className="text-[14px] font-black tabular-nums leading-none">{b._count?.checkIns ?? 0}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Check-ins</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form sheet/modal */}
      {formOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center native-overlay" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={() => setFormOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="native-sheet md:anim-pop w-full md:max-w-[480px] md:rounded-3xl rounded-t-[28px] bg-card flex flex-col"
            style={{ maxHeight: '92vh', boxShadow: '0 -16px 48px -8px rgba(0,0,0,0.30)' }}>

            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="drag-handle" />
            </div>

            <div className="px-6 pt-4 pb-4 border-b border-border flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {editing ? 'Editando' : 'Nueva'}
                </p>
                <h3 className="text-[20px] font-black tracking-tight leading-tight">
                  {name || (editing ? 'Sucursal' : 'Sucursal nueva')}
                </h3>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} className="press w-9 h-9 rounded-xl flex items-center justify-center bg-secondary shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-[0.12em] mb-1.5 block">Nombre *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Sucursal Centro" required autoFocus
                  className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[14px] outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-[0.12em] mb-1.5 block">Dirección</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. Principal 123"
                  className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[14px] outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-[0.12em] mb-1.5 block">Teléfono</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="999 888 777" inputMode="tel"
                  className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[14px] outline-none focus:border-primary" />
              </div>
            </form>

            <div className="px-6 py-4 border-t border-border" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
              <button onClick={handleSubmit} disabled={submitting || !name.trim()}
                className="press w-full py-4 rounded-2xl text-white text-[14px] font-black uppercase tracking-[0.12em] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)', boxShadow: '0 12px 24px -8px rgba(255,90,31,0.50)' }}>
                {submitting ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear sucursal'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="¿Desactivar esta sucursal?" description="Se marcará como inactiva. No se eliminan sus asistencias ni staff." onConfirm={handleDelete} />

      <button onClick={openCreate} className="md:hidden mobile-fab" aria-label="Nueva sucursal">
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}
