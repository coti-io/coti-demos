import { ethers } from 'ethers';
import { Wallet } from '@coti-io/coti-ethers';
import PrivateAuctionArtifact from '../../artifacts/contracts/PrivateAuction.sol/PrivateAuction.json';
import MyTokenArtifact from '../../artifacts/contracts/MyToken.sol/MyToken.json';

/**
 * Deploy contracts to COTI testnet
 * @param {string} privateKey - Deployer private key
 * @param {string} aesKey - Deployer AES key
 * @param {string} rpcUrl - RPC URL
 * @param {Function} onProgress - Optional callback for progress updates (step, message)
 * @param {number} biddingTimeMinutes - Auction duration in minutes (default: 60)
 * @param {Array<string>} bidderAddresses - Optional array of bidder addresses to mint tokens for
 * @returns {Promise<{auctionAddress: string, tokenAddress: string, txHashes: {token: string, auction: string}}>}
 */
export async function deployContracts(privateKey, aesKey, rpcUrl = 'https://testnet.coti.io/rpc', onProgress = null, biddingTimeMinutes = 60, bidderAddresses = []) {
    // Create provider and wallet
    if (onProgress) onProgress('preparing', 'Initializing wallet and provider...');
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
    if (onProgress) onProgress('token', 'Deploying Token contract...');

    const tokenContract = await TokenFactory.deploy({
        gasLimit: 10000000
    });

    if (onProgress) onProgress('token', 'Waiting for Token deployment confirmation...');
    await tokenContract.waitForDeployment();
    const tokenAddress = await tokenContract.getAddress();
    const tokenTxHash = tokenContract.deploymentTransaction().hash;

    console.log(`MyToken deployed to: ${tokenAddress}`);
    console.log(`Token deployment tx: ${tokenTxHash}`);

    // Mint initial tokens to bidders
    if (bidderAddresses && bidderAddresses.length > 0) {
        console.log(`Minting 1000 MTK to ${bidderAddresses.length} bidders...`);
        if (onProgress) onProgress('minting', `Minting tokens to ${bidderAddresses.length} bidders...`);

        const TOKEN_ABI = [
            "function mint(address to, tuple(uint256 ciphertext, bytes signature) amount) external"
        ];

        const mintAmount = 1000n;

        for (let i = 0; i < bidderAddresses.length; i++) {
            const bidderAddress = bidderAddresses[i];
            console.log(`Minting 1000 MTK to bidder ${i + 1}/${bidderAddresses.length}: ${bidderAddress}`);
            if (onProgress) onProgress('minting', `Minting tokens to bidder ${i + 1}/${bidderAddresses.length}...`);

            try {
                // Get the mint function selector
                const tokenContractForMint = new ethers.Contract(tokenAddress, TOKEN_ABI, wallet);
                const mintFunction = tokenContractForMint.interface.getFunction('mint');
                const selector = mintFunction.selector;

                // Encrypt the mint amount
                const encryptedAmount = await wallet.encryptValue(
                    mintAmount,
                    tokenAddress,
                    selector
                );

                // Send mint transaction
                const mintTx = await tokenContractForMint.mint(bidderAddress, encryptedAmount, {
                    gasLimit: 500000,
                });

                console.log(`Mint tx for ${bidderAddress}: ${mintTx.hash}`);
                await mintTx.wait();
                console.log(`Successfully minted 1000 MTK to ${bidderAddress}`);
            } catch (error) {
                console.error(`Failed to mint tokens to ${bidderAddress}:`, error);
                // Continue with other bidders even if one fails
            }
        }

        console.log('Token minting complete!');
    }

    // Deploy PrivateAuction contract
    const AuctionFactory = new ethers.ContractFactory(
        PrivateAuctionArtifact.abi,
        PrivateAuctionArtifact.bytecode,
        wallet
    );

    // Auction duration: convert minutes to seconds
    const biddingTime = biddingTimeMinutes * 60;
    const isStoppable = true;

    console.log('Deploying PrivateAuction contract...');
    console.log(`  - Beneficiary: ${wallet.address}`);
    console.log(`  - Token: ${tokenAddress}`);
    console.log(`  - Bidding Time: ${biddingTimeMinutes} minutes (${biddingTime} seconds)`);
    console.log(`  - Stoppable: ${isStoppable}`);

    if (onProgress) onProgress('auction', 'Deploying Auction contract...');

    const auctionContract = await AuctionFactory.deploy(
        wallet.address,      // beneficiary
        tokenAddress,        // token contract
        biddingTime,         // bidding time in seconds
        isStoppable,         // is stoppable
        {
            gasLimit: 10000000
        }
    );

    if (onProgress) onProgress('auction', 'Waiting for Auction deployment confirmation...');
    await auctionContract.waitForDeployment();
    const auctionAddress = await auctionContract.getAddress();
    const auctionTxHash = auctionContract.deploymentTransaction().hash;

    console.log(`PrivateAuction deployed to: ${auctionAddress}`);
    console.log(`Auction deployment tx: ${auctionTxHash}`);

    if (onProgress) onProgress('verify', 'Verifying deployments...');

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
