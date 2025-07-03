// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IYieldPool {
    function isTokenAllowed(address _address) external view returns (bool);
    function addYield(address token, uint256 amount) external;
}

interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint256 value) external returns (bool);
    function withdraw(uint256) external;
}



/**
 * @title BorrowProtocol
 * @author Kamasah Dickson
 * @notice This contract allows users to take out loans by providing collateral.
 * It interacts with a YieldPool to determine which tokens are allowed for collateral and borrowing.
 * The contract manages loans, credit profiles, and liquidations.
 */


contract BorrowProtocol is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    /// @notice The address of the YieldPool contract.
    IYieldPool private yieldPool;

    /// @notice Represents a loan in the protocol.
    struct Loan {
        uint256 loanId;
        uint256 collateralAmount;
        address collateralToken;
        address borrowToken;
        uint256 borrowAmount;
        uint256 duration;
        uint256 startTime;
        uint256 interestRate;
        address userAddress;
        uint256 amountPaid;
        bool active;
    }

    /// @notice Represents a user's credit profile.
    struct CreditProfile {
        uint256 totalBorrowed;
        uint256 totalRepaid;
        uint256 activeLoans;
        uint256 onTimeRepayments;
        uint256 lateRepayments;
        uint256 lastUpdated;
        uint256 score; // 0 - 1000
    }

    enum CreditScoreTier {
        Poor,
        Fair,
        Good,
        Excellent
    }

    /// @notice Maps a user's address to their loans.
    mapping(address => mapping(uint256 => Loan)) userLoans;
    /// @notice Maps a user's address to their credit profile.
    mapping(address => CreditProfile) private creditProfiles;
    /// @notice Maps a token address to its liquidation threshold.
    mapping(address => uint256) private liquidationThresholds;
    /// @notice Maps a user's address to their loan IDs.
    mapping(address => uint256[]) private userLoanIds;
    /// @notice Maps a token address to its minimum collateral amount.
    mapping(address => uint256) private minimumCollateralAmount;

    /// @notice The minimum health factor required to take out a loan.
    uint256 private minHealthFactor = 150;
    /// @notice The protocol fee in basis points (e.g., 100 = 1%).
    uint256 private protocolFee;
    /// @notice The address where protocol fees are sent.
    address private treasury;
    /// @notice The current loan ID.
    uint256 private currentLoanId;
    uint256 private minimumDuration;

    

    /// @notice Emitted when collateral is deposited.
    event CollateralDeposited(address indexed user, address indexed token, uint256 amount);
    /// @notice Emitted when a loan is created.
    event LoanCreated(address indexed user, uint256 loanId, uint256 amount, address token, uint256 duration);
    /// @notice Emitted when a loan is repaid.
    event LoanRepaid(address indexed user, uint256 loanId, uint256 amount);
    /// @notice Emitted when the pool is funded.
    event PoolFunded(address indexed funder, address indexed token, uint256 amount);
    /// @notice Emitted when collateral is withdrawn.
    event CollateralWithdrawn(address indexed user, uint256 loanId, uint256 amount);
    /// @notice Emitted when a loan is liquidated.
    event LoanLiquidated(address indexed user, uint256 loanId, address liquidator);
    /// @notice Emitted when an active loan is updated.
    event ActiveLoanUpdated(uint256 loanId, bool active);
    /// @notice Emitted when protocol fees are collected.
    event ProtocolFeeCollected(address indexed token, uint256 amount, address indexed to);

    /**
     * @notice Constructs the BorrowProtocol contract.
     * @param _yieldPoolAddress The address of the YieldPool contract.
     * @param _owner The address of the owner.
     */
    constructor(address _yieldPoolAddress, address _owner) Ownable(_owner) {
        yieldPool = IYieldPool(_yieldPoolAddress);
        liquidationThresholds[address(0)] = 80;
        minimumCollateralAmount[address(0)] = 1 ether;
        protocolFee = 200; // 2% fee
        treasury = _owner; // Initialize treasury to owner's address
    }

    function setYieldPool(address _yieldPoolAddress) external onlyOwner {
        yieldPool = IYieldPool(_yieldPoolAddress);
    }

    /**
     * @notice Sets the minimum health factor.
     * @param _minHealthFactor The new minimum health factor.
     */
    function setMinHealthFactor(uint256 _minHealthFactor) external onlyOwner {
        minHealthFactor = _minHealthFactor;
    }

    /**
     * @notice Sets the liquidation threshold for a token.
     * @param token The address of the token.
     * @param threshold The new liquidation threshold (must be <= 100).
     */
    function setLiquidationThreshold(address token, uint256 threshold) external onlyOwner {
        require(threshold <= 100, "Threshold must be <= 100%");
        liquidationThresholds[token] = threshold;
    }


    /**
     * @notice Sets the minimum collateral amount for a yield token.
     * @param _token The address of the token's collateral being modified.
     * @param _minimumCollateralAmount The new minimum collateral amount.
     */
    function setMinCollateralAmount(address _token, uint256 _minimumCollateralAmount) external onlyOwner {
        minimumCollateralAmount[_token] = _minimumCollateralAmount;
    }

    /**
     * @notice Gets the minimum collateral amount for a token.
     * @param _tokenAddress The address of the token.
     * @return The minimum collateral amount.
     */
    function getMinCollateralAmount(address _tokenAddress) public view returns (uint256) {
        return minimumCollateralAmount[_tokenAddress];
    }

    /**
     * @notice Sets the minimum duration for a loan.
     * @param _minimumDuration The new minimum duration.
     */
    function setMinimumDuration(uint256 _minimumDuration) external onlyOwner {
        minimumDuration = _minimumDuration;
    }

    /**
     * @notice Sets the protocol fee.
     * @param _protocolFee The new protocol fee in basis points.
     */
    function setProtocolFee(uint256 _protocolFee) external onlyOwner {
        protocolFee = _protocolFee;
    }

    /**
     * @notice Sets the treasury address.
     * @param _treasury The new treasury address.
     */
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }


    /**
     * @notice Calculates the health factor of a simulated loan.
     * @param _collateralAmount The amount of collateral.
     * @param _borrowAmount The amount to borrow.
     * @return The health factor.
     */
    function calculateHealthFactorSimulated(
        uint256 _collateralAmount,
        uint256 _borrowAmount,
        address _collateralToken
    ) public view returns (uint256) {
        if (_borrowAmount == 0) return type(uint256).max;
        return (_collateralAmount * liquidationThresholds[_collateralToken]) / _borrowAmount;
    }

    /**
     * @notice Calculates the total amount due for a loan.
     * @param user The address of the user.
     * @param loanId The ID of the loan.
     * @return The total amount due.
     */
    function calculateTotalDue(address user, uint256 loanId) public view returns (uint256) {
    Loan storage loan = userLoans[user][loanId];
    uint256 amount = loan.borrowAmount;
    uint256 interestRate = loan.interestRate;
    uint256 duration = loan.duration;
    uint256 interest = (amount * interestRate * duration) / (10000 * 365 days);
    uint256 total = loan.borrowAmount + interest;
    uint256 feeAmount = (total * protocolFee) / 10000;
    return total + feeAmount;
}


    /**
     * @notice Calculates the credit score for a user.
     * @param user The address of the user.
     * @return The credit score.
     */
    function calculateCreditScore(address user) public view returns (uint256) {
        CreditProfile memory profile = creditProfiles[user];
        uint256 score = 300;
        if (profile.totalBorrowed > 0) {
            score += (profile.totalRepaid * 500) / profile.totalBorrowed;
        }
        if (profile.onTimeRepayments > 0) {
            score += 100;
        }
        if (profile.lateRepayments > 0) {
            uint256 penalty = profile.lateRepayments * 50;
            score = score > penalty ? score - penalty : 0;
        }
        if (score > 1000) score = 1000;
        return score;
    }

    /**
     * @notice Gets the credit score for a user.
     * @param user The address of the user.
     * @return The credit score.
     */
    function getCreditScore(address user) public view returns (uint256) {
        return creditProfiles[user].score;
    }

    function getCreditScoreTier(uint256 score) internal pure returns (CreditScoreTier) {
        if (score >= 800) {
            return CreditScoreTier.Excellent;
        } else if (score >= 670) {
            return CreditScoreTier.Good;
        } else if (score >= 580) {
            return CreditScoreTier.Fair;
        } else {
            return CreditScoreTier.Poor;
        }
    }

    function getDynamicInterestRate(address user) internal view returns (uint256) {
        uint256 score = getCreditScore(user);
        CreditScoreTier tier = getCreditScoreTier(score);

        if (tier == CreditScoreTier.Excellent) {
            return 500; // 5%
        } else if (tier == CreditScoreTier.Good) {
            return 750; // 7.5%
        } else if (tier == CreditScoreTier.Fair) {
            return 1000; // 10%
        } else {
            return 1250; // 12.5%
        }
    }

    function getDynamicMinHealthFactor(address user) internal view returns (uint256) {
        uint256 score = getCreditScore(user);
        CreditScoreTier tier = getCreditScoreTier(score);

        if (tier == CreditScoreTier.Excellent) {
            return 120;
        } else if (tier == CreditScoreTier.Good) {
            return 130;
        } else if (tier == CreditScoreTier.Fair) {
            return 140;
        } else {
            return 150;
        }
    }

    /**
     * @notice Allows a user to borrow tokens.
     * @param _collateralToken The address of the collateral token.
     * @param _collateralAmount The amount of collateral.
     * @param _borrowToken The address of the token to borrow.
     * @param _borrowAmount The amount to borrow.
     * @param _duration The duration of the loan.
     */
    function Borrow(
        address _collateralToken,
        uint256 _collateralAmount,
        address _borrowToken,
        uint256 _borrowAmount,
        uint256 _duration
    ) external payable nonReentrant {
        uint256 score = getCreditScore(msg.sender);
        CreditScoreTier tier = getCreditScoreTier(score);
        require(tier != CreditScoreTier.Poor, "Credit score too low to borrow");

        require(yieldPool.isTokenAllowed(_collateralToken) || _collateralToken == address(0), "collateralToken not allowed");
        require(yieldPool.isTokenAllowed(_borrowToken) || _borrowToken == address(0), "borrowToken not allowed");
        require(_collateralAmount >= minimumCollateralAmount[_collateralToken], "collateral too low");
        require(_borrowAmount > 0, "borrow amount is 0");
        require(_duration >= minimumDuration, "duration too short");

        if (_borrowToken != address(0)) {
            require(IERC20(_borrowToken).balanceOf(address(this)) >= _borrowAmount, "Not enough liquidity");
        } else {
            require(address(this).balance >= _borrowAmount, "Not enough native token liquidity");
        }

        uint256 dynamicMinHealthFactor = getDynamicMinHealthFactor(msg.sender);
        uint256 healthFactor = calculateHealthFactorSimulated(_collateralAmount, _borrowAmount, _collateralToken);
        require(healthFactor >= dynamicMinHealthFactor, "Health factor too low for your credit score");

        if (_collateralToken != address(0)) {
            IERC20(_collateralToken).safeTransferFrom(msg.sender, address(this), _collateralAmount);
        } else {
            require(msg.value == _collateralAmount, "Must send exact collateral amount with native token");
        }

        if (_borrowToken != address(0)) {
            IERC20(_borrowToken).safeTransfer(msg.sender, _borrowAmount);
        } else {
            (bool success,) = msg.sender.call{value: _borrowAmount}("");
            require(success, "Failed to transfer native token");
        }

        uint256 loanId = currentLoanId++;
        uint256 interestRate = getDynamicInterestRate(msg.sender);

        Loan memory newLoan = Loan({
            loanId: loanId,
            collateralAmount: _collateralAmount,
            collateralToken: _collateralToken,
            borrowToken: _borrowToken,
            borrowAmount: _borrowAmount,
            duration: _duration,
            startTime: block.timestamp,
            amountPaid: 0,
            interestRate: interestRate,
            userAddress: msg.sender,
            active: true
        });

        userLoanIds[msg.sender].push(loanId);
        
        userLoans[msg.sender][loanId] = newLoan;

        creditProfiles[msg.sender].totalBorrowed += _borrowAmount;
        creditProfiles[msg.sender].activeLoans += 1;
        creditProfiles[msg.sender].lastUpdated = block.timestamp;

        emit LoanCreated(msg.sender, loanId, _borrowAmount, _borrowToken, _duration);
        emit CollateralDeposited(msg.sender, _collateralToken, _collateralAmount);
    }

    /**
     * @notice Allows a user to repay a loan.
     * @param _loanId The ID of the loan to repay.
     */
    function payLoan(uint _loanId) external payable nonReentrant {
        Loan storage loan = userLoans[msg.sender][_loanId];
        require(loan.loanId == _loanId, "Loan not found");
        require(loan.active, "Loan is not active");
        

        uint256 interest = (loan.borrowAmount * loan.interestRate * loan.duration) / (10000 * 365 days);
        uint256 feeAmount = (interest * protocolFee) / 10000;
        uint256 yieldAmount = interest - feeAmount;

        if (loan.borrowToken != address(0)) {
            IERC20(loan.borrowToken).safeTransferFrom(msg.sender, address(this), calculateTotalDue(msg.sender, _loanId));
            if (feeAmount > 0) {
                IERC20(loan.borrowToken).safeTransfer(treasury, feeAmount);
                emit ProtocolFeeCollected(loan.borrowToken, feeAmount, treasury);
            }
            if (yieldAmount > 0) {
                yieldPool.addYield(loan.borrowToken, yieldAmount);
            }
        } else {
            require(msg.value == calculateTotalDue(msg.sender, _loanId), "Must send exact amount due with native token");
            if (feeAmount > 0) {
                (bool success,) = treasury.call{value: feeAmount}("");
                require(success, "Failed to transfer native token to treasury");
                emit ProtocolFeeCollected(address(0), feeAmount, treasury);
            }
            if (yieldAmount > 0) {
            IYieldPool(address(yieldPool)).addYield(address(0), yieldAmount);
        }
        }

        loan.active = false;

        if (loan.collateralToken != address(0)) {
            IERC20(loan.collateralToken).safeTransfer(msg.sender, loan.collateralAmount);
        } else {
            (bool success,) = msg.sender.call{value: loan.collateralAmount}("");
            require(success, "Failed to return native token collateral");
        }

        creditProfiles[msg.sender].totalRepaid += (loan.borrowAmount + interest);
        creditProfiles[msg.sender].activeLoans -= 1;

        if (block.timestamp <= loan.startTime + loan.duration) {
            creditProfiles[msg.sender].onTimeRepayments += 1;
        } else {
            creditProfiles[msg.sender].lateRepayments += 1;
        }

        creditProfiles[msg.sender].lastUpdated = block.timestamp;
        creditProfiles[msg.sender].score = calculateCreditScore(msg.sender);

        emit LoanRepaid(msg.sender, _loanId, (loan.borrowAmount + interest));
        emit CollateralWithdrawn(msg.sender, _loanId, loan.collateralAmount);
    }

    

    /**
     * @notice Gets all loans for a user.
     * @param user The address of the user.
     * @return An array of the user's loans.
     */
    function getUserLoans(address user) public view returns (Loan[] memory) {
        uint256[] memory ids = userLoanIds[user];
        Loan[] memory result = new Loan[](ids.length);
        for (uint i = 0; i < ids.length; i++) {
            result[i] = userLoans[user][ids[i]];
        }
        return result;
    }

    /**
     * @dev Returns the address of the YieldPool contract.
     * @return The address of the YieldPool contract.
     */
    function getYieldPool() external view returns (IYieldPool) {
        return yieldPool;
    }

    /**
     * @dev Returns a user's credit profile.
     * @param user The address of the user.
     * @return The credit profile of the user.
     */
    function getCreditProfile(address user) external view returns (CreditProfile memory) {
        return creditProfiles[user];
    }

    /**
     * @dev Returns the minimum health factor required to take out a loan.
     * @return The minimum health factor.
     */
    function getMinHealthFactor() external view returns (uint256) {
        return minHealthFactor;
    }

    /**
     * @dev Returns the protocol fee in basis points.
     * @return The protocol fee.
     */
    function getProtocolFee() external view returns (uint256) {
        return protocolFee;
    }

    /**
     * @dev Returns the address where protocol fees are sent.
     * @return The treasury address.
     */
    function getTreasury() external view returns (address) {
        return treasury;
    }

    /**
     * @dev Returns the current loan ID.
     * @return The current loan ID.
     */
    function getCurrentLoanId() external view returns (uint256) {
        return currentLoanId;
    }

    /**
     * @dev Returns the minimum duration for a loan.
     * @return The minimum duration.
     */
    function getMinimumDuration() external view returns (uint256) {
        return minimumDuration;
    }

