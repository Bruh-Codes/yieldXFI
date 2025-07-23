// Sources flattened with hardhat v2.26.1 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/IERC165.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts/interfaces/IERC165.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC165.sol)

pragma solidity >=0.4.16;


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File @openzeppelin/contracts/interfaces/IERC20.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC20.sol)

pragma solidity >=0.4.16;


// File @openzeppelin/contracts/interfaces/IERC1363.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC1363.sol)

pragma solidity >=0.6.2;


/**
 * @title IERC1363
 * @dev Interface of the ERC-1363 standard as defined in the https://eips.ethereum.org/EIPS/eip-1363[ERC-1363].
 *
 * Defines an extension interface for ERC-20 tokens that supports executing code on a recipient contract
 * after `transfer` or `transferFrom`, or code on a spender contract after `approve`, in a single transaction.
 */
interface IERC1363 is IERC20, IERC165 {
    /*
     * Note: the ERC-165 identifier for this interface is 0xb0202a11.
     * 0xb0202a11 ===
     *   bytes4(keccak256('transferAndCall(address,uint256)')) ^
     *   bytes4(keccak256('transferAndCall(address,uint256,bytes)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256,bytes)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256,bytes)'))
     */

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @param data Additional data with no specified format, sent in call to `spender`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value, bytes calldata data) external returns (bool);
}


// File @openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (token/ERC20/utils/SafeERC20.sol)

pragma solidity ^0.8.20;


/**
 * @title SafeERC20
 * @dev Wrappers around ERC-20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    /**
     * @dev An operation with an ERC-20 token failed.
     */
    error SafeERC20FailedOperation(address token);

    /**
     * @dev Indicates a failed `decreaseAllowance` request.
     */
    error SafeERC20FailedDecreaseAllowance(address spender, uint256 currentAllowance, uint256 requestedDecrease);

    /**
     * @dev Transfer `value` amount of `token` from the calling contract to `to`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transfer, (to, value)));
    }

    /**
     * @dev Transfer `value` amount of `token` from `from` to `to`, spending the approval given by `from` to the
     * calling contract. If `token` returns no value, non-reverting calls are assumed to be successful.
     */
    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transferFrom, (from, to, value)));
    }

    /**
     * @dev Variant of {safeTransfer} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransfer(IERC20 token, address to, uint256 value) internal returns (bool) {
        return _callOptionalReturnBool(token, abi.encodeCall(token.transfer, (to, value)));
    }

    /**
     * @dev Variant of {safeTransferFrom} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransferFrom(IERC20 token, address from, address to, uint256 value) internal returns (bool) {
        return _callOptionalReturnBool(token, abi.encodeCall(token.transferFrom, (from, to, value)));
    }

    /**
     * @dev Increase the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        forceApprove(token, spender, oldAllowance + value);
    }

    /**
     * @dev Decrease the calling contract's allowance toward `spender` by `requestedDecrease`. If `token` returns no
     * value, non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeDecreaseAllowance(IERC20 token, address spender, uint256 requestedDecrease) internal {
        unchecked {
            uint256 currentAllowance = token.allowance(address(this), spender);
            if (currentAllowance < requestedDecrease) {
                revert SafeERC20FailedDecreaseAllowance(spender, currentAllowance, requestedDecrease);
            }
            forceApprove(token, spender, currentAllowance - requestedDecrease);
        }
    }

    /**
     * @dev Set the calling contract's allowance toward `spender` to `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful. Meant to be used with tokens that require the approval
     * to be set to zero before setting it to a non-zero value, such as USDT.
     *
     * NOTE: If the token implements ERC-7674, this function will not modify any temporary allowance. This function
     * only sets the "standard" allowance. Any temporary allowance will remain active, in addition to the value being
     * set here.
     */
    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        bytes memory approvalCall = abi.encodeCall(token.approve, (spender, value));

        if (!_callOptionalReturnBool(token, approvalCall)) {
            _callOptionalReturn(token, abi.encodeCall(token.approve, (spender, 0)));
            _callOptionalReturn(token, approvalCall);
        }
    }

    /**
     * @dev Performs an {ERC1363} transferAndCall, with a fallback to the simple {ERC20} transfer if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            safeTransfer(token, to, value);
        } else if (!token.transferAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} transferFromAndCall, with a fallback to the simple {ERC20} transferFrom if the target
     * has no code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferFromAndCallRelaxed(
        IERC1363 token,
        address from,
        address to,
        uint256 value,
        bytes memory data
    ) internal {
        if (to.code.length == 0) {
            safeTransferFrom(token, from, to, value);
        } else if (!token.transferFromAndCall(from, to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} approveAndCall, with a fallback to the simple {ERC20} approve if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * NOTE: When the recipient address (`to`) has no code (i.e. is an EOA), this function behaves as {forceApprove}.
     * Opposedly, when the recipient address (`to`) has code, this function only attempts to call {ERC1363-approveAndCall}
     * once without retrying, and relies on the returned value to be true.
     *
     * Reverts if the returned value is other than `true`.
     */
    function approveAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            forceApprove(token, to, value);
        } else if (!token.approveAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     *
     * This is a variant of {_callOptionalReturnBool} that reverts if call fails to meet the requirements.
     */
    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        uint256 returnSize;
        uint256 returnValue;
        assembly ("memory-safe") {
            let success := call(gas(), token, 0, add(data, 0x20), mload(data), 0, 0x20)
            // bubble errors
            if iszero(success) {
                let ptr := mload(0x40)
                returndatacopy(ptr, 0, returndatasize())
                revert(ptr, returndatasize())
            }
            returnSize := returndatasize()
            returnValue := mload(0)
        }

        if (returnSize == 0 ? address(token).code.length == 0 : returnValue != 1) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     *
     * This is a variant of {_callOptionalReturn} that silently catches all reverts and returns a bool instead.
     */
    function _callOptionalReturnBool(IERC20 token, bytes memory data) private returns (bool) {
        bool success;
        uint256 returnSize;
        uint256 returnValue;
        assembly ("memory-safe") {
            success := call(gas(), token, 0, add(data, 0x20), mload(data), 0, 0x20)
            returnSize := returndatasize()
            returnValue := mload(0)
        }
        return success && (returnSize == 0 ? address(token).code.length > 0 : returnValue == 1);
    }
}


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}


// File contracts/BorrowProtocol.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.28;




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
