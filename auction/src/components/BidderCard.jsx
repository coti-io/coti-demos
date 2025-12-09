import { useState } from 'react';
import styled from 'styled-components';
import { Card, ContentTitle, StatusMessage } from './styles';

const InfoSection = styled.div`
  background-color: ${props => props.theme.colors.secondary.default10};
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.secondary.default20};

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.875rem;
  font-weight: 500;
`;

const InfoValue = styled.span`
  color: ${props => props.$active !== undefined
        ? (props.$active ? props.theme.colors.success : props.theme.colors.error)
        : props.theme.colors.text.default};
  font-size: 0.875rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
`;

const SmallButton = styled.button`
  background-color: #1E29F6;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-family: ${({ theme }) => theme.fonts.default};
  font-size: 0.875rem;
  font-weight: 500;
  color: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background-color: rgba(30, 41, 246, 0.8);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    background-color: rgba(30, 41, 246, 0.8);
  }
`;

const SmallButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${props => props.theme.colors.secondary.default20};
`;

const TokenBalanceRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.secondary.default20};
`;

const TransactionDivider = styled.div`
  border-top: 1px solid ${props => props.theme.colors.secondary.default20};
  margin: 1rem 0 0.5rem 0;
`;

const TransactionTitle = styled.div`
  color: ${props => props.theme.colors.text.default};
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  padding-top: 0.5rem;
`;

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
`;

const TransactionItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background-color: ${props => props.theme.colors.background.default};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.secondary.default20};
`;

const TransactionType = styled.div`
  color: ${props => props.theme.colors.text.default};
  font-size: 0.75rem;
  font-weight: 600;
`;

const TransactionLink = styled.a`
  color: ${props => props.theme.colors.primary.default};
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  text-decoration: none;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.7;
    text-decoration: underline;
  }
`;

const TransactionTime = styled.div`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.7rem;
  font-style: italic;
`;

export const BidderCard = ({
    name,
    walletAddress,
    tokenBalance,
    transactions,
    loading,
    status,
    statusVariant,
    onPlaceBid,
    onWithdraw,
    onCheckBid,
    onGetTokens
}) => {
    return (
        <Card $maxWidth="500px">
            <ContentTitle>{name}</ContentTitle>

            {walletAddress && (
                <InfoSection>
                    <InfoRow>
                        <InfoLabel>Wallet:</InfoLabel>
                        <InfoValue>{walletAddress}</InfoValue>
                    </InfoRow>
                    <TokenBalanceRow>
                        <InfoLabel>Token Balance:</InfoLabel>
                        <InfoValue>{tokenBalance} MTK</InfoValue>
                        <SmallButton
                            onClick={onGetTokens}
                            disabled={loading}
                        >
                            Get Tokens
                        </SmallButton>
                    </TokenBalanceRow>
                    <InfoRow>
                        <InfoLabel>Total Bids:</InfoLabel>
                        <InfoValue>{transactions.filter(tx => tx.type === 'Bid Placed').length}</InfoValue>
                    </InfoRow>

                    <SmallButtonGroup>
                        <SmallButton
                            onClick={onPlaceBid}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Place'}
                        </SmallButton>
                    </SmallButtonGroup>

                    {transactions.length > 0 && (
                        <>
                            <TransactionDivider />
                            <TransactionTitle>Transactions</TransactionTitle>
                            <TransactionList>
                                {transactions.slice(0, 5).map((tx, index) => (
                                    <TransactionItem key={index}>
                                        <TransactionType>{tx.type}</TransactionType>
                                        <TransactionLink
                                            href={`https://testnet.cotiscan.io/tx/${tx.txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {tx.txHash.substring(0, 10)}...{tx.txHash.substring(tx.txHash.length - 8)}
                                        </TransactionLink>
                                        <TransactionTime>{tx.timestamp}</TransactionTime>
                                    </TransactionItem>
                                ))}
                            </TransactionList>
                        </>
                    )}
                </InfoSection>
            )}

            {status && (
                <StatusMessage $variant={statusVariant}>
                    {status}
                </StatusMessage>
            )}
        </Card>
    );
};
