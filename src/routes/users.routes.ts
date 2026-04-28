import { Router } from 'express';
import { adminOnly } from '../middlewares/auth.middleware.js';
import { getUsers, createUser, updateUser, resetPassword, deleteUser } from '../controllers/users.controller.js';

const router = Router();

router.get('/',            adminOnly, getUsers);
router.post('/',           adminOnly, createUser);
router.put('/:id',         adminOnly, updateUser);
router.patch('/:id/password', adminOnly, resetPassword);
router.delete('/:id',      adminOnly, deleteUser);

export default router;
