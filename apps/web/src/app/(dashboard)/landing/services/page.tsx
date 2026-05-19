'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { api, cachedGet, invalidateCache } from '@/lib/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  iconName: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  imageUrl: string;
  iconName: string;
  order: number;
}

const EMPTY_FORM: ServiceFormData = {
  name: '',
  description: '',
  imageUrl: '',
  iconName: '',
  order: 0,
};

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      const data = await cachedGet<{ data: ServiceItem[] }>('/api/v1/admin/services', { ttl: 60_000 });
      setServices(data.data);
    } catch {
      toast.error('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openCreate = () => {
    setEditing(null);
    setFormData({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (service: ServiceItem) => {
    setEditing(service.id);
    setFormData({
      name: service.name,
      description: service.description || '',
      imageUrl: service.imageUrl || '',
      iconName: service.iconName || '',
      order: service.order,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await api.patch(`/api/v1/admin/services/${editing}`, formData);
        toast.success('Servicio actualizado');
      } else {
        await api.post('/api/v1/admin/services', formData);
        toast.success('Servicio creado');
      }
      invalidateCache('/api/v1/admin/services');
      setDialogOpen(false);
      fetchServices();
    } catch {
      toast.error(editing ? 'Error al actualizar' : 'Error al crear');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/v1/admin/services/${deleteId}`);
      invalidateCache('/api/v1/admin/services');
      toast.success('Servicio eliminado');
      fetchServices();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="md:space-y-6">
      <div className="reveal-up">
        <Header eyebrow="Landing" title="Servicios" description="Servicios visibles en tu landing público">
          <button onClick={openCreate} className="btn-fire">
            <Plus className="h-4 w-4" strokeWidth={3} /> Nuevo servicio
          </button>
        </Header>
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Landing</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          SERVICIOS
        </h1>
      </div>

      <div className="px-4 md:px-0">
      {loading ? (
        <div className="bg-card rounded-xl border border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-border animate-pulse" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Star className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No hay servicios creados</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Crea tu primer servicio para mostrarlo en la landing</p>
          <Button className="mt-4 bg-foreground hover:bg-primary/90 text-primary-foreground gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Crear servicio
          </Button>
        </div>
      ) : (
        <>
        {/* MOBILE: lista de cards (la tabla desktop debajo está oculta en mobile) */}
        <div className="md:hidden space-y-2.5 anim-stagger">
          {services.map((service) => (
            <div key={service.id} className="mlist-card !items-start !flex-col !gap-2 !p-3.5">
              <div className="flex items-start gap-3 w-full">
                <div className="mlist-avatar" style={{ background: 'rgba(255,90,31,0.15)', color: '#FF5A1F', fontSize: '14px' }}>
                  {service.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black leading-tight">{service.name}</p>
                  {service.description && (
                    <p className="text-[11px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{service.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
                      style={{ background: service.isActive ? 'rgba(22,163,74,0.12)' : 'rgba(115,115,115,0.12)', color: service.isActive ? '#16A34A' : '#737373' }}>
                      {service.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    {service.iconName && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                        style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))' }}>
                        {service.iconName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 w-full pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                <button onClick={() => openEdit(service)} className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                  style={{ background: 'hsl(var(--secondary))' }}>
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                <button onClick={() => setDeleteId(service.id)} className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
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
                <TableHead className="font-semibold text-muted-foreground">Servicio</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Descripción</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Icono</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Estado</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id} className="hover:bg-secondary/50">
                  <TableCell className="font-medium text-foreground">{service.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">
                    {service.description || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {service.iconName || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={service.isActive ? 'default' : 'secondary'}
                      className={service.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                    >
                      {service.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(service)}
                        className="p-2 text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(service.id)}
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
      <button onClick={openCreate} className="md:hidden mobile-fab" aria-label="Nuevo servicio">
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Diálogo para crear/editar servicio */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Nombre *</Label>
              <Input
                id="service-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Musculación"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-desc">Descripción</Label>
              <Textarea
                id="service-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el servicio..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-icon">Nombre del icono</Label>
                <Input
                  id="service-icon"
                  value={formData.iconName}
                  onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                  placeholder="Ej: dumbbell"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-order">Orden</Label>
                <Input
                  id="service-order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-image">URL de imagen</Label>
              <Input
                id="service-image"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
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
        title="¿Eliminar este servicio?"
        description="Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
