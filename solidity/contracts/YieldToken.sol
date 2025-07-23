// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title YieldToken
 * @dev Represents token.
 */
contract YieldToken is ERC20, Ownable {
    address public minter;

    // Event for tracking mints
    event TokensMinted(
        address indexed to,
        uint256 amount,
        address indexed minter
    );

    // Custom error for unauthorized minting
    error UnauthorizedMinter(address caller);
    error ZeroAddressMint();


    constructor(
        address _minter,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) Ownable(_minter) {
        minter = _minter;
    }

    /**
     * @notice Mints new tokens to a specified address
     * @dev Only owner or approved minters can call this function
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public {
        require(msg.sender == minter, "Unauthorized minter");
        // Check for zero address
        if (to == address(0)) revert ZeroAddressMint();

        _mint(to, amount);
        emit TokensMinted(to, amount, msg.sender);
    }

    function setMinter(address _newMinter) public onlyOwner {
        minter = _newMinter;
    }
}