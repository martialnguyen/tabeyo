import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Pagination, Rate, Skeleton, Upload, message } from 'antd';
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Maximize2,
  MessageCircle,
  Minus,
  Plus,
  RotateCcw,
  ShoppingCart,
  UploadCloud,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import ShopHeader from '../components/ShopHeader.jsx';
import { api, assetUrl } from '../api/client.js';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
// Tạm ẩn đánh giá ở client. Đổi thành true nếu cần bật lại sau này.
const SHOW_PRODUCT_REVIEWS = false;
const REVIEW_PAGE_SIZE = 5;
const zaloConsultUrl = 'https://zalo.me/0866426854';
const MIN_IMAGE_ZOOM = 1;
const MAX_IMAGE_ZOOM = 4;

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

function getReviewMedia(review = {}) {
  return (review.media || review.images || [])
    .map((item) => {
      if (typeof item === 'string') return { url: item, type: item.match(/\.(mp4|webm|mov)(\?|$)/i) ? 'video' : 'image' };
      return { url: item.url || '', type: item.type === 'video' ? 'video' : 'image' };
    })
    .filter((item) => item.url);
}

function clampImageZoom(value) {
  return Math.min(MAX_IMAGE_ZOOM, Math.max(MIN_IMAGE_ZOOM, Number(value.toFixed(2))));
}

