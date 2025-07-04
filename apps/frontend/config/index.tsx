import { createAppKit } from "@reown/appkit/react";

import { arbitrum, mainnet } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID!;

if (!projectId) {
  throw new Error("Project ID is not defined");
}
// 2. Create a metadata object - optional
const metadata = {
  name: "xfiCredit",
  description: "AppKit Example",
  url: process.env.NEXT_PUBLIC_WEBSITE_URL || "https://reown.com/appkit", // origin must match your domain & subdomain
  icons: ["https://assets.reown.com/reown-profile-pic.png"],
};

// 3. Set the networks
const networks = [mainnet, arbitrum] as [typeof mainnet, typeof arbitrum];

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
});

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
});
