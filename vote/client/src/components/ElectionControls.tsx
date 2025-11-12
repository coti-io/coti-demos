import { Button } from "@/components/ui/button";

interface ElectionControlsProps {
  isElectionOpen: boolean;
  onOpenElection: () => void;
  onCloseElection: () => void;
  onFetchResults?: () => void;
  contractAddress?: string;
  isToggling?: boolean;
  isFetchingResults?: boolean;
  toggleTransactionHash?: string | null;
  resultsTransactionHash?: string | null;
}

export default function ElectionControls({
  isElectionOpen,
  onOpenElection,
  onCloseElection,
  onFetchResults,
  contractAddress,
  isToggling = false,
  isFetchingResults = false,
  toggleTransactionHash,
  resultsTransactionHash,
}: ElectionControlsProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-6 border-t">
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        {contractAddress && (
          <>
            <div className="flex items-center gap-2">
              <span className="font-medium">Contract:</span>
              <a
                href={`https://testnet.cotiscan.io/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-muted rounded text-xs font-mono hover:bg-muted/80 transition-colors"
              >
                {contractAddress}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Source Code:</span>
              <a
                href="https://github.com/coti-io/coti-contracts-examples/blob/main/contracts/PrivateVoting.sol"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-muted rounded text-xs hover:bg-muted/80 transition-colors text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View on GitHub
              </a>
            </div>
          </>
        )}
        {(toggleTransactionHash || resultsTransactionHash) && (
          <div className="font-medium mt-2">Transactions:</div>
        )}
        {toggleTransactionHash && (
          <div className="flex items-center gap-2">
            <span className="font-medium">Toggle:</span>
            <a
              href={`https://testnet.cotiscan.io/tx/${toggleTransactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono hover:underline break-all"
            >
              {toggleTransactionHash}
            </a>
          </div>
        )}
        {resultsTransactionHash && (
          <div className="flex items-center gap-2">
            <span className="font-medium">Results:</span>
            <a
              href={`https://testnet.cotiscan.io/tx/${resultsTransactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono hover:underline break-all"
            >
              {resultsTransactionHash}
            </a>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Button
          onClick={onOpenElection}
          disabled={isElectionOpen || isToggling}
          variant={isElectionOpen ? "secondary" : "default"}
          size="lg"
          className="px-8"
          data-testid="button-open-election"
        >
          {isToggling ? "Processing..." : "Open Voting"}
        </Button>
        <Button
          onClick={onCloseElection}
          disabled={!isElectionOpen || isToggling}
          variant={!isElectionOpen ? "secondary" : "destructive"}
          size="lg"
          className="px-8"
          data-testid="button-close-election"
        >
          {isToggling ? "Processing..." : "Close Voting"}
        </Button>
        {!isElectionOpen && onFetchResults && (
          <Button
            onClick={onFetchResults}
            disabled={isFetchingResults}
            variant="outline"
            size="lg"
            className="px-8"
            data-testid="button-fetch-results"
          >
            {isFetchingResults ? "Fetching..." : "Fetch Results"}
          </Button>
        )}
      </div>
    </div>
  );
}
