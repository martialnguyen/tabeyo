import 'dotenv/config';
import { randomUUID } from 'crypto';
import { connectFirebase } from '../config/firebase.js';
import { collection } from '../utils/firestore.js';

connectFirebase();

const now = new Date();

const ipadImages = [
  'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1561154464-82e9adf32764?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1604399852419-f67ee7d5f2ef?q=80&w=900&auto=format&fit=crop'
];

function makeGroup(name, values) {
  return {
    _id: randomUUID(),
    name,
    values: values.map((value) => ({
      _id: randomUUID(),
      value
    }))
  };
}

function makeUsedIpad(product, index) {
  const color = product.color || 'Xám';
  const storage = product.storage || '32GB';
  const connection = product.connection || 'WiFi';
  const condition = product.condition || 'Máy cũ đẹp';
  const variantLabel = `${color} / ${storage} / ${connection} / ${condition}`;
  const image = product.images?.[0] || ipadImages[index % ipadImages.length];

  return {
    name: product.name,
    category: 'iPad',
    description: [
      product.description,
      '',
      'Tình trạng: máy cũ, đã kiểm tra chức năng cơ bản trước khi bán.',
      'Tồn kho: chỉ 1 máy đúng cấu hình này.',
      'Khách có thể bấm Tư vấn ngay để xem ảnh/video thực tế trước khi chốt đơn.'
    ].join('\n'),
    images: product.images || [
      image,
      ipadImages[(index + 1) % ipadImages.length],
      ipadImages[(index + 2) % ipadImages.length]
    ],
    price: product.price,
    originalPrice: product.originalPrice,
    soldCount: product.soldCount || 0,
    ratingAverage: 0,
    ratingCount: 0,
    variantGroups: [
      makeGroup('Màu sắc', [color]),
      makeGroup('Dung lượng', [storage]),
      makeGroup('Kết nối', [connection]),
      makeGroup('Tình trạng', [condition])
    ],
    variants: [
      {
        _id: randomUUID(),
        label: variantLabel,
        optionValues: {
          'Màu sắc': color,
          'Dung lượng': storage,
          'Kết nối': connection,
          'Tình trạng': condition
        },
        image,
        sku: product.sku,
        stock: 1,
        soldCount: product.soldCount || 0
      }
    ],
    stock: 1,
    reviews: [],
    isActive: true,
    autoSoldEnabled: false,
    autoSoldMin: 1,
    autoSoldMax: 1,
    autoSoldIntervalHours: 2,
    autoReduceStock: false,
    createdAt: now,
    updatedAt: now
  };
}

const cheapIpads = [
  {
    name: 'iPad Gen 6 32GB WiFi - máy cũ giá rẻ',
    sku: 'IPAD-GEN6-32-WIFI-GRAY',
    color: 'Xám',
    storage: '32GB',
    connection: 'WiFi',
    condition: 'Đẹp 95%',
    price: 2490000,
    originalPrice: 2990000,
    soldCount: 18,
    description: 'iPad Gen 6 màn 9.7 inch, phù hợp học online, xem YouTube, đọc tài liệu và dùng cơ bản.'
  },
  {
    name: 'iPad Gen 7 32GB WiFi - máy cũ học sinh',
    sku: 'IPAD-GEN7-32-WIFI-SILVER',
    color: 'Bạc',
    storage: '32GB',
    connection: 'WiFi',
    condition: 'Đẹp 96%',
    price: 3290000,
    originalPrice: 3890000,
    soldCount: 21,
    description: 'iPad Gen 7 màn 10.2 inch, pin ổn, dùng tốt cho học tập, giải trí và ghi chú nhẹ.'
  },
  {
    name: 'iPad Gen 8 32GB WiFi - máy cũ đẹp',
    sku: 'IPAD-GEN8-32-WIFI-GRAY',
    color: 'Xám',
    storage: '32GB',
    connection: 'WiFi',
    condition: 'Đẹp 97%',
    price: 3699000,
    originalPrice: 3990000,
    soldCount: 12,
    description: 'iPad Gen 8 hiệu năng ổn trong tầm giá, phù hợp học sinh, sinh viên và nhu cầu giải trí hàng ngày.'
  },
  {
    name: 'iPad Gen 8 128GB WiFi - máy cũ dung lượng cao',
    sku: 'IPAD-GEN8-128-WIFI-GOLD',
    color: 'Vàng',
    storage: '128GB',
    connection: 'WiFi',
    condition: 'Đẹp 95%',
    price: 4590000,
    originalPrice: 5290000,
    soldCount: 9,
    description: 'Bản 128GB thoải mái lưu tài liệu, ảnh, video và nhiều app học tập hơn bản 32GB.'
  },
  {
    name: 'iPad Gen 9 64GB WiFi - máy cũ giá tốt',
    sku: 'IPAD-GEN9-64-WIFI-SILVER',
    color: 'Bạc',
    storage: '64GB',
    connection: 'WiFi',
    condition: 'Đẹp 96%',
    price: 5290000,
    originalPrice: 5990000,
    soldCount: 15,
    description: 'iPad Gen 9 chip A13, màn 10.2 inch, lựa chọn cân bằng cho học tập, giải trí và làm việc nhẹ.'
  },
  {
    name: 'iPad Air 3 64GB WiFi - máy cũ mỏng nhẹ',
    sku: 'IPAD-AIR3-64-WIFI-GRAY',
    color: 'Xám',
    storage: '64GB',
    connection: 'WiFi',
    condition: 'Đẹp 94%',
    price: 4990000,
    originalPrice: 5790000,
    soldCount: 11,
    description: 'iPad Air 3 thiết kế mỏng nhẹ, màn đẹp, phù hợp học tập, đọc tài liệu và xem phim.'
  },
  {
    name: 'iPad mini 5 64GB WiFi - máy cũ nhỏ gọn',
    sku: 'IPAD-MINI5-64-WIFI-GOLD',
    color: 'Vàng',
    storage: '64GB',
    connection: 'WiFi',
    condition: 'Đẹp 95%',
    price: 4290000,
    originalPrice: 4990000,
    soldCount: 14,
    description: 'iPad mini 5 nhỏ gọn, dễ mang theo, phù hợp đọc sách, học ngoại ngữ, ghi chú và giải trí.'
  },
  {
    name: 'iPad Pro 10.5 64GB WiFi - máy cũ màn đẹp',
    sku: 'IPAD-PRO105-64-WIFI-ROSEGOLD',
    color: 'Hồng',
    storage: '64GB',
    connection: 'WiFi',
    condition: 'Đẹp 93%',
    price: 4690000,
    originalPrice: 5490000,
    soldCount: 8,
    description: 'iPad Pro 10.5 màn ProMotion mượt, loa hay, phù hợp xem phim, học tập và giải trí.'
  }
];

const snapshot = await collection('products').where('category', '==', 'iPad').get();
const existingNames = new Set(snapshot.docs.map((doc) => doc.data().name));
const productsToAdd = cheapIpads
  .filter((product) => !existingNames.has(product.name))
  .map((product, index) => makeUsedIpad(product, index));

if (!productsToAdd.length) {
  console.log('No new cheap iPad products to add. All items already exist.');
  process.exit(0);
}

const batch = collection('products').firestore.batch();

productsToAdd.forEach((product) => {
  batch.set(collection('products').doc(), product);
});

await batch.commit();

console.log(`Added ${productsToAdd.length} cheap used iPad products. Each product stock is 1.`);
