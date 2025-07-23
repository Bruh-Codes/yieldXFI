/* eslint-disable @typescript-eslint/no-explicit-any */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import yieldTokenConfig from "@/contract-deployments/abis/YieldTokenModule#YieldToken.json";
import yieldPoolConfig from "@/contract-deployments/abis/YieldPoolModule#YieldPool.json";
import borrowConfig from "@/contract-deployments/abis/BorrowProtocolModule#BorrowProtocol.json";
// import borrowConfig from "@/contract-deployments/abis/BorrowProtocol.json";
import addresses from "@/contract-deployments/deployments.json";
import { Abi } from "viem";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const YieldTokenAddress = addresses[
	"YieldTokenModule#YieldToken"
] as `0x${string}`;
export const YieldPoolAddress = addresses[
	"YieldPoolModule#YieldPool"
] as `0x${string}`;
export const BorrowAddress = addresses[
	"BorrowProtocolModule#BorrowProtocol"
] as `0x${string}`;

export const getYieldPoolConfig = (
	functionName: string,
	args?: any[],
	value?: bigint
) => {
	const base = {
		abi: yieldPoolConfig.abi as Abi,
		address: YieldPoolAddress!,
		functionName,
		...(args && { args }),
	};

	return value ? { ...base, value } : base;
};
export const getYieldTokenConfig = (functionName: string, args?: any[]) => {
	return {
		abi: yieldTokenConfig.abi as Abi,
		address: YieldTokenAddress,
		functionName: functionName,
		...(args && { args }),
	};
};
export const getBorrowConfig = (
	functionName: string,
	args?: any[],
	value?: bigint
) => {
	const base = {
		abi: borrowConfig.abi as Abi,
		address: BorrowAddress,
		functionName: functionName,
		...(args && { args }),
	};
	return value ? { ...base, value } : base;
};
