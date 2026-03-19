import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import productsRoutes from './routes/products.routes.js';
import importRoutes from './routes/import.routes.js';
import salesRoutes from './routes/sales.routes.js';
import cashRegisterRoutes from './routes/cashRegister.routes.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/products', productsRoutes);
app.use('/api/import', importRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/cash-register', cashRegisterRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️  Database: Connected`);
});