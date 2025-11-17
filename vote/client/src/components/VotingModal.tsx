import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface VotingOption {
  id: string;
  label: string;
}

interface VotingModalProps {
  open: boolean;
  onClose: () => void;
  question: string;
  options: VotingOption[];
  onSubmit: (selectedOption: string) => void;
}

export default function VotingModal({
  open,
  onClose,
  question,
  options,
  onSubmit,
}: VotingModalProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");

  const handleSubmit = () => {
    if (selectedOption) {
      onSubmit(selectedOption);
      setSelectedOption("");
    }
  };

  const handleCancel = () => {
    setSelectedOption("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`sm:max-w-lg${options.length === 0 ? ' voting-closed-bg' : ''}`}
        data-testid="modal-voting"
        id={options.length === 0 ? "voting-closed-content" : undefined}
        overlayClassName={options.length === 0 ? "voting-closed-overlay" : undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-xl" data-testid="text-question">
            {question}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
            <div className="space-y-4">
              {options.map((option) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <RadioGroupItem 
                    value={option.id} 
                    id={option.id}
                    data-testid={`radio-option-${option.id}`}
                  />
                  <Label 
                    htmlFor={option.id} 
                    className="flex-1 cursor-pointer text-base font-normal"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={options.length > 0 ? !selectedOption : false}
            data-testid="button-submit-vote"
            style={options.length === 0 ? { background: 'white', color: '#333', border: '1px solid #ccc' } : {}}
          >
            {options.length === 0 ? 'Open Election' : 'Submit Vote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
