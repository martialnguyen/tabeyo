import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Rate, Skeleton } from 'antd';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import ShopHeader from '../components/ShopHeader.jsx';
import { api, assetUrl } from '../api/client.js';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'KH';
}

function getAvatarColor(name = '') {
  const colors = ['#ee4d2d', '#2563eb', '#059669', '#7c3aed', '#db2777', '#ca8a04', '#0891b2'];
  const total = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[total % colors.length];
}

function shouldUseRemoteAvatar(url = '') {
  return url && !url.includes('i.pravatar.cc');
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((res) => {
        const item = res.data.product;
        const firstAvailableVariant = item.variants?.find((variant) => variant.stock > 0) || item.variants?.[0];
        setProduct(item);
        setSelectedVariantId(firstAvailableVariant?._id || '');
        setSelectedOptions(firstAvailableVariant?.optionValues || {});
        setMainImage(firstAvailableVariant?.image || item.images?.[0] || '');
      })
      .catch(() => setError('Khong tim thay san pham.'))
      .finally(() => setLoading(false));
  }, [id]);

  const selectedVariant = useMemo(() => {
    return product?.variants?.find((variant) => variant._id === selectedVariantId);
  }, [product, selectedVariantId]);

  const hasVariantGroups = Boolean(product?.variantGroups?.length);

  const findVariantByOptions = (options) => {
    return product?.variants?.find((variant) =>
      Object.entries(options).every(([groupName, value]) => variant.optionValues?.[groupName] === value)
    );
  };

  const selectOption = (groupName, value) => {
    const nextOptions = { ...selectedOptions, [groupName]: value };
    const nextVariant = findVariantByOptions(nextOptions);
    setSelectedOptions(nextOptions);
    if (nextVariant) {
      setSelectedVariantId(nextVariant._id);
      setQuantity(1);
      if (nextVariant.image) setMainImage(nextVariant.image);
    }
  };

  const isOptionAvailable = (groupName, value) => {
    const nextOptions = { ...selectedOptions, [groupName]: value };
    return product?.variants?.some((variant) => {
      const matches = Object.entries(nextOptions).every(([key, optionValue]) => variant.optionValues?.[key] === optionValue);
      return matches && variant.stock > 0;
    });
  };

  const availableStock = selectedVariant ? selectedVariant.stock : product?.stock || 0;
  const isOutOfStock = availableStock <= 0;

  const buyNow = () => {
    if (!selectedVariantId || isOutOfStock) return;
    navigate(`/checkout/${product._id}?variant=${selectedVariantId}&qty=${quantity}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <ShopHeader />
        <main className="mx-auto max-w-7xl px-4 py-4">
          <Skeleton active />
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-100">
        <ShopHeader />
        <main className="mx-auto max-w-7xl px-4 py-4">
          <Alert type="error" message={error || 'San pham khong ton tai'} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ShopHeader />
      <main className="mx-auto max-w-7xl px-4 py-4">
        <section className="grid gap-5 bg-white p-4 lg:grid-cols-[440px_1fr]">
          <div>
            <div className="aspect-square bg-gray-100">
              {mainImage ? (
                <img src={assetUrl(mainImage)} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">No image</div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {product.images?.map((image) => (
                <button
                  key={image}
                  onClick={() => setMainImage(image)}
                  className={`aspect-square border bg-gray-100 ${mainImage === image ? 'border-brand-500' : 'border-gray-200'}`}
                >
                  <img src={assetUrl(image)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="m-0 text-2xl font-semibold text-gray-900">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Rate allowHalf disabled value={product.ratingAverage || 0} className="text-base" />
                <b className="text-brand-600">{product.ratingAverage || 0}</b>
              </span>
              <span>{product.ratingCount || 0} danh gia</span>
              <span>Da ban {product.soldCount || 0}</span>
              <span>Ton kho {product.stock || 0}</span>
            </div>

            <div className="bg-gray-50 p-4">
              <span className="text-3xl font-bold text-brand-500">{money.format(product.price || 0)}</span>
              {product.originalPrice > product.price && (
                <span className="ml-3 text-gray-400 line-through">{money.format(product.originalPrice)}</span>
              )}
            </div>

            <div>
              <p className="mb-2 font-medium">Phan loai</p>
              {hasVariantGroups ? (
                <div className="space-y-3">
                  {product.variantGroups.map((group) => (
                    <div key={group._id}>
                      <p className="mb-2 text-sm text-gray-600">{group.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.values.map((option) => {
                          const disabled = !isOptionAvailable(group.name, option.value);
                          return (
                            <button
                              key={option._id}
                              disabled={disabled}
                              onClick={() => selectOption(group.name, option.value)}
                              className={`rounded-sm border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ${
                                selectedOptions[group.name] === option.value
                                  ? 'border-brand-500 bg-brand-50 text-brand-600'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {option.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {product.variants?.map((variant) => (
                    <button
                      key={variant._id}
                      disabled={variant.stock <= 0}
                      onClick={() => {
                        setSelectedVariantId(variant._id);
                        setQuantity(1);
                        if (variant.image) setMainImage(variant.image);
                      }}
                      className={`rounded-sm border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ${
                        selectedVariantId === variant._id ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {variant.label}
                      <span className="ml-2 text-xs">Con {variant.stock}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedVariant && (
                <p className="mt-2 text-sm text-gray-500">
                  Da chon: {selectedVariant.label}. Da ban phan loai nay: {selectedVariant.soldCount || 0}. Ton kho phan loai:{' '}
                  {selectedVariant.stock || 0}.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="font-medium">So luong</span>
              <div className="flex items-center border border-gray-300">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-9 w-9 items-center justify-center bg-white"
                >
                  <Minus size={16} />
                </button>
                <input value={quantity} readOnly className="h-9 w-14 border-x border-gray-300 text-center" />
                <button
                  onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                  className="flex h-9 w-9 items-center justify-center bg-white"
                >
                  <Plus size={16} />
                </button>
              </div>
              <span className="text-sm text-gray-500">{availableStock} san pham co san</span>
            </div>

            <button
              onClick={buyNow}
              disabled={isOutOfStock || !selectedVariantId}
              className="inline-flex items-center gap-2 rounded-sm bg-brand-500 px-8 py-3 font-semibold text-white disabled:bg-gray-300"
            >
              <ShoppingCart size={20} />
              Mua ngay
            </button>
          </div>
        </section>

        <section className="mt-4 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Mo ta san pham</h2>
          <p className="whitespace-pre-line text-gray-700">{product.description}</p>
        </section>

        <section className="mt-4 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Danh gia cua nguoi mua</h2>
          <div className="space-y-4">
            {product.reviews?.filter((review) => review.isVisible).map((review) => (
              <article key={review._id} className="flex gap-3 border-b border-gray-100 pb-4 last:border-b-0">
                <div
                  className="h-11 w-11 shrink-0 overflow-hidden rounded-full text-white"
                  style={{ backgroundColor: getAvatarColor(review.customerName) }}
                >
                  {shouldUseRemoteAvatar(review.avatarUrl) ? (
                    <img
                      src={assetUrl(review.avatarUrl)}
                      alt={review.customerName}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
                      {getInitials(review.customerName)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="m-0 font-medium">{review.customerName}</p>
                      <Rate disabled value={review.rating} className="text-sm" />
                    </div>
                    <span className="shrink-0 text-xs text-gray-500">{new Date(review.reviewDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <p className="mt-2 text-gray-700">{review.content}</p>
                </div>
              </article>
            ))}
            {!product.reviews?.some((review) => review.isVisible) && <p className="text-gray-500">Chua co danh gia hien thi.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
