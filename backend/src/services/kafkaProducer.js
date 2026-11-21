import { publishEvent } from '../config/kafka.js';
import { config } from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Kafka Topic: orders
 */
export async function publishOrderPlaced(orderData) {
  const event = {
    eventId: uuidv4(),
    eventType: 'order.placed',
    timestamp: new Date().toISOString(),
    orderId: orderData.id,
    orderNumber: orderData.order_number,
    userId: orderData.user_id,
    storeId: orderData.store_id,
    deliveryType: orderData.delivery_type,
    customerName: orderData.customer_name,
    customerEmail: orderData.customer_email,
    language: orderData.language || 'en',
    totalAmount: orderData.total_amount,
    etaMinutes: orderData.eta_minutes,
    distanceKm: orderData.distance_km,
    deliveryLat: orderData.delivery_lat,
    deliveryLng: orderData.delivery_lng,
    items: orderData.items || [],
    summary: `Urban Store order ${orderData.order_number} placed for ₹${orderData.total_amount} (${orderData.delivery_type})`,
  };

  await publishEvent(config.kafka.topics.orders, event, orderData.id);
  // Also emit to orderPlaced alias if different
  if (config.kafka.topics.orderPlaced && config.kafka.topics.orderPlaced !== config.kafka.topics.orders) {
    await publishEvent(config.kafka.topics.orderPlaced, event, orderData.id);
  }
  return event;
}

/**
 * Kafka Topic: orders (Offline in-store POS bill)
 */
export async function publishOfflineBillCreated(billData) {
  const event = {
    eventId: uuidv4(),
    eventType: 'offline_bill.created',
    timestamp: new Date().toISOString(),
    billId: billData.id,
    billNumber: billData.bill_number,
    storeId: billData.store_id,
    customerName: billData.customer_name,
    customerPhone: billData.customer_phone,
    paymentMethod: billData.payment_method,
    subtotal: billData.subtotal,
    taxAmount: billData.tax_amount,
    discountAmount: billData.discount_amount,
    totalAmount: billData.total_amount,
    items: billData.items || [],
    summary: `Urban Store POS Bill ${billData.bill_number} generated for ₹${billData.total_amount} (${billData.payment_method})`,
  };

  await publishEvent(config.kafka.topics.orders, event, billData.id);
  return event;
}

/**
 * Kafka Topic: stock-updates
 */
export async function publishStockUpdate({ productId, storeId, oldStock, newStock, delta, reason, source = 'online' }) {
  const event = {
    eventId: uuidv4(),
    eventType: 'stock.updated',
    timestamp: new Date().toISOString(),
    productId,
    storeId,
    oldStock,
    newStock,
    delta,
    reason: reason || 'inventory_change',
    source, // 'offline_pos', 'online_order', 'return_restored', 'admin_adjustment'
    summary: `Stock update for product ${productId} at store ${storeId || 'central'}: ${oldStock} -> ${newStock} (${reason})`,
  };

  await publishEvent(config.kafka.topics.stockUpdates, event, productId);
  if (config.kafka.topics.inventoryChanged && config.kafka.topics.inventoryChanged !== config.kafka.topics.stockUpdates) {
    await publishEvent(config.kafka.topics.inventoryChanged, event, productId);
  }
  return event;
}

// Backwards-compatible alias
export const publishInventoryChanged = publishStockUpdate;

/**
 * Kafka Topic: cart-reservations
 */
export async function publishCartReservationEvent(reservationData, eventType = 'cart.reserved') {
  const event = {
    eventId: uuidv4(),
    eventType, // 'cart.reserved', 'cart.reservation.expired', 'cart.reservation.released'
    timestamp: new Date().toISOString(),
    cartId: reservationData.cart_id,
    userId: reservationData.user_id,
    productId: reservationData.product_id,
    storeId: reservationData.store_id,
    quantity: reservationData.quantity,
    expiresAt: reservationData.expires_at,
    summary: `Cart reservation ${eventType} for product ${reservationData.product_id} by user ${reservationData.user_id}`,
  };

  await publishEvent(config.kafka.topics.cartReservations, event, reservationData.product_id);
  return event;
}

/**
 * Kafka Topic: notifications
 */
export async function publishNotificationEvent({ userId, type, titleEn, titleKn, messageEn, messageKn, meta = {} }) {
  const event = {
    eventId: uuidv4(),
    eventType: 'user.notification',
    timestamp: new Date().toISOString(),
    userId,
    type, // 'PAYMENT_REMINDER', 'RETURN_APPROVED', 'RESTOCK_ALERT', 'ORDER_STATUS'
    titleEn,
    titleKn,
    messageEn,
    messageKn,
    meta,
    summary: `Notification to user ${userId || 'anonymous'}: ${titleEn}`,
  };

  await publishEvent(config.kafka.topics.notifications, event, userId || 'broadcast');
  return event;
}

/**
 * Kafka Topic: search-events (for Lost Opportunity tracking)
 */
export async function publishSearchEvent({ query, resultCount, unavailableOrOutOfStock = false, matchedProduct = null, userLocation = null }) {
  const event = {
    eventId: uuidv4(),
    eventType: unavailableOrOutOfStock ? 'search.lost_opportunity' : 'search.performed',
    timestamp: new Date().toISOString(),
    query,
    normalizedQuery: query.toLowerCase().trim(),
    resultCount,
    unavailableOrOutOfStock,
    matchedProduct,
    userLocation,
    summary: `Search event for "${query}": ${resultCount} found (Lost Opp: ${unavailableOrOutOfStock})`,
  };

  await publishEvent(config.kafka.topics.searchEvents, event, event.normalizedQuery);
  return event;
}

/**
 * Kafka Product and Delivery events
 */
export async function publishProductUpdated(product) {
  const event = {
    eventId: uuidv4(),
    eventType: 'product.updated',
    timestamp: new Date().toISOString(),
    productId: product.id,
    product,
    summary: `Product ${product.name_en} (${product.id}) updated by admin`,
  };

  await publishEvent(config.kafka.topics.productUpdated || 'product.updated', event, product.id);
  return event;
}

export async function publishDeliveryAssigned(delivery) {
  const event = {
    eventId: uuidv4(),
    eventType: 'delivery.assigned',
    timestamp: new Date().toISOString(),
    orderId: delivery.order_id,
    deliveryId: delivery.id,
    storeId: delivery.store_id,
    riderName: delivery.rider_name,
    riderPhone: delivery.rider_phone,
    etaMinutes: delivery.eta_minutes,
    summary: `Rider ${delivery.rider_name} assigned to order ${delivery.order_id}`,
  };

  await publishEvent(config.kafka.topics.deliveryAssigned || 'delivery.assigned', event, delivery.order_id);
  return event;
}

export async function publishDeliveryStatusChanged(delivery, statusNote = '') {
  const event = {
    eventId: uuidv4(),
    eventType: 'delivery.status.changed',
    timestamp: new Date().toISOString(),
    orderId: delivery.order_id,
    deliveryId: delivery.id,
    status: delivery.status,
    currentLat: delivery.current_lat,
    currentLng: delivery.current_lng,
    etaMinutes: delivery.eta_minutes,
    statusNote,
    summary: `Delivery for order ${delivery.order_id} progressed to ${delivery.status}`,
  };

  await publishEvent(config.kafka.topics.deliveryStatusChanged || 'delivery.status.changed', event, delivery.order_id);
  return event;
}
