"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import AppKitButton from "./AppKitButton";
import { SidebarTrigger } from "./ui/sidebar";

const DashboardHeader = () => {
	const { open } = useAppKit();
	const { isConnected } = useAppKitAccount();

	return (
		<header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear">
			<SidebarTrigger className="-ml-1" />
			<div className="flex w-full items-center justify-end gap-1 lg:gap-2">
				{!isConnected ? (
					<Button
						type="button"
						onClick={() => open({ view: "Connect" })}
						className="bg-primary text-primary-foreground font-semibold hover:opacity-90 text-xs"
					>
						Connect Wallet
					</Button>
				) : (
					<AppKitButton />
				)}
			</div>
		</header>
	);
};

export default DashboardHeader;
