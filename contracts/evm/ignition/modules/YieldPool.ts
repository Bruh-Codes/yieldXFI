import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const yieldRate = 1000; // 10% (basis points)
const minDuration = 7 * 24 * 60 * 60; // 7 days in seconds
const maxDuration = 365 * 24 * 60 * 60; // 365 days in seconds

const YieldPoolModule = buildModule("YieldPoolModule", (m) => {
  const borrowProtocolAddress = m.getParameter("borrowProtocolAddress");
  const yieldPool = m.contract("YieldPool", [
    yieldRate,
    minDuration,
    maxDuration,
    borrowProtocolAddress,
  ]);
  return { yieldPool };
});

export default YieldPoolModule;
