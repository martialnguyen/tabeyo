import { useEffect, useState } from 'react';
import { Avatar, Button, Checkbox, Form, Input, InputNumber, Modal, Popconfirm, Rate, Space, Switch, Table, Tag, Upload, message } from 'antd';
import { GripVertical, ImagePlus, Plus, Trash2, UploadCloud, Video } from 'lucide-react';
import { api, assetUrl } from '../../api/client.js';

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const defaultReviews = [
  {
    _id: makeId('review'),
    customerName: 'Khach hang',
    avatarUrl: '',
    rating: 5,
    content: 'San pham dep, giao nhanh.',
    media: [],
    isVisible: true,
    reviewDate: new Date().toISOString().slice(0, 10)
  }
];

function buildVariantLabel(optionValues = {}) {
  return Object.values(optionValues).filter(Boolean).join(' / ');
}

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'KH';
}

function normalizeReviewMedia(review = {}) {
  return (review.media || review.images || [])
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: `existing-media-${index}-${item}`,
          type: item.match(/\.(mp4|webm|mov)(\?|$)/i) ? 'video' : 'image',
          url: item,
          source: 'existing'
        };
      }
      return {
        id: item.id || `existing-media-${index}-${item.url}`,
        type: item.type === 'video' ? 'video' : 'image',
        url: item.url || '',
        source: 'existing'
      };
    })
    .filter((item) => item.url);
}

