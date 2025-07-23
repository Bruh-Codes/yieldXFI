import React, { lazy, Suspense, useEffect, useState } from "react";
import { Asset } from "./CollateralAssets";
import { Skeleton } from "@/components/ui/skeleton";
import { readContract, writeContract } from "@wagmi/core";
import { config } from "@/lib/wagmi";
import { cn, getBorrowConfig } from "@/lib/utils";
import { useReadContract } from "wagmi";
import { useAppKitAccount } from "@reown/appkit/react";
import { Address, UserRejectedRequestError } from "viem";

import { toast } from "@/hooks/use-toast";
const Card = lazy(() =>
	import("@/components/ui/card").then((module) => ({
		default: module.Card,
	}))
);

interface Loan {
	loanId: bigint;
	collateralAmount: bigint;
	collateralToken: Address;
	borrowToken: Address;
	borrowAmount: bigint;
	duration: bigint;
	startTime: bigint;
	interestRate: bigint;
	userAddress: Address;
	amountPaid: bigint;
	active: boolean;
}

interface borrowDetailsProps {
	collateralAmount: string;
	healthFactor: number;
	selectedCollateral?: Asset;
	customInputActive: boolean;
	borrowAmount: string;
	duration: number;
	customDuration: string;
	selectedBorrowAsset: Asset;
}

