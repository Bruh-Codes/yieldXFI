
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MocksModule = buildModule("MocksModule", (m) => {
    const aveLikeAddress = m.contract("MockAavePool");
    const xfiAddress = m.contract("XFIMock");

    return { aveLikeAddress, xfiAddress };
});

export default MocksModule;
