"use client";

import { config } from "@/lib/wagmi";
import { readContracts } from "@wagmi/core";
import { useEffect, useState } from "react";
import { erc20Abi } from "viem";
import { useBalance, usePublicClient } from "wagmi";

export const useGetAllowedTokens = (data: `0x${string}`[]) => {
	const [tokenDetails, setTokenDetails] = useState<
		{ address: string; name: string; symbol: string }[]
	>([]);
	const publicClient = usePublicClient();

	useEffect(() => {
		const fetchTokenDetails = async () => {
			if ([...data]?.length > 0) {
				const contracts = data
					.map((tokenAddress) => [
						{
							address: tokenAddress,
							abi: erc20Abi,
							functionName: "name",
						},
						{
							address: tokenAddress,
							abi: erc20Abi,
							functionName: "symbol",
						},
					])
					.flat();

				try {
					const results = await readContracts(config, {
						allowFailure: true, // Allow individual calls to fail
						contracts,
					});

					const details = [];
					let resultIndex = 0;
					for (let i = 0; i < data.length; i++) {
						const tokenAddress = data[i];
						if (tokenAddress === "0x0000000000000000000000000000000000000000") {
							details.push({
								address: tokenAddress,
								name: publicClient?.chain.nativeCurrency.name || "Native Token",
								symbol: publicClient?.chain.nativeCurrency.symbol || "NAT",
							});
							continue;
						}

						const nameResult = results[resultIndex];
						const symbolResult = results[resultIndex + 1];

						if (
							nameResult.status === "success" &&
							symbolResult.status === "success"
						) {
							details.push({
								address: tokenAddress,
								name: nameResult.result as string,
								symbol: symbolResult.result as string,
							});
						}
						resultIndex += 2;
					}

					setTokenDetails(details);
				} catch (error) {
					console.error("Error fetching token details:", error);
				}
			}
		};

		fetchTokenDetails();
	}, [data, publicClient]);

	return { tokenDetails };
};

export const useGetBallance = (
	walletAddress: `0x${string}`,
	tokenAddress: `0x${string}`
) => {
	const results = useBalance({
		address: walletAddress as unknown as `0x${string}`,
		token: tokenAddress,
	});

	return results;
};

export { default as useCollateralAssets } from "./useCollateralAssets";
