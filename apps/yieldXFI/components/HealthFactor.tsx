import React from "react";

interface HealthFactorProps {
	value: number;
	healthFactor: number;
	HEALTH_FACTOR_DANGER: number;
}

const HealthFactor: React.FC<HealthFactorProps> = ({
	value,
	healthFactor,
	HEALTH_FACTOR_DANGER,
}) => {
	let color = "bg-red-500";
	let status = "High Risk";

	const HEALTH_FACTOR_SAFE = 1.5;
	const HEALTH_FACTOR_WARNING = 1.2;

	if (value >= HEALTH_FACTOR_SAFE) {
		color = "bg-green-500";
		status = "Safe";
	} else if (value >= HEALTH_FACTOR_WARNING) {
		color = "bg-yellow-500";
		status = "Moderate Risk";
	}

	return (
		<div className="mb-6">
			<div className="flex justify-between mb-2">
				<label className="block text-sm text-gray-400">Health Factor</label>
				<span className="text-sm font-medium">
					{value.toFixed(2)} - {status}
				</span>
			</div>
			<div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
				<div
					className={`h-full ${color} transition-all duration-500`}
					style={{ width: `${Math.min((value / 3) * 100, 100)}%` }}
				></div>
			</div>
			{healthFactor < HEALTH_FACTOR_DANGER ? (
				<div className="bg-red-300 border mt-5 border-red-500 text-red-800 px-4 py-3 rounded relative">
					<strong>High liquidation risk!</strong> Your position is at risk of
					liquidation. Consider adding more collateral to reach a safe level.
				</div>
			) : healthFactor < HEALTH_FACTOR_WARNING ? (
				<div className="mt-5 bg-yellow-200 border border-yellow-400 text-yellow-800 px-4 py-3 rounded relative">
					<strong>Warning:</strong> Your health factor is low. Adding more
					collateral is recommended to avoid liquidation risk.
				</div>
			) : healthFactor >= HEALTH_FACTOR_SAFE ? (
				<div className="mt-5 bg-green-200 border border-green-400 text-green-800 px-4 py-3 rounded relative">
					<strong>Safe:</strong> Your position has a healthy collateral ratio.
				</div>
			) : null}
		</div>
	);
};

export default HealthFactor;
