import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../api/client.js';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function ProductCard({ product }) {
  const mainImage = product.images?.[0];

  return (
    <Link
      to={`/products/${product._id}`}
      className="group block overflow-hidden rounded-sm border border-gray-200 bg-white text-gray-900 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
    >
      <div className="aspect-square bg-gray-100">
        {mainImage ? (
          <img src={assetUrl(mainImage)} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">No image</div>
        )}
      </div>
      <div className="space-y-2 p-3">
        <h3 className="line-clamp-2 min-h-[40px] text-sm font-medium">{product.name}</h3>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="m-0 text-base font-semibold text-brand-500">{money.format(product.price || 0)}</p>
            {product.originalPrice > product.price && (
              <p className="m-0 text-xs text-gray-400 line-through">{money.format(product.originalPrice)}</p>
            )}
          </div>
          <span className="rounded-sm bg-brand-50 px-1.5 py-0.5 text-xs text-brand-600">Da ban {product.soldCount || 0}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Star size={14} fill="#f59e0b" className="text-amber-500" />
            {product.ratingAverage || 0} ({product.ratingCount || 0})
          </span>
          <span>Con {product.stock || 0}</span>
        </div>
      </div>
    </Link>
  );
}
