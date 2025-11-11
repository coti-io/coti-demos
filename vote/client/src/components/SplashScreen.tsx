import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SplashScreenProps {
  onClose: () => void;
}

export default function SplashScreen({ onClose }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary">
              Welcome to the COTI Private Voting Demo
            </h1>
            <p className="text-lg text-muted-foreground">
              This application demonstrates a secure and truly confidential voting system built on the COTI Testnet.
            </p>
            <p className="text-base text-muted-foreground">
              It showcases how votes can be cast, collected, and tallied while ensuring individual choices remain completely private from end to end.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">How It Works</h2>
            
            <p className="text-muted-foreground">
              The interface is split into two key areas: the <strong>Voter List</strong> on the left, showing all eligible participants, and the <strong>Voting Results</strong> on the right, which displays the final aggregated tally.
            </p>

            <p className="text-muted-foreground">
              The confidentiality of the vote is protected by a unique three-step process:
            </p>

            <div className="space-y-4 pl-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary">1. Encrypted Voting</h3>
                <p className="text-muted-foreground">
                  Each voter casts their ballot. The vote is then encrypted using the voter's own individual AES key. This ensures the choice is secure and unreadable on the blockchain.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary">2. Confidential Tally</h3>
                <p className="text-muted-foreground">
                  A designated contract owner (holding a special "OffboardKey") is the only entity with the permission to decrypt the votes. This key grants them the unique ability to access all the individual encrypted ballots.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary">3. Final Results</h3>
                <p className="text-muted-foreground">
                  The contract owner decrypts and sums the votes to produce the final, aggregated tally. This final result is then published publicly in the "Voting Results" panel, showing the poll's outcome without ever revealing how any specific individual voted.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button 
              onClick={onClose}
              size="lg"
              className="px-12"
            >
              OK
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
