'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Dumbbell, ArrowRight, Zap } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

const demoAccounts = [
  { label: 'Admin', email: 'admin@gymfit.com', tag: 'ADMIN' },
  { label: 'Entrenador', email: 'trainer@gymfit.com', tag: 'TRAINER' },
  { label: 'Recepción', email: 'recepcion@gymfit.com', tag: 'RECEP' },
  { label: 'Cliente', email: 'laura@test.com', tag: 'CLIENTE' },
];

const DEMO_PASSWORD = 'Admin1234';
const FULL_DEMO = { email: 'demo@gymfit.com', password: 'Demo1234' };

interface CachedUser {
  id: string; email: string; firstName: string; lastName: string;
  role: string; avatar: string | null; memberId: string | null;
  tenant: { id: string; name: string; slug: string; logo: string | null };
  branch: { id: string; name: string } | null;
}

// Lee user cacheado del último login por este email (localStorage).
// Devuelve null si no hay cache (primer login).
function readCachedUser(email: string): CachedUser | null {
  if (typeof localStorage === 'undefined' || !email) return null;
  try {
    const raw = localStorage.getItem(`gymfit:lastuser:${email}`);
    if (!raw) return null;
    return JSON.parse(raw) as CachedUser;
  } catch { return null; }
}

// Saca un primer nombre presentable del email para mostrarlo en el overlay
// de carga ANTES de que responda el API. Ej: 'juan.perez@gym.com' -> 'Juan'.
// Si el email es algo como 'user123@...' o vacio, devuelve ''.
function guessNameFromEmail(email: string): string {
  if (!email) return '';
  const username = (email.split('@')[0] || '').trim();
  if (!username) return '';
  const parts = username.split(/[._-]/).filter((p) => p && !/^\d+$/.test(p));
  if (parts.length === 0) return '';
  const first = parts[0];
  if (first.length < 2) return '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

// Decide a qué ruta navegar según rol(es).
function targetForRoles(role: string): string {
  const roles = (role || '').split(',').map((r) => r.trim());
  if (roles.includes('ADMIN')) return '/dashboard';
  if (roles.includes('TRAINER')) return '/routines';
  if (roles.includes('RECEPTIONIST')) return '/checkin';
  if (roles.includes('CLIENT')) return '/my-progress';
  return '/dashboard';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // isLeaving: dispara la animacion CSS de "subir y desvanecerse" del login
  // INMEDIATO al click. Asi el usuario ve movimiento sin esperar al API.
  const [isLeaving, setIsLeaving] = useState(false);
  // welcomeName: nombre que aparece en el overlay de carga.
  // Se llena INSTANTANEO desde el cache (login previo) o del email.
  // Cuando responde el API real, se actualiza al firstName oficial.
  const [welcomeName, setWelcomeName] = useState('');
  const { login } = useAuthStore();
  const router = useRouter();

  // Prefetch SOLO si hay user_meta (sesion previa con cookies validas).
  // Sin auth, el RSC de /dashboard devuelve redirect a /login, Next.js
  // cachea ese redirect, y despues del login real la navegacion sigue
  // el redirect cacheado -> BOUNCE LOOP (usuario tiene que recargar).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!document.cookie.includes('user_meta=')) return;
    ['/dashboard', '/routines', '/checkin', '/my-progress'].forEach((p) => {
      try { router.prefetch(p); } catch { /* noop */ }
    });
  }, [router]);

  const navigateWithTransition = (target: string) => {
    // YA NO usamos View Transitions API aqui: la API oculta el DOM
    // actual y muestra una "snapshot congelada" del login mientras espera
    // el RSC del panel (1-1.5s sobre redes lentas). El usuario veia
    // pantalla congelada varios segundos. Ahora:
    // - CSS de .login-leaving anima el login HACIA ARRIBA (visible en DOM)
    // - router.replace navega directo
    // - Next.js muestra el loading.tsx del segmento (skeleton)
    // - El panel monta cuando llegan RSC + chunks JS
    router.replace(target);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // CUE VISUAL INMEDIATO — el login empieza a subirse/desvanecerse al instante
    // del click, en paralelo con el API. El usuario ve movimiento desde t=0.
    setIsLeaving(true);

    // OPTIMISTIC LOGIN — Si hay user cacheado por este email (de login previo),
    // setea cookie + store + navega INSTANTÁNEO al panel con animación slide-up.
    // El API real corre detrás. Si la contraseña falla, regresa a /login.
    const cached = readCachedUser(email);
    // Nombre INSTANTANEO para el overlay: cache > heuristica de email.
    setWelcomeName(cached?.firstName || guessNameFromEmail(email));
    if (cached) {
      const j = encodeURIComponent(JSON.stringify(cached));
      document.cookie = `user_meta=${j};path=/;max-age=60;samesite=lax`;
      document.cookie = `auth_pending=1;path=/;max-age=60;samesite=lax`;
      useAuthStore.setState({ user: cached, isLoading: false });
      navigateWithTransition(targetForRoles(cached.role));
    }

    login(email, password)
      .then((real) => {
        try { localStorage.setItem(`gymfit:lastuser:${email}`, JSON.stringify(real)); } catch {}
        // Refresca el nombre con el oficial del API (puede diferir del email).
        if (real.firstName) setWelcomeName(real.firstName);
        if (!cached) navigateWithTransition(targetForRoles(real.role));
        // No router.refresh() — disparaba un re-fetch completo del RSC del
        // panel POST-animacion (cursor "cargando" varios segundos).
        // El user_meta + el store ya tienen los datos reales, no hace falta.
      })
      .catch(() => {
        toast.error('Email o contraseña incorrectos');
        document.cookie = 'user_meta=;path=/;max-age=0;samesite=lax';
        document.cookie = 'auth_pending=;path=/;max-age=0;samesite=lax';
        useAuthStore.setState({ user: null });
        setIsSubmitting(false);
        setIsLeaving(false); // baja el login de vuelta si fallo
        setWelcomeName('');
        if (cached) router.replace('/login');
      });
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
  };

  const loginAsFullDemo = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setIsLeaving(true);
    const cached = readCachedUser(FULL_DEMO.email);
    setWelcomeName(cached?.firstName || guessNameFromEmail(FULL_DEMO.email));
    if (cached) {
      const j = encodeURIComponent(JSON.stringify(cached));
      document.cookie = `user_meta=${j};path=/;max-age=60;samesite=lax`;
      document.cookie = `auth_pending=1;path=/;max-age=60;samesite=lax`;
      useAuthStore.setState({ user: cached, isLoading: false });
      navigateWithTransition(targetForRoles(cached.role));
    }
    login(FULL_DEMO.email, FULL_DEMO.password)
      .then((real) => {
        try { localStorage.setItem(`gymfit:lastuser:${FULL_DEMO.email}`, JSON.stringify(real)); } catch {}
        if (real.firstName) setWelcomeName(real.firstName);
        if (!cached) navigateWithTransition(targetForRoles(real.role));
      })
      .catch(() => {
        toast.error('No se pudo entrar como demo');
        document.cookie = 'user_meta=;path=/;max-age=0;samesite=lax';
        document.cookie = 'auth_pending=;path=/;max-age=0;samesite=lax';
        useAuthStore.setState({ user: null });
        setIsSubmitting(false);
        setIsLeaving(false);
        setWelcomeName('');
        if (cached) router.replace('/login');
      });
  };

  return (
    <div className="min-h-screen w-full mesh-bg grain relative overflow-hidden">
      {/* Decoraciones de fondo — solo desktop, dan profundidad.
          Esto se queda fijo aunque el login se vaya hacia arriba: asi nunca
          ves el body blanco mientras llega el panel. */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[var(--gym-orange)] opacity-20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[var(--gym-lime)] opacity-[0.07] blur-[140px]" />
      </div>

      {/* LOADING OVERLAY — backdrop OSCURO solido + contenido al centro.
          Antes el overlay no tenia backdrop solido entonces se veia el
          mesh-bg cream/naranja del login detras. Ahora cubre todo. */}
      {isLeaving && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
          style={{
            background: '#0A0B0D',
            animation: 'fadeIn 0.2s ease-out both',
          }}
        >
          <div className="flex flex-col items-center gap-5 max-w-md text-center px-6" style={{ animation: 'fadeIn 0.3s ease-out 0.15s both' }}>
            <div className="w-20 h-20 rounded-3xl fire-card flex items-center justify-center shadow-2xl">
              <Dumbbell className="h-10 w-10 text-white" strokeWidth={2.5} />
            </div>
            <p className="font-code text-[10px] tracking-[0.22em] text-[var(--gym-orange)]">/ AUTENTICANDO</p>
            {welcomeName ? (
              <>
                <p className="font-code text-[12px] tracking-[0.05em] text-white/70">
                  Bienvenido <span className="text-white font-bold">{welcomeName}</span>,
                </p>
                <h2 className="font-display text-white text-[30px] leading-[0.95] tracking-tight">
                  estamos preparando tu<br />
                  experiencia <span className="text-[var(--gym-orange)]">personalizada.</span>
                </h2>
              </>
            ) : (
              <h2 className="font-display text-white text-[34px] leading-[0.95] tracking-tight">
                Preparando experiencia<br />
                <span className="text-[var(--gym-orange)]">personalizada.</span>
              </h2>
            )}
            <p className="text-white/50 text-[13px] leading-relaxed mt-1">
              Sincronizando datos de tu gimnasio, sedes y miembros activos.
            </p>
            <div className="w-56 h-1 rounded-full bg-white/10 overflow-hidden mt-3 relative">
              <div className="absolute inset-y-0 w-1/3 bg-[var(--gym-orange)] animate-[loading-bar_1.2s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      )}

      {/* Wrapper interno que SI se anima al click. El padre con mesh-bg
          se queda visible cubriendo todo, sin gap blanco. */}
      <div className={isLeaving ? 'login-leaving' : ''}>

      {/* ===== DESKTOP: split 2 columnas ===== */}
      <div className="hidden md:grid md:grid-cols-2 min-h-screen relative z-10">
        {/* Columna izquierda — manifiesto/branding */}
        <div className="flex flex-col justify-between p-12 lg:p-16 relative">
          <div className="flex items-center gap-3 reveal-up">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center fire-card shine-border">
              <Dumbbell className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display text-[18px] tracking-tight text-foreground leading-none">GYMFIT</p>
              <p className="font-code text-[10px] tracking-[0.18em] text-[var(--gym-orange)] mt-0.5">PRO · 2026</p>
            </div>
          </div>

          {/* Manifiesto enorme */}
          <div className="space-y-6 reveal-up" style={{ animationDelay: '120ms' }}>
            <p className="label-athletic text-[var(--gym-orange)]">/ Sistema operativo del gym</p>
            <h1 className="font-display text-foreground leading-[0.85] tracking-tight"
              style={{ fontSize: 'clamp(56px, 7vw, 110px)' }}>
              FORJA<br />
              EL <span className="text-[var(--gym-orange)]">PR</span><br />
              DE TU<br />
              NEGOCIO.
            </h1>
            <p className="text-[15px] text-muted-foreground max-w-md leading-relaxed">
              Asistencia QR. Multi-sede. POS. Rutinas con video.
              Notificaciones cruzadas. Todo en una plataforma para
              gimnasios que no se conforman con menos.
            </p>
            <div className="flex items-center gap-6 pt-2">
              <Stat number="3" label="Sedes activas" />
              <div className="w-px h-10 bg-border" />
              <Stat number="500+" label="Clientes" />
              <div className="w-px h-10 bg-border" />
              <Stat number="24/7" label="Operación" />
            </div>
          </div>

          <p className="font-code text-[10px] text-muted-foreground/60 tracking-wider reveal-up" style={{ animationDelay: '300ms' }}>
            v2.0 · gym.ldmapp.com
          </p>
        </div>

        {/* Columna derecha — login form */}
        <div className="flex items-center justify-center p-12 lg:p-16">
          <div className="w-full max-w-[440px] space-y-8">
            <FormBlock
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              showPassword={showPassword} setShowPassword={setShowPassword}
              isSubmitting={isSubmitting}
              handleSubmit={handleSubmit}
              loginAsFullDemo={loginAsFullDemo}
            />
            <DemoBlock fillDemo={fillDemo} />
          </div>
        </div>
      </div>

      {/* ===== MOBILE: stacked, native feel ===== */}
      <div className="md:hidden min-h-screen flex flex-col relative z-10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {/* Hero compacto arriba */}
        <div className="px-6 pt-12 pb-8 reveal-up">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center fire-card">
              <Dumbbell className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display text-[16px] text-foreground leading-none">GYMFIT</p>
              <p className="font-code text-[9px] tracking-[0.18em] text-[var(--gym-orange)] mt-0.5">PRO · 2026</p>
            </div>
          </div>

          <p className="label-athletic text-[var(--gym-orange)] mb-3">/ Bienvenido de vuelta</p>
          <h1 className="font-display text-foreground leading-[0.88] tracking-tight" style={{ fontSize: 'clamp(48px, 13vw, 72px)' }}>
            FORJA TU<br />
            <span className="text-[var(--gym-orange)]">PR</span> DIARIO.
          </h1>
        </div>

        {/* Form en card que se levanta */}
        <div className="flex-1 px-5 pb-6 reveal-up" style={{ animationDelay: '120ms' }}>
          <div className="glass-card rounded-[28px] p-6 space-y-6">
            <FormBlock
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              showPassword={showPassword} setShowPassword={setShowPassword}
              isSubmitting={isSubmitting}
              handleSubmit={handleSubmit}
              loginAsFullDemo={loginAsFullDemo}
            />
            <DemoBlock fillDemo={fillDemo} />
          </div>
        </div>
      </div>
      </div>{/* fin wrapper isLeaving */}
    </div>
  );
}

/* ===== Sub-componentes ===== */

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <p className="hero-num text-foreground" style={{ fontSize: '36px' }}>{number}</p>
      <p className="label-athletic text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

interface FormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  loginAsFullDemo: () => void;
}

