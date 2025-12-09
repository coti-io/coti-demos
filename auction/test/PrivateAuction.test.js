import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("PrivateAuction", function () {
    let PrivateAuction;
    let auction;
    let MyToken;
    let token;
    let owner;
    let addr1;
    let addr2;

    before(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        MyToken = await ethers.getContractFactory("MyToken");
        token = await MyToken.deploy({
            gasLimit: 5000000 // Manual gas limit
        });
        await token.waitForDeployment();

        PrivateAuction = await ethers.getContractFactory("PrivateAuction");
        const biddingTime = 3600;
        const isStoppable = true;

        auction = await PrivateAuction.deploy(
            owner.address,
            await token.getAddress(),
            biddingTime,
            isStoppable,
            {
                gasLimit: 5000000 // Manual gas limit
            }
        );
        await auction.waitForDeployment();
    });

    it("Should set the right beneficiary", async function () {
        expect(await auction.beneficiary()).to.equal(owner.address);
    });

    it("Should set the right token contract", async function () {
        expect(await auction.tokenContract()).to.equal(await token.getAddress());
    });
});
