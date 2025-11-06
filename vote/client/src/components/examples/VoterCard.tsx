import VoterCard from '../VoterCard';

export default function VoterCardExample() {
  return (
    <div className="space-y-4">
      <VoterCard 
        name="Alice"
        voterId="0xAbc...123"
        hasVoted={false}
        onVoteClick={() => console.log('Vote clicked for Alice')}
      />
      <VoterCard 
        name="Bob"
        voterId="0xDef...456"
        hasVoted={true}
        onVoteClick={() => console.log('Vote clicked for Bob')}
      />
    </div>
  );
}
