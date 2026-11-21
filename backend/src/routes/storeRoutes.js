import express from 'express';
import { getStores, getDemoLocations } from '../controllers/storeController.js';

const router = express.Router();

router.get('/', getStores);
router.get('/demo-locations', getDemoLocations);

export default router;
