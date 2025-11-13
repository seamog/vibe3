
import React, { useMemo } from 'react';
import { useState } from 'react';
import type { SimulationResult } from './types';
import { tqqqData } from './data/tqqqData';
import { runSimulation } from './services/simulationService';
import { Header } from './components/Header';
import { SimulationControls } from './components/SimulationControls';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  const [investment, setInvestment] = useState<number | ''>(100000);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { minDate, maxDate } = useMemo(() => {
    if (tqqqData.length === 0) {
        return { minDate: '', maxDate: '' };
    }
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    // Data is already sorted chronologically in tqqqData.ts
    return {
        minDate: formatDate(tqqqData[0].date),
        maxDate: formatDate(tqqqData[tqqqData.length - 1].date),
    };
  }, []);
  
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [endDate, setEndDate] = useState<string>('2025-04-30');


  const handleStart = () => {
    if (typeof investment !== 'number' || investment <= 0) {
      setError('Please enter a valid positive number for the investment amount.');
      return;
    }
    if (!startDate || !endDate) {
        setError('Please select a valid start and end date.');
        return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        setError('Start date cannot be after the end date.');
        return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    // Use a short timeout to ensure the UI updates to the loading state before the simulation runs
    setTimeout(() => {
      try {
        const simResult = runSimulation(tqqqData, investment, startDate, endDate);
        setResult(simResult);
      } catch (e) {
        if (e instanceof Error) {
          setError(`An error occurred during simulation: ${e.message}`);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <SimulationControls
            investment={investment}
            setInvestment={setInvestment}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            minDate={minDate}
            maxDate={maxDate}
            onStart={handleStart}
            isLoading={loading}
          />

          {error && (
            <div className="mt-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <ResultsDisplay result={result} isLoading={loading} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
