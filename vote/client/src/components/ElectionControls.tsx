import { Button } from "@/components/ui/button";

interface ElectionControlsProps {
  isElectionOpen: boolean;
  onOpenElection: () => void;
  onCloseElection: () => void;
  contractAddress?: string;
  isToggling?: boolean;
  toggleTransactionHash?: string | null;
}

export default function ElectionControls({
  isElectionOpen,
  onOpenElection,
  onCloseElection,
  contractAddress,
  isToggling = false,
  toggleTransactionHash,
}: ElectionControlsProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-6 border-t">
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        {contractAddress && (
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
        )}
        {toggleTransactionHash && (
          <div className="flex items-center gap-2">
            <span className="font-medium">Last Toggle:</span>
            <a
              href={`https://testnet.cotiscan.io/tx/${toggleTransactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-muted rounded text-xs font-mono hover:bg-muted/80 transition-colors"
            >
              {toggleTransactionHash.slice(0, 10)}...{toggleTransactionHash.slice(-8)}
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
      </div>
    </div>
  );
}
