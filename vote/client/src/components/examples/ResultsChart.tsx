import { useState } from 'react';
import ResultsChart from '../ResultsChart';
import { Button } from '@/components/ui/button';

export default function ResultsChartExample() {
  const [closed, setClosed] = useState(false);

  const results = [
    { option: 'Chocolate', votes: 15, percentage: 25, color: '#8B4513' },
    { option: 'Raspberry', votes: 12, percentage: 20, color: '#DC143C' },
    { option: 'Sandwich', votes: 24, percentage: 40, color: '#FF8C00' },
    { option: 'Mango', votes: 9, percentage: 15, color: '#32CD32' },
  ];

  return (
    <div className="space-y-4">
      <Button onClick={() => setClosed(!closed)}>
        Toggle Election Status
      </Button>
      <ResultsChart results={results} isElectionClosed={closed} />
    </div>
  );
}
