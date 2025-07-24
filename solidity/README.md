# yieldXFI Solidity Contracts

This directory contains the Solidity smart contracts for the yieldXFI protocol.

## Contracts

- **YieldPool.sol**: Manages deposits, staking, and yield generation.
- **YieldToken.sol**: The ERC20 token rewarded to users.
- **BorrowProtocol.sol**: Manages borrowing and lending.

## Core Features

### YieldPool
- **Staking:** Deposit and stake both native and ERC20 tokens.
- **Yield Generation:** Earn yield on staked assets over a specified duration.
- **Flexible Durations:** Lock assets for a chosen period to earn rewards.
- **Early Withdrawal:** Option to withdraw assets before the lock period ends, with a penalty.
- **Admin Controls:** Governance features to manage allowed tokens and update yield parameters.

### BorrowProtocol
- **Lending and Borrowing:** Borrow assets against your staked collateral.
- **Health Factor:** A risk management system to monitor the health of loans.
- **Liquidation:** A mechanism to liquidate under-collateralized loans, ensuring protocol solvency.

### YieldToken
- **Reward Token:** An ERC20 token used to reward users for staking.
- **Controlled Minting:** Only the `YieldPool` contract can mint new `YieldToken`s, ensuring a controlled supply.

## Getting Started

### Prerequisites

- Node.js v18+
- Yarn
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/yieldXFI.git
   cd yieldXFI/solidity
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the `solidity` directory and add your private key:

   ```
   ACCOUNT_PRIVATE_KEY=your_private_key
   ```

### Compilation

To compile the contracts, run:

```bash
npx hardhat compile
```

### Testing

To run the test suite:

```bash
npx hardhat test
```

### Deployment

To deploy the contracts, run:

```bash
npx hardhat ignition deploy ./ignition/modules/YieldPoolModule.ts --network crossfi
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.