function normalizeReviews(reviews = []) {
  return reviews.map((review) => ({
    _id: review._id || makeId('review'),
    customerName: review.customerName || '',
    avatarUrl: review.avatarUrl || '',
    rating: Number(review.rating || 5),
    content: review.content || '',
    media: normalizeReviewMedia(review),
    isVisible: review.isVisible !== false,
    reviewDate: review.reviewDate ? new Date(review.reviewDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  }));
}

function isVideoMedia(media) {
  return media?.type === 'video' || media?.file?.originFileObj?.type?.startsWith('video/');
}

function normalizeGroups(groups = []) {
  return groups.map((group) => ({
    _id: group._id || makeId('group'),
    name: group.name || '',
    values: (group.values || []).map((value) => ({
      _id: value._id || makeId('value'),
      value: value.value || value
    }))
  }));
}

function createVariantCombinations(groups, existingVariants = []) {
  const activeGroups = groups.filter((group) => group.name && group.values?.length);
  if (!activeGroups.length) return existingVariants;

  const combinations = activeGroups.reduce(
    (acc, group) =>
      acc.flatMap((combo) =>
        group.values.map((value) => ({
          ...combo,
          [group.name]: value.value
        }))
      ),
    [{}]
  );

  return combinations.map((optionValues) => {
    const label = buildVariantLabel(optionValues);
    const existing = existingVariants.find((variant) => variant.label === label);
    return {
      _id: existing?._id || makeId('variant'),
      label,
      optionValues,
      sku: existing?.sku || '',
      stock: existing?.stock || 0,
      soldCount: existing?.soldCount || 0,
      image: existing?.image || ''
    };
  });
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [imageItems, setImageItems] = useState([]);
  const [uploadFileList, setUploadFileList] = useState([]);
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [variantGroups, setVariantGroups] = useState([]);
  const [variants, setVariants] = useState([]);
  const [variantImageFiles, setVariantImageFiles] = useState({});
  const [reviews, setReviews] = useState([]);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewEditorOpen, setReviewEditorOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewAvatarFile, setReviewAvatarFile] = useState(null);
  const [reviewMediaItems, setReviewMediaItems] = useState([]);
  const [reviewMediaUploadList, setReviewMediaUploadList] = useState([]);
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const loadProducts = () => api.get('/admin/products').then((res) => setProducts(res.data.products));

  useEffect(() => {
    loadProducts();
  }, []);

  const openForm = (product = null) => {
    imageItems.forEach((item) => {
      if (item.type === 'new' && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    Object.values(variantImageFiles).forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    reviews.forEach((review) => {
      if (review.avatarFile?.previewUrl) URL.revokeObjectURL(review.avatarFile.previewUrl);
      review.media?.forEach((item) => {
        if (item.source === 'new' && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    });

    const groups = product?.variantGroups?.length
      ? normalizeGroups(product.variantGroups)
      : normalizeGroups([
          { name: 'Mau sac', values: [{ value: 'Den' }, { value: 'Trang' }] },
          { name: 'Kich co', values: [{ value: 'M' }, { value: 'L' }] }
        ]);

    const nextVariants = product?.variants?.length
      ? product.variants.map((variant) => ({
          _id: variant._id || makeId('variant'),
          label: variant.label || buildVariantLabel(variant.optionValues),
          optionValues: variant.optionValues || {},
          sku: variant.sku || '',
          stock: Number(variant.stock || 0),
          soldCount: Number(variant.soldCount || 0),
          image: variant.image || ''
        }))
      : createVariantCombinations(groups, []);

    setEditing(product);
    setUploadFileList([]);
    setVariantGroups(groups);
    setVariants(nextVariants);
    setVariantImageFiles({});
    setReviews(product ? normalizeReviews(product.reviews || []) : defaultReviews.map((review) => ({ ...review })));
    setImageItems(
      (product?.images || []).map((image, index) => ({
        id: `existing-${index}-${image}`,
        type: 'existing',
        path: image,
        url: assetUrl(image)
      }))
    );
    form.setFieldsValue(
      product
        ? {
            ...product,
            images: undefined
          }
        : {
            name: '',
            category: '',
            price: 0,
            originalPrice: 0,
            description: '',
            soldCount: 0,
            ratingAverage: 5,
            ratingCount: 1,
            isActive: true,
            autoSoldEnabled: true,
            autoSoldMin: 1,
            autoSoldMax: 10,
            autoReduceStock: true,
            images: undefined
          }
    );
    setOpen(true);
  };

  const moveImage = (fromIndex, toIndex) => {
    if (fromIndex === null || fromIndex === toIndex) return;
    setImageItems((images) => {
      const nextImages = [...images];
      const [movedImage] = nextImages.splice(fromIndex, 1);
      nextImages.splice(toIndex, 0, movedImage);
      return nextImages;
    });
  };

  const removeImage = (imageItem) => {
    if (imageItem.type === 'new') {
      if (imageItem.previewUrl) URL.revokeObjectURL(imageItem.previewUrl);
      setUploadFileList((fileList) => fileList.filter((file) => file.uid !== imageItem.uid));
    }
    setImageItems((images) => images.filter((item) => item.id !== imageItem.id));
  };

  const handleUploadChange = ({ fileList }) => {
    setUploadFileList(fileList);
    setImageItems((items) => {
      const previousNewItems = items.filter((item) => item.type === 'new');
      const nextFileUids = new Set(fileList.map((file) => file.uid));

      previousNewItems.forEach((item) => {
        if (!nextFileUids.has(item.uid) && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });

      const nextNewByUid = new Map(
        fileList.map((file) => {
          const previous = previousNewItems.find((item) => item.uid === file.uid);
          if (previous) return [file.uid, { ...previous, file }];

          const previewUrl = file.originFileObj ? URL.createObjectURL(file.originFileObj) : '';
          return [
            file.uid,
            {
              id: `new-${file.uid}`,
              type: 'new',
              uid: file.uid,
              file,
              previewUrl,
              url: previewUrl
            }
          ];
        })
      );

      const orderedItems = items
        .map((item) => {
          if (item.type === 'existing') return item;
          return nextNewByUid.get(item.uid) || null;
        })
        .filter(Boolean);
      const orderedNewUids = new Set(orderedItems.filter((item) => item.type === 'new').map((item) => item.uid));
      const appendedNewItems = fileList
        .filter((file) => !orderedNewUids.has(file.uid))
        .map((file) => nextNewByUid.get(file.uid));

      return [...orderedItems, ...appendedNewItems];
    });
  };

  const updateGroupName = (groupId, name) => {
    setVariantGroups((groups) => groups.map((group) => (group._id === groupId ? { ...group, name } : group)));
  };

  const updateGroupValues = (groupId, valueText) => {
    const values = valueText
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => ({ _id: makeId('value'), value }));
    setVariantGroups((groups) => groups.map((group) => (group._id === groupId ? { ...group, values } : group)));
  };

  const addVariantGroup = () => {
    setVariantGroups((groups) => [...groups, { _id: makeId('group'), name: '', values: [] }]);
  };

  const removeVariantGroup = (groupId) => {
    setVariantGroups((groups) => groups.filter((group) => group._id !== groupId));
  };

  const regenerateVariants = () => {
    setVariants((currentVariants) => createVariantCombinations(variantGroups, currentVariants));
  };

  const updateVariant = (variantId, patch) => {
    setVariants((items) =>
      items.map((variant) =>
        variant._id === variantId
          ? {
              ...variant,
              ...patch,
              label: patch.optionValues ? buildVariantLabel(patch.optionValues) : variant.label
            }
          : variant
      )
    );
  };

  const handleVariantImageChange = (variantId, fileList) => {
    const file = fileList[0];
    setVariantImageFiles((items) => {
      const previous = items[variantId];
      if (previous?.previewUrl) URL.revokeObjectURL(previous.previewUrl);
      if (!file?.originFileObj) {
        const next = { ...items };
        delete next[variantId];
        return next;
      }
      return {
        ...items,
        [variantId]: {
          file,
          previewUrl: URL.createObjectURL(file.originFileObj)
        }
      };
    });
  };

  const getVariantImageUrl = (variant) => {
    return variantImageFiles[variant._id]?.previewUrl || (variant.image ? assetUrl(variant.image) : '');
  };

  const removeVariantImage = (variantId) => {
    const previous = variantImageFiles[variantId];
    if (previous?.previewUrl) URL.revokeObjectURL(previous.previewUrl);
    setVariantImageFiles((items) => {
      const next = { ...items };
      delete next[variantId];
      return next;
    });
    updateVariant(variantId, { image: '' });
  };

  const openReviewEditor = (review = null) => {
    if (reviewAvatarFile?.previewUrl) URL.revokeObjectURL(reviewAvatarFile.previewUrl);
    reviewMediaItems.forEach((item) => {
      if (item.source === 'new' && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });

    setEditingReview(review);
    setReviewAvatarFile(null);
    setReviewMediaUploadList([]);
    setReviewMediaItems(
      (review?.media || []).map((item) => ({
        ...item,
        id: item.id || `existing-media-${makeId('media')}`,
        source: item.source || 'existing',
        url: assetUrl(item.url)
      }))
    );
    reviewForm.setFieldsValue(
      review || {
        customerName: '',
        rating: 5,
        content: '',
        isVisible: true,
        reviewDate: new Date().toISOString().slice(0, 10)
      }
    );
    setReviewEditorOpen(true);
  };

  const handleReviewAvatarChange = (fileList) => {
    const file = fileList[0];
    if (reviewAvatarFile?.previewUrl) URL.revokeObjectURL(reviewAvatarFile.previewUrl);
    if (!file?.originFileObj) {
      setReviewAvatarFile(null);
      return;
    }
    setReviewAvatarFile({
      file,
      previewUrl: URL.createObjectURL(file.originFileObj)
    });
  };

  const handleReviewMediaChange = ({ fileList }) => {
    setReviewMediaUploadList(fileList);
    setReviewMediaItems((items) => {
      const previousNewItems = items.filter((item) => item.source === 'new');
      const nextFileUids = new Set(fileList.map((file) => file.uid));

      previousNewItems.forEach((item) => {
        if (!nextFileUids.has(item.uid) && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });

      const nextNewByUid = new Map(
        fileList.map((file) => {
          const previous = previousNewItems.find((item) => item.uid === file.uid);
          if (previous) return [file.uid, { ...previous, file }];

          const previewUrl = file.originFileObj ? URL.createObjectURL(file.originFileObj) : '';
          return [
            file.uid,
            {
              id: `media-${file.uid}`,
              uid: file.uid,
              source: 'new',
              type: file.originFileObj?.type?.startsWith('video/') ? 'video' : 'image',
              file,
              previewUrl,
              url: previewUrl
            }
          ];
        })
      );

      const existingItems = items.filter((item) => item.source !== 'new');
      return [...existingItems, ...fileList.map((file) => nextNewByUid.get(file.uid)).filter(Boolean)];
    });
  };

  const removeReviewMedia = (mediaId) => {
    setReviewMediaItems((items) => {
      const target = items.find((item) => item.id === mediaId);
      if (target?.source === 'new' && target.previewUrl) URL.revokeObjectURL(target.previewUrl);
      if (target?.uid) setReviewMediaUploadList((fileList) => fileList.filter((file) => file.uid !== target.uid));
      return items.filter((item) => item.id !== mediaId);
    });
  };

  const saveReview = async () => {
    const values = await reviewForm.validateFields();
    const reviewId = editingReview?._id || makeId('review');
    const nextReview = {
      ...(editingReview || {}),
      ...values,
      _id: reviewId,
      rating: Number(values.rating || 5),
      avatarUrl: editingReview?.avatarUrl || '',
      avatarFile: reviewAvatarFile || editingReview?.avatarFile,
      media: reviewMediaItems.map((item) => ({
        ...item,
        url: item.source === 'existing' ? item.url.replace(/^.*?(https?:\/\/)/, '$1') : item.url
      })),
      isVisible: values.isVisible !== false
    };

    setReviews((items) => {
      if (editingReview) return items.map((item) => (item._id === editingReview._id ? nextReview : item));
      return [nextReview, ...items];
    });
    setReviewEditorOpen(false);
    setReviewAvatarFile(null);
    setReviewMediaItems([]);
    setReviewMediaUploadList([]);
    reviewForm.resetFields();
  };

  const deleteReview = (reviewId) => {
    setReviews((items) => {
      const target = items.find((item) => item._id === reviewId);
      if (target?.avatarFile?.previewUrl) URL.revokeObjectURL(target.avatarFile.previewUrl);
      target?.media?.forEach((item) => {
        if (item.source === 'new' && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return items.filter((item) => item._id !== reviewId);
    });
  };

  const saveProduct = async (values) => {
    try {
      const payload = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (!['images'].includes(key)) payload.append(key, value ?? '');
      });
      payload.append('variantGroups', JSON.stringify(variantGroups));
      payload.append('variants', JSON.stringify(variants));

      const reviewAvatarIds = [];
      const reviewMediaRefs = [];
      const reviewsPayload = reviews.map((review) => {
        const newMediaIds = (review.media || []).filter((item) => item.source === 'new' && item.file?.originFileObj).map((item) => item.id);
        if (review.avatarFile?.file?.originFileObj) reviewAvatarIds.push(review._id);
        newMediaIds.forEach((mediaId) => reviewMediaRefs.push({ reviewId: review._id, mediaId }));
        return {
          _id: review._id,
          customerName: review.customerName,
          avatarUrl: review.avatarUrl,
          rating: review.rating,
          content: review.content,
          isVisible: review.isVisible,
          reviewDate: review.reviewDate,
          media: (review.media || [])
            .filter((item) => item.source !== 'new')
            .map((item) => ({
              url: item.url,
              type: item.type === 'video' ? 'video' : 'image'
            })),
          newMediaIds
        };
      });
      payload.append('reviews', JSON.stringify(reviewsPayload));
      payload.append('newReviewAvatarIds', JSON.stringify(reviewAvatarIds));
      payload.append('newReviewMediaRefs', JSON.stringify(reviewMediaRefs));
      reviews.forEach((review) => {
        if (review.avatarFile?.file?.originFileObj) payload.append('reviewAvatars', review.avatarFile.file.originFileObj);
        (review.media || [])
          .filter((item) => item.source === 'new' && item.file?.originFileObj)
          .forEach((item) => payload.append('reviewMedia', item.file.originFileObj));
      });
      payload.append('existingImages', JSON.stringify(imageItems.filter((item) => item.type === 'existing').map((item) => item.path)));
      payload.append(
        'imageOrder',
        JSON.stringify(
          imageItems.map((item) => ({
            type: item.type,
            value: item.type === 'existing' ? item.path : item.uid
          }))
        )
      );
      const newImageItems = imageItems.filter((item) => item.type === 'new');
      payload.append('newImageIds', JSON.stringify(newImageItems.map((item) => item.uid)));
      newImageItems.forEach((item) => {
        if (item.file?.originFileObj) payload.append('images', item.file.originFileObj);
      });

      const variantUploads = variants.filter((variant) => variantImageFiles[variant._id]?.file?.originFileObj);
      payload.append('newVariantImageIds', JSON.stringify(variantUploads.map((variant) => variant._id)));
      variantUploads.forEach((variant) => {
        payload.append('variantImages', variantImageFiles[variant._id].file.originFileObj);
      });

      if (editing) {
        await api.put(`/admin/products/${editing._id}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }
      message.success('Da luu san pham');
      setOpen(false);
      loadProducts();
    } catch (err) {
      message.error(err.response?.data?.message || 'Du lieu san pham khong hop le');
    }
  };

  const deleteProduct = async (id) => {
    await api.delete(`/admin/products/${id}`);
    loadProducts();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-2xl font-semibold">Quan ly san pham</h1>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => openForm()}>
          Them san pham
        </Button>
      </div>
      <Table
        rowKey="_id"
        dataSource={products}
        scroll={{ x: 1100 }}
        columns={[
          {
            title: 'Anh',
            dataIndex: 'images',
            render: (images) => images?.[0] && <img src={assetUrl(images[0])} alt="" className="h-14 w-14 object-cover" />
          },
          { title: 'Ten', dataIndex: 'name' },
          { title: 'Danh muc', dataIndex: 'category' },
          { title: 'Gia', dataIndex: 'price', render: (value) => Number(value).toLocaleString('vi-VN') },
          { title: 'Da ban', dataIndex: 'soldCount' },
          { title: 'Ton kho', dataIndex: 'stock' },
          { title: 'Auto sold', dataIndex: 'autoSoldEnabled', render: (value) => <Tag color={value ? 'green' : 'default'}>{value ? 'Bat' : 'Tat'}</Tag> },
          {
            title: 'Thao tac',
            render: (_, record) => (
              <Space>
                <Button onClick={() => openForm(record)}>Sua</Button>
                <Popconfirm title="Xoa san pham?" onConfirm={() => deleteProduct(record._id)}>
                  <Button danger>Xoa</Button>
                </Popconfirm>
              </Space>
            )
          }
        ]}
      />

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title={editing ? 'Sua san pham' : 'Them san pham'}
        width={1040}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={saveProduct}>
          <div className="grid gap-3 md:grid-cols-2">
            <Form.Item name="name" label="Ten san pham" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="category" label="Danh muc">
              <Input />
            </Form.Item>
            <Form.Item name="price" label="Gia" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="originalPrice" label="Gia goc">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="soldCount" label="Tong da ban">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="ratingAverage" label="Diem danh gia">
              <InputNumber className="w-full" min={0} max={5} step={0.1} />
            </Form.Item>
            <Form.Item name="ratingCount" label="So luot danh gia">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="images" label="Anh san pham">
              <Upload beforeUpload={() => false} multiple fileList={uploadFileList} onChange={handleUploadChange} showUploadList={false}>
                <Button icon={<UploadCloud size={16} />}>Chon anh</Button>
              </Upload>
            </Form.Item>
            <Form.Item name="autoSoldEnabled" label="Tu dong tang luot ban" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="autoReduceStock" label="Tu dong tru ton kho" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="autoSoldMin" label="Min moi lan">
              <InputNumber className="w-full" min={1} />
            </Form.Item>
            <Form.Item name="autoSoldMax" label="Max moi lan">
              <InputNumber className="w-full" min={1} />
            </Form.Item>
            <Form.Item name="isActive" label="Hien thi san pham" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Mo ta">
            <Input.TextArea rows={4} />
          </Form.Item>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="font-medium">Thu tu hien thi anh</label>
              <span className="text-xs text-gray-500">Keo tha de doi vi tri. Anh dau la anh dai dien.</span>
            </div>
            {imageItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {imageItems.map((imageItem, index) => (
                  <div
                    key={imageItem.id}
                    draggable
                    onDragStart={() => setDraggedImageIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      moveImage(draggedImageIndex, index);
                      setDraggedImageIndex(null);
                    }}
                    onDragEnd={() => setDraggedImageIndex(null)}
                    className={`group relative overflow-hidden rounded-sm border bg-white ${
                      index === 0 ? 'border-brand-500' : 'border-gray-200'
                    }`}
                  >
                    <div className="aspect-square bg-gray-100">
                      <img src={imageItem.url} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-sm bg-white/90 text-gray-700 shadow-sm">
                      <GripVertical size={16} />
                    </div>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 rounded-sm bg-brand-500 px-2 py-1 text-xs font-medium text-white">
                        Anh dai dien
                      </span>
                    )}
                    {imageItem.type === 'new' && (
                      <span className="absolute bottom-2 right-2 rounded-sm bg-green-600 px-2 py-1 text-xs font-medium text-white">
                        Anh moi
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(imageItem)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-sm bg-white/90 text-red-600 opacity-100 shadow-sm md:opacity-0 md:transition md:group-hover:opacity-100"
                      title="Xoa anh khoi san pham"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-sm border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                Chua co anh. Anh moi upload se hien tai day ngay lap tuc.
              </div>
            )}
          </div>

          <div className="mb-4 rounded-sm border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="m-0 text-lg font-semibold">Nhom phan loai</h3>
              <Button onClick={addVariantGroup} icon={<Plus size={16} />}>Them nhom</Button>
            </div>
            <div className="space-y-3">
              {variantGroups.map((group) => (
                <div key={group._id} className="grid gap-2 md:grid-cols-[180px_1fr_auto]">
                  <Input value={group.name} onChange={(event) => updateGroupName(group._id, event.target.value)} placeholder="VD: Mau sac" />
                  <Input
                    value={group.values.map((value) => value.value).join(', ')}
                    onChange={(event) => updateGroupValues(group._id, event.target.value)}
                    placeholder="VD: Xanh, Den, Trang"
                  />
                  <Button danger onClick={() => removeVariantGroup(group._id)}>Xoa</Button>
                </div>
              ))}
            </div>
            <Button className="mt-3" type="primary" ghost onClick={regenerateVariants}>
              Tao lai to hop phan loai
            </Button>
          </div>

          <div className="mb-4 overflow-x-auto rounded-sm border border-gray-200">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3">Anh phan loai</th>
                  <th className="p-3">To hop phan loai</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Ton kho</th>
                  <th className="p-3">Da ban</th>
                  <th className="p-3">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr key={variant._id} className="border-t border-gray-100 align-top">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-sm bg-gray-100">
                          {getVariantImageUrl(variant) ? (
                            <img src={getVariantImageUrl(variant)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImagePlus size={22} className="text-gray-400" />
                          )}
                        </div>
                        <Upload
                          beforeUpload={() => false}
                          maxCount={1}
                          showUploadList={false}
                          onChange={({ fileList }) => handleVariantImageChange(variant._id, fileList)}
                        >
                          <Button size="small">Upload</Button>
                        </Upload>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{variant.label || buildVariantLabel(variant.optionValues)}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.entries(variant.optionValues || {}).map(([key, value]) => (
                          <Tag key={`${variant._id}-${key}`}>{key}: {value}</Tag>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <Input value={variant.sku} onChange={(event) => updateVariant(variant._id, { sku: event.target.value })} />
                    </td>
                    <td className="p-3">
                      <InputNumber value={variant.stock} min={0} onChange={(value) => updateVariant(variant._id, { stock: Number(value || 0) })} />
                    </td>
                    <td className="p-3">
                      <InputNumber
                        value={variant.soldCount}
                        min={0}
                        onChange={(value) => updateVariant(variant._id, { soldCount: Number(value || 0) })}
                      />
                    </td>
                    <td className="p-3">
                      <Space>
                        <Button size="small" onClick={() => removeVariantImage(variant._id)}>Xoa anh</Button>
                        <Button danger size="small" onClick={() => setVariants((items) => items.filter((item) => item._id !== variant._id))}>
                          Xoa
                        </Button>
                      </Space>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-4 rounded-sm border border-gray-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="m-0 text-lg font-semibold">Danh gia nguoi mua</h3>
                <p className="m-0 text-sm text-gray-500">{reviews.length} danh gia. Quan ly bang popup, khong can nhap JSON.</p>
              </div>
              <Button onClick={() => setReviewsOpen(true)} icon={<Plus size={16} />}>
                Quan ly danh gia
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {reviews.slice(0, 4).map((review) => (
                <Tag key={review._id} color={review.isVisible ? 'green' : 'default'}>
                  {review.customerName || 'Khach hang'} - {review.rating} sao
                </Tag>
              ))}
              {reviews.length > 4 && <Tag>+{reviews.length - 4}</Tag>}
            </div>
          </div>
          <Button type="primary" htmlType="submit">Luu san pham</Button>
        </Form>
      </Modal>

      <Modal
        open={reviewsOpen}
        onCancel={() => setReviewsOpen(false)}
        title="Quan ly danh gia nguoi mua"
        width={980}
        footer={[
          <Button key="close" onClick={() => setReviewsOpen(false)}>
            Dong
          </Button>,
          <Button key="add" type="primary" icon={<Plus size={16} />} onClick={() => openReviewEditor()}>
            Them danh gia
          </Button>
        ]}
      >
        <Table
          rowKey="_id"
          dataSource={reviews}
          pagination={{ pageSize: 5, showSizeChanger: false }}
          columns={[
            {
              title: 'Khach hang',
              render: (_, review) => (
                <Space>
                  <Avatar src={review.avatarFile?.previewUrl || assetUrl(review.avatarUrl)}>
                    {getInitials(review.customerName)}
                  </Avatar>
                  <div>
                    <div className="font-medium">{review.customerName || 'Khach hang'}</div>
                    <div className="text-xs text-gray-500">{review.reviewDate}</div>
                  </div>
                </Space>
              )
            },
            { title: 'Sao', dataIndex: 'rating', render: (value) => <Rate disabled value={value} className="text-sm" /> },
            { title: 'Noi dung', dataIndex: 'content', ellipsis: true },
            {
              title: 'Media',
              render: (_, review) => (
                <Space size={4}>
                  {(review.media || []).slice(0, 4).map((item) => (
                    <span key={item.id} className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-sm bg-gray-100">
                      {isVideoMedia(item) ? (
                        <Video size={16} className="text-gray-500" />
                      ) : (
                        <img src={item.previewUrl || assetUrl(item.url)} alt="" className="h-full w-full object-cover" />
                      )}
                    </span>
                  ))}
                  {(review.media || []).length > 4 && <Tag>+{review.media.length - 4}</Tag>}
                </Space>
              )
            },
            { title: 'Hien thi', dataIndex: 'isVisible', render: (value) => <Tag color={value ? 'green' : 'default'}>{value ? 'Co' : 'An'}</Tag> },
            {
              title: 'Thao tac',
              render: (_, review) => (
                <Space>
                  <Button size="small" onClick={() => openReviewEditor(review)}>Sua</Button>
                  <Popconfirm title="Xoa danh gia?" onConfirm={() => deleteReview(review._id)}>
                    <Button danger size="small">Xoa</Button>
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Modal>

      <Modal
        open={reviewEditorOpen}
        onCancel={() => setReviewEditorOpen(false)}
        title={editingReview ? 'Sua danh gia' : 'Them danh gia'}
        width={760}
        okText="Luu danh gia"
        cancelText="Huy"
        onOk={saveReview}
      >
        <Form form={reviewForm} layout="vertical">
          <div className="grid gap-3 md:grid-cols-2">
            <Form.Item name="customerName" label="Ten nguoi mua" rules={[{ required: true, message: 'Nhap ten nguoi mua' }]}>
              <Input placeholder="VD: Minh Anh" />
            </Form.Item>
            <Form.Item name="reviewDate" label="Ngay danh gia">
              <Input type="date" />
            </Form.Item>
            <Form.Item name="rating" label="So sao">
              <Rate />
            </Form.Item>
            <Form.Item name="isVisible" valuePropName="checked">
              <Checkbox>Hien thi danh gia</Checkbox>
            </Form.Item>
          </div>
          <Form.Item name="content" label="Noi dung danh gia" rules={[{ required: true, message: 'Nhap noi dung danh gia' }]}>
            <Input.TextArea rows={4} placeholder="Nhap noi dung danh gia cua khach" />
          </Form.Item>
          <div className="mb-4 grid gap-4 md:grid-cols-[180px_1fr]">
            <div>
              <label className="mb-2 block font-medium">Avatar khach hang</label>
              <div className="mb-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                {reviewAvatarFile?.previewUrl || editingReview?.avatarUrl ? (
                  <img
                    src={reviewAvatarFile?.previewUrl || assetUrl(editingReview.avatarUrl)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Avatar size={80}>{getInitials(reviewForm.getFieldValue('customerName'))}</Avatar>
                )}
              </div>
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                accept="image/*"
                showUploadList={false}
                onChange={({ fileList }) => handleReviewAvatarChange(fileList)}
              >
                <Button icon={<UploadCloud size={16} />}>Upload avatar</Button>
              </Upload>
            </div>
            <div>
              <label className="mb-2 block font-medium">Anh / video danh gia</label>
              <Upload
                beforeUpload={() => false}
                multiple
                accept="image/*,video/*"
                fileList={reviewMediaUploadList}
                showUploadList={false}
                onChange={handleReviewMediaChange}
              >
                <Button icon={<UploadCloud size={16} />}>Upload nhieu anh/video</Button>
              </Upload>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {reviewMediaItems.map((item) => (
                  <div key={item.id} className="group relative aspect-square overflow-hidden rounded-sm bg-gray-100">
                    {isVideoMedia(item) ? (
                      <video src={item.previewUrl || assetUrl(item.url)} className="h-full w-full object-cover" muted />
                    ) : (
                      <img src={item.previewUrl || assetUrl(item.url)} alt="" className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeReviewMedia(item.id)}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-sm bg-white/90 text-red-600 shadow"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
