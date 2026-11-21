import express from 'express';
import { createRequest, getUserRequests } from '../controllers/requestController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Allow authenticated users to view their requests
router.get('/my', authenticate, getUserRequests);

// Create a return, cancellation, or restock notification request
// Users can submit returns or stock alerts (auth checked inside or optional)
router.post('/create', (req, res, next) => {
  // If Authorization header present, run authenticate middleware, otherwise proceed
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, createRequest);

export default router;
