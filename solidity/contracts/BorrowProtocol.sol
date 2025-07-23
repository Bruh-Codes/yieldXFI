// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IYieldPool {
    function isTokenAllowed(address _address) external view returns (bool);
}

contract BorrowProtocol is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IYieldPool public yieldPool;
    address public yieldTokenAddress; // Added to store YieldToken address

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

    mapping(address => mapping(uint256 => Loan)) userLoans;
    mapping(address => uint256) liquidationThresholds;
    mapping(address => uint256[]) userLoanIds;
    mapping(address => uint256) minimumCollateralAmount;

    uint256 public minHealthFactor = 150;
    uint256 public minimumDuration = 1 days;
    uint256 public currentLoanId;
    Loan[] public allActiveLoans;

    event CollateralDeposited(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    event LoanCreated(
        address indexed user,
        uint256 loanId,
        uint256 amount,
        address token,
        uint256 duration
    );
    event LoanRepaid(address indexed user, uint256 loanId, uint256 amount);
    event PoolFunded(
        address indexed funder,
        address indexed token,
        uint256 amount
    );

    event CollateralWithdrawn(
        address indexed user,
        uint256 loanId,
        uint256 amount
    );
    event LoanLiquidated(
        address indexed user,
        uint256 loanId,
        address liquidator
    );
    event ActiveLoanUpdated(uint256 loanId, bool active);

    constructor(
        address _yieldPoolAddress,
        address _yieldTokenAddress,
        address _owner
    ) Ownable(_owner) {
        yieldPool = IYieldPool(_yieldPoolAddress);
        yieldTokenAddress = _yieldTokenAddress; // Initialize yieldTokenAddress
        liquidationThresholds[_yieldTokenAddress] = 80;
        minimumCollateralAmount[_yieldTokenAddress] = 1 ether;
        minimumCollateralAmount[address(0)] = 1 ether; // Default for native token
        liquidationThresholds[address(0)] = 80; // Default for native token
    }

    function setMinHealthFactor(uint256 _minHealthFactor) external onlyOwner {
        minHealthFactor = _minHealthFactor;
    }

    function setLiquidationThreshold(
        address token,
        uint256 threshold
    ) external onlyOwner {
        require(threshold <= 100, "Threshold must be <= 100%");
        liquidationThresholds[token] = threshold;
    }

    function getLiquidationThreshold(
        address token
    ) public view returns (uint256) {
        return liquidationThresholds[token];
    }

    function setMinCollateralAmount(
        address _yieldToken,
        uint256 _minimumCollateralAmount
    ) external onlyOwner {
        minimumCollateralAmount[_yieldToken] = _minimumCollateralAmount;
    }

    function getMinCollateralAmount(
        address _tokenAddress
    ) public view returns (uint256) {
        return minimumCollateralAmount[_tokenAddress];
    }

    function setMinimumDuration(uint256 _minimumDuration) external onlyOwner {
        minimumDuration = _minimumDuration;
    }

    function getMinimumDuration() public view returns (uint256) {
        return minimumDuration;
    }

    function calculateHealthFactorSimulated(
        uint256 _collateralAmount,
        uint256 _borrowAmount,
        address _collateralTokenAddress
    ) public view returns (uint256) {
        if (_borrowAmount == 0) return type(uint256).max;
        return
            (_collateralAmount * liquidationThresholds[_collateralTokenAddress]) /
            _borrowAmount;
    }

    function calculateTotalDue(
        address user,
        uint256 loanId
    ) public view returns (uint256) {
        Loan storage loan = userLoans[user][loanId];
        uint256 amount = loan.borrowAmount;
        uint256 interestRate = loan.interestRate;
        uint256 duration = loan.duration;
        // Calculate interest: principal * rate * time / (100% * 365 days)
        uint256 interest = (amount * interestRate * duration) /
            (10000 * 365 days);

        return loan.borrowAmount + interest;
    }

    function getMinHealthFactor() public view returns (uint256) {
        return minHealthFactor;
    }

    function Borrow(
        address _collateralToken,
        uint256 _collateralAmount,
        address _borrowToken,
        uint256 _borrowAmount,
        uint256 _duration,
        uint256 _interestRate
    ) external nonReentrant {
        require(
            yieldPool.isTokenAllowed(_collateralToken),
            "collateralToken not allowed"
        );
        require(
            yieldPool.isTokenAllowed(_borrowToken),
            "borrowToken not allowed"
        );
        require(_interestRate > 0, "invalid interest rate");
        require(
            _collateralAmount >= minimumCollateralAmount[_collateralToken],
            "collateral too low"
        );
        require(_borrowAmount > 0, "borrow amount is 0");
        require(_duration >= minimumDuration, "duration too short");
        require(
            _borrowToken != yieldTokenAddress,
            "Cannot borrow YieldToken"
        );
        require(
            IERC20(_borrowToken).balanceOf(address(this)) >= _borrowAmount,
            "Not enough liquidity"
        );

        uint256 healthFactor = calculateHealthFactorSimulated(
            _collateralAmount,
            _borrowAmount,
            _collateralToken
        );
        require(healthFactor >= minHealthFactor, "Health factor too low");

        uint256 loanId = currentLoanId++;

        IERC20(_collateralToken).safeTransferFrom(msg.sender, address(this), _collateralAmount);

        Loan memory newLoan = Loan({
            loanId: loanId,
            collateralAmount: _collateralAmount,
            collateralToken: _collateralToken,
            borrowToken: _borrowToken,
            borrowAmount: _borrowAmount,
            duration: _duration,
            startTime: block.timestamp,
            amountPaid: 0,
            interestRate: _interestRate,
            userAddress: msg.sender,
            active: true
        });
        userLoanIds[msg.sender].push(loanId);
        allActiveLoans.push(newLoan);
        userLoans[msg.sender][loanId] = newLoan;

        emit LoanCreated(
            msg.sender,
            loanId,
            _borrowAmount,
            _borrowToken,
            _duration
        );
        emit CollateralDeposited(
            msg.sender,
            _collateralToken,
            _collateralAmount
        );

        IERC20(_borrowToken).safeTransfer(msg.sender, _borrowAmount);
    }

    function borrowNative(
        address _collateralToken,
        uint256 _collateralAmount,
        address _borrowToken,
        uint256 _borrowAmount,
        uint256 _duration,
        uint256 _interestRate
    ) external payable nonReentrant {
        require(
            _borrowToken != yieldTokenAddress,
            "Cannot borrow YieldToken"
        );
        require(
            _collateralToken != yieldTokenAddress,
            "Cannot use YieldToken as collateral"
        );
        require(
            yieldPool.isTokenAllowed(_collateralToken) || _collateralToken == address(0),
            "collateralToken not allowed"
        );
        require(_interestRate > 0, "invalid interest rate");
        require(_borrowAmount > 0, "borrow amount is 0");
        require(_duration >= minimumDuration, "duration too short");
        require(
            address(this).balance >= _borrowAmount,
            "Not enough liquidity"
        );

        uint256 actualCollateralAmount;

        if (_collateralToken == address(0)) {
            require(msg.value == _collateralAmount, "msg.value must match _collateralAmount for native collateral");
            require(msg.value >= minimumCollateralAmount[address(0)], "collateral too low");
            actualCollateralAmount = msg.value;
        } else {
            require(_collateralAmount >= minimumCollateralAmount[_collateralToken], "collateral too low");
            IERC20(_collateralToken).safeTransferFrom(msg.sender, address(this), _collateralAmount);
            actualCollateralAmount = _collateralAmount;
        }

        uint256 healthFactor = calculateHealthFactorSimulated(
            actualCollateralAmount,
            _borrowAmount,
            _collateralToken
        );
        require(healthFactor >= minHealthFactor, "Health factor too low");

        uint256 loanId = currentLoanId++;

        Loan memory newLoan = Loan({
            loanId: loanId,
            collateralAmount: actualCollateralAmount,
            collateralToken: _collateralToken,
            borrowToken: _borrowToken,
            borrowAmount: _borrowAmount,
            duration: _duration,
            startTime: block.timestamp,
            amountPaid: 0,
            interestRate: _interestRate,
            userAddress: msg.sender,
            active: true
        });
        userLoanIds[msg.sender].push(loanId);
        allActiveLoans.push(newLoan);
        userLoans[msg.sender][loanId] = newLoan;

        emit LoanCreated(
            msg.sender,
            loanId,
            _borrowAmount,
            _borrowToken,
            _duration
        );
        emit CollateralDeposited(
            msg.sender,
            _collateralToken,
            actualCollateralAmount
        );

        (bool success, ) = msg.sender.call{value: _borrowAmount}("");
        require(success, "Failed to send native token");
    }

    function getAllActiveLoans() public view returns (Loan[] memory) {
        return allActiveLoans;
    }

    function getUserLoans(address user) public view returns (Loan[] memory) {
        uint256[] memory ids = userLoanIds[user];
        Loan[] memory result = new Loan[](ids.length);

        for (uint i = 0; i < ids.length; i++) {
            result[i] = userLoans[user][ids[i]];
        }

        return result;
    }

    function payLoan(uint _loanId) external payable nonReentrant {
        Loan storage loan = userLoans[msg.sender][_loanId];
        require(loan.loanId == _loanId, "Loan not found");
        require(loan.active, "Loan is not active");
        require(
            block.timestamp <= loan.startTime + loan.duration,
            "Loan expired"
        );

        uint256 totalDue = calculateTotalDue(msg.sender, _loanId);

        // Full repayment only
        if (loan.borrowToken == address(0)) {
            require(msg.value >= totalDue, "Insufficient native token sent for repayment");
            // Any excess native token is automatically returned by the EVM if the function is payable
        } else {
            IERC20(loan.borrowToken).safeTransferFrom(
                msg.sender,
                address(this),
                totalDue
            );
        }

        loan.active = false;

        // Update the allActiveLoans array
        for (uint i = 0; i < allActiveLoans.length; i++) {
            if (
                allActiveLoans[i].loanId == _loanId &&
                allActiveLoans[i].userAddress == msg.sender
            ) {
                allActiveLoans[i].active = false;
                emit ActiveLoanUpdated(allActiveLoans[i].loanId, false);
                break;
            }
        }

        // Return collateral to user
        if (loan.collateralToken == address(0)) {
            (bool success, ) = msg.sender.call{value: loan.collateralAmount}("");
            require(success, "Failed to return native collateral");
        } else {
            IERC20(loan.collateralToken).safeTransfer(
                msg.sender,
                loan.collateralAmount
            );
        }

        emit LoanRepaid(msg.sender, _loanId, totalDue);
        emit CollateralWithdrawn(msg.sender, _loanId, loan.collateralAmount);
    }

    function fundPool(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Cannot fund native token via this function");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit PoolFunded(msg.sender, token, amount);
    }

    function fundNativePool() external payable onlyOwner {
        require(msg.value > 0, "Amount must be greater than 0");
        emit PoolFunded(msg.sender, address(0), msg.value);
    }

    function liquidate(address user, uint256 loanId) public {
        Loan storage loan = userLoans[user][loanId];
        require(loan.active, "Loan is not active");

        uint256 threshold = liquidationThresholds[loan.collateralToken];
        require(threshold > 0, "Liquidation threshold not set");

        uint256 totalDue = calculateTotalDue(user, loanId);
        uint256 healthFactor = calculateHealthFactorSimulated(
            loan.collateralAmount,
            totalDue,
            loan.collateralToken
        );

        require(
            healthFactor < threshold || block.timestamp > loan.startTime + loan.duration,
            "Loan not eligible for liquidation"
        );

        // Mark loan as inactive before transferring collateral (reentrancy guard)
        loan.active = false;

        // Update the allActiveLoans array
        for (uint i = 0; i < allActiveLoans.length; i++) {
            if (
                allActiveLoans[i].loanId == loanId &&
                allActiveLoans[i].userAddress == user
            ) {
                allActiveLoans[i].active = false;
                emit ActiveLoanUpdated(allActiveLoans[i].loanId, false);
                break;
            }
        }

        // Seize collateral
        if (loan.collateralToken == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: loan.collateralAmount}("");
            require(success, "Failed to seize native collateral");
        } else {
            IERC20(loan.collateralToken).safeTransfer(
                msg.sender,
                loan.collateralAmount
            );
        }

        emit LoanLiquidated(user, loanId, msg.sender);
    }

    function batchLiquidate(address[] calldata users, uint256[] calldata loanIds) external nonReentrant {
        require(users.length == loanIds.length, "Arrays must have same length");

        for (uint256 i = 0; i < users.length; i++) {
            // Call the single liquidate function for each loan in the batch
            // This will apply all the checks and distribution logic
            liquidate(users[i], loanIds[i]);
        }
    }
}
