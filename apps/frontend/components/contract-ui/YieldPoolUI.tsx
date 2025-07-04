"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

// ABI for YieldPool (truncated for brevity, full ABI would be here)
const yieldPoolABI = [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_yieldRate",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_minDuration",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_maxDuration",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "EnforcedPause",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ExpectedPause",
      "type": "error"
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
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
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
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "duration",
          "type": "uint256"
        }
      ],
      "name": "Deposited",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "EmergencyWithdrawalInitiated",
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
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Paused",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
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
      "name": "PenaltyCollected",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "token",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "allowed",
          "type": "bool"
        }
      ],
      "name": "TokenAllowedStatusChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "Unpaused",
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
          "indexed": false,
          "internalType": "uint256",
          "name": "yield",
          "type": "uint256"
        }
      ],
      "name": "Withdrawn",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "yieldRate",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "minDuration",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "maxDuration",
          "type": "uint256"
        }
      ],
      "name": "YieldParametersUpdated",
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
        }
      ],
      "name": "YieldReserveAdded",
      "type": "event"
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
      "name": "addYield",
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
      "name": "addYieldReserves",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "duration",
          "type": "uint256"
        }
      ],
      "name": "calculateYield",
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
      "name": "claimWithdrawal",
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
        },
        {
          "internalType": "uint256",
          "name": "duration",
          "type": "uint256"
        }
      ],
      "name": "deposit",
      "outputs": [],
      "stateMutability": "payable",
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
      "name": "executeEmergencyWithdrawal",
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
        }
      ],
      "name": "getActivePositionsCount",
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
      "name": "getActiveStakers",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllowedTokenList",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getEmergencyWithdrawalTime",
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
      "name": "getMaxDuration",
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
      "name": "getMinDuration",
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
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "getPendingWithdrawals",
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
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "getPosition",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "startTime",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "lockDuration",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "withdrawn",
              "type": "bool"
            }
          ],
          "internalType": "struct YieldPool.Position",
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
          "internalType": "uint256",
          "name": "positionId",
          "type": "uint256"
        }
      ],
      "name": "getPositionOwner",
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
      "name": "getStakerIndex",
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
      "name": "getTotalStakers",
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
      "name": "getTotalValueLocked",
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
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "getUserTokenBalance",
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
      "name": "getYieldRate",
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
      "name": "getYieldReserves",
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
      "name": "initiateEmergencyWithdrawal",
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
        }
      ],
      "name": "isTokenAllowed",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
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
      "inputs": [],
      "name": "paused",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
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
          "name": "_borrowProtocolAddress",
          "type": "address"
        }
      ],
      "name": "setBorrowProtocol",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_borrowProtocolAddress",
          "type": "address"
        }
      ],
      "name": "setBorrowProtocolAddress",
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
          "internalType": "bool",
          "name": "allowed",
          "type": "bool"
        }
      ],
      "name": "setTokenAllowed",
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
      "name": "transferToBorrowProtocol",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "positionId",
          "type": "uint256"
        }
      ],
      "name": "unstake",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_rate",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_min",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_max",
          "type": "uint256"
        }
      ],
      "name": "updateYieldParameters",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "positionId",
          "type": "uint256"
        }
      ],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ];

