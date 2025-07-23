"use client";

import { Input } from "@/components/ui/input";
import React from "react";
import { Asset } from "./CollateralAssets";

interface AmountInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max?: string;
  symbol?: string;
  selectedCollateral?: Asset | object;
  hideAvailable?: boolean;
  minimumCollateral: number;
}

const AmountInput: React.FC<AmountInputProps> = ({
  label,
  value,
  onChange,
  max,
  symbol,
  selectedCollateral,
  hideAvailable,
  minimumCollateral,
}) => {
  const handleMax = () => {
    if (max) {
      onChange(max);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-2">
        <label className="block text-sm text-gray-400">{label}</label>
        {!hideAvailable && (
          <div className="text-sm text-gray-400">
            Available:{" "}
            {max ? (
              <span className="text-white">
                {parseFloat(max).toFixed(4)} {symbol}
              </span>
            ) : (
              "--"
            )}
          </div>
        )}
      </div>
      <div className="relative">
        <Input
          min={0}
          disabled={
            selectedCollateral &&
            "balance" in selectedCollateral &&
            parseFloat(selectedCollateral.balance || "0") < minimumCollateral
          }
          type="number"
          required
          placeholder="0.00"
          value={value}
          onChange={(e) => {
            if (parseFloat(e.target.value) >= 0 || e.target.value === "") {
              onChange(e.target.value);
            }
          }}
          className="bg-sky-100 h-14 dark:bg-slate-800/50 border-sky-200 dark:border-slate-700/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:!ring-slate-500 dark:focus:!ring-sky-500 focus:!border-transparent focus:ring-offset-2 dark:ring-offset-sky-700 ring-offset-slate-700"
        />
        <div className="absolute inset-y-0 right-10 flex items-center">
          {max && (
            <button
              disabled={
                selectedCollateral &&
                "balance" in selectedCollateral &&
                parseFloat(selectedCollateral.balance || "0") <
                  minimumCollateral
              }
              type="button"
              onClick={handleMax}
              className="text-sky-400 text-sm font-medium mr-2 hover:text-app-purple transition-colors"
            >
              MAX
            </button>
          )}
          {symbol && <span className="text-gray-400 mr-3">{symbol}</span>}
        </div>
      </div>
      {selectedCollateral &&
        "balance" in selectedCollateral &&
        parseFloat(selectedCollateral.balance || "0") < minimumCollateral &&
        Object.keys(selectedCollateral).length > 0 && (
          <p className="text-red-500 mt-2 text-sm">
            You need a minimum collateral of at least{" "}
            <span className="font-bold text-sm">
              {minimumCollateral.toFixed(2)} {symbol}
            </span>
          </p>
        )}
    </div>
  );
};

export default AmountInput;
