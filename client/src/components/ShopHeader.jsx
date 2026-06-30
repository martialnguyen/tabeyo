import { Search, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ShopHeader({ search, onSearch }) {
  return (
    <header className="sticky top-0 z-30 bg-brand-500 text-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white no-underline">
          <ShoppingBag size={28} />
          Shop Mini
        </Link>
        <div className="flex min-w-0 flex-1 items-center rounded-sm bg-white px-3 py-2 text-gray-700">
          <Search size={20} className="shrink-0 text-brand-500" />
          <input
            value={search}
            onChange={(event) => onSearch?.(event.target.value)}
            placeholder="Tim san pham, danh muc..."
            className="ml-2 w-full border-0 bg-transparent text-sm outline-none"
          />
        </div>
        <Link to="/admin" className="hidden rounded-sm border border-white/60 px-3 py-2 text-sm text-white no-underline md:block">
          Admin
        </Link>
      </div>
    </header>
  );
}
