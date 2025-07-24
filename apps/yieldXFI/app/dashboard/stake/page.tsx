import Performance from "@/components/Performance";
import StakingCard from "@/components/StakingCard";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";
import StakingStats from "./StakingStats";

export const metadata: Metadata = {
	title: "yieldXFI",
};

const Page = () => {
	return (
		<div className="container space-y-6 mx-auto">
			<div className="flex justify-between flex-wrap gap-2 items-center mb-6">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
						Stake Your XFI
					</h1>
					<p className="text-slate-500 dark:text-slate-400">
						Earn rewards by staking your XFI tokens
					</p>
				</div>
			</div>

			<div className="flex flex-col lg:flex-row gap-6">
				<StakingCard className=" flex-[2]">
					<div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4">
						<div className="flex justify-between mb-2">
							<span className="text-slate-700 dark:text-slate-300 font-medium">
								Estimated Rewards
							</span>
							<span className="text-yellow-600 dark:text-yellow-400 font-medium">
								+168.75 XFI
							</span>
						</div>
						<p className="text-xs text-slate-500 dark:text-slate-400">
							Based on current APY and selected lock period
						</p>
					</div>
				</StakingCard>

				<Card className="bg-white flex-1 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm shadow-sm">
					<CardHeader>
						<CardTitle className="text-slate-900 dark:text-white">
							Staking Stats
						</CardTitle>
						<CardDescription className="text-slate-500 dark:text-slate-400">
							Your current staking metrics
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6 w-full">
						<StakingStats />
					</CardContent>
				</Card>
			</div>
			<Performance />
		</div>
	);
};

export default Page;
