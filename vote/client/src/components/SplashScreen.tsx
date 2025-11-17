interface SplashScreenProps {
  onClose: () => void;
}

export default function SplashScreen({ onClose }: SplashScreenProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          maxWidth: '48rem',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#007bff' }}>
              Welcome to the COTI Private Voting Demo
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#666' }}>
              This application demonstrates a secure and truly confidential voting system built on the COTI Testnet.
            </p>
            <p style={{ fontSize: '1rem', color: '#666' }}>
              It showcases how votes can be cast, collected, and tallied while ensuring individual choices remain completely private from end to end.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>How It Works</h2>

            <p style={{ color: '#666' }}>
              The interface is split into two key areas: the <strong>Voter List</strong> on the left, showing all eligible participants, and the <strong>Voting Results</strong> on the right, which displays the final aggregated tally.
            </p>

            <p style={{ color: '#666' }}>
              The confidentiality of the vote is protected by a unique three-step process:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#007bff' }}>1. Encrypted Voting</h3>
                <p style={{ color: '#666' }}>
                  Each voter casts their ballot. The vote is then encrypted using the voter's own individual AES key. This ensures the choice is secure and unreadable on the blockchain.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#007bff' }}>2. Confidential Tally</h3>
                <p style={{ color: '#666' }}>
                  A designated contract owner (holding a special "OffboardKey") is the only entity with the permission to decrypt the votes. This key grants them the unique ability to access all the individual encrypted ballots.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#007bff' }}>3. Final Results</h3>
                <p style={{ color: '#666' }}>
                  The contract owner decrypts and sums the votes to produce the final, aggregated tally. This final result is then published publicly in the "Voting Results" panel, showing the poll's outcome without ever revealing how any specific individual voted.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem' }}>
            <button
              onClick={onClose}
              className="btn btn-primary"
              style={{ padding: '0.75rem 3rem', fontSize: '1rem' }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
