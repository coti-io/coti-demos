import { Button } from "@/components/ui/button";

interface ElectionControlsProps {
  isElectionOpen: boolean;
  onOpenElection: () => void;
  onCloseElection: () => void;
}

export default function ElectionControls({
  isElectionOpen,
  onOpenElection,
  onCloseElection,
}: ElectionControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-6 border-t">
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
  );
}
