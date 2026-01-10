import { Decimal } from '@prisma/client/runtime/library';

export interface CreateProductDTO {
  name: string;
  description: string;
  sku: string;
  price: number | Decimal;
  stock: number;
  minStock: number;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  sku?: string;
  price?: number | Decimal;
  stock?: number;
  minStock?: number;
}

export interface ProductStats {
  totalProducts: number;
  lowStockCount: number;
  totalValue: number;
}