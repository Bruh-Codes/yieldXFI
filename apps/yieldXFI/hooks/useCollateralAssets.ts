import { Asset } from "@/components/CollateralAssets";
import { formatUnits } from "viem";
import { config } from "@/lib/wagmi";
import { readContract, getBalance } from "@wagmi/core";
import { erc20Abi } from "viem";
import { useQuery } from "@tanstack/react-query";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const useCollateralAssets = (
	address: `0x${string}`,
	tokenDetails: {
		address: string;
		name: string;
		symbol: string;
	}[]
) => {
	const getTokenBalances = async (): Promise<Asset[]> => {
		if (!address || tokenDetails.length === 0) return [];

		const balances = await Promise.all(
			tokenDetails.map(async (token) => {
				try {
					let rawBalance = BigInt(0);
					let decimals = 18;

					if (token.address === ZERO_ADDRESS) {
						const native = await getBalance(config, { address });
						rawBalance = native.value;
						decimals = native.decimals;
					} else {
						const [raw, tokenDecimals] = await Promise.all([
							readContract(config, {
								address: token.address as `0x${string}`,
								abi: erc20Abi,
								functionName: "balanceOf",
								args: [address],
							}),
							readContract(config, {
								address: token.address as `0x${string}`,
								abi: erc20Abi,
								functionName: "decimals",
							}).catch(() => {
								console.warn(`Using default decimals (18) for ${token.symbol}`);
								return 18;
							}),
						]);

						rawBalance = raw as bigint;
						decimals = tokenDecimals as number;
					}

					return {
						...token,
						address: token.address as `0x${string}`,
						icon: token.symbol,
						balance: formatUnits(rawBalance, decimals),
					} as Asset;
				} catch (err) {
					console.error(`Failed to fetch balance for ${token.symbol}`, err);
					return {
						...token,
						address: token.address as `0x${string}`,
						icon: token.symbol,
						balance: "0",
					} as Asset;
				}
			})
		);

		return balances;
	};

	const { data: collateralAssetsWithBalance, isLoading } = useQuery<Asset[]>({
		queryKey: ["collateralAssets", address, tokenDetails],
		queryFn: getTokenBalances,
		enabled: Boolean(address && tokenDetails.length),
	});

	return { collateralAssetsWithBalance, isLoading };
};

export default useCollateralAssets;
