/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { toast } from "@/hooks/use-toast";
import { getYieldPoolConfig } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import usePositions from "@/hooks/usePositions";

const UnstakeScreen = ({
	amount,
	currentYield,
	position_id,
	setShowWithDrawModal,
	transaction_hash,
	owner,
}: {
	amount?: number;
	currentYield?: number;
	position_id: string | null;
	setShowWithDrawModal: Dispatch<SetStateAction<boolean>>;
	transaction_hash?: string;
	owner?: string;
}) => {
	const queryClient = useQueryClient();
	const { refetchActivePositions } = usePositions();

	let penalty;
	let amountToReturn;
	if (amount) {
		penalty = amount / 10; // 10% penalty
		amountToReturn = amount - penalty;
	}

	const {
		writeContract: Unstake,
		isPending: unstakePending,
		data: hash,
	} = useWriteContract();

	const { isLoading: isConfirming, isSuccess: isConfirmed } =
		useWaitForTransactionReceipt({
			hash,
		});

	const handleUnstake = async () => {
		try {
			Unstake(
				{ ...getYieldPoolConfig("withdraw", [position_id]) },
				{
					onSuccess: () => {
						toast({
							title: "Transaction Sent",
							description: "Waiting for confirmation...",
						});
					},
					onError(error) {
						console.log(error);
						if (error.message.includes("User rejected the request")) {
							toast({
								variant: "destructive",
								title: "Transaction Rejected",
								description: "You rejected the transaction",
							});
						}
					},
				}
			);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			console.log(error);
		}
	};

	useEffect(() => {
		if (isConfirmed) {
			refetchActivePositions();
			queryClient.invalidateQueries();
			queryClient.invalidateQueries({
				queryKey: ["transactions"],
			});
			toast({
				title: "Transaction Successful",
				description: "Unstake was a success",
			});
			window.history.pushState({}, "", `/dashboard`);
			setShowWithDrawModal(false);
		}
	}, [isConfirmed, queryClient, setShowWithDrawModal, refetchActivePositions]);

	return (
		<DialogContent className="m-2 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50">
			<DialogHeader>
				<DialogTitle className="text-foreground">Unstake</DialogTitle>
				<DialogDescription className="space-y-4 pt-3 text-red-400">
					Continuing this process will result in a 10% penalty on your staked
					amount, reducing your expected yields.
				</DialogDescription>
			</DialogHeader>
			<div className="flex items-center gap-3 w-full">
				<div className="bg-slate-200 dark:bg-slate-900/50 w-full p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500">
					<p className="text-sm text-slate-400">Deposited</p>
					<p className="text-xl font-bold">
						{amount ? `${amount} XFI` : "N/A"}
					</p>
				</div>
				<div className="bg-slate-200 dark:bg-slate-900/50 w-full p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500">
					<p className="text-sm  text-slate-400">Current Yield</p>
					<p className="text-xl font-bold">
						{currentYield ? `${Number(currentYield).toFixed(8)} XFY` : "N/A"}
					</p>
				</div>
			</div>
			<div className="bg-slate-300 dark:bg-slate-700/50 w-full p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500">
				<p className="text-sm  text-slate-400">Expected Earn</p>
				<p className="text-xl font-bold">
					{amountToReturn ? `${Number(amountToReturn).toFixed(4)} XFI` : "N/A"}
				</p>
			</div>
			<Button
				disabled={unstakePending || isConfirming}
				onClick={handleUnstake}
				type="button"
				variant={"default"}
				className="w-full bg-gradient-to-r from-lime-500 to-yellow-500 text-slate-800 font-semibold hover:opacity-90"
			>
				<>
					{(unstakePending || isConfirming) && (
						<div className="size-6 rounded-full animate-[spin_0.5s_linear_infinite] border-b-transparent border-[3px] border-white" />
					)}
					{unstakePending
						? "Please wait..."
						: isConfirming
						? "Confirming..."
						: "Unstake"}
				</>
			</Button>
		</DialogContent>
	);
};
export default UnstakeScreen;
