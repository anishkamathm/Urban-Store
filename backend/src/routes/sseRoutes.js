import express from 'express';
import { streamEvents } from '../controllers/sseController.js';

const router = express.Router();

router.get('/', streamEvents);

export default router;
