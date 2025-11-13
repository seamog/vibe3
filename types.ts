
export interface StockData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TransactionType = 'BUY' | 'SELL';
export type OrderType = 'LOC' | 'LIMIT' | 'MOC';

export interface Transaction {
  date: string;
  type: TransactionType;
  orderType: OrderType;
  shares: number;
  price: number;
  value: number;
  sharesHeld: number;
  avgPrice: number;
  cash: number;
  notes?: string;
}

export interface SimulationResult {
  history: Transaction[];
  initialInvestment: number;
  finalCash: number;
  finalShares: number;
  finalPortfolioValue: number;
  netProfit: number;
  netProfitPercent: number;
  startDate: string;
  endDate: string;
}

export enum SimulationMode {
  NORMAL = 'NORMAL',
  QUARTER_LOSS_CUT = 'QUARTER_LOSS_CUT',
}
