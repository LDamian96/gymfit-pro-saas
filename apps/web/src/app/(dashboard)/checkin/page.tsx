'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ScanLine, CheckCircle2, XCircle, AlertTriangle, Search, Clock, UserCheck, Camera, CameraOff, Users, X, Building } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { api, cachedGet, invalidateCache, unwrap } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useBranches } from '@/hooks/use-branches';
import { BranchFilter } from '@/components/dashboard/branch-filter';

interface CheckInRecord {
  id: string;
  timestamp: string;
  isDuplicate: boolean;
  member: {
    user: { firstName: string; lastName: string };
    qrCode: string;
    membershipType: string;
  };
  scannedBy?: { firstName: string; lastName: string };
}

interface ScanResult {
  success: boolean;
  memberName?: string;
  membershipType?: string;
  isActive?: boolean;
  isDuplicate?: boolean;
  message?: string;
  // Cuando el cliente es de otra sucursal, el backend lo marca crossBranch=true.
  crossBranch?: boolean;
  homeBranch?: { id: string; name: string } | null;
  // Excedió su plan semanal (ej: interdiario = 3 días/sem).
  overLimit?: boolean;
  weeklyVisits?: number;
  weeklyVisitLimit?: number | null;
}

const planLabels: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', ANNUAL: 'Anual' };
const avatarColors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];

interface MemberSearch {
  id: string;
  qrCode: string;
  membershipType: string;
  isActive: boolean;
  // El endpoint /api/v1/members aplana firstName/lastName/email a la raíz.
  firstName: string;
  lastName: string;
  email: string;
}

