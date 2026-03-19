import { Router } from 'express';
import { importProducts, downloadTemplate } from '../controllers/import.controller.js';
import { upload } from '../config/upload.js';

const router = Router();

// Descargar plantilla Excel
router.get('/template', downloadTemplate);

// Importar productos desde Excel
router.post('/products', upload.single('file'), importProducts);

export default router;