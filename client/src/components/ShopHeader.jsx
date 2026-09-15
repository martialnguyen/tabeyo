import { BadgeCheck, Search, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ShopHeader({ search, onSearch }) {
  return (
    <header className="sticky top-0 z-30 animate-slide-down border-b border-slate-200 bg-white/95 text-slate-900 shadow-sm backdrop-blur">
      <div className="hidden border-b border-slate-100 bg-ink-900 text-white md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-300" />
            Hàng công nghệ chính hãng, tư vấn nhanh
          </span>
          <span className="inline-flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Truck size={14} className="text-sky-300" />
              Giao nhanh toàn quốc
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck size={14} className="text-amber-300" />
              Bảo hành rõ ràng
            </span>
          </span>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 py-2 sm:flex-nowrap sm:gap-3 sm:px-4 sm:py-3">
        <Link to="/" className="group flex shrink-0 items-center gap-2 text-lg font-extrabold text-ink-900 no-underline sm:text-xl">
          <img src="/anipad-logo.jpeg" alt="Anipad" className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200 transition duration-300 group-hover:scale-105 group-hover:ring-brand-300 sm:h-10 sm:w-10" />
          <span>Anipad</span>
        </Link>
        <div className="order-last flex min-w-0 flex-[1_0_100%] items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-100 sm:order-none sm:flex-1">
          <Search size={20} className="shrink-0 text-brand-500" />
          <input
            value={search || ''}
            onChange={(event) => onSearch?.(event.target.value)}
            placeholder="Tìm iPad, laptop, điện thoại..."
            className="ml-2 w-full border-0 bg-transparent text-base outline-none sm:text-sm"
          />
        </div>
      </div>
    </header>
  );
}
