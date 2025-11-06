import { useState } from 'react';
import VotingModal from '../VotingModal';
import { Button } from '@/components/ui/button';

export default function VotingModalExample() {
  const [open, setOpen] = useState(false);

  const options = [
    { id: 'chocolate', label: 'Chocolate' },
    { id: 'raspberry', label: 'Raspberry' },
    { id: 'sandwich', label: 'Sandwich' },
  ];

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Voting Modal</Button>
      <VotingModal
        open={open}
        onClose={() => setOpen(false)}
        question="What is a favorite food?"
        options={options}
        onSubmit={(option) => {
          console.log('Voted for:', option);
          setOpen(false);
        }}
      />
    </div>
  );
}
