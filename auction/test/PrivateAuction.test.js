const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrivateAuction", function () {
    let PrivateAuction;
    let auction;
    let MyToken;
    let token;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        MyToken = await ethers.getContractFactory("MyToken");
        token = await MyToken.deploy();
        await token.waitForDeployment();

        PrivateAuction = await ethers.getContractFactory("PrivateAuction");
        const biddingTime = 3600;
        const isStoppable = true;

        auction = await PrivateAuction.deploy(
            owner.address,
            await token.getAddress(),
            biddingTime,
            isStoppable
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
