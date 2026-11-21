// Server-Sent Events (SSE) Manager - Urban Store

const clients = new Set();

export function addSseClient(res) {
  clients.add(res);
  console.log(`[SSE] Client connected. Active streams: ${clients.size}`);

  // Send initial handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to Urban Store live stream', timestamp: Date.now() })}\n\n`);

  res.on('close', () => {
    clients.delete(res);
    console.log(`[SSE] Client disconnected. Active streams: ${clients.size}`);
  });
}

export function broadcastSse(eventType, data) {
  if (clients.size === 0) return;

  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch (err) {
      clients.delete(client);
    }
  }
}

export function broadcastStockUpdate(productId, storeId, stock, totalStock) {
  broadcastSse('inventory_changed', {
    productId,
    storeId,
    stock,
    totalStock,
    timestamp: Date.now(),
  });
}

export function broadcastDeliveryUpdate(orderId, deliveryData) {
  broadcastSse('delivery_status_changed', {
    orderId,
    ...deliveryData,
    timestamp: Date.now(),
  });
}

export function broadcastNotification(notificationData) {
  broadcastSse('notification', {
    ...notificationData,
    timestamp: Date.now(),
  });
}

export function broadcastSystemActivity(activityData) {
  broadcastSse('system_activity', {
    ...activityData,
    timestamp: Date.now(),
  });
}

export function broadcastInventoryChange(productId, storeId, stock, totalStock) {
  broadcastStockUpdate(productId, storeId, stock, totalStock);
}

export const sseService = {
  addSseClient,
  broadcastSse,
  broadcastStockUpdate,
  broadcastInventoryChange,
  broadcastDeliveryUpdate,
  broadcastNotification: (userId, messageEn, messageKn, extra = {}) => {
    broadcastNotification({ userId, messageEn, messageKn, ...extra });
  },
  broadcastSystemActivity,
};

export default sseService;
