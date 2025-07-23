import { expect } from "chai";
import hre from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
	YieldPool,
	YieldPool__factory,
	YieldToken,
	YieldToken__factory,
} from "../typechain-types";

describe("YieldToken proxy", async () => {
	let yieldTokenFactory: YieldToken__factory;
	let YieldToken: YieldToken;
	let YieldPool: YieldPool;
	let YieldPoolFactory: YieldPool__factory;

	let owner: SignerWithAddress;
	let otherAccount: SignerWithAddress;
	let otherAccount2: SignerWithAddress;
	const amount = hre.ethers.parseUnits("10000000", 18);

	const tokenName = "YieldEDU";
	const tokenSymbol = "YDU";

	const yieldRate = 10;
	const minDuration = 86400;
	const maxDuration = 31536000;

	beforeEach(async () => {
		[owner, otherAccount, otherAccount2] = await hre.ethers.getSigners();
		yieldTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		YieldPoolFactory = await hre.ethers.getContractFactory("YieldPool");

		YieldToken = await yieldTokenFactory.deploy(owner,tokenName,tokenSymbol);
		YieldPool = await YieldPoolFactory.deploy(await YieldToken.getAddress(),yieldRate,minDuration,maxDuration, 0);

	});

	it("allows only owner to mint", async () => {
		await expect(
			YieldToken.connect(otherAccount).mint(otherAccount2, amount)
		).to.be.revertedWith("Unauthorized minter");
	});

	it("successfully mints to an address", async () => {
		await expect(YieldToken.mint(otherAccount2, amount))
			.to.emit(YieldToken, "TokensMinted")
			.withArgs(otherAccount2, amount, owner);
	});
});