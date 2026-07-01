const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function truncate(value = '', maxLength = 900) {
  const text = String(value || '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function buildOrderDescription(order) {
  const items = (order.items || [])
    .map((item) => `- ${item.productName} (${item.variantLabel}) x${item.quantity}`)
    .join('\n');

  return truncate(
    [
      `Ma don: ${order.orderCode}`,
      `Khach hang: ${order.customerName}`,
      `So dien thoai: ${order.phone}`,
      `Thanh toan: ${order.paymentMethod === 'cod' ? 'Ship COD' : 'Thanh toan ngay'}`,
      `Tong tien: ${money.format(Number(order.totalAmount || 0))}`,
      '',
      'San pham:',
      items || '- Chua co san pham'
    ].join('\n')
  );
}

export async function notifyDiscordNewOrder(order) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const adminOrdersUrl = process.env.CLIENT_URL && process.env.CLIENT_URL !== '*'
    ? `${process.env.CLIENT_URL.split(',')[0].trim()}/admin/orders`
    : '';

  const payload = {
    username: 'Tabeyo Orders',
    embeds: [
      {
        title: 'Co don hang moi',
        description: buildOrderDescription(order),
        color: 0xee4d2d,
        fields: [
          {
            name: 'Dia chi',
            value: truncate(order.address || 'Khong co dia chi', 500)
          },
          {
            name: 'Ghi chu',
            value: truncate(order.note || 'Khong co ghi chu', 300)
          }
        ],
        url: adminOrdersUrl || undefined,
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn(`Discord notification failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.warn(`Discord notification failed: ${error.message}`);
  }
}