export default function CheckInPage() {
  const { user } = useAuthStore();
  const { activeBranches, defaultBranchId } = useBranches();
  const isAdmin = user?.role?.split(',').map((r) => r.trim()).includes('ADMIN');
  // Solo admin puede filtrar la lista de hoy por otra sede. '' = todas.
  const [branchListFilter, setBranchListFilter] = useState('');
  // Sucursal donde se hace el escaneo: la del recepcionista logueado, o si es admin
  // sin sucursal asignada, la única activa, o la primera disponible.
  const scanBranchId = user?.branch?.id ?? defaultBranchId ?? activeBranches[0]?.id ?? '';
  const scanBranchName = user?.branch?.name
    ?? (defaultBranchId ? activeBranches.find((b) => b.id === defaultBranchId)?.name : undefined)
    ?? activeBranches[0]?.name
    ?? '';
  const [qrCode, setQrCode] = useState('');
  const [todayCheckins, setTodayCheckins] = useState<CheckInRecord[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [manualResults, setManualResults] = useState<MemberSearch[]>([]);
  const [searchingManual, setSearchingManual] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);

  const fetchToday = useCallback(async (force = false) => {
    try {
      if (force) invalidateCache('/api/v1/checkin/today');
      // TTL corto: el recepcionista necesita ver check-ins recién hechos
      const res = await cachedGet<unknown>('/api/v1/checkin/today', {
        ttl: 8_000,
        params: branchListFilter ? { branchId: branchListFilter } : undefined,
      });
      const arr = unwrap<CheckInRecord[]>(res);
      setTodayCheckins(Array.isArray(arr) ? arr : []);
    } catch { /* sin check-ins */ }
  }, [branchListFilter]);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const handleScan = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    if (!scanBranchId) {
      toast.error('No tienes sucursal asignada — pide al admin que te asigne una');
      return;
    }
    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await api.post('/api/v1/checkin', { qrCode: trimmed, branchId: scanBranchId });
      const checkinData = unwrap<{
        isDuplicate: boolean;
        crossBranch?: boolean;
        homeBranch?: { id: string; name: string } | null;
        overLimit?: boolean;
        weeklyVisits?: number;
        weeklyVisitLimit?: number | null;
        member: { user: { firstName: string; lastName: string }; membershipType: string; isActive: boolean };
      }>(res);

      const memberName = `${checkinData.member.user.firstName} ${checkinData.member.user.lastName}`;
      setScanResult({
        success: true,
        memberName,
        membershipType: checkinData.member.membershipType,
        isDuplicate: checkinData.isDuplicate,
        isActive: checkinData.member.isActive,
        crossBranch: checkinData.crossBranch ?? false,
        homeBranch: checkinData.homeBranch ?? null,
        overLimit: checkinData.overLimit ?? false,
        weeklyVisits: checkinData.weeklyVisits,
        weeklyVisitLimit: checkinData.weeklyVisitLimit,
      });
      // Prioridad de alerta: overLimit > crossBranch > duplicado > ok.
      if (checkinData.overLimit && checkinData.weeklyVisitLimit) {
        toast.error(`${memberName} excedió su plan: ${checkinData.weeklyVisits}/${checkinData.weeklyVisitLimit} días esta semana`, { duration: 8000 });
      } else if (checkinData.crossBranch && checkinData.homeBranch) {
        toast.warning(`${memberName} pertenece a ${checkinData.homeBranch.name}`, { duration: 6000 });
      } else if (checkinData.isDuplicate) {
        toast.warning(`${memberName} — duplicado`);
      } else {
        toast.success(`✓ ${memberName}`);
      }
      fetchToday(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Código QR no válido';
      setScanResult({ success: false, message });
      toast.error(message);
    } finally {
      setIsScanning(false);
      setQrCode('');
    }
  };

  // Iniciar/detener cámara QR
  const toggleCamera = async () => {
    if (cameraActive) {
      // Detener
      try {
        const scanner = html5QrRef.current as { stop: () => Promise<void> } | null;
        if (scanner) await scanner.stop();
      } catch { /* ignore */ }
      setCameraActive(false);
      return;
    }

    // Iniciar
    setCameraActive(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      html5QrRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          handleScan(decodedText);
          scanner.stop().catch(() => {});
          setCameraActive(false);
        },
        () => { /* ignore errors de cada frame */ }
      );
    } catch (err) {
      setCameraActive(false);
      toast.error('No se pudo acceder a la cámara. Usa el campo manual.');
    }
  };

  // Limpiar cámara al desmontar
  useEffect(() => {
    return () => {
      try {
        const scanner = html5QrRef.current as { stop: () => Promise<void> } | null;
        if (scanner) scanner.stop().catch(() => {});
      } catch { /* ignore */ }
    };
  }, []);

  // Búsqueda manual por nombre con debounce
  useEffect(() => {
    const q = manualQuery.trim();
    if (!showManual || q.length < 2) { setManualResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchingManual(true);
      try {
        const res = await api.get(`/api/v1/members?search=${encodeURIComponent(q)}&limit=8&status=active`);
        const body = res as unknown as { data?: MemberSearch[] };
        const arr = Array.isArray(body.data) ? body.data : [];
        setManualResults(arr);
      } catch { setManualResults([]); }
      finally { setSearchingManual(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [manualQuery, showManual]);

  const handleManualAssign = async (member: MemberSearch) => {
    setShowManual(false);
    setManualQuery('');
    setManualResults([]);
    await handleScan(member.qrCode);
  };

  return (
    <div className="md:space-y-6">
      <div className="reveal-up">
        <Header eyebrow="Recepción" title="Check-in QR" description="Escanea el código QR del cliente o búscalo manualmente" />
      </div>

      {/* MOBILE header nativo */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Recepción</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          CHECK-IN
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 md:gap-6 px-4 md:px-0 anim-lego" style={{ animationDelay: '60ms' }}>
        {/* Izquierda: Scanner + Lista */}
        <div className="space-y-4">
          {/* Scanner de cámara */}
          <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <ScanLine className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">Escáner QR</h3>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    {scanBranchName ? <><Building className="h-2.5 w-2.5" /> {scanBranchName}</> : 'Cámara o ingreso manual'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleCamera}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  cameraActive
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                {cameraActive ? <><CameraOff className="h-4 w-4" /> Detener</> : <><Camera className="h-4 w-4" /> Abrir Cámara</>}
              </button>
            </div>

            {/* Visor de cámara */}
            {cameraActive && (
              <div className="mb-4 rounded-xl overflow-hidden bg-black">
                <div id="qr-reader" ref={scannerRef} className="w-full" />
              </div>
            )}

            {/* Input manual */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-3 bg-secondary rounded-xl border border-border focus-within:border-primary/50 transition-colors">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="O escribe el código: GYM-..."
                  className="flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none bg-transparent font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleScan(qrCode)}
                  autoFocus
                />
              </div>
              <button
                onClick={() => handleScan(qrCode)}
                disabled={isScanning || !qrCode.trim()}
                className="px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {isScanning ? '...' : 'OK'}
              </button>
            </div>

            {/* Botón check-in manual por nombre */}
            <button
              onClick={() => setShowManual(true)}
              className="mt-3 w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-secondary transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,90,31,0.15)' }}>
                <Users className="h-4 w-4" style={{ color: '#FF5A1F' }} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-black text-foreground">¿Olvidó su teléfono/QR?</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Busca al cliente por nombre y regístralo manualmente</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded" style={{ background: 'rgba(255,90,31,0.15)', color: '#FF5A1F' }}>Manual</span>
            </button>
          </div>

          {/* Lista de hoy */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground text-sm">Hoy</h3>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded-full">{todayCheckins.length}</span>
              </div>
              {isAdmin && (
                <BranchFilter value={branchListFilter} onChange={setBranchListFilter} />
              )}
            </div>

            <div className="max-h-[350px] overflow-y-auto divide-y divide-border">
              {todayCheckins.length === 0 ? (
                <div className="p-6 text-center">
                  <UserCheck className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Sin entradas hoy</p>
                </div>
              ) : (
                todayCheckins.map((ci, i) => (
                  <div key={ci.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className={`w-7 h-7 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-[9px] font-bold">{ci.member.user.firstName[0]}{ci.member.user.lastName[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{ci.member.user.firstName} {ci.member.user.lastName}</p>
                      {ci.scannedBy && <p className="text-[9px] text-muted-foreground">por {ci.scannedBy.firstName}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(ci.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {ci.isDuplicate && <span className="text-[8px] text-amber-500 font-bold">DUP</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Derecha: Resultado */}
        <div>
          {scanResult?.success ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl border border-border overflow-hidden">
              {/* Banner rojo: cliente excedió su plan semanal — máxima prioridad */}
              {scanResult.overLimit && scanResult.weeklyVisitLimit && (
                <div className="p-4 border-b flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                    <AlertTriangle className="h-5 w-5" style={{ color: '#DC2626' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-black uppercase tracking-wider" style={{ color: '#DC2626' }}>Excedió su plan semanal</p>
                    <p className="text-[12px] mt-0.5" style={{ color: '#991B1B' }}>
                      <strong>{scanResult.weeklyVisits}/{scanResult.weeklyVisitLimit}</strong> días esta semana — ya pasó su límite. Se notificó al admin.
                    </p>
                  </div>
                </div>
              )}
              {/* Banner cross-branch — este cliente NO es de aquí */}
              {scanResult.crossBranch && scanResult.homeBranch && (
                <div className="p-4 border-b border-amber-200 dark:border-amber-900 flex items-center gap-3" style={{ background: 'rgba(245,158,11,0.10)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-amber-100 dark:bg-amber-950">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Cliente de otra sucursal</p>
                    <p className="text-[12px] mt-0.5">Pertenece a <strong>{scanResult.homeBranch.name}</strong> — se notificó al admin</p>
                  </div>
                </div>
              )}
              <div className={`p-6 text-center ${scanResult.crossBranch ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5' : scanResult.isDuplicate ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5' : 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5'}`}>
                <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${scanResult.isDuplicate || scanResult.crossBranch ? 'bg-amber-100 dark:bg-amber-950' : 'bg-emerald-100 dark:bg-emerald-950'}`}>
                  {scanResult.isDuplicate || scanResult.crossBranch ? <AlertTriangle className="h-7 w-7 text-amber-500" /> : <CheckCircle2 className="h-7 w-7 text-emerald-500" />}
                </div>
                <h3 className="text-lg font-black text-foreground">{scanResult.memberName}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {scanResult.isDuplicate ? 'Ya hizo check-in hoy' : scanResult.crossBranch ? 'Check-in registrado (cliente visitante)' : '¡Check-in exitoso!'}
                </p>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Plan</span>
                  <span className="text-xs font-bold text-foreground">{planLabels[scanResult.membershipType || ''] || '—'}</span>
                </div>
                {scanResult.homeBranch && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Building className="h-3 w-3" /> Sucursal home</span>
                    <span className="text-xs font-bold text-foreground">{scanResult.homeBranch.name}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-xs text-muted-foreground">Estado</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    {scanResult.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </motion.div>
          ) : scanResult && !scanResult.success ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <XCircle className="h-7 w-7 text-red-500 shrink-0" />
                <div>
                  <p className="font-bold text-red-800 dark:text-red-300 text-sm">QR no válido</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{scanResult.message}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-8 text-center">
              <ScanLine className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Abre la cámara o escribe el código QR</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal búsqueda manual */}
      {showManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowManual(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-2xl border border-border w-full max-w-[500px] overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' }}>
                  <Users className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black tracking-tight text-foreground">Check-in manual</h3>
                  <p className="text-[11px] text-muted-foreground">Busca al cliente por nombre o email</p>
                </div>
              </div>
              <button onClick={() => setShowManual(false)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 px-3 py-3 bg-secondary rounded-xl border border-border focus-within:border-primary/50">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  autoFocus
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="Ej. Carlos, laura@..."
                  className="flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none bg-transparent"
                />
                {searchingManual && <span className="text-[10px] text-muted-foreground">...</span>}
              </div>

              <div className="mt-4 max-h-[320px] overflow-y-auto space-y-1">
                {manualQuery.trim().length < 2 ? (
                  <p className="text-[11px] text-muted-foreground text-center py-8">Escribe al menos 2 letras</p>
                ) : manualResults.length === 0 && !searchingManual ? (
                  <p className="text-[11px] text-muted-foreground text-center py-8">Sin coincidencias</p>
                ) : (
                  manualResults.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleManualAssign(m)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary text-left transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 fire-card">
                        <span className="text-[11px] font-display text-white">{m.firstName?.[0]}{m.lastName?.[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-foreground truncate">{m.firstName} {m.lastName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{m.email} · <span className="font-code">{m.qrCode}</span></p>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded" style={{ background: m.isActive ? 'rgba(132,204,22,0.15)' : 'rgba(239,68,68,0.15)', color: m.isActive ? '#65A30D' : '#EF4444' }}>
                        {m.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
