
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 shadow-md p-4">
      <div className="container mx-auto text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-teal-400">
          TQQQ Variable Installment Strategy Simulator
        </h1>
        <p className="text-gray-400 mt-1">Back-test your trading strategy with historical data.</p>
      </div>
    </header>
  );
};
