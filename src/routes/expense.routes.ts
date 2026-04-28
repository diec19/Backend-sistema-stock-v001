import { Router } from 'express';
import { createExpense, getExpenses, deleteExpense } from '../controllers/expense.controller.js';

const router = Router();

router.get('/', getExpenses);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);

export default router;
