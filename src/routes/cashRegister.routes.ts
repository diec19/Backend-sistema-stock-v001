import { Router } from 'express';
import {
  openCashRegister,
  closeCashRegister,
  getCurrentCashRegister,
  getAllCashRegisters
} from '../controllers/cashRegister.controller.js';

const router = Router();

router.get('/current', getCurrentCashRegister);
router.get('/', getAllCashRegisters);
router.post('/open', openCashRegister);
router.post('/:id/close', closeCashRegister);

export default router;