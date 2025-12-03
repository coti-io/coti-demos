import { useState } from 'react';
import styled from 'styled-components';
import { ButtonAction } from './Button';
import {
    InfoBox,
    InfoTitle,
    InfoText,
    List,
    ListItem,
    Link
} from './styles';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.card.default};
  border-radius: 24px;
  padding: 40px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  ${({ theme }) => theme.mediaQueries.small} {
    padding: 30px 20px;
    max-height: 95vh;
  }
`;

const ModalTitle = styled.h2`
  color: ${props => props.theme.colors.text.default};
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;

  ${({ theme }) => theme.mediaQueries.small} {
    font-size: 2rem;
  }
`;

const ModalSubtitle = styled.p`
  color: ${props => props.theme.colors.text.default};
  font-size: 1.6rem;
  text-align: center;
  margin-bottom: 2rem;
  opacity: 0.9;

  ${({ theme }) => theme.mediaQueries.small} {
    font-size: 1.4rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;
`;

export const IntroModal = ({ isOpen, onClose, auctionAddress, tokenAddress }) => {
    if (!isOpen) return null;

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalTitle>🔨 Private Auction</ModalTitle>
                <ModalSubtitle>Secure Bidding with COTI MPC</ModalSubtitle>

                <InfoBox>
                    <InfoTitle>About This Demo</InfoTitle>
                    <InfoText>
                        This private auction demonstrates COTI's Multi-Party Computation (MPC)
                        capabilities. Bids are encrypted and processed on-chain without revealing
                        individual bid amounts to other participants.
                    </InfoText>

                    <InfoTitle style={{ marginTop: '1.5rem' }}>How It Works</InfoTitle>
                    <List style={{ fontSize: '1.1rem' }}>
                        <ListItem>
                            <strong>Step 1:</strong> Bidders submit encrypted bids using private tokens
                        </ListItem>
                        <ListItem>
                            <strong>Step 2:</strong> All bids remain confidential on-chain
                        </ListItem>
                        <ListItem>
                            <strong>Step 3:</strong> After auction ends, winner can claim the item
                        </ListItem>
                        <ListItem>
                            <strong>Step 4:</strong> Losers can withdraw their bids
                        </ListItem>
                    </List>

                    <InfoTitle style={{ marginTop: '1.5rem' }}>Key Features</InfoTitle>
                    <InfoText>
                        ✅ Privacy-preserving bidding<br />
                        ✅ Encrypted bid amounts<br />
                        ✅ Automatic highest bid tracking<br />
                        ✅ Secure claim and withdrawal
                    </InfoText>
                </InfoBox>

                <ButtonContainer>
                    <ButtonAction
                        text="Got it! Let's start bidding →"
                        onClick={onClose}
                        fullWidth={false}
                    />
                </ButtonContainer>
            </ModalContent>
        </ModalOverlay>
    );
};
