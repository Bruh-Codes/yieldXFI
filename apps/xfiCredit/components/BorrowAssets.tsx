"use client";
import { Card } from "@/components/ui/card";
import { Asset } from "./CollateralAssets";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useSimulateContract,
	useWaitForTransactionReceipt,
	useWriteContract,
} from "wagmi";
import { getBorrowConfig } from "@/lib/utils";
import { parseEther } from "viem";
import { useQueryClient } from "@tanstack/react-query";

const AssetSelector = lazy(() => import("./AssetSelector"));
const AmountInput = lazy(() => import("./AmountInput"));
const DurationSelector = lazy(() => import("@/components/DurationSelector"));
const HealthFactor = lazy(() => import("./HealthFactor"));
const Button = lazy(() =>
	import("@/components/ui/button").then((module) => ({
		default: module.Button,
	}))
);

interface borrowProps {
	borrowAssets: {
		address: string;
		name: string;
		symbol: string;
	}[];
	setSelectedBorrowAsset: (value: React.SetStateAction<Asset>) => void;
	borrowAmount: string;
	setBorrowAmount: React.Dispatch<React.SetStateAction<string>>;
	setCustomDuration: React.Dispatch<React.SetStateAction<string>>;
	setCustomInputActive: React.Dispatch<React.SetStateAction<boolean>>;
	setDuration: React.Dispatch<React.SetStateAction<number>>;
	selectedBorrowAsset: Asset;
	customCollateralAmount: string;
	customInputActive: boolean;
	duration: number;
	minimumCollateral: number;
	healthFactor: number;
	selectedCollateral: Asset;
	INTEREST_RATE: number;
}

