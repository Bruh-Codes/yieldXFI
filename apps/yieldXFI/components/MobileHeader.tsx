import React from "react";

import { Button } from "./ui/button";
import { Moon, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const MobileHeader = ({
  setTheme,
  theme,
  setToggleMobileMenu,
  toggleMobileMenu,
}: {
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  theme: string | undefined;
  setToggleMobileMenu: (value: React.SetStateAction<boolean>) => void;
  toggleMobileMenu: boolean;
}) => {
  return (
    <div
      className={cn(
        "bg-slate-900/40 md:hidden z-30 w-full backdrop-blur-md inset-0 transition-all ease-in-out delay-150 h-screen fixed",
        {
          "translate-x-full": !toggleMobileMenu,
          "translate-x-0": toggleMobileMenu,
        }
      )}
      onClick={() => setToggleMobileMenu(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex md:hidden translate-x-full relative flex-col transition-all ease-in-out duration-150 items-center justify-center h-screen w-[70%] ml-auto bg-white dark:bg-slate-900 gap-4",
          {
            "translate-x-full": !toggleMobileMenu,
            "translate-x-0 ": toggleMobileMenu,
          }
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-slate-600 dark:text-slate-300 hover:text-lime-500 hover:bg-lime-500/10"
        >
          <Moon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Sun className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button
          type="button"
          onClick={() => setToggleMobileMenu(false)}
          className="absolute right-5 top-5"
        >
          <X />
        </Button>

        <nav className="flex flex-col items-center gap-6">
          <Link
            href="/about-us"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            About
          </Link>
          <Link
            href="/features"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link
            href="/blogs"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Blogs
          </Link>
          <Link
            href="/contact-support"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Support
          </Link>
        </nav>

        <Link href="/dashboard" target="_blank">
          <Button
            className=" bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors"
            variant="outline"
          >
            Launch App
          </Button>
        </Link>

        {/* <OCIDLoginButton /> */}
      </div>
    </div>
  );
};

export default MobileHeader;
