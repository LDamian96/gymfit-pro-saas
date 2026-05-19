'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Upload, Video, Dumbbell } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { api, cachedGet, invalidateCache, unwrap } from '@/lib/api';
import { useFocusRevalidate } from '@/hooks/use-focus-revalidate';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
}

interface MuscleGroupItem {
  id: string;
  name: string;
  icon: string | null;
  order: number;
  isActive: boolean;
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroupsList, setMuscleGroupsList] = useState<MuscleGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  // Nombres de grupos en orden, derivado del catálogo del tenant.
  const muscleGroups = muscleGroupsList.length > 0
    ? muscleGroupsList.map((g) => g.name)
    : ['Otro'];

  // Form
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchExercises = useCallback(async () => {
    try {
      const res = await cachedGet<unknown>('/api/v1/exercises', { ttl: 60_000 });
      const arr = unwrap<Exercise[]>(res);
      setExercises(Array.isArray(arr) ? arr : []);
    } catch { setExercises([]); }
    finally { setLoading(false); }
  }, []);

  const fetchMuscleGroups = useCallback(async (force = false) => {
    try {
      // TTL corto + opción de force: si el admin recién creó un grupo en /muscle-groups,
      // al volver acá queremos verlo ya, sin esperar 60s.
      if (force) invalidateCache('/api/v1/muscle-groups');
      const res = await cachedGet<unknown>('/api/v1/muscle-groups', { ttl: 5_000 });
      const arr = unwrap<MuscleGroupItem[]>(res);
      setMuscleGroupsList(Array.isArray(arr) ? arr : []);
    } catch { setMuscleGroupsList([]); }
  }, []);

  useEffect(() => { fetchExercises(); fetchMuscleGroups(); }, [fetchExercises, fetchMuscleGroups]);
  // Revalidar al volver a la pestaña: si el admin abrió /muscle-groups en otra pestaña
  // y creó un grupo, al volver acá lo verá sin reload manual.
  useFocusRevalidate(() => { fetchMuscleGroups(true); });

  const openCreate = () => {
    setEditing(null);
    // Refrescar grupos justo antes de abrir el form para garantizar lista actualizada.
    fetchMuscleGroups(true);
    setName('');
    setMuscleGroup(muscleGroupsList[0]?.name ?? '');
    setEquipment(''); setDescription('');
    setImageUrl(''); setVideoUrl('');
    setFormOpen(true);
  };

  const openEdit = (ex: Exercise) => {
    setEditing(ex);
    setName(ex.name); setMuscleGroup(ex.muscleGroup || ''); setEquipment(ex.equipment || '');
    setDescription(ex.description || ''); setImageUrl(ex.imageUrl || ''); setVideoUrl(ex.videoUrl || '');
    setFormOpen(true);
  };

  const handleUploadImage = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/v1/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = unwrap<{ url: string }>(res);
      setImageUrl(data.url || (data as unknown as { secure_url: string }).secure_url || '');
      toast.success('Imagen subida');
    } catch { toast.error('Error al subir imagen'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const body = {
        name, muscleGroup: muscleGroup || undefined, equipment: equipment || undefined,
        description: description || undefined, imageUrl: imageUrl || undefined, videoUrl: videoUrl || undefined,
      };
      if (editing) {
        await api.patch(`/api/v1/exercises/${editing.id}`, body);
        toast.success('Ejercicio actualizado');
      } else {
        await api.post('/api/v1/exercises', body);
        toast.success('Ejercicio creado');
      }
      invalidateCache('/api/v1/exercises');
      setFormOpen(false);
      fetchExercises();
    } catch { toast.error('Error al guardar'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await api.delete(`/api/v1/exercises/${deleteId}`); invalidateCache('/api/v1/exercises'); toast.success('Eliminado'); fetchExercises(); }
    catch { toast.error('Error al eliminar'); }
    finally { setDeleteId(null); }
  };

  const filtered = exercises.filter((ex) => {
    if (!filter) return true;
    return ex.muscleGroup === filter;
  });

  const grouped = filtered.reduce((acc, ex) => {
    const g = ex.muscleGroup || 'Otro';
    if (!acc[g]) acc[g] = [];
    acc[g].push(ex);
    return acc;
  }, {} as Record<string, Exercise[]>);

  return (
    <div className="md:space-y-6">
      <div className="reveal-up">
        <Header eyebrow="Catálogo" title="Ejercicios" description="Biblioteca compartida con imágenes y videos demostrativos">
          <button onClick={openCreate} className="btn-fire">
            <Plus className="h-4 w-4" strokeWidth={3} /> Nuevo ejercicio
          </button>
        </Header>
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Catálogo</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          EJERCICIOS
        </h1>
      </div>

      {/* Filtros por grupo muscular */}
      <div className="px-4 md:px-0 flex gap-2 overflow-x-auto pb-2 cm-no-scroll mb-3 md:mb-0 anim-lego" style={{ animationDelay: '60ms' }}>
        <button onClick={() => setFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${!filter ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'}`}>
          Todos ({exercises.length})
        </button>
        {muscleGroups.map((g) => {
          const count = exercises.filter((e) => e.muscleGroup === g).length;
          if (count === 0) return null;
          return (
            <button key={g} onClick={() => setFilter(g)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filter === g ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'}`}>
              {g} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid de ejercicios — sin skeleton, las cards aparecen directo tipo lego */}
      {!loading && (
        Object.entries(grouped).map(([group, exs], gi) => (
          <div key={group} className="px-4 md:px-0 anim-lego" style={{ animationDelay: `${gi * 60}ms` }}>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" /> {group}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6 anim-stagger-fast" key={`grp-${group}-${exs.length}`}>
              {exs.map((ex) => (
                <div key={ex.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all group">
                  {/* Imagen */}
                  <div className="relative h-28 bg-secondary">
                    {ex.imageUrl ? (
                      <Image src={ex.imageUrl} alt={ex.name} fill className="object-cover" sizes="200px" />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <Dumbbell className="h-8 w-8 text-muted-foreground/20" />
                      </div>
                    )}
                    {ex.videoUrl && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Video className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    {/* Actions — siempre visibles en mobile (no hay hover táctil), hover-only en desktop */}
                    <div className="absolute top-2 left-2 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(ex)} aria-label="Editar"
                        className="press w-7 h-7 bg-card/95 backdrop-blur rounded-md flex items-center justify-center text-foreground hover:text-[var(--gym-orange)] border border-border shadow-sm">
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                      <button onClick={() => setDeleteId(ex.id)} aria-label="Eliminar"
                        className="press w-7 h-7 bg-card/95 backdrop-blur rounded-md flex items-center justify-center text-red-500 border border-red-500/30 shadow-sm">
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <h4 className="text-sm font-bold text-foreground truncate">{ex.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{ex.equipment || 'Sin equipo'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Form — sheet bottom en mobile, modal en desktop */}
      {formOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center native-overlay" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={() => setFormOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="native-sheet md:anim-pop w-full md:max-w-[560px] md:rounded-3xl rounded-t-[28px] bg-card flex flex-col"
            style={{ maxHeight: '92vh', boxShadow: '0 -16px 48px -8px rgba(0,0,0,0.30)' }}>

            {/* Drag handle mobile */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="drag-handle" />
            </div>

            {/* Header */}
            <div className="px-6 pt-4 pb-4 border-b border-border flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {editing ? 'Editando' : 'Nuevo'}
                </p>
                <h3 className="text-[20px] font-black tracking-tight leading-tight">
                  {name || (editing ? 'Ejercicio' : 'Ejercicio nuevo')}
                </h3>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} className="press w-9 h-9 rounded-xl flex items-center justify-center bg-secondary shrink-0">
                <span className="text-lg leading-none">✕</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              {/* HERO — imagen grande arriba (drag & drop) */}
              <div className="relative">
                <label className="block w-full h-48 cursor-pointer relative overflow-hidden bg-secondary group">
                  {imageUrl ? (
                    <>
                      <Image src={imageUrl} alt="Preview" fill className="object-cover" sizes="560px" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[11px] font-black uppercase tracking-wider text-white bg-black/40 backdrop-blur px-2.5 py-1 rounded-full">
                          Cambiar imagen
                        </span>
                      </div>
                      <button type="button" onClick={(e) => { e.preventDefault(); setImageUrl(''); }}
                        className="absolute top-3 right-3 press w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
                        ✕
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center anim-float"
                        style={{ background: 'rgba(255,90,31,0.15)' }}>
                        <Upload className="h-6 w-6" style={{ color: '#FF5A1F' }} strokeWidth={2.5} />
                      </div>
                      <p className="text-[14px] font-black">{uploading ? 'Subiendo imagen…' : 'Toca para subir foto'}</p>
                      <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        JPG, PNG o WebP — opcional pero recomendado
                      </p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0])} disabled={uploading} />
                </label>
              </div>

              <div className="px-6 py-5 space-y-5">

                {/* Nombre + grupo */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Datos del ejercicio</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-[0.12em] mb-1.5 block">Nombre *</label>
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Press de banca con barra" required
                        className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[14px] outline-none focus:border-primary" />
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-[0.12em] mb-2 block">Grupo muscular</label>
                      {muscleGroupsList.length === 0 ? (
                        <a href="/muscle-groups" className="block px-3.5 py-3 rounded-xl border border-dashed border-border text-[12px] text-center"
                          style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Aún no tienes grupos musculares. <span style={{ color: '#FF5A1F' }} className="font-black">Crear ahora →</span>
                        </a>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5">
                          {muscleGroupsList.map((g) => (
                            <button key={g.id} type="button" onClick={() => setMuscleGroup(g.name)}
                              className={`press py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                                muscleGroup === g.name ? 'text-white' : 'bg-secondary'
                              }`}
                              style={muscleGroup === g.name ? {
                                background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)',
                                boxShadow: '0 4px 10px -2px rgba(255,90,31,0.45)',
                              } : { color: 'hsl(var(--foreground))' }}>
                              {g.icon && <span className="mr-1">{g.icon}</span>}{g.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-[0.12em] mb-1.5 block">Equipo</label>
                        <input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Barra, mancuernas…"
                          className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[14px] outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-[0.12em] mb-1.5 block">Notas</label>
                        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tip o variante"
                          className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[14px] outline-none focus:border-primary" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video opcional */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Video demostrativo (opcional)
                  </p>
                  {videoUrl ? (
                    <div className="relative rounded-2xl overflow-hidden bg-black">
                      <video src={videoUrl} className="w-full h-32 object-contain" preload="metadata" controls />
                      <button type="button" onClick={() => setVideoUrl('')}
                        className="absolute top-2 right-2 press w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="press flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,90,31,0.12)' }}>
                        <Video className="h-5 w-5" style={{ color: '#FF5A1F' }} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black">Subir video</p>
                        <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          MP4, WebM o MOV — máx 50MB
                        </p>
                      </div>
                      <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setUploading(true);
                          try {
                            const fd = new FormData();
                            fd.append('file', f);
                            const r = await api.post('/api/v1/upload/video?folder=exercises', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                            const d = unwrap<{ url: string }>(r);
                            setVideoUrl(d.url || (d as unknown as { secure_url: string }).secure_url || '');
                            toast.success('Video subido');
                          } catch { toast.error('Error al subir video (máx 50MB)'); }
                          finally { setUploading(false); }
                        }} />
                    </label>
                  )}
                </div>
              </div>
            </form>

            {/* Footer con botón grande */}
            <div className="px-6 py-4 border-t border-border" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
              <button onClick={handleSubmit} disabled={submitting || !name.trim()}
                className="press w-full py-4 rounded-2xl text-white text-[14px] font-black uppercase tracking-[0.12em] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)',
                  boxShadow: '0 12px 24px -8px rgba(255,90,31,0.50)',
                }}>
                {submitting ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear ejercicio'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="¿Eliminar ejercicio?" description="Se quitará de la biblioteca." onConfirm={handleDelete} />

      {/* FAB móvil */}
      <button onClick={openCreate} className="md:hidden mobile-fab" aria-label="Nuevo ejercicio">
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}
