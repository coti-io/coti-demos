import styled from 'styled-components';
import { ButtonAction } from './Button';

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
`;

const ModalContainer = styled.div`
    background: ${props => props.theme.colors.card.default};
    border-radius: 24px;
    padding: 2rem;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: ${props => props.theme.shadows.default};
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.h2`
    color: ${props => props.theme.colors.text.default};
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    text-align: center;
`;

const FormGroup = styled.div`
    margin-bottom: 1.5rem;
`;

const FormLabel = styled.label`
    display: block;
    color: ${props => props.theme.colors.text.default};
    font-size: 1.2rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
`;

const FormInput = styled.input`
    width: 100%;
    padding: 1rem;
    font-size: 1.2rem;
    border: 2px solid ${props => props.theme.colors.secondary.default20};
    border-radius: 8px;
    background-color: ${props => props.theme.colors.background.default};
    color: ${props => props.theme.colors.text.default};
    font-family: ${props => props.theme.fonts.default};
    transition: border-color 0.2s ease-in-out;

    &:focus {
        outline: none;
        border-color: ${props => props.theme.colors.primary.default};
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
`;

export function BidModal({ isOpen, onClose, bidAmount, setBidAmount, onSubmit, loading }) {
    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && bidAmount && parseFloat(bidAmount) > 0 && !loading) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ModalTitle>Place Your Bid</ModalTitle>

                <FormGroup>
                    <FormLabel>Bid Amount (Tokens)</FormLabel>
                    <FormInput
                        type="number"
                        placeholder="Enter bid amount"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                        min="0"
                        step="1"
                        autoFocus
                        required
                    />
                </FormGroup>

                <ButtonGroup>
                    <ButtonAction
                        text={loading ? 'Placing Bid...' : 'Submit Bid'}
                        onClick={handleSubmit}
                        disabled={loading || !bidAmount || parseFloat(bidAmount) <= 0}
                        fullWidth
                    />
                    <ButtonAction
                        text="Cancel"
                        onClick={onClose}
                        disabled={loading}
                        fullWidth
                    />
                </ButtonGroup>
            </ModalContainer>
        </ModalOverlay>
    );
}
