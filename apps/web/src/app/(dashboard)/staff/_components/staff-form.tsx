'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Building } from 'lucide-react';
import { useBranches } from '@/hooks/use-branches';
import { useBranchContext } from '@/stores/branch-context-store';

// Roles disponibles para el personal
type StaffRole = 'RECEPTIONIST' | 'TRAINER';

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role: StaffRole;
  isActive: boolean;
  branchId: string | null;
  createdAt: string;
}

interface StaffFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: StaffRole;
  branchId: string;
}

interface StaffFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StaffFormData) => Promise<void>;
  staff?: StaffMember | null;
}

const INITIAL_FORM: StaffFormData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: 'RECEPTIONIST',
  branchId: '',
};

export function StaffForm({ open, onOpenChange, onSubmit, staff }: StaffFormProps) {
  const { activeBranches, defaultBranchId, loading: branchesLoading } = useBranches();
  const activeCtxBranchId = useBranchContext((s) => s.activeBranchId);
  const ctxBranch = activeBranches.find((b) => b.id === activeCtxBranchId);
  const [form, setForm] = useState<StaffFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const isEditing = !!staff;

  // Si hay sede activa del contexto global, no se pide manualmente.
  // Solo se pide cuando el admin está en "Todas".
  const requiresBranchPick = activeBranches.length >= 2 && !ctxBranch;
  const showBranchField = activeBranches.length >= 1 && !ctxBranch;

  // Rellenar formulario al editar
  useEffect(() => {
    if (staff) {
      setForm({
        email: staff.email,
        password: '',
        firstName: staff.firstName,
        lastName: staff.lastName,
        phone: staff.phone ?? '',
        role: staff.role,
        branchId: staff.branchId ?? '',
      });
    } else {
      // Pre-cargar: sede activa del contexto > única sede activa
      setForm({ ...INITIAL_FORM, branchId: activeCtxBranchId || defaultBranchId || '' });
    }
  }, [staff, open, defaultBranchId, activeCtxBranchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requiresBranchPick && !form.branchId) {
      return;
    }
    setLoading(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
      setForm(INITIAL_FORM);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof StaffFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            {isEditing ? 'Editar Personal' : 'Nuevo Personal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-[13px] text-foreground/80">
                Nombre
              </Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="Juan"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-[13px] text-foreground/80">
                Apellido
              </Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="Perez"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[13px] text-foreground/80">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="juan@gimnasio.com"
              required
            />
          </div>

          {/* Contraseña (solo al crear o si quiere cambiar) */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[13px] text-foreground/80">
              Contraseña {isEditing && '(dejar vacío para no cambiar)'}
            </Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder={isEditing ? '••••••••' : 'Mínimo 6 caracteres'}
              required={!isEditing}
              minLength={6}
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[13px] text-foreground/80">
              Teléfono (opcional)
            </Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+51 999 999 999"
            />
          </div>

          {/* Aviso: se asignará a la sede activa del contexto global */}
          {ctxBranch && !isEditing && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm" style={{ background: 'rgba(255,90,31,0.10)', border: '1px solid rgba(255,90,31,0.25)', color: 'var(--gym-orange)' }}>
              <Building className="h-3.5 w-3.5 shrink-0" />
              <span className="font-bold">Se asignará a {ctxBranch.name} (sede activa)</span>
            </div>
          )}

          {/* Sucursal — auto si hay 1, obligatorio si hay 2+ */}
          {showBranchField && (
            <div className="space-y-2">
              <Label className="text-[13px] text-foreground/80 flex items-center gap-1.5">
                <Building className="h-3 w-3" /> Sucursal {requiresBranchPick && '*'}
              </Label>
              {activeBranches.length === 1 ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary border border-border text-[13px] text-muted-foreground">
                  <Building className="h-3.5 w-3.5" />
                  <span className="truncate">{activeBranches[0].name}</span>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider">Auto</span>
                </div>
              ) : (
                <select
                  value={form.branchId}
                  onChange={(e) => updateField('branchId', e.target.value)}
                  required={requiresBranchPick}
                  disabled={branchesLoading}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-[13px] outline-none focus:border-primary"
                >
                  <option value="">Selecciona una sucursal</option>
                  {activeBranches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
              {requiresBranchPick && !form.branchId && (
                <p className="text-[11px] text-red-600">Debes elegir una sucursal</p>
              )}
            </div>
          )}

          {/* Roles — multi-selección */}
          <div className="space-y-2">
            <Label className="text-[13px] text-foreground/80">Rol(es)</Label>
            <div className="flex gap-3">
              {[
                { value: 'TRAINER', label: 'Entrenador' },
                { value: 'RECEPTIONIST', label: 'Recepcionista' },
              ].map((r) => {
                const roles = form.role.split(',').map((s) => s.trim()).filter(Boolean);
                const isChecked = roles.includes(r.value);
                const toggle = () => {
                  let next: string[];
                  if (isChecked) {
                    next = roles.filter((x) => x !== r.value);
                  } else {
                    next = [...roles, r.value];
                  }
                  if (next.length === 0) next = [r.value];
                  updateField('role', next.join(','));
                };
                return (
                  <label key={r.value} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border cursor-pointer transition-all text-sm font-medium ${isChecked ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                    <input type="checkbox" checked={isChecked} onChange={toggle} className="sr-only" />
                    {r.label}
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">Un instructor puede ser también recepcionista</p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Personal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
