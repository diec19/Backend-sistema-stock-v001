export interface CreateExpenseDTO {
  amount: number;
  description: string;
  createdBy: string;
  paymentMethod?: string;
}
