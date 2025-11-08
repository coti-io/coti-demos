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
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            timeout: 60000,
            gas: 3000000,
            gasPrice: 10000000000 // 10 gwei
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};
