import React from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";

interface DurationSelectorProps {
  setLockDurationCustom: React.Dispatch<React.SetStateAction<number>>;
  customInputRef: React.RefObject<HTMLInputElement | null>;
  customInputActive: boolean;
  showCustomInput: boolean;
  setCustomInputActive: React.Dispatch<React.SetStateAction<boolean>>;
  lockDurationCustom: number;
  setShowCustomInput: React.Dispatch<React.SetStateAction<boolean>>;
  buttonGridRef: React.RefObject<HTMLDivElement | null>;
  isTransactionInProgress?: boolean;
  lockDuration: number;
  setLockDuration: React.Dispatch<React.SetStateAction<number>>;
  label?: string;
}

const DurationSelector = ({
  label = "Lock Duration",
  setLockDurationCustom,
  customInputRef,
  customInputActive,
  showCustomInput,
  setCustomInputActive,
  lockDurationCustom,
  setShowCustomInput,
  buttonGridRef,
  isTransactionInProgress,
  lockDuration,
  setLockDuration,
}: DurationSelectorProps) => {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
        {label}
      </label>
      <div
        ref={buttonGridRef}
        className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4 gap-2"
      >
        {["30", "60", "90"].map((days) => (
          <Button
            type="button"
            disabled={isTransactionInProgress}
            key={days}
            variant="outline"
            className={cn(
              "border-slate-200 w-full flex-1 dark:border-slate-700/40",
              {
                " border-transparent": lockDuration === parseFloat(days),
                "bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800":
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
              "bg-white border-slate-200 flex-1 w-full dark:border-slate-700/40  dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
            onChange={(e) => {
              let customValue = parseFloat(e.target.value) || 0;
              customValue = Math.max(customValue, 1);
              setLockDurationCustom(customValue);
              setLockDuration(customValue);
            }}
            className={cn(
              "bg-slate-100 flex-1 w-full dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/40 text-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:!ring-slate-500 dark:focus:!ring-sky-500 focus:!border-transparent dark:caret-white hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200 focus:ring-offset-2 dark:ring-offset-sky-700 ring-offset-slate-700",
              {
                "bg-gradient-to-tr from-secondary to-secondary":
                  lockDurationCustom && customInputActive,

                "bg-white dark:bg-[#1A103D] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800":
                  !lockDurationCustom,
              }
            )}
          />
        )}
      </div>
    </div>
  );
};

export default DurationSelector;
