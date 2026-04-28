export interface CreateSaleItemDTO {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleDTO {
  items: CreateSaleItemDTO[];
  paymentMethod?: string;
}

export interface SaleStats {
  totalSales: number;
  totalRevenue: number;
  todaySales: number;
  todayRevenue: number;
}