import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VoteResult {
  option: string;
  votes: number;
  percentage: number;
  color: string;
}

interface ResultsChartProps {
  results: VoteResult[];
  isElectionClosed: boolean;
}

export default function ResultsChart({ results, isElectionClosed }: ResultsChartProps) {
  const maxVotes = Math.max(...results.map(r => r.votes), 1);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" data-testid="text-results-title">
          Voting Results
        </h2>
        <Badge 
          variant={isElectionClosed ? "secondary" : "default"}
          data-testid="badge-election-status"
        >
          {isElectionClosed ? "Closed" : "Open"}
        </Badge>
      </div>
      
      {!isElectionClosed ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground" data-testid="text-results-hidden">
            Results will be visible when voting closes
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((result, index) => (
            <div key={result.option} data-testid={`result-item-${index}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm" data-testid={`text-option-${index}`}>
                  {result.option}
                </span>
                <span className="text-sm text-muted-foreground" data-testid={`text-percentage-${index}`}>
                  {result.percentage}% ({result.votes})
                </span>
              </div>
              <div className="h-8 bg-muted rounded-md overflow-hidden">
                <div
                  className="h-full transition-all duration-500 flex items-center justify-end px-3"
                  style={{
                    width: `${(result.votes / maxVotes) * 100}%`,
                    backgroundColor: result.color,
                  }}
                  data-testid={`bar-${index}`}
                >
                  {result.votes > 0 && (
                    <span className="text-xs font-semibold text-white">
                      {result.percentage}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
