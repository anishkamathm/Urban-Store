import express from 'express';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getDashboardKPIs,
  getSystemActivity,
} from '../controllers/adminController.js';
import { createOfflineBill, getBillingHistory } from '../controllers/billingController.js';
import { getPurchaseHistory } from '../controllers/purchaseHistoryController.js';
import { getAllRequests, updateRequestStatus } from '../controllers/requestController.js';
import { getLostOpportunityReport, restockOpportunity } from '../controllers/reportController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// Dashboard KPIs
router.get('/dashboard-kpis', getDashboardKPIs);

// Product & Inventory Management
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Orders Management
router.get('/orders', getAllOrders);
router.put('/orders/:orderId/status', updateOrderStatus);

// POS Billing (Offline Sales)
router.post('/billing', createOfflineBill);
router.get('/billing/history', getBillingHistory);

// Unified Purchase History (Online + Offline) & Sales Summaries
router.get('/purchase-history', getPurchaseHistory);

// Customer Requests Management (Returns, Cancellations, Restock Alerts)
router.get('/requests', getAllRequests);
router.patch('/requests/:id/status', updateRequestStatus);

// Lost Opportunity Demand Reports
router.get('/reports/lost-opportunities', getLostOpportunityReport);
router.post('/reports/restock-opportunity', restockOpportunity);

// System Activity / Telemetry
router.get('/system-activity', getSystemActivity);

export default router;
