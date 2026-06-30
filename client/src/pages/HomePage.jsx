import { useEffect, useMemo, useState } from 'react';
import { Alert, Skeleton } from 'antd';
import ShopHeader from '../components/ShopHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../api/client.js';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/products')
      .then((res) => {
        const list = res.data.products || [];
        setProducts(list);
        setCategories([...new Set(list.map((item) => item.category).filter(Boolean))]);
      })
      .catch(() => setError('Khong tai duoc san pham. Hay kiem tra server NodeJS.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchSearch = product.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, products, search]);

  return (
    <div className="min-h-screen bg-gray-100">
      <ShopHeader search={search} onSearch={setSearch} />
      <main className="mx-auto max-w-7xl px-4 py-4">
        <section className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <div className="flex min-h-[220px] items-center bg-gradient-to-r from-brand-500 to-amber-500 px-8 py-8 text-white">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase">Deal moi moi ngay</p>
              <h1 className="mb-3 max-w-xl text-3xl font-bold md:text-4xl">Mua nhanh, chon bien the, dat hang trong vai buoc</h1>
              <p className="m-0 max-w-lg text-white/90">Giao dien mua hang gon nhe, khong can tai khoan nguoi dung.</p>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="bg-white p-5">
              <p className="mb-1 text-sm text-gray-500">Thanh toan linh hoat</p>
              <h2 className="m-0 text-xl font-semibold text-gray-900">QR hoac COD</h2>
            </div>
            <div className="bg-white p-5">
              <p className="mb-1 text-sm text-gray-500">Admin cau hinh</p>
              <h2 className="m-0 text-xl font-semibold text-gray-900">Ton kho, da ban, danh gia</h2>
            </div>
          </div>
        </section>

        <section className="mt-4 bg-white p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`rounded-sm border px-4 py-2 text-sm ${activeCategory === 'all' ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-200 bg-white'}`}
            >
              Tat ca
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-sm border px-4 py-2 text-sm ${activeCategory === category ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-200 bg-white'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4">
          <div className="mb-3 border-b-4 border-brand-500 bg-white px-4 py-3 text-center font-semibold uppercase text-brand-600">
            Goi y hom nay
          </div>
          {error && <Alert type="error" message={error} className="mb-3" />}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton.Node key={index} active className="!h-[260px] !w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
