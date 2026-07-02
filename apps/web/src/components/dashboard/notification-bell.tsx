'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Building, AlertTriangle, X, AlertOctagon, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api, cachedGet, invalidateCache } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

// Polling cada 15s. Si llegan nuevas notifs unread, además del badge,
// se dispara un toaster en vivo (estilo FB).
const POLL_INTERVAL = 15_000;

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // IDs ya notificados — para no spamear toast al re-polear.
  const seenIdsRef = useRef<Set<string>>(new Set());
  const armedRef = useRef(false);

  const fetchCount = useCallback(async () => {
    try {
      // cachedGet dedupe: el layout monta la campana 2 veces (mobile+desktop),
      // asi ambas instancias comparten UNA sola request por poll.
      const res = await cachedGet('/api/v1/notifications/unread-count', { ttl: 10_000 });
      const body = res as unknown as { data?: { count: number } };
      setUnread(body.data?.count ?? 0);
      // Trae también los últimos para detectar IDs nuevos.
      const listRes = await cachedGet('/api/v1/notifications?unread=true&limit=5', { ttl: 10_000 });
      const listBody = listRes as unknown as { data?: Notification[] };
      const list = Array.isArray(listBody.data) ? listBody.data : [];
      if (!armedRef.current) {
        // Primer poll: registrar todos los IDs sin dispararlos.
        list.forEach(n => seenIdsRef.current.add(n.id));
        armedRef.current = true;
        return;
      }
      // Buscar nuevos IDs y mostrar toaster.
      for (const n of list) {
        if (!seenIdsRef.current.has(n.id)) {
          seenIdsRef.current.add(n.id);
          if (n.type === 'OVER_WEEKLY_LIMIT') {
            toast.error(n.message, { description: n.title, duration: 6000 });
          } else if (n.type === 'CROSS_BRANCH_CHECKIN') {
            toast.warning(n.message, { description: n.title, duration: 6000 });
          } else if (n.type === 'MEMBER_CHECKIN') {
            toast.success(n.message, { duration: 4500 });
          } else {
            toast(n.title, { description: n.message, duration: 5000 });
          }
        }
      }
    } catch { /* silencio: la campana se ve sin badge si falla */ }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/notifications?limit=20');
      const body = res as unknown as { data?: Notification[] };
      setItems(Array.isArray(body.data) ? body.data : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchCount]);

  useEffect(() => { if (open) fetchList(); }, [open, fetchList]);

  // Cerrar al hacer click fuera del popover.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    try {
      await api.patch('/api/v1/notifications/read-all');
      invalidateCache('/api/v1/notifications'); // proximo poll trae fresco
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    } catch { /* ignore */ }
  };

  const markRead = async (id: string) => {
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
      invalidateCache('/api/v1/notifications');
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
      setUnread((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  };

  const iconFor = (type: string) => {
    if (type === 'CROSS_BRANCH_CHECKIN') return <Building className="h-4 w-4 text-amber-600" />;
    if (type === 'OVER_WEEKLY_LIMIT') return <AlertOctagon className="h-4 w-4" style={{ color: '#DC2626' }} />;
    if (type === 'MEMBER_CHECKIN') return <UserCheck className="h-4 w-4" style={{ color: 'var(--gym-lime)' }} />;
    return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
  };

  const timeAgo = (iso: string) => {
    const d = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - d);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} h`;
    const days = Math.floor(h / 24);
    return `${days} d`;
  };

  // Cuerpo común del popover/sheet — usado por desktop y mobile.
  const content = (
    <>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <p className="label-athletic text-[var(--gym-orange)]">/ Notificaciones</p>
          <p className="text-[12px] text-muted-foreground mt-1">{unread > 0 ? `${unread} sin leer` : 'Todo al día'}</p>
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button onClick={markAllRead} className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg hover:bg-secondary text-[var(--gym-orange)]">
              Marcar todo
            </button>
          )}
          <button onClick={() => setOpen(false)} className="press w-8 h-8 rounded-full flex items-center justify-center bg-secondary">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-[11px] text-muted-foreground">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-[13px] font-bold text-foreground">Sin notificaciones</p>
            <p className="text-[11px] text-muted-foreground mt-1">Aquí verás asistencias, cross-branch y alertas</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.readAt && markRead(n.id)}
                className={`w-full text-left px-5 py-3.5 flex items-start gap-3 hover:bg-secondary/40 transition-colors ${!n.readAt ? 'bg-primary/[0.05]' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-secondary">
                  {iconFor(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-foreground">{n.title}</p>
                  <p className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                  <p className="font-code text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.readAt && <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: 'var(--gym-orange)', boxShadow: '0 0 8px var(--gym-orange-glow)' }} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className="press relative p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-black flex items-center justify-center text-white"
            style={{ background: '#EF4444', boxShadow: '0 0 0 2px var(--card)' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Portal: en mobile sheet fullscreen, en desktop popover flotante anclado al viewport */}
      {open && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[150]"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
            onClick={() => setOpen(false)}
          />
          {/* DESKTOP: popover anclado top-right */}
          <div
            ref={popRef}
            onClick={(e) => e.stopPropagation()}
            className="hidden md:flex fixed top-16 right-6 w-[400px] max-h-[640px] rounded-2xl glass-card overflow-hidden z-[160] flex-col reveal-scale"
            style={{ boxShadow: '0 32px 80px -12px rgba(0,0,0,0.5)' }}
          >
            {content}
          </div>
          {/* MOBILE: sheet fullscreen estilo FB con safe-area */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="md:hidden fixed inset-x-0 bottom-0 top-12 rounded-t-[28px] bg-background border-t border-border z-[160] flex flex-col reveal-up"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              boxShadow: '0 -24px 64px -12px rgba(0,0,0,0.4)',
            }}
          >
            <div className="sheet-handle" />
            {content}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
