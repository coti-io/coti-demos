import { useState } from "react";
import VoterCard from "@/components/VoterCard";
import VotingModal from "@/components/VotingModal";
import ResultsChart from "@/components/ResultsChart";
import ElectionControls from "@/components/ElectionControls";
import { Card } from "@/components/ui/card";
import { useVotingContract } from "@/hooks/useVotingContract";
import { useToast } from "@/hooks/use-toast";

interface Voter {
  id: string;
  name: string;
  voterId: string;
  hasVoted: boolean;
}

interface VotingOption {
  id: string;
  label: string;
  color: string;
}

export default function VotingApp() {
  const { voters: contractVoters, castVote, contractAddress } = useVotingContract();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load voters from environment variables (excluding Alice who is the contract owner)
  const [voters, setVoters] = useState<Voter[]>(() => {
    const voterAccounts = [
      { 
        name: "Bob", 
        pk: import.meta.env.VITE_BOB_PK,
        aesKey: import.meta.env.VITE_BOB_AES_KEY
      },
      { 
        name: "Bea", 
        pk: import.meta.env.VITE_BEA_PK,
        aesKey: import.meta.env.VITE_BEA_AES_KEY
      },
      { 
        name: "Charlie", 
        pk: import.meta.env.VITE_CHARLIE_PK,
        aesKey: import.meta.env.VITE_CHARLIE_AES_KEY
      },
      { 
        name: "David", 
        pk: import.meta.env.VITE_DAVID_PK,
        aesKey: import.meta.env.VITE_DAVID_AES_KEY
      },
      { 
        name: "Ethan", 
        pk: import.meta.env.VITE_ETHAN_PK,
        aesKey: import.meta.env.VITE_ETHAN_AES_KEY
      },
    ];

    return voterAccounts
      .filter(account => account.pk && account.aesKey) // Only include if both PK and AES key exist
      .map((account, index) => ({
        id: (index + 1).toString(),
        name: account.name,
        voterId: account.pk ? `0x${account.pk.slice(0, 6)}...${account.pk.slice(-4)}` : "0x...",
        hasVoted: false,
      }));
  });

  const [isElectionOpen, setIsElectionOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentVoterId, setCurrentVoterId] = useState<string | null>(null);
  const [currentVoterName, setCurrentVoterName] = useState<string | null>(null);

  const votingOptions: VotingOption[] = [
    { id: "chocolate", label: "Chocolate", color: "#8B6914" },
    { id: "raspberry", label: "Raspberry", color: "#E74C3C" },
    { id: "sandwich", label: "Sandwich", color: "#F39C12" },
    { id: "mango", label: "Mango", color: "#7BC143" },
  ];

  // todo: remove mock functionality
  const [votes, setVotes] = useState<Record<string, number>>({
    chocolate: 15,
    raspberry: 12,
    sandwich: 24,
    mango: 9,
  });

  const handleVoteClick = (voterId: string) => {
    if (!isElectionOpen) return;
    const voter = voters.find(v => v.id === voterId);
    if (voter) {
      setCurrentVoterId(voterId);
      setCurrentVoterName(voter.name);
      setModalOpen(true);
    }
  };

  const handleSubmitVote = async (selectedOption: string) => {
    if (!currentVoterId || !currentVoterName) return;

    // Map option ID to vote value (1-4)
    const optionMap: Record<string, number> = {
      chocolate: 1,
      raspberry: 2,
      sandwich: 3,
      mango: 4,
    };

    const voteValue = optionMap[selectedOption];
    if (!voteValue) {
      toast({
        title: "Error",
        description: "Invalid vote option selected",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if contract address is set
      if (!contractAddress) {
        toast({
          title: "Contract Not Configured",
          description: "Please set VITE_CONTRACT_ADDRESS in your .env file",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Encrypting Vote",
        description: `Encrypting ${currentVoterName}'s vote...`,
      });

      // Cast vote on the blockchain
      const receipt = await castVote(currentVoterName, voteValue);

      // Update local state
      setVoters(voters.map(voter => 
        voter.id === currentVoterId 
          ? { ...voter, hasVoted: true }
          : voter
      ));
      
      setVotes(prev => ({
        ...prev,
        [selectedOption]: (prev[selectedOption] || 0) + 1,
      }));

      toast({
        title: "Vote Cast Successfully!",
        description: `Transaction: ${receipt.hash.slice(0, 10)}...${receipt.hash.slice(-8)}`,
      });
    } catch (error) {
      console.error("Error casting vote:", error);
      toast({
        title: "Vote Failed",
        description: error instanceof Error ? error.message : "Failed to cast vote",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setModalOpen(false);
      setCurrentVoterId(null);
      setCurrentVoterName(null);
    }
  };

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const results = votingOptions.map(option => ({
    option: option.label,
    votes: votes[option.id] || 0,
    percentage: totalVotes > 0 
      ? Math.round(((votes[option.id] || 0) / totalVotes) * 100) 
      : 0,
    color: option.color,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div>
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6" data-testid="text-voter-list-title">
                Voter List
              </h2>
              <div className="space-y-3">
                {voters.map((voter) => (
                  <VoterCard
                    key={voter.id}
                    name={voter.name}
                    voterId={voter.voterId}
                    hasVoted={voter.hasVoted}
                    onVoteClick={() => handleVoteClick(voter.id)}
                  />
                ))}
              </div>
            </Card>
          </div>

          <div>
            <ResultsChart 
              results={results} 
              isElectionClosed={!isElectionOpen} 
            />
          </div>
        </div>

        <ElectionControls
          isElectionOpen={isElectionOpen}
          onOpenElection={() => setIsElectionOpen(true)}
          onCloseElection={() => setIsElectionOpen(false)}
          contractAddress={contractAddress}
        />
      </div>

      <VotingModal
        open={modalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setModalOpen(false);
            setCurrentVoterId(null);
            setCurrentVoterName(null);
          }
        }}
        question="What is your favorite food?"
        options={votingOptions}
        onSubmit={handleSubmitVote}
      />
    </div>
  );
}
