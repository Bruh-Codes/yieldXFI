"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

// ABI for BorrowProtocol (truncated for brevity, full ABI would be here)
const borrowProtocolABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_yieldPoolAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_aaveLikeYieldPoolAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_xfiAddress",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "SafeERC20FailedOperation",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "active",
          "type": "bool"
        }
      ],
      "name": "ActiveLoanUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "CollateralDeposited",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "CollateralWithdrawn",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "stakedAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "borrowedAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "destinationChainId",
          "type": "uint256"
        }
      ],
      "name": "CrossChainDataSent",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "duration",
          "type": "uint256"
        }
      ],
      "name": "LoanCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "liquidator",
          "type": "address"
        }
      ],
      "name": "LoanLiquidated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "LoanRepaid",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "funder",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "PoolFunded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        }
      ],
      "name": "ProtocolFeeCollected",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_collateralToken",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_collateralAmount",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_borrowToken",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_borrowAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_duration",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_destinationChainId",
          "type": "uint256"
        }
      ],
      "name": "Borrow",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "calculateCreditScore",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_collateralAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_borrowAmount",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_collateralToken",
          "type": "address"
        }
      ],
      "name": "calculateHealthFactorSimulated",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        }
      ],
      "name": "calculateTotalDue",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "crossChainBorrowedAmount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "crossChainStakedAmount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "fundPool",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAaveLikeYieldPool",
      "outputs": [
        {
          "internalType": "contract IMockAavePool",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAaveLikeYieldPoolAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getCreditProfile",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "totalBorrowed",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "totalRepaid",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "activeLoans",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "onTimeRepayments",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "lateRepayments",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "lastUpdated",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "score",
              "type": "uint256"
            }
          ],
          "internalType": "struct BorrowProtocol.CreditProfile",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getCreditScore",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCurrentLoanId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "getLiquidationThreshold",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_tokenAddress",
          "type": "address"
        }
      ],
      "name": "getMinCollateralAmount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getMinHealthFactor",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "getMinimumCollateralAmount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getMinimumDuration",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getMinimumHealthFactor",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getProtocolFee",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTreasury",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        }
      ],
      "name": "getUserLoan",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "loanId",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "collateralAmount",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "collateralToken",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "borrowToken",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "borrowAmount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "duration",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "startTime",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "interestRate",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "userAddress",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amountPaid",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "active",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "chainId",
              "type": "uint256"
            }
          ],
          "internalType": "struct BorrowProtocol.Loan",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserLoanIds",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserLoans",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "loanId",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "collateralAmount",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "collateralToken",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "borrowToken",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "borrowAmount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "duration",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "startTime",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "interestRate",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "userAddress",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amountPaid",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "active",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "chainId",
              "type": "uint256"
            }
          ],
          "internalType": "struct BorrowProtocol.Loan[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getXfiAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getYieldPool",
      "outputs": [
        {
          "internalType": "contract IYieldPool",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "loanId",
          "type": "uint256"
        }
      ],
      "name": "liquidate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_loanId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_destinationChainId",
          "type": "uint256"
        }
      ],
      "name": "payLoan",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_stakedAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_borrowedAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_sourceChainId",
          "type": "uint256"
        }
      ],
      "name": "receiveCrossChainData",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "receiveFunds",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "score",
          "type": "uint256"
        }
      ],
      "name": "setCreditScoreForTesting",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "threshold",
          "type": "uint256"
        }
      ],
      "name": "setLiquidationThreshold",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_token",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_minimumCollateralAmount",
          "type": "uint256"
        }
      ],
      "name": "setMinCollateralAmount",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_minHealthFactor",
          "type": "uint256"
        }
      ],
      "name": "setMinHealthFactor",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_minimumDuration",
          "type": "uint256"
        }
      ],
      "name": "setMinimumDuration",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_protocolFee",
          "type": "uint256"
        }
      ],
      "name": "setProtocolFee",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_treasury",
          "type": "address"
        }
      ],
      "name": "setTreasury",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_yieldPoolAddress",
          "type": "address"
        }
      ],
      "name": "setYieldPool",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ];