const BorrowDetails = ({
	collateralAmount,
	healthFactor,
	selectedCollateral,
	borrowAmount,
	duration,
	customDuration,
	customInputActive,
	selectedBorrowAsset,
}: borrowDetailsProps) => {
	const [ltv, setLtv] = useState("0.00");
	const [loadingStates, setLoadingStates] = useState<Map<bigint, boolean>>(
		new Map()
	);
	const { address } = useAppKitAccount();

	const durationOptions = [
		{ label: "7 Days", value: 7, apy: 3.5 },
		{ label: "30 Days", value: 30, apy: 5.2 },
		{ label: "90 Days", value: 90, apy: 8.4 },
		{ label: "Custom", value: 0, apy: 0 },
	];

	const calculateAPY = () => {
		const baseAPY =
			duration === 0
				? 4.5
				: durationOptions.find((option) => option.value === duration)?.apy ||
				  4.5;

		return baseAPY + (healthFactor > 2 ? 0.5 : 0);
	};

	const calculatePayment = () => {
		if (!borrowAmount) return "0";
		const principal = parseFloat(borrowAmount);
		const apy = calculateAPY() / 100;
		const years = duration / 365;
		return (principal * (1 + apy * years)).toFixed(2);
	};

	useEffect(() => {
		const fetchLTV = async () => {
			try {
				const threshold = await readContract(config, {
					...getBorrowConfig("getLiquidationThreshold", [
						selectedCollateral?.address,
					]),
				});

				const thresholdPct = Number(threshold) / 100;

				const borrow = parseFloat(borrowAmount);
				const collateral = parseFloat(collateralAmount);

				if (!borrow || !collateral || isNaN(borrow) || isNaN(collateral)) {
					setLtv("0.00");
					return;
				}

				const ltvCalc = borrow / (collateral * thresholdPct);
				setLtv((ltvCalc * 100).toFixed(2));
			} catch (error) {
				console.error("Error calculating LTV:", error);
				setLtv("0.00");
			}
		};

		fetchLTV();
	}, [borrowAmount, collateralAmount, selectedCollateral]);

	const { data } = useReadContract({
		...getBorrowConfig("getUserLoans", [address]),
	});

	console.log(data);
	const handlePayLoan = async (loanId: bigint) => {
		setLoadingStates((prev) => new Map(prev).set(loanId, true));
		try {
			await writeContract(config, {
				...getBorrowConfig("payLoan", [loanId]),
			});
			toast({
				title: "Loan Repaid!",
				description:
					"Your loan has been successfully repaid and collateral refunded.",
			});
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			console.error("Error repaying loan:", error);
			if (
				error instanceof UserRejectedRequestError ||
				error.message?.includes("User rejected the request")
			) {
				toast({
					title: "Transaction Rejected",
					description: "You rejected the transaction.",
					variant: "destructive",
				});
			} else {
				toast({
					title: "Repayment Failed",
					description:
						"There was an error repaying your loan. Please try again.",
					variant: "destructive",
				});
			}
		} finally {
			setLoadingStates((prev) => {
				const newMap = new Map(prev);
				newMap.delete(loanId);
				return newMap;
			});
		}
	};

	return (
		<div className="col-span-12 lg:col-span-4">
			<Suspense fallback={<Skeleton className="h-80 w-full bg-[#432d9225]" />}>
				<Card className="bg-white space-y-7 p-5 dark:bg-slate-800/50 mb-6 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
					<h3 className="text-lg font-semibold mb-4">Borrow Details</h3>
					<div>
						{[
							{
								label: "Collateral",
								value: `${collateralAmount || "0"} ${
									selectedCollateral?.symbol ?? ""
								}`,
							},
							{
								label: "Borrow Amount",
								value: `${borrowAmount || "0"} ${
									selectedBorrowAsset?.symbol ?? ""
								}`,
							},
							{
								label: "Duration",
								value: `${
									customInputActive && customDuration
										? customDuration
										: duration
								} Days`,
							},
							{
								label: "LTV (Loan to Value)",
								value: `${ltv}%`,
							},
							{
								label: "Payment at Maturity",
								value: `${calculatePayment()} ${
									selectedBorrowAsset?.symbol ?? ""
								}`,
							},
							{ label: "Health Factor", value: healthFactor.toFixed(2) },
						].map(({ label, value }) => (
							<div key={label}>
								<div className="flex justify-between py-2 border-b border-gray-800">
									<span
										className={cn("text-sm text-gray-400", {
											"text-yellow-500": label === "LTV (Loan to Value)",
										})}
									>
										{label}
									</span>
									<span
										className={cn("text-sm font-medium", {
											"text-yellow-500": label === "LTV (Loan to Value)",
										})}
									>
										{value}
									</span>
								</div>
							</div>
						))}
					</div>
				</Card>
			</Suspense>

			<Suspense fallback={<Skeleton className="h-56 w-full bg-[#432d9225]" />}>
				<Card className="bg-white space-y-7 p-5 dark:bg-slate-800/50 mb-6 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
					<h3 className="text-lg font-semibold mb-4">Your Borrowed Assets</h3>

					{(Array.isArray(data) ? data : []).length === 0 ? (
						<div className="text-center py-6">
							<p className="text-gray-400">You have no active loans</p>
						</div>
					) : (
						<div className="space-y-4">
							{(Array.isArray(data) ? data : []).map((loan: Loan) => (
								<div
									key={loan.loanId.toString()}
									className="border border-gray-700 rounded-lg p-4 text-sm space-y-1"
								>
									<div className="flex justify-between">
										<span className="text-gray-400">Loan ID:</span>
										<span>{loan.loanId.toString()}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-400">Borrowed:</span>
										<span>
											{(Number(loan.borrowAmount) / 1e18).toFixed(2)} ETH
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-400">Collateral:</span>
										<span>
											{(Number(loan.collateralAmount) / 1e18).toFixed(2)} ETH
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-400">Duration:</span>
										<span>{Number(loan.duration) / (60 * 60 * 24)} days</span>
									</div>
									<div className="flex justify-between mb-2">
										<span className="text-gray-400">Interest Rate:</span>
										<span>{loan.interestRate.toString()}%</span>
									</div>
									<button
										onClick={() => handlePayLoan(loan.loanId)}
										className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-semibold"
										disabled={loadingStates.get(loan.loanId)}
									>
										{loadingStates.get(loan.loanId)
											? "Processing..."
											: "Pay Loan"}
									</button>
								</div>
							))}
						</div>
					)}
				</Card>
			</Suspense>

			<Card className="bg-white space-y-7 p-5 dark:bg-slate-800/50 mb-6 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
				<h3 className="text-lg font-semibold mb-4">Liquidation Risk</h3>
				<p className="text-sm text-gray-400 mb-4">
					Your collateral may be liquidated if your health factor falls below
					1.0. Maintain a higher health factor to reduce risk.
				</p>
				<div className="py-2 px-3 rounded-lg bg-gray-800 text-sm">
					<p className="text-yellow-400 mb-1">Safe Borrowing Tips:</p>
					<ul className="list-disc pl-4 text-gray-400">
						<li>Keep health factor above 1.5 for safety</li>
					</ul>
				</div>
			</Card>
		</div>
	);
};

export default BorrowDetails;
