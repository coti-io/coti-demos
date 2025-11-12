import { useState, useEffect } from "react";
import VoterCard from "@/components/VoterCard";
import VotingModal from "@/components/VotingModal";
import ResultsChart from "@/components/ResultsChart";
import ElectionControls from "@/components/ElectionControls";
import SplashScreen from "@/components/SplashScreen";
import { Card } from "@/components/ui/card";
import { useVotingContract } from "@/hooks/useVotingContract";
import { useToast } from "@/hooks/use-toast";

interface Voter {
  id: string;
  name: string;
  voterId: string;
  hasVoted: boolean;
  transactionHash?: string;
  encryptedVote?: string;
}

interface VotingOption {
  id: string;
  label: string;
  color: string;
}

export default function VotingApp() {
  const { voters: contractVoters, castVote, contractAddress, getElectionStatus, getResults, toggleElection, countVotesCast } = useVotingContract();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isTogglingElection, setIsTogglingElection] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Load voters from environment variables (excluding Alice who is the contract owner)
  const [voters, setVoters] = useState<Voter[]>(() => {
    const voterAccounts = [
      { 
        name: "Bob", 
        address: import.meta.env.VITE_BOB_ADDRESS,
        pk: import.meta.env.VITE_BOB_PK,
        aesKey: import.meta.env.VITE_BOB_AES_KEY
      },
      { 
        name: "Bea", 
        address: import.meta.env.VITE_BEA_ADDRESS,
        pk: import.meta.env.VITE_BEA_PK,
        aesKey: import.meta.env.VITE_BEA_AES_KEY
      },
      { 
        name: "Charlie", 
        address: import.meta.env.VITE_CHARLIE_ADDRESS,
        pk: import.meta.env.VITE_CHARLIE_PK,
        aesKey: import.meta.env.VITE_CHARLIE_AES_KEY
      },
      { 
        name: "David", 
        address: import.meta.env.VITE_DAVID_ADDRESS,
        pk: import.meta.env.VITE_DAVID_PK,
        aesKey: import.meta.env.VITE_DAVID_AES_KEY
      },
      { 
        name: "Ethan", 
        address: import.meta.env.VITE_ETHAN_ADDRESS,
        pk: import.meta.env.VITE_ETHAN_PK,
        aesKey: import.meta.env.VITE_ETHAN_AES_KEY
      },
    ];

    return voterAccounts
      .filter(account => account.pk && account.aesKey && account.address) // Only include if all required fields exist
      .map((account, index) => ({
        id: (index + 1).toString(),
        name: account.name,
        voterId: account.address || "0x...",
        hasVoted: false,
      }));
  });

  const [isElectionOpen, setIsElectionOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentVoterId, setCurrentVoterId] = useState<string | null>(null);
  const [currentVoterName, setCurrentVoterName] = useState<string | null>(null);
  const [toggleTransactionHash, setToggleTransactionHash] = useState<string | null>(null);
  const [resultsTransactionHash, setResultsTransactionHash] = useState<string | null>(null);

  const votingOptions: VotingOption[] = [
    { id: "chocolate", label: "Chocolate", color: "#8B6914" },
    { id: "raspberry", label: "Raspberry", color: "#E74C3C" },
    { id: "sandwich", label: "Sandwich", color: "#F39C12" },
    { id: "mango", label: "Mango", color: "#7BC143" },
  ];

  // Real vote counts from contract
  const [votes, setVotes] = useState<Record<string, number>>({
    chocolate: 0,
    raspberry: 0,
    sandwich: 0,
    mango: 0,
  });

  // Fetch election status and results
  useEffect(() => {
    const fetchElectionData = async () => {
      // Fetch election status
      const status = await getElectionStatus();
      if (status) {
        const wasOpen = isElectionOpen;
        setIsElectionOpen(status.isOpen);
        
        // Only fetch results if election just closed (transition from open to closed)
        // and we don't already have results
        if (!status.isOpen && wasOpen && !resultsTransactionHash) {
          await handleFetchResults();
        } else if (status.isOpen) {
          // Reset votes and results when election is open
          setVotes({
            chocolate: 0,
            raspberry: 0,
            sandwich: 0,
            mango: 0,
          });
          setResultsTransactionHash(null);
        }
      }
    };

    fetchElectionData();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchElectionData, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isElectionOpen, resultsTransactionHash]);

  const handleVoteClick = (voterId: string) => {
    if (!isElectionOpen) {
      toast({
        title: "Voting is Closed",
        description: "Please open the voting session to cast votes.",
        variant: "destructive",
      });
      return;
    }
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
      const result = await castVote(currentVoterName, voteValue);

      // Update local state
      setVoters(voters.map(voter => 
        voter.id === currentVoterId 
          ? { 
              ...voter, 
              hasVoted: true, 
              transactionHash: result.receipt.hash,
              encryptedVote: result.encryptedVote
            }
          : voter
      ));

      toast({
        title: "Vote Cast Successfully!",
        description: `Transaction: ${result.receipt.hash.slice(0, 10)}...${result.receipt.hash.slice(-8)}`,
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

  const handleFetchResults = async () => {
    setIsLoadingResults(true);
    try {
      toast({
        title: "Fetching Results",
        description: "Aggregating and decrypting votes...",
      });

      const resultsData = await getResults();
      if (resultsData) {
        const newVotes: Record<string, number> = {
          chocolate: 0,
          raspberry: 0,
          sandwich: 0,
          mango: 0,
        };

        resultsData.results.forEach(result => {
          const optionId = votingOptions.find(opt => opt.label === result.optionLabel)?.id;
          if (optionId) {
            newVotes[optionId] = result.voteCount;
          }
        });

        setVotes(newVotes);
        setResultsTransactionHash(resultsData.transactionHash);

        toast({
          title: "Results Fetched",
          description: `Transaction: ${resultsData.transactionHash.slice(0, 10)}...${resultsData.transactionHash.slice(-8)}`,
        });
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      toast({
        title: "Fetch Failed",
        description: error instanceof Error ? error.message : "Failed to fetch results",
        variant: "destructive",
      });
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleToggleElection = async () => {
    // If closing the election, check if any votes were cast (optional check)
    if (isElectionOpen) {
      try {
        const voteCount = await countVotesCast();
        if (voteCount === 0) {
          toast({
            title: "No Votes Cast",
            description: "Please cast at least one vote before closing the election. Click on a voter card to vote.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        // If count fails, let the contract handle validation
        console.log('Could not count votes, proceeding with toggle:', error);
      }
    }

    setIsTogglingElection(true);
    try {
      toast({
        title: isElectionOpen ? "Closing Election" : "Opening Election",
        description: "Sending transaction to blockchain...",
      });

      const receipt = await toggleElection();

      // Store the transaction hash
      setToggleTransactionHash(receipt.hash);

      // Fetch updated status
      const status = await getElectionStatus();
      if (status) {
        setIsElectionOpen(status.isOpen);
      }

      toast({
        title: isElectionOpen ? "Election Closed" : "Election Opened",
        description: `Transaction: ${receipt.hash.slice(0, 10)}...${receipt.hash.slice(-8)}`,
      });

      // If election was just closed, fetch results automatically
      if (!status?.isOpen) {
        await handleFetchResults();
      }
    } catch (error) {
      console.error("Error toggling election:", error);
      toast({
        title: "Toggle Failed",
        description: error instanceof Error ? error.message : "Failed to toggle election",
        variant: "destructive",
      });
    } finally {
      setIsTogglingElection(false);
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
    <>
      {showSplash && <SplashScreen onClose={() => setShowSplash(false)} />}
      
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
                    transactionHash={voter.transactionHash}
                    encryptedVote={voter.encryptedVote}
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
          onOpenElection={handleToggleElection}
          onCloseElection={handleToggleElection}
          onFetchResults={handleFetchResults}
          contractAddress={contractAddress}
          isToggling={isTogglingElection}
          isFetchingResults={isLoadingResults}
          toggleTransactionHash={toggleTransactionHash}
          resultsTransactionHash={resultsTransactionHash}
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
    </>
  );
}
