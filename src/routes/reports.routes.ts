import { Router } from 'express';
import {
  getReportSummary,
  getTopProducts,
  getSalesByDay,
  getSalesByHour,
  getCashRegisterReport,
  getExpenseReport,
} from '../controllers/reports.controller.js';

const router = Router();

router.get('/summary',        getReportSummary);
router.get('/top-products',   getTopProducts);
router.get('/sales-by-day',   getSalesByDay);
router.get('/sales-by-hour',  getSalesByHour);
router.get('/cash-registers', getCashRegisterReport);
router.get('/expenses',       getExpenseReport);

export default router;
