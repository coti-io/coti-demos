import { ethers } from 'ethers';
import { Wallet } from '@coti-io/coti-ethers';
import PrivateAuctionArtifact from '../../artifacts/contracts/PrivateAuction.sol/PrivateAuction.json';
import MyTokenArtifact from '../../artifacts/contracts/MyToken.sol/MyToken.json';

/**
 * Deploy contracts to COTI testnet
 * @param {string} privateKey - Deployer private key
 * @param {string} aesKey - Deployer AES key
 * @param {string} rpcUrl - RPC URL
 * @returns {Promise<{auctionAddress: string, tokenAddress: string, txHashes: {token: string, auction: string}}>}
 */
export async function deployContracts(privateKey, aesKey, rpcUrl = 'https://testnet.coti.io/rpc') {
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    wallet.setUserOnboardInfo({ aesKey });

    // Deploy MyToken contract
    const TokenFactory = new ethers.ContractFactory(
        MyTokenArtifact.abi,
        MyTokenArtifact.bytecode,
        wallet
    );

    console.log('Deploying MyToken contract...');
    const tokenContract = await TokenFactory.deploy({
        gasLimit: 10000000
    });
    await tokenContract.waitForDeployment();
    const tokenAddress = await tokenContract.getAddress();
    const tokenTxHash = tokenContract.deploymentTransaction().hash;

    console.log(`MyToken deployed to: ${tokenAddress}`);
    console.log(`Token deployment tx: ${tokenTxHash}`);

    // Deploy PrivateAuction contract
    const AuctionFactory = new ethers.ContractFactory(
        PrivateAuctionArtifact.abi,
        PrivateAuctionArtifact.bytecode,
        wallet
    );

    // Auction duration: 1 hour (3600 seconds)
    const biddingTime = 3600;

    console.log('Deploying PrivateAuction contract...');
    const auctionContract = await AuctionFactory.deploy(
        tokenAddress,
        wallet.address,
        biddingTime,
        {
            gasLimit: 10000000
        }
    );
    await auctionContract.waitForDeployment();
    const auctionAddress = await auctionContract.getAddress();
    const auctionTxHash = auctionContract.deploymentTransaction().hash;

    console.log(`PrivateAuction deployed to: ${auctionAddress}`);
    console.log(`Auction deployment tx: ${auctionTxHash}`);

    return {
        tokenAddress,
        auctionAddress,
        txHashes: {
            token: tokenTxHash,
            auction: auctionTxHash
        }
    };
}

/**
 * Update .env file with new contract addresses
 * Note: This only works if you have a backend to write files.
 * For browser-only apps, you'll need to display the addresses for manual update.
 */
export function displayDeploymentInfo(deploymentResult) {
    const { tokenAddress, auctionAddress, txHashes } = deploymentResult;

    return {
        message: 'Contracts deployed successfully!',
        instructions: `
Please update your .env file with the following values:

VITE_TOKEN_ADDRESS=${tokenAddress}
VITE_AUCTION_ADDRESS=${auctionAddress}

Token Deployment TX: https://testnet.cotiscan.io/tx/${txHashes.token}
Auction Deployment TX: https://testnet.cotiscan.io/tx/${txHashes.auction}

After updating the .env file, restart the development server.
        `.trim(),
        addresses: {
            tokenAddress,
            auctionAddress
        },
        txHashes
    };
}
