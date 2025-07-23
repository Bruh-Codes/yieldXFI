import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { vars } from "hardhat/config";
const YieldTokenModule = buildModule("YieldTokenModule", (m) => {
	const YieldToken = m.contract("YieldToken", [
		m.getAccount(0),
		"crossFiYield",
		"XFY",
	]); //constructor args

	return { YieldToken };
});

export default YieldTokenModule;
