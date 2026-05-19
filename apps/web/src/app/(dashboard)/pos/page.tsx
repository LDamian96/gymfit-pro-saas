'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Search, ShoppingCart, X, Plus, Minus, Trash2, User, UserCheck, Package,
  Banknote, CreditCard, Smartphone, CheckCircle2, Receipt, Store,
} from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { api, cachedGet, invalidateCache, unwrap } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { Lock, Building } from 'lucide-react';
import { useBranches } from '@/hooks/use-branches';

interface Product {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  category: string | null;
  publicPrice: number;
  memberPrice: number | null;
  stock: number | null;
  isActive: boolean;
}

interface MemberSearch {
  id: string;
  qrCode: string;
  // El endpoint /api/v1/members aplana los campos a la raíz.
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
  useMemberPrice: boolean;
}

type PaymentMethod = 'CASH' | 'YAPE' | 'PLIN' | 'BCP' | 'CARD' | 'OTHER';

interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

type IconCmp = React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties; fill?: string }>;
const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: IconCmp; color: string }[] = [
  { value: 'CASH', label: 'Efectivo', icon: Banknote, color: '#16A34A' },
  { value: 'YAPE', label: 'Yape', icon: Smartphone, color: '#A855F7' },
  { value: 'PLIN', label: 'Plin', icon: Smartphone, color: '#06B6D4' },
  { value: 'BCP', label: 'BCP', icon: CreditCard, color: '#F59E0B' },
  { value: 'CARD', label: 'Tarjeta', icon: CreditCard, color: '#0EA5E9' },
  { value: 'OTHER', label: 'Otro', icon: Receipt, color: '#737373' },
];

// Denominaciones rápidas para efectivo (en soles)
const QUICK_CASH = [10, 20, 50, 100, 200, 500];

const FONT = "'Plus Jakarta Sans', Inter, sans-serif";

