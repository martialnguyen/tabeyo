import 'dotenv/config';
import { randomUUID } from 'crypto';
import { connectFirebase } from '../config/firebase.js';
import { collection, sumVariantStock } from '../utils/firestore.js';

connectFirebase();

async function clearCollection(name) {
  const snapshot = await collection(name).get();
  if (snapshot.empty) return;

  let batch = collection(name).firestore.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count += 1;
    if (count === 450) {
      await batch.commit();
      batch = collection(name).firestore.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }
}

function variants(list) {
  return list.map((variant) => ({ _id: randomUUID(), ...variant }));
}

function reviews(list) {
  return list.map((review, index) => ({
    _id: randomUUID(),
    customerName: review.customerName,
    avatarUrl: review.avatarUrl || '',
    rating: review.rating,
    content: review.content,
    images: [],
    isVisible: true,
    reviewDate: new Date(Date.now() - index * 86400000)
  }));
}

function makeGroup(name, values) {
  return {
    _id: randomUUID(),
    name,
    values: [...new Set(values.filter(Boolean))].map((value) => ({
      _id: randomUUID(),
      value
    }))
  };
}

function inferVariantGroups(product) {
  const sizeValues = new Set(['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '1m6', '1m8', '30ml', '50ml']);
  const parts = (product.variants || []).map((variant) => String(variant.label || '').split('/').map((part) => part.trim()).filter(Boolean));
  const maxParts = Math.max(...parts.map((item) => item.length), 0);

  if (maxParts <= 1) {
    return {
      variantGroups: [makeGroup('Phan loai', parts.map((item) => item[0]))],
      variants: product.variants.map((variant, index) => ({
        ...variant,
        optionValues: { 'Phan loai': parts[index]?.[0] || variant.label },
        image: variant.image || product.images?.[index % (product.images?.length || 1)] || ''
      }))
    };
  }

  const firstValues = parts.map((item) => item[0]);
  const secondValues = parts.map((item) => item[1]);
  const secondLooksLikeSize = secondValues.some((value) => sizeValues.has(value));
  const groupNames = secondLooksLikeSize ? ['Mau sac', 'Kich co'] : ['Lua chon 1', 'Lua chon 2'];

  return {
    variantGroups: [makeGroup(groupNames[0], firstValues), makeGroup(groupNames[1], secondValues)],
    variants: product.variants.map((variant, index) => ({
      ...variant,
      optionValues: {
        [groupNames[0]]: parts[index]?.[0] || '',
        [groupNames[1]]: parts[index]?.[1] || ''
      },
      image: variant.image || product.images?.[index % (product.images?.length || 1)] || ''
    }))
  };
}

function makeProduct(product) {
  const now = new Date();
  const variantData = inferVariantGroups(product);
  return {
    ...product,
    ...variantData,
    stock: sumVariantStock(variantData.variants),
    isActive: true,
    autoSoldEnabled: true,
    autoSoldMin: 1,
    autoSoldMax: 10,
    autoSoldIntervalHours: 2,
    autoReduceStock: true,
    createdAt: now,
    updatedAt: now
  };
}

const products = [
  {
    name: 'Ao thun basic form rong',
    category: 'Thoi trang',
    description: 'Ao thun cotton mem, form rong de mac hang ngay. Phu hop di choi, di hoc, di lam.',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=900&auto=format&fit=crop'
    ],
    price: 99000,
    originalPrice: 149000,
    soldCount: 1260,
    ratingAverage: 4.8,
    ratingCount: 236,
    variants: variants([
      { label: 'Den / M', stock: 24, soldCount: 420 },
      { label: 'Den / L', stock: 18, soldCount: 320 },
      { label: 'Trang / M', stock: 12, soldCount: 280 },
      { label: 'Trang / L', stock: 9, soldCount: 240 }
    ]),
    reviews: reviews([
      { customerName: 'Minh Anh', rating: 5, content: 'Ao dep, vai day vua phai, mac rat thoai mai.' },
      { customerName: 'Quoc Bao', rating: 4, content: 'Giao nhanh, size dung nhu mo ta.' },
      { customerName: 'Ngoc Tram', rating: 5, content: 'Mau trang xinh, dong goi can than.' }
    ])
  },
  {
    name: 'Tui deo cheo mini chong nuoc',
    category: 'Phu kien',
    description: 'Tui deo cheo nho gon, chat lieu chong nuoc, nhieu ngan de dien thoai va vi.',
    images: [
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop'
    ],
    price: 159000,
    originalPrice: 219000,
    soldCount: 842,
    ratingAverage: 4.7,
    ratingCount: 118,
    variants: variants([
      { label: 'Den', stock: 30, soldCount: 360 },
      { label: 'Be', stock: 22, soldCount: 240 },
      { label: 'Xanh reu', stock: 16, soldCount: 242 }
    ]),
    reviews: reviews([
      { customerName: 'Lan Huong', rating: 5, content: 'Tui gon ma de du do can thiet.' },
      { customerName: 'Gia Bao', rating: 4, content: 'Khoa keo muot, mau den de phoi do.' }
    ])
  },
  {
    name: 'Binh giu nhiet inox 750ml',
    category: 'Gia dung',
    description: 'Binh giu nhiet 2 lop, giu nong lanh tot, nap kin va de ve sinh.',
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=900&auto=format&fit=crop'
    ],
    price: 189000,
    originalPrice: 259000,
    soldCount: 2040,
    ratingAverage: 4.9,
    ratingCount: 402,
    variants: variants([
      { label: 'Trang', stock: 20, soldCount: 700 },
      { label: 'Den', stock: 14, soldCount: 640 },
      { label: 'Xanh pastel', stock: 28, soldCount: 700 }
    ]),
    reviews: reviews([
      { customerName: 'Hoang Nam', rating: 5, content: 'Giu lanh tot, mau dep hon hinh.' },
      { customerName: 'Thanh Mai', rating: 5, content: 'Dong goi chac chan, se ung ho tiep.' }
    ])
  },
  {
    name: 'Giay sneaker canvas co thap',
    category: 'Giay dep',
    description: 'Giay canvas de mang, de phoi voi quan jeans, kaki va chan vay.',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=900&auto=format&fit=crop'
    ],
    price: 289000,
    originalPrice: 399000,
    soldCount: 1534,
    ratingAverage: 4.6,
    ratingCount: 281,
    variants: variants([
      { label: 'Trang / 38', stock: 13, soldCount: 300 },
      { label: 'Trang / 39', stock: 9, soldCount: 290 },
      { label: 'Den / 40', stock: 18, soldCount: 450 },
      { label: 'Den / 41', stock: 11, soldCount: 494 }
    ]),
    reviews: reviews([
      { customerName: 'Duy Khang', rating: 5, content: 'Giay nhe, di ca ngay van em.' },
      { customerName: 'Bao Tran', rating: 4, content: 'Form dep, nen tang nua size neu chan be.' }
    ])
  },
  {
    name: 'Tai nghe bluetooth mini',
    category: 'Dien tu',
    description: 'Tai nghe khong day hop sac nho gon, ket noi nhanh, phu hop nghe nhac va goi dien.',
    images: [
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=900&auto=format&fit=crop'
    ],
    price: 249000,
    originalPrice: 359000,
    soldCount: 3208,
    ratingAverage: 4.5,
    ratingCount: 612,
    variants: variants([
      { label: 'Trang', stock: 35, soldCount: 1200 },
      { label: 'Den', stock: 27, soldCount: 1508 },
      { label: 'Hong', stock: 19, soldCount: 500 }
    ]),
    reviews: reviews([
      { customerName: 'Phuong Linh', rating: 5, content: 'Am thanh on trong tam gia, pin dung du lau.' },
      { customerName: 'Anh Tu', rating: 4, content: 'Ket noi nhanh, hop sac nho.' }
    ])
  },
  {
    name: 'Set 3 hop dung thuc pham',
    category: 'Gia dung',
    description: 'Hop nhua an toan, co nap kin, dung de bao quan do an trong tu lanh.',
    images: [
      'https://images.unsplash.com/photo-1583947581924-860bda6a26df?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?q=80&w=900&auto=format&fit=crop'
    ],
    price: 79000,
    originalPrice: 119000,
    soldCount: 2750,
    ratingAverage: 4.7,
    ratingCount: 344,
    variants: variants([
      { label: 'Xanh / 500ml', stock: 40, soldCount: 900 },
      { label: 'Xanh / 900ml', stock: 32, soldCount: 740 },
      { label: 'Trang / 900ml', stock: 25, soldCount: 1110 }
    ]),
    reviews: reviews([
      { customerName: 'Kim Chi', rating: 5, content: 'Nap kin, dung com van phong rat tien.' },
      { customerName: 'Nhat Minh', rating: 4, content: 'Gia tot, chat lieu on.' }
    ])
  },
  {
    name: 'Kem chong nang nang tong SPF50',
    category: 'Lam dep',
    description: 'Kem chong nang ket cau mong nhe, nang tong tu nhien, phu hop dung hang ngay.',
    images: [
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=900&auto=format&fit=crop'
    ],
    price: 169000,
    originalPrice: 229000,
    soldCount: 4100,
    ratingAverage: 4.8,
    ratingCount: 821,
    variants: variants([
      { label: '30ml', stock: 36, soldCount: 1900 },
      { label: '50ml', stock: 21, soldCount: 2200 }
    ]),
    reviews: reviews([
      { customerName: 'Ha Vy', rating: 5, content: 'Chat kem mong, khong bi nang mat.' },
      { customerName: 'Thu Nga', rating: 5, content: 'Nang tong nhe, dung duoi makeup on.' }
    ])
  },
  {
    name: 'Den ngu LED cam ung',
    category: 'Dien tu',
    description: 'Den ngu cam ung 3 muc sang, sac USB, anh sang diu mat cho phong ngu.',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=900&auto=format&fit=crop'
    ],
    price: 129000,
    originalPrice: 179000,
    soldCount: 980,
    ratingAverage: 4.6,
    ratingCount: 164,
    variants: variants([
      { label: 'Trang am', stock: 22, soldCount: 430 },
      { label: 'Trang lanh', stock: 18, soldCount: 280 },
      { label: 'Doi mau', stock: 12, soldCount: 270 }
    ]),
    reviews: reviews([
      { customerName: 'Bao Ngoc', rating: 5, content: 'Den xinh, cam ung nhay.' },
      { customerName: 'Hai Long', rating: 4, content: 'Anh sang diu, phu hop de dau giuong.' }
    ])
  },
  {
    name: 'Quan short kaki nam',
    category: 'Thoi trang',
    description: 'Quan short kaki lung tren goi, chat vai dung form, mac thoai mai ngay he.',
    images: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900&auto=format&fit=crop'
    ],
    price: 139000,
    originalPrice: 199000,
    soldCount: 1675,
    ratingAverage: 4.6,
    ratingCount: 210,
    variants: variants([
      { label: 'Be / M', stock: 14, soldCount: 380 },
      { label: 'Be / L', stock: 11, soldCount: 420 },
      { label: 'Den / M', stock: 20, soldCount: 460 },
      { label: 'Den / XL', stock: 8, soldCount: 415 }
    ]),
    reviews: reviews([
      { customerName: 'Quang Huy', rating: 5, content: 'Vai dep, mac dung size.' },
      { customerName: 'Tien Dat', rating: 4, content: 'Gia on, shop tu van nhanh.' }
    ])
  },
  {
    name: 'May xay sinh to mini cam tay',
    category: 'Gia dung',
    description: 'May xay mini sac dien, thich hop xay trai cay, mang di van phong hoac du lich.',
    images: [
      'https://images.unsplash.com/photo-1570222094114-d054a817e56b?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560343090-f0409e92791a?q=80&w=900&auto=format&fit=crop'
    ],
    price: 219000,
    originalPrice: 319000,
    soldCount: 1320,
    ratingAverage: 4.4,
    ratingCount: 198,
    variants: variants([
      { label: 'Hong', stock: 16, soldCount: 440 },
      { label: 'Xanh', stock: 18, soldCount: 520 },
      { label: 'Trang', stock: 10, soldCount: 360 }
    ]),
    reviews: reviews([
      { customerName: 'Mai Phuong', rating: 4, content: 'Xay trai cay mem tot, may nho gon.' },
      { customerName: 'Khanh Linh', rating: 5, content: 'Mau xinh, de rua.' }
    ])
  },
  {
    name: 'Bo ga goi cotton mau tron',
    category: 'Nha cua',
    description: 'Bo ga goi cotton mem, mau toi gian, phu hop nhieu phong cach phong ngu.',
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=900&auto=format&fit=crop'
    ],
    price: 349000,
    originalPrice: 499000,
    soldCount: 740,
    ratingAverage: 4.7,
    ratingCount: 96,
    variants: variants([
      { label: 'Be / 1m6', stock: 9, soldCount: 230 },
      { label: 'Be / 1m8', stock: 7, soldCount: 180 },
      { label: 'Xam / 1m6', stock: 12, soldCount: 210 },
      { label: 'Xam / 1m8', stock: 6, soldCount: 120 }
    ]),
    reviews: reviews([
      { customerName: 'Thu Thao', rating: 5, content: 'Vai mem, mau be dep va sang.' },
      { customerName: 'Gia Han', rating: 4, content: 'Giao hoi cham nhung hang dep.' }
    ])
  },
  {
    name: 'Sac nhanh USB-C 30W',
    category: 'Dien tu',
    description: 'Cu sac nhanh 30W, ho tro nhieu thiet bi dien thoai va may tinh bang.',
    images: [
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=900&auto=format&fit=crop'
    ],
    price: 119000,
    originalPrice: 169000,
    soldCount: 5210,
    ratingAverage: 4.8,
    ratingCount: 1020,
    variants: variants([
      { label: 'Trang', stock: 50, soldCount: 2600 },
      { label: 'Den', stock: 36, soldCount: 2610 }
    ]),
    reviews: reviews([
      { customerName: 'Manh Tuan', rating: 5, content: 'Sac nhanh, nho gon, khong nong qua.' },
      { customerName: 'Duc Anh', rating: 5, content: 'Gia tot, dung on.' }
    ])
  }
];