function FormBlock({ email, setEmail, password, setPassword, showPassword, setShowPassword, isSubmitting, handleSubmit, loginAsFullDemo }: FormProps) {
  return (
    <>
      <div>
        <p className="label-athletic text-muted-foreground mb-2">/ Acceso</p>
        <h2 className="font-display text-foreground text-[28px] leading-none">Iniciar sesión</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-athletic text-muted-foreground mb-2 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@gym.com"
            className="w-full px-4 py-3.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[var(--gym-orange)] focus:bg-secondary transition-all font-code text-[14px]"
          />
        </div>

        <div>
          <label className="label-athletic text-muted-foreground mb-2 block">Contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3.5 pr-12 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[var(--gym-orange)] focus:bg-secondary transition-all font-code text-[14px]"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-[var(--gym-orange)] transition-colors">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting}
          className="btn-fire w-full text-[14px] mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
          {isSubmitting ? 'Entrando...' : (
            <>Iniciar sesión <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </form>

      <button onClick={loginAsFullDemo} disabled={isSubmitting}
        className="press-card w-full p-4 rounded-2xl glass-card warm flex items-center gap-3 text-left group">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 fire-card">
          <Zap className="h-5 w-5 text-white" fill="white" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-display text-[13px] tracking-tight">PROBAR DEMO COMPLETO</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Cliente con rutina + medidas + asistencia · 1 click</p>
        </div>
        <ArrowRight className="h-4 w-4 text-[var(--gym-orange)] group-hover:translate-x-1 transition-transform" />
      </button>
    </>
  );
}

function DemoBlock({ fillDemo }: { fillDemo: (email: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="label-athletic text-muted-foreground">/ Cuentas demo</p>
        <p className="font-code text-[10px] text-muted-foreground">Pass: Admin1234</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {demoAccounts.map((d) => (
          <button key={d.email} onClick={() => fillDemo(d.email)}
            className="press-card text-left p-3 rounded-xl bg-secondary/40 border border-border hover:border-[var(--gym-orange)]/30 hover:bg-secondary transition-all">
            <p className="font-code text-[9px] tracking-[0.15em] text-[var(--gym-orange)]">{d.tag}</p>
            <p className="text-foreground text-[13px] font-bold mt-1">{d.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
