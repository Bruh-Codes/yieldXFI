import { expect } from "chai";
import hre, { ethers } from 'hardhat'
import { BorrowProtocol, BorrowProtocol__factory, MockERC20, MockERC20__factory, YieldPool, YieldPool__factory, YieldToken, YieldToken__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe('BorrowProtocol', function () {
    let BorrowProtocol: BorrowProtocol;
    let BorrowProtocolFactory: BorrowProtocol__factory;
    let YieldPool: YieldPool;
    let owner: SignerWithAddress;
    let otherAccount: SignerWithAddress;
    let YieldPoolFactory: YieldPool__factory;
    let YieldToken: YieldToken;
    let YieldTokenFactory: YieldToken__factory;
    let AnotherToken: MockERC20;
    let AnotherTokenFactory: MockERC20__factory;

    const tokenName = "YieldEDU";
    const tokenSymbol = "YDU";
    const yieldRate = 10;
    const minDuration = 86400;
    const maxDuration = 31536000;

    beforeEach(async () => {
        [owner, otherAccount] = await hre.ethers.getSigners();

        YieldTokenFactory = await hre.ethers.getContractFactory("YieldToken");
        YieldPoolFactory = await hre.ethers.getContractFactory("YieldPool");
        BorrowProtocolFactory = await hre.ethers.getContractFactory("BorrowProtocol");
        AnotherTokenFactory = await hre.ethers.getContractFactory("MockERC20");

        YieldToken = await YieldTokenFactory.deploy(owner.address, tokenName, tokenSymbol);
        AnotherToken = await AnotherTokenFactory.deploy("AnotherToken", "ATK");

        YieldPool = await YieldPoolFactory.deploy(await YieldToken.getAddress(), yieldRate, minDuration, maxDuration, 0);
        await YieldToken.transferOwnership(await YieldPool.getAddress());

        BorrowProtocol = await BorrowProtocolFactory.deploy(await YieldPool.getAddress(), await YieldToken.getAddress(), owner.address);

        await YieldPool.addAllowedTokens(await AnotherToken.getAddress());
        await BorrowProtocol.setLiquidationThreshold(await AnotherToken.getAddress(), 80);
        await BorrowProtocol.setMinCollateralAmount(await AnotherToken.getAddress(), ethers.parseEther('1'));
        await BorrowProtocol.setLiquidationThreshold(ethers.ZeroAddress, 80);
        await BorrowProtocol.setMinCollateralAmount(ethers.ZeroAddress, ethers.parseEther('1'));

        // Mint tokens to owner and otherAccount before approving
        await AnotherToken.mint(owner.address, ethers.parseEther('1000000'));
        await AnotherToken.mint(otherAccount.address, ethers.parseEther('1000000'));

        // Approve a very large amount for BorrowProtocol to spend from owner and otherAccount
        await AnotherToken.approve(await BorrowProtocol.getAddress(), ethers.MaxUint256);
        await AnotherToken.connect(otherAccount).approve(await BorrowProtocol.getAddress(), ethers.MaxUint256);
    });

    it('updates the setMinHealthFactor',async()=> {
        await BorrowProtocol.setMinHealthFactor(2);
        const minHealthFactor = await BorrowProtocol.getMinHealthFactor();
        expect(minHealthFactor).to.be.equal(2)


    })

    it("reverts when liquidationThreshold is greater than 100%",async()=> {
        await expect( BorrowProtocol.setLiquidationThreshold(YieldToken,150)).to.be.revertedWith('Threshold must be <= 100%');
        expect(await BorrowProtocol.getLiquidationThreshold(YieldToken)).to.be.equal(80)
    })
    it("updates liquidationThreshold",async()=> {
        await BorrowProtocol.setLiquidationThreshold(YieldToken,90);
        expect(await BorrowProtocol.getLiquidationThreshold(YieldToken)).to.be.equal(90)
    })

    it("updates minCollateralAmount", async()=> {
        expect(await BorrowProtocol.getMinCollateralAmount(YieldToken)).to.be.equal(ethers.parseEther('1'));
        await BorrowProtocol.setMinCollateralAmount(YieldToken,ethers.parseEther('2'));
        expect(await BorrowProtocol.getMinCollateralAmount(YieldToken)).to.be.equal(ethers.parseEther('2'));
    })

    it('Updates the minimum duration for all token being staked',async()=> {
        const oneDays = 86400;
        const twoDays = oneDays * 2; 
        expect(await BorrowProtocol.getMinimumDuration()).to.be.equal((oneDays));
        await BorrowProtocol.setMinimumDuration(twoDays);
        expect(await BorrowProtocol.getMinimumDuration()).to.be.equal((twoDays));
    })

    it('calculates the healthFactor',async()=> {
        const collateralAmount1 = ethers.parseEther('1');
        const collateralAmount2 = ethers.parseEther('2');
        const borrowAmount = ethers.parseEther('5');
        expect(await BorrowProtocol.calculateHealthFactorSimulated(collateralAmount1,borrowAmount,await YieldToken.getAddress())).to.be.equal(16)
        expect(await BorrowProtocol.calculateHealthFactorSimulated(collateralAmount2,borrowAmount,await YieldToken.getAddress())).to.be.equal(32)
    })


    it("reverts when borrows token or collateral token is not allowed", async () => {
        await YieldPool.removeAllowedToken(await AnotherToken.getAddress());
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;

        await expect(BorrowProtocol.Borrow(AnotherToken, collateralAmount, AnotherToken, borrowAmount, duration, interestRate))
            .to.be.revertedWith('collateralToken not allowed');
    });
    it("reverts when interest rate is invalid", async () => {
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 0;

        await expect(BorrowProtocol.Borrow(AnotherToken, collateralAmount, AnotherToken, borrowAmount, duration, interestRate))
            .to.be.revertedWith('invalid interest rate');
    });

    it("reverts when minimum collateral is too low", async () => {
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount = ethers.parseEther('0.5');
        const duration = 86400;
        const interestRate = 10;

        await AnotherToken.mint(owner.address, borrowAmount);
        await AnotherToken.approve(await BorrowProtocol.getAddress(), borrowAmount);
        await BorrowProtocol.fundPool(await AnotherToken.getAddress(), borrowAmount);

        await AnotherToken.mint(owner.address, collateralAmount);
        await AnotherToken.approve(await BorrowProtocol.getAddress(), collateralAmount);

        await expect(BorrowProtocol.Borrow(await AnotherToken.getAddress(), collateralAmount, await AnotherToken.getAddress(), borrowAmount, duration, interestRate))
            .to.be.revertedWith('collateral too low');
    });

    it("Borrows a token successfully and updates user loan", async () => {
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;
        const loanId = 0;

        await BorrowProtocol.fundPool(await AnotherToken.getAddress(), borrowAmount);

        await expect(BorrowProtocol.Borrow(await AnotherToken.getAddress(), collateralAmount, await AnotherToken.getAddress(), borrowAmount, duration, interestRate))
            .to.emit(BorrowProtocol, 'LoanCreated').withArgs(owner.address, loanId, borrowAmount, await AnotherToken.getAddress(), duration)
            .to.emit(BorrowProtocol, 'CollateralDeposited').withArgs(owner.address, await AnotherToken.getAddress(), collateralAmount);

        const userLoan = await BorrowProtocol.getUserLoans(owner.address);

        expect(userLoan.length).to.be.equal(1);
        expect(userLoan[0].loanId).to.be.equal(loanId);
        expect(userLoan[0].collateralAmount).to.be.equal(collateralAmount);
        expect(userLoan[0].collateralToken).to.be.equal(await AnotherToken.getAddress());
        expect(userLoan[0].borrowToken).to.be.equal(await AnotherToken.getAddress());
        expect(userLoan[0].borrowAmount).to.be.equal(borrowAmount);
        expect(userLoan[0].duration).to.be.equal(duration);
        expect(userLoan[0].interestRate).to.be.equal(interestRate);
        expect(userLoan[0].userAddress).to.be.equal(owner.address);
        expect(userLoan[0].active).to.be.equal(true);
    });

    it("allows a user to take multiple loans", async () => {
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;

        // First loan
        await BorrowProtocol.fundPool(await AnotherToken.getAddress(), borrowAmount);
        await BorrowProtocol.Borrow(await AnotherToken.getAddress(), collateralAmount, await AnotherToken.getAddress(), borrowAmount, duration, interestRate);

        // Second loan
        await BorrowProtocol.Borrow(await AnotherToken.getAddress(), collateralAmount, await AnotherToken.getAddress(), borrowAmount, duration, interestRate);

        const userLoans = await BorrowProtocol.getUserLoans(owner.address);
        expect(userLoans.length).to.be.equal(2);
        expect(userLoans[0].loanId).to.be.equal(0);
        expect(userLoans[1].loanId).to.be.equal(1);
    });

    it('gets all active loans and user-specific loans', async () => {
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;

        // Owner's loan
        await BorrowProtocol.fundPool(await AnotherToken.getAddress(), borrowAmount);
        await BorrowProtocol.Borrow(await AnotherToken.getAddress(), collateralAmount, await AnotherToken.getAddress(), borrowAmount, duration, interestRate);

        // OtherAccount's loan
        await BorrowProtocol.fundPool(await AnotherToken.getAddress(), borrowAmount);
        await BorrowProtocol.connect(otherAccount).Borrow(await AnotherToken.getAddress(), collateralAmount, await AnotherToken.getAddress(), borrowAmount, duration, interestRate);

        const allActiveLoans = await BorrowProtocol.getAllActiveLoans();
        const ownerLoans = await BorrowProtocol.getUserLoans(owner.address);
        const otherAccountLoans = await BorrowProtocol.getUserLoans(otherAccount.address);

        expect(allActiveLoans.length).to.be.equal(2);
        expect(ownerLoans.length).to.be.equal(1);
        expect(otherAccountLoans.length).to.be.equal(1);
        expect(ownerLoans[0].userAddress).to.be.equal(owner.address);
        expect(otherAccountLoans[0].userAddress).to.be.equal(otherAccount.address);
    });

    it('calculates the total due amount and successfully pays a loan', async () => {
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;
        const loanId = 0;

        await BorrowProtocol.fundPool(await AnotherToken.getAddress(), borrowAmount);
        await BorrowProtocol.Borrow(await AnotherToken.getAddress(), collateralAmount, await AnotherToken.getAddress(), borrowAmount, duration, interestRate);

        const totalDue = await BorrowProtocol.calculateTotalDue(owner.address, loanId);
        await AnotherToken.mint(owner.address, totalDue);
        await AnotherToken.approve(await BorrowProtocol.getAddress(), totalDue);

        await expect(BorrowProtocol.payLoan(loanId))
            .to.emit(BorrowProtocol, 'LoanRepaid').withArgs(owner.address, loanId, totalDue)
            .to.emit(BorrowProtocol, 'ActiveLoanUpdated').withArgs(loanId, false);

        const userLoan = await BorrowProtocol.getUserLoans(owner.address);
        expect(userLoan[0].active).to.be.false;
    });

    it("should successfully fund pool with a corresponding token", async () => {
        const amount = ethers.parseEther('1000');
        const tokenAddress = await AnotherToken.getAddress();
        await AnotherToken.mint(owner.address, amount);
        await AnotherToken.approve(await BorrowProtocol.getAddress(), amount);
        await expect(BorrowProtocol.fundPool(tokenAddress, amount))
            .to.emit(BorrowProtocol, "PoolFunded").withArgs(owner.address, tokenAddress, amount);
    });

    it("should successfully fund native pool", async () => {
        const amount = ethers.parseEther('10');
        await expect(BorrowProtocol.fundNativePool({ value: amount }))
            .to.emit(BorrowProtocol, "PoolFunded").withArgs(owner.address, ethers.ZeroAddress, amount);
    });

    it("Borrows native token as collateral and ERC20 as borrow token successfully", async () => {
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;
        const loanId = 0;

        await BorrowProtocol.fundPool(await AnotherToken.getAddress(), borrowAmount);

        await expect(BorrowProtocol.borrowNative(ethers.ZeroAddress, collateralAmount, await AnotherToken.getAddress(), borrowAmount, duration, interestRate, { value: collateralAmount }))
            .to.emit(BorrowProtocol, 'LoanCreated').withArgs(owner.address, loanId, borrowAmount, await AnotherToken.getAddress(), duration)
            .to.emit(BorrowProtocol, 'CollateralDeposited').withArgs(owner.address, ethers.ZeroAddress, collateralAmount);

        const userLoan = await BorrowProtocol.getUserLoans(owner.address);

        expect(userLoan.length).to.be.equal(1);
        expect(userLoan[0].loanId).to.be.equal(loanId);
        expect(userLoan[0].collateralAmount).to.be.equal(collateralAmount);
        expect(userLoan[0].collateralToken).to.be.equal(ethers.ZeroAddress);
        expect(userLoan[0].borrowToken).to.be.equal(await AnotherToken.getAddress());
        expect(userLoan[0].borrowAmount).to.be.equal(borrowAmount);
        expect(userLoan[0].duration).to.be.equal(duration);
        expect(userLoan[0].interestRate).to.be.equal(interestRate);
        expect(userLoan[0].userAddress).to.be.equal(owner.address);
        expect(userLoan[0].active).to.be.equal(true);
    });

    it("Borrows native token as collateral and native token as borrow token successfully", async () => {
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;
        const loanId = 0;

        await BorrowProtocol.fundNativePool({ value: borrowAmount });

        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
        const initialContractBalance = await ethers.provider.getBalance(await BorrowProtocol.getAddress());

        await expect(BorrowProtocol.borrowNative(ethers.ZeroAddress, collateralAmount, ethers.ZeroAddress, borrowAmount, duration, interestRate, { value: collateralAmount }))
            .to.emit(BorrowProtocol, 'LoanCreated').withArgs(owner.address, loanId, borrowAmount, ethers.ZeroAddress, duration)
            .to.emit(BorrowProtocol, 'CollateralDeposited').withArgs(owner.address, ethers.ZeroAddress, collateralAmount);

        const userLoan = await BorrowProtocol.getUserLoans(owner.address);

        expect(userLoan.length).to.be.equal(1);
        expect(userLoan[0].loanId).to.be.equal(loanId);
        expect(userLoan[0].collateralAmount).to.be.equal(collateralAmount);
        expect(userLoan[0].collateralToken).to.be.equal(ethers.ZeroAddress);
        expect(userLoan[0].borrowToken).to.be.equal(ethers.ZeroAddress);
        expect(userLoan[0].borrowAmount).to.be.equal(borrowAmount);
        expect(userLoan[0].duration).to.be.equal(duration);
        expect(userLoan[0].interestRate).to.be.equal(interestRate);
        expect(userLoan[0].userAddress).to.be.equal(owner.address);
        expect(userLoan[0].active).to.be.equal(true);

        // Check balances after borrowing native token
        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        const finalContractBalance = await ethers.provider.getBalance(await BorrowProtocol.getAddress());

        // Owner's balance should increase by borrowAmount, minus gas for the transaction
        expect(finalOwnerBalance).to.be.closeTo(initialOwnerBalance - collateralAmount + borrowAmount, ethers.parseEther('0.1'));
        // Contract's balance should decrease by borrowAmount, plus collateralAmount
        expect(finalContractBalance).to.be.closeTo(initialContractBalance - borrowAmount + collateralAmount, ethers.parseEther('0.1'));
    });

    it('calculates the total due amount and successfully pays a native loan', async () => {
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;
        const loanId = 0;

        await BorrowProtocol.fundNativePool({ value: borrowAmount });
        await BorrowProtocol.borrowNative(ethers.ZeroAddress, collateralAmount, ethers.ZeroAddress, borrowAmount, duration, interestRate, { value: collateralAmount });

        const totalDue = await BorrowProtocol.calculateTotalDue(owner.address, loanId);

        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
        const initialContractBalance = await ethers.provider.getBalance(await BorrowProtocol.getAddress());

        await expect(BorrowProtocol.payLoan(loanId, { value: totalDue }))
            .to.emit(BorrowProtocol, 'LoanRepaid').withArgs(owner.address, loanId, totalDue)
            .to.emit(BorrowProtocol, 'ActiveLoanUpdated').withArgs(loanId, false);

        const userLoan = await BorrowProtocol.getUserLoans(owner.address);
        expect(userLoan[0].active).to.be.false;

        // Check balances after repaying native loan
        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        const finalContractBalance = await ethers.provider.getBalance(await BorrowProtocol.getAddress());

        // Owner's balance should decrease by totalDue (repayment) and increase by collateralAmount (returned collateral)
        expect(finalOwnerBalance).to.be.closeTo(initialOwnerBalance - totalDue + collateralAmount, ethers.parseEther('0.01'));
        // Contract's balance should increase by totalDue (repayment) and decrease by collateralAmount (returned collateral)
        expect(finalContractBalance).to.be.closeTo(initialContractBalance + totalDue - collateralAmount, ethers.parseEther('0.01'));
    });

    it("should allow liquidation of native loan based on duration expiry", async () => {
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount = ethers.parseEther('10');
        const duration = 86400; // 1 day
        const interestRate = 10;

        await BorrowProtocol.fundNativePool({ value: borrowAmount });
        await BorrowProtocol.borrowNative(ethers.ZeroAddress, collateralAmount, ethers.ZeroAddress, borrowAmount, duration, interestRate, { value: collateralAmount });
        const userLoans = await BorrowProtocol.getUserLoans(owner.address);
        const loanId = userLoans[0].loanId;

        // Fast-forward time past the loan duration
        await hre.ethers.provider.send('evm_increaseTime', [duration + 1]);
        await hre.ethers.provider.send('evm_mine', []);

        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
        const initialContractBalance = await ethers.provider.getBalance(await BorrowProtocol.getAddress());

        // Liquidate the loan
        await expect(BorrowProtocol.liquidate(owner.address, loanId))
            .to.emit(BorrowProtocol, 'LoanLiquidated')
            .withArgs(owner.address, loanId, owner.address);

        const updatedLoan = (await BorrowProtocol.getUserLoans(owner.address))[0];
        expect(updatedLoan.active).to.be.false;

        // Check balances after liquidation
        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        const finalContractBalance = await ethers.provider.getBalance(await BorrowProtocol.getAddress());

        // Owner's balance should increase by collateralAmount (seized collateral)
        expect(finalOwnerBalance).to.be.closeTo(initialOwnerBalance + collateralAmount, ethers.parseEther('0.001'));
        // Contract's balance should decrease by collateralAmount (seized collateral)
        expect(finalContractBalance).to.be.closeTo(initialContractBalance - collateralAmount, ethers.parseEther('0.001'));
    });

    it("reverts when trying to interact with an expired loan", async () => {
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount = ethers.parseEther('10');
        const duration = 86400; // 1 day
        const interestRate = 10;

        await BorrowProtocol.fundPool(await AnotherToken.getAddress(), borrowAmount);
        await BorrowProtocol.Borrow(await AnotherToken.getAddress(), collateralAmount, await AnotherToken.getAddress(), borrowAmount, duration, interestRate);
        const userLoans = await BorrowProtocol.getUserLoans(owner.address);

        // Wait for the loan to expire (1 day)
        await hre.ethers.provider.send('evm_increaseTime', [86400]);
        await hre.ethers.provider.send('evm_mine', []);

        // Try to interact with the loan after it has expired
        await expect(BorrowProtocol.payLoan(userLoans[0].loanId))
            .to.be.revertedWith('Loan expired');
    });

    it("reverts when trying to borrow YieldToken", async () => {
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;

        await AnotherToken.mint(owner.address, collateralAmount);
        await AnotherToken.approve(await BorrowProtocol.getAddress(), collateralAmount);

        await expect(
            BorrowProtocol.Borrow(await AnotherToken.getAddress(), collateralAmount, await YieldToken.getAddress(), borrowAmount, duration, interestRate)
        ).to.be.revertedWith('Cannot borrow YieldToken');
    });

    it("should allow liquidation based on duration expiry", async () => {
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount = ethers.parseEther('10');
        const duration = 86400; // 1 day
        const interestRate = 10;

        await BorrowProtocol.fundPool(await AnotherToken.getAddress(), borrowAmount);
        await BorrowProtocol.Borrow(await AnotherToken.getAddress(), collateralAmount, await AnotherToken.getAddress(), borrowAmount, duration, interestRate);
        const userLoans = await BorrowProtocol.getUserLoans(owner.address);
        const loanId = userLoans[0].loanId;

        // Fast-forward time past the loan duration
        await hre.ethers.provider.send('evm_increaseTime', [duration + 1]);
        await hre.ethers.provider.send('evm_mine', []);

        // Liquidate the loan
        await expect(BorrowProtocol.liquidate(owner.address, loanId))
            .to.emit(BorrowProtocol, 'LoanLiquidated')
            .withArgs(owner.address, loanId, owner.address);

        const updatedLoan = (await BorrowProtocol.getUserLoans(owner.address))[0];
        expect(updatedLoan.active).to.be.false;
    });

    it("should batch liquidate multiple loans", async () => {
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount = ethers.parseEther('10');
        const duration = 86400; // 1 day
        const interestRate = 10;

        // Loan 1 (owner) - eligible by duration
        await BorrowProtocol.fundPool(await AnotherToken.getAddress(), borrowAmount);
        await BorrowProtocol.Borrow(await AnotherToken.getAddress(), collateralAmount, await AnotherToken.getAddress(), borrowAmount, duration, interestRate);
        const loan1Id = (await BorrowProtocol.getUserLoans(owner.address))[0].loanId;

        // Loan 2 (otherAccount) - eligible by duration
        await BorrowProtocol.fundPool(await AnotherToken.getAddress(), borrowAmount);
        await BorrowProtocol.connect(otherAccount).Borrow(await AnotherToken.getAddress(), collateralAmount, await AnotherToken.getAddress(), borrowAmount, duration, interestRate);
        const loan2Id = (await BorrowProtocol.getUserLoans(otherAccount.address))[0].loanId;

        // Fast-forward time for both loans
        await hre.ethers.provider.send('evm_increaseTime', [duration + 1]);
        await hre.ethers.provider.send('evm_mine', []);

        // Loan 3 (owner) - not eligible (created after time fast-forward)
        await BorrowProtocol.fundPool(await AnotherToken.getAddress(), borrowAmount);
        await BorrowProtocol.Borrow(await AnotherToken.getAddress(), collateralAmount, await AnotherToken.getAddress(), borrowAmount, duration, interestRate);
        const loan3Id = (await BorrowProtocol.getUserLoans(owner.address))[1].loanId;

        // Prepare for batch liquidation
        const usersToLiquidate = [owner.address, otherAccount.address];
        const loanIdsToLiquidate = [loan1Id, loan2Id];

        // Perform batch liquidation
        await expect(BorrowProtocol.batchLiquidate(usersToLiquidate, loanIdsToLiquidate)).to.not.be.reverted;

        // Assertions
        expect((await BorrowProtocol.getUserLoans(owner.address))[0].active).to.be.false; // loan1
        expect((await BorrowProtocol.getUserLoans(otherAccount.address))[0].active).to.be.false; // loan2
        expect((await BorrowProtocol.getUserLoans(owner.address))[1].active).to.be.true; // loan3
    });
});