'use client';

import { useState } from 'react';
import { Eye, Upload, Globe, Star, Dumbbell, HelpCircle } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface LandingSectionData {
  title: string;
  subtitle: string;
  ctaText: string;
  backgroundImage: string;
}

interface LandingFormData {
  inicio: LandingSectionData;
  servicios: LandingSectionData;
  planes: LandingSectionData;
  instalaciones: LandingSectionData;
}

type TabKey = keyof LandingFormData;

const DEFAULT_SECTION: LandingSectionData = {
  title: '',
  subtitle: '',
  ctaText: '',
  backgroundImage: '',
};

export default function LandingEditorPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<LandingFormData>({
    inicio: { ...DEFAULT_SECTION, title: 'Transforma tu cuerpo', subtitle: 'El mejor gimnasio de la ciudad', ctaText: 'Empieza ahora', backgroundImage: '' },
    servicios: { ...DEFAULT_SECTION, title: 'Nuestros Servicios', subtitle: 'Todo lo que necesitas para alcanzar tus metas', ctaText: 'Ver servicios', backgroundImage: '' },
    planes: { ...DEFAULT_SECTION, title: 'Planes y Precios', subtitle: 'Encuentra el plan perfecto para ti', ctaText: 'Elegir plan', backgroundImage: '' },
    instalaciones: { ...DEFAULT_SECTION, title: 'Nuestras Instalaciones', subtitle: 'Equipamiento de última generación', ctaText: 'Conocer más', backgroundImage: '' },
  });

  const updateField = (tab: TabKey, field: keyof LandingSectionData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/api/v1/admin/landing', formData);
      toast.success('Landing actualizada correctamente');
    } catch {
      toast.error('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const tabConfig: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'inicio', label: 'Inicio', icon: <Globe className="h-4 w-4" /> },
    { key: 'servicios', label: 'Servicios', icon: <Star className="h-4 w-4" /> },
    { key: 'planes', label: 'Planes', icon: <Dumbbell className="h-4 w-4" /> },
    { key: 'instalaciones', label: 'Instalaciones', icon: <HelpCircle className="h-4 w-4" /> },
  ];

  const currentData = formData[activeTab];

  return (
    <div className="md:space-y-6 px-4 md:px-0 space-y-4">
      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Página pública</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          MI LANDING
        </h1>
      </div>
      <div className="reveal-up">
        <Header eyebrow="Página pública" title="Mi Landing" description="Personaliza la página pública de tu gimnasio">
          <button onClick={() => window.open('/landing-preview', '_blank')} className="btn-ghost">
            <Eye className="h-4 w-4" /> Vista Previa
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-fire disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </Header>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 anim-lego" style={{ animationDelay: '60ms' }}>
        {/* Panel de edición */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
              <TabsList className="grid grid-cols-4 mb-6">
                {tabConfig.map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key} className="gap-2 text-sm">
                    {tab.icon}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabConfig.map((tab) => (
                <TabsContent key={tab.key} value={tab.key} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor={`${tab.key}-title`}>Título principal</Label>
                    <Input
                      id={`${tab.key}-title`}
                      value={formData[tab.key].title}
                      onChange={(e) => updateField(tab.key, 'title', e.target.value)}
                      placeholder="Escribe el título de esta sección"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${tab.key}-subtitle`}>Subtítulo</Label>
                    <Textarea
                      id={`${tab.key}-subtitle`}
                      value={formData[tab.key].subtitle}
                      onChange={(e) => updateField(tab.key, 'subtitle', e.target.value)}
                      placeholder="Escribe el subtítulo o descripción"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${tab.key}-cta`}>Texto del botón (CTA)</Label>
                    <Input
                      id={`${tab.key}-cta`}
                      value={formData[tab.key].ctaText}
                      onChange={(e) => updateField(tab.key, 'ctaText', e.target.value)}
                      placeholder="Ej: Empieza ahora"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Imagen de fondo</Label>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-zinc-400 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 text-muted-foreground/70" />
                      <p className="text-sm text-muted-foreground">
                        Arrastra una imagen o haz clic para subir
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        PNG, JPG hasta 5MB. Recomendado: 1920x1080
                      </p>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </Card>
        </div>

        {/* Panel de vista previa */}
        <div className="lg:col-span-1">
          <Card className="p-4 sticky top-6">
            <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">
              Vista previa
            </p>
            <div className="bg-primary rounded-lg overflow-hidden aspect-[9/16] relative flex flex-col items-center justify-center p-6 text-center">
              {currentData.backgroundImage && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-30"
                  style={{ backgroundImage: `url(${currentData.backgroundImage})` }}
                />
              )}
              <div className="relative z-10 space-y-3">
                <h3 className="text-primary-foreground font-bold text-lg leading-tight">
                  {currentData.title || 'Título de sección'}
                </h3>
                <p className="text-muted-foreground/70 text-xs leading-relaxed">
                  {currentData.subtitle || 'Subtítulo descriptivo'}
                </p>
                {currentData.ctaText && (
                  <div className="inline-block bg-orange-500 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-full mt-2">
                    {currentData.ctaText}
                  </div>
                )}
              </div>
            </div>

            {/* Indicadores de secciones */}
            <div className="mt-4 space-y-2">
              {tabConfig.map((tab) => (
                <div
                  key={tab.key}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    activeTab === tab.key
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground/70 hover:text-muted-foreground'
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.icon}
                  <span className="text-xs font-medium">{tab.label}</span>
                  {formData[tab.key].title ? (
                    <span className="ml-auto w-2 h-2 rounded-full bg-emerald-50 dark:bg-emerald-9500" />
                  ) : (
                    <span className="ml-auto w-2 h-2 rounded-full bg-zinc-300" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
