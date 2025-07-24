/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import usePositions from "@/hooks/usePositions";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Button } from "./ui/button";
import { ActivePosition } from "./PositionOverview";

interface IchartData {
	date: string;
	apy?: number;
	rewards?: number;
	tvl?: number | string;
}

const CustomTooltip = ({ active, payload, label, activeTab }: any) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg">
				<p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
				<p className="text-lg font-bold text-slate-900 dark:text-white">
					{`${payload[0].value} ${
						activeTab === "apy" ? "%" : activeTab === "tvl" ? "Tokens" : "XFI"
					}`}
				</p>
			</div>
		);
	}

	return null;
};

const Performance = () => {
	const [chartData, setChartData] = useState<IchartData[]>([
		{ date: "Jan 1", apy: 8.2 },
		{ date: "Jan 2", apy: 8.5 },
		{ date: "Jan 3", apy: 8.3 },
		{ date: "Jan 4", apy: 8.8 },
		{ date: "Jan 5", apy: 9.1 },
		{ date: "Jan 6", apy: 9.3 },
		{ date: "Jan 7", apy: 10.0 },
	]);

	const [activeTab, setActiveTab] = useState<string>("tvl");
	const { userPositions } = usePositions();
	const { isConnected } = useAppKitAccount();
	const { open } = useAppKit();

	useEffect(() => {
		const formatPositions = (positions: ActivePosition[]) => {
			return positions.map((position: ActivePosition) => {
				const startTime = new Date(position.startTime * 1000);
				const formattedDate = startTime.toLocaleDateString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric",
				});

				return { date: formattedDate, tvl: position.amount };
			});
		};

		const getStaticData = (type: "apy" | "rewards") => {
			const staticData = {
				apy: [
					{ date: "Jan 1", apy: 8.2 },
					{ date: "Jan 2", apy: 8.5 },
					{ date: "Jan 3", apy: 8.3 },
					{ date: "Jan 4", apy: 8.8 },
					{ date: "Jan 5", apy: 9.1 },
					{ date: "Jan 6", apy: 9.3 },
					{ date: "Jan 7", apy: 10.0 },
				],
				rewards: [
					{ date: "Jan 1", rewards: 0 },
					{ date: "Jan 2", rewards: 0 },
					{ date: "Jan 3", rewards: 0 },
					{ date: "Jan 4", rewards: 0 },
					{ date: "Jan 5", rewards: 0 },
					{ date: "Jan 6", rewards: 0 },
					{ date: "Jan 7", rewards: 0 },
				],
			};
			return staticData[type] || [];
		};

		const updateChartData = () => {
			switch (activeTab) {
				case "tvl":
					if (userPositions) {
						setChartData(formatPositions(userPositions));
					}
					break;
				case "apy":
					setChartData(getStaticData("apy"));
					break;
				case "rewards":
					setChartData(getStaticData("rewards"));
					break;
				default:
					setChartData([]);
			}
		};

		updateChartData();
	}, [activeTab, userPositions]);
	return (
		<Card className="col-span-2 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm shadow-sm">
			<CardHeader>
				<div className="flex flex-wrap gap-2 justify-between items-start">
					<div>
						<CardTitle className="text-slate-900 dark:text-white">
							Performance
						</CardTitle>
						<CardDescription className="text-slate-500 dark:text-slate-400">
							Your staking performance and rewards
						</CardDescription>
					</div>
					<Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
						<TabsList>
							<TabsTrigger
								value="apy"
								className="data-[state=active]:bg-foreground data-[state=active]:text-white dark:data-[state=active]:text-background"
							>
								APY
							</TabsTrigger>
							<TabsTrigger
								value="rewards"
								className="data-[state=active]:bg-foreground data-[state=active]:text-white dark:data-[state=active]:text-background"
							>
								Rewards
							</TabsTrigger>
							<TabsTrigger
								value="tvl"
								className="data-[state=active]:bg-foreground data-[state=active]:text-white dark:data-[state=active]:text-background"
							>
								TVL
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
			</CardHeader>
			<CardContent>
				<div className="h-[300px] mt-4 ">
					{!isConnected ? (
						<div className="text-center py-10">
							<p className="text-slate-500 mb-2 dark:text-slate-400">
								Connect your wallet to see your data.
							</p>
							<Button
								onClick={() => open({ view: "Connect" })}
								className="disabled:bg-primary/70 text-xs text-primary-foreground hover:text-primary-foreground bg-foreground hover:bg-primary/90 border-transparent font-semibold enabled:active:bg-primary/90"
							>
								Connect Wallet
							</Button>
						</div>
					) : chartData.length === 0 ? (
						<p className="text-slate-500 text-xl p-5 dark:text-slate-400">
							No data available.
						</p>
					) : (
						<ResponsiveContainer
							width="100%"
							height="100%"
							initialDimension={{ height: 100, width: 100 }}
						>
							<AreaChart data={chartData}>
								<defs>
									<linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="#4338ca" stopOpacity={0.3} />
										<stop offset="100%" stopColor="#4338ca" stopOpacity={0} />
									</linearGradient>
								</defs>
								<XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
								<YAxis
									stroke="#94a3b8"
									fontSize={12}
									tickFormatter={(value) => `${value}%`}
								/>
								<Tooltip content={<CustomTooltip activeTab={activeTab} />} />
								<Area
									type="monotone"
									dataKey={activeTab}
									stroke="hsl(var(--primary))"
									fill="url(#areaGradient)"
									strokeWidth={2}
								/>
							</AreaChart>
						</ResponsiveContainer>
					)}
				</div>
			</CardContent>
		</Card>
	);
};

export default Performance;
