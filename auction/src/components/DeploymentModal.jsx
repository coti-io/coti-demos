import styled, { keyframes } from 'styled-components';

const spin = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
`;

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(10px);
`;

const ModalContent = styled.div`
    background: linear-gradient(135deg, rgba(30, 41, 246, 0.1), rgba(138, 43, 226, 0.1));
    border: 2px solid rgba(30, 41, 246, 0.3);
    border-radius: 20px;
    padding: 3rem;
    max-width: 600px;
    width: 90%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const Title = styled.h2`
    color: white;
    font-size: 2.5rem;
    font-weight: bold;
    margin: 0 0 1rem 0;
`;

const Subtitle = styled.p`
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.2rem;
    margin: 0 0 2rem 0;
    line-height: 1.6;
`;

const SpinnerContainer = styled.div`
    display: flex;
    justify-content: center;
    margin: 2rem 0;
`;

const Spinner = styled.div`
    width: 80px;
    height: 80px;
    border: 8px solid rgba(30, 41, 246, 0.2);
    border-top: 8px solid #1E29F6;
    border-radius: 50%;
    animation: ${spin} 1s linear infinite;
`;

const StatusText = styled.div`
    color: ${props => {
        if (props.$variant === 'success') return '#4ade80';
        if (props.$variant === 'error') return '#f87171';
        return 'rgba(255, 255, 255, 0.9)';
    }};
    font-size: 1.1rem;
    margin: 1rem 0;
    line-height: 1.8;

    a {
        color: inherit;
        text-decoration: underline;

        &:hover {
            opacity: 0.8;
        }
    }

    small {
        display: block;
        margin-top: 0.5rem;
        font-size: 0.95em;
        opacity: 0.9;
    }
`;

const StepsList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 2rem 0;
    text-align: left;
`;

const StepItem = styled.li`
    color: ${props => {
        if (props.$completed) return '#4ade80';
        if (props.$active) return 'white';
        return 'rgba(255, 255, 255, 0.4)';
    }};
    font-size: 1.1rem;
    padding: 0.75rem 0;
    display: flex;
    align-items: center;
    gap: 1rem;

    &::before {
        content: '${props => {
            if (props.$completed) return '✓';
            if (props.$active) return '⋯';
            return '○';
        }}';
        font-size: 1.5rem;
        font-weight: bold;
        width: 30px;
        text-align: center;
    }
`;

const WarningText = styled.div`
    background-color: rgba(251, 146, 60, 0.1);
    border: 1px solid rgba(251, 146, 60, 0.3);
    border-radius: 12px;
    padding: 1.5rem;
    margin: 2rem 0;
    color: #fb923c;
    font-size: 1rem;
    line-height: 1.6;
`;

export function DeploymentModal({ isOpen, status, variant = 'info', currentStep = 0 }) {
    if (!isOpen) return null;

    const steps = [
        'Preparing deployment',
        'Deploying Token contract',
        'Deploying Auction contract',
        'Verifying contracts',
        'Saving addresses'
    ];

    const isDeploying = variant === 'info' || variant === 'loading';
    const isSuccess = variant === 'success';
    const isError = variant === 'error';

    return (
        <ModalOverlay>
            <ModalContent>
                {isDeploying && (
                    <>
                        <Title>🚀 Deploying Contracts</Title>
                        <Subtitle>
                            Please wait while we deploy fresh contracts to the blockchain.
                            This process may take a few minutes.
                        </Subtitle>

                        <SpinnerContainer>
                            <Spinner />
                        </SpinnerContainer>

                        <StepsList>
                            {steps.map((step, index) => (
                                <StepItem
                                    key={index}
                                    $completed={index < currentStep}
                                    $active={index === currentStep}
                                >
                                    {step}
                                </StepItem>
                            ))}
                        </StepsList>

                        <WarningText>
                            ⚠️ Do not close this window or refresh the page during deployment.
                            All bidders will need to place their bids again after deployment completes.
                        </WarningText>
                    </>
                )}

                {isSuccess && (
                    <>
                        <Title>✅ Deployment Complete!</Title>
                        <Subtitle>
                            Contracts have been successfully deployed to the COTI testnet.
                        </Subtitle>
                        <StatusText $variant="success">
                            {status}
                        </StatusText>
                    </>
                )}

                {isError && (
                    <>
                        <Title>❌ Deployment Failed</Title>
                        <Subtitle>
                            An error occurred during contract deployment.
                        </Subtitle>
                        <StatusText $variant="error">
                            {status}
                        </StatusText>
                    </>
                )}

                {status && !isSuccess && !isError && (
                    <StatusText $variant={variant}>
                        {status}
                    </StatusText>
                )}
            </ModalContent>
        </ModalOverlay>
    );
}
