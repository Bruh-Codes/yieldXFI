"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BorrowProtocolUI } from "./BorrowProtocolUI";
import { MockAavePoolUI } from "./MockAavePoolUI";
import { XFIMockUI } from "./XFIMockUI";
import { YieldPoolUI } from "./YieldPoolUI";

export function ContractSelector() {
  const [selectedContract, setSelectedContract] = useState("BorrowProtocol");

  const renderContractUI = () => {
    switch (selectedContract) {
      case "BorrowProtocol":
        return <BorrowProtocolUI />;
      case "MockAavePool":
        return <MockAavePoolUI />;
      case "XFIMock":
        return <XFIMockUI />;
      case "YieldPool":
        return <YieldPoolUI />;
      default:
        return <p>Select a contract to view its UI.</p>;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-4xl font-bold text-center mb-8">Smart Contract UIs</h1>

      <div className="flex justify-center mb-8">
        <Select onValueChange={setSelectedContract} defaultValue={selectedContract}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a contract" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BorrowProtocol">Borrow Protocol</SelectItem>
            <SelectItem value="MockAavePool">Mock Aave Pool</SelectItem>
            <SelectItem value="XFIMock">XFI Mock Token</SelectItem>
            <SelectItem value="YieldPool">Yield Pool</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg p-4">
        {renderContractUI()}
      </div>
    </div>
  );
}
