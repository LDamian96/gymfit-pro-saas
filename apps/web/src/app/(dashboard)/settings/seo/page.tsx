'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, MapPin, Instagram, Facebook, MessageCircle, Globe, Hash, Clock, Search, Sparkles, ExternalLink } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

interface OpenHour { open: string; close: string }
type OpeningHours = Record<string, OpenHour | null>;

interface SeoSettings {
  id: string; name: string; slug: string;
  logo: string | null; phone: string | null; email: string | null; address: string | null;
  district: string | null; city: string | null; region: string | null; country: string | null;
  latitude: number | null; longitude: number | null;
  instagramUrl: string | null; facebookUrl: string | null; tiktokUrl: string | null;
  whatsappNumber: string | null; googleMapsUrl: string | null;
  seoTitle: string | null; seoDescription: string | null; seoKeywords: string | null;
  openingHours: OpeningHours | null;
}

const DAYS: { key: keyof OpeningHours; label: string }[] = [
  { key: 'mon', label: 'Lunes' }, { key: 'tue', label: 'Martes' }, { key: 'wed', label: 'Miercoles' },
  { key: 'thu', label: 'Jueves' }, { key: 'fri', label: 'Viernes' }, { key: 'sat', label: 'Sabado' },
  { key: 'sun', label: 'Domingo' },
];

const DEFAULT_HOURS: OpeningHours = {
  mon: { open: '06:00', close: '22:00' }, tue: { open: '06:00', close: '22:00' },
  wed: { open: '06:00', close: '22:00' }, thu: { open: '06:00', close: '22:00' },
  fri: { open: '06:00', close: '22:00' }, sat: { open: '07:00', close: '20:00' },
  sun: { open: '08:00', close: '14:00' },
};