/**
     * @dev Returns the minimum health factor .
     * @return The minimum duration.
     */
    function getMinimumHealthFactor() external view returns (uint256) {
        return minHealthFactor;
    }

    /**
     * @dev Returns the liquidation threshold for a token.
     * @param token The address of the token.
     * @return The liquidation threshold.
     */
    function getLiquidationThreshold(address token) external view returns (uint256) {
        return liquidationThresholds[token];
    }

    /**
     * @dev Returns the minimum collateral amount for a token.
     * @param token The address of the token.
     * @return The minimum collateral amount.
     */
    function getMinimumCollateralAmount(address token) external view returns (uint256) {
        return minimumCollateralAmount[token];
    }

    /**
     * @dev Returns all loan IDs for a user.
     * @param user The address of the user.
     * @return An array of loan IDs.
     */
    function getUserLoanIds(address user) external view returns (uint256[] memory) {
        return userLoanIds[user];
    }

    /**
     * @dev Returns a specific loan for a user by its ID.
     * @param user The address of the user.
     * @param loanId The ID of the loan.
     * @return The loan details.
     */
    function getUserLoan(address user, uint256 loanId) external view returns (Loan memory) {
        return userLoans[user][loanId];
    }

    function receiveFunds(address token, uint256 amount) external {
        require(msg.sender == address(yieldPool), "Only YieldPool can send funds");
        emit PoolFunded(msg.sender, token, amount);
    }

    receive() external payable {}

    /**
     * @notice Allows the owner to fund the pool.
     * @param token The address of the token to fund.
     * @param amount The amount to fund.
     */
    function fundPool(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit PoolFunded(msg.sender, token, amount);
    }

    function setCreditScoreForTesting(address user, uint256 score) external onlyOwner {
        creditProfiles[user].score = score;
    }

    /**
     * @notice Allows a user to liquidate an unhealthy loan.
     * @param user The address of the user whose loan is to be liquidated.
     * @param loanId The ID of the loan to liquidate.
     */
    function liquidate(address user, uint256 loanId) external nonReentrant {
        Loan storage loan = userLoans[user][loanId];
        require(loan.active, "Loan is not active");

        uint256 threshold = liquidationThresholds[loan.collateralToken];
        require(threshold > 0, "Liquidation threshold not set");

        uint256 totalDue = calculateTotalDue(user, loanId);
        uint256 healthFactor = calculateHealthFactorSimulated(loan.collateralAmount, totalDue, loan.collateralToken);
        uint256 minHealthFactorForLiquidation = getDynamicMinHealthFactor(user);
        require(healthFactor < minHealthFactorForLiquidation, "Health factor above liquidation threshold");

        IERC20(loan.collateralToken).safeTransfer(msg.sender, loan.collateralAmount);
        loan.active = false;

        emit LoanLiquidated(user, loanId, msg.sender);
    }
}