export function BorrowProtocolUI() {
  const [contractAddress, setContractAddress] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);

  // State for form inputs (example for 'Borrow' function)
  const [borrowForm, setBorrowForm] = useState({
    collateralToken: "",
    collateralAmount: "",
    borrowToken: "",
    borrowAmount: "",
    duration: "",
    destinationChainId: "",
    value: "", // for payable function
  });

  // State for read function outputs (example for 'getTreasury')
  const [treasuryAddress, setTreasuryAddress] = useState<string | null>(null);
  const [creditScore, setCreditScore] = useState<string | null>(null);
  const [userLoanIds, setUserLoanIds] = useState<string[] | null>(null);

  // Dummy event data
  const [events, setEvents] = useState<any[]>([
    { name: "LoanCreated", user: "0xabc...", loanId: "1", amount: "100", token: "0xdef...", duration: "3600" },
    { name: "CollateralDeposited", user: "0x123...", token: "0x456...", amount: "500" },
  ]);

  const handleConnectWallet = () => {
    // Placeholder for wallet connection logic
    console.log("Connecting wallet...");
    setWalletConnected(true);
  };

  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Borrow function called with:", borrowForm);
    // Placeholder for contract interaction logic
    alert("Borrow function simulated. Integrate your web3 logic here!");
  };

  const handleFundPoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Fund Pool function called.");
    // Placeholder for contract interaction logic
    alert("Fund Pool function simulated. Integrate your web3 logic here!");
  };

  const handleGetTreasury = () => {
    console.log("Calling getTreasury...");
    // Placeholder for contract interaction logic
    setTreasuryAddress("0xTreasuryAddressPlaceholder"); // Replace with actual data
  };

  const handleGetCreditScore = (userAddress: string) => {
    console.log("Calling getCreditScore for:", userAddress);
    // Placeholder for contract interaction logic
    setCreditScore("850"); // Replace with actual data
  };

  const handleGetUserLoanIds = (userAddress: string) => {
    console.log("Calling getUserLoanIds for:", userAddress);
    // Placeholder for contract interaction logic
    setUserLoanIds(["1", "3", "5"]); // Replace with actual data
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">Borrow Protocol UI</h1>

      <Card>
        <CardHeader>
          <CardTitle>Contract Setup</CardTitle>
          <CardDescription>Connect your wallet and set the contract address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Button onClick={handleConnectWallet} disabled={walletConnected}>
              {walletConnected ? "Wallet Connected" : "Connect Wallet"}
            </Button>
            {walletConnected && <span className="text-green-500">✅</span>}
          </div>
          <div>
            <Label htmlFor="contractAddress">Contract Address</Label>
            <Input
              id="contractAddress"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="Enter BorrowProtocol contract address"
            />
          </div>
        </CardContent>
      </Card>

      {/* Write Functions */}
      <Card>
        <CardHeader>
          <CardTitle>Write Functions</CardTitle>
          <CardDescription>Interact with the contract by sending transactions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Borrow Function */}
          <form onSubmit={handleBorrowSubmit} className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">Borrow</h3>
            <div>
              <Label htmlFor="collateralToken">Collateral Token Address</Label>
              <Input
                id="collateralToken"
                value={borrowForm.collateralToken}
                onChange={(e) => setBorrowForm({ ...borrowForm, collateralToken: e.target.value })}
                placeholder="0x..."
              />
            </div>
            <div>
              <Label htmlFor="collateralAmount">Collateral Amount</Label>
              <Input
                id="collateralAmount"
                type="number"
                value={borrowForm.collateralAmount}
                onChange={(e) => setBorrowForm({ ...borrowForm, collateralAmount: e.target.value })}
                placeholder="e.g., 100"
              />
            </div>
            <div>
              <Label htmlFor="borrowToken">Borrow Token Address</Label>
              <Input
                id="borrowToken"
                value={borrowForm.borrowToken}
                onChange={(e) => setBorrowForm({ ...borrowForm, borrowToken: e.target.value })}
                placeholder="0x..."
              />
            </div>
            <div>
              <Label htmlFor="borrowAmount">Borrow Amount</Label>
              <Input
                id="borrowAmount"
                type="number"
                value={borrowForm.borrowAmount}
                onChange={(e) => setBorrowForm({ ...borrowForm, borrowAmount: e.target.value })}
                placeholder="e.g., 50"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={borrowForm.duration}
                onChange={(e) => setBorrowForm({ ...borrowForm, duration: e.target.value })}
                placeholder="e.g., 86400 (1 day)"
              />
            </div>
            <div>
              <Label htmlFor="destinationChainId">Destination Chain ID</Label>
              <Input
                id="destinationChainId"
                type="number"
                value={borrowForm.destinationChainId}
                onChange={(e) => setBorrowForm({ ...borrowForm, destinationChainId: e.target.value })}
                placeholder="e.g., 1 (Ethereum Mainnet)"
              />
            </div>
            <div>
              <Label htmlFor="value">Value (for payable function, if applicable)</Label>
              <Input
                id="value"
                type="number"
                value={borrowForm.value}
                onChange={(e) => setBorrowForm({ ...borrowForm, value: e.target.value })}
                placeholder="e.g., 0.1 (ETH)"
              />
            </div>
            <Button type="submit">Borrow</Button>
          </form>

          {/* Fund Pool Function */}
          <form onSubmit={handleFundPoolSubmit} className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">Fund Pool</h3>
            <div>
              <Label htmlFor="fundPoolToken">Token Address</Label>
              <Input id="fundPoolToken" placeholder="0x..." />
            </div>
            <div>
              <Label htmlFor="fundPoolAmount">Amount</Label>
              <Input id="fundPoolAmount" type="number" placeholder="e.g., 1000" />
            </div>
            <Button type="submit">Fund Pool</Button>
          </form>

          {/* Add more write function forms here based on ABI */}
          {/* Example: setLiquidationThreshold */}
          <form className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">Set Liquidation Threshold</h3>
            <div>
              <Label htmlFor="setLiquidationToken">Token Address</Label>
              <Input id="setLiquidationToken" placeholder="0x..." />
            </div>
            <div>
              <Label htmlFor="setLiquidationThresholdAmount">Threshold</Label>
              <Input id="setLiquidationThresholdAmount" type="number" placeholder="e.g., 7500 (75%)" />
            </div>
            <Button type="submit">Set Threshold</Button>
          </form>

        </CardContent>
      </Card>

      {/* Read Functions */}
      <Card>
        <CardHeader>
          <CardTitle>Read Functions</CardTitle>
          <CardDescription>Retrieve data from the contract.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* getTreasury */}
          <div className="p-4 border rounded-md flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Get Treasury Address</h3>
              <p className="text-sm text-gray-500">Returns the address of the treasury.</p>
              {treasuryAddress && <p className="mt-2">Treasury Address: <span className="font-mono">{treasuryAddress}</span></p>}
            </div>
            <Button onClick={handleGetTreasury}>Get Treasury</Button>
          </div>

          {/* getCreditScore */}
          <div className="p-4 border rounded-md space-y-2">
            <h3 className="text-lg font-semibold">Get Credit Score</h3>
            <p className="text-sm text-gray-500">Returns the credit score for a given user.</p>
            <div>
              <Label htmlFor="creditScoreUserAddress">User Address</Label>
              <Input id="creditScoreUserAddress" placeholder="0x..." />
            </div>
            <Button onClick={() => handleGetCreditScore((document.getElementById('creditScoreUserAddress') as HTMLInputElement).value)}>Get Score</Button>
            {creditScore && <p className="mt-2">Credit Score: <span className="font-mono">{creditScore}</span></p>}
          </div>

          {/* getUserLoanIds */}
          <div className="p-4 border rounded-md space-y-2">
            <h3 className="text-lg font-semibold">Get User Loan IDs</h3>
            <p className="text-sm text-gray-500">Returns a list of loan IDs for a given user.</p>
            <div>
              <Label htmlFor="userLoanIdsAddress">User Address</Label>
              <Input id="userLoanIdsAddress" placeholder="0x..." />
            </div>
            <Button onClick={() => handleGetUserLoanIds((document.getElementById('userLoanIdsAddress') as HTMLInputElement).value)}>Get Loan IDs</Button>
            {userLoanIds && (
              <div className="mt-2">
                <p>Loan IDs:</p>
                <ul className="list-disc list-inside">
                  {userLoanIds.map((id, index) => (
                    <li key={index} className="font-mono">{id}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Add more read function displays here based on ABI */}
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>Recent events emitted by the contract.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Loan ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{event.user}</TableCell>
                  <TableCell>{event.loanId}</TableCell>
                  <TableCell>{event.amount}</TableCell>
                  <TableCell>{event.token}</TableCell>
                  <TableCell>{event.duration}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {events.length === 0 && <p className="text-center text-gray-500 mt-4">No events found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
