require("@nomicfoundation/hardhat-ethers");
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
            url: process.env.RPC_URL || "https://testnet.coti.io/rpc",
            chainId: 7082400,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 1000000000, // 1 gwei
            gas: 12000000, // 12M gas limit
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};
