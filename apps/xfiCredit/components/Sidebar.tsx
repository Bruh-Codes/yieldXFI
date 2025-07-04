"use client";

import { Landmark, LineChart, Lock, Settings, Trophy } from "lucide-react";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClassValue } from "clsx";

import {
  SidebarHeader,
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarContent,
} from "./ui/sidebar";

const AppSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/dashboard/learn") {
      router.push("/dashboard");
    }
  }, [pathname, router]);

  return (
    <Sidebar variant="sidebar" className="border-none">
      <SidebarHeader className="flex">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl ml-3 font-bold text-foreground">
                xfiCredit
              </h1>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="flex-1 px-3">
          <div className="mb-6">
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">
              Main
            </p>
            <nav className="space-y-0.5">
              <SidebarLink
                icon={<LineChart className="size-4" />}
                label="Dashboard"
                active={pathname === "/dashboard"}
                link={"/dashboard"}
              />

              <SidebarLink
                className="opacity-25"
                icon={<Landmark className="size-4" />}
                label="Borrow"
                active={pathname === "/dashboard/borrow"}
                link={"/dashboard/borrow"}
              />

              <SidebarLink
                icon={<Lock className="size-4" />}
                label="Stake"
                active={pathname === "/dashboard/stake"}
                link={"/dashboard/stake"}
              />

              <SidebarLink
                icon={<Trophy className="size-4" />}
                label="Rewards"
                active={pathname === "/dashboard/rewards"}
                link={"/dashboard/rewards"}
              />
            </nav>
          </div>

          {/* <hr className="border-slate-200 dark:border-slate-800/60 my-4" />

          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">
            Analytics
          </p>
          <div className="mb-6">
            <nav className="space-y-0.5">
              <SidebarLink
                icon={<BarChart2 className="size-4" />}
                label="Protocol Stats"
                active={pathname === "/dashboard/protocol-stats"}
                link={"/dashboard/protocol-stats"}
              />
            </nav>
          </div> */}

          <hr className="border-slate-200 dark:border-slate-800/60 my-4" />
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">
            Account
          </p>
          <div className="mb-6">
            <nav className="space-y-0.5">
              {/* <SidebarLink
                icon={<CreditCard className="size-4" />}
                label="Transactions"
                active={pathname === "/dashboard/transactions"}
                link={"/dashboard/transactions"}
              /> */}

              <SidebarLink
                icon={<Settings className="size-4" />}
                label="Settings"
                active={pathname === "/dashboard/settings"}
                link={"/dashboard/settings"}
              />
            </nav>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;

function SidebarLink({
  icon,
  label,
  active,
  link,
  className,
}: {
  active: boolean;
  label: string;
  icon: React.JSX.Element;
  link: string;
  className?: ClassValue;
}) {
  return label == "Learn" ? (
    <p
      className={cn(
        "flex items-center gap-3 text-sm w-full px-3 overflow-x-clip py-2 rounded-lg transition-colors",
        {
          "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400":
            active,
          "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60":
            !active,
        },
        className
      )}
    >
      {icon} {label} <Lock size={15} className="text-red-600" />{" "}
    </p>
  ) : (
    <Link
      href={link}
      className={cn(
        "flex items-center gap-3 w-full px-3 overflow-x-clip py-2 rounded-lg transition-colors",
        {
          "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400":
            active,
          "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60":
            !active,
        },
        className
      )}
    >
      <span
        className={cn({
          "text-indigo-600 dark:text-indigo-400": active,
          "text-slate-500 dark:text-slate-400": !active,
        })}
      >
        {icon}
      </span>

      <span className="font-medium text-xs">{label}</span>
    </Link>
  );
}
