export interface OpenCashRegisterDTO {
  openingAmount: number | string;
  openedBy: string;
}

export interface CloseCashRegisterDTO {
  closingAmount: number | string;
  closedBy: string;
}