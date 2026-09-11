import { Cpu, ShieldCheck, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../api/client.js';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function ProductCard({ product }) {
  const mainImage = product.images?.[0];
  const discountPercent =
    product.originalPrice > product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
  const animationDelay = `${Math.min(360, Math.abs((product._id || product.name || '').length * 45) % 360)}ms`;

  return (
    <Link
      to={`/products/${product._id}`}
      style={{ animationDelay }}
      className="group product-card-animated block overflow-hidden rounded-md border border-slate-200 bg-white text-slate-900 no-underline shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-brand-500 hover:shadow-xl"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-md bg-ink-900/90 px-1.5 py-1 text-[10px] font-semibold text-white transition duration-300 group-hover:bg-brand-600 sm:left-2 sm:top-2 sm:px-2 sm:text-[11px]">
          <Zap size={12} className="text-amber-300" />
          Hot tech
        </div>
        {discountPercent > 0 && (
          <div className="sale-badge absolute right-1.5 top-1.5 z-10 rounded-md bg-rose-500 px-1.5 py-1 text-[10px] font-bold text-white sm:right-2 sm:top-2 sm:px-2 sm:text-[11px]">
            -{discountPercent}%
          </div>
        )}
        {mainImage ? (
          <img src={assetUrl(mainImage)} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No image</div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 translate-y-full bg-gradient-to-t from-brand-500/20 to-transparent transition duration-300 group-hover:translate-y-0" />
      </div>
      <div className="space-y-1.5 p-2.5 sm:space-y-2 sm:p-3">
        <h3 className="line-clamp-2 min-h-[38px] text-[13px] font-semibold leading-5 sm:min-h-[40px] sm:text-sm">{product.name}</h3>
        <div className="hidden flex-wrap gap-1.5 sm:flex">
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
            <Cpu size={12} />
            Máy đẹp
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
            <ShieldCheck size={12} />
            BH rõ ràng
          </span>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="m-0 text-base font-extrabold text-brand-600 sm:text-lg">{money.format(product.price || 0)}</p>
            {product.originalPrice > product.price && (
              <p className="m-0 text-xs text-slate-400 line-through">{money.format(product.originalPrice)}</p>
            )}
          </div>
          <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700 sm:text-xs">Đã bán {product.soldCount || 0}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Star size={14} fill="#f59e0b" className="text-amber-500" />
            {product.ratingAverage || 0} ({product.ratingCount || 0})
          </span>
          <span>Còn {product.stock || 0}</span>
        </div>
      </div>
    </Link>
  );
}
