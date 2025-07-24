/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ActivePosition } from "@/components/PositionOverview";
import { getYieldPoolConfig } from "@/lib/utils";
import { readContract } from "@wagmi/core";
import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect, useMemo, useState } from "react";
import { formatEther } from "viem";
import { useReadContract } from "wagmi";
import { config } from "@/lib/wagmi";

const usePositions = () => {
	const [positions, setPositions] = useState<ActivePosition[] | []>([]);
	const { address } = useAppKitAccount();

	const { data: activePositionsData, refetch: refetchActivePositions }:
		{ data: ActivePosition[] | undefined; refetch: () => void } = useReadContract({
		...getYieldPoolConfig("getActivePositions", []),
	});

	const userPositions = useMemo(() => {
		return positions.filter(
			(position) =>
				position.positionAddress?.toLowerCase() === address?.toLowerCase()
		);
	}, [positions, address]);

	const calculateExpectedYield = async (
		amount: any,
		lockDuration: any
	): Promise<number> => {
		const results = await readContract(config, {
			...getYieldPoolConfig("calculateExpectedYield", [amount, lockDuration]),
		});

		return Number(formatEther(BigInt(results as bigint)));
	};
	useEffect(() => {
		const generatePositions = async () => {
			if (activePositionsData) {
				const stakers = await Promise.all(
					activePositionsData.map(
						async (positionData: ActivePosition): Promise<ActivePosition> => {
							const startTimeInSeconds = Number(positionData.startTime);
							const lockDurationInSeconds = Number(positionData.lockDuration);
							const currentTime = Math.floor(Date.now() / 1000);
							const timeLeft = Math.max(
								startTimeInSeconds + lockDurationInSeconds - currentTime,
								0
							);
							const currentYield = await calculateExpectedYield(
								positionData.amount,
								lockDurationInSeconds
							);
							return {
								id: positionData.id,
								positionAddress: positionData.positionAddress,
								amount: Number(formatEther(BigInt(positionData?.amount))),
								lockDuration: lockDurationInSeconds,
								startTime: startTimeInSeconds,
								timeLeft: Math.ceil(timeLeft / (24 * 60 * 60)), // Convert to days for display
								currentYield: currentYield,
								status: timeLeft > 0 ? "Locked" : "Active",
								transactionHash: "", // No longer fetching transactions from DB
							};
						}
					)
				);

				if (stakers) {
					setPositions(stakers);
				}
			}
		};

		generatePositions();
	}, [activePositionsData]);

	return { positions, setPositions, userPositions, refetchActivePositions };
};

export default usePositions;
