"use client";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AssetSelector from "./AssetSelector";
import AmountInput from "./AmountInput";
import { useCollateralAssets } from "@/hooks";

export type Asset = {
	balance?: string;
	address: `0x${string}`;
	name: string;
	symbol: string;
};

interface collateralAssetProps {
	address: `0x${string}`;
	setCustomCollateralAmount: React.Dispatch<React.SetStateAction<string>>;
	setSelectedCollateral: React.Dispatch<React.SetStateAction<Asset>>;
	customCollateralAmount: string;
	selectedCollateral: Asset | object;
	minimumCollateral: number;
	tokenDetails: {
		address: string;
		name: string;
		symbol: string;
	}[];
}

const CollateralAssets = ({
	address,
	tokenDetails,
	...props
}: collateralAssetProps) => {
	const { collateralAssetsWithBalance, isLoading } = useCollateralAssets(
		address,
		tokenDetails
	);

	return (
		<Card className="bg-white space-y-7 p-5 dark:bg-slate-800/50 mb-6 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
			<h2 className="text-md font-semibold mb-6">Provide Collateral</h2>

			<Suspense fallback={<Skeleton className="h-14 w-full bg-[#432d9225]" />}>
				<AssetSelector
					isCollateralWithBalanceLoading={isLoading}
					label="Collateral Asset"
					assets={
						collateralAssetsWithBalance as {
							address: string;
							name: string;
							symbol: string;
						}[]
					}
					onSelect={(asset) => props.setSelectedCollateral(JSON.parse(asset))}
				/>
			</Suspense>

			<Suspense fallback={<Skeleton className="h-14 w-full bg-[#432d9225]" />}>
				<AmountInput
					minimumCollateral={props.minimumCollateral}
					label="Collateral Amount"
					value={props.customCollateralAmount}
					selectedCollateral={props.selectedCollateral}
					onChange={props.setCustomCollateralAmount}
					max={
						"balance" in props.selectedCollateral
							? props.selectedCollateral.balance
							: undefined
					}
					symbol={
						"symbol" in props.selectedCollateral
							? props.selectedCollateral.symbol
							: undefined
					}
				/>
			</Suspense>
		</Card>
	);
};

export default CollateralAssets;