export default function SeoSettingsPage() {
  const [data, setData] = useState<SeoSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<SeoSettings>>({});
  const [hours, setHours] = useState<OpeningHours>(DEFAULT_HOURS);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/tenant/settings/seo');
      const d = (res as unknown as { data: SeoSettings }).data;
      setData(d);
      setForm(d);
      setHours((d.openingHours && Object.keys(d.openingHours).length > 0) ? d.openingHours : DEFAULT_HOURS);
    } catch { toast.error('No se pudo cargar la configuracion SEO'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const upd = <K extends keyof SeoSettings>(k: K, v: SeoSettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const updHour = (day: keyof OpeningHours, field: 'open' | 'close', value: string) => {
    setHours((h) => ({ ...h, [day]: { ...(h[day] || { open: '06:00', close: '22:00' }), [field]: value } }));
  };
  const toggleClosed = (day: keyof OpeningHours) => {
    setHours((h) => ({ ...h, [day]: h[day] ? null : { open: '06:00', close: '22:00' } }));
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await api.patch('/api/v1/tenant/settings/seo', { ...form, openingHours: hours });
      toast.success('Configuracion SEO guardada');
      load();
    } catch { toast.error('Error al guardar'); } finally { setSaving(false); }
  };

  if (!data) return <div className="p-8 text-muted-foreground">Cargando...</div>;

  const previewUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/${data.slug}`;

  return (
    <div className="space-y-6">
      <Header
        eyebrow="/ SEO & VISIBILIDAD"
        title="SEO y posicionamiento"
        description="Configura como Google y las IAs (ChatGPT, Claude, Perplexity, Gemini) ven tu gimnasio. Cuanto mas completo, mas te recomiendan cuando alguien busca 'mejor gym en X'."
      >
        <Link href={previewUrl} target="_blank" className="inline-flex items-center gap-2 text-[12px] font-bold text-[var(--gym-orange)] hover:underline">
          Ver landing <ExternalLink className="h-3 w-3" />
        </Link>
      </Header>

      {/* SECCION 1: Ubicacion granular */}
      <Section icon={MapPin} title="Ubicacion" desc="Clave para queries como 'gym en Surco' o 'gimnasios cerca de mi'. Llena distrito + ciudad y coordenadas exactas.">
        <Grid>
          <Field label="Distrito" value={form.district || ''} onChange={(v) => upd('district', v)} placeholder="Surco, Miraflores, Ventanilla..." />
          <Field label="Ciudad" value={form.city || ''} onChange={(v) => upd('city', v)} placeholder="Lima" />
          <Field label="Region / Departamento" value={form.region || ''} onChange={(v) => upd('region', v)} placeholder="Lima" />
          <Field label="Pais (ISO 2)" value={form.country || ''} onChange={(v) => upd('country', v)} placeholder="PE" />
          <Field label="Direccion completa" value={form.address || ''} onChange={(v) => upd('address', v)} placeholder="Av. La Marina 1234, Surco, Lima" />
          <Field label="Google Maps URL" value={form.googleMapsUrl || ''} onChange={(v) => upd('googleMapsUrl', v)} placeholder="https://maps.app.goo.gl/..." />
          <Field label="Latitud" value={form.latitude?.toString() || ''} onChange={(v) => upd('latitude', v ? parseFloat(v) : null)} placeholder="-12.0464" type="number" step="any" />
          <Field label="Longitud" value={form.longitude?.toString() || ''} onChange={(v) => upd('longitude', v ? parseFloat(v) : null)} placeholder="-77.0428" type="number" step="any" />
        </Grid>
      </Section>

      {/* SECCION 2: Contacto y redes (sameAs en schema.org) */}
      <Section icon={Instagram} title="Redes sociales y contacto" desc="Las IAs usan esto para verificar la identidad del negocio (sameAs en schema.org).">
        <Grid>
          <Field label="Telefono principal" value={form.phone || ''} onChange={(v) => upd('phone', v)} placeholder="+51 999 888 777" icon={MessageCircle} />
          <Field label="WhatsApp (solo numero)" value={form.whatsappNumber || ''} onChange={(v) => upd('whatsappNumber', v)} placeholder="51999888777" icon={MessageCircle} />
          <Field label="Email" value={form.email || ''} onChange={(v) => upd('email', v)} placeholder="contacto@tugym.com" />
          <Field label="Instagram URL" value={form.instagramUrl || ''} onChange={(v) => upd('instagramUrl', v)} placeholder="https://instagram.com/tugym" icon={Instagram} />
          <Field label="Facebook URL" value={form.facebookUrl || ''} onChange={(v) => upd('facebookUrl', v)} placeholder="https://facebook.com/tugym" icon={Facebook} />
          <Field label="TikTok URL" value={form.tiktokUrl || ''} onChange={(v) => upd('tiktokUrl', v)} placeholder="https://tiktok.com/@tugym" icon={Hash} />
        </Grid>
      </Section>

      {/* SECCION 3: Horarios */}
      <Section icon={Clock} title="Horarios de atencion" desc="Google + Apple Maps + IAs los muestran al buscarte. Marca 'Cerrado' los dias que no abres.">
        <div className="space-y-2">
          {DAYS.map(({ key, label }) => {
            const h = hours[key];
            const closed = !h;
            return (
              <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
                <div className="w-28 font-bold text-[13px]">{label}</div>
                <button
                  onClick={() => toggleClosed(key)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                  style={{
                    background: closed ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                    color: closed ? '#ef4444' : '#22c55e',
                  }}
                >
                  {closed ? 'Cerrado' : 'Abierto'}
                </button>
                {!closed && (
                  <>
                    <input type="time" value={h.open} onChange={(e) => updHour(key, 'open', e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-background border border-border text-[13px] font-mono" />
                    <span className="text-muted-foreground">a</span>
                    <input type="time" value={h.close} onChange={(e) => updHour(key, 'close', e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-background border border-border text-[13px] font-mono" />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* SECCION 4: SEO Overrides */}
      <Section icon={Search} title="SEO personalizado (opcional)" desc="Por defecto generamos titulo, descripcion y keywords automaticamente. Si quieres personalizar, escribelo aqui.">
        <div className="space-y-3">
          <Field label="Titulo SEO (max 60 chars recomendado)" value={form.seoTitle || ''} onChange={(v) => upd('seoTitle', v)} placeholder={`${data.name} — Gimnasio en ${form.district || '[tu distrito]'} | Mejor gym de la zona`} />
          <FieldText label="Descripcion SEO (max 160 chars recomendado)" value={form.seoDescription || ''} onChange={(v) => upd('seoDescription', v)} placeholder={`Gimnasio profesional en ${form.district || '[distrito]'}. Entrenamiento personal, clases grupales, nutricion y mas. Membresias desde S/X.`} />
          <Field label="Keywords personalizadas (separadas por coma)" value={form.seoKeywords || ''} onChange={(v) => upd('seoKeywords', v)} placeholder="mejor gym surco, gimnasio 24 horas surco, crossfit surco" />
        </div>
      </Section>

      {/* SECCION 5: Vista previa IA */}
      <Section icon={Sparkles} title="Como te ven las IAs (preview)" desc="Asi entiende ChatGPT/Claude/Perplexity tu negocio al ser preguntado por 'mejor gym en ...'.">
        <pre className="text-[11px] bg-secondary/50 p-4 rounded-xl overflow-x-auto font-mono leading-relaxed">
{`Nombre: ${data.name}
Tipo: Gimnasio / HealthClub
Ubicacion: ${form.district || '?'}, ${form.city || '?'}, ${form.country || 'PE'}
Direccion: ${form.address || '?'}
Coordenadas: ${form.latitude ?? '?'}, ${form.longitude ?? '?'}
Contacto: ${form.phone || '?'} | ${form.email || '?'}
WhatsApp: ${form.whatsappNumber ? `wa.me/${form.whatsappNumber}` : '?'}
Redes: ${[form.instagramUrl, form.facebookUrl, form.tiktokUrl].filter(Boolean).length || 0} configuradas
Horario: ${Object.entries(hours).filter(([,v]) => v).length} dias abiertos`}
        </pre>
      </Section>

      {/* Botton Save */}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <button onClick={save} disabled={saving}
          className="btn-fire px-6 py-3 rounded-2xl shadow-2xl disabled:opacity-60 flex items-center gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar cambios SEO'}
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, desc, children }: { icon: React.ElementType; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,90,31,0.10)' }}>
          <Icon className="h-5 w-5 text-[var(--gym-orange)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-[18px] text-foreground">{title}</h2>
          <p className="text-[12px] text-muted-foreground mt-1 leading-snug">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}

interface FieldProps {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; step?: string; icon?: React.ElementType;
}
function Field({ label, value, onChange, placeholder, type, step, icon: Icon }: FieldProps) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}</span>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
        <input
          type={type || 'text'} step={step} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-[var(--gym-orange)] outline-none text-[13px] text-foreground placeholder:text-muted-foreground/60`}
        />
      </div>
    </label>
  );
}
function FieldText({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-[var(--gym-orange)] outline-none text-[13px] text-foreground placeholder:text-muted-foreground/60 resize-none"
      />
    </label>
  );
}
