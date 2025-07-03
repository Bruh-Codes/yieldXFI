// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title YieldPool
 * @dev A decentralized staking and yield generation protocol supporting native ETH and ERC20 tokens.
 */
 contract YieldPool is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // Constants
    uint256 private constant YEAR = 365 days;
    uint256 private constant EMERGENCY_TIMELOCK = 24 hours;
    address private constant NATIVE_ETH = address(0x1);

    // Configurable parameters
    uint256 private yieldRate; // in basis points (e.g., 1000 = 10%)
    uint256 private minDuration;
    uint256 private maxDuration;


    // Reserves and tracking
    mapping(address => uint256) private yieldReserves;
    mapping(address => bool) private allowedTokens;
    address[] private allowedTokenList;

    uint256 private emergencyWithdrawalTime;
    uint256 private totalStakers;
    uint256 private totalValueLocked;
    uint256 private nextPositionId = 1;

    mapping(address => uint256) private activePositionsCount;
    mapping(address => uint256) private stakerIndex;
    mapping(address => mapping(address => uint256)) private userTokenBalance;
    mapping(address => mapping(address => uint256)) private pendingWithdrawals;
    address[] private activeStakers;

    struct Position {
        address token;
        uint256 id;
        uint256 amount;
        uint256 startTime;
        uint256 lockDuration;
        bool withdrawn;
    }

    mapping(address => Position[]) private positions;
    mapping(uint256 => address) private positionOwners;

    // Events
    event Deposited(address indexed user, address token, uint256 amount, uint256 duration);
    event Withdrawn(address indexed user, address token, uint256 amount, uint256 yield);
    event TokenAllowedStatusChanged(address token, bool allowed);
    event YieldParametersUpdated(uint256 yieldRate, uint256 minDuration, uint256 maxDuration);
    event YieldReserveAdded(address indexed token, uint256 amount);
    event EmergencyWithdrawalInitiated(uint256 timestamp);
    event PenaltyCollected(address token, uint256 amount);

    constructor(uint256 _yieldRate, uint256 _minDuration, uint256 _maxDuration) Ownable(msg.sender) {
        require(_yieldRate > 0 && _yieldRate <= 10000, "Invalid yield rate");
        require(_minDuration > 0 && _maxDuration > _minDuration, "Invalid durations");

        yieldRate = _yieldRate;
        minDuration = _minDuration;
        maxDuration = _maxDuration;

        allowedTokens[NATIVE_ETH] = true;
        allowedTokenList.push(NATIVE_ETH);
        emit TokenAllowedStatusChanged(NATIVE_ETH, true);
    }

    function updateYieldParameters(uint256 _rate, uint256 _min, uint256 _max) external onlyOwner {
        require(_rate > 0 && _rate <= 10000, "Invalid rate");
        require(_min > 0 && _max > _min, "Invalid durations");
        yieldRate = _rate;
        minDuration = _min;
        maxDuration = _max;
        emit YieldParametersUpdated(_rate, _min, _max);
    }

    function addYieldReserves(address token, uint256 amount) external payable onlyOwner {
        require(amount > 0, "Zero amount");
        if (token == NATIVE_ETH) {
            require(msg.value == amount, "ETH mismatch");
            yieldReserves[token] += msg.value;
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            yieldReserves[token] += amount;
        }
        emit YieldReserveAdded(token, amount);
    }

    function setTokenAllowed(address token, bool allowed) external onlyOwner {
        if (token == NATIVE_ETH) {
            require(allowed, "Cannot disable native token");
        } else {
            require(token != address(0), "Invalid token address");
        }
        allowedTokens[token] = allowed;
        if (allowed && !_inList(token)) allowedTokenList.push(token);
        emit TokenAllowedStatusChanged(token, allowed);
    }

    function _inList(address token) internal view returns (bool) {
        for (uint i = 0; i < allowedTokenList.length; i++) {
            if (allowedTokenList[i] == token) return true;
        }
        return false;
    }

    function deposit(address token, uint256 amount, uint256 duration) external payable nonReentrant whenNotPaused {
        require(allowedTokens[token], "Token not allowed");
        require(amount > 0, "Zero amount");
        require(duration >= minDuration && duration <= maxDuration, "Invalid duration");

        uint256 actualAmount;
        if (token == NATIVE_ETH) {
            require(msg.value == amount, "ETH mismatch");
            actualAmount = msg.value;
        } else {
            uint256 beforeBal = IERC20(token).balanceOf(address(this));
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            actualAmount = IERC20(token).balanceOf(address(this)) - beforeBal;
        }

        userTokenBalance[msg.sender][token] += actualAmount;
        totalValueLocked += actualAmount;

        if (positions[msg.sender].length == 0) {
            stakerIndex[msg.sender] = activeStakers.length;
            activeStakers.push(msg.sender);
            totalStakers++;
        }

        positions[msg.sender].push(Position({
            token: token,
            id: nextPositionId,
            amount: actualAmount,
            startTime: block.timestamp,
            lockDuration: duration,
            withdrawn: false
        }));

        positionOwners[nextPositionId] = msg.sender;
        activePositionsCount[msg.sender]++;
        emit Deposited(msg.sender, token, actualAmount, duration);
        nextPositionId++;
    }

    function withdraw(uint256 positionId) external nonReentrant whenNotPaused {
        address user = positionOwners[positionId];
        require(user == msg.sender, "Not owner");

        Position storage pos = _getPosition(msg.sender, positionId);
        require(!pos.withdrawn, "Already withdrawn");
        require(block.timestamp >= pos.startTime + pos.lockDuration, "Still locked");

        uint256 yield = calculateYield(pos.amount, pos.lockDuration);
        require(yieldReserves[pos.token] >= yield, "Insufficient reserve");

        pos.withdrawn = true;
        delete positionOwners[positionId];
        totalValueLocked -= pos.amount;
        userTokenBalance[msg.sender][pos.token] -= pos.amount;
        yieldReserves[pos.token] -= yield;
        activePositionsCount[msg.sender]--;

        pendingWithdrawals[msg.sender][pos.token] += pos.amount + yield;
        _maybeRemoveStaker(msg.sender);
        emit Withdrawn(msg.sender, pos.token, pos.amount, yield);
    }

    function unstake(uint256 positionId) external nonReentrant whenNotPaused {
        address user = positionOwners[positionId];
        require(user == msg.sender, "Not owner");

        Position storage pos = _getPosition(msg.sender, positionId);
        require(!pos.withdrawn, "Already withdrawn");

        pos.withdrawn = true;
        delete positionOwners[positionId];
        totalValueLocked -= pos.amount;
        userTokenBalance[msg.sender][pos.token] -= pos.amount;
        activePositionsCount[msg.sender]--;

        uint256 penalty = 0;
        uint256 toReturn = pos.amount;

        if (block.timestamp < pos.startTime + pos.lockDuration) {
            penalty = pos.amount / 10;
            toReturn = pos.amount - penalty;
            yieldReserves[pos.token] += penalty;
            emit PenaltyCollected(pos.token, penalty);
        }

        pendingWithdrawals[msg.sender][pos.token] += toReturn;
        _maybeRemoveStaker(msg.sender);
        emit Withdrawn(msg.sender, pos.token, toReturn, 0);
    }

    function claimWithdrawal(address token) external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender][token];
        require(amount > 0, "Nothing to claim");
        pendingWithdrawals[msg.sender][token] = 0;

        if (token == NATIVE_ETH) {
            (bool ok, ) = payable(msg.sender).call{value: amount}("");
            require(ok, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
    }

    function calculateYield(uint256 amount, uint256 duration) public view returns (uint256) {
        return (amount * duration * yieldRate) / (YEAR * 10000);
    }

    function _getPosition(address user, uint256 id) internal view returns (Position storage) {
        Position[] storage userPositions = positions[user];
        for (uint i = 0; i < userPositions.length; i++) {
            if (userPositions[i].id == id) return userPositions[i];
        }
        revert("Position not found");
    }

    function _maybeRemoveStaker(address user) internal {
        if (activePositionsCount[user] == 0) {
            uint256 index = stakerIndex[user];
            uint256 lastIndex = activeStakers.length - 1;
            address last = activeStakers[lastIndex];
            if (user != last) {
                activeStakers[index] = last;
                stakerIndex[last] = index;
            }
            activeStakers.pop();
            totalStakers--;
        }
    }

    function initiateEmergencyWithdrawal() external onlyOwner {
        emergencyWithdrawalTime = block.timestamp + EMERGENCY_TIMELOCK;
        emit EmergencyWithdrawalInitiated(emergencyWithdrawalTime);
    }

    function executeEmergencyWithdrawal(address token, uint256 amount) external onlyOwner {
        require(block.timestamp >= emergencyWithdrawalTime, "Timelock active");
        if (token == NATIVE_ETH) {
            (bool ok, ) = payable(owner()).call{value: amount}("");
            require(ok, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    /**
     * @dev Returns the current yield rate in basis points.
     * @return The yield rate.
     */
    function getYieldRate() external view returns (uint256) {
        return yieldRate;
    }

    /**
     * @dev Returns the minimum allowed lock duration for deposits.
     * @return The minimum duration in seconds.
     */
    function getMinDuration() external view returns (uint256) {
        return minDuration;
    }

    /**
     * @dev Returns the maximum allowed lock duration for deposits.
     * @return The maximum duration in seconds.
     */
    function getMaxDuration() external view returns (uint256) {
        return maxDuration;
    }

    /**
     * @dev Returns the yield reserve balance for a specific token.
     * @param token The address of the token.
     * @return The yield reserve amount.
     */
    function getYieldReserves(address token) external view returns (uint256) {
        return yieldReserves[token];
    }

    /**
     * @dev Checks if a token is allowed for deposits.
     * @param token The address of the token.
     * @return True if the token is allowed, false otherwise.
     */
    function isTokenAllowed(address token) external view returns (bool) {
        return allowedTokens[token];
    }

    /**
     * @dev Returns the list of all allowed tokens.
     * @return An array of allowed token addresses.
     */
    function getAllowedTokenList() external view returns (address[] memory) {
        return allowedTokenList;
    }

    /**
     * @dev Returns the timestamp when emergency withdrawal was initiated.
     * @return The emergency withdrawal timestamp.
     */
    function getEmergencyWithdrawalTime() external view returns (uint256) {
        return emergencyWithdrawalTime;
    }

    /**
     * @dev Returns the total number of active stakers.
     * @return The total number of stakers.
     */
    function getTotalStakers() external view returns (uint256) {
        return totalStakers;
    }

    /**
     * @dev Returns the total value locked in the protocol.
     * @return The total value locked.
     */
    function getTotalValueLocked() external view returns (uint256) {
        return totalValueLocked;
    }

    /**
     * @dev Returns the count of active positions for a given user.
     * @param user The address of the user.
     * @return The number of active positions.
     */
    function getActivePositionsCount(address user) external view returns (uint256) {
        return activePositionsCount[user];
    }

    /**
     * @dev Returns the staker index for a given user.
     * @param user The address of the user.
     * @return The staker index.
     */
    function getStakerIndex(address user) external view returns (uint256) {
        return stakerIndex[user];
    }

    /**
     * @dev Returns the user's token balance for a specific token.
     * @param user The address of the user.
     * @param token The address of the token.
     * @return The user's token balance.
     */
    function getUserTokenBalance(address user, address token) external view returns (uint256) {
        return userTokenBalance[user][token];
    }

    /**
     * @dev Returns the pending withdrawal amount for a user and token.
     * @param user The address of the user.
     * @param token The address of the token.
     * @return The pending withdrawal amount.
     */
    function getPendingWithdrawals(address user, address token) external view returns (uint256) {
        return pendingWithdrawals[user][token];
    }

    /**
     * @dev Returns the list of active stakers.
     * @return An array of active staker addresses.
     */
    function getActiveStakers() external view returns (address[] memory) {
        return activeStakers;
    }

    /**
     * @dev Returns a specific position for a user by its ID.
     * @param user The address of the user.
     * @param index The index of the position in the user's positions array.
     * @return The position details.
     */
    function getPosition(address user, uint256 index) external view returns (Position memory) {
        require(index < positions[user].length, "Invalid position index");
        return positions[user][index];
    }

    /**
     * @dev Returns the owner of a specific position ID.
     * @param positionId The ID of the position.
     * @return The address of the position owner.
     */
    function getPositionOwner(uint256 positionId) external view returns (address) {
        return positionOwners[positionId];
    }

    receive() external payable {}
}
