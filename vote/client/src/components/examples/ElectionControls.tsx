import { useState } from 'react';
import ElectionControls from '../ElectionControls';

export default function ElectionControlsExample() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <ElectionControls
      isElectionOpen={isOpen}
      onOpenElection={() => {
        console.log('Opening election');
        setIsOpen(true);
      }}
      onCloseElection={() => {
        console.log('Closing election');
        setIsOpen(false);
      }}
    />
  );
}
