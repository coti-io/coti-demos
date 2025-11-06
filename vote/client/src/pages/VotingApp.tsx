import { useState } from "react";
import VoterCard from "@/components/VoterCard";
import VotingModal from "@/components/VotingModal";
import ResultsChart from "@/components/ResultsChart";
import ElectionControls from "@/components/ElectionControls";
import { Card } from "@/components/ui/card";

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
  // todo: remove mock functionality
  const [voters, setVoters] = useState<Voter[]>([
    { id: "1", name: "Alice", voterId: "0xAbc...123", hasVoted: false },
    { id: "2", name: "Bob", voterId: "0xAbc...123", hasVoted: false },
    { id: "3", name: "Bob", voterId: "0xAbc...123", hasVoted: false },
    { id: "4", name: "Charlie", voterId: "0xAbc...123", hasVoted: false },
    { id: "5", name: "Charlie", voterId: "0xAbc...123", hasVoted: false },
    { id: "6", name: "Negna", voterId: "0xAbc...123", hasVoted: false },
  ]);

  const [isElectionOpen, setIsElectionOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentVoterId, setCurrentVoterId] = useState<string | null>(null);

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
    setCurrentVoterId(voterId);
    setModalOpen(true);
  };

  const handleSubmitVote = (selectedOption: string) => {
    if (currentVoterId) {
      setVoters(voters.map(voter => 
        voter.id === currentVoterId 
          ? { ...voter, hasVoted: true }
          : voter
      ));
      setVotes(prev => ({
        ...prev,
        [selectedOption]: (prev[selectedOption] || 0) + 1,
      }));
    }
    setModalOpen(false);
    setCurrentVoterId(null);
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
        />
      </div>

      <VotingModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setCurrentVoterId(null);
        }}
        question="What is a favorite food?"
        options={votingOptions}
        onSubmit={handleSubmitVote}
      />
    </div>
  );
}
