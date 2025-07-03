import { buildModule } from "@nomicfoundation/ignition-core";
import YieldPoolModule from "./YieldPool";

const BorrowProtocolModule = buildModule("BorrowProtocolModule", (m) => {
  const contractOwner = m.getAccount(0);
  const { yieldPool } = m.useModule(YieldPoolModule);

  const borrowProtocol = m.contract("BorrowProtocol", [
    yieldPool,
    contractOwner,
  ]);

  return { borrowProtocol };
});

export default BorrowProtocolModule;
