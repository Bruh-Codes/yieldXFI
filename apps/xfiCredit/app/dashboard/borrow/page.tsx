"use client";

import { Info } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useGetAllowedTokens } from "@/hooks";
import { useAppKitAccount } from "@reown/appkit/react";
import {
	getBorrowConfig,
	getYieldPoolConfig,
	YieldTokenAddress,
} from "@/lib/utils";
import { useReadContract } from "wagmi";
import CollateralAssets, { Asset } from "@/components/CollateralAssets";
import BorrowAssets from "@/components/BorrowAssets";
import BorrowDetails from "@/components/BorrowDetails";
import { parseEther } from "viem";
import { readContract } from "@wagmi/core";
import { config } from "@/lib/wagmi";

const Page = () => {
	const { address } = useAppKitAccount();

	const { data: allowedTokensData } = useReadContract({
		...getYieldPoolConfig("getAllowedTokens"),
	});

	// const collateralAssetsWithBalance = useGetBallance(address as unknown as `0x${string}`,allowedTokensData)
	const { tokenDetails } = useGetAllowedTokens(
		(allowedTokensData || []) as `0x${string}`[]
	);

	const [customCollateralAmount, setCustomCollateralAmount] = useState("");
	const [borrowAmount, setBorrowAmount] = useState("");
	const [healthFactor, setHealthFactor] = useState(0);

	const [customDuration, setCustomDuration] = useState("");
	const [customInputActive, setCustomInputActive] = useState(false);
	const [duration, setDuration] = useState(30); // Default to 30 days
	const [selectedCollateral, setSelectedCollateral] = useState<Asset>({
		address: "0x0000000000000000000000000000000000000000",
		name: "",
		symbol: "",
	});

	const borrowAssets =
		tokenDetails.filter(
			(asset) => asset.symbol !== "XFY" && asset.symbol !== "crossFiYield"
		) || [];

	const [selectedBorrowAsset, setSelectedBorrowAsset] = useState<Asset>({
		address: "0x0000000000000000000000000000000000000000",
		name: "",
		symbol: "",
	});

	const minimumCollateral = 0.8;

	const getSuggestedInterestRate = ({
		durationDays,
		healthFactor,
	}: {
		durationDays: number;
		healthFactor: number;
	}): number => {
		// Base rate by duration
		let baseRate: number;

		if (durationDays <= 7) baseRate = 3.5;
		else if (durationDays <= 30) baseRate = 5.2;
		else if (durationDays <= 90) baseRate = 8.4;
		else baseRate = 10.0; // Custom or long durations

		// Adjust by health factor
		if (healthFactor > 2.0) return baseRate - 0.5; // Safe borrower discount
		else if (healthFactor < 1.5) return baseRate + 2.0; // Risk premium
		else return baseRate; // Normal borrower
	};

	useEffect(() => {
		const calculateHealthFactor = async (
			amount: bigint,
			borrowAmount: bigint
		) => {
			if (borrowAmount === BigInt(0)) return 0;
			const result = await readContract(config, {
				...getBorrowConfig("calculateHealthFactorSimulated", [
					amount,
					borrowAmount,
					YieldTokenAddress,
				]),
			});
			return Number(result as bigint) / 100;
		};

		const fetch = async () => {
			const collateral = customCollateralAmount
				? parseEther(customCollateralAmount)
				: BigInt(0);
			const borrow = borrowAmount ? parseEther(borrowAmount) : BigInt(0);
			const hf = await calculateHealthFactor(collateral, borrow);
			setHealthFactor(hf);
		};

		fetch();
	}, [borrowAmount, customCollateralAmount]);

	useEffect(() => {
		setSelectedBorrowAsset({
			address: "0x0000000000000000000000000000000000000000",
			name: "",
			symbol: "",
		});
	}, [selectedCollateral]);

	return (
		<div className="max-w-7xl py-8 mx-auto">
			<div className="flex justify-between flex-wrap items-center gap-2 mb-6">
				<h1 className="text-2xl font-bold">Borrow</h1>
				<div className="flex items-center gap-2 text-sm bg-blue-900/30 text-app-blue p-2 rounded-lg">
					<Info size={16} />
					<span>Borrow assets using your crypto as collateral</span>
				</div>
			</div>

			<div className="grid grid-cols-12 gap-6">
				<div className="col-span-12 lg:col-span-8">
					<CollateralAssets
						minimumCollateral={minimumCollateral}
						address={address as `0x${string}`}
						customCollateralAmount={customCollateralAmount}
						selectedCollateral={selectedCollateral}
						setCustomCollateralAmount={setCustomCollateralAmount}
						setSelectedCollateral={setSelectedCollateral}
						tokenDetails={tokenDetails}
					/>

					<BorrowAssets
						healthFactor={healthFactor}
						minimumCollateral={minimumCollateral}
						borrowAmount={borrowAmount}
						setBorrowAmount={setBorrowAmount}
						borrowAssets={borrowAssets}
						setSelectedBorrowAsset={setSelectedBorrowAsset}
						customCollateralAmount={customCollateralAmount}
						selectedBorrowAsset={selectedBorrowAsset}
						setCustomDuration={setCustomDuration}
						duration={duration}
						setDuration={setDuration}
						customInputActive={customInputActive}
						setCustomInputActive={setCustomInputActive}
						selectedCollateral={selectedCollateral}
						INTEREST_RATE={getSuggestedInterestRate({
							durationDays: duration,
							healthFactor,
						})}
					/>
				</div>

				{/* Right column - Info Panels */}

				<BorrowDetails
					collateralAmount={customCollateralAmount}
					healthFactor={healthFactor}
					borrowAmount={borrowAmount}
					customInputActive={customInputActive}
					selectedCollateral={selectedCollateral}
					customDuration={customDuration}
					duration={duration}
					selectedBorrowAsset={selectedBorrowAsset}
				/>
			</div>
		</div>
	);
};

export default Page;