export default function POSPage() {
  const { user } = useAuthStore();
  const { activeBranches, defaultBranchId } = useBranches();
  const isAdmin = user?.role?.split(',').map((r) => r.trim()).includes('ADMIN');
  // Sede donde se hace la venta. Recep/Trainer: forzada a la suya. Admin: puede
  // elegir si hay 2+ (selector visible) o queda fija con la única (auto).
  const [branchId, setBranchId] = useState('');
  useEffect(() => {
    if (branchId) return;
    setBranchId(user?.branch?.id ?? defaultBranchId ?? activeBranches[0]?.id ?? '');
  }, [user?.branch?.id, defaultBranchId, activeBranches, branchId]);
  const showBranchPicker = isAdmin && activeBranches.length >= 2;

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Member selector
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState<MemberSearch[]>([]);
  const [member, setMember] = useState<MemberSearch | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [memberSheetOpen, setMemberSheetOpen] = useState(false);

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ id: string; total: number; paid: number; change: number } | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);

  const fetchProducts = useCallback(async (force = false, bId?: string) => {
    try {
      if (force) invalidateCache('/api/v1/products');
      const params: Record<string, unknown> = { onlyActive: true };
      if (bId) params.branchId = bId; // stock de la sede de venta
      const res = await cachedGet<unknown>('/api/v1/products', { params, ttl: 30_000 });
      const arr = unwrap<Product[]>(res);
      setProducts(Array.isArray(arr) ? arr.filter((p) => p.isActive) : []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, []);

  // Re-fetch productos cuando cambia la sede → stock correcto por sucursal.
  useEffect(() => {
    if (branchId) fetchProducts(false, branchId);
  }, [branchId, fetchProducts]);

  // Carga inicial: productos + permisos en paralelo (caché agresiva)
  useEffect(() => {
    const roles = (user?.role || '').split(',').map((r) => r.trim());
    const isAdmin = roles.includes('ADMIN');

    const tasks: Promise<unknown>[] = [fetchProducts()];
    if (isAdmin) {
      setAllowed(true);
    } else {
      tasks.push(
        cachedGet<unknown>('/api/v1/tenant/settings', { ttl: 60_000 })
          .then((r) => {
            const d = unwrap<{ trainerPosEnabled: boolean; receptionistPosEnabled: boolean }>(r);
            if (!d) { setAllowed(true); return; }
            if (roles.includes('TRAINER')) setAllowed(d.trainerPosEnabled);
            else if (roles.includes('RECEPTIONIST')) setAllowed(d.receptionistPosEnabled);
            else setAllowed(true);
          })
          .catch(() => setAllowed(true)),
      );
    }
    Promise.allSettled(tasks);
  }, [user?.role, fetchProducts]);

  // Búsqueda miembros con debounce
  useEffect(() => {
    const q = memberQuery.trim();
    if (q.length < 2) { setMemberResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/api/v1/members?search=${encodeURIComponent(q)}&limit=8&status=active`);
        const body = res as unknown as { data?: MemberSearch[] };
        setMemberResults(Array.isArray(body.data) ? body.data : []);
      } catch { setMemberResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [memberQuery]);

  // Auto: si hay miembro, todos los items que tengan memberPrice usan precio miembro
  useEffect(() => {
    if (member) {
      setCart((c) => c.map((it) => ({ ...it, useMemberPrice: it.product.memberPrice != null })));
    } else {
      setCart((c) => c.map((it) => ({ ...it, useMemberPrice: false })));
    }
  }, [member]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const addToCart = (product: Product) => {
    setCart((c) => {
      const existing = c.find((it) => it.product.id === product.id);
      if (existing) {
        if (product.stock != null && existing.quantity >= product.stock) {
          toast.error(`Stock insuficiente (${product.stock})`);
          return c;
        }
        return c.map((it) => it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it);
      }
      return [...c, { product, quantity: 1, useMemberPrice: !!member && product.memberPrice != null }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((c) => c.map((it) => {
      if (it.product.id !== productId) return it;
      const newQty = it.quantity + delta;
      if (newQty <= 0) return null as unknown as CartItem;
      if (it.product.stock != null && newQty > it.product.stock) {
        toast.error(`Stock máximo: ${it.product.stock}`);
        return it;
      }
      return { ...it, quantity: newQty };
    }).filter(Boolean));
  };

  const removeFromCart = (productId: string) => {
    setCart((c) => c.filter((it) => it.product.id !== productId));
  };

  const toggleMemberPrice = (productId: string) => {
    setCart((c) => c.map((it) => it.product.id === productId ? { ...it, useMemberPrice: !it.useMemberPrice } : it));
  };

  const itemPrice = (item: CartItem) => {
    if (item.useMemberPrice && item.product.memberPrice != null) return item.product.memberPrice;
    return item.product.publicPrice;
  };

  const total = cart.reduce((sum, it) => sum + itemPrice(it) * it.quantity, 0);
  const itemCount = cart.reduce((sum, it) => sum + it.quantity, 0);

  const selectMember = (m: MemberSearch) => {
    setMember(m);
    setCustomerName('');
    setMemberSheetOpen(false);
    setMemberQuery('');
  };

  const clearCustomer = () => {
    setMember(null);
    setCustomerName('');
  };

  const openPayment = () => {
    if (cart.length === 0) { toast.error('Agrega productos al carrito'); return; }
    setPayments([]);
    setPaymentOpen(true);
    setShowCart(false);
  };

  const submitSale = async () => {
    if (payments.length === 0) { toast.error('Agrega al menos un pago'); return; }
    const paid = payments.reduce((s, p) => s + p.amount, 0);
    if (paid < total - 0.001) { toast.error(`Falta S/ ${(total - paid).toFixed(2)}`); return; }
    setSubmitting(true);
    try {
      const body = {
        items: cart.map((it) => ({ productId: it.product.id, quantity: it.quantity, useMemberPrice: it.useMemberPrice })),
        payments: payments.map((p) => ({ method: p.method, amount: p.amount, reference: p.reference })),
        memberId: member?.id || undefined,
        customerName: !member && customerName.trim() ? customerName.trim() : undefined,
        notes: notes.trim() || undefined,
        // Backend acepta esto solo del admin; recep/trainer lo ignora y usa la suya.
        branchId: branchId || undefined,
      };
      const res = await api.post('/api/v1/sales', body);
      const sale = unwrap<{ id: string; total: number; paidAmount: number; changeAmount: number }>(res);
      setSuccess({ id: sale.id, total: sale.total, paid: sale.paidAmount, change: sale.changeAmount });
      setCart([]);
      setMember(null); setCustomerName(''); setNotes('');
      setPayments([]); setPaymentOpen(false);
      fetchProducts(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Error al registrar venta');
    } finally {
      setSubmitting(false);
    }
  };

  const customerLabel = member
    ? `${member.firstName} ${member.lastName}`
    : customerName || 'Cliente sin registrar';

  // Categorías únicas para chips horizontales (móvil) — antes del early return
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => { if (p.category) set.add(p.category); });
    return Array.from(set);
  }, [products]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const matchedProducts = useMemo(() => {
    if (!activeCategory) return filteredProducts;
    return filteredProducts.filter((p) => p.category === activeCategory);
  }, [filteredProducts, activeCategory]);

  // Reset página al cambiar filtros/búsqueda
  useEffect(() => { setPage(1); }, [search, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(matchedProducts.length / PER_PAGE));
  const visibleProducts = useMemo(() =>
    matchedProducts.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [matchedProducts, page],
  );

  if (allowed === false) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5" style={{ fontFamily: FONT }}>
        <Header title="Punto de Venta" description="Acceso al POS restringido por el administrador" />
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(115,115,115,0.15)' }}>
            <Lock className="h-8 w-8" style={{ color: '#737373' }} strokeWidth={2} />
          </div>
          <h3 className="text-[18px] font-black tracking-tight">Sin permiso para vender</h3>
          <p className="text-[13px] text-muted-foreground mt-2 max-w-md mx-auto">
            El administrador desactivó el punto de venta para tu rol. Si necesitas vender, contáctalo para activarlo.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="lg:space-y-5 anim-lego" style={{ fontFamily: FONT }}>
      <div className="hidden md:block">
        <Header eyebrow="Punto de venta" title="Vender" description="Registra ventas de productos. El stock se descuenta automáticamente." />

        {/* Banner de sucursal — prominente cuando hay varias, sticky a la izquierda */}
        {showBranchPicker && (
          <div className="mt-2 mb-4 reveal-up">
            <div className="inline-flex items-center gap-4 px-5 py-3 rounded-2xl glass-card warm shine-border">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center fire-card shrink-0">
                <Building className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="label-athletic text-[var(--gym-orange)]">/ Vendiendo en</span>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="appearance-none bg-transparent font-display text-[22px] tracking-tight leading-tight text-foreground outline-none cursor-pointer pr-6 -mx-1 px-1 hover:text-[var(--gym-orange)] transition-colors"
                >
                  {activeBranches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <span className="font-code text-[10px] text-muted-foreground tracking-[0.18em] pl-2 border-l border-border ml-2 pl-3">CLICK PARA CAMBIAR ↕</span>
            </div>
          </div>
        )}
        {!showBranchPicker && branchId && activeBranches.length === 1 && (
          <div className="mt-2 mb-4 reveal-up">
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl glass-card">
              <Building className="h-4 w-4 text-[var(--gym-orange)]" />
              <span className="label-athletic text-muted-foreground">/ Vendiendo en</span>
              <span className="font-display text-[16px] tracking-tight text-foreground">{activeBranches[0].name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Selector de sede mobile (solo admin con 2+) */}
      {showBranchPicker && (
        <div className="md:hidden px-4 mb-2">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-border">
            <Building className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground shrink-0">Sede</span>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
              className="flex-1 bg-transparent text-[13px] font-bold outline-none">
              {activeBranches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ===== MOBILE NATIVO ===== */}
      <div className="md:hidden -mt-1">
        {/* Top bar nativo: título + carrito chip */}
        <div className="px-4 pt-2 pb-3 reveal-up flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="label-athletic text-[var(--gym-orange)]">/ Punto de venta</p>
            <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground truncate" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
              VENDER
            </h1>
          </div>
          {cart.length > 0 && (
            <button onClick={() => setShowCart(true)} className="press relative w-11 h-11 rounded-2xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)',
              boxShadow: '0 8px 18px -4px rgba(255,90,31,0.45)',
            }}>
              <ShoppingCart className="h-5 w-5 text-white" strokeWidth={2.5} />
              <span className="pos-badge-pop absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-black"
                style={{ background: '#0A0A0B', color: '#FFF', border: '2px solid hsl(var(--background))' }}>
                {itemCount}
              </span>
            </button>
          )}
        </div>

        {/* Búsqueda sticky elegante */}
        <div className="sticky top-14 z-20 px-4 pt-1 pb-3 anim-slide-down" style={{
          background: 'linear-gradient(to bottom, hsl(var(--background)) 70%, transparent)',
        }}>
          <div className="flex items-center gap-2 px-3.5 py-3 rounded-2xl"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 1px 2px rgba(10,10,11,0.04)' }}>
            <Search className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} inputMode="search"
              placeholder="Buscar producto…"
              className="flex-1 text-[14px] bg-transparent outline-none" />
            {search && (
              <button onClick={() => setSearch('')} className="press w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--secondary))' }}>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Chips de categorías (snap horizontal) */}
        {categories.length > 0 && (
          <div className="snap-row px-4 pb-3 anim-slide-up" style={{ animationDelay: '40ms' }}>
            <button onClick={() => setActiveCategory(null)}
              className="press shrink-0 px-4 h-9 rounded-full text-[12px] font-black uppercase tracking-wider"
              style={{
                background: activeCategory === null ? 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' : 'hsl(var(--card))',
                color: activeCategory === null ? '#FFF' : 'hsl(var(--foreground))',
                border: activeCategory === null ? 'none' : '1px solid hsl(var(--border))',
                boxShadow: activeCategory === null ? '0 6px 14px -4px rgba(255,90,31,0.45)' : 'none',
              }}>
              Todo
            </button>
            {categories.map((c) => (
              <button key={c} onClick={() => setActiveCategory(c)}
                className="press shrink-0 px-4 h-9 rounded-full text-[12px] font-black uppercase tracking-wider"
                style={{
                  background: activeCategory === c ? 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' : 'hsl(var(--card))',
                  color: activeCategory === c ? '#FFF' : 'hsl(var(--foreground))',
                  border: activeCategory === c ? 'none' : '1px solid hsl(var(--border))',
                  boxShadow: activeCategory === c ? '0 6px 14px -4px rgba(255,90,31,0.45)' : 'none',
                }}>
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Grid productos móvil */}
        <div className="px-4 pb-32">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl skeleton-shimmer" />)}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="rounded-3xl py-16 px-6 text-center anim-pop" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center anim-float" style={{ background: 'rgba(115,115,115,0.10)' }}>
                <Package className="h-7 w-7" style={{ color: 'hsl(var(--muted-foreground))' }} />
              </div>
              <p className="text-[14px] font-black">Sin productos</p>
              <p className="text-[11px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{search || activeCategory ? 'Prueba con otra búsqueda' : 'Crea productos en /shop'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 anim-stagger">
              {visibleProducts.map((p) => {
                const inCart = cart.find((it) => it.product.id === p.id);
                const stockOut = p.stock != null && p.stock <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => !stockOut && addToCart(p)}
                    disabled={stockOut}
                    className="pos-tile press relative rounded-2xl overflow-hidden text-left"
                    style={{
                      background: 'hsl(var(--card))',
                      border: inCart ? '2px solid #FF5A1F' : '1px solid hsl(var(--border))',
                      opacity: stockOut ? 0.5 : 1,
                      boxShadow: inCart ? '0 8px 20px -8px rgba(255,90,31,0.40)' : '0 1px 2px rgba(10,10,11,0.04)',
                    }}
                  >
                    <div className="relative aspect-square bg-secondary">
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 200px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="h-10 w-10" style={{ color: 'hsl(var(--muted-foreground))', opacity: .25 }} /></div>
                      )}
                      {inCart && (
                        <div className="pos-badge-pop absolute top-2 right-2 min-w-[28px] h-7 px-2 rounded-full flex items-center justify-center text-white text-[12px] font-black"
                          style={{ background: '#FF5A1F', boxShadow: '0 6px 14px -3px rgba(255,90,31,0.55)' }}>
                          ×{inCart.quantity}
                        </div>
                      )}
                      {stockOut && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ background: '#0A0A0B', color: '#FFF' }}>Sin stock</span>
                        </div>
                      )}
                      {p.brand && !stockOut && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase truncate max-w-[80%]"
                          style={{ background: 'rgba(255,255,255,0.95)', color: '#0A0A0B', backdropFilter: 'blur(8px)' }}>
                          {p.brand}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-[12px] font-black leading-tight line-clamp-2 min-h-[2.4em]">{p.name}</p>
                      <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-[16px] font-black tracking-tight" style={{ color: '#FF5A1F' }}>S/ {p.publicPrice.toFixed(p.publicPrice % 1 ? 2 : 0)}</span>
                        {p.memberPrice != null && (
                          <span className="text-[10px] font-black px-1.5 rounded" style={{ background: 'rgba(22,163,74,0.12)', color: '#16A34A' }}>
                            S/ {p.memberPrice.toFixed(0)}
                          </span>
                        )}
                      </div>
                      {p.stock != null && p.stock > 0 && (
                        <p className="text-[9px] mt-1 font-bold" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.stock} disponibles</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Paginación 12/pag — solo si hay más de 1 página */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1 anim-fade">
              <p className="text-[10px] font-black uppercase tracking-wider tabular-nums" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, matchedProducts.length)} de {matchedProducts.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="press w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 text-[18px] font-black"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  ‹
                </button>
                <span className="text-[12px] font-black tabular-nums px-2">
                  {page} <span style={{ color: 'hsl(var(--muted-foreground))' }}>/ {totalPages}</span>
                </span>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="press w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 text-[18px] font-black"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== DESKTOP ===== */}
      <div className="hidden md:grid lg:grid-cols-[1fr_380px] gap-5">
        {/* Columna izquierda — productos */}
        <div className="space-y-4">
          {/* Búsqueda */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-border bg-card">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto, marca o categoría..."
              className="flex-1 text-sm bg-transparent outline-none" />
            {search && <button onClick={() => setSearch('')}><X className="h-4 w-4 text-muted-foreground" /></button>}
          </div>

          {!loading && matchedProducts.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center anim-fade">
              <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-[14px] font-bold">Sin productos</p>
              <p className="text-[11px] text-muted-foreground mt-1">{search ? 'Prueba con otra búsqueda' : 'Crea productos en /shop'}</p>
            </div>
          ) : !loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 anim-stagger" key={`pos-desk-${activeCategory}-${visibleProducts.length}-${page}`}>
              {visibleProducts.map((p) => {
                const inCart = cart.find((it) => it.product.id === p.id);
                const stockOut = p.stock != null && p.stock <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => !stockOut && addToCart(p)}
                    disabled={stockOut}
                    className={`pos-tile relative bg-card border rounded-2xl overflow-hidden text-left ${
                      stockOut ? 'opacity-50 cursor-not-allowed border-border' : 'border-border cursor-pointer'
                    }`}
                  >
                    <div className="relative aspect-square bg-secondary">
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="200px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="h-10 w-10 text-muted-foreground/20" /></div>
                      )}
                      {inCart && (
                        <div className="pos-badge-pop absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-black"
                          style={{ background: '#FF5A1F', boxShadow: '0 4px 12px rgba(255,90,31,0.35)' }}>
                          {inCart.quantity}
                        </div>
                      )}
                      {stockOut && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase" style={{ background: 'rgba(0,0,0,0.8)', color: '#FFF' }}>Sin stock</span>
                      )}
                      {p.brand && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase truncate max-w-[80%]" style={{ background: 'rgba(255,90,31,0.95)', color: '#FFF' }}>
                          {p.brand}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-[12px] font-black leading-tight line-clamp-2 min-h-[2.5em]">{p.name}</p>
                      <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-[15px] font-black" style={{ color: '#FF5A1F' }}>S/ {p.publicPrice.toFixed(0)}</span>
                        {p.memberPrice != null && <span className="text-[10px] font-black" style={{ color: '#16A34A' }}>· S/ {p.memberPrice.toFixed(0)} m</span>}
                      </div>
                      {p.stock != null && <p className="text-[9px] text-muted-foreground mt-0.5">Stock: {p.stock}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna derecha — Carrito (desktop sticky) */}
        <div className="hidden lg:block">
          <div className="sticky top-4 bg-card rounded-2xl border border-border overflow-hidden">
            <CartPanel
              cart={cart} total={total} member={member} customerName={customerName} setCustomerName={setCustomerName}
              notes={notes} setNotes={setNotes}
              updateQty={updateQty} removeFromCart={removeFromCart} toggleMemberPrice={toggleMemberPrice}
              clearCustomer={clearCustomer} openMemberSheet={() => setMemberSheetOpen(true)}
              onMemberPick={selectMember}
              openPayment={openPayment} customerLabel={customerLabel}
            />
          </div>
        </div>
      </div>

      {/* Barra FIJA pegada justo encima del bottom-nav móvil. Permanente apenas
          hay productos en el carrito → un tap lleva directo al proceso de cobro
          (sin scroll, sin buscar el botón). */}
      {cart.length > 0 && !showCart && (
        <div className="md:hidden fixed left-0 right-0 z-[60] anim-slide-up"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 60px)' }}>
          <button onClick={() => setShowCart(true)}
            className="press w-full px-5 py-3.5 text-white font-black flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)',
              boxShadow: '0 -8px 28px -6px rgba(255,90,31,0.5)',
            }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <ShoppingCart className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-80">{itemCount} producto{itemCount !== 1 ? 's' : ''} seleccionado{itemCount !== 1 ? 's' : ''}</p>
              <p className="text-[18px] font-black tracking-tight leading-none mt-0.5">S/ {total.toFixed(2)}</p>
            </div>
            <span className="text-[12px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.2)' }}>Cobrar →</span>
          </button>
        </div>
      )}

      {/* Sheet carrito mobile — flex col con footer sticky. Items hacen scroll, total/cobrar siempre visible */}
      {showCart && (
        <div className="md:hidden fixed inset-0 z-[70]" onClick={() => setShowCart(false)}>
          <div className="absolute inset-0 native-overlay" style={{ background: 'rgba(0,0,0,0.55)' }} />
          <div onClick={(e) => e.stopPropagation()} className="native-sheet absolute bottom-0 left-0 right-0 rounded-t-[28px] flex flex-col bg-card" style={{ height: '92vh', maxHeight: '92vh', boxShadow: '0 -16px 48px -8px rgba(0,0,0,0.25)' }}>
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="drag-handle" />
            </div>
            <CartPanel
              cart={cart} total={total} member={member} customerName={customerName} setCustomerName={setCustomerName}
              notes={notes} setNotes={setNotes}
              updateQty={updateQty} removeFromCart={removeFromCart} toggleMemberPrice={toggleMemberPrice}
              clearCustomer={clearCustomer} openMemberSheet={() => setMemberSheetOpen(true)}
              onMemberPick={selectMember}
              openPayment={openPayment} customerLabel={customerLabel}
              onClose={() => setShowCart(false)}
              fillHeight
            />
          </div>
        </div>
      )}

      {/* Sheet seleccionar miembro — z-[80] para quedar SOBRE el sheet del carrito */}
      {memberSheetOpen && (
        <div className="fixed inset-0 z-[80]" onClick={() => setMemberSheetOpen(false)}>
          <div className="absolute inset-0 native-overlay" style={{ background: 'rgba(0,0,0,0.55)' }} />
          <div onClick={(e) => e.stopPropagation()} className="native-sheet absolute bottom-0 left-0 right-0 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:max-w-md sm:rounded-2xl rounded-t-[28px] bg-card" style={{ maxHeight: '85vh', boxShadow: '0 -16px 48px -8px rgba(0,0,0,0.25)' }}>
            <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="drag-handle" /></div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-[16px] font-black tracking-tight">Seleccionar miembro</h3>
              <button onClick={() => setMemberSheetOpen(false)} className="press w-9 h-9 rounded-xl flex items-center justify-center bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-secondary mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input autoFocus value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} placeholder="Nombre, email o QR…" className="flex-1 text-sm bg-transparent outline-none" />
              </div>
              <div className="space-y-1 max-h-[320px] overflow-y-auto">
                {memberQuery.length < 2 ? (
                  <p className="text-[12px] text-muted-foreground text-center py-6">Escribe 2+ letras</p>
                ) : memberResults.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground text-center py-6">Sin resultados</p>
                ) : memberResults.map((m) => (
                  <button key={m.id} onClick={() => selectMember(m)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary text-left">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center fire-card">
                      <span className="text-[11px] font-display text-white">{m.firstName?.[0]}{m.lastName?.[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold truncate">{m.firstName} {m.lastName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{m.email} · <span className="font-code">{m.qrCode}</span></p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de pago */}
      {paymentOpen && (
        <PaymentModal
          total={total}
          payments={payments}
          setPayments={setPayments}
          onConfirm={submitSale}
          onClose={() => !submitting && setPaymentOpen(false)}
          submitting={submitting}
        />
      )}

      {/* Modal éxito — render con Portal a document.body para evitar que el
          backdrop-filter del top/tab bar mobile rompa el position:fixed */}
      {success && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-5"
          style={{
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={() => setSuccess(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="reveal-scale glass-card rounded-3xl p-7 text-center w-full max-w-sm relative"
            style={{ boxShadow: '0 32px 80px -16px rgba(0,0,0,0.6)' }}
          >
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(132,204,22,0.15)', border: '1px solid rgba(132,204,22,0.3)' }}>
              <CheckCircle2 className="h-9 w-9" style={{ color: 'var(--gym-lime)' }} strokeWidth={2.5} />
            </div>
            <p className="label-athletic text-[var(--gym-lime)]">/ Venta completada</p>
            <h3 className="font-display text-[26px] tracking-tight mt-1 text-foreground">¡PERFECTO!</h3>
            <div className="mt-5 space-y-2">
              <div className="flex items-baseline justify-between p-3 rounded-xl bg-secondary">
                <span className="label-athletic text-muted-foreground">/ Total</span>
                <span className="hero-num text-foreground" style={{ fontSize: '24px' }}>S/ {success.total.toFixed(2)}</span>
              </div>
              <div className="flex items-baseline justify-between p-3 rounded-xl bg-secondary">
                <span className="label-athletic text-muted-foreground">/ Pagado</span>
                <span className="hero-num text-foreground" style={{ fontSize: '24px' }}>S/ {success.paid.toFixed(2)}</span>
              </div>
              {success.change > 0.001 && (
                <div className="flex items-baseline justify-between p-3 rounded-xl" style={{ background: 'rgba(132,204,22,0.12)', border: '1px solid rgba(132,204,22,0.3)' }}>
                  <span className="label-athletic" style={{ color: 'var(--gym-lime)' }}>/ Vuelto</span>
                  <span className="hero-num" style={{ fontSize: '28px', color: 'var(--gym-lime)' }}>S/ {success.change.toFixed(2)}</span>
                </div>
              )}
            </div>
            <p className="font-code text-[10px] tracking-wider text-muted-foreground mt-3">#{success.id.slice(-6).toUpperCase()}</p>
            <button onClick={() => setSuccess(null)} className="btn-fire w-full mt-6">
              Nueva venta
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ====== CART PANEL ======
function CartPanel(props: {
  cart: CartItem[]; total: number; member: MemberSearch | null; customerName: string; setCustomerName: (s: string) => void;
  notes: string; setNotes: (s: string) => void;
  updateQty: (id: string, delta: number) => void; removeFromCart: (id: string) => void; toggleMemberPrice: (id: string) => void;
  clearCustomer: () => void; openMemberSheet: () => void;
  // Callback opcional: si está, el autocomplete inline selecciona miembro directamente
  // en lugar de abrir el sheet aparte.
  onMemberPick?: (m: MemberSearch) => void;
  openPayment: () => void; customerLabel: string;
  onClose?: () => void;
  // Cuando es true, el panel usa flex-1 para llenar el sheet (footer sticky abajo).
  fillHeight?: boolean;
}) {
  const { cart, total, member, customerName, setCustomerName, notes, setNotes,
    updateQty, removeFromCart, toggleMemberPrice, clearCustomer, openMemberSheet, onMemberPick, openPayment, customerLabel, onClose, fillHeight } = props;

  // Autocomplete inline de miembros — escribir "lau" muestra resultados al instante.
  const [memberQuery, setMemberQuery] = useState('');
  const [memberHits, setMemberHits] = useState<MemberSearch[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  useEffect(() => {
    if (member) return; // si ya hay miembro elegido, no buscar
    const q = memberQuery.trim();
    if (q.length < 2) { setMemberHits([]); return; }
    const t = setTimeout(async () => {
      setMemberSearching(true);
      try {
        const res = await api.get(`/api/v1/members?search=${encodeURIComponent(q)}&limit=6&status=active`);
        const body = res as unknown as { data?: MemberSearch[] };
        setMemberHits(Array.isArray(body.data) ? body.data : []);
      } catch { setMemberHits([]); }
      finally { setMemberSearching(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [memberQuery, member]);

  return (
    <div className={fillHeight ? 'flex flex-col min-h-0 flex-1' : 'contents'}>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" style={{ color: '#FF5A1F' }} />
          <h3 className="text-[15px] font-black tracking-tight">Carrito ({cart.length})</h3>
        </div>
        {onClose && <button onClick={onClose} className="press w-9 h-9 rounded-xl flex items-center justify-center bg-secondary"><X className="h-4 w-4" /></button>}
      </div>

      {/* Cliente — con autocomplete inline */}
      <div className="px-5 py-3 border-b border-border shrink-0">
        <p className="label-athletic text-muted-foreground mb-2">/ Cliente</p>
        {member ? (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary">
            <UserCheck className="h-4 w-4" style={{ color: 'var(--gym-lime)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold truncate">{customerLabel}</p>
              <p className="text-[10px] text-muted-foreground">Miembro · precios especiales</p>
            </div>
            <button onClick={() => { clearCustomer(); setMemberQuery(''); }} className="press p-1 rounded">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <div className="space-y-2 relative">
            <input
              value={memberQuery}
              onChange={(e) => { setMemberQuery(e.target.value); setCustomerName(''); }}
              placeholder="Buscar miembro (escribe nombre o email)…"
              className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-[12px] outline-none focus:border-primary transition-colors"
            />
            {/* Lista dropdown de hits */}
            {memberQuery.trim().length >= 2 && (
              <div className="rounded-xl bg-card border border-border overflow-hidden max-h-[200px] overflow-y-auto">
                {memberSearching ? (
                  <p className="text-[11px] text-muted-foreground text-center py-3">Buscando…</p>
                ) : memberHits.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground text-center py-3">Sin coincidencias</p>
                ) : (
                  memberHits.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        if (onMemberPick) onMemberPick(m);
                        else openMemberSheet();
                        setMemberQuery('');
                        setMemberHits([]);
                      }}
                      className="w-full flex items-center gap-2 p-2.5 hover:bg-secondary/60 text-left border-b border-border last:border-0"
                    >
                      <div className="w-8 h-8 rounded-lg fire-card flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-display text-white">{m.firstName?.[0]}{m.lastName?.[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold truncate">{m.firstName} {m.lastName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{m.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="O nombre del cliente walk-in (opcional)"
              className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-[12px] outline-none focus:border-primary transition-colors" />
          </div>
        )}
      </div>

      {/* Items — scroll dentro */}
      <div className={fillHeight ? 'flex-1 min-h-0 overflow-y-auto' : 'max-h-[320px] overflow-y-auto'}>
        {cart.length === 0 ? (
          <div className="p-8 text-center">
            <Store className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-[12px] text-muted-foreground">Toca productos para agregar</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {cart.map((it) => {
              const price = it.useMemberPrice && it.product.memberPrice != null ? it.product.memberPrice : it.product.publicPrice;
              return (
                <div key={it.product.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-secondary">
                    {it.product.imageUrl ? <Image src={it.product.imageUrl} alt="" fill className="object-cover" sizes="48px" /> : <Package className="h-5 w-5 m-auto text-muted-foreground/30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black truncate">{it.product.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {it.product.memberPrice != null && (
                        <button onClick={() => toggleMemberPrice(it.product.id)}
                          className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
                          style={{
                            background: it.useMemberPrice ? '#16A34A' : 'rgba(115,115,115,0.15)',
                            color: it.useMemberPrice ? '#FFF' : '#737373',
                          }}>
                          {it.useMemberPrice ? 'Miembro' : 'Público'}
                        </button>
                      )}
                      <span className="text-[10px] text-muted-foreground">S/ {price.toFixed(2)} c/u</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(it.product.id, -1)} className="w-7 h-7 rounded-md flex items-center justify-center bg-secondary"><Minus className="h-3 w-3" /></button>
                    <span className="text-[13px] font-black w-6 text-center">{it.quantity}</span>
                    <button onClick={() => updateQty(it.product.id, +1)} className="w-7 h-7 rounded-md flex items-center justify-center bg-secondary"><Plus className="h-3 w-3" /></button>
                  </div>
                  <button onClick={() => removeFromCart(it.product.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-red-500"><Trash2 className="h-3 w-3" /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Total + botón cobrar — STICKY al fondo del sheet, siempre visible */}
      {cart.length > 0 && (
        <div className="px-5 py-4 border-t border-border space-y-3 shrink-0 bg-card"
          style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas (opcional)"
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-[12px] outline-none focus:border-primary transition-colors" />

          <div className="flex items-baseline justify-between pt-2 border-t border-border">
            <span className="label-athletic text-muted-foreground">/ Total a cobrar</span>
            <span className="hero-num" style={{ fontSize: '28px', color: 'var(--gym-orange)' }}>S/ {total.toFixed(2)}</span>
          </div>

          <button onClick={openPayment} className="btn-fire w-full">
            <Receipt className="h-4 w-4" />
            Pagar S/ {total.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
}

// ====== PAYMENT MODAL ======
function PaymentModal(props: {
  total: number; payments: PaymentEntry[]; setPayments: (p: PaymentEntry[]) => void;
  onConfirm: () => void; onClose: () => void; submitting: boolean;
}) {
  const { total, payments, setPayments, onConfirm, onClose, submitting } = props;
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [amountStr, setAmountStr] = useState('');

  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const diff = +(paid - total).toFixed(2);
  const missing = diff < 0 ? Math.abs(diff) : 0;
  const change = diff > 0 ? diff : 0;
  const status: 'missing' | 'exact' | 'change' = missing > 0.001 ? 'missing' : Math.abs(diff) < 0.001 ? 'exact' : 'change';

  const addPayment = () => {
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (!amount || amount <= 0) { toast.error('Ingresa un monto válido'); return; }
    setPayments([...payments, { method, amount: +amount.toFixed(2) }]);
    setAmountStr('');
  };

  const removePayment = (idx: number) => {
    setPayments(payments.filter((_, i) => i !== idx));
  };

  // Pre-llenar con monto faltante (lo que falta para completar)
  const fillRemaining = () => {
    if (missing > 0) setAmountStr(missing.toFixed(2));
  };

  // Botones de denominaciones rápidas (efectivo)
  const addQuickCash = (denom: number) => {
    setMethod('CASH');
    setAmountStr(String(denom));
  };

  const opt = PAYMENT_OPTIONS.find((o) => o.value === method)!;

  // Portal a body — el main del dashboard tiene overflow-y-auto/transform que rompe
  // el position:fixed normal. Con portal, el modal se ancla al viewport real.
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center native-overlay p-0 sm:p-4"
      style={{
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="native-sheet sm:anim-pop bg-card w-full sm:max-w-md sm:rounded-3xl rounded-t-[28px] flex flex-col" style={{ maxHeight: '92vh', boxShadow: '0 -16px 48px -8px rgba(0,0,0,0.35)' }}>
        {/* Drag handle mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-2">
          <div className="drag-handle" />
        </div>

        {/* Header con total */}
        <div className="px-5 pt-3 sm:pt-5 pb-4 border-b border-border flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total a cobrar</p>
            <p className="text-[32px] font-black leading-none mt-1" style={{ color: '#FF5A1F' }}>S/ {total.toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Lista de pagos agregados */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Pagos registrados</p>
              {payments.map((p, i) => {
                const o = PAYMENT_OPTIONS.find((x) => x.value === p.method)!;
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${o.color}25` }}>
                      <o.icon className="h-4 w-4" style={{ color: o.color }} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-black">{o.label}</p>
                    </div>
                    <p className="text-[14px] font-black">S/ {p.amount.toFixed(2)}</p>
                    <button onClick={() => removePayment(i)} className="w-7 h-7 rounded-md flex items-center justify-center text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Estado: falta / exacto / vuelto */}
          <div className={`p-4 rounded-2xl border ${
            status === 'missing' ? 'border-red-500/40' :
            status === 'change' ? 'border-emerald-500/40' :
            'border-emerald-500/40'
          }`} style={{
            background: status === 'missing' ? 'rgba(239,68,68,0.08)' : 'rgba(22,163,74,0.08)',
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: status === 'missing' ? '#EF4444' : '#16A34A' }}>
                  {status === 'missing' ? 'Falta cobrar' : status === 'exact' ? 'Pago exacto' : 'Vuelto a entregar'}
                </p>
                <p className="text-[24px] font-black mt-1" style={{ color: status === 'missing' ? '#EF4444' : '#16A34A' }}>
                  {status === 'missing' ? `S/ ${missing.toFixed(2)}` : status === 'exact' ? '✓ Completo' : `S/ ${change.toFixed(2)}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Pagado</p>
                <p className="text-[18px] font-black">S/ {paid.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Si todavía falta, mostrar entrada de pago */}
          {status === 'missing' && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Agregar pago</p>

              {/* Selector método */}
              <div className="grid grid-cols-3 gap-1.5">
                {PAYMENT_OPTIONS.map((o) => (
                  <button key={o.value} onClick={() => setMethod(o.value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-lg text-[10px] font-black transition-colors ${method === o.value ? 'text-white' : 'bg-secondary'}`}
                    style={method === o.value ? { background: o.color } : {}}>
                    <o.icon className="h-4 w-4" strokeWidth={2.5} />
                    {o.label}
                  </button>
                ))}
              </div>

              {/* Input monto + botones rápidos */}
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary border border-border">
                  <span className="text-[14px] font-black text-muted-foreground">S/</span>
                  <input
                    type="number" step="0.01" inputMode="decimal"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 text-[16px] font-black bg-transparent outline-none min-w-0"
                  />
                  {missing > 0.001 && (
                    <button onClick={fillRemaining} className="text-[10px] font-black uppercase px-2 py-1 rounded" style={{ background: 'rgba(255,90,31,0.15)', color: '#FF5A1F' }}>
                      = falta
                    </button>
                  )}
                </div>
                <button onClick={addPayment}
                  className="px-4 rounded-xl text-[12px] font-black uppercase tracking-wider text-white"
                  style={{ background: opt.color }}>
                  Agregar
                </button>
              </div>

              {/* Denominaciones rápidas */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">Efectivo rápido</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {QUICK_CASH.map((d) => (
                    <button key={d} onClick={() => addQuickCash(d)}
                      className="py-2 rounded-lg text-[11px] font-black bg-secondary hover:bg-emerald-500/10">
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: confirmar */}
        <div className="px-5 py-4 border-t border-border">
          <button
            onClick={onConfirm}
            disabled={submitting || status === 'missing' || payments.length === 0}
            className="w-full py-3.5 rounded-xl text-[14px] font-black uppercase tracking-wider text-white disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: status === 'missing' ? '#737373' : 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)', boxShadow: status !== 'missing' ? '0 8px 24px rgba(255,90,31,0.35)' : 'none' }}
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting ? 'Registrando…' : status === 'missing' ? `Falta S/ ${missing.toFixed(2)}` : status === 'change' ? `Confirmar venta · Vuelto S/ ${change.toFixed(2)}` : 'Confirmar venta'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
