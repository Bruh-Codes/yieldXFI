/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { toast } from "@/hooks/use-toast";
import { getYieldPoolConfig } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import usePositions from "@/hooks/usePositions";

const WithDrawScreen = ({
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
	transaction_hash?: string;
	setShowWithDrawModal: Dispatch<SetStateAction<boolean>>;
	owner?: string;
}) => {
	const queryClient = useQueryClient();
	const { refetchActivePositions } = usePositions();

	const {
		writeContract: withDraw,
		isPending: isPendingWithDraw,
		data: hash,
	} = useWriteContract();

	const { isLoading: isConfirming, isSuccess: isConfirmed } =
		useWaitForTransactionReceipt({
			hash,
		});

	const handleWithdraw = async () => {
		try {
			withDraw(
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
							return;
						}
						if (error.message.includes("Still locked")) {
							toast({
								variant: "destructive",
								title: "Transaction Failed: Tokens still locked",
							});
							return;
						}
						toast({
							variant: "destructive",
							title: "Transaction Failed: something was wrong or still locked",
						});
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
				description: "Withdrawal was a success",
			});
			window.history.pushState({}, "", `/dashboard`);
			setShowWithDrawModal(false);
		}
	}, [isConfirmed, queryClient, setShowWithDrawModal, refetchActivePositions]);

	return (
		// <Card >

		<DialogContent className="m-2 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50">
			<DialogHeader>
				<DialogTitle className="text-foreground">Withdraw</DialogTitle>
				<DialogDescription className="space-y-4 pt-3">
					<p>This process mostly takes a few minutes.</p>
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
					{currentYield && amount
						? `${Number(amount + currentYield).toFixed(8)} XFI`
						: "N/A"}
				</p>
			</div>
			<Button
				disabled={isPendingWithDraw || isConfirming}
				onClick={handleWithdraw}
				type="button"
				variant={"default"}
				className="w-full bg-gradient-to-r from-lime-500 to-yellow-500 text-slate-800 font-semibold hover:opacity-90"
			>
				<>
					{(isPendingWithDraw || isConfirming) && (
						<div className="size-6 rounded-full animate-[spin_0.5s_linear_infinite] border-b-transparent border-[3px] border-white" />
					)}
					{isPendingWithDraw
						? "Please wait..."
						: isConfirming
						? "Confirming..."
						: "Withdraw"}
				</>
			</Button>
		</DialogContent>
	);
};

export default WithDrawScreen;
