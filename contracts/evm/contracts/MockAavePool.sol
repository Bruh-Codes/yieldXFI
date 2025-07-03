// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockAavePool {
    using SafeERC20 for IERC20;

    mapping(address => mapping(address => uint256)) public balances;

    function deposit(address asset, uint256 amount, address onBehalfOf) external {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        balances[asset][onBehalfOf] += amount;
    }

    function withdraw(address asset, uint256 amount, address to) external {
        require(balances[asset][to] >= amount, "Insufficient balance in Aave pool");
        balances[asset][to] -= amount;
        IERC20(asset).safeTransfer(to, amount);
    }
}