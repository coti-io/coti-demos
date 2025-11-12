import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

interface VoterCardProps {
  name: string;
  voterId: string;
  hasVoted: boolean;
  transactionHash?: string;
  encryptedVote?: string;
  onVoteClick: () => void;
}

export default function VoterCard({ name, voterId, hasVoted, transactionHash, encryptedVote, onVoteClick }: VoterCardProps) {
  return (
    <Card className="p-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-card-foreground" data-testid={`text-voter-name-${voterId}`}>
          {name}
        </h3>
        <a
          href={`https://testnet.cotiscan.io/address/${voterId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 font-mono block hover:underline"
          data-testid={`text-voter-id-${voterId}`}
        >
          {voterId}
        </a>
        {transactionHash && (
          <div className="mt-1 space-y-1">
            <a
              href={`https://testnet.cotiscan.io/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono block hover:underline break-all"
              data-testid={`link-tx-${voterId}`}
            >
              Tx: {transactionHash}
            </a>
            {encryptedVote && (
              <div className="text-xs text-muted-foreground font-mono break-all">
                Encrypted Vote: {encryptedVote} 🔒
              </div>
            )}
          </div>
        )}
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
