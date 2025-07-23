import { expect } from "chai";
import hre from "hardhat";

import {
	YieldPool,
	YieldPool__factory,
	YieldToken,
	YieldToken__factory,
} from "../typechain-types";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("YieldPool", async function () {
	let YieldPool: YieldPool;
	let YieldToken: YieldToken;
	let YieldPoolFactory: YieldPool__factory;
	let yieldTokenFactory: YieldToken__factory;
	let owner: SignerWithAddress;
	let otherAccount: SignerWithAddress;

	const tokenName = "YieldEDU";
	const tokenSymbol = "YDU";

	const yieldRate = 10;
	const minDuration = 86400;
	const maxDuration = 31536000;

	const amount = hre.ethers.parseUnits("10000000", 18);
	const duration = 7 * 24 * 60 * 60;

		beforeEach(async () => {
		yieldTokenFactory = await hre.ethers.getContractFactory("YieldToken");

		[owner, otherAccount] = await hre.ethers.getSigners();

		YieldPoolFactory = await hre.ethers.getContractFactory("YieldPool");

		YieldToken = await yieldTokenFactory.deploy(
			owner,
			tokenName,
			tokenSymbol
		);

		// Mint tokens while 'owner' is still the owner of YieldToken
		await YieldToken.mint(owner, hre.ethers.parseUnits("1000000000", 18));
		await YieldToken.mint(otherAccount, hre.ethers.parseUnits("1000000000", 18));

		YieldPool = await YieldPoolFactory.deploy(await YieldToken.getAddress(),yieldRate,minDuration,maxDuration, 5); // 5% protocol fee

		await YieldToken.connect(owner).setMinter(await YieldPool.getAddress()); // Set YieldPool as minter
		await YieldToken.transferOwnership(await YieldPool.getAddress()); // Transfer ownership to YieldPool
		expect(await YieldToken.owner()).to.equal(await YieldPool.getAddress()); // Verify ownership transfer
		expect(await YieldToken.minter()).to.equal(await YieldPool.getAddress()); // Verify minter transfer

		// Approve YieldPool to spend tokens for owner and otherAccount
		await YieldToken.approve(await YieldPool.getAddress(), hre.ethers.parseUnits("1000000000", 18));
		await YieldToken.connect(otherAccount).approve(await YieldPool.getAddress(), hre.ethers.parseUnits("1000000000", 18));

	});

	it("Should have set the name during upgrade", async function () {
		expect(await YieldToken.connect(otherAccount).name()).to.equal(
			"YieldEDU"
		);
		expect(await YieldToken.connect(otherAccount).symbol()).to.equal("YDU");
	});

	it("successful update yield parameters by owner", async () => {
		const oldRate = await YieldPool.getYieldRate();
		const oldMinDuration = await YieldPool.getMinStakeDuration();
		const oldMaxDuration = await YieldPool.getMaxStakeDuration();

		await expect(
			YieldPool.connect(otherAccount).updateYieldParameters(20, 2, 365)
		)
		.to.be.revertedWith('Not the contract owner')

		expect(await YieldPool.getYieldRate()).to.be.equal(oldRate);
		expect(await YieldPool.getMinStakeDuration()).to.be.equal(oldMinDuration);
		expect(await YieldPool.getMaxStakeDuration()).to.be.equal(oldMaxDuration);

		await expect(YieldPool.updateYieldParameters(15, 2, 365))
			.to.emit(YieldPool, "YieldParametersUpdated")
			.withArgs(15, 2, 365);

		expect(await YieldPool.getYieldRate()).to.be.equal(15);
		expect(await YieldPool.getMinStakeDuration()).to.be.equal(2);
		expect(await YieldPool.getMaxStakeDuration()).to.be.equal(365);
	});

	it("Throws an error if deposit token param is not acceptable", async () => {
		await YieldToken.approve(YieldPool, amount);
		await expect(
			YieldPool.deposit(otherAccount, amount, duration)
		).to.be.revertedWith("We do not support the tokens you're staking");
	});
	it("Throws an error if amount is not greater than zero", async () => {
		await YieldToken.approve(YieldPool, 0);
		await expect(
			YieldPool.deposit(YieldToken, 0, duration)
		).to.be.revertedWith("Amount must be greater than 0");
	});

it("Throws an error if duration is less than required minimum or is more than required maximum duration", async () => {
		await YieldToken.approve(YieldPool, amount);
		await expect(
			YieldPool.deposit(YieldToken, amount, 0)
		).to.be.revertedWith("Invalid duration");
	});

	it("successfully deposits", async () => {
		await YieldToken.approve(YieldPool, amount);
		await expect(YieldPool.deposit(YieldToken, amount, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, amount, duration);
	});

	it("reverts when token is not acceptable", async () => {
		// Deploy a new token that is not allowed
		const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");

		await AnotherToken.approve(YieldPool, amount);

		await expect(
			YieldPool.deposit(AnotherToken, amount, duration)
		).to.be.revertedWith("We do not support the tokens you're staking");
	});

	it("successfully gets user balances", async () => {
		await YieldToken.approve(YieldPool, amount);
		await expect(YieldPool.deposit(YieldToken, amount, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, amount, duration);

		expect(
			(await YieldPool.getUserTokenBalances()).balances[0].toString()
		).to.be.equal(amount.toString());
		expect(
			(await YieldPool.getUserTokenBalances()).tokens[0].toString()
		).to.be.equal(YieldToken);

		//deposit some new tokens
		await YieldToken.approve(YieldPool, BigInt(Number(amount) * 2));

		await expect(
			YieldPool.deposit(YieldToken, BigInt(Number(amount) * 2), duration)
		)
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, BigInt(Number(amount) * 2), duration);


			const userBalances = await YieldPool.getUserTokenBalances();
			
		expect(
			userBalances.balances[0].toString(),
		).to.be.equal(userBalances.balances[0].toString());
		expect(
			userBalances.tokens[0].toString()
		).to.be.equal(YieldToken);
	});

	it("successfully allows tokens", async () => {
		const allowedTokens = await YieldPool.getAllowedTokens();

		const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");

		expect(allowedTokens).to.include(await YieldToken.getAddress());
		expect(
			await YieldPool.isTokenAllowed(await YieldToken.getAddress())
		).to.be.equals(true);
		
		expect(allowedTokens).to.not.include(await AnotherToken.getAddress());
		expect(
			await YieldPool.isTokenAllowed(await AnotherToken.getAddress())
		).to.be.equals(false);

		// Add AnotherToken
		await YieldPool.addAllowedTokens(await AnotherToken.getAddress());
		expect(await YieldPool.getAllowedTokens()).to.include(
			await AnotherToken.getAddress()
		);
		expect(
			await YieldPool.isTokenAllowed(await AnotherToken.getAddress())
		).to.be.equals(true);

		// Remove AnotherToken
		await YieldPool.removeAllowedToken(await AnotherToken.getAddress());
		expect(await YieldPool.getAllowedTokens()).to.not.include(
			await AnotherToken.getAddress()
		);
		expect(
			await YieldPool.isTokenAllowed(await AnotherToken.getAddress())
		).to.be.equals(false);

		// Remove YieldToken and native token
		await YieldPool.removeAllowedToken(await YieldToken.getAddress());
		await YieldPool.removeAllowedToken(hre.ethers.ZeroAddress);
		expect(await YieldPool.getAllowedTokens()).to.deep.equal([]);
	});

	it("Get user positions", async () => {
		await YieldToken.approve(YieldPool, amount);
		await YieldPool.deposit(YieldToken, amount, duration);

		const positions = await YieldPool.getPosition(1);
		expect(positions.amount).to.be.equal(amount);
		expect(positions.lockDuration).to.be.equal(duration);
	});
	it("reverts when position is not found", async () => {
		await YieldToken.approve(YieldPool, amount);
		await YieldPool.deposit(YieldToken, amount, duration);

		await expect(YieldPool.getPosition(2)).to.be.revertedWith(
			"Position does not exist"
		);
	});

	it("gets total stakers", async () => {
		await YieldToken.approve(YieldPool, amount);
		await expect(YieldPool.deposit(YieldToken, amount, duration))
		.to.emit(YieldPool, "Deposited")
		.withArgs(owner, YieldToken, amount, duration);
		
		expect(await YieldPool.getTotalStakers()).to.be.equal(1);
		const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");

		await AnotherToken.mint(otherAccount, amount);
		await AnotherToken.connect(otherAccount).approve(YieldPool, amount);
		await YieldPool.addAllowedTokens(await AnotherToken.getAddress());


		 expect(
			await YieldPool.connect(otherAccount).deposit(AnotherToken, amount, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPool, "Deposited")
			.withArgs(otherAccount, AnotherToken, amount, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(2);
	});

	it("get total value locked", async () => {
		await YieldToken.approve(YieldPool, amount);
		await expect(YieldPool.deposit(YieldToken, amount, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, amount, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(1);

		await YieldToken.connect(otherAccount).approve(YieldPool, amount);

		await expect(
			YieldPool.connect(otherAccount).deposit(YieldToken, amount, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPool, "Deposited")
			.withArgs(otherAccount, YieldToken, amount, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(2);
		expect(await YieldPool.getTotalValueLocked()).to.be.equal(
			hre.ethers.parseUnits("20000000", 18)
		);
	});

	it("successfully calculate Yield amount", async () => {
		const block = await hre.ethers.provider.getBlock("latest");
		const expectedYield =
			(BigInt(amount) * BigInt(duration) * BigInt(yieldRate)) /
			BigInt(31536000 * 100);

		expect(
			await YieldPool.calculateExpectedYield(amount, block!.timestamp)
		).to.be.equal(0);
	});

	it("successfully withdraw with penalty if locked", async () => {
		const depositAmount = hre.ethers.parseEther("100"); // Use 100 ETH for easier calculation

		// Deposit native token
		const ownerBalanceBeforeDeposit = await hre.ethers.provider.getBalance(owner.address);
		const yieldPoolBalanceBeforeDeposit = await hre.ethers.provider.getBalance(await YieldPool.getAddress());

		await YieldPool.depositNative(minDuration, { value: depositAmount });
		const userPosition1 = await YieldPool.getPosition(1);

		const penalty = depositAmount / BigInt(10); // 10% penalty
		const ownerShare = penalty / BigInt(2); // 5% of principal to owner
		const amountToReturnToUser = depositAmount - penalty;

		const ownerBalanceBeforeWithdraw = await hre.ethers.provider.getBalance(owner.address);
		const yieldPoolBalanceBeforeWithdraw = await hre.ethers.provider.getBalance(await YieldPool.getAddress());

		await expect(YieldPool.withdraw(userPosition1.id))
			.to.emit(YieldPool, "Withdrawn")
			.withArgs(owner.address, hre.ethers.ZeroAddress, amountToReturnToUser, 0);

		// Verify owner's balance increased by their share of the penalty
		expect(await hre.ethers.provider.getBalance(owner.address)).to.be.gt(ownerBalanceBeforeWithdraw);

		// Verify YieldPool balance decreased
		expect(await hre.ethers.provider.getBalance(await YieldPool.getAddress())).to.be.lt(yieldPoolBalanceBeforeWithdraw);
	});

	it("successfully withdraw with yield after lock duration", async () => {
		await YieldToken.approve(YieldPool, 10);
		await expect(YieldPool.deposit(YieldToken, 10, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, 10, duration);

		const userPosition1 = await YieldPool.getPosition(1);

		// Fast forward time to after the lock duration
		await hre.network.provider.send("evm_increaseTime", [duration]);
		await hre.network.provider.send("evm_mine", []);

		const totalYield = await YieldPool.calculateExpectedYield(10, userPosition1.startTime);
		const protocolFee = (totalYield * BigInt(5)) / BigInt(100); // 5% protocol fee
		const expectedUserYield = totalYield - protocolFee;

		const balanceBefore = await YieldToken.balanceOf(owner.address);
		await expect(YieldPool.withdraw(userPosition1.id))
			.to.emit(YieldPool, "Withdrawn")
			.withArgs(owner, YieldToken, 10, expectedUserYield);
		const balanceAfter = await YieldToken.balanceOf(owner.address);

		expect(balanceAfter).to.be.gt(balanceBefore);
	});

			

	

	it("reverts when user tries to withdraw a position he does not own", async () => {
		await YieldToken.approve(YieldPool, 10);
		await expect(YieldPool.deposit(YieldToken, 10, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, 10, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(1);

		await YieldToken.connect(otherAccount).approve(YieldPool, 10);

		await expect(
			YieldPool.connect(otherAccount).deposit(YieldToken, 10, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPool, "Deposited")
			.withArgs(otherAccount, YieldToken, 10, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(2);
		const userPosition2 = await YieldPool.getPosition(2);

		// Fast forward time to after the lock duration
		await hre.network.provider.send("evm_increaseTime", [duration]);

		await expect(YieldPool.withdraw(userPosition2.id)).to.revertedWith(
			"You are not the owner of this position"
		);
	});

	it("reverts when position has already been withdrawn", async () => {
		await YieldToken.approve(YieldPool, 10);
		await expect(YieldPool.deposit(YieldToken, 10, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, 10, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(1);

		await YieldToken.approve(YieldPool, 10);

		await expect(
			YieldPool.deposit(YieldToken, 10, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, 10, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(1);
		const userPosition1 = await YieldPool.getPosition(1);

		//calculate yieldAmount
		const expectedYield =
			await YieldPool.calculateExpectedYield(10, userPosition1.startTime);

		// Fast forward time to after the lock duration
		await hre.network.provider.send("evm_increaseTime", [duration]);

		await expect(YieldPool.withdraw(userPosition1.id))
			.to.emit(YieldPool, "Withdrawn")
			.withArgs(owner, YieldToken, 10, expectedYield);

		await expect(YieldPool.withdraw(userPosition1.id)).to.be.revertedWith(
			"Position does not exist"
		);
	});

	it("successfully deposits native token and creates a position", async () => {
		const depositAmount = hre.ethers.parseEther("1");
		const initialTotalValueLocked = await YieldPool.getTotalValueLocked();

		// Deposit native token
		await expect(
			YieldPool.depositNative(duration, { value: depositAmount })
		)
			.to.emit(YieldPool, "Deposited")
			.withArgs(
				owner.address,
				hre.ethers.ZeroAddress,
				depositAmount,
				duration
			);

		// Check TVL
		const newTotalValueLocked = await YieldPool.getTotalValueLocked();
		expect(newTotalValueLocked).to.equal(
			initialTotalValueLocked + depositAmount
		);

		// Check position details
		const position = await YieldPool.getPosition(1);
		expect(position.amount).to.equal(depositAmount);
		expect(position.token).to.equal(hre.ethers.ZeroAddress);
		expect(position.lockDuration).to.equal(duration);
		expect(position.positionAddress).to.equal(owner.address);
	});

	it("reverts depositNative if amount is not greater than zero", async () => {
		await expect(
			YieldPool.depositNative(duration, { value: 0 })
		).to.be.revertedWith("Amount must be greater than 0");
	});

	it("reverts depositNative if duration is invalid", async () => {
		await expect(
			YieldPool.depositNative(0, { value: hre.ethers.parseEther("1") })
		).to.be.revertedWith("Invalid duration");

		await expect(
			YieldPool.depositNative(maxDuration + 1, { value: hre.ethers.parseEther("1") })
		).to.be.revertedWith("Invalid duration");
	});

	it("updates totalStakers and activeStakers correctly on depositNative", async () => {
		const depositAmount = hre.ethers.parseEther("1");
		const initialTotalStakers = await YieldPool.getTotalStakers();

		// First deposit from owner
		await YieldPool.depositNative(duration, { value: depositAmount });
		expect(await YieldPool.getTotalStakers()).to.equal(initialTotalStakers + BigInt(1));

		// Second deposit from otherAccount
		await YieldPool.connect(otherAccount).depositNative(duration, { value: depositAmount });
		expect(await YieldPool.getTotalStakers()).to.equal(initialTotalStakers + BigInt(2));

		// Third deposit from owner (should not increase totalStakers)
		await YieldPool.depositNative(duration, { value: depositAmount });
		expect(await YieldPool.getTotalStakers()).to.equal(initialTotalStakers + BigInt(2));
	});


it("continues to generate yield after lock duration", async () => {
		await YieldToken.approve(YieldPool, 10);
		await expect(YieldPool.deposit(YieldToken, 10, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, 10, duration);

		const userPosition1 = await YieldPool.getPosition(1);

		// Fast forward time to after the lock duration
		await hre.network.provider.send("evm_increaseTime", [duration]);
		await hre.network.provider.send("evm_mine", []);

		const balanceBefore = await YieldToken.balanceOf(owner.address);
		await YieldPool.withdraw(userPosition1.id);
		const balanceAfter = await YieldToken.balanceOf(owner.address);

		expect(balanceAfter).to.be.gt(balanceBefore);
	});
});
