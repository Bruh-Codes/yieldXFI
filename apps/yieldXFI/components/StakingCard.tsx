"use client";

import React, { useEffect, useRef, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { cn, getYieldPoolConfig } from "@/lib/utils";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { toast } from "@/hooks/use-toast";
import {
	useBalance,
	useSimulateContract,
	useWriteContract,
	useWaitForTransactionReceipt,
} from "wagmi";
import Modal from "./Modal";
import { parseEther } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { ClassValue } from "clsx";

const StakingCard = ({
	className,
	children,
}: {
	className?: ClassValue;
	children?: React.ReactNode;
}) => {
	const [amount, setAmount] = useState("");
	const [lockDuration, setLockDuration] = useState(30);
	const [lockDurationCustom, setLockDurationCustom] = useState(0);
	const [showCustomInput, setShowCustomInput] = useState(false);
	const [customInputActive, setCustomInputActive] = useState(false);
	const [isDepositLoading, setIsDepositLoading] = useState(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const [showModal, setShowModal] = useState(false);
	const { isConnected, address } = useAppKitAccount();
	const durationInSeconds =
		Number(customInputActive ? lockDurationCustom : lockDuration) *
		24 *
		60 *
		60;
	const customInputRef = useRef<HTMLInputElement | null>(null);
	const buttonGridRef = useRef<HTMLDivElement>(null);
	const queryClient = useQueryClient();
	const { open } = useAppKit();

	const { data: simulateDeposit, error: simulateDepositError } =
		useSimulateContract({
			...getYieldPoolConfig(
				"depositNative",
				[durationInSeconds],
				parseEther(amount || "0")
			),
		});

	const {
		data: depositHash,
		writeContract: deposit,
		isPending: isDepositPending,
		reset: resetDeposit,
	} = useWriteContract();

	const { isLoading: isConfirming, isSuccess: isConfirmed } =
		useWaitForTransactionReceipt({
			hash: depositHash,
		});

	const { data: balanceResult } = useBalance({
		address: address as `0x${string}`,
	});

	const validateInput = () => {
		const inputAmount = Number(amount);
		const inputDuration = Number(durationInSeconds);

		if (!inputAmount || isNaN(inputAmount) || inputAmount <= 0) {
			toast({
				variant: "destructive",
				title: "Invalid Amount",
				description: "Please enter a valid amount greater than 0.",
			});
			return false;
		}

		if (!inputDuration || isNaN(inputDuration) || inputDuration < 1) {
			toast({
				variant: "destructive",
				title: "Invalid Duration",
				description:
					"Lock duration must be a number greater than 0. Please adjust your input.",
			});
			return false;
		}

		const hasBalance =
			balanceResult?.formatted && Number(balanceResult.formatted) > 0;

		if (!hasBalance && isConnected) {
			toast({
				variant: "destructive",
				title: "No Balance",
				description:
					"Your selected tokens is not enough in your wallet to continue.",
			});
			setShowModal(true);
			setIsDepositLoading(false);
			return false;
		}

		return true;
	};

	const results = useBalance({
		address: address as unknown as `0x${string}`,
	});

	const handleStake = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsDepositLoading(true);

		timeoutRef.current = setTimeout(() => {
			setIsDepositLoading(false);
			toast({
				variant: "destructive",
				title: "Transaction Timeout",
				description:
					"The transaction took too long to confirm. Please try again.",
			});
		}, 30000);

		if (!isConnected) {
			open();
			resetDeposit();
			setIsDepositLoading(false);
			clearTimeout(timeoutRef.current);
			return;
		}

		if (!validateInput()) {
			clearTimeout(timeoutRef.current);
			return;
		}

		// Check ETH balance (not token balance)
		const balance = results?.data?.formatted;
		if (Number(balance) < Number(amount)) {
			toast({
				variant: "destructive",
				title: "Insufficient Balance",
				description: "You don't have enough ETH for the transaction",
			});
			setIsDepositLoading(false);
			clearTimeout(timeoutRef.current);
			return;
		}

		try {
			if (simulateDepositError) {
				console.error("Simulate deposit error:", simulateDepositError);
				toast({
					variant: "destructive",
					title: "Simulation Failed",
					description: simulateDepositError.message,
				});
				setIsDepositLoading(false);
				clearTimeout(timeoutRef.current);
				return;
			}

			if (!simulateDeposit?.request) {
				console.error("Simulate deposit request is undefined.");
				toast({
					variant: "destructive",
					title: "Simulation Failed",
					description:
						"Could not get a valid transaction request from simulation.",
				});
				setIsDepositLoading(false);
				clearTimeout(timeoutRef.current);
				return;
			}

			deposit(
				{
					...simulateDeposit.request,
				},
				{
					async onError(error) {
						console.error("Deposit error:", error);
						const message = error.message?.toLowerCase() || "";

						if (message.includes("user rejected")) {
							toast({
								variant: "destructive",
								title: "Transaction Rejected",
								description: "You rejected the deposit transaction.",
							});
						} else if (message.includes("still locked")) {
							toast({
								variant: "destructive",
								title: "Lock Period Error",
								description:
									"The tokens are still locked. Wait until your lock expires.",
							});
						} else if (message.includes("insufficient funds")) {
							toast({
								variant: "destructive",
								title: "Insufficient Funds",
								description:
									"You don't have enough ETH to complete this transaction.",
							});
						} else {
							toast({
								variant: "destructive",
								title: "Deposit Failed",
								description: error.message || "Something went wrong.",
							});
						}
						setIsDepositLoading(false);
						if (timeoutRef.current) clearTimeout(timeoutRef.current);
					},
					async onSuccess(data) {
						// The transaction hash is available here, but it's not yet confirmed.
						// We'll invalidate queries once the transaction is confirmed.
						// The `useWaitForTransactionReceipt` hook will handle the confirmation.
						console.log("Transaction sent with hash:", data);
						toast({
							title: "Transaction Sent",
							description: "Waiting for transaction confirmation...",
						});
						setAmount("");
						setIsDepositLoading(false);
						if (timeoutRef.current) clearTimeout(timeoutRef.current);
					},
				}
			);
		} catch (error) {
			setIsDepositLoading(false);
			console.error("Transaction setup failed:", error);
			toast({
				variant: "destructive",
				title: "Transaction Failed",
				description:
					error instanceof Error ? error.message : "Unknown error occurred",
			});
			clearTimeout(timeoutRef.current);
		} finally {
			setIsDepositLoading(false);
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		}
	};

	useEffect(() => {
		if (showCustomInput) {
			customInputRef.current?.focus();
		}
	}, [showCustomInput]);

	useEffect(() => {
		const customInput = customInputRef.current;
		const handleFocus = () => {
			setCustomInputActive(true);
			setLockDuration(1);
		};

		const handleBlur = (e: FocusEvent) => {
			const clickedElement = e.relatedTarget as Node;
			const isClickInsideGrid = buttonGridRef.current?.contains(clickedElement);
			if (!isClickInsideGrid) return;
			if (lockDuration) setCustomInputActive(false);
		};

		customInput?.addEventListener("focus", handleFocus);
		customInput?.addEventListener("blur", handleBlur);

		return () => {
			customInput?.removeEventListener("focus", handleFocus);
			customInput?.removeEventListener("blur", handleBlur);
		};
	}, [customInputActive, lockDuration, showCustomInput]);

	useEffect(() => {
		if (isConfirmed) {
			queryClient.invalidateQueries();
			toast({
				title: "Deposit Successful",
				description: "Your ETH has been successfully staked.",
			});
		}
	}, [isConfirmed, queryClient]);

	const isTransactionInProgress =
		isDepositLoading || isDepositPending || isConfirming;

	return (
		<>
			<Card
				className={cn(
					className,
					"pb-0 xl:mb-0 dark:bg-slate-800/50 bg-white border-slate-200 dark:border-slate-700/50 backdrop-blur-sm shadow-sm"
				)}
			>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 dark:text-white">
						Delegate Tokens
					</CardTitle>
					<CardDescription className="text-slate-500 dark:text-slate-400">
						Delegate your tokens to earn rewards
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleStake} className="space-y-4">
						<div>
							<label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
								Amount
							</label>
							<Input
								disabled={isTransactionInProgress}
								type="number"
								required
								placeholder="Enter token amount"
								value={amount}
								min="0.01"
								step="0.01"
								onChange={(e) => setAmount(e.target.value)}
								className="bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:!ring-slate-500 dark:focus:!ring-foreground focus:!border-transparent focus:ring-offset-2 dark:ring-offset-slate-100 ring-offset-slate-700"
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
								Lock Duration
							</label>
							<div
								ref={buttonGridRef}
								className="flex flex-wrap justify-between xl:grid-cols-2 2xl:grid-cols-4 gap-2"
							>
								{["30", "60", "90"].map((days) => (
									<Button
										type="button"
										disabled={isTransactionInProgress}
										key={days}
										variant="outline"
										className={cn(
											"flex-1 border-slate-200 dark:border-slate-700",
											{
												"bg-gradient-to-r bg-foreground hover:bg-foreground hover:text-background text-background border-transparent":
													lockDuration === parseFloat(days),
												"bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800":
													lockDuration !== parseFloat(days),
											}
										)}
										onClick={() => (
											setLockDuration(parseFloat(days)),
											setShowCustomInput(lockDurationCustom ? true : false),
											setCustomInputActive(false)
										)}
									>
										{days} Days
									</Button>
								))}
								{!showCustomInput ? (
									<Button
										variant="outline"
										className={cn(
											"bg-white border-slate-200 dark:border-slate-700  dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
										)}
										onClick={() => (
											setLockDuration(1),
											setShowCustomInput(true),
											setLockDurationCustom(1),
											setCustomInputActive(true)
										)}
									>
										Custom
									</Button>
								) : (
									<Input
										disabled={isTransactionInProgress}
										ref={customInputRef}
										type="number"
										min={1}
										max={365}
										maxLength={3}
										placeholder="Custom"
										value={lockDurationCustom}
										onChange={(e) =>
											setLockDurationCustom(parseFloat(e.target.value))
										}
										className={cn(
											"bg-slate-100 w-fit flex-1 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:!ring-slate-500 dark:focus:!ring-foreground focus:!border-transparent dark:caret-white hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200 focus:ring-offset-2 dark:ring-offset-slate-200 ring-offset-slate-700",
											{
												"bg-gradient-to-tr !text-background from-foreground to-foreground":
													lockDurationCustom && customInputActive,

												"bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800":
													!lockDurationCustom,
											}
										)}
									/>
								)}
							</div>
						</div>
						<div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
							<div className="flex justify-between text-sm">
								<span className="text-slate-500 dark:text-slate-400">
									Duration
								</span>
								<span className="text-slate-900 dark:text-slate-100">
									{customInputActive ? lockDurationCustom : lockDuration}{" "}
									{lockDurationCustom > 1 || lockDuration > 1 ? "days" : "day"}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-slate-500 dark:text-slate-400">
									Base APY
								</span>
								<span className="text-indigo-600 dark:text-indigo-400">
									10.0%
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-slate-500 dark:text-slate-400">
									Bonus APY
								</span>
								<span className="text-indigo-600 dark:text-indigo-400">
									+2.5%
								</span>
							</div>
							<div className="border-t border-slate-200 dark:border-slate-700/50 pt-2 mt-2">
								<div className="flex justify-between font-medium">
									<span className="text-slate-700 dark:text-slate-300">
										Total APY
									</span>
									<span className="text-yellow-600 dark:text-yellow-400">
										12.5%
									</span>
								</div>
							</div>
						</div>
						<Button
							type="submit"
							disabled={isTransactionInProgress}
							className="w-full bg-foreground text-background font-semibold hover:opacity-90"
						>
							{isTransactionInProgress ? (
								<>
									<div className="size-5 rounded-full animate-[spin_0.5s_linear_infinite] border-b-transparent border-[2px] border-secondary" />
									{isDepositPending
										? "Waiting For Deposit Approval..."
										: "Please wait..."}
								</>
							) : (
								"Delegate Now"
							)}
						</Button>
						{children}
					</form>
				</CardContent>
			</Card>
			<Modal setShowModal={setShowModal} showModal={showModal} />
		</>
	);
};

export default StakingCard;
