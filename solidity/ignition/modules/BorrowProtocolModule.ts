import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { vars } from "hardhat/config";
import YieldPoolModule from "./YieldPoolModule";
import YieldTokenModule from "./YieldTokenModule";

const INITIAL_OWNER = vars.get("ACCOUNT_ADDRESS");

if (!INITIAL_OWNER) {
	throw new Error(
		"Please set the INITIAL_OWNER variable by running `npx hardhat vars set INITIAL_OWNER`"
	);
}

const BorrowProtocolModule = buildModule("BorrowProtocolModule", (m) => {
	const { YieldPool } = m.useModule(YieldPoolModule);
	const { YieldToken } = m.useModule(YieldTokenModule);

	const BorrowProtocol = m.contract("BorrowProtocol", [
		YieldPool,
		YieldToken,
		INITIAL_OWNER,
	]);

	return { BorrowProtocol };
});

export default BorrowProtocolModule;
