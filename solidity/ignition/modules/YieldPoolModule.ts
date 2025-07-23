import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import YieldTokenModule from "./YieldTokenModule";
import { vars } from "hardhat/config";

// const INITIAL_OWNER = vars.get("ACCOUNT_ADDRESS");
const INITIAL_OWNER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const YieldPoolModule = buildModule("YieldPoolModule", (m) => {
	const { YieldToken } = m.useModule(YieldTokenModule);
	const YieldPool = m.contract("YieldPool", [YieldToken, 10, 86400, 31536000, 5]); // Added 5% protocol fee
	m.call(YieldToken, "transferOwnership", [YieldPool], { from: m.getAccount(0) });

	return {
		YieldPool,
	};
});

export default YieldPoolModule;
