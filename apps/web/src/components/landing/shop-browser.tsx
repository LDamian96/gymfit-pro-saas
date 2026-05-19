'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, SlidersHorizontal, X, ShoppingBag, Tag as TagIcon, Package,
  Flame, Sparkles, ChevronLeft, ChevronRight, ArrowRight, Check,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  publicPrice: number;
  memberPrice: number | null;
}

interface FilterOption { name: string; count: number }

interface ShopResponse {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
  brands: FilterOption[];
  categories: FilterOption[];
}

const API = process.env.NEXT_PUBLIC_API_URL || '';

export function ShopBrowser({ slug, tenantName }: { slug: string; tenantName: string }) {
  const [data, setData] = useState<ShopResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [brand, setBrand] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile (controla el limit por página)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Limits más conservadores → carga inicial rápida. El user pagina o filtra para ver más.
  const limit = isMobile ? 6 : 12;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (brand) params.set('brand', brand);
    if (category) params.set('category', category);
    if (search) params.set('q', search);
    try {
      // Cache en el navegador 60s → segunda visita instant.
      const res = await fetch(`${API}/api/v1/products/public/${slug}?${params.toString()}`, {
        cache: 'force-cache',
      } as RequestInit);
      const json = await res.json();
      setData(json.data || json);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [slug, page, limit, brand, category, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Reset page al cambiar filtros
  useEffect(() => { setPage(1); }, [brand, category, search]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const activeFilterCount = (brand ? 1 : 0) + (category ? 1 : 0);
  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const brands = data?.brands || [];
  const categories = data?.categories || [];

  const clearFilters = () => { setBrand(null); setCategory(null); setSearch(''); setSearchInput(''); };

  return (
    <>
      {/* ===== MOBILE — estilo app ===== */}
      <div className="md:hidden">
        {/* Hero compact */}
        <div className="relative px-4 pt-6 pb-5 overflow-hidden" style={{ background: 'linear-gradient(180deg, var(--gym-ink) 0%, var(--gym-coal) 100%)' }}>
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl" style={{ background: 'rgba(255,90,31,0.18)' }} />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl" style={{ background: 'rgba(132,204,22,0.15)' }} />
          <div className="relative">
            <span className="text-[var(--gym-orange)] text-[9px] font-bold tracking-[3px] uppercase inline-flex items-center gap-1.5">
              <ShoppingBag className="h-3 w-3" /> Tienda · Suplementos
            </span>
            <h1 className="mt-2 text-[32px] font-black leading-[0.95] tracking-tight">
              NUTRICIÓN<br /><span className="text-[var(--gym-orange)]">PROFESIONAL</span>
            </h1>
            <p className="mt-2 text-[12px] text-[rgba(255,255,255,0.55)] max-w-xs">
              {total} productos · Precios especiales para miembros del gym
            </p>
          </div>
        </div>

        {/* Sticky search + filters */}
        <div className="sticky top-0 z-30 px-4 py-3 border-b border-white/5" style={{ background: 'rgba(13,18,18,0.92)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Search className="h-4 w-4 text-[rgba(255,255,255,0.55)] shrink-0" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar producto…"
                className="flex-1 text-[13px] bg-transparent outline-none text-white placeholder:text-[rgba(255,255,255,0.55)60] min-w-0"
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} className="text-[rgba(255,255,255,0.55)]">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setFiltersOpen(true)}
              className="relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: activeFilterCount > 0 ? 'var(--gym-orange)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <SlidersHorizontal className="h-4 w-4" style={{ color: activeFilterCount > 0 ? '#FFFFFF' : '#FFFFFF' }} strokeWidth={2.5} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center" style={{ background: 'var(--gym-lime, #84CC16)', color: '#FFFFFF' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Chips de categorías horizontales */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto cm-no-scroll mt-3 -mx-4 px-4 pb-1">
              <button
                onClick={() => setCategory(null)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-colors ${!category ? 'text-[#FFFFFF]' : 'text-[rgba(255,255,255,0.55)]'}`}
                style={{ background: !category ? 'var(--gym-orange)' : 'rgba(255,255,255,0.05)' }}
              >
                Todos
              </button>
              {categories.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setCategory(c.name === category ? null : c.name)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 ${c.name === category ? 'text-[#FFFFFF]' : 'text-[rgba(255,255,255,0.55)]'}`}
                  style={{ background: c.name === category ? 'var(--gym-orange)' : 'rgba(255,255,255,0.05)' }}
                >
                  {c.name}
                  <span className="text-[9px] opacity-70">{c.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active filter chips */}
        {(brand || category) && (
          <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
            {brand && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black" style={{ background: 'rgba(255,90,31,0.15)', color: 'var(--gym-lime, #84CC16)' }}>
                {brand}
                <button onClick={() => setBrand(null)}><X className="h-3 w-3" /></button>
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black" style={{ background: 'rgba(255,90,31,0.18)', color: 'var(--gym-orange)' }}>
                {category}
                <button onClick={() => setCategory(null)}><X className="h-3 w-3" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-[11px] font-bold text-[rgba(255,255,255,0.55)] underline">Limpiar</button>
          </div>
        )}

        {/* Grid 2-cols app-style */}
        <div className="px-4 pt-4 pb-5">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-2xl"
                  style={{
                    background: 'linear-gradient(110deg, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 70%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.4s linear infinite',
                  }}
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl p-10 text-center border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Package className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--gym-orange)' }} strokeWidth={1.5} />
              <p className="text-[14px] font-black">Sin resultados</p>
              <p className="text-[11px] text-[rgba(255,255,255,0.55)] mt-1">Prueba con otros filtros</p>
              {(brand || category || search) && (
                <button onClick={clearFilters} className="mt-4 text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-full" style={{ background: 'var(--gym-orange)', color: '#FFFFFF' }}>
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Paginación mobile */}
        {totalPages > 1 && !loading && (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        )}

        {/* CTA miembros */}
        <div className="px-4 mt-4">
          <Link href={`/${slug}/planes`} className="block rounded-2xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--gym-orange) 0%, #E63E00 100%)' }}>
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl" style={{ background: 'rgba(255,255,255,0.25)' }} />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(18,26,26,0.15)' }}>
                <Flame className="h-5 w-5" style={{ color: '#FFFFFF' }} fill="#FFFFFF" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-black text-[#FFFFFF] leading-tight">Precios miembros</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(18,26,26,0.7)' }}>Inscríbete y ahorra hasta 15%</p>
              </div>
              <ArrowRight className="h-5 w-5 text-[#FFFFFF]" strokeWidth={2.5} />
            </div>
          </Link>
        </div>
      </div>

      {/* ===== DESKTOP ===== */}
      <div className="hidden md:block">
        {/* Hero */}
        <section className="relative h-[40vh] flex items-end overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--gym-ink) 0%, rgba(255,255,255,0.04) 60%, rgba(255,90,31,0.20) 100%)' }} />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(255,90,31,0.28)' }} />
            <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(132,204,22,0.25)' }} />
          </div>
          <div className="relative z-10 px-16 pb-12 max-w-7xl mx-auto w-full">
            <span className="text-[var(--gym-orange)] text-[11px] font-bold tracking-[4px] uppercase inline-flex items-center gap-2">
              <ShoppingBag className="h-3.5 w-3.5" /> Tienda & Suplementos
            </span>
            <h1 className="mt-3 text-[88px] font-black leading-[0.9] tracking-tight">
              NUTRICIÓN <span className="text-[var(--gym-orange)]">PROFESIONAL</span>
            </h1>
            <p className="mt-4 text-[16px] max-w-xl text-[rgba(255,255,255,0.55)]">
              {total} productos seleccionados · Precios exclusivos para miembros del gym de {tenantName}.
            </p>
          </div>
        </section>

        <section className="px-16 py-12 max-w-7xl mx-auto w-full grid grid-cols-[260px_1fr] gap-8">
          {/* Sidebar filtros */}
          <aside className="sticky top-24 self-start space-y-6">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Search className="h-4 w-4 text-[rgba(255,255,255,0.55)]" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar…"
                className="flex-1 text-sm bg-transparent outline-none text-white placeholder:text-[rgba(255,255,255,0.55)60] min-w-0"
              />
            </div>

            {(brand || category) && (
              <button onClick={clearFilters} className="text-[11px] font-bold text-[var(--gym-orange)] underline">Limpiar filtros</button>
            )}

            <FilterGroup label="Categorías" icon={Sparkles} options={categories} selected={category} onSelect={(v) => setCategory(v === category ? null : v)} />
            <FilterGroup label="Marcas" icon={TagIcon} options={brands} selected={brand} onSelect={(v) => setBrand(v === brand ? null : v)} />
          </aside>

          {/* Productos */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[13px] text-[rgba(255,255,255,0.55)]">
                Mostrando <span className="text-white font-black">{items.length}</span> de <span className="text-white font-black">{total}</span> productos
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-2xl"
                    style={{
                      background: 'linear-gradient(110deg, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 70%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.4s linear infinite',
                    }}
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-3xl p-16 text-center border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <Package className="h-14 w-14 mx-auto mb-4" style={{ color: 'var(--gym-orange)' }} strokeWidth={1.5} />
                <h3 className="text-[20px] font-black">Sin resultados</h3>
                <p className="text-[13px] text-[rgba(255,255,255,0.55)] mt-2">Prueba con otros filtros</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map((p, i) => <ProductCard key={p.id} product={p} desktop index={i} />)}
              </div>
            )}

            {totalPages > 1 && !loading && (
              <div className="mt-10">
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Sheet de filtros — solo mobile */}
      {filtersOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setFiltersOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 rounded-t-[28px] flex flex-col"
            style={{ background: '#14161A', borderTop: '1px solid rgba(255,255,255,0.05)', maxHeight: '85vh' }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>
            <div className="flex items-center justify-between px-5 pb-4 border-b border-white/5">
              <div>
                <p className="text-[var(--gym-orange)] text-[10px] font-bold tracking-[3px] uppercase">Filtros</p>
                <h3 className="text-[20px] font-black tracking-tight mt-1">Refinar búsqueda</h3>
              </div>
              <button onClick={() => setFiltersOpen(false)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              <FilterGroupMobile label="Categorías" icon={Sparkles} options={categories} selected={category} onSelect={(v) => setCategory(v === category ? null : v)} />
              <FilterGroupMobile label="Marcas" icon={TagIcon} options={brands} selected={brand} onSelect={(v) => setBrand(v === brand ? null : v)} />
            </div>
            <div className="px-5 py-4 border-t border-white/5 flex gap-2">
              <button onClick={clearFilters} className="flex-1 py-3 rounded-xl text-[12px] font-black uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}>
                Limpiar
              </button>
              <button onClick={() => setFiltersOpen(false)} className="flex-[2] py-3 rounded-xl text-[12px] font-black uppercase tracking-wider" style={{ background: 'var(--gym-orange)', color: '#FFFFFF' }}>
                Ver {total} productos
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============ subcomponentes ============

function ProductCard({ product, desktop = false, index = 0 }: { product: Product; desktop?: boolean; index?: number }) {
  const hasDiscount = product.memberPrice != null && product.memberPrice < product.publicPrice;
  const discount = hasDiscount ? Math.round((1 - product.memberPrice! / product.publicPrice) * 100) : 0;

  return (
    <article
      className="card-fade press-card group rounded-2xl overflow-hidden border border-white/5 flex flex-col transition-all hover:border-[var(--gym-orange)]/30"
      style={{ background: 'rgba(255,255,255,0.03)', ['--i' as string]: index }}
    >
      <div className="relative aspect-square" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill sizes={desktop ? '300px' : '50vw'} className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-10 w-10 text-white/10" strokeWidth={1.5} />
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider" style={{ background: 'var(--gym-lime, #84CC16)', color: '#FFFFFF' }}>
            -{discount}%
          </span>
        )}
        {product.brand && (
          <span className="absolute top-2 left-2 max-w-[60%] truncate px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider" style={{ background: 'rgba(13,18,18,0.85)', color: 'var(--gym-orange)', backdropFilter: 'blur(8px)' }}>
            {product.brand}
          </span>
        )}
      </div>
      <div className="p-3 md:p-4 flex-1 flex flex-col">
        {product.category && (
          <p className="text-[8px] md:text-[9px] font-bold tracking-[2px] uppercase mb-1" style={{ color: 'var(--gym-orange)' }}>{product.category}</p>
        )}
        <h3 className="text-[12px] md:text-[14px] font-black leading-tight line-clamp-2">{product.name}</h3>
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.15em] text-[rgba(255,255,255,0.55)]">Público</p>
            <p className={`${hasDiscount ? 'text-[12px] md:text-[14px] line-through text-[rgba(255,255,255,0.55)]' : 'text-[18px] md:text-[22px] text-[var(--gym-orange)]'} font-black leading-none`}>
              S/ {product.publicPrice.toFixed(0)}
            </p>
          </div>
          {hasDiscount && (
            <div className="text-right">
              <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.15em]" style={{ color: 'var(--gym-lime, #84CC16)' }}>Miembros</p>
              <p className="text-[18px] md:text-[22px] font-black leading-none" style={{ color: 'var(--gym-lime, #84CC16)' }}>
                S/ {product.memberPrice!.toFixed(0)}
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const pages = useMemo(() => {
    const arr: (number | '…')[] = [];
    const window = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= window) arr.push(i);
      else if (arr[arr.length - 1] !== '…') arr.push('…');
    }
    return arr;
  }, [page, totalPages]);

  return (
    <div className="flex items-center justify-center gap-1.5 px-4 pt-4 pb-2">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30"
        style={{ background: 'rgba(255,255,255,0.05)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="text-[rgba(255,255,255,0.55)] text-[12px] px-1">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black"
            style={{
              background: p === page ? 'var(--gym-orange)' : 'rgba(255,255,255,0.05)',
              color: p === page ? '#FFFFFF' : '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30"
        style={{ background: 'rgba(255,255,255,0.05)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function FilterGroup({ label, icon: Icon, options, selected, onSelect }: { label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; options: FilterOption[]; selected: string | null; onSelect: (v: string) => void }) {
  if (options.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
        <span className="text-[10px] font-bold tracking-[3px] uppercase text-[var(--gym-orange)]">{label}</span>
      </div>
      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
        {options.map((o) => (
          <button
            key={o.name}
            onClick={() => onSelect(o.name)}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[12px] transition-colors ${
              o.name === selected ? 'text-[#FFFFFF] font-black' : 'text-[rgba(255,255,255,0.55)] hover:text-white'
            }`}
            style={{ background: o.name === selected ? 'var(--gym-orange)' : 'transparent' }}
          >
            <span className="truncate">{o.name}</span>
            <span className="text-[10px] opacity-70 shrink-0">{o.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterGroupMobile({ label, icon: Icon, options, selected, onSelect }: { label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; options: FilterOption[]; selected: string | null; onSelect: (v: string) => void }) {
  if (options.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4" strokeWidth={2.5} />
        <span className="text-[11px] font-bold tracking-[3px] uppercase text-[var(--gym-orange)]">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o.name}
            onClick={() => onSelect(o.name)}
            className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[12px] transition-colors ${
              o.name === selected ? 'text-[#FFFFFF] font-black' : 'text-[rgba(255,255,255,0.55)]'
            }`}
            style={{
              background: o.name === selected ? 'var(--gym-orange)' : 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <span className="truncate flex-1 text-left">{o.name}</span>
            <span className="text-[9px] opacity-70 shrink-0">{o.count}</span>
            {o.name === selected && <Check className="h-3 w-3 shrink-0" strokeWidth={3} />}
          </button>
        ))}
      </div>
    </div>
  );
}
