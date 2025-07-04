import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import MocksModule from "./Mocks";
import YieldPoolModule from "./YieldPool";

const BorrowProtocolModule = buildModule("BorrowProtocolModule", (m) => {
    const { aveLikeAddress, xfiAddress } = m.useModule(MocksModule);
    const { yieldPool } = m.useModule(YieldPoolModule);

    const borrowProtocol = m.contract("BorrowProtocol", [
        yieldPool,
        m.getAccount(0),
        aveLikeAddress,
        xfiAddress,
    ]);

    return { borrowProtocol };
});

export default BorrowProtocolModule;