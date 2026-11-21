import express from 'express';
import { getProducts, getProductById, getCategories, getAutocomplete } from '../controllers/productController.js';
import { extractLanguage } from '../middleware/language.js';

const router = express.Router();

router.use(extractLanguage);

router.get('/', getProducts);
router.get('/autocomplete', getAutocomplete);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

export default router;
