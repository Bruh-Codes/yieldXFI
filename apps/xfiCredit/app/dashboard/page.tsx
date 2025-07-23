"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Percent, Vault, Coins } from "lucide-react";

import { useBalance, useReadContract } from "wagmi";
import { useAppKitAccount } from "@reown/appkit/react";
import { getYieldPoolConfig, YieldTokenAddress } from "@/lib/utils";
import { formatEther } from "viem";
import { useState } from "react";
import WithdrawModal from "@/components/WithdrawModal";
import StakingCard from "@/components/StakingCard";
import PositionOverview from "@/components/PositionOverview";
// import Performance from "@/components/Performance";
import ActivePositions from "@/components/ActivePositions";
import usePositions from "@/hooks/usePositions";

const FixedYieldDashboard = () => {
	const { address } = useAppKitAccount();
	const { positions } = usePositions();

	const [modalType, setModalType] = useState<"withdraw" | "unstake" | null>(
		null
	);
	const [showWithdrawModal, setShowWithDrawModal] = useState(false);
	const results = useBalance({
		address: address as unknown as `0x${string}`,
		token: YieldTokenAddress,
	});

	const { data: tvl } = useReadContract({
		...getYieldPoolConfig("getTotalValueLocked", []),
	});

	const formattedTVL = tvl ? formatEther(BigInt(tvl.toString())) : "0.00";

	const { data: totalStakers } = useReadContract({
		...getYieldPoolConfig("getTotalStakers", []),
	});

	// Base APY from YieldPool's YIELD_RATE
	const BASE_APY = 10;

	return (
		<>
			<div className="my-4 grid grid-cols-2 [@media(min-width:1200px)]:grid-cols-4 gap-4">
				<Card className="relative  overflow-hidden dark:bg-gradient-to-r 0 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
					<div className="absolute inset-0 bg-white dark:opacity-10"></div>
					<CardContent>
						<div className="relative flex items-center justify-between">
							<div className="p-3 bg-purple-500/20 rounded-xl">
								<ShieldCheck className="size-5 text-foreground" />{" "}
							</div>
							<div>
								<p className="text-md dark:text-foreground">TVL</p>
								<p className="text-3xl font-bold text-foreground">
									{parseFloat(formattedTVL).toFixed(2)} XFI
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="relative overflow-hidden dark:bg-gradient-to-r from-gray-900/50 to-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
					<div className="absolute inset-0 bg-white dark:opacity-10"></div>
					<CardContent>
						<div className="relative flex items-center justify-between">
							<div className="p-3 bg-purple-500/20 rounded-xl">
								<Percent className="size-5 text-foreground" />
							</div>
							<div>
								<p className="text-md text-slate-400">Base APY</p>
								<p className="text-3xl font-bold text-foreground">
									{BASE_APY}%
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="relative overflow-hidden dark:bg-gradient-to-r from-gray-900/50 to-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
					<div className="absolute inset-0 bg-white dark:opacity-10"></div>

					<CardContent>
						<div className="relative flex items-center justify-between">
							<div className="p-3 bg-purple-500/20 rounded-xl">
								<Vault className="size-5 text-foreground" />
							</div>

							<div>
								<p className="text-md text-slate-400">Total Delegators</p>
								<p className="text-3xl font-bold text-foreground">
									{totalStakers ? Number(totalStakers).toString() : "0"}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="relative overflow-hidden dark:bg-gradient-to-r from-gray-900/50 to-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
					<div className="absolute inset-0 bg-white dark:opacity-10"></div>
					<CardContent>
						<div className="relative flex items-center justify-between">
							<div className="p-3 bg-purple-500/20 rounded-xl">
								<Coins className="size-5 text-indigo-400" />
							</div>
							<div>
								<p className="text-md text-slate-400">Balance</p>
								<p className="text-3xl font-bold text-foreground">
									{results?.data?.formatted
										? parseFloat(results.data.formatted).toFixed(2)
										: "0.00"}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="flex flex-col md:flex-row flex-wrap gap-4 h-auto">
				<StakingCard className="flex-1 w-full" />
				<PositionOverview
					setModalType={setModalType}
					positions={positions}
					setShowWithDrawModal={setShowWithDrawModal}
				/>
			</div>
			<ActivePositions
				setModalType={setModalType}
				setShowWithDrawModal={setShowWithDrawModal}
				positions={positions}
			/>

			<WithdrawModal
				modalType={modalType}
				setModalType={setModalType}
				positions={positions}
				setShowWithDrawModal={setShowWithDrawModal}
				showWithdrawModal={showWithdrawModal}
			/>
		</>
	);
};

export default FixedYieldDashboard;
