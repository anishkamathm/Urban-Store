import express from 'express';
import { placeOrder, getOrder, getUserOrders } from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';
import { extractLanguage } from '../middleware/language.js';

const router = express.Router();

router.use(authenticate);
router.use(extractLanguage);

router.post('/', placeOrder);
router.get('/my-orders', getUserOrders);
router.get('/:id', getOrder);

export default router;