const BorrowAssets = ({
	borrowAssets,
	setSelectedBorrowAsset,
	borrowAmount,
	setBorrowAmount,
	selectedBorrowAsset,
	setDuration,
	duration,
	setCustomInputActive,
	customInputActive,
	customCollateralAmount,
	minimumCollateral,
	selectedCollateral,
	healthFactor,
	INTEREST_RATE,
}: borrowProps) => {
	const buttonGridRef = useRef<HTMLDivElement>(null);
	const customInputRef = useRef<HTMLInputElement | null>(null);
	const [lockDurationCustom, setLockDurationCustom] = useState(0);
	const [showCustomInput, setShowCustomInput] = useState(false);
	const queryClient = useQueryClient();
	const HEALTH_FACTOR_DANGER = 1.5;

	useEffect(() => {
		const input = customInputRef.current;
		const onFocus = () => {
			setCustomInputActive(true);
			setDuration(lockDurationCustom);
		};
		const onBlur = (e: FocusEvent) => {
			const clicked = e.relatedTarget as Node;
			if (!buttonGridRef.current?.contains(clicked) && duration) {
				setCustomInputActive(false);
			}
		};

		input?.addEventListener("focus", onFocus);
		input?.addEventListener("blur", onBlur);
		return () => {
			input?.removeEventListener("focus", onFocus);
			input?.removeEventListener("blur", onBlur);
		};
	}, [duration, lockDurationCustom, setCustomInputActive, setDuration]);

	const { data: simulateBorrow, error: simulateBorrowError } =
		useSimulateContract({
			...getBorrowConfig(
				"borrowNative",
				[
					selectedCollateral.address,
					parseEther(customCollateralAmount),
					selectedBorrowAsset.address,
					parseEther(borrowAmount),
					duration * 24 * 60 * 60,
					Math.round(INTEREST_RATE),
				],
				parseEther(customCollateralAmount)
			),
		});

	const {
		data: borrowHash,
		writeContract: borrow,
		isPending: isBorrowPending,
	} = useWriteContract();

	const { isLoading: isConfirming, isSuccess: isConfirmed } =
		useWaitForTransactionReceipt({
			hash: borrowHash,
		});

	useEffect(() => {
		if (isConfirmed) {
			queryClient.invalidateQueries();
			toast({
				title: "Borrow Successful",
				description: "You have successfully borrowed",
			});
		}
	}, [isConfirmed, queryClient]);

	const handleBorrow = async () => {
		if (
			!Number(customCollateralAmount) ||
			Number(customCollateralAmount) < minimumCollateral
		) {
			return toast({
				title: "Collateral Error",
				description: "Collateral amount is insufficient.",
				variant: "destructive",
			});
		}
		if (!Number(borrowAmount)) {
			return toast({
				title: "Borrow amount Error",
				description: "Please enter a valid borrow amount.",
				variant: "destructive",
			});
		}
		if (!Number(duration)) {
			return toast({
				title: "Invalid duration",
				description: "Please select a valid duration.",
				variant: "destructive",
			});
		}
		if (healthFactor < HEALTH_FACTOR_DANGER) {
			return toast({
				title: "Health factor Error",
				description: "Health factor is too low to proceed.",
				variant: "destructive",
			});
		}

		// smart contract call
		try {
			if (simulateBorrowError) {
				console.error("Borrow simulation error:", simulateBorrowError);
				toast({
					variant: "destructive",
					title: "Borrow Simulation Failed",
					description:
						simulateBorrowError.cause?.toString() ||
						simulateBorrowError.message,
				});
				return;
			}

			if (!simulateBorrow?.request) {
				console.error("Borrow simulation request is undefined.");
				toast({
					variant: "destructive",
					title: "Borrow Simulation Failed",
					description:
						"Could not get a valid transaction request from simulation.",
				});
				return;
			}

			borrow(
				{
					...simulateBorrow.request,
				},
				{
					onSuccess: () => {
						toast({
							title: "Transaction Submitted",
							description: "Your borrow transaction is being processed.",
						});
					},
					onError: (error) => {
						console.error("Borrow transaction error:", error);
						toast({
							title: "Transaction Error",
							description:
								"An error occurred while processing your transaction.",
							variant: "destructive",
						});
					},
				}
			);
		} catch (error) {
			console.error("Borrow transaction error:", error);
			toast({
				title: "Transaction Error",
				description: "An error occurred while processing your transaction.",
				variant: "destructive",
			});
			return;
		}
	};

	return (
		<Card className="bg-white space-y-7 p-5 dark:bg-slate-800/50 mb-6 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
			<h2 className="text-md font-semibold mb-6">Borrow Assets</h2>
			<Suspense fallback={<Skeleton className="h-14 w-full bg-[#432d9225]" />}>
				<AssetSelector
					label="Borrow Asset"
					assets={borrowAssets}
					onSelect={(asset) => setSelectedBorrowAsset(JSON.parse(asset))}
					disabled={borrowAssets.length === 0}
				/>
			</Suspense>

			<Suspense fallback={<Skeleton className="h-14 w-full bg-[#432d9225]" />}>
				<div className="mt-4">
					<AmountInput
						minimumCollateral={minimumCollateral}
						label="Borrow Amount"
						value={borrowAmount}
						onChange={setBorrowAmount}
						hideAvailable
						symbol={
							selectedBorrowAsset && "symbol" in selectedBorrowAsset
								? selectedBorrowAsset.symbol
								: undefined
						}
					/>
				</div>
			</Suspense>

			<Suspense fallback={<Skeleton className="h-14 w-full bg-[#432d9225]" />}>
				<DurationSelector
					buttonGridRef={buttonGridRef}
					customInputActive={customInputActive}
					customInputRef={customInputRef}
					lockDuration={duration}
					lockDurationCustom={lockDurationCustom}
					setCustomInputActive={setCustomInputActive}
					setLockDuration={setDuration}
					setLockDurationCustom={setLockDurationCustom}
					setShowCustomInput={setShowCustomInput}
					showCustomInput={showCustomInput}
				/>
			</Suspense>

			<Suspense fallback={<Skeleton className="h-14 w-full bg-[#432d9225]" />}>
				<HealthFactor
					HEALTH_FACTOR_DANGER={HEALTH_FACTOR_DANGER}
					value={healthFactor}
					healthFactor={healthFactor}
				/>
			</Suspense>

			<Suspense fallback={<Skeleton className="h-14 w-full bg-[#432d9225]" />}>
				<Button
					className="w-full !py-7 text-md font-semibold hover:opacity-90"
					onClick={handleBorrow}
					disabled={
						!Number(customCollateralAmount) ||
						Number(customCollateralAmount) < minimumCollateral ||
						!Number(borrowAmount) ||
						!Number(duration) ||
						healthFactor < HEALTH_FACTOR_DANGER
					}
				>
					{healthFactor < HEALTH_FACTOR_DANGER ? (
						"Health Factor Too Low"
					) : isBorrowPending || isConfirming ? (
						<>
							<div className="size-5 rounded-full animate-[spin_0.5s_linear_infinite] border-b-transparent border-[3px] border-green-950" />
							Please wait...
						</>
					) : (
						"Borrow Now"
					)}
				</Button>

				{healthFactor < HEALTH_FACTOR_DANGER && (
					<p className="text-sm mt-4 text-center text-yellow-400">
						Minimum health factor of 1.03 required for borrowing
					</p>
				)}
			</Suspense>
		</Card>
	);
};

export default BorrowAssets;
