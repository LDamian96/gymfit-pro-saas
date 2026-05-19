'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, MessageCircle, Pencil, ExternalLink } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  phone: string | null;
  email: string | null;
  emailDomain: string | null;
  address: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [address, setAddress] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/dashboard/settings');
      const data = (res as unknown as { data: TenantSettings }).data;
      setSettings(data);
      setName(data.name || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setEmailDomain(data.emailDomain || '@gym.com');
      setAddress(data.address || '');
    } catch { toast.error('Error al cargar configuración'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/api/v1/dashboard/settings', { name, phone, email, emailDomain, address });
      toast.success('Configuración guardada');
      fetchSettings();
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="md:space-y-6">
      <div className="reveal-up">
        <Header eyebrow="Sistema" title="Configuración" description="Datos del gimnasio y preferencias generales" />
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Sistema</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(28px, 8vw, 38px)' }}>
          CONFIGURACIÓN
        </h1>
      </div>

      <div className="px-4 md:px-0 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 anim-stagger">
        {/* Datos del Gimnasio */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h3 className="font-semibold text-[15px] text-foreground">Datos del Gimnasio</h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-muted-foreground">Nombre del Gym</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-muted-foreground">Teléfono</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+51 999 888 777"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-muted-foreground">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contacto@gym.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-muted-foreground">Dirección</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Principal 123, Lima"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-muted-foreground">Dominio email clientes</label>
              <input
                value={emailDomain}
                onChange={(e) => setEmailDomain(e.target.value)}
                placeholder="@gym.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
              />
              <p className="text-[10px] text-muted-foreground">Al crear cliente: nombre.apellido<strong>{emailDomain}</strong></p>
            </div>

            {settings?.slug && (
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-muted-foreground">Landing Público</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3.5 py-2.5 rounded-lg bg-secondary text-sm text-muted-foreground">
                    /{settings.slug}
                  </code>
                  <Link href={`/${settings.slug}`} target="_blank" className="p-2.5 rounded-lg bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          {/* Accesos rápidos al Landing */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-semibold text-[15px] text-foreground mb-4">Gestionar Landing</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Edita servicios, planes, instalaciones y FAQ que se muestran en tu página pública.
            </p>
            <div className="space-y-2">
              {[
                { label: 'Servicios', href: '/landing/services' },
                { label: 'Planes', href: '/landing/plans' },
                { label: 'Instalaciones', href: '/landing/facilities' },
                { label: 'FAQ', href: '/landing/faq' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-secondary transition-colors group"
                >
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Bot WhatsApp (info) */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold text-[15px] text-foreground">Bot de WhatsApp</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Próximamente: Automatiza recordatorios de pago, mensajes de bienvenida y seguimiento de miembros.
            </p>
            <div className="mt-3 inline-flex px-3 py-1 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground">
              Próximamente
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
