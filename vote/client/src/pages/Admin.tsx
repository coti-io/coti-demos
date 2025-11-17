import { useState } from "react";
import { Trash2 } from "lucide-react";

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
    <div className="app">
      <h1 className="title">Admin Panel</h1>

      <div className="cards-container" style={{ width: '100%', maxWidth: '1400px' }}>
        {/* Voter Management */}
        <div className="card" style={{ maxWidth: '600px', flex: '1' }}>
          <h2 className="card-title" data-testid="text-voter-management-title">
            Manage Voters
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="voter-name">Voter Name</label>
              <input
                id="voter-name"
                className="form-input"
                value={newVoterName}
                onChange={(e) => setNewVoterName(e.target.value)}
                placeholder="Enter voter name"
                data-testid="input-voter-name"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="voter-address">Voter Address (0x...)</label>
              <input
                id="voter-address"
                className="form-input"
                value={newVoterAddress}
                onChange={(e) => setNewVoterAddress(e.target.value)}
                placeholder="0x..."
                data-testid="input-voter-address"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="voter-pk">PK</label>
              <input
                id="voter-pk"
                className="form-input"
                type="password"
                value={newVoterPK}
                onChange={(e) => setNewVoterPK(e.target.value)}
                placeholder="Enter private key"
                data-testid="input-voter-pk"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="voter-aes">AES Key</label>
              <input
                id="voter-aes"
                className="form-input"
                type="password"
                value={newVoterAESKey}
                onChange={(e) => setNewVoterAESKey(e.target.value)}
                placeholder="Enter AES key"
                data-testid="input-voter-aes"
              />
            </div>
            <button
              onClick={handleAddVoter}
              className="btn btn-success"
              style={{ width: '100%' }}
              data-testid="button-add-voter"
            >
              Add Voter
            </button>
          </div>

          <div>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Current Voters ({voters.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {voters.map((voter) => (
                <div
                  key={voter.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px'
                  }}
                  data-testid={`voter-item-${voter.id}`}
                >
                  <div style={{ flex: '1', minWidth: '0' }}>
                    <p style={{ fontWeight: '500' }}>{voter.name}</p>
                    <p style={{ fontSize: '0.875rem', color: '#666', fontFamily: 'monospace' }}>
                      Address: {voter.address}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#666', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      PK: {voter.pk}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#666', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      AES: {voter.aesKey}
                    </p>
                  </div>
                  <button
                    className="btn"
                    style={{
                      background: 'linear-gradient(135deg, #dc3545, #c82333)',
                      color: 'white',
                      padding: '0.5rem',
                      width: 'auto',
                      minWidth: 'auto',
                      flexShrink: 0,
                      marginLeft: '0.75rem'
                    }}
                    onClick={() => handleRemoveVoter(voter.id)}
                    data-testid={`button-remove-voter-${voter.id}`}
                  >
                    <Trash2 style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quiz Management */}
        <div className="card" style={{ maxWidth: '600px', flex: '1' }}>
          <h2 className="card-title" data-testid="text-quiz-management-title">
            Manage Quiz
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="quiz-question">Quiz Question</label>
              <input
                id="quiz-question"
                className="form-input"
                value={quizQuestion}
                onChange={(e) => setQuizQuestion(e.target.value)}
                placeholder="Enter quiz question"
                data-testid="input-quiz-question"
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '1.5rem' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Quiz Options</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="option-label">Option Label</label>
                <input
                  id="option-label"
                  className="form-input"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  placeholder="Enter option label"
                  data-testid="input-option-label"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="option-color">Option Color</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="option-color"
                    type="color"
                    value={newOptionColor}
                    onChange={(e) => setNewOptionColor(e.target.value)}
                    style={{ width: '5rem', height: '2.5rem', border: '2px solid #e1e5e9', borderRadius: '8px' }}
                    data-testid="input-option-color"
                  />
                  <input
                    className="form-input"
                    value={newOptionColor}
                    onChange={(e) => setNewOptionColor(e.target.value)}
                    placeholder="#3B82F6"
                    style={{ flex: '1' }}
                  />
                </div>
              </div>
              <button
                onClick={handleAddOption}
                className="btn btn-success"
                style={{ width: '100%' }}
                data-testid="button-add-option"
              >
                Add Option
              </button>
            </div>

            <div>
              <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Current Options ({quizOptions.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {quizOptions.map((option) => (
                  <div
                    key={option.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      background: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px'
                    }}
                    data-testid={`option-item-${option.id}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '1.5rem',
                          height: '1.5rem',
                          borderRadius: '4px',
                          backgroundColor: option.color
                        }}
                      />
                      <span style={{ fontWeight: '500' }}>{option.label}</span>
                      <span style={{ fontSize: '0.875rem', color: '#666', fontFamily: 'monospace' }}>
                        {option.color}
                      </span>
                    </div>
                    <button
                      className="btn"
                      style={{
                        background: 'linear-gradient(135deg, #dc3545, #c82333)',
                        color: 'white',
                        padding: '0.5rem',
                        width: 'auto',
                        minWidth: 'auto'
                      }}
                      onClick={() => handleRemoveOption(option.id)}
                      data-testid={`button-remove-option-${option.id}`}
                    >
                      <Trash2 style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
