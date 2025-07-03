import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("YieldPool", function () {
  async function deployYieldPoolFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const ERC20Mock = await hre.ethers.getContractFactory("ERC20Mock");
    const asset = await ERC20Mock.deploy("Mock Token", "MT");
    await asset.waitForDeployment();
    let borrowProtocol: any;

    const yieldRate = 1000; // 10%
    const minDuration = 30 * 24 * 3600; // 30 days
    const maxDuration = 365 * 24 * 3600; // 365 days

    const YieldPool = await hre.ethers.getContractFactory("YieldPool");
    const BorrowProtocol = await hre.ethers.getContractFactory("BorrowProtocol");

    const mockAavePoolFactory = await hre.ethers.getContractFactory("MockAavePool");
    const mockAavePool = await mockAavePoolFactory.deploy();

    const XFIMock = await hre.ethers.getContractFactory("XFIMock");
    const xfiMock = await XFIMock.deploy();

    const borrowProtocolInstance = await BorrowProtocol.deploy(
      hre.ethers.ZeroAddress, // Placeholder for YieldPool address
      owner.address,
      await mockAavePool.getAddress(),
      await xfiMock.getAddress()
    );

    const yieldPool = await YieldPool.deploy(
      yieldRate,
      minDuration,
      maxDuration,
      borrowProtocolInstance.getAddress()
    );

    // Set the correct yield pool address in BorrowProtocol
    await borrowProtocolInstance.setYieldPool(yieldPool.getAddress());

    // Assign to the outer scope variable
    borrowProtocol = borrowProtocolInstance;

    await yieldPool.waitForDeployment();

    await asset.mint(owner.address, hre.ethers.parseEther("10000"));
    await asset.mint(otherAccount.address, hre.ethers.parseEther("10000"));

    await asset
      .connect(owner)
      .approve(yieldPool.target, hre.ethers.parseEther("10000"));
    await asset
      .connect(otherAccount)
      .approve(yieldPool.target, hre.ethers.parseEther("10000"));

    // Allow the mock token and add some initial reserves
    await yieldPool.connect(owner).setTokenAllowed(asset.target, true);
    await yieldPool
      .connect(owner)
      .addYieldReserves(asset.target, hre.ethers.parseEther("100"));

    return {
      yieldPool,
      asset,
      owner,
      otherAccount,
      yieldRate,
      minDuration,
      maxDuration,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { yieldPool, owner } = await loadFixture(deployYieldPoolFixture);
      expect(await yieldPool.owner()).to.equal(owner.address);
    });

    it("Should set the correct yield parameters", async function () {
      const { yieldPool, yieldRate, minDuration, maxDuration } =
        await loadFixture(deployYieldPoolFixture);
      expect(await yieldPool.getYieldRate()).to.equal(yieldRate);
      expect(await yieldPool.getMinDuration()).to.equal(minDuration);
      expect(await yieldPool.getMaxDuration()).to.equal(maxDuration);
    });
  });

  describe("Deposits", function () {
    it("Should allow users to deposit allowed tokens", async function () {
      const { yieldPool, asset, owner, minDuration } = await loadFixture(
        deployYieldPoolFixture
      );
      const depositAmount = hre.ethers.parseEther("100");

      await expect(
        yieldPool
          .connect(owner)
          .deposit(asset.target, depositAmount, minDuration)
      )
        .to.emit(yieldPool, "Deposited")
        .withArgs(owner.address, asset.target, depositAmount, minDuration);

      const position = await yieldPool.getPosition(owner.address, 0);
      expect(position.amount).to.equal(depositAmount);
      expect(position.token).to.equal(asset.target);
    });

    it("Should not allow zero amount deposit", async function () {
      const { yieldPool, asset, owner, minDuration } = await loadFixture(
        deployYieldPoolFixture
      );
      await expect(
        yieldPool.connect(owner).deposit(asset.target, 0, minDuration)
      ).to.be.revertedWith("Zero amount");
    });

    it("Should not allow deposits for an invalid duration", async function () {
      const { yieldPool, asset, owner } = await loadFixture(
        deployYieldPoolFixture
      );
      const depositAmount = hre.ethers.parseEther("100");
      await expect(
        yieldPool.connect(owner).deposit(asset.target, depositAmount, 100)
      ).to.be.revertedWith("Invalid duration");
    });
  });

  describe("Withdrawals", function () {
    it("Should allow users to withdraw their tokens after the lock period", async function () {
      const { yieldPool, asset, owner, minDuration } = await loadFixture(
        deployYieldPoolFixture
      );
      const depositAmount = hre.ethers.parseEther("100");
      await yieldPool
        .connect(owner)
        .deposit(asset.target, depositAmount, minDuration);

      await time.increase(minDuration + 1);

      const position = await yieldPool.getPosition(owner.address, 0);
      const yieldAmount = await yieldPool.calculateYield(
        depositAmount,
        minDuration
      );

      await expect(yieldPool.connect(owner).withdraw(position.id)).to.emit(
        yieldPool,
        "Withdrawn"
      );

      const balanceBeforeClaim = await asset.balanceOf(owner.address);
      await yieldPool.connect(owner).claimWithdrawal(asset.target);
      const totalWithdrawal = depositAmount + yieldAmount;
      expect(await asset.balanceOf(owner.address)).to.equal(
        balanceBeforeClaim + totalWithdrawal
      );
    });

    it("Should not allow users to withdraw before the lock period", async function () {
      const { yieldPool, asset, owner, minDuration } = await loadFixture(
        deployYieldPoolFixture
      );
      const depositAmount = hre.ethers.parseEther("100");
      await yieldPool
        .connect(owner)
        .deposit(asset.target, depositAmount, minDuration);

      const position = await yieldPool.getPosition(owner.address, 0);
      await expect(
        yieldPool.connect(owner).withdraw(position.id)
      ).to.be.revertedWith("Still locked");
    });
  });

  describe("Unstaking (Early Withdrawal)", function () {
    it("Should allow users to unstake before the lock period with a penalty", async function () {
      const { yieldPool, asset, owner, minDuration } = await loadFixture(
        deployYieldPoolFixture
      );
      const depositAmount = hre.ethers.parseEther("100");
      await yieldPool
        .connect(owner)
        .deposit(asset.target, depositAmount, minDuration);

      const balanceBeforeUnstake = await asset.balanceOf(owner.address);
      const position = await yieldPool.getPosition(owner.address, 0);
      await expect(yieldPool.connect(owner).unstake(position.id)).to.emit(
        yieldPool,
        "Withdrawn"
      );

      const penalty = depositAmount / 10n;
      const amountAfterPenalty = depositAmount - penalty;

      await yieldPool.connect(owner).claimWithdrawal(asset.target);
      expect(await asset.balanceOf(owner.address)).to.equal(
        balanceBeforeUnstake + amountAfterPenalty
      );
    });
  });

  describe("Yield Reserves", function () {
    it("Should allow the owner to add yield reserves", async function () {
      const { yieldPool, asset, owner } = await loadFixture(
        deployYieldPoolFixture
      );
      const reserveAmount = hre.ethers.parseEther("50");
      const initialReserve = await yieldPool.getYieldReserves(asset.target);

      await expect(
        yieldPool.connect(owner).addYieldReserves(asset.target, reserveAmount)
      )
        .to.emit(yieldPool, "YieldReserveAdded")
        .withArgs(asset.target, reserveAmount);

      expect(await yieldPool.getYieldReserves(asset.target)).to.equal(
        initialReserve + reserveAmount
      );
    });

    it("Should not allow non-owners to add yield reserves", async function () {
      const { yieldPool, asset, otherAccount } = await loadFixture(
        deployYieldPoolFixture
      );
      const reserveAmount = hre.ethers.parseEther("50");
      await expect(
        yieldPool
          .connect(otherAccount)
          .addYieldReserves(asset.target, reserveAmount)
      )
        .to.be.revertedWithCustomError(yieldPool, "OwnableUnauthorizedAccount")
        .withArgs(otherAccount.address);
    });
  });
});
