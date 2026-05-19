'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface FaqItem { id: string; question: string; answer: string; order: number; }

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [order, setOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchFaqs = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/admin/faq');
      const data = res as unknown as { data: FaqItem[] };
      setFaqs(data.data);
    } catch { toast.error('Error al cargar FAQ'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  const openCreate = () => {
    setEditing(null);
    setQuestion('');
    setAnswer('');
    setOrder(faqs.length);
    setFormOpen(true);
  };

  const openEdit = (faq: FaqItem) => {
    setEditing(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setOrder(faq.order);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    setSubmitting(true);
    try {
      if (editing) {
        await api.patch(`/api/v1/admin/faq/${editing.id}`, { question, answer, order });
        toast.success('Pregunta actualizada');
      } else {
        await api.post('/api/v1/admin/faq', { question, answer, order });
        toast.success('Pregunta creada');
      }
      setFormOpen(false);
      fetchFaqs();
    } catch { toast.error('Error al guardar'); }
    finally { setSubmitting(false); }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try { await api.delete(`/api/v1/admin/faq/${deleteId}`); toast.success('Eliminada'); fetchFaqs(); }
    catch { toast.error('Error'); }
    finally { setDeleteId(null); }
  };

  return (
    <div className="md:space-y-6">
      <div className="reveal-up">
        <Header eyebrow="Landing" title="FAQ" description="Preguntas frecuentes que aparecen en la página de planes">
          <button onClick={openCreate} className="btn-fire">
            <Plus className="h-4 w-4" strokeWidth={3} /> Nueva pregunta
          </button>
        </Header>
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Landing</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          FAQ
        </h1>
      </div>

      {/* MOBILE: cards */}
      <div className="md:hidden px-4 space-y-2.5 anim-stagger">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-[88px] rounded-2xl skeleton-shimmer" />)
        ) : faqs.length === 0 ? (
          <div className="rounded-3xl py-12 px-6 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <p className="text-[13px] font-bold" style={{ color: 'hsl(var(--muted-foreground))' }}>No hay preguntas frecuentes</p>
          </div>
        ) : faqs.map((faq) => (
          <div key={faq.id} className="mlist-card !items-start !flex-col !gap-2 !p-3.5">
            <p className="text-[13px] font-black leading-tight">{faq.question}</p>
            <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{faq.answer}</p>
            <div className="flex items-center justify-end gap-1.5 w-full pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
              <button onClick={() => openEdit(faq)} className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                style={{ background: 'hsl(var(--secondary))' }}>
                <Pencil className="h-3 w-3" /> Editar
              </button>
              <button onClick={() => setDeleteId(faq.id)} className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                style={{ background: 'rgba(239,68,68,0.10)', color: '#EF4444' }}>
                <Trash2 className="h-3 w-3" /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP: tabla */}
      <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1.2fr_2fr_0.5fr] px-5 py-3 bg-secondary border-b border-border">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Pregunta</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Respuesta</span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Acciones</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Cargando...</div>
        ) : faqs.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No hay preguntas frecuentes</div>
        ) : (
          faqs.map((faq) => (
            <div key={faq.id} className="grid grid-cols-[1.2fr_2fr_0.5fr] items-center px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors">
              <span className="text-sm font-medium text-foreground">{faq.question}</span>
              <span className="text-sm text-muted-foreground truncate">{faq.answer}</span>
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => openEdit(faq)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteId(faq.id)} className="p-2 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Pregunta' : 'Nueva Pregunta'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Pregunta</label>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="¿Cuáles son los horarios?"
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary/50"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Respuesta</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Nuestros horarios son..."
                rows={4}
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary/50 resize-none"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Orden</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                {submitting ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar esta pregunta?"
        description="Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
      />

      {/* FAB móvil */}
      <button onClick={openCreate} className="md:hidden mobile-fab" aria-label="Nueva pregunta">
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}
