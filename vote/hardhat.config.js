import "@nomicfoundation/hardhat-ethers";
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

/** @type import('hardhat/config').HardhatUserConfig */
export default {
    solidity: {
        version: "0.8.19",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        cotiTestnet: {
            url: process.env.VITE_APP_NODE_HTTPS_ADDRESS || "https://testnet.coti.io/rpc",
            chainId: 7082400,
            // Use Alice's private key so she becomes the owner and can decrypt results
            accounts: process.env.ALICE_PK ? [process.env.ALICE_PK] : [],
            timeout: 180000, // 3 minutes
            gas: 3000000,
            gasPrice: 10000000000, // 10 gwei - lower gas price
            allowUnlimitedContractSize: true,
            blockGasLimit: 30000000,
            // Add retry configuration
            httpHeaders: {
                "User-Agent": "hardhat"
            },
            // Disable automatic gas estimation to avoid "pending block" errors
            gasMultiplier: 1.2
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};
