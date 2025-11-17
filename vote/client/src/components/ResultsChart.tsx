interface VoteResult {
  option: string;
  votes: number;
  percentage: number;
  color: string;
}

interface ResultsChartProps {
  results: VoteResult[];
  isElectionClosed: boolean;
  onOpenElection: () => void;
  onCloseElection: () => void;
  onFetchResults?: () => void;
  isToggling?: boolean;
  isFetchingResults?: boolean;
  toggleTransactionHash?: string | null;
  toggleTransactionLabel?: string;
  resultsTransactionHash?: string | null;
}

export default function ResultsChart({
  results,
  isElectionClosed,
  onOpenElection,
  onCloseElection,
  onFetchResults,
  isToggling = false,
  isFetchingResults = false,
  toggleTransactionHash,
  toggleTransactionLabel = "Toggle Election",
  resultsTransactionHash
}: ResultsChartProps) {
  const maxVotes = Math.max(...results.map(r => r.votes), 1);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 className="card-title" data-testid="text-results-title">
          Voting Results
        </h2>
        <span
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '600',
            background: isElectionClosed ? '#6c757d' : 'linear-gradient(135deg, #007bff, #0056b3)',
            color: 'white'
          }}
          data-testid="badge-election-status"
        >
          {isElectionClosed ? "Closed" : "Open"}
        </span>
      </div>

      <div className="button-group" style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={onOpenElection}
          disabled={!isElectionClosed || isToggling}
          className="btn btn-success"
          data-testid="button-open-election"
        >
          {isToggling ? "Processing..." : "Open Voting"}
        </button>
        <button
          onClick={onCloseElection}
          disabled={isElectionClosed || isToggling}
          className="btn"
          style={{
            background: isElectionClosed ? '#6c757d' : 'linear-gradient(135deg, #dc3545, #c82333)',
            color: 'white'
          }}
          data-testid="button-close-election"
        >
          {isToggling ? "Processing..." : "Close Voting"}
        </button>
        {isElectionClosed && onFetchResults && (
          <button
            onClick={onFetchResults}
            disabled={isFetchingResults}
            className="btn btn-warning"
            data-testid="button-fetch-results"
          >
            {isFetchingResults ? "Fetching..." : "Fetch Results"}
          </button>
        )}
      </div>

      {!isElectionClosed ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ color: '#666' }} data-testid="text-results-hidden">
            Results will be visible when voting closes
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {results.map((result, index) => (
            <div key={result.option} data-testid={`result-item-${index}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '600', fontSize: '0.875rem' }} data-testid={`text-option-${index}`}>
                  {result.option}
                </span>
                <span style={{ fontSize: '0.875rem', color: '#666' }} data-testid={`text-percentage-${index}`}>
                  {result.percentage}% ({result.votes})
                </span>
              </div>
              <div
                style={{
                  height: '2rem',
                  background: '#e9ecef',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(result.votes / maxVotes) * 100}%`,
                    backgroundColor: result.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '0 0.75rem',
                    transition: 'width 0.5s ease'
                  }}
                  data-testid={`bar-${index}`}
                >
                  {result.votes > 0 && (
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'white' }}>
                      {result.percentage}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(toggleTransactionHash || resultsTransactionHash) && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            fontSize: '0.875rem'
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#555' }}>
            Transactions:
          </div>
          {toggleTransactionHash && (
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '600', color: '#555' }}>{toggleTransactionLabel}: </span>
              <a
                href={`https://testnet.cotiscan.io/tx/${toggleTransactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#0066cc',
                  textDecoration: 'none',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  wordBreak: 'break-all'
                }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                {toggleTransactionHash}
              </a>
            </div>
          )}
          {resultsTransactionHash && (
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '600', color: '#555' }}>Fetch Results: </span>
              <a
                href={`https://testnet.cotiscan.io/tx/${resultsTransactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#0066cc',
                  textDecoration: 'none',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  wordBreak: 'break-all'
                }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                {resultsTransactionHash}
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}