export function YieldPoolUI() {
  const [contractAddress, setContractAddress] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);

  // State for form inputs (example for 'deposit' function)
  const [depositForm, setDepositForm] = useState({
    token: "",
    amount: "",
    duration: "",
  });

  // State for read function outputs (example for 'getYieldRate')
  const [yieldRate, setYieldRate] = useState<string | null>(null);
  const [minDuration, setMinDuration] = useState<string | null>(null);
  const [maxDuration, setMaxDuration] = useState<string | null>(null);
  const [totalValueLocked, setTotalValueLocked] = useState<string | null>(null);
  const [isTokenAllowed, setIsTokenAllowed] = useState<boolean | null>(null);

  // Dummy event data
  const [events, setEvents] = useState<any[]>([
    { name: "Deposited", user: "0xabc...", token: "0xdef...", amount: "100", duration: "3600" },
    { name: "Withdrawn", user: "0x123...", token: "0x456...", amount: "50", yield: "5" },
  ]);

  const handleConnectWallet = () => {
    // Placeholder for wallet connection logic
    console.log("Connecting wallet...");
    setWalletConnected(true);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Deposit function called with:", depositForm);
    // Placeholder for contract interaction logic
    alert("Deposit function simulated. Integrate your web3 logic here!");
  };

  const handleUnstakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Unstake function called.");
    // Placeholder for contract interaction logic
    alert("Unstake function simulated. Integrate your web3 logic here!");
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Withdraw function called.");
    // Placeholder for contract interaction logic
    alert("Withdraw function simulated. Integrate your web3 logic here!");
  };

  const handleAddYieldReservesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("AddYieldReserves function called.");
    // Placeholder for contract interaction logic
    alert("AddYieldReserves function simulated. Integrate your web3 logic here!");
  };

  const handleGetYieldRate = () => {
    console.log("Calling getYieldRate...");
    // Placeholder for contract interaction logic
    setYieldRate("500"); // Example yield rate
  };

  const handleGetMinDuration = () => {
    console.log("Calling getMinDuration...");
    // Placeholder for contract interaction logic
    setMinDuration("86400"); // Example min duration (1 day)
  };

  const handleGetMaxDuration = () => {
    console.log("Calling getMaxDuration...");
    // Placeholder for contract interaction logic
    setMaxDuration("31536000"); // Example max duration (1 year)
  };

  const handleGetTotalValueLocked = () => {
    console.log("Calling getTotalValueLocked...");
    // Placeholder for contract interaction logic
    setTotalValueLocked("1000000000000000000000000"); // Example TVL
  };

  const handleIsTokenAllowed = (tokenAddress: string) => {
    console.log("Calling isTokenAllowed for:", tokenAddress);
    // Placeholder for contract interaction logic
    setIsTokenAllowed(true); // Example result
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">Yield Pool UI</h1>

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
              placeholder="Enter YieldPool contract address"
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
          {/* Deposit Function */}
          <form onSubmit={handleDepositSubmit} className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">Deposit</h3>
            <div>
              <Label htmlFor="depositToken">Token Address</Label>
              <Input
                id="depositToken"
                value={depositForm.token}
                onChange={(e) => setDepositForm({ ...depositForm, token: e.target.value })}
                placeholder="0x..."
              />
            </div>
            <div>
              <Label htmlFor="depositAmount">Amount</Label>
              <Input
                id="depositAmount"
                type="number"
                value={depositForm.amount}
                onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                placeholder="e.g., 100"
              />
            </div>
            <div>
              <Label htmlFor="depositDuration">Duration (seconds)</Label>
              <Input
                id="depositDuration"
                type="number"
                value={depositForm.duration}
                onChange={(e) => setDepositForm({ ...depositForm, duration: e.target.value })}
                placeholder="e.g., 86400 (1 day)"
              />
            </div>
            <Button type="submit">Deposit</Button>
          </form>

          {/* Unstake Function */}
          <form onSubmit={handleUnstakeSubmit} className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">Unstake</h3>
            <div>
              <Label htmlFor="unstakePositionId">Position ID</Label>
              <Input id="unstakePositionId" type="number" placeholder="e.g., 1" />
            </div>
            <Button type="submit">Unstake</Button>
          </form>

          {/* Withdraw Function */}
          <form onSubmit={handleWithdrawSubmit} className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">Withdraw</h3>
            <div>
              <Label htmlFor="withdrawPositionId">Position ID</Label>
              <Input id="withdrawPositionId" type="number" placeholder="e.g., 1" />
            </div>
            <Button type="submit">Withdraw</Button>
          </form>

          {/* Add Yield Reserves Function */}
          <form onSubmit={handleAddYieldReservesSubmit} className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">Add Yield Reserves</h3>
            <div>
              <Label htmlFor="addYieldToken">Token Address</Label>
              <Input id="addYieldToken" placeholder="0x..." />
            </div>
            <div>
              <Label htmlFor="addYieldAmount">Amount</Label>
              <Input id="addYieldAmount" type="number" placeholder="e.g., 1000" />
            </div>
            <Button type="submit">Add Reserves</Button>
          </form>

          {/* setTokenAllowed */}
          <form className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">Set Token Allowed</h3>
            <div>
              <Label htmlFor="setTokenAllowedAddress">Token Address</Label>
              <Input id="setTokenAllowedAddress" placeholder="0x..." />
            </div>
            <div>
              <Label htmlFor="setTokenAllowedStatus">Allowed</Label>
              <Select>
                <SelectTrigger id="setTokenAllowedStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Set Allowed</Button>
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
          {/* getYieldRate */}
          <div className="p-4 border rounded-md flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Get Yield Rate</h3>
              <p className="text-sm text-gray-500">Returns the current yield rate.</p>
              {yieldRate && <p className="mt-2">Yield Rate: <span className="font-mono">{yieldRate}</span></p>}
            </div>
            <Button onClick={handleGetYieldRate}>Get Yield Rate</Button>
          </div>

          {/* getMinDuration */}
          <div className="p-4 border rounded-md flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Get Minimum Duration</h3>
              <p className="text-sm text-gray-500">Returns the minimum staking duration.</p>
              {minDuration && <p className="mt-2">Min Duration: <span className="font-mono">{minDuration}</span></p>}
            </div>
            <Button onClick={handleGetMinDuration}>Get Min Duration</Button>
          </div>

          {/* getMaxDuration */}
          <div className="p-4 border rounded-md flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Get Maximum Duration</h3>
              <p className="text-sm text-gray-500">Returns the maximum staking duration.</p>
              {maxDuration && <p className="mt-2">Max Duration: <span className="font-mono">{maxDuration}</span></p>}
            </div>
            <Button onClick={handleGetMaxDuration}>Get Max Duration</Button>
          </div>

          {/* getTotalValueLocked */}
          <div className="p-4 border rounded-md flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Get Total Value Locked (TVL)</h3>
              <p className="text-sm text-gray-500">Returns the total value of assets locked in the pool.</p>
              {totalValueLocked && <p className="mt-2">TVL: <span className="font-mono">{totalValueLocked}</span></p>}
            </div>
            <Button onClick={handleGetTotalValueLocked}>Get TVL</Button>
          </div>

          {/* isTokenAllowed */}
          <div className="p-4 border rounded-md space-y-2">
            <h3 className="text-lg font-semibold">Is Token Allowed</h3>
            <p className="text-sm text-gray-500">Checks if a token is allowed for staking.</p>
            <div>
              <Label htmlFor="isTokenAllowedAddress">Token Address</Label>
              <Input id="isTokenAllowedAddress" placeholder="0x..." />
            </div>
            <Button onClick={() => handleIsTokenAllowed((document.getElementById('isTokenAllowedAddress') as HTMLInputElement).value)}>Check Allowed</Button>
            {isTokenAllowed !== null && <p className="mt-2">Token Allowed: <span className="font-mono">{isTokenAllowed.toString()}</span></p>}
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
                <TableHead>Token</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Duration/Yield</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{event.user}</TableCell>
                  <TableCell>{event.token}</TableCell>
                  <TableCell>{event.amount}</TableCell>
                  <TableCell>{event.duration || event.yield}</TableCell>
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
