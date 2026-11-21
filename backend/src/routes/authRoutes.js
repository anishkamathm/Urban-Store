import express from 'express';
import { register, login, getProfile, updateLanguage } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/language', authenticate, updateLanguage);

export default router;
