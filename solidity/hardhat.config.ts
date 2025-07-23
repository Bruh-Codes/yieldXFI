// import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import "solidity-coverage";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";

import { vars } from "hardhat/config";
const ACCOUNT_PRIVATE_KEY = vars.get("ACCOUNT_PRIVATE_KEY");

if (!ACCOUNT_PRIVATE_KEY) {
	throw new Error(
		`ACCOUNT_PRIVATE_KEY is not set. "use npx hardhat vars set ACCOUNT_PRIVATE_KEY"`
	);
}

const config = {
	gasReporter: {
		enabled: false,
		outputFile: "gas-report.txt",
		noColors: true,
	},
	solidity: {
		version: "0.8.28",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		crossfi: {
			url: "https://crossfi-testnet.blastapi.io/e3605696-6684-43b0-a1b1-9fbf9b5f2517",
			accounts: [ACCOUNT_PRIVATE_KEY],
		},
	},

	sourcify: {
		enabled: false,
	},
};

export default config;
