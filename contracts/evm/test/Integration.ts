import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { BorrowProtocol, YieldPool, ERC20Mock, MockAavePool, XFIMock } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Integration Test: YieldPool and BorrowProtocol", function () {
  let yieldPool: YieldPool;
  let borrowProtocol: BorrowProtocol;
  let mockERC20: ERC20Mock;
  let owner: SignerWithAddress;
  let depositor: SignerWithAddress;
  let borrower: SignerWithAddress;
  let mockAavePool: MockAavePool;
  let xfiMock: XFIMock;

  const yieldRate = 1000; // 10%
  const minDuration = 7 * 24 * 60 * 60; // 7 days
  const maxDuration = 365 * 24 * 60 * 60; // 365 days

  async function deployContractsFixture() {
    [owner, depositor, borrower] = await hre.ethers.getSigners();

    const borrowProtocolFactory = await hre.ethers.getContractFactory(
      "BorrowProtocol"
    );
    const mockAavePoolFactory = await hre.ethers.getContractFactory("MockAavePool");
    mockAavePool = await mockAavePoolFactory.deploy();

    const XFIMock = await hre.ethers.getContractFactory("XFIMock");
    const xfiMock = await XFIMock.deploy();

    borrowProtocol = await borrowProtocolFactory.deploy(
      hre.ethers.ZeroAddress, // Placeholder, will be set later
      owner.address,
      mockAavePool.getAddress(),
      xfiMock.getAddress()
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
      xfiMock,
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
        minDuration,
        123 // Example destinationChainId
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
    await borrowProtocol.connect(borrower).payLoan(loanId, 123);

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

  it("should allow a user to unstake with penalty before lock duration ends", async function () {
    const { yieldPool, mockERC20, depositor } = await loadFixture(
      deployContractsFixture
    );

    const depositAmount = hre.ethers.parseEther("1000");
    const shortDuration = minDuration / 2; // Unstake before full duration

    await mockERC20
      .connect(depositor)
      .approve(yieldPool.getAddress(), depositAmount);
    await yieldPool
      .connect(depositor)
      .deposit(mockERC20.getAddress(), depositAmount, minDuration);

    // Advance time, but not enough to meet minDuration
    await time.increase(shortDuration);

    // Unstake the position (positionId 1 from the deposit)
    const positionId = 1;
    await yieldPool.connect(depositor).unstake(positionId);

    // Calculate expected penalty and amount to return
    const expectedPenalty = depositAmount / 10n; // 10% penalty
    const expectedReturnAmount = depositAmount - expectedPenalty;

    // Check pending withdrawal amount
    const pendingWithdrawal = await yieldPool.getPendingWithdrawals(
      depositor.address,
      mockERC20.getAddress()
    );
    expect(pendingWithdrawal).to.equal(expectedReturnAmount);

    // Claim the withdrawal
    const depositorBalanceBeforeClaim = await mockERC20.balanceOf(
      depositor.address
    );
    await yieldPool.connect(depositor).claimWithdrawal(mockERC20.getAddress());
    const depositorBalanceAfterClaim = await mockERC20.balanceOf(
      depositor.address
    );

    // Verify the final balance reflects the unstaked amount with penalty
    expect(depositorBalanceAfterClaim).to.be.closeTo(
      depositorBalanceBeforeClaim + expectedReturnAmount,
      hre.ethers.parseEther("0.001")
    );

    // Verify that the position is marked as withdrawn
    expect(await yieldPool.getPositionOwner(positionId)).to.equal(hre.ethers.ZeroAddress);
  });

  

  it("should correctly reflect borrowed positions and credit profile after a loan", async function () {
    const { yieldPool, borrowProtocol, mockERC20, depositor, borrower } =
      await loadFixture(deployContractsFixture);

    // 1. Depositor deposits into YieldPool to provide liquidity
    const depositAmount = hre.ethers.parseEther("1000");
    await mockERC20
      .connect(depositor)
      .approve(yieldPool.getAddress(), depositAmount);
    await yieldPool
      .connect(depositor)
      .deposit(mockERC20.getAddress(), depositAmount, minDuration);
    await yieldPool.transferToBorrowProtocol(
      mockERC20.getAddress(),
      depositAmount
    );

    // 2. Borrower takes a loan
    const collateralAmount = hre.ethers.parseEther("100");
    const borrowAmount = hre.ethers.parseEther("50");
    const loanDuration = minDuration;
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
        loanDuration,
        123 // Example destinationChainId
      );

    // Verify loan details using getUserLoans
    const userLoans = await borrowProtocol.getUserLoans(borrower.address);
    expect(userLoans.length).to.equal(1);
    const loan = userLoans[0];
    expect(loan.collateralAmount).to.equal(collateralAmount);
    expect(loan.borrowAmount).to.equal(borrowAmount);
    expect(loan.duration).to.equal(loanDuration);
    expect(loan.active).to.be.true;
    expect(loan.userAddress).to.equal(borrower.address);

    // Verify credit profile
    const creditProfile = await borrowProtocol.getCreditProfile(borrower.address);
    expect(creditProfile.totalBorrowed).to.equal(borrowAmount);
    expect(creditProfile.activeLoans).to.equal(1);
    expect(creditProfile.score).to.equal(800); // Should be the set score

    // Verify user loan IDs
    const userLoanIds = await borrowProtocol.getUserLoanIds(borrower.address);
    expect(userLoanIds.length).to.equal(1);
    expect(userLoanIds[0]).to.equal(loan.loanId);

    // Verify getLoan function
    const retrievedLoan = await borrowProtocol.getUserLoan(borrower.address, loan.loanId);
    expect(retrievedLoan.borrowAmount).to.equal(borrowAmount);
  });

  it("should correctly reflect pending withdrawals and active positions after deposit and withdrawal", async function () {
    const { yieldPool, mockERC20, depositor } = await loadFixture(
      deployContractsFixture
    );

    const depositAmount = hre.ethers.parseEther("500");
    await mockERC20
      .connect(depositor)
      .approve(yieldPool.getAddress(), depositAmount);
    await yieldPool
      .connect(depositor)
      .deposit(mockERC20.getAddress(), depositAmount, minDuration);

    // Verify active positions count
    const activePositionsCount = await yieldPool.getActivePositionsCount(
      depositor.address
    );
    expect(activePositionsCount).to.equal(1);

    // Verify getPosition
    const position = await yieldPool.getPosition(depositor.address, 0); // Assuming first position is at index 0
    expect(position.amount).to.equal(depositAmount);
    expect(position.token).to.equal(await mockERC20.getAddress());
    expect(position.withdrawn).to.be.false;

    // Advance time and withdraw
    await time.increase(minDuration + 1);
    const positionId = position.id; // Use the actual position ID
    await yieldPool.connect(depositor).withdraw(positionId);

    // Verify pending withdrawal amount
    const yieldAmount = await yieldPool.calculateYield(
      depositAmount,
      minDuration
    );
    const expectedPending = depositAmount + yieldAmount;
    const pendingWithdrawal = await yieldPool.getPendingWithdrawals(
      depositor.address,
      mockERC20.getAddress()
    );
    expect(pendingWithdrawal).to.be.closeTo(expectedPending, hre.ethers.parseEther("0.001"));

    // Verify active positions count after withdrawal
    const activePositionsCountAfterWithdrawal = await yieldPool.getActivePositionsCount(
      depositor.address
    );
    expect(activePositionsCountAfterWithdrawal).to.equal(0);

    // Verify getPositionOwner reverts after withdrawal
    expect(await yieldPool.getPositionOwner(positionId)).to.equal(hre.ethers.ZeroAddress);
  });
});
