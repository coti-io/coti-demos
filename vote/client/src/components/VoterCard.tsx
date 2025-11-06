import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

interface VoterCardProps {
  name: string;
  voterId: string;
  hasVoted: boolean;
  onVoteClick: () => void;
}

export default function VoterCard({ name, voterId, hasVoted, onVoteClick }: VoterCardProps) {
  return (
    <Card className="p-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-card-foreground" data-testid={`text-voter-name-${voterId}`}>
          {name}
        </h3>
        <p className="text-sm text-muted-foreground font-mono" data-testid={`text-voter-id-${voterId}`}>
          {voterId}
        </p>
      </div>
      {hasVoted ? (
        <Button 
          variant="secondary" 
          disabled 
          className="shrink-0"
          data-testid={`button-voted-${voterId}`}
        >
          <Check className="w-4 h-4 mr-2" />
          Voted
        </Button>
      ) : (
        <Button 
          onClick={onVoteClick}
          className="shrink-0"
          data-testid={`button-vote-${voterId}`}
        >
          Vote
        </Button>
      )}
    </Card>
  );
}
