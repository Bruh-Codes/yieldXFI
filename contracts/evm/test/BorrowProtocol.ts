import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import {
  BorrowProtocol,
  BorrowProtocol__factory,
  YieldPool,
  YieldPool__factory,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ERC20Mock, ERC20Mock__factory, XFIMock, XFIMock__factory } from "../typechain-types";

describe("BorrowProtocol", function () {
  let yieldPool: YieldPool;
  let yieldPoolFactory: YieldPool__factory;
  let borrowProtocol: BorrowProtocol;
  let borrowProtocolFactory: BorrowProtocol__factory;

  const yieldRate = 1000; // 10% (basis points)
  const minDuration = 7 * 24 * 60 * 60; // 7 days in seconds
  const maxDuration = 365 * 24 * 60 * 60; // 365 days in seconds

  let owner: SignerWithAddress;
  let otherAccount: SignerWithAddress;
  let developerAccount: SignerWithAddress;
  let mockERC20: ERC20Mock;
  let mockERC20Factory: ERC20Mock__factory;
  let xfiMock: XFIMock;
  let xfiMockFactory: XFIMock__factory;

  async function deployBorrowProtocolFixture() {
    [owner, otherAccount, developerAccount] = await hre.ethers.getSigners();
    yieldPoolFactory = await hre.ethers.getContractFactory("YieldPool");
    const BorrowProtocol = await hre.ethers.getContractFactory(
      "BorrowProtocol"
    );

    borrowProtocolFactory = await hre.ethers.getContractFactory(
      "BorrowProtocol"
    );
    yieldPoolFactory = await hre.ethers.getContractFactory("YieldPool");
    yieldPool = await yieldPoolFactory.deploy(
      yieldRate,
      minDuration,
      maxDuration,
      hre.ethers.ZeroAddress // Placeholder for BorrowProtocol address
    );

    // Deploy BorrowProtocol first with a placeholder for YieldPool
    const mockAavePoolFactory = await hre.ethers.getContractFactory(
      "MockAavePool"
    );
    const mockAavePool = await mockAavePoolFactory.deploy();

    const XFIMockFactory = await hre.ethers.getContractFactory("XFIMock");
    const xfiMock = await XFIMockFactory.deploy();

    borrowProtocol = await borrowProtocolFactory.deploy(
      hre.ethers.ZeroAddress, // Placeholder for YieldPool address
      owner.address,
      await mockAavePool.getAddress(),
      await xfiMock.getAddress()
    );

    // Deploy YieldPool using the deployed BorrowProtocol's address
    yieldPoolFactory = await hre.ethers.getContractFactory("YieldPool");
    yieldPool = await yieldPoolFactory.deploy(
      yieldRate,
      minDuration,
      maxDuration,
      await borrowProtocol.getAddress()
    );

    // Set the correct YieldPool address in BorrowProtocol
    await borrowProtocol.setYieldPool(await yieldPool.getAddress());

    mockERC20Factory = await hre.ethers.getContractFactory("ERC20Mock");
    mockERC20 = await mockERC20Factory.deploy("MockToken", "MTK");

    // Fund BorrowProtocol with some mockERC20 and ETH for testing
    await mockERC20.mint(
      borrowProtocol.getAddress(),
      hre.ethers.parseEther("10000")
    );

    // Fund XFIMock and deposit into MockAavePool
    await xfiMock.mint(owner.address, hre.ethers.parseEther("100"));
    await xfiMock.connect(owner).approve(await mockAavePool.getAddress(), hre.ethers.parseEther("100"));
    await mockAavePool.connect(owner).deposit(await xfiMock.getAddress(), hre.ethers.parseEther("100"), await borrowProtocol.getAddress());

    // Transfer ETH to borrowProtocol for native token borrowing
    await owner.sendTransaction({
      to: borrowProtocol.getAddress(),
      value: hre.ethers.parseEther("100"),
    });

    // Set a high credit score for otherAccount for testing purposes
    await borrowProtocol.setCreditScoreForTesting(otherAccount.address, 800);

    return {
      yieldPool,
      borrowProtocol,
      owner,
      otherAccount,
      developerAccount,
      mockERC20,
      xfiMock,
      mockAavePool,
    };
  }

  it("should deploy successfully", async function () {
    const { borrowProtocol, yieldPool } = await loadFixture(
      deployBorrowProtocolFixture
    );

    expect(await borrowProtocol.getYieldPool()).to.equal(
      await yieldPool.getAddress()
    );
  });

  it("should allow owner to set credit score for testing", async () => {
    const { borrowProtocol, otherAccount, developerAccount } =
      await loadFixture(deployBorrowProtocolFixture);
    const newScore = 900;
    await borrowProtocol.setCreditScoreForTesting(
      otherAccount.address,
      newScore
    );
    expect(await borrowProtocol.getCreditScore(otherAccount.address)).to.equal(
      newScore
    );

    // Test only owner can call
    await expect(
      borrowProtocol
        .connect(developerAccount)
        .setCreditScoreForTesting(otherAccount.address, 1000)
    )
      .to.be.revertedWithCustomError(
        borrowProtocol,
        "OwnableUnauthorizedAccount"
      )
      .withArgs(developerAccount.address);
  });

  it("should allow borrowing with ERC20 tokens", async () => {
    const { borrowProtocol, owner, otherAccount, mockERC20, yieldPool } =
      await loadFixture(deployBorrowProtocolFixture);

    // Set token as allowed in yield pool
    await yieldPool.setTokenAllowed(mockERC20.getAddress(), true);

    // Mint 500 tokens to user (otherAccount) as collateral
    await mockERC20.mint(otherAccount.address, hre.ethers.parseEther("500"));

    // Approve 100 tokens for the protocol
    await mockERC20
      .connect(otherAccount)
      .approve(borrowProtocol.getAddress(), hre.ethers.parseEther("100"));

    // Set required protocol parameters
    await borrowProtocol.setMinCollateralAmount(
      mockERC20.getAddress(),
      hre.ethers.parseEther("10")
    );
    await borrowProtocol.setMinimumDuration(3600); // 1 hour
    await borrowProtocol.setLiquidationThreshold(mockERC20.getAddress(), 80); // 80%

    const collateralAmount = hre.ethers.parseEther("100");
    const borrowAmount = hre.ethers.parseEther("50");
    const duration = 7 * 24 * 60 * 60; // 7 days

    // Perform borrow
    const otherAccountBalanceBeforeBorrow = await mockERC20.balanceOf(
      otherAccount.address
    );

    await expect(
      borrowProtocol.connect(otherAccount).Borrow(
        mockERC20.getAddress(),
        collateralAmount,
        mockERC20.getAddress(),
        borrowAmount,
        duration,
        1 // _destinationChainId
      )
    ).to.emit(borrowProtocol, "LoanCreated");

    // Check the loan data
    const loan = await borrowProtocol.getUserLoan(otherAccount.address, 0);
    expect(loan.collateralAmount).to.equal(collateralAmount);
    expect(loan.borrowAmount).to.equal(borrowAmount);
    expect(loan.active).to.be.true;

    // Expect balance in contract to be initial + collateral - borrow
    const expectedBalance = hre.ethers.parseEther("10000") - borrowAmount;

    const actualBalance = await mockERC20.balanceOf(
      borrowProtocol.getAddress()
    );
    expect(actualBalance).to.equal(expectedBalance);
  });

  it("should allow borrowing with native token (ETH)", async () => {
    const { borrowProtocol, owner, otherAccount, yieldPool, xfiMock } =
      await loadFixture(deployBorrowProtocolFixture);

    // Set minimum collateral amount for native token (address(0))
    await borrowProtocol.setMinCollateralAmount(
      hre.ethers.ZeroAddress,
      hre.ethers.parseEther("0.1")
    );
    // Set minimum duration
    await borrowProtocol.setMinimumDuration(3600); // 1 hour

    const collateralAmount = hre.ethers.parseEther("1");
    const borrowAmount = hre.ethers.parseEther("0.5");
    const duration = 7 * 24 * 60 * 60; // 7 days

    await expect(
      borrowProtocol.connect(otherAccount).Borrow(
        hre.ethers.ZeroAddress, // Native token as collateral
        collateralAmount,
        hre.ethers.ZeroAddress, // Native token as borrow token
        borrowAmount,
        duration,
        1, // _destinationChainId
        { value: collateralAmount }
      )
    ).to.emit(borrowProtocol, "LoanCreated");

    const loanId = 0; // First loan created
    const loan = await borrowProtocol.getUserLoan(otherAccount.address, loanId);
    expect(loan.collateralAmount).to.equal(collateralAmount);
    expect(loan.borrowAmount).to.equal(borrowAmount);
    expect(loan.active).to.be.true;

    // Check balances after borrow
    expect(
      await hre.ethers.provider.getBalance(borrowProtocol.getAddress())
    ).to.equal(hre.ethers.parseEther("100") + collateralAmount - borrowAmount);
    // otherAccount's balance will be reduced by collateralAmount and increased by borrowAmount, plus gas fees
  });

  it("should allow repaying a loan with ERC20 tokens", async () => {
    const { borrowProtocol, owner, otherAccount, mockERC20, yieldPool } =
      await loadFixture(deployBorrowProtocolFixture);

    // Fund the YieldPool with mockERC20
    await mockERC20.mint(yieldPool.getAddress(), hre.ethers.parseEther("1000"));
    await yieldPool.setTokenAllowed(mockERC20.getAddress(), true);

    // User (otherAccount) gets some mockERC20 for collateral and repayment
    await mockERC20.mint(otherAccount.address, hre.ethers.parseEther("500"));
    await mockERC20
      .connect(otherAccount)
      .approve(borrowProtocol.getAddress(), hre.ethers.parseEther("200")); // Approve enough for collateral and repayment

    await borrowProtocol.setLiquidationThreshold(mockERC20.getAddress(), 80);

    // Set minimum collateral amount for mockERC20
    await borrowProtocol.setMinCollateralAmount(
      mockERC20.getAddress(),
      hre.ethers.parseEther("10")
    );
    // Set minimum duration
    await borrowProtocol.setMinimumDuration(3600); // 1 hour

    const collateralAmount = hre.ethers.parseEther("100");
    const borrowAmount = hre.ethers.parseEther("50");
    const duration = 7 * 24 * 60 * 60; // 7 days

    await borrowProtocol.connect(otherAccount).Borrow(
      mockERC20.getAddress(),
      collateralAmount,
      mockERC20.getAddress(),
      borrowAmount,
      duration,
      1 // _destinationChainId
    );

    const loanId = 0;
    const totalDue = await borrowProtocol.calculateTotalDue(
      otherAccount.address,
      loanId
    );

    await expect(
      borrowProtocol.connect(otherAccount).payLoan(loanId, 1)
    ).to.emit(borrowProtocol, "LoanRepaid");

    const loan = await borrowProtocol.getUserLoan(otherAccount.address, loanId);
    expect(loan.active).to.be.false; // Loan should be inactive after repayment

    // Check balances after repayment
    // borrowProtocol should have transferred collateral back to otherAccount
    expect(await mockERC20.balanceOf(otherAccount.address)).to.be.closeTo(
      hre.ethers.parseEther("500") + borrowAmount - BigInt(totalDue),
      hre.ethers.parseEther("0.0001") // Allow for small discrepancies due to interest calculation
    );
  });

  it("should allow repaying a loan with native token (ETH)", async () => {
    const { borrowProtocol, owner, otherAccount, yieldPool, xfiMock } =
      await loadFixture(deployBorrowProtocolFixture);

    // Fund the BorrowProtocol with ETH
    await owner.sendTransaction({
      to: borrowProtocol.getAddress(),
      value: hre.ethers.parseEther("1000"),
    });

    await borrowProtocol.setMinCollateralAmount(
      hre.ethers.ZeroAddress,
      hre.ethers.parseEther("0.1")
    );

    await borrowProtocol.setMinimumDuration(3600); // 1 hour

    const collateralAmount = hre.ethers.parseEther("1");
    const borrowAmount = hre.ethers.parseEther("0.5");
    const duration = 7 * 24 * 60 * 60; // 7 days

    await borrowProtocol.connect(otherAccount).Borrow(
      hre.ethers.ZeroAddress,
      collateralAmount,
      hre.ethers.ZeroAddress,
      borrowAmount,
      duration,
      1, // _destinationChainId
      { value: collateralAmount }
    );

    const loanId = 0;
    const loan = await borrowProtocol.getUserLoan(otherAccount.address, loanId);

    // Simulate time passing
    const targetTimestamp = Number(loan.startTime) + duration;
    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [
      targetTimestamp,
    ]);
    await hre.ethers.provider.send("evm_mine", []);

    const initialBalance = await hre.ethers.provider.getBalance(
      otherAccount.address
    );

    // Get correct totalDue (borrow + interest)
    const totalDue = await borrowProtocol.calculateTotalDue(
      otherAccount.address,
      loanId
    );

    const tx = await borrowProtocol
      .connect(otherAccount)
      .payLoan(loanId, 1, { value: totalDue });

    const receipt = await tx.wait();
    const gasUsed = receipt?.gasUsed || 0n;
    const gasPrice = receipt?.gasPrice || 0n;
    const txCost = gasUsed * gasPrice;

    const loanAfter = await borrowProtocol.getUserLoan(
      otherAccount.address,
      loanId
    );

    expect(loanAfter.active).to.equal(false);

    // Check that user got collateral back
    const finalBalance = await hre.ethers.provider.getBalance(
      otherAccount.address
    );
    expect(finalBalance).to.be.closeTo(
      initialBalance - totalDue + collateralAmount - txCost,
      hre.ethers.parseEther("0.01") // account for rounding + gas buffer
    );
  });

  it("should calculate health factor correctly", async () => {
    const { borrowProtocol, mockERC20 } = await loadFixture(
      deployBorrowProtocolFixture
    );
    const collateralAmount = hre.ethers.parseEther("100");
    const borrowAmount = hre.ethers.parseEther("50");
    const liquidationThreshold = 80; // Default for address(0)

    // Set liquidation threshold for mockERC20
    await borrowProtocol.setLiquidationThreshold(
      mockERC20.getAddress(),
      liquidationThreshold
    );

    const healthFactor = await borrowProtocol.calculateHealthFactorSimulated(
      collateralAmount,
      borrowAmount,
      mockERC20.getAddress()
    );
    // (100 * 80) / 50 = 160
    expect(healthFactor).to.equal(160);

    // Test with zero borrow amount
    expect(
      await borrowProtocol.calculateHealthFactorSimulated(
        collateralAmount,
        0,
        mockERC20.getAddress()
      )
    ).to.equal(hre.ethers.MaxUint256);
  });

  it("should calculate total due correctly", async () => {
    const { borrowProtocol, owner, otherAccount, mockERC20, yieldPool } =
      await loadFixture(deployBorrowProtocolFixture);

    // Fund the YieldPool with mockERC20
    await mockERC20.mint(yieldPool.getAddress(), hre.ethers.parseEther("1000"));
    await yieldPool.setTokenAllowed(mockERC20.getAddress(), true);

    // User (otherAccount) gets some mockERC20 for collateral
    await mockERC20.mint(otherAccount.address, hre.ethers.parseEther("500"));
    await mockERC20
      .connect(otherAccount)
      .approve(borrowProtocol.getAddress(), hre.ethers.parseEther("100"));

    // Set minimum collateral amount for mockERC20
    await borrowProtocol.setMinCollateralAmount(
      mockERC20.getAddress(),
      hre.ethers.parseEther("10")
    );

    // Set minimum duration
    await borrowProtocol.setMinimumDuration(3600); // 1 hour

    const collateralAmount = hre.ethers.parseEther("100");
    const borrowAmount = hre.ethers.parseEther("50");
    const duration = 365 * 24 * 60 * 60; // 365 days

    await borrowProtocol.setLiquidationThreshold(mockERC20.getAddress(), 80); // 80%
    await borrowProtocol.setCreditScoreForTesting(otherAccount.address, 900); // Sets interest rate to 5%

    // Perform the borrow
    await borrowProtocol.connect(otherAccount).Borrow(
      mockERC20.getAddress(),
      collateralAmount,
      mockERC20.getAddress(),
      borrowAmount,
      duration,
      1 // _destinationChainId
    );

    const loanId = 0;
    const loan = await borrowProtocol.getUserLoan(otherAccount.address, loanId);
    const interestRate = BigInt(loan.interestRate);
    const borrowAmountBig = BigInt(loan.borrowAmount);
    const durationBig = BigInt(duration);
    const secondsInYear = 365n * 24n * 60n * 60n;

    // Calculate interest
    const interest =
      (borrowAmountBig * interestRate * durationBig) / (10000n * secondsInYear);
    const totalWithoutFee = borrowAmountBig + interest;

    // Get and apply protocol fee
    const protocolFee = await borrowProtocol.getProtocolFee(); // in bps
    const feeAmount = (totalWithoutFee * BigInt(protocolFee)) / 10000n;
    const expectedTotalDue = totalWithoutFee + feeAmount;

    // Simulate time passing
    await time.increase(duration);

    const calculatedTotalDue = await borrowProtocol.calculateTotalDue(
      otherAccount.address,
      loanId
    );

    expect(calculatedTotalDue).to.equal(expectedTotalDue);
  });

  it("should calculate credit score correctly", async () => {
    const { borrowProtocol, owner, otherAccount, mockERC20, yieldPool } =
      await loadFixture(deployBorrowProtocolFixture);

    // Initial credit score should be 300
    expect(await borrowProtocol.getCreditScore(otherAccount.address)).to.equal(
      800
    );

    // Simulate a loan and repayment to affect credit score
    await mockERC20.mint(yieldPool.getAddress(), hre.ethers.parseEther("1000"));
    await yieldPool.setTokenAllowed(mockERC20.getAddress(), true);
    await mockERC20.mint(otherAccount.address, hre.ethers.parseEther("500"));
    await mockERC20
      .connect(otherAccount)
      .approve(borrowProtocol.getAddress(), hre.ethers.parseEther("200"));
    await borrowProtocol.setMinCollateralAmount(
      mockERC20.getAddress(),
      hre.ethers.parseEther("10")
    );
    await borrowProtocol.setMinimumDuration(3600);

    const collateralAmount = hre.ethers.parseEther("100");
    const borrowAmount = hre.ethers.parseEther("50");
    const duration = 7 * 24 * 60 * 60;
    await borrowProtocol.setLiquidationThreshold(mockERC20.getAddress(), 80); // 80%

    await borrowProtocol.connect(otherAccount).Borrow(
      mockERC20.getAddress(),
      collateralAmount,
      mockERC20.getAddress(),
      borrowAmount,
      duration,
      1 // _destinationChainId
    );

    const loanId = 0;
    await borrowProtocol.connect(otherAccount).payLoan(loanId, 1);

    // After one on-time repayment, score should increase
    // The exact score depends on the internal calculation, but it should be > 300
    expect(await borrowProtocol.getCreditScore(otherAccount.address)).to.be.gt(
      800
    );

    // Simulate another loan and late repayment
    await mockERC20.mint(otherAccount.address, hre.ethers.parseEther("200"));
    await mockERC20
      .connect(otherAccount)
      .approve(borrowProtocol.getAddress(), hre.ethers.parseEther("200"));

    await borrowProtocol.connect(otherAccount).Borrow(
      mockERC20.getAddress(),
      collateralAmount,
      mockERC20.getAddress(),
      borrowAmount,
      duration,
      1 // _destinationChainId
    );

    // Fast forward time to simulate late repayment
    await time.increase(duration + 1);

    const loanId2 = 1;
    const scoreBeforeLateRepayment = await borrowProtocol.getCreditScore(
      otherAccount.address
    );
    await borrowProtocol.connect(otherAccount).payLoan(loanId2, 1);

    // After a late repayment, score should decrease compared to previous
    expect(await borrowProtocol.getCreditScore(otherAccount.address)).to.be.lt(
      scoreBeforeLateRepayment
    );
  });

  it("should get user loans", async () => {
    const { borrowProtocol, otherAccount, mockERC20, yieldPool } =
      await loadFixture(deployBorrowProtocolFixture);

    await mockERC20.mint(yieldPool.getAddress(), hre.ethers.parseEther("1000"));
    await yieldPool.setTokenAllowed(mockERC20.getAddress(), true);
    await mockERC20.mint(otherAccount.address, hre.ethers.parseEther("500"));
    await mockERC20
      .connect(otherAccount)
      .approve(borrowProtocol.getAddress(), hre.ethers.parseEther("200"));
    await borrowProtocol.setMinCollateralAmount(
      mockERC20.getAddress(),
      hre.ethers.parseEther("10")
    );
    await borrowProtocol.setMinimumDuration(3600);
    await borrowProtocol.setLiquidationThreshold(mockERC20.getAddress(), 80); // 80%

    // Create first loan
    await borrowProtocol.connect(otherAccount).Borrow(
      mockERC20.getAddress(),
      hre.ethers.parseEther("50"),
      mockERC20.getAddress(),
      hre.ethers.parseEther("25"),
      5200,
      1 // _destinationChainId
    );

    // Create second loan
    await borrowProtocol.connect(otherAccount).Borrow(
      mockERC20.getAddress(),
      hre.ethers.parseEther("50"),
      mockERC20.getAddress(),
      hre.ethers.parseEther("25"),
      7200,
      1 // _destinationChainId
    );

    const userLoans = await borrowProtocol.getUserLoans(otherAccount.address);
    expect(userLoans.length).to.equal(2);
    expect(userLoans[0].loanId).to.equal(0);
    expect(userLoans[1].loanId).to.equal(1);
  });

  it("should get yield pool address", async () => {
    const { borrowProtocol, yieldPool } = await loadFixture(
      deployBorrowProtocolFixture
    );
    expect(await borrowProtocol.getYieldPool()).to.equal(
      await yieldPool.getAddress()
    );
  });

  it("should get credit profile", async () => {
    const { borrowProtocol, otherAccount } = await loadFixture(
      deployBorrowProtocolFixture
    );
    const creditProfile = await borrowProtocol.getCreditProfile(
      otherAccount.address
    );
    expect(creditProfile.totalBorrowed).to.equal(0);
    expect(creditProfile.totalRepaid).to.equal(0);
    expect(creditProfile.activeLoans).to.equal(0);
    expect(creditProfile.onTimeRepayments).to.equal(0);
    expect(creditProfile.lateRepayments).to.equal(0);
    expect(creditProfile.score).to.equal(800); // Initial score
  });

  it("should get minimum health factor", async () => {
    const { borrowProtocol } = await loadFixture(deployBorrowProtocolFixture);
    expect(await borrowProtocol.getMinHealthFactor()).to.equal(150);
  });

  it("should get protocol fee", async () => {
    const { borrowProtocol } = await loadFixture(deployBorrowProtocolFixture);
    expect(await borrowProtocol.getProtocolFee()).to.equal(200);
  });

  it("should get treasury address", async () => {
    const { borrowProtocol, owner } = await loadFixture(
      deployBorrowProtocolFixture
    );
    expect(await borrowProtocol.getTreasury()).to.equal(owner.address);
  });

  it("should get current loan id", async () => {
    const { borrowProtocol } = await loadFixture(deployBorrowProtocolFixture);
    expect(await borrowProtocol.getCurrentLoanId()).to.equal(0);
  });

  it("should get minimum duration", async () => {
    const { borrowProtocol } = await loadFixture(deployBorrowProtocolFixture);
    // Initial minimum duration is 0, as it's not set in constructor
    expect(await borrowProtocol.getMinimumDuration()).to.equal(0);
  });

  it("should get liquidation threshold", async () => {
    const { borrowProtocol } = await loadFixture(deployBorrowProtocolFixture);
    // Default for address(0) is 80
    expect(
      await borrowProtocol.getLiquidationThreshold(hre.ethers.ZeroAddress)
    ).to.equal(80);
  });

  it("should get minimum collateral amount", async () => {
    const { borrowProtocol } = await loadFixture(deployBorrowProtocolFixture);
    // Default for address(0) is 1 ether
    expect(
      await borrowProtocol.getMinimumCollateralAmount(hre.ethers.ZeroAddress)
    ).to.equal(hre.ethers.parseEther("1"));
  });

  it("should get user loan ids", async () => {
    const { borrowProtocol, otherAccount, mockERC20, yieldPool } =
      await loadFixture(deployBorrowProtocolFixture);

    await mockERC20.mint(yieldPool.getAddress(), hre.ethers.parseEther("1000"));
    await yieldPool.setTokenAllowed(mockERC20.getAddress(), true);
    await mockERC20.mint(otherAccount.address, hre.ethers.parseEther("500"));
    await mockERC20
      .connect(otherAccount)
      .approve(borrowProtocol.getAddress(), hre.ethers.parseEther("200"));
    await borrowProtocol.setMinCollateralAmount(
      mockERC20.getAddress(),
      hre.ethers.parseEther("10")
    );
    await borrowProtocol.setMinimumDuration(3600);
    await borrowProtocol.setLiquidationThreshold(mockERC20.getAddress(), 80); // 80%

    await borrowProtocol.connect(otherAccount).Borrow(
      mockERC20.getAddress(),
      hre.ethers.parseEther("50"),
      mockERC20.getAddress(),
      hre.ethers.parseEther("25"),
      5200,
      1 // _destinationChainId
    );

    await borrowProtocol.connect(otherAccount).Borrow(
      mockERC20.getAddress(),
      hre.ethers.parseEther("50"),
      mockERC20.getAddress(),
      hre.ethers.parseEther("25"),
      7200,
      1 // _destinationChainId
    );

    const userLoanIds = await borrowProtocol.getUserLoanIds(
      otherAccount.address
    );
    expect(userLoanIds.length).to.equal(2);
    expect(userLoanIds[0]).to.equal(0);
    expect(userLoanIds[1]).to.equal(1);
  });

  it("should get a specific user loan", async () => {
    const { borrowProtocol, otherAccount, mockERC20, yieldPool } =
      await loadFixture(deployBorrowProtocolFixture);

    await mockERC20.mint(yieldPool.getAddress(), hre.ethers.parseEther("1000"));
    await yieldPool.setTokenAllowed(mockERC20.getAddress(), true);
    await mockERC20.mint(otherAccount.address, hre.ethers.parseEther("500"));
    await mockERC20
      .connect(otherAccount)
      .approve(borrowProtocol.getAddress(), hre.ethers.parseEther("200"));
    await borrowProtocol.setMinCollateralAmount(
      mockERC20.getAddress(),
      hre.ethers.parseEther("10")
    );
    await borrowProtocol.setMinimumDuration(3600);
    await borrowProtocol.setLiquidationThreshold(mockERC20.getAddress(), 80); // 80%

    await borrowProtocol.connect(otherAccount).Borrow(
      mockERC20.getAddress(),
      hre.ethers.parseEther("50"),
      mockERC20.getAddress(),
      hre.ethers.parseEther("25"),
      5200,
      1 // _destinationChainId
    );

    const loan = await borrowProtocol.getUserLoan(otherAccount.address, 0);
    expect(loan.loanId).to.equal(0);
    expect(loan.collateralAmount).to.equal(hre.ethers.parseEther("50"));
  });

  it("should allow owner to fund pool", async () => {
    const { borrowProtocol, owner, mockERC20 } = await loadFixture(
      deployBorrowProtocolFixture
    );
    await mockERC20.mint(owner.address, hre.ethers.parseEther("100")); // Owner needs tokens to fund
    await mockERC20
      .connect(owner)
      .approve(borrowProtocol.getAddress(), hre.ethers.parseEther("100"));

    const fundAmount = hre.ethers.parseEther("50");
    await expect(
      borrowProtocol.connect(owner).fundPool(mockERC20.getAddress(), fundAmount)
    ).to.emit(borrowProtocol, "PoolFunded");
    expect(await mockERC20.balanceOf(borrowProtocol.getAddress())).to.equal(
      hre.ethers.parseEther("10000") + fundAmount
    );
  });

  it("should allow liquidation of unhealthy loan", async () => {
    const {
      borrowProtocol,
      owner,
      otherAccount,
      developerAccount,
      mockERC20,
      yieldPool,
    } = await loadFixture(deployBorrowProtocolFixture);

    await mockERC20.mint(yieldPool.getAddress(), hre.ethers.parseEther("1000"));
    await yieldPool.setTokenAllowed(mockERC20.getAddress(), true);

    await mockERC20.mint(otherAccount.address, hre.ethers.parseEther("500"));
    await mockERC20
      .connect(otherAccount)
      .approve(borrowProtocol.getAddress(), hre.ethers.parseEther("100"));

    await borrowProtocol.setMinCollateralAmount(
      mockERC20.getAddress(),
      hre.ethers.parseEther("10")
    );
    await borrowProtocol.setMinimumDuration(3600);

    // Lower score
    await borrowProtocol.setCreditScoreForTesting(otherAccount.address, 580); // requires health factor = 140
    await borrowProtocol.setLiquidationThreshold(mockERC20.getAddress(), 100); // max allowed

    const collateralAmount = hre.ethers.parseEther("100");
    const borrowAmount = hre.ethers.parseEther("71"); // Health factor = 100 * 100 / 71 = ~140.84 (passes)

    await borrowProtocol.connect(otherAccount).Borrow(
      mockERC20.getAddress(),
      collateralAmount,
      mockERC20.getAddress(),
      borrowAmount,
      7 * 24 * 60 * 60,
      1 // _destinationChainId
    );

    // Fast-forward time to increase totalDue (and reduce health factor)
    await time.increase(60 * 60 * 24 * 30); // 30 days

    const loanId = 0;

    await expect(
      borrowProtocol
        .connect(developerAccount)
        .liquidate(otherAccount.address, loanId)
    ).to.emit(borrowProtocol, "LoanLiquidated");
  });
});
