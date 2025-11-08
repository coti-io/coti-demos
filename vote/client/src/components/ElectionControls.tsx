import { Button } from "@/components/ui/button";

interface ElectionControlsProps {
  isElectionOpen: boolean;
  onOpenElection: () => void;
  onCloseElection: () => void;
  contractAddress?: string;
}

export default function ElectionControls({
  isElectionOpen,
  onOpenElection,
  onCloseElection,
  contractAddress,
}: ElectionControlsProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-6 border-t">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {contractAddress && (
          <>
            <span className="font-medium">Contract:</span>
            <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
              {contractAddress}
            </code>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Button
          onClick={onOpenElection}
          disabled={isElectionOpen}
          variant={isElectionOpen ? "secondary" : "default"}
          size="lg"
          className="px-8"
          data-testid="button-open-election"
        >
          Open Voting
        </Button>
        <Button
          onClick={onCloseElection}
          disabled={!isElectionOpen}
          variant={!isElectionOpen ? "secondary" : "destructive"}
          size="lg"
          className="px-8"
          data-testid="button-close-election"
        >
          Close Voting
        </Button>
      </div>
    </div>
  );
}
