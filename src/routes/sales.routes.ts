import { Router } from 'express';
import {
  createSale,
  getAllSales,
  getSaleById,
  getSalesStats,
  deleteSale
} from '../controllers/sales.controller.js';

const router = Router();

router.get('/stats', getSalesStats);
router.get('/', getAllSales);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.delete('/:id', deleteSale);

export default router;