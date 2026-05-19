'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Building2, X, ImagePlus, Upload } from 'lucide-react';
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
import { api, unwrap } from '@/lib/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface FacilityItem {
  id: string;
  name: string;
  description: string | null;
  photos: string[];
  order: number;
  isActive: boolean;
  createdAt: string;
}

interface FacilityFormData {
  name: string;
  description: string;
  photos: string[];
  order: number;
}

const EMPTY_FORM: FacilityFormData = {
  name: '',
  description: '',
  photos: [],
  order: 0,
};

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<FacilityFormData>({ ...EMPTY_FORM });
  const [photoInput, setPhotoInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleUploadPhoto = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/v1/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = unwrap<{ url?: string; secure_url?: string }>(res);
      const url = data.url || data.secure_url || '';
      if (url) setFormData((f) => ({ ...f, photos: [...f.photos, url] }));
      toast.success('Foto subida');
    } catch { toast.error('Error al subir foto'); }
    finally { setUploadingPhoto(false); }
  };

  const fetchFacilities = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/admin/facilities');
      const data = res as unknown as { data: FacilityItem[] };
      setFacilities(data.data);
    } catch {
      toast.error('Error al cargar instalaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const openCreate = () => {
    setEditing(null);
    setFormData({ ...EMPTY_FORM });
    setPhotoInput('');
    setDialogOpen(true);
  };

  const openEdit = (facility: FacilityItem) => {
    setEditing(facility.id);
    setFormData({
      name: facility.name,
      description: facility.description || '',
      photos: [...facility.photos],
      order: facility.order,
    });
    setPhotoInput('');
    setDialogOpen(true);
  };

  const addPhoto = () => {
    if (!photoInput.trim()) return;
    setFormData({ ...formData, photos: [...formData.photos, photoInput.trim()] });
    setPhotoInput('');
  };

  const removePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index),
    });
  };

  const handlePhotoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPhoto();
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await api.patch(`/api/v1/admin/facilities/${editing}`, formData);
        toast.success('Instalación actualizada');
      } else {
        await api.post('/api/v1/admin/facilities', formData);
        toast.success('Instalación creada');
      }
      setDialogOpen(false);
      fetchFacilities();
    } catch {
      toast.error(editing ? 'Error al actualizar' : 'Error al crear');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/v1/admin/facilities/${deleteId}`);
      toast.success('Instalación eliminada');
      fetchFacilities();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="md:space-y-6">
      <div className="reveal-up">
        <Header eyebrow="Landing" title="Instalaciones" description="Zonas y áreas físicas visibles en el landing">
          <button onClick={openCreate} className="btn-fire">
            <Plus className="h-4 w-4" strokeWidth={3} /> Nueva zona
          </button>
        </Header>
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Landing</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(28px, 8vw, 38px)' }}>
          INSTALACIONES
        </h1>
      </div>

      <div className="px-4 md:px-0">
      {loading ? (
        <div className="bg-card rounded-xl border border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-border animate-pulse" />
          ))}
        </div>
      ) : facilities.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No hay instalaciones creadas</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Agrega las zonas de tu gimnasio para la landing</p>
          <Button className="mt-4 bg-foreground hover:bg-primary/90 text-primary-foreground gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Crear instalación
          </Button>
        </div>
      ) : (
        <>
        {/* MOBILE: cards */}
        <div className="md:hidden space-y-2.5 anim-stagger">
          {facilities.map((facility) => (
            <div key={facility.id} className="mlist-card !items-start !flex-col !gap-2 !p-3.5">
              <div className="flex items-start gap-3 w-full">
                <div className="mlist-avatar" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontSize: '14px' }}>
                  {facility.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black leading-tight">{facility.name}</p>
                  {facility.description && (
                    <p className="text-[11px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{facility.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
                      style={{ background: facility.isActive ? 'rgba(22,163,74,0.12)' : 'rgba(115,115,115,0.12)', color: facility.isActive ? '#16A34A' : '#737373' }}>
                      {facility.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                      style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))' }}>
                      <ImagePlus className="h-2.5 w-2.5" />
                      {facility.photos.length} {facility.photos.length === 1 ? 'foto' : 'fotos'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 w-full pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                <button onClick={() => openEdit(facility)} className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                  style={{ background: 'hsl(var(--secondary))' }}>
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                <button onClick={() => setDeleteId(facility.id)} className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
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
                <TableHead className="font-semibold text-muted-foreground">Zona</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Descripción</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Fotos</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Estado</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilities.map((facility) => (
                <TableRow key={facility.id} className="hover:bg-secondary/50">
                  <TableCell className="font-medium text-foreground">{facility.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">
                    {facility.description || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      <ImagePlus className="h-3 w-3 mr-1" />
                      {facility.photos.length} foto{facility.photos.length !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={facility.isActive ? 'default' : 'secondary'}
                      className={facility.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                    >
                      {facility.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(facility)}
                        className="p-2 text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(facility.id)}
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
      <button onClick={openCreate} className="md:hidden mobile-fab" aria-label="Nueva zona">
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Diálogo para crear/editar instalación */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Instalación' : 'Nueva Instalación'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="facility-name">Nombre *</Label>
              <Input
                id="facility-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Zona de pesas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facility-desc">Descripción</Label>
              <Textarea
                id="facility-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe esta zona..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facility-order">Orden</Label>
              <Input
                id="facility-order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            {/* Fotos */}
            <div className="space-y-2">
              <Label>Fotos de la instalación</Label>
              <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,90,31,0.15)' }}>
                  <Upload className="h-5 w-5" style={{ color: '#FF5A1F' }} />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-black">{uploadingPhoto ? 'Subiendo…' : 'Click para subir foto'}</p>
                  <p className="text-[11px] text-muted-foreground">JPG, PNG, WebP · se sube a Cloudinary</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadPhoto(f); e.target.value = ''; }} />
              </label>
              <details className="text-[11px] text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">O pegar una URL directa</summary>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={photoInput}
                    onChange={(e) => setPhotoInput(e.target.value)}
                    onKeyDown={handlePhotoKeyDown}
                    placeholder="https://..."
                  />
                  <Button type="button" variant="outline" onClick={addPhoto}>Agregar</Button>
                </div>
              </details>
              {formData.photos.length > 0 && (
                <div className="space-y-2 mt-2">
                  {formData.photos.map((photo, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg bg-secondary border border-border"
                    >
                      <div className="w-10 h-10 rounded-md bg-muted overflow-hidden flex-shrink-0">
                        <img
                          src={photo}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground truncate flex-1">{photo}</span>
                      <button
                        onClick={() => removePhoto(i)}
                        className="text-muted-foreground/70 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
        title="¿Eliminar esta instalación?"
        description="Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
