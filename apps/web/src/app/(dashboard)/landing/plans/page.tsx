'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, CreditCard, X } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface PlanItem {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  createdAt: string;
}

interface PlanFormData {
  name: string;
  price: number;
  duration: string;
  features: string[];
  isPopular: boolean;
}

const EMPTY_FORM: PlanFormData = {
  name: '',
  price: 0,
  duration: '',
  features: [],
  isPopular: false,
};

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({ ...EMPTY_FORM });
  const [featureInput, setFeatureInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/admin/plans');
      const data = res as unknown as { data: PlanItem[] };
      setPlans(data.data);
    } catch {
      toast.error('Error al cargar planes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const openCreate = () => {
    setEditing(null);
    setFormData({ ...EMPTY_FORM });
    setFeatureInput('');
    setDialogOpen(true);
  };

  const openEdit = (plan: PlanItem) => {
    setEditing(plan.id);
    setFormData({
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      features: [...plan.features],
      isPopular: plan.isPopular,
    });
    setFeatureInput('');
    setDialogOpen(true);
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setFormData({ ...formData, features: [...formData.features, featureInput.trim()] });
    setFeatureInput('');
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const handleFeatureKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFeature();
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (formData.price <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }
    if (!formData.duration.trim()) {
      toast.error('La duración es obligatoria');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await api.patch(`/api/v1/admin/plans/${editing}`, formData);
        toast.success('Plan actualizado');
      } else {
        await api.post('/api/v1/admin/plans', formData);
        toast.success('Plan creado');
      }
      setDialogOpen(false);
      fetchPlans();
    } catch {
      toast.error(editing ? 'Error al actualizar' : 'Error al crear');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/v1/admin/plans/${deleteId}`);
      toast.success('Plan eliminado');
      fetchPlans();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="md:space-y-6">
      <div className="reveal-up">
        <Header eyebrow="Landing" title="Planes" description="Planes de suscripción visibles en el landing">
          <button onClick={openCreate} className="btn-fire">
            <Plus className="h-4 w-4" strokeWidth={3} /> Nuevo plan
          </button>
        </Header>
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Landing</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          PLANES
        </h1>
      </div>

      <div className="px-4 md:px-0">
      {loading ? (
        <div className="bg-card rounded-xl border border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-border animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No hay planes creados</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Crea tu primer plan para mostrarlo en la landing</p>
          <Button className="mt-4 bg-foreground hover:bg-primary/90 text-primary-foreground gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Crear plan
          </Button>
        </div>
      ) : (
        <>
        {/* MOBILE: cards */}
        <div className="md:hidden space-y-2.5 anim-stagger">
          {plans.map((plan) => (
            <div key={plan.id} className="mlist-card !items-start !flex-col !gap-2 !p-3.5">
              <div className="flex items-start gap-3 w-full">
                <div className="mlist-avatar" style={{ background: 'rgba(255,90,31,0.15)', color: '#FF5A1F', fontSize: '14px' }}>
                  {plan.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-black leading-tight">{plan.name}</p>
                    {plan.isPopular && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
                        style={{ background: 'rgba(255,90,31,0.15)', color: '#FF5A1F' }}>Popular</span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold mt-0.5 uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {plan.duration}
                  </p>
                  <span className="inline-block mt-1.5 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: plan.isActive ? 'rgba(22,163,74,0.12)' : 'rgba(115,115,115,0.12)', color: plan.isActive ? '#16A34A' : '#737373' }}>
                    {plan.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[16px] font-black tabular-nums leading-none" style={{ color: '#FF5A1F' }}>S/ {plan.price.toFixed(0)}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 w-full pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                <button onClick={() => openEdit(plan)} className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                  style={{ background: 'hsl(var(--secondary))' }}>
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                <button onClick={() => setDeleteId(plan.id)} className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                  style={{ background: 'rgba(239,68,68,0.10)', color: '#EF4444' }}>
                  <Trash2 className="h-3 w-3" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP: tabla */}
        <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary">
                <TableHead className="font-semibold text-muted-foreground">Plan</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Precio</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Duración</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Popular</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Estado</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id} className="hover:bg-secondary/50">
                  <TableCell className="font-medium text-foreground">{plan.name}</TableCell>
                  <TableCell className="text-foreground/80 font-semibold">
                    S/ {plan.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{plan.duration}</TableCell>
                  <TableCell>
                    {plan.isPopular ? (
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                        Popular
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/70 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={plan.isActive ? 'default' : 'secondary'}
                      className={plan.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                    >
                      {plan.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(plan)}
                        className="p-2 text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(plan.id)}
                        className="p-2 text-muted-foreground/70 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </>
      )}
      </div>{/* /wrapper móvil */}

      {/* FAB móvil */}
      <button onClick={openCreate} className="md:hidden mobile-fab" aria-label="Nuevo plan">
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Diálogo para crear/editar plan */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Plan' : 'Nuevo Plan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Nombre *</Label>
              <Input
                id="plan-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Plan Premium"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-price">Precio (S/) *</Label>
                <Input
                  id="plan-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="99.90"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-duration">Duración *</Label>
                <Input
                  id="plan-duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="Ej: 1 mes"
                />
              </div>
            </div>

            {/* Características */}
            <div className="space-y-2">
              <Label>Características</Label>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={handleFeatureKeyDown}
                  placeholder="Ej: Acceso ilimitado"
                />
                <Button type="button" variant="outline" onClick={addFeature}>
                  Agregar
                </Button>
              </div>
              {formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.features.map((feature, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                      {feature}
                      <button
                        onClick={() => removeFeature(i)}
                        className="ml-1 hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Popular switch */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Marcar como popular</p>
                <p className="text-xs text-muted-foreground">Se resaltará en la landing</p>
              </div>
              <Switch
                checked={formData.isPopular}
                onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-foreground hover:bg-primary/90 text-primary-foreground"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar este plan?"
        description="Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
