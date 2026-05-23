'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { User, Mail, Phone, Lock, Check, X, Building } from 'lucide-react';
import { api, invalidateCache } from '@/lib/api';
import { useBranches } from '@/hooks/use-branches';
import { useBranchContext } from '@/stores/branch-context-store';

interface MemberFormProps {
  open: boolean;
  memberId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface MemberDetail {
  id: string; email: string; firstName: string; lastName: string; phone: string | null;
  branchId?: string | null;
  weeklyVisitLimit?: number | null;
}

export function MemberForm({ open, memberId, onClose, onSuccess }: MemberFormProps) {
  const { activeBranches, defaultBranchId } = useBranches();
  // Si el admin tiene una sede activa en el contexto global, el nuevo cliente
  // se auto-asigna a esa sede y NO se pide en el form. Si está en "Todas", se
  // muestra el selector como antes.
  const activeCtxBranchId = useBranchContext((s) => s.activeBranchId);
  const ctxBranch = activeBranches.find((b) => b.id === activeCtxBranchId);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailUser, setEmailUser] = useState('');
  const [emailDomain, setEmailDomain] = useState('@gym.com');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [branchId, setBranchId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = memberId !== null;
  // Si hay sede activa del contexto, no se pide la sede manualmente (auto).
  // Solo se pide cuando el admin está en "Todas las sucursales".
  const requiresBranchPick = activeBranches.length >= 2 && !ctxBranch;
  const showBranchField = activeBranches.length >= 1 && !ctxBranch;

  // Cargar dominio configurado
  useEffect(() => {
    api.get('/api/v1/dashboard/settings').then((res) => {
      const data = (res as unknown as { data: { emailDomain: string | null } }).data;
      if (data?.emailDomain) {
        setEmailDomain(data.emailDomain.startsWith('@') ? data.emailDomain : '@' + data.emailDomain);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (open && memberId) {
      api.get(`/api/v1/members/${memberId}`).then((res) => {
        const m = (res as unknown as { data: MemberDetail }).data;
        setFirstName(m.firstName);
        setLastName(m.lastName);
        const parts = m.email.split('@');
        setEmailUser(parts[0] || '');
        setPassword('');
        setPhone(m.phone || '');
        setBranchId(m.branchId ?? '');
      }).catch(() => { toast.error('Error al cargar'); onClose(); });
    } else if (open) {
      setFirstName(''); setLastName(''); setEmailUser(''); setPassword(''); setPhone('');
      // Pre-cargar: sede activa del contexto > única sede activa
      setBranchId(activeCtxBranchId || defaultBranchId || '');
    }
    setErrors({});
  }, [open, memberId, onClose, defaultBranchId]);

  const handleNameChange = (field: 'first' | 'last', value: string) => {
    if (field === 'first') setFirstName(value); else setLastName(value);
  };

  const fullEmail = `${emailUser}${emailDomain}`;
  const initials = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || '?';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!firstName.trim()) err.firstName = 'Escribe el nombre';
    if (!lastName.trim()) err.lastName = 'Escribe el apellido';
    if (!emailUser.trim()) err.email = 'Escribe el email';
    if (!isEditing && password.length < 6) err.password = 'La contraseña debe tener al menos 6 caracteres';
    if (requiresBranchPick && !branchId) err.branchId = 'Elige una sucursal';
    setErrors(err);
    if (Object.keys(err).length > 0) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        const data: Record<string, string | number | null> = { firstName, lastName, email: fullEmail };
        if (phone) data.phone = phone;
        if (password) data.password = password as string;
        if (showBranchField) data.branchId = branchId;
        // La frecuencia NO se edita aquí — se asigna desde el plan al matricular.
        await api.patch(`/api/v1/members/${memberId}`, data);
        toast.success('Cliente actualizado');
      } else {
        // La frecuencia (diario/interdiario/días) NO se elige aquí: se asigna
        // automáticamente desde el PLAN cuando se matricula en Finanzas → Registrar Pago.
        await api.post('/api/v1/members', {
          firstName, lastName, email: fullEmail, password,
          membershipType: 'MONTHLY',
          phone: phone || undefined,
          branchId: branchId || undefined,
        });
        toast.success('Cliente registrado');
      }
      // Invalidar todo el cache de members para que la tabla refetche con datos frescos.
      invalidateCache('/api/v1/members');
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join(', ') : (msg ?? (isEditing ? 'Error al actualizar' : 'Error al registrar. Verifica que el email no exista.'));
      toast.error(text);
    } finally { setSubmitting(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center native-overlay" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="native-sheet md:anim-pop w-full md:max-w-[520px] md:rounded-3xl rounded-t-[28px] bg-card flex flex-col"
        style={{ maxHeight: '92vh', boxShadow: '0 -16px 48px -8px rgba(0,0,0,0.30)' }}>

        {/* Drag handle mobile */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="drag-handle" />
        </div>

        {/* Header con avatar preview */}
        <div className="px-6 pt-4 pb-5 border-b border-border flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 anim-pop"
            style={{
              background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)',
              boxShadow: '0 8px 20px -6px rgba(255,90,31,0.45)',
            }}>
            <span className="text-white text-[22px] font-black tracking-tight">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {isEditing ? 'Editando' : 'Nuevo'}
            </p>
            <h3 className="text-[22px] font-black tracking-tight leading-tight truncate">
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : (isEditing ? 'Cliente' : 'Cliente nuevo')}
            </h3>
          </div>
          <button onClick={onClose} className="press w-9 h-9 rounded-xl flex items-center justify-center bg-secondary shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Sección 1: Datos personales */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Datos personales
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField icon={User} label="Nombre" error={errors.firstName}>
                <input value={firstName} onChange={(e) => handleNameChange('first', e.target.value)}
                  placeholder="Juan" autoFocus className="ff-input" />
              </FormField>
              <FormField label="Apellido" error={errors.lastName}>
                <input value={lastName} onChange={(e) => handleNameChange('last', e.target.value)}
                  placeholder="Pérez" className="ff-input" />
              </FormField>
            </div>
          </div>

          {/* Sección 2: Acceso */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Acceso
            </p>
            <div className="space-y-3">
              <FormField icon={Mail} label="Email del cliente" error={errors.email}>
                <div className="flex items-center rounded-xl border border-border bg-secondary/50 overflow-hidden focus-within:border-primary transition-colors">
                  <input
                    value={emailUser}
                    onChange={(e) => {
                      // Si pega algo con "@", separa user y mantén solo lo de la izquierda.
                      // Evita además autocomplete del navegador (admin@gym.com) que rellena con el email del usuario logueado.
                      const v = e.target.value.toLowerCase().replace(/\s/g, '');
                      setEmailUser(v.includes('@') ? v.split('@')[0] : v);
                    }}
                    placeholder="nombre.apellido"
                    autoComplete="off"
                    name="new-member-email-user"
                    spellCheck={false}
                    className="flex-1 px-3.5 py-3 text-[14px] outline-none bg-transparent text-foreground placeholder:text-muted-foreground/60"
                  />
                  <span className="px-3 py-3 bg-secondary/70 text-[13px] font-mono border-l border-border shrink-0 text-foreground/70">
                    {emailDomain}
                  </span>
                </div>
              </FormField>

              <FormField icon={Lock} label={isEditing ? 'Contraseña (opcional)' : 'Contraseña'} error={errors.password}
                hint={isEditing ? 'Déjalo vacío para no cambiarla' : 'Mínimo 6 caracteres'}>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEditing ? 'Sin cambios' : 'Crea una contraseña'} className="ff-input" />
              </FormField>
            </div>
          </div>

          {/* Sección 3: Contacto */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Contacto (opcional)
            </p>
            <FormField icon={Phone} label="Teléfono">
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="999 888 777" inputMode="tel" className="ff-input" />
            </FormField>
          </div>


          {/* Aviso: el cliente se asigna a la sede activa (contexto del sidebar). */}
          {ctxBranch && !isEditing && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,90,31,0.10)', border: '1px solid rgba(255,90,31,0.25)' }}>
              <Building className="h-4 w-4 shrink-0" style={{ color: 'var(--gym-orange)' }} />
              <span className="text-[12px] font-bold" style={{ color: 'var(--gym-orange)' }}>
                Se asignará a <strong>{ctxBranch.name}</strong> (sede activa)
              </span>
            </div>
          )}

          {/* Sección 4: Sucursal — auto si hay 1, obligatorio si hay 2+ */}
          {showBranchField && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Sucursal {requiresBranchPick && '*'}
              </p>
              <FormField icon={Building} label="Sucursal del cliente" error={errors.branchId}
                hint={!requiresBranchPick ? 'Asignada automáticamente' : 'Aquí se registrarán sus check-ins'}>
                {activeBranches.length === 1 ? (
                  <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-secondary border border-border text-[14px] text-muted-foreground">
                    <Building className="h-3.5 w-3.5" />
                    <span className="truncate">{activeBranches[0].name}</span>
                    <span className="ml-auto text-[10px] font-black uppercase tracking-wider">Auto</span>
                  </div>
                ) : (
                  <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
                    className="ff-input">
                    <option value="">Selecciona una sucursal</option>
                    {activeBranches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                )}
              </FormField>
            </div>
          )}

          {/* Info plan */}
          {!isEditing && (
            <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: 'rgba(255,90,31,0.08)', border: '1px solid rgba(255,90,31,0.20)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,90,31,0.15)' }}>
                <Check className="h-4 w-4" style={{ color: '#FF5A1F' }} strokeWidth={3} />
              </div>
              <div>
                <p className="text-[12px] font-black">El cliente quedará registrado sin plan</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Después podrás activarle un plan desde <strong>Finanzas → Registrar Pago</strong>
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Footer con botón grande */}
        <div className="px-6 py-4 border-t border-border" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
          <button onClick={handleSubmit} disabled={submitting}
            className="press w-full py-4 rounded-2xl text-white text-[14px] font-black uppercase tracking-[0.12em] disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)',
              boxShadow: '0 12px 24px -8px rgba(255,90,31,0.50)',
            }}>
            {submitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Registrar cliente'}
          </button>
        </div>
      </div>

      {/* Estilos del input compartido — bg-secondary para que contraste sobre el card del sheet */}
      <style jsx global>{`
        .ff-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--secondary) / 0.5);
          color: hsl(var(--foreground));
          font-size: 14px;
          outline: none;
          transition: border-color 200ms ease, box-shadow 200ms ease, background 200ms ease;
        }
        .ff-input::placeholder { color: hsl(var(--muted-foreground) / 0.6); }
        .ff-input:focus {
          border-color: #FF5A1F;
          background: hsl(var(--secondary));
          box-shadow: 0 0 0 3px rgba(255,90,31,0.12);
        }
      `}</style>
    </div>
  );
}

interface FormFieldProps {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function FormField({ icon: Icon, label, hint, error, children }: FormFieldProps) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.12em] mb-1.5"
        style={{ color: error ? '#EF4444' : 'hsl(var(--foreground))' }}>
        {Icon && <Icon className="h-3 w-3" strokeWidth={2.5} />}
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] font-bold mt-1" style={{ color: '#EF4444' }}>{error}</p>}
      {!error && hint && <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{hint}</p>}
    </div>
  );
}
