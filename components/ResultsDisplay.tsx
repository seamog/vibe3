
import React from 'react';
import type { SimulationResult, Transaction } from '../types';
import { BuyIcon, SellIcon } from './Icons';

interface ResultsDisplayProps {
  result: SimulationResult | null;
  isLoading: boolean;
}

const StatCard: React.FC<{ title: string; value: string; colorClass?: string }> = ({ title, value, colorClass = 'text-white' }) => (
  <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-center">
    <h4 className="text-sm font-medium text-gray-400">{title}</h4>
    <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }) => {
    const isBuy = tx.type === 'BUY';
    return (
        <tr className="border-b border-gray-700 hover:bg-gray-800/50">
            <td className="p-3 text-sm text-gray-400">{tx.date}</td>
            <td className="p-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isBuy ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {isBuy ? <BuyIcon className="w-4 h-4 mr-1" /> : <SellIcon className="w-4 h-4 mr-1" />}
                    {tx.type}
                </span>
            </td>
            <td className="p-3 text-sm text-gray-400">{tx.orderType}</td>
            <td className="p-3 text-sm text-right">{tx.shares.toFixed(4)}</td>
            <td className="p-3 text-sm text-right">${tx.price.toFixed(2)}</td>
            <td className="p-3 text-sm text-right">${tx.value.toFixed(2)}</td>
            <td className="p-3 text-sm text-right">{tx.sharesHeld.toFixed(4)}</td>
            <td className="p-3 text-sm text-right">${tx.avgPrice.toFixed(2)}</td>
            <td className="p-3 text-sm text-right">${tx.cash.toFixed(2)}</td>
            <td className="p-3 text-xs text-gray-500 max-w-xs truncate" title={tx.notes}>{tx.notes}</td>
        </tr>
    );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, isLoading }) => {
  if (isLoading) {
    return <div className="text-center p-10">Loading results...</div>;
  }

  if (!result) {
    return (
      <div className="text-center p-10 mt-6 bg-gray-800 rounded-lg">
        <h3 className="text-lg text-gray-400">Enter your investment amount and start the simulation to see the results.</h3>
      </div>
    );
  }

  const profitColor = result.netProfit >= 0 ? 'text-green-400' : 'text-red-400';
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-teal-400 mb-4">Simulation Results</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Final Portfolio Value" value={formatCurrency(result.finalPortfolioValue)} />
        <StatCard title="Net Profit / Loss" value={formatCurrency(result.netProfit)} colorClass={profitColor} />
        <StatCard title="Net Return" value={`${result.netProfitPercent.toFixed(2)}%`} colorClass={profitColor} />
        <StatCard title="Total Transactions" value={result.history.length.toString()} />
      </div>

      <div className="bg-gray-800 p-4 rounded-lg shadow-xl">
        <h3 className="text-xl font-semibold mb-4">Transaction History</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-900/50 text-xs text-gray-400 uppercase tracking-wider">
                    <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Order Type</th>
                        <th className="p-3 text-right">Shares</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Value</th>
                        <th className="p-3 text-right">Shares Held</th>
                        <th className="p-3 text-right">Avg. Price</th>
                        <th className="p-3 text-right">Cash</th>
                        <th className="p-3">Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {result.history.length > 0 ? (
                        result.history.map((tx, index) => <TransactionRow key={index} tx={tx} />)
                    ) : (
                        <tr><td colSpan={10} className="text-center p-6 text-gray-500">No transactions were made during this period.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
