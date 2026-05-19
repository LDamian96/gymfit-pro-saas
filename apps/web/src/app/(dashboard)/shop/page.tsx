'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Upload, ShoppingBag, Tag as TagIcon, Package, Eye, EyeOff, Store, UserCheck, ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { api, unwrap } from '@/lib/api';
import { BranchFilter } from '@/components/dashboard/branch-filter';
import { useBranches } from '@/hooks/use-branches';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  brandId: string | null;
  brand: string | null;
  brandRef?: { id: string; name: string } | null;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  category: string | null;
  catRef?: { id: string; name: string } | null;
  publicPrice: number;
  memberPrice: number | null;
  stock: number | null;
  stocks?: { branchId: string; branchName: string; stock: number }[];
  isActive: boolean;
  showInLanding: boolean;
}

interface Brand { id: string; name: string }
interface Category { id: string; name: string }

const FONT = "'Plus Jakarta Sans', Inter, sans-serif";

export default function ShopAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private'>('all');
  // Filtro por estado de stock en la sede seleccionada.
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  // Umbral "por acabarse": <= 5 unidades.
  const LOW_STOCK = 5;
  const [posSettings, setPosSettings] = useState<{
    trainerPosEnabled: boolean;
    receptionistPosEnabled: boolean;
    trainerMembershipEnabled: boolean;
    receptionistMembershipEnabled: boolean;
  } | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const { activeBranches, defaultBranchId } = useBranches();
  const [branchFilter, setBranchFilter] = useState('');
  useEffect(() => {
    if (defaultBranchId && !branchFilter) setBranchFilter(defaultBranchId);
  }, [defaultBranchId, branchFilter]);

  // Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [publicPrice, setPublicPrice] = useState('');
  const [memberPrice, setMemberPrice] = useState('');
  const [stock, setStock] = useState('');
  // Stock por sede en el form: { branchId: cantidad }
  const [stockByBranch, setStockByBranch] = useState<Record<string, string>>({});
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showInLanding, setShowInLanding] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Transferencia de stock entre sedes
  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [transferring, setTransferring] = useState(false);

  const fetchAll = useCallback(async (bId?: string) => {
    // Fetch independiente — si una falla las otras siguen
    const productUrl = bId ? `/api/v1/products?branchId=${bId}` : '/api/v1/products';
    api.get(productUrl).then((r) => setProducts(unwrap<Product[]>(r) || [])).catch(() => setProducts([]));
    api.get('/api/v1/brands').then((r) => setBrands(unwrap<Brand[]>(r) || [])).catch(() => setBrands([]));
    api.get('/api/v1/product-categories').then((r) => setCategories(unwrap<Category[]>(r) || [])).catch(() => setCategories([]));
    api.get('/api/v1/tenant/settings').then((r) => {
      const d = unwrap<{
        trainerPosEnabled: boolean; receptionistPosEnabled: boolean;
        trainerMembershipEnabled: boolean; receptionistMembershipEnabled: boolean;
      }>(r);
      if (d) setPosSettings(d);
    }).catch(() => { /* ignore */ });
    setLoading(false);
  }, []);

  const togglePos = async (
    key: 'trainerPosEnabled' | 'receptionistPosEnabled' | 'trainerMembershipEnabled' | 'receptionistMembershipEnabled',
    value: boolean,
  ) => {
    if (!posSettings) return;
    const optimistic = { ...posSettings, [key]: value };
    setPosSettings(optimistic);
    try {
      await api.patch('/api/v1/tenant/settings/pos', { [key]: value });
      toast.success(value ? 'Permiso activado' : 'Permiso desactivado');
    } catch {
      setPosSettings(posSettings); // revert
      toast.error('Error al cambiar permiso');
    }
  };

  useEffect(() => { fetchAll(branchFilter || undefined); }, [fetchAll, branchFilter]);

  const openCreate = () => {
    setEditing(null);
    setName(''); setDescription('');
    setBrandId(''); setCategoryId('');
    setPublicPrice(''); setMemberPrice(''); setStock('');
    // Stock por sede en 0; si hay filtro activo, foco en esa sede
    setStockByBranch(Object.fromEntries(activeBranches.map((b) => [b.id, ''])));
    setImageUrl(''); setIsActive(true); setShowInLanding(true);
    setFormOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name); setDescription(p.description || '');
    setBrandId(p.brandId || ''); setCategoryId(p.categoryId || '');
    setPublicPrice(String(p.publicPrice));
    setMemberPrice(p.memberPrice != null ? String(p.memberPrice) : '');
    setStock(p.stock != null ? String(p.stock) : '');
    // Precargar stock por sede del producto
    setStockByBranch(
      Object.fromEntries(
        activeBranches.map((b) => {
          const row = p.stocks?.find((s) => s.branchId === b.id);
          return [b.id, row ? String(row.stock) : '0'];
        }),
      ),
    );
    setImageUrl(p.imageUrl || '');
    setIsActive(p.isActive);
    setShowInLanding(p.showInLanding);
    setFormOpen(true);
  };

  const handleUploadImage = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/v1/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const data = unwrap<{ url?: string; secure_url?: string }>(res);
      setImageUrl(data.url || data.secure_url || '');
      toast.success('Imagen subida');
    } catch { toast.error('Error al subir imagen'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !publicPrice) { toast.error('Nombre y precio público requeridos'); return; }
    const pub = parseFloat(publicPrice);
    if (isNaN(pub) || pub < 0) { toast.error('Precio público inválido'); return; }

    setSubmitting(true);
    // Stock por sede: solo sedes con valor numérico
    const stocks = activeBranches
      .map((b) => ({ branchId: b.id, stock: parseInt(stockByBranch[b.id] || '0', 10) || 0 }))
      .filter((s) => !Number.isNaN(s.stock));
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      brandId: brandId || null,
      categoryId: categoryId || null,
      brand: brands.find((b) => b.id === brandId)?.name ?? null,
      category: categories.find((c) => c.id === categoryId)?.name ?? null,
      imageUrl: imageUrl || null,
      publicPrice: pub,
      memberPrice: memberPrice ? parseFloat(memberPrice) : null,
      // Si no hay sedes (gym sin sucursales), usa el stock simple legacy
      stock: activeBranches.length === 0 ? (stock ? parseInt(stock, 10) : null) : null,
      stocks: activeBranches.length > 0 ? stocks : undefined,
      isActive,
      showInLanding,
    };
    try {
      if (editing) await api.patch(`/api/v1/products/${editing.id}`, body);
      else await api.post('/api/v1/products', body);
      toast.success(editing ? 'Producto actualizado' : 'Producto creado');
      setFormOpen(false);
      fetchAll(branchFilter || undefined);
    } catch { toast.error('Error al guardar'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await api.delete(`/api/v1/products/${deleteId}`); toast.success('Producto eliminado'); fetchAll(branchFilter || undefined); }
    catch { toast.error('Error'); }
    finally { setDeleteId(null); }
  };

  const openTransfer = (p: Product) => {
    setTransferProduct(p);
    setTransferFrom(branchFilter || activeBranches[0]?.id || '');
    setTransferTo(activeBranches.find((b) => b.id !== (branchFilter || activeBranches[0]?.id))?.id || '');
    setTransferQty('');
  };

  const handleTransfer = async () => {
    if (!transferProduct) return;
    const qty = parseInt(transferQty, 10);
    if (!transferFrom || !transferTo || transferFrom === transferTo) { toast.error('Elige sedes distintas'); return; }
    if (!qty || qty <= 0) { toast.error('Cantidad inválida'); return; }
    setTransferring(true);
    try {
      await api.post(`/api/v1/products/${transferProduct.id}/transfer-stock`, {
        fromBranchId: transferFrom, toBranchId: transferTo, qty,
      });
      toast.success('Stock transferido');
      setTransferProduct(null);
      fetchAll(branchFilter || undefined);
    } catch { toast.error('Stock insuficiente o error'); }
    finally { setTransferring(false); }
  };

  const filtered = products.filter((p) => {
    if (filter && !p.name.toLowerCase().includes(filter.toLowerCase()) && !(p.brand || '').toLowerCase().includes(filter.toLowerCase())) return false;
    if (filterBrand && p.brandId !== filterBrand) return false;
    if (filterVisibility === 'public' && !p.showInLanding) return false;
    if (filterVisibility === 'private' && p.showInLanding) return false;
    // Filtro por stock (de la sede activa; p.stock ya viene mapeado por sede)
    const st = p.stock ?? null;
    if (filterStock === 'out' && !(st != null && st <= 0)) return false;
    if (filterStock === 'low' && !(st != null && st > 0 && st <= LOW_STOCK)) return false;
    return true;
  });

  // Reset paginación al cambiar filtros
  useEffect(() => { setPage(1); }, [filter, filterBrand, filterVisibility, filterStock]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="md:space-y-5">
      <div className="reveal-up">
        <Header eyebrow="Catálogo" title="Tienda" description="Stock por sede. Filtra para ver/editar el stock de cada sucursal.">
          <div className="flex items-center gap-3">
            <BranchFilter value={branchFilter} onChange={setBranchFilter} className="hidden md:flex" />
            <button onClick={openCreate} className="btn-fire">
              <Plus className="h-4 w-4" strokeWidth={3} /> Nuevo producto
            </button>
          </div>
        </Header>
      </div>

      {/* MOBILE header */}
      <div className="md:hidden px-5 pt-2 pb-4 reveal-up">
        <p className="label-athletic text-[var(--gym-orange)]">/ Catálogo</p>
        <h1 className="font-display tracking-tight leading-[0.9] mt-2 text-foreground" style={{ fontSize: 'clamp(34px, 9vw, 44px)' }}>
          TIENDA
        </h1>
      </div>

      {/* Wrapper móvil con padding lateral */}
      <div className="px-4 md:px-0 space-y-3 md:space-y-5">

      {/* Permisos de POS */}
      {posSettings && (
        <div className="bg-card rounded-2xl border border-border p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Store className="h-4 w-4" style={{ color: '#FF5A1F' }} />
            <p className="text-[12px] font-black uppercase tracking-wider">Permisos del Punto de Venta</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PosToggle
              label="Entrenadores pueden vender"
              description="Si está activo, los TRAINERS verán /pos y podrán registrar ventas"
              icon={UserCheck}
              checked={posSettings.trainerPosEnabled}
              onChange={(v) => togglePos('trainerPosEnabled', v)}
            />
            <PosToggle
              label="Recepción puede vender"
              description="Si está activo, la RECEPCIÓN verá /pos y podrá registrar ventas"
              icon={UserCheck}
              checked={posSettings.receptionistPosEnabled}
              onChange={(v) => togglePos('receptionistPosEnabled', v)}
            />
          </div>

          <div className="flex items-center gap-2 mb-3 mt-5 pt-4 border-t border-border">
            <UserCheck className="h-4 w-4" style={{ color: '#FF5A1F' }} />
            <p className="text-[12px] font-black uppercase tracking-wider">Permisos de Membresías</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PosToggle
              label="Entrenadores pueden matricular"
              description="Si está activo, los TRAINERS verán Membresías y podrán matricular/cobrar"
              icon={UserCheck}
              checked={posSettings.trainerMembershipEnabled}
              onChange={(v) => togglePos('trainerMembershipEnabled', v)}
            />
            <PosToggle
              label="Recepción puede matricular"
              description="Si está activo, la RECEPCIÓN verá Membresías y podrá matricular/cobrar"
              icon={UserCheck}
              checked={posSettings.receptionistMembershipEnabled}
              onChange={(v) => togglePos('receptionistMembershipEnabled', v)}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar producto o marca..."
          className="flex-1 max-w-md px-4 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary/50" />
        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary/50">
          <option value="">Todas las marcas</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="flex bg-card rounded-xl border border-border p-1 gap-1">
          {[
            { v: 'all' as const, label: 'Todos' },
            { v: 'public' as const, label: 'En landing' },
            { v: 'private' as const, label: 'Ocultos' },
          ].map((opt) => (
            <button key={opt.v} onClick={() => setFilterVisibility(opt.v)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${filterVisibility === opt.v ? 'text-white' : 'text-muted-foreground'}`}
              style={filterVisibility === opt.v ? { background: '#FF5A1F' } : {}}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex bg-card rounded-xl border border-border p-1 gap-1">
          {[
            { v: 'all' as const, label: 'Stock: todo' },
            { v: 'low' as const, label: 'Por acabarse' },
            { v: 'out' as const, label: 'Sin stock' },
          ].map((opt) => (
            <button key={opt.v} onClick={() => setFilterStock(opt.v)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${filterStock === opt.v ? 'text-white' : 'text-muted-foreground'}`}
              style={filterStock === opt.v ? { background: opt.v === 'out' ? '#DC2626' : opt.v === 'low' ? '#D97706' : '#FF5A1F' } : {}}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contador */}
      <p className="text-[12px] text-muted-foreground">
        Mostrando <span className="font-black text-foreground">{pageItems.length}</span> de <span className="font-black text-foreground">{filtered.length}</span> productos
        {filtered.length !== products.length && <span> · {products.length} totales</span>}
      </p>

      {loading ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {[...Array(8)].map((_, i) => <div key={i} className="h-14 border-b border-border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-16 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3" style={{ color: '#FF5A1F' }} />
          <p className="font-bold text-foreground">{products.length === 0 ? 'Sin productos' : 'Sin resultados'}</p>
        </div>
      ) : (
        <>
          {/* TABLA — Desktop */}
          <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/60 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="text-left px-3 py-3 w-14">Img</th>
                    <th className="text-left px-3 py-3">Producto</th>
                    <th className="text-left px-3 py-3 hidden lg:table-cell">Marca</th>
                    <th className="text-left px-3 py-3 hidden xl:table-cell">Categoría</th>
                    <th className="text-right px-3 py-3">Público</th>
                    <th className="text-right px-3 py-3">Miembro</th>
                    <th className="text-right px-3 py-3 hidden lg:table-cell">Stock</th>
                    <th className="text-center px-3 py-3 w-24">Estado</th>
                    <th className="text-right px-3 py-3 w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p, i) => (
                    <tr key={p.id} className={`group hover:bg-secondary/40 transition-colors ${i < pageItems.length - 1 ? 'border-b border-border' : ''}`}>
                      <td className="px-3 py-2">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-secondary shrink-0">
                          {p.imageUrl ? (
                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground/30" /></div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-[13px] font-black truncate max-w-[280px]" title={p.name}>{p.name}</p>
                        <p className="text-[10px] text-muted-foreground lg:hidden">
                          {p.brand && <span>{p.brand}</span>}
                          {p.brand && p.category && <span> · </span>}
                          {p.category && <span>{p.category}</span>}
                        </p>
                      </td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        {p.brand ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(255,90,31,0.12)', color: '#FF5A1F' }}>{p.brand}</span>
                        ) : <span className="text-[11px] text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2 hidden xl:table-cell">
                        <span className="text-[12px] text-foreground">{p.category || '—'}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="text-[13px] font-black" style={{ color: '#FF5A1F' }}>S/ {p.publicPrice.toFixed(2)}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.memberPrice != null ? (
                          <span className="text-[12px] font-black">S/ {p.memberPrice.toFixed(2)}</span>
                        ) : <span className="text-[11px] text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2 text-right hidden lg:table-cell">
                        {p.stock != null ? (
                          p.stock <= 0 ? (
                            <span className="inline-flex items-center text-[10px] font-black px-2 py-1 rounded uppercase tracking-wide" style={{ background: 'rgba(220,38,38,0.15)', color: '#DC2626' }}>
                              Agotado
                            </span>
                          ) : p.stock <= LOW_STOCK ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wide" style={{ background: 'rgba(217,119,6,0.15)', color: '#D97706' }}>
                              {p.stock} · bajo
                            </span>
                          ) : (
                            <span className="text-[12px] font-bold tabular-nums">{p.stock}</span>
                          )
                        ) : <span className="text-[11px] text-muted-foreground">∞</span>}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          {p.isActive ? (
                            p.showInLanding ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded uppercase" style={{ background: 'rgba(22,163,74,0.15)', color: '#16A34A' }}>
                                <Eye className="h-2.5 w-2.5" /> Público
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded uppercase" style={{ background: 'rgba(115,115,115,0.15)', color: '#737373' }}>
                                <EyeOff className="h-2.5 w-2.5" /> Oculto
                              </span>
                            )
                          ) : (
                            <span className="text-[9px] font-black px-2 py-1 rounded uppercase" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>Inactivo</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          {activeBranches.length >= 2 && (
                            <button onClick={() => openTransfer(p)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-secondary text-muted-foreground hover:text-foreground" title="Transferir stock entre sedes">
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-secondary text-muted-foreground hover:text-foreground" title="Editar">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteId(p.id)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-red-500/10 text-muted-foreground hover:text-red-500" title="Eliminar">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE — registros compactos */}
          <div className="md:hidden space-y-2">
            {pageItems.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground/30" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black truncate">{p.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {p.brand && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,90,31,0.12)', color: '#FF5A1F' }}>{p.brand}</span>}
                    <span className="text-[10px] font-black" style={{ color: '#FF5A1F' }}>S/ {p.publicPrice.toFixed(0)}</span>
                    {p.memberPrice != null && <span className="text-[10px] text-muted-foreground">· S/ {p.memberPrice.toFixed(0)} m</span>}
                    {p.stock != null && (
                      p.stock <= 0
                        ? <span className="text-[10px] font-black" style={{ color: '#DC2626' }}>· AGOTADO</span>
                        : p.stock <= LOW_STOCK
                          ? <span className="text-[10px] font-black" style={{ color: '#D97706' }}>· {p.stock}u bajo</span>
                          : <span className="text-[10px] text-muted-foreground">· {p.stock}u</span>
                    )}
                    {!p.showInLanding && <span className="text-[9px] font-black px-1 py-0.5 rounded uppercase" style={{ background: 'rgba(115,115,115,0.15)', color: '#737373' }}>Oculto</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-md flex items-center justify-center bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteId(p.id)} className="w-8 h-8 rounded-md flex items-center justify-center bg-secondary text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-muted-foreground">
                Página <span className="font-black text-foreground">{page}</span> de <span className="font-black text-foreground">{totalPages}</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="w-9 h-9 rounded-lg flex items-center justify-center bg-card border border-border disabled:opacity-30 hover:bg-secondary">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {(() => {
                  const pages: (number | '…')[] = [];
                  for (let i = 1; i <= totalPages; i++) {
                    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
                    else if (pages[pages.length - 1] !== '…') pages.push('…');
                  }
                  return pages.map((p, i) =>
                    p === '…' ? (
                      <span key={`e${i}`} className="px-1 text-muted-foreground">…</span>
                    ) : (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-[12px] font-black transition-colors ${p === page ? 'text-white' : 'bg-card border border-border hover:bg-secondary'}`}
                        style={p === page ? { background: '#FF5A1F', boxShadow: '0 4px 12px rgba(255,90,31,0.3)' } : {}}>
                        {p}
                      </button>
                    )
                  );
                })()}
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="w-9 h-9 rounded-lg flex items-center justify-center bg-card border border-border disabled:opacity-30 hover:bg-secondary">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-[180px_1fr] gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-muted-foreground">Imagen</label>
                <label className="relative block aspect-square rounded-xl border-2 border-dashed border-border overflow-hidden cursor-pointer hover:border-primary/50">
                  {imageUrl ? (
                    <Image src={imageUrl} alt="" fill className="object-cover" sizes="180px" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <Upload className="h-7 w-7 text-muted-foreground" />
                      <span className="text-[11px] font-bold text-muted-foreground">{uploading ? 'Subiendo…' : 'Subir'}</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadImage(f); }} />
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-muted-foreground">Nombre *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej. Gold Standard 100% Whey 5lb"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary/50" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-muted-foreground">Marca</label>
                    <select value={brandId} onChange={(e) => setBrandId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary/50">
                      <option value="">Sin marca</option>
                      {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-muted-foreground">Categoría</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary/50">
                      <option value="">Sin categoría</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-muted-foreground">Descripción</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                placeholder="Descripción visible en el landing"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary/50 resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: '#FF5A1F' }}>Precio público * (S/)</label>
                <input type="number" step="0.01" min="0" required value={publicPrice} onChange={(e) => setPublicPrice(e.target.value)} placeholder="150.00"
                  className="w-full px-3 py-2.5 rounded-lg border bg-card text-sm outline-none focus:border-primary/50" style={{ borderColor: 'rgba(255,90,31,0.35)' }} />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-muted-foreground">Precio miembros (S/)</label>
                <input type="number" step="0.01" min="0" value={memberPrice} onChange={(e) => setMemberPrice(e.target.value)} placeholder="opcional"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary/50" />
              </div>
            </div>

            {/* Stock por sede — si hay sucursales, un input por cada una. La sede
                del filtro activo se resalta. Si no hay sucursales, stock simple. */}
            {activeBranches.length > 0 ? (
              <div className="pt-1">
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2 text-muted-foreground">Stock por sucursal</label>
                <div className="grid grid-cols-2 gap-2">
                  {activeBranches.map((b) => {
                    const isActiveFilter = branchFilter === b.id;
                    return (
                      <div key={b.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isActiveFilter ? 'border-[var(--gym-orange)] bg-[var(--gym-orange)]/5' : 'border-border bg-card'}`}>
                        <span className={`flex-1 text-[12px] font-bold truncate ${isActiveFilter ? 'text-[var(--gym-orange)]' : ''}`}>{b.name}</span>
                        <input type="number" min="0" value={stockByBranch[b.id] ?? ''}
                          onChange={(e) => setStockByBranch((prev) => ({ ...prev, [b.id]: e.target.value }))}
                          placeholder="0"
                          className="w-20 px-2 py-1.5 rounded-md border border-border bg-background text-sm outline-none focus:border-primary/50 text-right" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-muted-foreground">Stock</label>
                <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="opcional"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary/50" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-secondary">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="mt-0.5 w-4 h-4 accent-orange-500" />
                <div>
                  <p className="text-[12px] font-black">Producto activo</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Si está inactivo no se puede vender</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-secondary">
                <input type="checkbox" checked={showInLanding} onChange={(e) => setShowInLanding(e.target.checked)} className="mt-0.5 w-4 h-4 accent-orange-500" />
                <div>
                  <p className="text-[12px] font-black flex items-center gap-1.5">
                    {showInLanding ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    Visible en landing
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Si está oculto, solo se vende en mostrador</p>
                </div>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className="flex-1 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider bg-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' }}>
                {submitting ? '…' : editing ? 'Guardar' : 'Crear producto'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="¿Eliminar producto?"
        description="Esta acción no se puede deshacer. Si tiene ventas asociadas no se puede borrar."
        onConfirm={handleDelete}
      />

      {/* Modal transferir stock entre sedes */}
      <Dialog open={!!transferProduct} onOpenChange={(o) => !o && setTransferProduct(null)}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Transferir stock</DialogTitle>
          </DialogHeader>
          {transferProduct && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">{transferProduct.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {transferProduct.stocks?.map((s) => (
                  <span key={s.branchId} className="text-[11px] px-2 py-1 rounded-md bg-secondary font-bold">
                    {s.branchName}: {s.stock}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-muted-foreground">Desde</label>
                  <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm outline-none">
                    {activeBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-muted-foreground">Hacia</label>
                  <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm outline-none">
                    {activeBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-muted-foreground">Cantidad</label>
                <input type="number" min="1" value={transferQty} onChange={(e) => setTransferQty(e.target.value)} placeholder="0"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary/50" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setTransferProduct(null)} className="flex-1 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider bg-secondary">Cancelar</button>
                <button onClick={handleTransfer} disabled={transferring} className="flex-1 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #FF5A1F 0%, #E04E15 100%)' }}>
                  {transferring ? '…' : 'Transferir'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      </div>{/* /wrapper móvil */}

      {/* FAB móvil */}
      <button onClick={openCreate} className="md:hidden mobile-fab" aria-label="Nuevo producto">
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}

function PosToggle({ label, description, icon: Icon, checked, onChange }: {
  label: string; description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? 'bg-orange-500/5' : 'bg-secondary'}`}
      style={{ borderColor: checked ? 'rgba(255,90,31,0.3)' : 'hsl(var(--border))' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: checked ? 'rgba(255,90,31,0.15)' : 'hsl(var(--secondary))' }}>
        <Icon className="h-5 w-5" style={{ color: checked ? '#FF5A1F' : '#737373' }} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-black">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{description}</p>
      </div>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
        className="relative w-11 h-6 rounded-full transition-colors shrink-0"
        style={{ background: checked ? '#FF5A1F' : 'hsl(var(--muted))' }}
        aria-checked={checked}
        role="switch"
      >
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </label>
  );
}
