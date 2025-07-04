import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BorrowProtocolModule from "./BorrowProtocol";
import YieldPoolModule from "./YieldPool";

const DeploymentModule = buildModule("DeploymentModule", (m) => {
  const { yieldPool } = m.useModule(YieldPoolModule);
  const { borrowProtocol } = m.useModule(BorrowProtocolModule);

  m.call(yieldPool, "setBorrowProtocolAddress", [borrowProtocol]);

  return { borrowProtocol, yieldPool };
});

export default DeploymentModule;
