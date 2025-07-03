import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { BorrowProtocol, YieldPool, ERC20Mock } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Integration Test: YieldPool and BorrowProtocol", function () {
  let yieldPool: YieldPool;
  let borrowProtocol: BorrowProtocol;
  let mockERC20: ERC20Mock;
  let owner: SignerWithAddress;
  let depositor: SignerWithAddress;
  let borrower: SignerWithAddress;

  const yieldRate = 1000; // 10%
  const minDuration = 7 * 24 * 60 * 60; // 7 days
  const maxDuration = 365 * 24 * 60 * 60; // 365 days

  async function deployContractsFixture() {
    [owner, depositor, borrower] = await hre.ethers.getSigners();

    const borrowProtocolFactory = await hre.ethers.getContractFactory(
      "BorrowProtocol"
    );
    borrowProtocol = await borrowProtocolFactory.deploy(
      hre.ethers.ZeroAddress, // Placeholder, will be set later
      owner.address
    );

    // Deploy YieldPool
    const yieldPoolFactory = await hre.ethers.getContractFactory("YieldPool");
    yieldPool = await yieldPoolFactory.deploy(
      yieldRate,
      minDuration,
      maxDuration,
      borrowProtocol.getAddress()
    );

    // Set the correct yield pool address in BorrowProtocol
    await borrowProtocol.setYieldPool(yieldPool.getAddress());

    // Deploy MockERC20
    const mockERC20Factory = await hre.ethers.getContractFactory("ERC20Mock");
    mockERC20 = await mockERC20Factory.deploy("MockToken", "MTK");

    // Initial setup
    await yieldPool.setTokenAllowed(mockERC20.getAddress(), true);
    await mockERC20.mint(owner.address, hre.ethers.parseEther("10000")); // Mint some tokens to owner for funding
    await mockERC20
      .connect(owner)
      .approve(yieldPool.getAddress(), hre.ethers.parseEther("10000"));
    await yieldPool
      .connect(owner)
      .addYieldReserves(mockERC20.getAddress(), hre.ethers.parseEther("10000")); // Add significant reserves
    await borrowProtocol.setMinCollateralAmount(
      mockERC20.getAddress(),
      hre.ethers.parseEther("10")
    );
    await borrowProtocol.setMinimumDuration(3600); // 1 hour
    await borrowProtocol.setLiquidationThreshold(mockERC20.getAddress(), 80);

    // Fund accounts
    await mockERC20.mint(depositor.address, hre.ethers.parseEther("1000"));
    await mockERC20.mint(borrower.address, hre.ethers.parseEther("500"));

    return {
      yieldPool,
      borrowProtocol,
      mockERC20,
      owner,
      depositor,
      borrower,
    };
  }

  it("should allow a user to deposit, another to borrow, repay, and the first to withdraw with yield", async function () {
    const { yieldPool, borrowProtocol, mockERC20, depositor, borrower } =
      await loadFixture(deployContractsFixture);

    // 1. Depositor deposits into YieldPool
    const depositAmount = hre.ethers.parseEther("1000");
    await mockERC20
      .connect(depositor)
      .approve(yieldPool.getAddress(), depositAmount);
    await yieldPool
      .connect(depositor)
      .deposit(mockERC20.getAddress(), depositAmount, minDuration);

    // Transfer deposited funds to BorrowProtocol to be available for borrowing
    await yieldPool.transferToBorrowProtocol(
      mockERC20.getAddress(),
      depositAmount
    );

    // 2. Borrower borrows from BorrowProtocol
    const collateralAmount = hre.ethers.parseEther("100");
    const borrowAmount = hre.ethers.parseEther("50");
    await mockERC20
      .connect(borrower)
      .approve(borrowProtocol.getAddress(), collateralAmount);
    await borrowProtocol.setCreditScoreForTesting(borrower.address, 800);

    await borrowProtocol
      .connect(borrower)
      .Borrow(
        mockERC20.getAddress(),
        collateralAmount,
        mockERC20.getAddress(),
        borrowAmount,
        minDuration
      );

    // 3. Borrower repays the loan
    await time.increase(minDuration + 1);
    const loanId = 0;
    const totalDue = await borrowProtocol.calculateTotalDue(
      borrower.address,
      loanId
    );
    await mockERC20
      .connect(borrower)
      .approve(borrowProtocol.getAddress(), totalDue);
    await borrowProtocol.connect(borrower).payLoan(loanId);

    // 4. Depositor withdraws from YieldPool
    const positionId = 1;
    await yieldPool.connect(depositor).withdraw(positionId);

    const depositorInitialBalance = hre.ethers.parseEther("0"); // Deposited all tokens
    const yieldAmount = await yieldPool.calculateYield(
      depositAmount,
      minDuration
    );

    // Claim the withdrawal
    await yieldPool.connect(depositor).claimWithdrawal(mockERC20.getAddress());

    const depositorFinalBalance = await mockERC20.balanceOf(depositor.address);

    // Check that the depositor received their initial deposit plus yield
    expect(depositorFinalBalance).to.be.closeTo(
      depositorInitialBalance + depositAmount + yieldAmount,
      hre.ethers.parseEther("0.001")
    );
  });
});