async function seedProducts(productData) {
  const productRefs = [];
  const batch = collection('products').firestore.batch();

  productData.forEach((product) => {
    const ref = collection('products').doc();
    const normalizedProduct = makeProduct(product);
    batch.set(ref, normalizedProduct);
    productRefs.push({ _id: ref.id, ...normalizedProduct });
  });

  await batch.commit();
  return productRefs;
}

function makeOrder(product, variant, index) {
  const quantity = (index % 3) + 1;
  const methods = ['cod', 'qr'];
  const statuses = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
  const names = ['Nguyen Van An', 'Tran Minh Thu', 'Le Hoang Nam', 'Pham Ngoc Anh', 'Vo Thanh Dat', 'Do Mai Chi'];
  const phones = ['0901234567', '0912345678', '0923456789', '0934567890', '0945678901', '0956789012'];
  const addresses = [
    '12 Nguyen Trai, Quan 1, TP HCM',
    '45 Le Loi, Quan Hai Chau, Da Nang',
    '88 Cau Giay, Ha Noi',
    '21 Tran Phu, Nha Trang',
    '7 Ly Thuong Kiet, Hue',
    '102 Cach Mang Thang Tam, TP HCM'
  ];

  return {
    orderCode: `DHMOCK${String(index + 1).padStart(4, '0')}`,
    customerName: names[index % names.length],
    phone: phones[index % phones.length],
    addressType: index % 2 === 0 ? 'after_merge' : 'before_merge',
    address: addresses[index % addresses.length],
    note: index % 2 === 0 ? 'Giao gio hanh chinh' : 'Goi truoc khi giao',
    items: [
      {
        productId: product._id,
        productName: product.name,
        variantId: variant._id,
        variantLabel: variant.label,
        quantity,
        price: product.price
      }
    ],
    totalAmount: product.price * quantity,
    paymentMethod: methods[index % methods.length],
    paymentStatus: index % 2 === 0 ? 'pending' : 'paid',
    orderStatus: statuses[index % statuses.length],
    createdAt: new Date(Date.now() - index * 3600000),
    updatedAt: new Date(Date.now() - index * 1800000)
  };
}

async function seedOrders(productRefs) {
  const batch = collection('orders').firestore.batch();

  productRefs.slice(0, 10).forEach((product, index) => {
    const variant = product.variants[index % product.variants.length];
    batch.set(collection('orders').doc(), makeOrder(product, variant, index));
  });

  await batch.commit();
}

await clearCollection('products');
await clearCollection('paymentSettings');
await clearCollection('orders');

const productRefs = await seedProducts(products);
await seedOrders(productRefs);

await collection('paymentSettings').add({
  bankName: 'MB Bank',
  accountNumber: '123456789',
  accountHolder: 'NGUYEN VAN A',
  transferContentTemplate: 'DH-{orderCode}-{phone}',
  qrImage: '',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

console.log(`Seed data created: ${productRefs.length} products, 10 orders, 1 payment setting.`);
