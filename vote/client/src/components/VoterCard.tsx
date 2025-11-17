import { Check } from "lucide-react";

interface VoterCardProps {
  name: string;
  voterId: string;
  hasVoted: boolean;
  transactionHash?: string;
  encryptedVote?: string;
  onVoteClick: () => void;
  isElectionOpen?: boolean;
}

export default function VoterCard({ name, voterId, hasVoted, transactionHash, encryptedVote, onVoteClick, isElectionOpen = true }: VoterCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        padding: '1rem',
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        width: '100%'
      }}
    >
      <div style={{ flex: '1', minWidth: '0', maxWidth: 'calc(100% - 100px)' }}>
        <h3 style={{ fontWeight: '600', color: '#333', marginBottom: '0.25rem' }} data-testid={`text-voter-name-${voterId}`}>
          {name}
        </h3>
        <a
          href={`https://testnet.cotiscan.io/address/${voterId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.875rem',
            color: '#666',
            fontFamily: 'monospace',
            display: 'block',
            textDecoration: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#0066cc';
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#666';
            e.currentTarget.style.textDecoration = 'none';
          }}
          data-testid={`text-voter-id-${voterId}`}
        >
          {voterId}
        </a>
        {transactionHash && (
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <a
              href={`https://testnet.cotiscan.io/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.75rem',
                color: '#0066cc',
                fontFamily: 'monospace',
                display: 'block',
                textDecoration: 'none',
                wordBreak: 'break-all'
              }}
              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              data-testid={`link-tx-${voterId}`}
            >
              Tx: {transactionHash}
            </a>
            {encryptedVote && (
              <div style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                Encrypted Vote: {encryptedVote} 🔒
              </div>
            )}
          </div>
        )}
      </div>
      {hasVoted ? (
        <button
          disabled
          className="btn"
          style={{
            background: '#6c757d',
            color: 'white',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            width: 'auto'
          }}
          data-testid={`button-voted-${voterId}`}
        >
          <Check style={{ width: '1rem', height: '1rem' }} />
          Voted
        </button>
      ) : (
        <button
          onClick={onVoteClick}
          disabled={!isElectionOpen}
          className="btn btn-primary"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            width: 'auto',
            opacity: isElectionOpen ? 1 : 0.5,
            cursor: isElectionOpen ? 'pointer' : 'not-allowed'
          }}
          data-testid={`button-vote-${voterId}`}
        >
          Vote
        </button>
      )}
    </div>
  );
}
