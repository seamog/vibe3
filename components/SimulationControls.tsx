
import React from 'react';
import type { Dispatch } from 'react';
import type { SetStateAction } from 'react';
import { SpinnerIcon } from './Icons';

interface SimulationControlsProps {
  investment: number | '';
  setInvestment: Dispatch<SetStateAction<number | ''>>;
  startDate: string;
  setStartDate: Dispatch<SetStateAction<string>>;
  endDate: string;
  setEndDate: Dispatch<SetStateAction<string>>;
  minDate: string;
  maxDate: string;
  onStart: () => void;
  isLoading: boolean;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({ 
  investment, setInvestment,
  startDate, setStartDate,
  endDate, setEndDate,
  minDate, maxDate,
  onStart, isLoading 
}) => {
  const handleInvestmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setInvestment('');
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setInvestment(numValue);
      }
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
      <h2 className="text-xl font-semibold mb-4 text-teal-400">Simulation Setup</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label htmlFor="investment" className="block text-sm font-medium text-gray-400 mb-1">
            Total Investment ($)
          </label>
          <div className="relative">
             <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
             <input
              type="number"
              id="investment"
              value={investment}
              onChange={handleInvestmentChange}
              className="w-full pl-7 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"
              placeholder="e.g., 100000"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-400 mb-1">
            Start Date
          </label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={minDate}
            max={maxDate}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-400 mb-1">
            End Date
          </label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={minDate}
            max={maxDate}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md focus:ring-teal-500 focus:border-teal-500 transition"
            disabled={isLoading}
          />
        </div>

      </div>
      <div className="mt-6 text-center">
        <button
          onClick={onStart}
          disabled={isLoading || !investment || !startDate || !endDate}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500"
        >
          {isLoading ? (
            <>
              <SpinnerIcon className="w-5 h-5 mr-2" />
              Running...
            </>
          ) : (
            'Start Simulation'
          )}
        </button>
      </div>
       <p className="text-xs text-gray-500 mt-2 text-center">Data available from {minDate} to {maxDate}.</p>
    </div>
  );
};
