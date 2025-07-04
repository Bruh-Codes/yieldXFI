"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

// ABI for XFIMock (truncated for brevity, full ABI would be here)
const xfiMockABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "allowance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        }
      ],
      "name": "ERC20InsufficientAllowance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "balance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        }
      ],
      "name": "ERC20InsufficientBalance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "approver",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidApprover",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidReceiver",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidSender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidSpender",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "allowance",
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
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOf",
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
      "name": "decimals",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "mint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
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
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

export function XFIMockUI() {
  const [contractAddress, setContractAddress] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);

  // State for form inputs (example for 'mint' function)
  const [mintForm, setMintForm] = useState({
    to: "",
    amount: "",
  });

  // State for read function outputs (example for 'balanceOf')
  const [balance, setBalance] = useState<string | null>(null);
  const [totalSupply, setTotalSupply] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState<string | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);
  const [tokenDecimals, setTokenDecimals] = useState<string | null>(null);
  const [allowance, setAllowance] = useState<string | null>(null);

  // Dummy event data
  const [events, setEvents] = useState<any[]>([
    { name: "Transfer", from: "0xabc...", to: "0xdef...", value: "100" },
    { name: "Approval", owner: "0x123...", spender: "0x456...", value: "500" },
  ]);

  const handleConnectWallet = () => {
    // Placeholder for wallet connection logic
    console.log("Connecting wallet...");
    setWalletConnected(true);
  };

  const handleMintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Mint function called with:", mintForm);
    // Placeholder for contract interaction logic
    alert("Mint function simulated. Integrate your web3 logic here!");
  };

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Approve function called.");
    // Placeholder for contract interaction logic
    alert("Approve function simulated. Integrate your web3 logic here!");
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Transfer function called.");
    // Placeholder for contract interaction logic
    alert("Transfer function simulated. Integrate your web3 logic here!");
  };

  const handleTransferFromSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("TransferFrom function called.");
    // Placeholder for contract interaction logic
    alert("TransferFrom function simulated. Integrate your web3 logic here!");
  };

  const handleGetBalanceOf = (accountAddress: string) => {
    console.log("Calling balanceOf for:", accountAddress);
    // Placeholder for contract interaction logic
    setBalance("1000000000000000000000"); // Example balance
  };

  const handleGetTotalSupply = () => {
    console.log("Calling totalSupply...");
    // Placeholder for contract interaction logic
    setTotalSupply("1000000000000000000000000"); // Example total supply
  };

  const handleGetTokenName = () => {
    console.log("Calling name...");
    // Placeholder for contract interaction logic
    setTokenName("XFI Mock Token");
  };

  const handleGetTokenSymbol = () => {
    console.log("Calling symbol...");
    // Placeholder for contract interaction logic
    setTokenSymbol("XFIM");
  };

  const handleGetTokenDecimals = () => {
    console.log("Calling decimals...");
    // Placeholder for contract interaction logic
    setTokenDecimals("18");
  };

  const handleGetAllowance = (ownerAddress: string, spenderAddress: string) => {
    console.log("Calling allowance for owner:", ownerAddress, "spender:", spenderAddress);
    // Placeholder for contract interaction logic
    setAllowance("500000000000000000000"); // Example allowance
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">XFI Mock Token UI</h1>

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
              placeholder="Enter XFIMock contract address"
            />
          </div>
        </CardContent>
      </Card>

      {/* Write Functions */}
      <Card>
        <CardHeader>
          <CardTitle>Write Functions</CardTitle>
          <CardDescription>Interact with the token by sending transactions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mint Function */}
          <form onSubmit={handleMintSubmit} className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">Mint Tokens</h3>
            <div>
              <Label htmlFor="mintTo">To Address</Label>
              <Input
                id="mintTo"
                value={mintForm.to}
                onChange={(e) => setMintForm({ ...mintForm, to: e.target.value })}
                placeholder="0x..."
              />
            </div>
            <div>
              <Label htmlFor="mintAmount">Amount</Label>
              <Input
                id="mintAmount"
                type="number"
                value={mintForm.amount}
                onChange={(e) => setMintForm({ ...mintForm, amount: e.target.value })}
                placeholder="e.g., 1000"
              />
            </div>
            <Button type="submit">Mint</Button>
          </form>

          {/* Approve Function */}
          <form onSubmit={handleApproveSubmit} className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">Approve Spender</h3>
            <div>
              <Label htmlFor="approveSpender">Spender Address</Label>
              <Input id="approveSpender" placeholder="0x..." />
            </div>
            <div>
              <Label htmlFor="approveValue">Value</Label>
              <Input id="approveValue" type="number" placeholder="e.g., 500" />
            </div>
            <Button type="submit">Approve</Button>
          </form>

          {/* Transfer Function */}
          <form onSubmit={handleTransferSubmit} className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">Transfer Tokens</h3>
            <div>
              <Label htmlFor="transferTo">To Address</Label>
              <Input id="transferTo" placeholder="0x..." />
            </div>
            <div>
              <Label htmlFor="transferValue">Value</Label>
              <Input id="transferValue" type="number" placeholder="e.g., 100" />
            </div>
            <Button type="submit">Transfer</Button>
          </form>

          {/* TransferFrom Function */}
          <form onSubmit={handleTransferFromSubmit} className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">Transfer From</h3>
            <div>
              <Label htmlFor="transferFromFrom">From Address</Label>
              <Input id="transferFromFrom" placeholder="0x..." />
            </div>
            <div>
              <Label htmlFor="transferFromTo">To Address</Label>
              <Input id="transferFromTo" placeholder="0x..." />
            </div>
            <div>
              <Label htmlFor="transferFromValue">Value</Label>
              <Input id="transferFromValue" type="number" placeholder="e.g., 50" />
            </div>
            <Button type="submit">Transfer From</Button>
          </form>

        </CardContent>
      </Card>

      {/* Read Functions */}
      <Card>
        <CardHeader>
          <CardTitle>Read Functions</CardTitle>
          <CardDescription>Retrieve data from the token contract.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* balanceOf */}
          <div className="p-4 border rounded-md space-y-2">
            <h3 className="text-lg font-semibold">Get Balance Of</h3>
            <p className="text-sm text-gray-500">Returns the amount of tokens owned by an account.</p>
            <div>
              <Label htmlFor="balanceOfAccount">Account Address</Label>
              <Input id="balanceOfAccount" placeholder="0x..." />
            </div>
            <Button onClick={() => handleGetBalanceOf((document.getElementById('balanceOfAccount') as HTMLInputElement).value)}>Get Balance</Button>
            {balance && <p className="mt-2">Balance: <span className="font-mono">{balance}</span></p>}
          </div>

          {/* totalSupply */}
          <div className="p-4 border rounded-md flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Get Total Supply</h3>
              <p className="text-sm text-gray-500">Returns the total number of tokens in existence.</p>
              {totalSupply && <p className="mt-2">Total Supply: <span className="font-mono">{totalSupply}</span></p>}
            </div>
            <Button onClick={handleGetTotalSupply}>Get Total Supply</Button>
          </div>

          {/* name */}
          <div className="p-4 border rounded-md flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Get Token Name</h3>
              <p className="text-sm text-gray-500">Returns the name of the token.</p>
              {tokenName && <p className="mt-2">Token Name: <span className="font-mono">{tokenName}</span></p>}
            </div>
            <Button onClick={handleGetTokenName}>Get Name</Button>
          </div>

          {/* symbol */}
          <div className="p-4 border rounded-md flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Get Token Symbol</h3>
              <p className="text-sm text-gray-500">Returns the symbol of the token.</p>
              {tokenSymbol && <p className="mt-2">Token Symbol: <span className="font-mono">{tokenSymbol}</span></p>}
            </div>
            <Button onClick={handleGetTokenSymbol}>Get Symbol</Button>
          </div>

          {/* decimals */}
          <div className="p-4 border rounded-md flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Get Token Decimals</h3>
              <p className="text-sm text-gray-500">Returns the number of decimals used to get its user representation.</p>
              {tokenDecimals && <p className="mt-2">Token Decimals: <span className="font-mono">{tokenDecimals}</span></p>}
            </div>
            <Button onClick={handleGetTokenDecimals}>Get Decimals</Button>
          </div>

          {/* allowance */}
          <div className="p-4 border rounded-md space-y-2">
            <h3 className="text-lg font-semibold">Get Allowance</h3>
            <p className="text-sm text-gray-500">Returns the amount of tokens that an owner allowed to a spender.</p>
            <div>
              <Label htmlFor="allowanceOwner">Owner Address</Label>
              <Input id="allowanceOwner" placeholder="0x..." />
            </div>
            <div>
              <Label htmlFor="allowanceSpender">Spender Address</Label>
              <Input id="allowanceSpender" placeholder="0x..." />
            </div>
            <Button onClick={() => handleGetAllowance(
                (document.getElementById('allowanceOwner') as HTMLInputElement).value,
                (document.getElementById('allowanceSpender') as HTMLInputElement).value
              )}>Get Allowance</Button>
            {allowance && <p className="mt-2">Allowance: <span className="font-mono">{allowance}</span></p>}
          </div>

        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>Recent events emitted by the token contract.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>From/Owner</TableHead>
                <TableHead>To/Spender</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{event.from || event.owner}</TableCell>
                  <TableCell>{event.to || event.spender}</TableCell>
                  <TableCell>{event.value}</TableCell>
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
