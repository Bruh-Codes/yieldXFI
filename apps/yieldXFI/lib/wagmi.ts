import { cookieStorage, createStorage } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { defineChain } from "@reown/appkit/networks";
// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
if (!projectId) {
	throw new Error("PROJECT_ID environment variable is not defined");
}

export const crossfi = defineChain({
	id: 4157,
	name: "crossfi testnet",
	chainNamespace: "eip155",
	caipNetworkId: "eip155:4157",
	nativeCurrency: {
		name: "crossfi testnet",
		symbol: "xfi",
		decimals: 18,
	},

	testnet: true,
	rpcUrls: {
		default: {
			http: [
				"https://crossfi-testnet.blastapi.io/e3605696-6684-43b0-a1b1-9fbf9b5f2517",
			],
		},
	},
	blockExplorers: {
		default: {
			name: "xfiScan",
			url: "https://test.xfiscan.com/dashboard",
		},
	},
});
export const localhost = defineChain({
	id: 31337,
	name: "Localhost",
	chainNamespace: "eip155",
	caipNetworkId: "eip155:31337",
	nativeCurrency: {
		name: "localhost",
		symbol: "LH",
		decimals: 18,
	},

	testnet: true,
	rpcUrls: {
		default: {
			http: [" http://127.0.0.1:8545"],
		},
	},
});

export const networks = [
	crossfi,
	//  localhost
];

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
	storage: createStorage({
		storage: cookieStorage,
	}),
	ssr: true,
	projectId,
	networks,
});

export const config = wagmiAdapter.wagmiConfig;
