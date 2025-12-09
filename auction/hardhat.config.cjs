require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("dotenv").config();

module.exports = {
    solidity: {
        version: "0.8.19",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            viaIR: true,
        },
    },
    networks: {
        cotiTestnet: {
            url: process.env.VITE_APP_NODE_HTTPS_ADDRESS || process.env.RPC_URL || "https://testnet.coti.io/rpc",
            chainId: 7082400,
            accounts: [
                process.env.VITE_BIDDER_PK,
                process.env.DEPLOYER_PRIVATE_KEY,
                process.env.PRIVATE_KEY
            ].filter(Boolean), // Filter out undefined values
            gasPrice: 1000000000, // 1 gwei
            gas: 12000000, // 12M gas limit
            timeout: 60000
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};
