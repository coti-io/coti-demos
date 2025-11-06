import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";

interface Voter {
  id: string;
  name: string;
  address: string;
  pk: string;
  aesKey: string;
}

interface QuizOption {
  id: string;
  label: string;
  color: string;
}

export default function Admin() {
  // todo: remove mock functionality
  const [voters, setVoters] = useState<Voter[]>([
    { id: "1", name: "Alice", address: "0xAbc...123", pk: "pk_abc123", aesKey: "aes_key_abc123" },
    { id: "2", name: "Bob", address: "0xDef...456", pk: "pk_def456", aesKey: "aes_key_def456" },
    { id: "3", name: "Bob", address: "0xGhi...789", pk: "pk_ghi789", aesKey: "aes_key_ghi789" },
    { id: "4", name: "Charlie", address: "0xJkl...012", pk: "pk_jkl012", aesKey: "aes_key_jkl012" },
    { id: "5", name: "Charlie", address: "0xMno...345", pk: "pk_mno345", aesKey: "aes_key_mno345" },
    { id: "6", name: "Negna", address: "0xPqr...678", pk: "pk_pqr678", aesKey: "aes_key_pqr678" },
  ]);

  const [quizQuestion, setQuizQuestion] = useState("What is a favorite food?");
  const [quizOptions, setQuizOptions] = useState<QuizOption[]>([
    { id: "chocolate", label: "Chocolate", color: "#8B6914" },
    { id: "raspberry", label: "Raspberry", color: "#E74C3C" },
    { id: "sandwich", label: "Sandwich", color: "#F39C12" },
    { id: "mango", label: "Mango", color: "#7BC143" },
  ]);

  const [newVoterName, setNewVoterName] = useState("");
  const [newVoterAddress, setNewVoterAddress] = useState("");
  const [newVoterPK, setNewVoterPK] = useState("");
  const [newVoterAESKey, setNewVoterAESKey] = useState("");
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionColor, setNewOptionColor] = useState("#3B82F6");

  const handleAddVoter = () => {
    if (newVoterName.trim() && newVoterAddress.trim() && newVoterPK.trim() && newVoterAESKey.trim()) {
      const newVoter: Voter = {
        id: Date.now().toString(),
        name: newVoterName.trim(),
        address: newVoterAddress.trim(),
        pk: newVoterPK.trim(),
        aesKey: newVoterAESKey.trim(),
      };
      setVoters([...voters, newVoter]);
      setNewVoterName("");
      setNewVoterAddress("");
      setNewVoterPK("");
      setNewVoterAESKey("");
      console.log("Added voter:", newVoter);
    }
  };

  const handleRemoveVoter = (id: string) => {
    setVoters(voters.filter(voter => voter.id !== id));
    console.log("Removed voter:", id);
  };

  const handleAddOption = () => {
    if (newOptionLabel.trim()) {
      const newOption: QuizOption = {
        id: newOptionLabel.toLowerCase().replace(/\s+/g, '-'),
        label: newOptionLabel.trim(),
        color: newOptionColor,
      };
      setQuizOptions([...quizOptions, newOption]);
      setNewOptionLabel("");
      setNewOptionColor("#3B82F6");
      console.log("Added option:", newOption);
    }
  };

  const handleRemoveOption = (id: string) => {
    setQuizOptions(quizOptions.filter(option => option.id !== id));
    console.log("Removed option:", id);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8" data-testid="text-admin-title">
          Admin Panel
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Voter Management */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6" data-testid="text-voter-management-title">
              Manage Voters
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="voter-name">Voter Name</Label>
                <Input
                  id="voter-name"
                  value={newVoterName}
                  onChange={(e) => setNewVoterName(e.target.value)}
                  placeholder="Enter voter name"
                  data-testid="input-voter-name"
                />
              </div>
              <div>
                <Label htmlFor="voter-address">Voter Address (0x...)</Label>
                <Input
                  id="voter-address"
                  value={newVoterAddress}
                  onChange={(e) => setNewVoterAddress(e.target.value)}
                  placeholder="0x..."
                  data-testid="input-voter-address"
                />
              </div>
              <div>
                <Label htmlFor="voter-pk">PK</Label>
                <Input
                  id="voter-pk"
                  type="password"
                  value={newVoterPK}
                  onChange={(e) => setNewVoterPK(e.target.value)}
                  placeholder="Enter private key"
                  data-testid="input-voter-pk"
                />
              </div>
              <div>
                <Label htmlFor="voter-aes">AES Key</Label>
                <Input
                  id="voter-aes"
                  type="password"
                  value={newVoterAESKey}
                  onChange={(e) => setNewVoterAESKey(e.target.value)}
                  placeholder="Enter AES key"
                  data-testid="input-voter-aes"
                />
              </div>
              <Button 
                onClick={handleAddVoter} 
                className="w-full"
                data-testid="button-add-voter"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Voter
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold mb-3">Current Voters ({voters.length})</h3>
              {voters.map((voter) => (
                <div
                  key={voter.id}
                  className="flex items-center justify-between p-3 bg-card border border-card-border rounded-md"
                  data-testid={`voter-item-${voter.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{voter.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      Address: {voter.address}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono truncate">
                      PK: {voter.pk}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono truncate">
                      AES: {voter.aesKey}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="shrink-0"
                    onClick={() => handleRemoveVoter(voter.id)}
                    data-testid={`button-remove-voter-${voter.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Quiz Management */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6" data-testid="text-quiz-management-title">
              Manage Quiz
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="quiz-question">Quiz Question</Label>
                <Input
                  id="quiz-question"
                  value={quizQuestion}
                  onChange={(e) => setQuizQuestion(e.target.value)}
                  placeholder="Enter quiz question"
                  data-testid="input-quiz-question"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Quiz Options</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="option-label">Option Label</Label>
                  <Input
                    id="option-label"
                    value={newOptionLabel}
                    onChange={(e) => setNewOptionLabel(e.target.value)}
                    placeholder="Enter option label"
                    data-testid="input-option-label"
                  />
                </div>
                <div>
                  <Label htmlFor="option-color">Option Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="option-color"
                      type="color"
                      value={newOptionColor}
                      onChange={(e) => setNewOptionColor(e.target.value)}
                      className="w-20 h-10"
                      data-testid="input-option-color"
                    />
                    <Input
                      value={newOptionColor}
                      onChange={(e) => setNewOptionColor(e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleAddOption} 
                  className="w-full"
                  data-testid="button-add-option"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold mb-3">Current Options ({quizOptions.length})</h3>
                {quizOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-3 bg-card border border-card-border rounded-md"
                    data-testid={`option-item-${option.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: option.color }}
                      />
                      <span className="font-medium">{option.label}</span>
                      <span className="text-sm text-muted-foreground font-mono">
                        {option.color}
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveOption(option.id)}
                      data-testid={`button-remove-option-${option.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
