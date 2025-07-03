import { buildModule } from "@nomicfoundation/ignition-core";
import YieldPoolModule from "./YieldPool";

const BorrowProtocolModule = buildModule("BorrowProtocolModule", (m) => {
  const contractOwner = m.getAccount(0);

  const borrowProtocol = m.contract("BorrowProtocol", [
    m.getParameter("yieldPoolAddress"),
    contractOwner,
  ]);

  return { borrowProtocol };
});

export default BorrowProtocolModule;
