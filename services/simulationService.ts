
import type { StockData, Transaction, SimulationResult, TransactionType, OrderType } from '../types';
import { SimulationMode } from '../types';

interface SimulationState {
  cash: number;
  shares: number;
  avgPrice: number;
  cumulativeTransactionValue: number;
  history: Transaction[];
  mode: SimulationMode;
  // QLC mode specific state
  qlc: {
    purchaseCount: number;
    investment: number;
    purchaseAttemptAmount: number;
  };
}

const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const addTransaction = (
    state: SimulationState, 
    date: Date, 
    type: TransactionType, 
    orderType: OrderType, 
    shares: number, 
    price: number,
    notes?: string
) => {
    state.history.push({
        date: formatDate(date),
        type,
        orderType,
        shares: parseFloat(shares.toFixed(4)),
        price: parseFloat(price.toFixed(2)),
        value: parseFloat((shares * price).toFixed(2)),
        sharesHeld: parseFloat(state.shares.toFixed(4)),
        avgPrice: parseFloat(state.avgPrice.toFixed(2)),
        cash: parseFloat(state.cash.toFixed(2)),
        notes,
    });
};

export const runSimulation = (
  allData: StockData[],
  totalInvestment: number,
  startDateStr: string,
  endDateStr: string
): SimulationResult => {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const simulationData = allData
    .filter(d => d.date >= startDate && d.date <= endDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (simulationData.length === 0) {
      throw new Error("No historical data available for the selected period.");
  }

  const initialOneTimeBuyAmount = totalInvestment / 40;

  const state: SimulationState = {
    cash: totalInvestment,
    shares: 0,
    avgPrice: 0,
    cumulativeTransactionValue: 0,
    history: [],
    mode: SimulationMode.NORMAL,
    qlc: {
      purchaseCount: 0,
      investment: 0,
      purchaseAttemptAmount: 0,
    },
  };

  for (const day of simulationData) {
    let T = initialOneTimeBuyAmount > 0 ? Math.ceil((state.cumulativeTransactionValue / initialOneTimeBuyAmount) * 10) / 10 : 0;
    
    // --- MODE TRANSITION CHECK (before daily logic) ---
    if (state.mode === SimulationMode.NORMAL && T > 39) {
        state.mode = SimulationMode.QUARTER_LOSS_CUT;
        state.qlc.purchaseCount = 0;
        
        const sharesToSell = state.shares / 4;
        if (sharesToSell > 0) {
            const saleProceeds = sharesToSell * day.close;
            state.shares -= sharesToSell;
            state.cash += saleProceeds;
            state.cumulativeTransactionValue -= saleProceeds;
            addTransaction(state, day.date, 'SELL', 'MOC', sharesToSell, day.close, `Enter QLC Mode: T=${T}. Initial 1/4 loss cut.`);
        }
        
        state.qlc.investment = state.cash;
        state.qlc.purchaseAttemptAmount = state.qlc.investment / 10;
        T = initialOneTimeBuyAmount > 0 ? Math.ceil((state.cumulativeTransactionValue / initialOneTimeBuyAmount) * 10) / 10 : 0; // Recalculate T after potential state changes
    }
      
    // --- DAILY TRADING LOGIC ---
    if (state.mode === SimulationMode.NORMAL) {
        const SP = (10 - T / 2) * 0.01;
        const oneTimeBuyAmount = initialOneTimeBuyAmount;

        // SELL LOGIC (T <= 39)
        if (T <= 39 && state.shares > 0) {
            const sharesToSellQuarter = state.shares / 4;
            
            // LOC Sell
            const locSellPrice = state.avgPrice * (1 + SP) - 0.01;
            if (day.close >= locSellPrice) {
                const saleProceeds = sharesToSellQuarter * day.close;
                state.shares -= sharesToSellQuarter;
                state.cash += saleProceeds;
                state.cumulativeTransactionValue -= saleProceeds;
                addTransaction(state, day.date, 'SELL', 'LOC', sharesToSellQuarter, day.close, `LOC sell at ${locSellPrice.toFixed(2)}`);
            }

            // Limit Sell
            const remainingShares = state.shares; // after potential LOC sell
            if (remainingShares > 0) {
                const limitSellPrice = state.avgPrice * 1.1;
                if (day.high >= limitSellPrice) {
                    const sharesToSellThreeQuarters = (state.shares / (3/4)) * (3/4); // Base on current shares
                    const saleProceeds = sharesToSellThreeQuarters * limitSellPrice;
                    state.shares -= sharesToSellThreeQuarters;
                    state.cash += saleProceeds;
                    state.cumulativeTransactionValue -= saleProceeds;
                    addTransaction(state, day.date, 'SELL', 'LIMIT', sharesToSellThreeQuarters, limitSellPrice, `Limit sell at ${limitSellPrice.toFixed(2)}`);
                }
            }
        }

        // BUY LOGIC
        if (T < 20) {
            const buyAmount = oneTimeBuyAmount / 2;
            const refPrice = state.shares > 0 ? state.avgPrice : day.open;
            
            // LOC Buy 1
            const locBuyPrice1 = refPrice;
            if (state.cash >= buyAmount && day.close <= locBuyPrice1) {
                const sharesToBuy = Math.floor(buyAmount / day.close);
                if (sharesToBuy > 0) {
                    const cost = sharesToBuy * day.close;
                    if (state.shares > 0) {
                        state.avgPrice = (state.avgPrice * state.shares + cost) / (state.shares + sharesToBuy);
                    } else {
                        state.avgPrice = day.close;
                    }
                    state.shares += sharesToBuy;
                    state.cash -= cost;
                    state.cumulativeTransactionValue += cost;
                    addTransaction(state, day.date, 'BUY', 'LOC', sharesToBuy, day.close, `T=${T}, Target Price: ${locBuyPrice1.toFixed(2)}`);
                }
            }
            
            // LOC Buy 2
            const locBuyPrice2 = refPrice * (1 + SP);
            if (state.cash >= buyAmount && day.close <= locBuyPrice2) {
                const sharesToBuy = Math.floor(buyAmount / day.close);
                if (sharesToBuy > 0) {
                    const cost = sharesToBuy * day.close;
                    if (state.shares > 0) {
                        state.avgPrice = (state.avgPrice * state.shares + cost) / (state.shares + sharesToBuy);
                    } else {
                        state.avgPrice = day.close;
                    }
                    state.shares += sharesToBuy;
                    state.cash -= cost;
                    state.cumulativeTransactionValue += cost;
                    addTransaction(state, day.date, 'BUY', 'LOC', sharesToBuy, day.close, `T=${T}, Target Price: ${locBuyPrice2.toFixed(2)}`);
                }
            }
        } else if (T < 40) { // T is between 20 and 39
            const buyAmount = oneTimeBuyAmount;
            const refPrice = state.shares > 0 ? state.avgPrice : day.open;
            const locBuyPrice = refPrice * (1 + SP);
            if (state.cash >= buyAmount && day.close <= locBuyPrice) {
                 const sharesToBuy = Math.floor(buyAmount / day.close);
                 if (sharesToBuy > 0) {
                     const cost = sharesToBuy * day.close;
                     if (state.shares > 0) {
                        state.avgPrice = (state.avgPrice * state.shares + cost) / (state.shares + sharesToBuy);
                    } else {
                        state.avgPrice = day.close;
                    }
                     state.shares += sharesToBuy;
                     state.cash -= cost;
                     state.cumulativeTransactionValue += cost;
                     addTransaction(state, day.date, 'BUY', 'LOC', sharesToBuy, day.close, `T=${T}, Target Price: ${locBuyPrice.toFixed(2)}`);
                 }
            }
        }
    } else { // --- QLC MODE LOGIC ---
        // SELL LOGIC (EXIT QLC)
        let sold = false;
        if (state.shares > 0) {
            const sharesToSellQuarter = state.shares / 4;
            const locSellPrice = state.avgPrice * 0.9 - 0.01;
            if (day.close >= locSellPrice) {
                const saleProceeds = sharesToSellQuarter * day.close;
                state.shares -= sharesToSellQuarter;
                state.cash += saleProceeds;
                state.cumulativeTransactionValue -= saleProceeds;
                addTransaction(state, day.date, 'SELL', 'LOC', sharesToSellQuarter, day.close, `QLC LOC Sell, exiting mode.`);
                sold = true;
            }

            const remainingShares = state.shares;
            if (!sold && remainingShares > 0) {
                const limitSellPrice = state.avgPrice * 1.1;
                if (day.high >= limitSellPrice) {
                     const sharesToSellThreeQuarters = (state.shares / (3/4)) * (3/4);
                     const saleProceeds = sharesToSellThreeQuarters * limitSellPrice;
                     state.shares -= sharesToSellThreeQuarters;
                     state.cash += saleProceeds;
                     state.cumulativeTransactionValue -= saleProceeds;
                     addTransaction(state, day.date, 'SELL', 'LIMIT', sharesToSellThreeQuarters, limitSellPrice, `QLC Limit Sell, exiting mode.`);
                     sold = true;
                }
            }
        }

        if (sold) {
            state.mode = SimulationMode.NORMAL;
            continue; // Go to next day with Normal mode
        }

        // BUY LOGIC (if not exited)
        if (state.qlc.purchaseCount < 10) {
            const buyAmount = state.qlc.purchaseAttemptAmount;
            const locBuyPrice = state.avgPrice * 0.9;
             if (state.cash >= buyAmount && day.close <= locBuyPrice) {
                 const sharesToBuy = Math.floor(buyAmount / day.close);
                 if (sharesToBuy > 0) {
                     const cost = sharesToBuy * day.close;
                     state.avgPrice = (state.avgPrice * state.shares + cost) / (state.shares + sharesToBuy);
                     state.shares += sharesToBuy;
                     state.cash -= cost;
                     state.cumulativeTransactionValue += cost;
                     state.qlc.purchaseCount++;
                     addTransaction(state, day.date, 'BUY', 'LOC', sharesToBuy, day.close, `QLC Buy #${state.qlc.purchaseCount}`);
                     
                     if (state.qlc.purchaseCount === 10) {
                         const sharesToSell = state.shares / 4;
                         if (sharesToSell > 0) {
                             const saleProceeds = sharesToSell * day.close;
                             state.shares -= sharesToSell;
                             state.cash += saleProceeds;
                             state.cumulativeTransactionValue -= saleProceeds;
                             addTransaction(state, day.date, 'SELL', 'MOC', sharesToSell, day.close, `QLC 10th buy cycle end. 1/4 MOC sell.`);
                             
                             // Reset for next QLC cycle
                             state.qlc.purchaseCount = 0;
                             state.qlc.investment = state.cash;
                             state.qlc.purchaseAttemptAmount = state.qlc.investment / 10;
                         }
                     }
                 }
             }
        }
    }
  }

  const finalPortfolioValue = state.shares * (simulationData[simulationData.length - 1]?.close || 0) + state.cash;
  const netProfit = finalPortfolioValue - totalInvestment;
  const netProfitPercent = (netProfit / totalInvestment) * 100;

  return {
    history: state.history,
    initialInvestment: totalInvestment,
    finalCash: state.cash,
    finalShares: state.shares,
    finalPortfolioValue,
    netProfit,
    netProfitPercent,
    startDate: simulationData.length > 0 ? formatDate(simulationData[0].date) : startDateStr,
    endDate: simulationData.length > 0 ? formatDate(simulationData[simulationData.length - 1].date) : endDateStr,
  };
};
