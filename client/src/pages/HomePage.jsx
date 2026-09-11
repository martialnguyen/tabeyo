import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Skeleton } from 'antd';
import { BadgeCheck, BatteryCharging, Laptop, MonitorSmartphone, ShieldCheck, Smartphone, TabletSmartphone, Truck, UsersRound, Zap } from 'lucide-react';
import ShopHeader from '../components/ShopHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../api/client.js';

const quickCategories = [
  { label: 'iPad', icon: TabletSmartphone },
  { label: 'Laptop', icon: Laptop },
  { label: 'Dien thoai', icon: Smartphone },
  { label: 'Phu kien', icon: BatteryCharging }
];

const zaloCommunityUrl = 'https://zalo.me/g/gf5geklaz2wkqzlggosp';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const productsRef = useRef(null);

  useEffect(() => {
    api
      .get('/products')
      .then((res) => {
        const list = res.data.products || [];
        setProducts(list);
        setCategories([...new Set(list.map((item) => item.category).filter(Boolean))]);
      })
      .catch((apiError) => setError(apiError.response?.data?.message || 'Khong tai duoc san pham. Hay kiem tra server NodeJS.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchSearch = product.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, products, search]);

  const hasSearch = search.trim().length > 0;

  const handleSearch = (keyword) => {
    setSearch(keyword);
  };

  useEffect(() => {
    if (!hasSearch || typeof window === 'undefined' || window.innerWidth >= 768) return undefined;
    const timer = window.setTimeout(() => {
      productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 360);
    return () => window.clearTimeout(timer);
  }, [hasSearch, search]);

  return (
    <div className="min-h-screen bg-slate-100">
      <ShopHeader search={search} onSearch={handleSearch} />
      <main className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-5">
        <section className={`tech-hero overflow-hidden rounded-lg bg-ink-900 text-white shadow-xl ${hasSearch ? 'hidden md:block' : ''}`}>
          <div className="grid min-h-[300px] gap-5 px-4 py-6 sm:min-h-[340px] sm:px-5 sm:py-7 md:grid-cols-[1.1fr_0.9fr] md:px-9 md:py-9">
            <div className="animate-fade-up flex flex-col justify-center">
              <p className="hero-chip mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-100 sm:text-xs">
                <Zap size={14} className="text-amber-300" />
                Tech deal moi moi ngay
              </p>
              <h1 className="mb-3 max-w-2xl text-2xl font-extrabold leading-tight sm:mb-4 sm:text-3xl md:text-5xl">
                iPad, laptop, dien thoai dep gia tot cho nguoi mua nhanh
              </h1>
              <p className="m-0 max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                Chon dung phien ban, xem ton kho tung mau/size, dat hang nhanh khong can tai khoan va thanh toan COD hoac QR.
              </p>
              <div className="mt-5 grid gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
                <a href="#products" className="cta-pulse rounded-md bg-brand-500 px-5 py-3 text-center text-sm font-bold text-white no-underline shadow-lg shadow-blue-950/30 transition hover:bg-brand-600">
                  Xem san pham hot
                </a>
                <span className="inline-flex justify-center items-center gap-2 rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/35 hover:bg-white/10">
                  <BadgeCheck size={18} className="text-emerald-300" />
                  Tu van chon may
                </span>
                <a
                  href={zaloCommunityUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="community-zalo-button inline-flex items-center justify-center gap-2 rounded-md border border-sky-300/40 bg-white px-4 py-3 text-sm font-bold text-brand-700 no-underline shadow-lg shadow-blue-950/20 transition hover:border-sky-200 hover:bg-sky-50 hover:text-brand-700"
                >
                  <span className="community-zalo-button__icon">
                    <img src="/zalo-contact.png" alt="" />
                  </span>
                  <UsersRound size={17} />
                  Tham gia cong dong
                </a>
              </div>
              <div className="mt-5 grid max-w-2xl grid-cols-3 gap-2 text-xs sm:mt-7 sm:gap-3 sm:text-sm">
                <div className="stat-card rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="mb-1 text-xl font-extrabold sm:text-2xl">24h</p>
                  <p className="m-0 text-slate-300">Xu ly don nhanh</p>
                </div>
                <div className="stat-card rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="mb-1 text-xl font-extrabold sm:text-2xl">1:1</p>
                  <p className="m-0 text-slate-300">Anh dung san pham</p>
                </div>
                <div className="stat-card rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="mb-1 text-xl font-extrabold sm:text-2xl">COD</p>
                  <p className="m-0 text-slate-300">Nhan hang moi tra</p>
                </div>
              </div>
            </div>
            <div className="animate-fade-in relative hidden items-center justify-center sm:flex">
              <div className="hero-glow absolute inset-4 rounded-full bg-brand-500/20 blur-3xl" />
              <div className="relative h-[280px] w-full max-w-md">
                <div className="float-slow absolute left-2 top-8 h-48 w-64 rounded-lg border border-slate-600 bg-slate-950 p-3 shadow-2xl">
                  <div className="h-full rounded bg-gradient-to-br from-slate-800 via-slate-900 to-brand-700 p-4">
                    <div className="shimmer-line mb-4 h-3 w-24 rounded bg-sky-300/80" />
                    <div className="h-20 rounded bg-white/10 transition duration-500 hover:bg-white/15" />
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <span className="h-8 rounded bg-white/10" />
                      <span className="h-8 rounded bg-white/10" />
                      <span className="h-8 rounded bg-white/10" />
                    </div>
                  </div>
                </div>
                <div className="float-fast absolute bottom-0 right-6 h-56 w-36 rounded-[26px] border-[7px] border-slate-800 bg-slate-950 p-2 shadow-2xl">
                  <div className="h-full rounded-[18px] bg-gradient-to-b from-sky-400 via-brand-600 to-slate-950 p-3">
                    <div className="mx-auto mb-5 h-1.5 w-12 rounded bg-white/60" />
                    <div className="h-24 rounded bg-white/15" />
                    <div className="mt-4 h-9 rounded-full bg-white text-center text-xs font-bold leading-9 text-brand-700">Mua ngay</div>
                  </div>
                </div>
                <div className="float-medium absolute bottom-7 left-24 h-40 w-56 rounded-md border border-slate-700 bg-slate-900 p-2 shadow-2xl">
                  <div className="h-full rounded bg-gradient-to-tr from-slate-800 to-slate-700">
                    <MonitorSmartphone className="mx-auto pt-10 text-sky-200" size={72} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3 md:grid-cols-3 ${hasSearch ? 'hidden sm:grid' : ''}`}>
          <div className="feature-card flex flex-col items-center gap-2 rounded-md bg-white p-3 text-center shadow-sm sm:flex-row sm:gap-3 sm:p-4 sm:text-left">
            <Truck className="shrink-0 text-brand-500" size={24} />
            <div>
              <p className="m-0 text-xs font-semibold text-slate-900 sm:text-base">Giao nhanh</p>
              <p className="m-0 hidden text-sm text-slate-500 sm:block">Phu hop may gia tri cao</p>
            </div>
          </div>
          <div className="feature-card flex flex-col items-center gap-2 rounded-md bg-white p-3 text-center shadow-sm sm:flex-row sm:gap-3 sm:p-4 sm:text-left">
            <ShieldCheck className="shrink-0 text-emerald-600" size={24} />
            <div>
              <p className="m-0 text-xs font-semibold text-slate-900 sm:text-base">Bao hanh</p>
              <p className="m-0 hidden text-sm text-slate-500 sm:block">Thong tin cau hinh ro rang</p>
            </div>
          </div>
          <div className="feature-card flex flex-col items-center gap-2 rounded-md bg-white p-3 text-center shadow-sm sm:flex-row sm:gap-3 sm:p-4 sm:text-left">
            <BadgeCheck className="shrink-0 text-amber-500" size={24} />
            <div>
              <p className="m-0 text-xs font-semibold text-slate-900 sm:text-base">Anh that</p>
              <p className="m-0 hidden text-sm text-slate-500 sm:block">Xem bien the truoc khi mua</p>
            </div>
          </div>
        </section>

        <section className={`animate-fade-up mt-3 rounded-md bg-white p-3 shadow-sm sm:mt-4 sm:p-4 ${hasSearch ? 'hidden sm:block' : ''}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-base font-bold text-slate-900 sm:text-lg">Danh muc cong nghe</h2>
              <p className="m-0 text-sm text-slate-500">Loc nhanh theo nhu cau mua sam</p>
            </div>
            <div className="mobile-scroll -mx-3 flex w-[calc(100%+1.5rem)] gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:w-auto sm:flex-wrap sm:px-0 sm:pb-0">
              {quickCategories.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setSearch(label)}
                  className="quick-filter inline-flex shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mobile-scroll -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
            <button
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 rounded-md border px-4 py-2 text-sm font-medium ${activeCategory === 'all' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600'}`}
            >
              Tat ca
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-md border px-4 py-2 text-sm font-medium ${activeCategory === category ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section id="products" ref={productsRef} className="scroll-mt-24 mt-3 sm:mt-5">
          <div className="mb-3 flex items-center justify-between rounded-md bg-white px-3 py-3 shadow-sm sm:px-4">
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-wide text-brand-600">
                {hasSearch ? 'Ket qua tim kiem' : 'San pham noi bat'}
              </p>
              <h2 className="m-0 text-lg font-extrabold text-slate-900 sm:text-xl">
                {hasSearch ? `Tim thay ${filteredProducts.length} san pham` : 'Goi y hom nay'}
              </h2>
            </div>
            {hasSearch ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 sm:px-3 sm:text-sm"
              >
                Xoa tim
              </button>
            ) : (
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 sm:px-3 sm:text-sm">Deal dang chay</span>
            )}
          </div>
          {error && <Alert type="error" message={error} className="mb-3" />}
          {loading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton.Node key={index} active className="!h-[260px] !w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
