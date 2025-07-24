# yieldXFI

yieldXFI is a decentralized finance (DeFi) protocol that allows users to stake assets, earn yield, and borrow against their collateral. This monorepo contains both the frontend application and the Solidity smart contracts.

## Project Structure

- `apps/yieldXFI`: The Next.js frontend application.
- `solidity`: The Hardhat project containing the Solidity smart contracts.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Yarn

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/yieldXFI.git
    cd yieldXFI
    ```

2.  **Install dependencies for the entire project:**
    ```bash
    yarn install
    ```

## Frontend (`apps/yieldXFI`)

To run the frontend development server:

```bash
cd apps/yieldXFI
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Smart Contracts (`solidity`)

### Setup

1.  Navigate to the `solidity` directory:

    ```bash
    cd solidity
    ```

2.  Create a `.env` file and add your private key:
    ```
    ACCOUNT_PRIVATE_KEY=your_private_key
    ```

### Commands

- **Compile:**
  ```bash
  npx hardhat compile
  ```
- **Test:**
  ```bash
  npx hardhat test
  ```
- **Deploy:**
  ```bash
  npx hardhat ignition deploy ./ignition/modules/YieldPoolModule.ts --network crossfi
  ```

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **Smart Contracts**: Solidity, Hardhat, Ethers.js
- **Blockchain**: CrossFi Testnet

## License

This project is licensed under the MIT License.