function getPointerDistance(first, second) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function getPointerCenter(first, second) {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2
  };
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [imageSlideDirection, setImageSlideDirection] = useState('');
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [inlineImageZoom, setInlineImageZoom] = useState(1);
  const [inlineImagePan, setInlineImagePan] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewAvatar, setReviewAvatar] = useState(null);
  const [reviewMedia, setReviewMedia] = useState([]);
  const [reviewMediaFiles, setReviewMediaFiles] = useState([]);
  const [reviewSubmitError, setReviewSubmitError] = useState('');
  const [reviewPage, setReviewPage] = useState(1);
  const reviewAvatarRef = useRef(null);
  const reviewMediaRef = useRef([]);
  const imageSwipeRef = useRef({ x: 0, y: 0, active: false });
  const imagePanRef = useRef({ x: 0, y: 0, panX: 0, panY: 0, active: false });
  const imageViewerPointersRef = useRef(new Map());
  const imagePinchRef = useRef({ active: false, distance: 0, zoom: 1, centerX: 0, centerY: 0, panX: 0, panY: 0 });
  const inlineImagePointersRef = useRef(new Map());
  const inlineImagePanRef = useRef({ x: 0, y: 0, panX: 0, panY: 0, active: false });
  const inlineImagePinchRef = useRef({ active: false, distance: 0, zoom: 1, centerX: 0, centerY: 0, panX: 0, panY: 0 });

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
        setReviewPage(1);
      })
      .catch((apiError) => setError(apiError.response?.data?.message || 'Không tìm thấy sản phẩm.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    reviewAvatarRef.current = reviewAvatar;
  }, [reviewAvatar]);

  useEffect(() => {
    reviewMediaRef.current = reviewMedia;
  }, [reviewMedia]);

  useEffect(() => {
    setImageZoom(1);
    setImagePan({ x: 0, y: 0 });
    imagePanRef.current = { x: 0, y: 0, panX: 0, panY: 0, active: false };
    imageViewerPointersRef.current.clear();
    imagePinchRef.current = { active: false, distance: 0, zoom: 1, centerX: 0, centerY: 0, panX: 0, panY: 0 };
    setInlineImageZoom(1);
    setInlineImagePan({ x: 0, y: 0 });
    imageSwipeRef.current = { x: 0, y: 0, active: false };
    inlineImagePointersRef.current.clear();
    inlineImagePanRef.current = { x: 0, y: 0, panX: 0, panY: 0, active: false };
    inlineImagePinchRef.current = { active: false, distance: 0, zoom: 1, centerX: 0, centerY: 0, panX: 0, panY: 0 };
  }, [mainImage]);

  useEffect(() => {
    if (imageZoom > 1) return;
    setImagePan({ x: 0, y: 0 });
    imagePanRef.current = { x: 0, y: 0, panX: 0, panY: 0, active: false };
    imagePinchRef.current = { active: false, distance: 0, zoom: 1, centerX: 0, centerY: 0, panX: 0, panY: 0 };
  }, [imageZoom]);

  useEffect(() => {
    if (inlineImageZoom > 1) return;
    setInlineImagePan({ x: 0, y: 0 });
    inlineImagePanRef.current = { x: 0, y: 0, panX: 0, panY: 0, active: false };
    inlineImagePinchRef.current = { active: false, distance: 0, zoom: 1, centerX: 0, centerY: 0, panX: 0, panY: 0 };
  }, [inlineImageZoom]);

  useEffect(() => {
    if (!imageViewerOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [imageViewerOpen]);

  useEffect(() => {
    return () => {
      if (reviewAvatarRef.current?.previewUrl) URL.revokeObjectURL(reviewAvatarRef.current.previewUrl);
      reviewMediaRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const selectedVariant = useMemo(() => {
    return product?.variants?.find((variant) => variant._id === selectedVariantId);
  }, [product, selectedVariantId]);

  const imageList = useMemo(() => product?.images?.filter(Boolean) || [], [product]);

  const currentImageIndex = useMemo(() => {
    const index = imageList.findIndex((image) => image === mainImage);
    return index >= 0 ? index : 0;
  }, [imageList, mainImage]);

  const hasVariantGroups = Boolean(product?.variantGroups?.length);

  const changeMainImage = (image, direction = '') => {
    if (!image || image === mainImage) return;
    setImageSlideDirection(direction);
    setMainImage(image);
  };

  const showAdjacentImage = (direction) => {
    if (imageList.length <= 1) return;
    const nextIndex =
      direction === 'next'
        ? (currentImageIndex + 1) % imageList.length
        : (currentImageIndex - 1 + imageList.length) % imageList.length;
    changeMainImage(imageList[nextIndex], direction);
  };

  const resetImageZoom = () => {
    setImageZoom(1);
    setImagePan({ x: 0, y: 0 });
    imagePanRef.current = { x: 0, y: 0, panX: 0, panY: 0, active: false };
    imageViewerPointersRef.current.clear();
    imagePinchRef.current = { active: false, distance: 0, zoom: 1, centerX: 0, centerY: 0, panX: 0, panY: 0 };
  };

  const resetInlineImageZoom = () => {
    setInlineImageZoom(1);
    setInlineImagePan({ x: 0, y: 0 });
    imageSwipeRef.current = { x: 0, y: 0, active: false };
    inlineImagePointersRef.current.clear();
    inlineImagePanRef.current = { x: 0, y: 0, panX: 0, panY: 0, active: false };
    inlineImagePinchRef.current = { active: false, distance: 0, zoom: 1, centerX: 0, centerY: 0, panX: 0, panY: 0 };
  };

  const openImageViewer = () => {
    if (!mainImage) return;
    resetImageZoom();
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    resetImageZoom();
  };

  const updateImageZoom = (updater) => {
    setImageZoom((currentZoom) => {
      const nextZoom = typeof updater === 'function' ? updater(currentZoom) : updater;
      return clampImageZoom(nextZoom);
    });
  };

  const handleViewerWheel = (event) => {
    event.preventDefault();
    updateImageZoom((currentZoom) => currentZoom + (event.deltaY < 0 ? 0.18 : -0.18));
  };

  const handleViewerPointerDown = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    imageViewerPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const pointers = [...imageViewerPointersRef.current.values()];
    if (pointers.length >= 2) {
      const [first, second] = pointers;
      const center = getPointerCenter(first, second);
      imagePinchRef.current = {
        active: true,
        distance: getPointerDistance(first, second),
        zoom: imageZoom,
        centerX: center.x,
        centerY: center.y,
        panX: imagePan.x,
        panY: imagePan.y
      };
      imagePanRef.current = { x: 0, y: 0, panX: 0, panY: 0, active: false };
      return;
    }

    if (imageZoom > 1) {
      imagePanRef.current = {
        x: event.clientX,
        y: event.clientY,
        panX: imagePan.x,
        panY: imagePan.y,
        active: true
      };
    }
  };

  const handleViewerPointerMove = (event) => {
    if (!imageViewerPointersRef.current.has(event.pointerId)) return;

    event.preventDefault();
    imageViewerPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pointers = [...imageViewerPointersRef.current.values()];

    if (pointers.length >= 2 && imagePinchRef.current.active) {
      const [first, second] = pointers;
      const start = imagePinchRef.current;
      const distance = getPointerDistance(first, second);
      const center = getPointerCenter(first, second);
      const nextZoom = clampImageZoom(start.zoom * (distance / Math.max(start.distance, 1)));

      setImageZoom(nextZoom);
      setImagePan({
        x: start.panX + center.x - start.centerX,
        y: start.panY + center.y - start.centerY
      });
      return;
    }

    const start = imagePanRef.current;
    if (!start.active || imageZoom <= 1) return;

    setImagePan({
      x: start.panX + event.clientX - start.x,
      y: start.panY + event.clientY - start.y
    });
  };

  const handleViewerPointerEnd = (event) => {
    imageViewerPointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }

    const pointers = [...imageViewerPointersRef.current.entries()];
    if (pointers.length >= 2) {
      const [, first] = pointers[0];
      const [, second] = pointers[1];
      const center = getPointerCenter(first, second);
      imagePinchRef.current = {
        active: true,
        distance: getPointerDistance(first, second),
        zoom: imageZoom,
        centerX: center.x,
        centerY: center.y,
        panX: imagePan.x,
        panY: imagePan.y
      };
      return;
    }

    imagePinchRef.current = { active: false, distance: 0, zoom: imageZoom, centerX: 0, centerY: 0, panX: imagePan.x, panY: imagePan.y };

    if (pointers.length === 1 && imageZoom > 1) {
      const [, pointer] = pointers[0];
      imagePanRef.current = {
        x: pointer.x,
        y: pointer.y,
        panX: imagePan.x,
        panY: imagePan.y,
        active: true
      };
      return;
    }

    imagePanRef.current = { x: 0, y: 0, panX: 0, panY: 0, active: false };
  };

  const handleImagePointerDown = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    inlineImagePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const pointers = [...inlineImagePointersRef.current.values()];
    if (pointers.length >= 2) {
      const [first, second] = pointers;
      const center = getPointerCenter(first, second);
      inlineImagePinchRef.current = {
        active: true,
        distance: getPointerDistance(first, second),
        zoom: inlineImageZoom,
        centerX: center.x,
        centerY: center.y,
        panX: inlineImagePan.x,
        panY: inlineImagePan.y
      };
      inlineImagePanRef.current = { x: 0, y: 0, panX: 0, panY: 0, active: false };
      imageSwipeRef.current = { x: 0, y: 0, active: false };
      return;
    }

    if (inlineImageZoom > 1) {
      inlineImagePanRef.current = {
        x: event.clientX,
        y: event.clientY,
        panX: inlineImagePan.x,
        panY: inlineImagePan.y,
        active: true
      };
      imageSwipeRef.current = { x: 0, y: 0, active: false };
      return;
    }

    if (imageList.length > 1) {
      imageSwipeRef.current = { x: event.clientX, y: event.clientY, active: true };
    }
  };

  const handleImagePointerMove = (event) => {
    if (!inlineImagePointersRef.current.has(event.pointerId)) return;

    inlineImagePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pointers = [...inlineImagePointersRef.current.values()];

    if (pointers.length >= 2 && inlineImagePinchRef.current.active) {
      event.preventDefault();
      const [first, second] = pointers;
      const start = inlineImagePinchRef.current;
      const distance = getPointerDistance(first, second);
      const center = getPointerCenter(first, second);
      const nextZoom = clampImageZoom(start.zoom * (distance / Math.max(start.distance, 1)));

      setInlineImageZoom(nextZoom);
      setInlineImagePan({
        x: start.panX + center.x - start.centerX,
        y: start.panY + center.y - start.centerY
      });
      return;
    }

    const start = inlineImagePanRef.current;
    if (!start.active || inlineImageZoom <= 1) return;
    event.preventDefault();
    setInlineImagePan({
      x: start.panX + event.clientX - start.x,
      y: start.panY + event.clientY - start.y
    });
  };

  const handleImagePointerUp = (event) => {
    const wasPinching = inlineImagePinchRef.current.active || inlineImagePointersRef.current.size > 1;
    inlineImagePointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }

    const pointers = [...inlineImagePointersRef.current.entries()];
    if (pointers.length >= 2) {
      const [, first] = pointers[0];
      const [, second] = pointers[1];
      const center = getPointerCenter(first, second);
      inlineImagePinchRef.current = {
        active: true,
        distance: getPointerDistance(first, second),
        zoom: inlineImageZoom,
        centerX: center.x,
        centerY: center.y,
        panX: inlineImagePan.x,
        panY: inlineImagePan.y
      };
      imageSwipeRef.current = { x: 0, y: 0, active: false };
      return;
    }

    if (wasPinching) {
      inlineImagePinchRef.current = {
        active: false,
        distance: 0,
        zoom: inlineImageZoom,
        centerX: 0,
        centerY: 0,
        panX: inlineImagePan.x,
        panY: inlineImagePan.y
      };
      imageSwipeRef.current = { x: 0, y: 0, active: false };

      if (pointers.length === 1 && inlineImageZoom > 1) {
        const [, pointer] = pointers[0];
        inlineImagePanRef.current = {
          x: pointer.x,
          y: pointer.y,
          panX: inlineImagePan.x,
          panY: inlineImagePan.y,
          active: true
        };
      }
      return;
    }

    if (inlineImageZoom > 1) {
      inlineImagePanRef.current = { x: 0, y: 0, panX: 0, panY: 0, active: false };
      imageSwipeRef.current = { x: 0, y: 0, active: false };
      return;
    }

    const start = imageSwipeRef.current;
    if (!start.active) return;
    imageSwipeRef.current = { x: 0, y: 0, active: false };

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;

    showAdjacentImage(deltaX < 0 ? 'next' : 'prev');
  };

  const handleImagePointerCancel = (event) => {
    if (event?.pointerId) {
      inlineImagePointersRef.current.delete(event.pointerId);
    } else {
      inlineImagePointersRef.current.clear();
    }
    inlineImagePanRef.current = { x: 0, y: 0, panX: 0, panY: 0, active: false };
    inlineImagePinchRef.current = { active: false, distance: 0, zoom: inlineImageZoom, centerX: 0, centerY: 0, panX: inlineImagePan.x, panY: inlineImagePan.y };
    imageSwipeRef.current = { x: 0, y: 0, active: false };
  };

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
  const visibleReviews = useMemo(() => product?.reviews?.filter((review) => review.isVisible) || [], [product]);
  const pagedReviews = useMemo(
    () => visibleReviews.slice((reviewPage - 1) * REVIEW_PAGE_SIZE, reviewPage * REVIEW_PAGE_SIZE),
    [reviewPage, visibleReviews]
  );

  const buyNow = () => {
    if (!selectedVariantId || isOutOfStock) return;
    navigate(`/checkout/${product._id}?variant=${selectedVariantId}&qty=${quantity}`);
  };

  const handleReviewAvatarChange = ({ fileList }) => {
    const file = fileList[0];
    if (reviewAvatar?.previewUrl) URL.revokeObjectURL(reviewAvatar.previewUrl);
    if (!file?.originFileObj) {
      setReviewAvatar(null);
      return;
    }
    setReviewAvatar({
      file,
      previewUrl: URL.createObjectURL(file.originFileObj)
    });
  };

  const handleReviewMediaChange = ({ fileList }) => {
    setReviewMediaFiles(fileList);
    setReviewMedia((items) => {
      const nextFileUids = new Set(fileList.map((file) => file.uid));
      items.forEach((item) => {
        if (!nextFileUids.has(item.uid) && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });

      return fileList.map((file) => {
        const existing = items.find((item) => item.uid === file.uid);
        if (existing) return existing;
        const fileObject = file.originFileObj;
        return {
          uid: file.uid,
          type: fileObject?.type?.startsWith('video/') ? 'video' : 'image',
          previewUrl: fileObject ? URL.createObjectURL(fileObject) : ''
        };
      });
    });
  };

  const removeReviewMedia = (uid) => {
    setReviewMedia((items) => {
      const target = items.find((item) => item.uid === uid);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return items.filter((item) => item.uid !== uid);
    });
    setReviewMediaFiles((items) => items.filter((item) => item.uid !== uid));
  };

  const submitReview = (event) => {
    event.preventDefault();
    setReviewSubmitError('Vui lòng thử lại');
    message.error('Vui lòng thử lại');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <ShopHeader />
        <main className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4">
          <Skeleton active />
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-100">
        <ShopHeader />
        <main className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4">
          <Alert type="error" message={error || 'Sản phẩm không tồn tại'} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <ShopHeader />
      <main className="product-detail-page mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4">
        <section className="product-detail-card animate-fade-up grid gap-4 rounded-md bg-white p-3 shadow-sm sm:p-4 lg:grid-cols-[440px_1fr] lg:gap-5">
          <div>
            <div
              className={`product-image-focus image-swipe-area group aspect-square overflow-hidden rounded-md bg-gradient-to-br from-slate-50 to-slate-100 ${inlineImageZoom > 1 ? 'image-swipe-area--zoomed' : ''}`}
              onPointerDown={handleImagePointerDown}
              onPointerMove={handleImagePointerMove}
              onPointerUp={handleImagePointerUp}
              onPointerCancel={handleImagePointerCancel}
              onPointerLeave={(event) => {
                if (event.pointerType === 'mouse') handleImagePointerCancel(event);
              }}
              onDoubleClick={openImageViewer}
            >
              {mainImage ? (
                <img
                  key={mainImage}
                  src={assetUrl(mainImage, { width: 980, height: 980, crop: 'fit', quality: 'auto', format: 'auto' })}
                  alt={product.name}
                  className={`product-main-image image-swipe-photo h-full w-full object-cover ${imageSlideDirection === 'next' ? 'image-swipe-photo--next' : ''} ${imageSlideDirection === 'prev' ? 'image-swipe-photo--prev' : ''}`}
                  decoding="async"
                  fetchPriority="high"
                  draggable={false}
                  style={
                    inlineImageZoom > 1
                      ? {
                          transform: `translate3d(${inlineImagePan.x}px, ${inlineImagePan.y}px, 0) scale(${inlineImageZoom})`
                        }
                      : undefined
                  }
                  onAnimationEnd={() => setImageSlideDirection('')}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">No image</div>
              )}
              {imageList.length > 1 && (
                <>
                  <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => showAdjacentImage('prev')}
                    className="image-swipe-button image-swipe-button--left"
                    aria-label="Ảnh trước"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => showAdjacentImage('next')}
                    className="image-swipe-button image-swipe-button--right"
                    aria-label="Ảnh tiếp theo"
                  >
                    <ChevronRight size={22} />
                  </button>
                  <div className="image-swipe-hint">Vuốt / chụm 2 ngón để zoom</div>
                </>
              )}
              {inlineImageZoom > 1 && (
                <button
                  type="button"
                  onClick={resetInlineImageZoom}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="image-inline-reset"
                  aria-label="Đặt lại zoom ảnh"
                >
                  <RotateCcw size={15} />
                  <span>{Math.round(inlineImageZoom * 100)}%</span>
                </button>
              )}
              {mainImage && (
                <button
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={openImageViewer}
                  className="image-zoom-trigger"
                  aria-label="Phóng to ảnh sản phẩm"
                >
                  <Maximize2 size={16} />
                  <span>Zoom ảnh</span>
                </button>
              )}
            </div>
            <div className="mobile-scroll mt-3 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible sm:pb-0">
              {imageList.map((image) => (
                <button
                  key={image}
                  onClick={() => changeMainImage(image, imageList.indexOf(image) > currentImageIndex ? 'next' : 'prev')}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-gray-100 sm:h-auto sm:w-auto sm:aspect-square ${mainImage === image ? 'border-brand-500 ring-2 ring-brand-100' : 'border-gray-200'}`}
                >
                  <img
                    src={assetUrl(image, { width: 180, height: 180, crop: 'fill', gravity: 'auto', quality: 'auto', format: 'auto' })}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="product-detail-info space-y-3 sm:space-y-4">
            <h1 className="product-detail-title m-0 text-xl font-semibold leading-7 text-gray-900 sm:text-2xl">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 sm:gap-3 sm:text-sm">
              {SHOW_PRODUCT_REVIEWS && (
                <>
                  <span className="flex items-center gap-2">
                    <Rate allowHalf disabled value={product.ratingAverage || 0} className="text-base" />
                    <b className="text-brand-600">{product.ratingAverage || 0}</b>
                  </span>
                  <span>{product.ratingCount || 0} đánh giá</span>
                </>
              )}
              <span>Đã bán {product.soldCount || 0}</span>
              <span>Tồn kho {product.stock || 0}</span>
            </div>

            <div className="product-price-box rounded-md bg-gradient-to-r from-brand-50 to-slate-50 p-3 sm:p-4">
              <span className="product-price-current text-2xl font-extrabold text-brand-600 sm:text-3xl">{money.format(product.price || 0)}</span>
              {product.originalPrice > product.price && (
                <span className="product-price-old ml-3 text-gray-400 line-through">{money.format(product.originalPrice)}</span>
              )}
            </div>

            <div>
              <p className="mb-2 font-medium">Phân loại</p>
              {hasVariantGroups ? (
                <div className="space-y-3">
                  {product.variantGroups.map((group) => (
                    <div key={group._id}>
                      <p className="mb-2 text-sm text-gray-600">{group.name}</p>
                      <div className="mobile-scroll -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
                        {group.values.map((option) => {
                          const disabled = !isOptionAvailable(group.name, option.value);
                          return (
                            <button
                              key={option._id}
                              disabled={disabled}
                              onClick={() => selectOption(group.name, option.value)}
                              className={`shrink-0 rounded-sm border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ${
                                selectedOptions[group.name] === option.value
                                  ? 'border-brand-500 bg-brand-50 text-brand-700'
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
                <div className="mobile-scroll -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
                  {product.variants?.map((variant) => (
                    <button
                      key={variant._id}
                      disabled={variant.stock <= 0}
                      onClick={() => {
                        setSelectedVariantId(variant._id);
                        setQuantity(1);
                        if (variant.image) setMainImage(variant.image);
                      }}
                      className={`shrink-0 rounded-sm border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ${
                        selectedVariantId === variant._id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {variant.label}
                      <span className="ml-2 text-xs">Còn {variant.stock}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedVariant && (
                <p className="mt-2 text-sm text-gray-500">
                  Đã chọn: {selectedVariant.label}. Đã bán phân loại này: {selectedVariant.soldCount || 0}. Tồn kho phân loại:{' '}
                  {selectedVariant.stock || 0}.
                </p>
              )}
            </div>

            <div className="product-quantity-row flex flex-wrap items-center gap-3">
              <span className="font-medium">Số lượng</span>
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
              <span className="text-sm text-gray-500">{availableStock} sản phẩm có sẵn</span>
            </div>

            <div className="product-action-row flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                onClick={buyNow}
                disabled={isOutOfStock || !selectedVariantId}
                className="cta-pulse inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-500 px-8 py-3 font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-brand-600 disabled:bg-gray-300 disabled:shadow-none sm:w-auto"
              >
                <ShoppingCart size={20} />
                Mua ngay
              </button>
              <a
                href={zaloConsultUrl}
                target="_blank"
                rel="noreferrer"
                className="consult-cta inline-flex w-full items-center justify-center gap-2 rounded-md border border-brand-500 bg-white px-8 py-3 font-bold text-brand-600 no-underline shadow-sm transition hover:bg-brand-50 hover:text-brand-700 sm:w-auto"
              >
                <MessageCircle size={20} />
                Tư vấn ngay
              </a>
            </div>
          </div>
        </section>

        <section className="product-description-section animate-fade-up mt-3 rounded-md bg-white p-3 sm:mt-4 sm:p-4">
          <h2 className="mb-3 text-lg font-semibold">Mô tả sản phẩm</h2>
          <p className="whitespace-pre-line text-gray-700">{product.description}</p>
        </section>

        {SHOW_PRODUCT_REVIEWS && (
          <section className="animate-fade-up mt-3 flex flex-col rounded-md bg-white p-3 sm:mt-4 sm:p-4">
            <h2 className="mb-3 text-lg font-semibold">Đánh giá của người mua</h2>
            <form onSubmit={submitReview} className="order-last mt-5 rounded-sm border border-gray-200 bg-gray-50 p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="m-0 text-base font-semibold">Viết đánh giá của bạn</h3>
                  <p className="m-0 text-sm text-gray-500">Chia sẻ trải nghiệm và upload ảnh/video sản phẩm.</p>
                </div>
                <Rate value={reviewRating} onChange={setReviewRating} />
              </div>
              <div className="grid gap-3 md:grid-cols-[160px_1fr]">
                <div>
                  <label className="mb-2 block text-sm font-medium">Avatar</label>
                  <div className="mb-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white text-gray-500 ring-1 ring-gray-200">
                    {reviewAvatar?.previewUrl ? (
                      <img src={reviewAvatar.previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold">{getInitials(reviewName)}</span>
                    )}
                  </div>
                  <Upload beforeUpload={() => false} maxCount={1} accept="image/*" showUploadList={false} onChange={handleReviewAvatarChange}>
                    <button type="button" className="inline-flex items-center gap-2 rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm">
                      <UploadCloud size={15} />
                      Upload avatar
                    </button>
                  </Upload>
                </div>
                <div className="space-y-3">
                  <input
                    value={reviewName}
                    onChange={(event) => setReviewName(event.target.value)}
                    className="w-full rounded-sm border border-gray-300 bg-white px-3 py-2"
                    placeholder="Tên người đánh giá"
                  />
                  <textarea
                    value={reviewContent}
                    onChange={(event) => setReviewContent(event.target.value)}
                    className="min-h-24 w-full rounded-sm border border-gray-300 bg-white px-3 py-2"
                    placeholder="Nhập nội dung đánh giá"
                  />
                  <Upload
                    beforeUpload={() => false}
                    multiple
                    accept="image/*,video/*"
                    fileList={reviewMediaFiles}
                    showUploadList={false}
                    onChange={handleReviewMediaChange}
                  >
                    <button type="button" className="inline-flex items-center gap-2 rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm">
                      <ImagePlus size={15} />
                      Upload ảnh/video
                    </button>
                  </Upload>
                  {reviewMedia.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {reviewMedia.map((item) => (
                        <div key={item.uid} className="group relative aspect-square overflow-hidden rounded-sm bg-white ring-1 ring-gray-200">
                          {item.type === 'video' ? (
                            <video src={item.previewUrl} className="h-full w-full object-cover" muted />
                          ) : (
                            <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => removeReviewMedia(item.uid)}
                            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-sm bg-white/90 text-red-600 shadow"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {reviewSubmitError && <Alert type="error" showIcon message={reviewSubmitError} />}
                  <button type="submit" className="w-full rounded-sm bg-brand-500 px-5 py-2 font-semibold text-white sm:w-auto">
                    Gửi đánh giá
                  </button>
                </div>
              </div>
            </form>
            <div className="space-y-4">
              {pagedReviews.map((review) => (
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
                    <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                      <div>
                        <p className="m-0 font-medium">{review.customerName}</p>
                        <Rate disabled value={review.rating} className="text-sm" />
                      </div>
                      <span className="shrink-0 text-xs text-gray-500">{new Date(review.reviewDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="mt-2 text-gray-700">{review.content}</p>
                    {getReviewMedia(review).length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                        {getReviewMedia(review).map((media, index) => (
                          <div key={`${review._id}-${media.url}-${index}`} className="aspect-square overflow-hidden rounded-sm bg-gray-100">
                            {media.type === 'video' ? (
                              <video src={assetUrl(media.url)} controls className="h-full w-full object-cover" />
                            ) : (
                              <img src={assetUrl(media.url)} alt="" loading="lazy" className="h-full w-full object-cover" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
              {!visibleReviews.length && <p className="text-gray-500">Chưa có đánh giá hiển thị.</p>}
              {visibleReviews.length > REVIEW_PAGE_SIZE && (
                <div className="flex justify-center pt-2">
                  <Pagination
                    current={reviewPage}
                    pageSize={REVIEW_PAGE_SIZE}
                    total={visibleReviews.length}
                    showSizeChanger={false}
                    onChange={setReviewPage}
                  />
                </div>
              )}
            </div>
          </section>
        )}
        {imageViewerOpen && (
          <div className="image-viewer" role="dialog" aria-modal="true" aria-label="Xem ảnh sản phẩm phóng to">
            <div className="image-viewer__topbar">
              <div className="image-viewer__counter">
                Ảnh {currentImageIndex + 1}/{Math.max(imageList.length, 1)}
              </div>
              <div className="image-viewer__actions">
                <button
                  type="button"
                  className="image-viewer__button"
                  onClick={() => updateImageZoom((currentZoom) => currentZoom - 0.25)}
                  aria-label="Thu nhỏ ảnh"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="image-viewer__zoom-value">{Math.round(imageZoom * 100)}%</span>
                <button
                  type="button"
                  className="image-viewer__button"
                  onClick={() => updateImageZoom((currentZoom) => currentZoom + 0.25)}
                  aria-label="Phóng to ảnh"
                >
                  <ZoomIn size={18} />
                </button>
                <button type="button" className="image-viewer__button" onClick={resetImageZoom} aria-label="Đặt lại ảnh">
                  <RotateCcw size={18} />
                </button>
                <button type="button" className="image-viewer__button image-viewer__button--close" onClick={closeImageViewer} aria-label="Đóng">
                  <X size={19} />
                </button>
              </div>
            </div>

            {imageList.length > 1 && (
              <button
                type="button"
                className="image-viewer__nav image-viewer__nav--left"
                onClick={() => showAdjacentImage('prev')}
                aria-label="Ảnh trước"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            <div
              className={`image-viewer__stage ${imageZoom > 1 ? 'image-viewer__stage--zoomed' : ''}`}
              onWheel={handleViewerWheel}
              onPointerDown={handleViewerPointerDown}
              onPointerMove={handleViewerPointerMove}
              onPointerUp={handleViewerPointerEnd}
              onPointerCancel={handleViewerPointerEnd}
              onDoubleClick={() => updateImageZoom(imageZoom > 1 ? 1 : 2)}
            >
              <img
                src={assetUrl(mainImage, { width: 1400, height: 1400, crop: 'fit', quality: 'auto:best', format: 'auto' })}
                alt={product.name}
                className="image-viewer__image"
                decoding="async"
                draggable={false}
                style={{
                  transform: `translate3d(${imagePan.x}px, ${imagePan.y}px, 0) scale(${imageZoom})`
                }}
              />
            </div>

            {imageList.length > 1 && (
              <button
                type="button"
                className="image-viewer__nav image-viewer__nav--right"
                onClick={() => showAdjacentImage('next')}
                aria-label="Ảnh tiếp theo"
              >
                <ChevronRight size={28} />
              </button>
            )}

            <p className="image-viewer__hint">Chụm/mở 2 ngón tay để zoom. Kéo ảnh khi đang phóng to.</p>
          </div>
        )}
      </main>
    </div>
  );
}
