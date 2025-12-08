import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
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
            },
            viaIR: true  // REQUIRED for COTI MPC contracts
        }
    },
    networks: {
        cotiTestnet: {
            url: process.env.VITE_APP_NODE_HTTPS_ADDRESS || "https://testnet.coti.io/rpc",
            chainId: 7082400,
            accounts: [
                process.env.VITE_ALICE_PK,
                process.env.VITE_BOB_PK,
                process.env.DEPLOYER_PRIVATE_KEY
            ].filter(Boolean), // Filter out undefined values
            timeout: 60000,
            gas: 3000000,
            gasPrice: 10000000000 // 10 gwei
        }
    },
    etherscan: {
        apiKey: {
            cotiTestnet: "abc"
        },
        customChains: [
            {
                network: "cotiTestnet",
                chainId: 7082400,
                urls: {
                    apiURL: "https://testnet.cotiscan.io/api",
                    browserURL: "https://testnet.cotiscan.io"
                }
            }
        ]
    },
    sourcify: {
        enabled: false
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};
