import express from 'express';
import { searchTransits } from '../controllers/analysisController.js';
// import { protect } from '../middleware/authMiddleware.js'; // if needed later

const router = express.Router();

// @route POST /api/analysis/transit-search
router.route('/transit-search').post(searchTransits);

export default router;
