interface ElectionControlsProps {
  contractAddress?: string;
  toggleTransactionHash?: string | null;
  toggleTransactionLabel?: string;
  resultsTransactionHash?: string | null;
}

export default function ElectionControls({
  contractAddress,
  toggleTransactionHash,
  toggleTransactionLabel = "Toggle Election",
  resultsTransactionHash,
}: ElectionControlsProps) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div
        style={{
          textAlign: 'left',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          fontSize: '0.875rem'
        }}
      >
        {contractAddress && (
          <>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '600', color: '#555' }}>Contract: </span>
              <a
                href={`https://testnet.cotiscan.io/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#0066cc',
                  textDecoration: 'none',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                {contractAddress}
              </a>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <a
                href="https://github.com/coti-io/coti-contracts-examples/blob/main/contracts/PrivateVoting.sol"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#0066cc', textDecoration: 'none' }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                📄 Contract Source Code
              </a>
            </div>
          </>
        )}
        {(toggleTransactionHash || resultsTransactionHash) && (
          <div style={{ fontWeight: '600', marginTop: '0.75rem', marginBottom: '0.5rem', color: '#555' }}>
            Transactions:
          </div>
        )}
        {toggleTransactionHash && (
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: '600', color: '#555' }}>{toggleTransactionLabel}: </span>
            <a
              href={`https://testnet.cotiscan.io/tx/${toggleTransactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#0066cc',
                textDecoration: 'none',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                wordBreak: 'break-all'
              }}
              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              {toggleTransactionHash}
            </a>
          </div>
        )}
        {resultsTransactionHash && (
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: '600', color: '#555' }}>Fetch Results: </span>
            <a
              href={`https://testnet.cotiscan.io/tx/${resultsTransactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#0066cc',
                textDecoration: 'none',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                wordBreak: 'break-all'
              }}
              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              {resultsTransactionHash}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
