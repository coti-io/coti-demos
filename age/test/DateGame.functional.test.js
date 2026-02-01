
import { expect } from "chai";
import { Wallet, JsonRpcProvider } from "@coti-io/coti-ethers";
import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

// Use the existing environment variables
const ADMIN_PK = process.env.VITE_ADMIN_PK;
const ADMIN_AES_KEY = process.env.VITE_ADMIN_AES_KEY;
const RPC_URL = process.env.VITE_APP_NODE_HTTPS_ADDRESS || "https://testnet.coti.io/rpc";

if (!ADMIN_PK || !ADMIN_AES_KEY) {
    console.error("Skipping functional tests due to missing credentials.");
    process.exit(0);
}

// Clean PK if it doesn't have 0x
const cleanPK = ADMIN_PK.startsWith("0x") ? ADMIN_PK : "0x" + ADMIN_PK;
const cleanAES = ADMIN_AES_KEY.startsWith("0x") ? ADMIN_AES_KEY : "0x" + ADMIN_AES_KEY;

describe("DateGame Functional Tests (COTI Testnet)", function () {
    // Set a large timeout for testnet interactions
    this.timeout(300000); // Increased timeout to 5 mins

    let wallet;
    let provider;
    let dateGame;
    let deployerAddress;

    before(async function () {
        // Initialize COTI wallet
        provider = new JsonRpcProvider(RPC_URL);
        wallet = new Wallet(cleanPK, provider);
        wallet.setAesKey(cleanAES);

        deployerAddress = await wallet.getAddress();
        console.log("Testing with account:", deployerAddress);

        // Verify balance
        const balance = await provider.getBalance(deployerAddress);
        console.log("Balance:", ethers.formatEther(balance));
        // if (balance < ethers.parseEther("0.1")) {
        //     console.warn("Warning: Low balance, tests might fail.");
        // }

        let address;
        if (process.env.EXISTING_CONTRACT_ADDRESS) {
            console.log("Using existing contract at:", process.env.EXISTING_CONTRACT_ADDRESS);
            address = process.env.EXISTING_CONTRACT_ADDRESS;
        } else {
            // Deploy fresh contract for testing
            console.log("Deploying fresh DateGame contract...");
            const DateGameFactory = await ethers.getContractFactory("DateGame");

            const dateGameDeploy = await DateGameFactory.deploy({
                gasLimit: 6000000,
                gasPrice: ethers.parseUnits("10", "gwei")
            });
            await dateGameDeploy.waitForDeployment();
            address = await dateGameDeploy.getAddress();
            console.log("Deployed to:", address);
        }

        // Connect our COTI wallet to the contract
        // We need the ABI
        const artifact = await hre.artifacts.readArtifact("DateGame");
        dateGame = new ethers.Contract(address, artifact.abi, wallet);
    });

    it("should set age successfully", async function () {
        const ageToSet = 25;
        console.log(`Setting age to ${ageToSet}...`);

        const func = dateGame.interface.getFunction("setAge");
        const selector = func.selector;

        const encryptedAge = await wallet.encryptValue(
            ageToSet,
            await dateGame.getAddress(),
            selector
        );

        const tx = await dateGame.setAge(encryptedAge, { gasLimit: 5000000 });
        console.log("SetAge tx sent:", tx.hash);
        console.log("Waiting for confirmation...");
        const receipt = await tx.wait();
        console.log("SetAge confirmed in block:", receipt.blockNumber);

        const isSet = await dateGame.isAgeSet();
        console.log("isAgeSet:", isSet);
        expect(isSet).to.be.true;
    });

    it("should allow owner to guess age (greaterThan check)", async function () {
        const guess = 20;
        console.log(`Guessing greaterThan ${guess}...`);

        const func = dateGame.interface.getFunction("greaterThan");
        const selector = func.selector;

        const encryptedGuess = await wallet.encryptValue(
            guess,
            await dateGame.getAddress(),
            selector
        );

        const tx = await dateGame.greaterThan(encryptedGuess, { gasLimit: 5000000 });
        console.log("GreaterThan tx sent:", tx.hash);
        await tx.wait();
        console.log("GreaterThan confirmed");

        const encryptedResult = await dateGame.comparisonResult();
        const result = await wallet.decryptValue(encryptedResult);
        console.log("Comparison result (25 > 20):", result);

        expect(Number(result)).to.equal(1);
    });

    it("should allow owner to guess age (lessThan check)", async function () {
        const guess = 30;
        console.log(`Guessing lessThan ${guess}...`);

        const func = dateGame.interface.getFunction("lessThan");
        const selector = func.selector;

        const encryptedGuess = await wallet.encryptValue(
            guess,
            await dateGame.getAddress(),
            selector
        );

        const tx = await dateGame.lessThan(encryptedGuess, { gasLimit: 5000000 });
        console.log("LessThan tx sent:", tx.hash);
        await tx.wait();
        console.log("LessThan confirmed");

        const encryptedResult = await dateGame.comparisonResult();
        const result = await wallet.decryptValue(encryptedResult);
        console.log("Comparison result (25 < 30):", result);

        expect(Number(result)).to.equal(1);
    });

    it("should return false for incorrect guess (greaterThan)", async function () {
        const guess = 30;
        console.log(`Guessing greaterThan ${guess} (should be false)...`);

        const func = dateGame.interface.getFunction("greaterThan");
        const selector = func.selector;

        const encryptedGuess = await wallet.encryptValue(
            guess,
            await dateGame.getAddress(),
            selector
        );

        const tx = await dateGame.greaterThan(encryptedGuess, { gasLimit: 5000000 });
        await tx.wait();

        const encryptedResult = await dateGame.comparisonResult();
        const result = await wallet.decryptValue(encryptedResult);
        console.log("Comparison result (25 > 30):", result);

        expect(Number(result)).to.equal(0);
    });
});
