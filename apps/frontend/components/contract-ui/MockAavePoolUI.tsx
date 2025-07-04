"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

// ABI for MockAavePool (truncated for brevity, full ABI would be here)
const mockAavePoolABI = [
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
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "balances",
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
          "name": "asset",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "onBehalfOf",
          "type": "address"
        }
      ],
      "name": "deposit",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "asset",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        }
      ],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

export function MockAavePoolUI() {
  const [contractAddress, setContractAddress] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);

  // State for form inputs (example for 'deposit' function)
  const [depositForm, setDepositForm] = useState({
    asset: "",
    amount: "",
    onBehalfOf: "",
  });

  // State for read function outputs (example for 'balances')
  const [balance, setBalance] = useState<string | null>(null);

  // Dummy event data (MockAavePool doesn't have events in the provided ABI, but including for consistency)
  const [events, setEvents] = useState<any[]>([]);

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

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Withdraw function called.");
    // Placeholder for contract interaction logic
    alert("Withdraw function simulated. Integrate your web3 logic here!");
  };

  const handleGetBalance = (userAddress: string, tokenAddress: string) => {
    console.log("Calling balances for user:", userAddress, "token:", tokenAddress);
    // Placeholder for contract interaction logic
    setBalance("1000000000000000000"); // Example balance (1 token with 18 decimals)
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">Mock Aave Pool UI</h1>

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
              placeholder="Enter MockAavePool contract address"
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
              <Label htmlFor="depositAsset">Asset Address</Label>
              <Input
                id="depositAsset"
                value={depositForm.asset}
                onChange={(e) => setDepositForm({ ...depositForm, asset: e.target.value })}
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
              <Label htmlFor="depositOnBehalfOf">On Behalf Of (Address)</Label>
              <Input
                id="depositOnBehalfOf"
                value={depositForm.onBehalfOf}
                onChange={(e) => setDepositForm({ ...depositForm, onBehalfOf: e.target.value })}
                placeholder="0x... (defaults to your address)"
              />
            </div>
            <Button type="submit">Deposit</Button>
          </form>

          {/* Withdraw Function */}
          <form onSubmit={handleWithdrawSubmit} className="space-y-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">Withdraw</h3>
            <div>
              <Label htmlFor="withdrawAsset">Asset Address</Label>
              <Input id="withdrawAsset" placeholder="0x..." />
            </div>
            <div>
              <Label htmlFor="withdrawAmount">Amount</Label>
              <Input id="withdrawAmount" type="number" placeholder="e.g., 100" />
            </div>
            <div>
              <Label htmlFor="withdrawTo">To (Address)</Label>
              <Input id="withdrawTo" placeholder="0x... (defaults to your address)" />
            </div>
            <Button type="submit">Withdraw</Button>
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
          {/* balances */}
          <div className="p-4 border rounded-md space-y-2">
            <h3 className="text-lg font-semibold">Get Balance</h3>
            <p className="text-sm text-gray-500">Returns the balance of an asset for a given user.</p>
            <div>
              <Label htmlFor="balanceUserAddress">User Address</Label>
              <Input id="balanceUserAddress" placeholder="0x..." />
            </div>
            <div>
              <Label htmlFor="balanceTokenAddress">Token Address</Label>
              <Input id="balanceTokenAddress" placeholder="0x..." />
            </div>
            <Button onClick={() => handleGetBalance(
                (document.getElementById('balanceUserAddress') as HTMLInputElement).value,
                (document.getElementById('balanceTokenAddress') as HTMLInputElement).value
              )}>Get Balance</Button>
            {balance && <p className="mt-2">Balance: <span className="font-mono">{balance}</span></p>}
          </div>
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>Recent events emitted by the contract.</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-center text-gray-500 mt-4">No events found for MockAavePool.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  {/* Add more TableHead based on event properties */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    {/* Add more TableCell based on event properties */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
