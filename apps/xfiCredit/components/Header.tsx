"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import MobileHeader from "@/components/MobileHeader";

const Header = () => {
	const { theme, setTheme } = useTheme();
	const [toggleMobileMenu, setToggleMobileMenu] = useState(false);

	return (
		<>
			<header className="fixed w-full z-30 top-0 border-b border-slate-200 dark:border-slate-800/60 backdrop-blur-md bg-white/80 dark:bg-slate-900/80">
				<div className="container mx-auto px-4 py-2`">
					<div className="flex justify-between items-center">
						<Link href={"/"} className="flex items-center gap-3">
							<div>
								<h1 className="text-lg md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-yellow-500">
									yieldXFI
								</h1>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									Learn & Earn Protocol
								</p>
							</div>
						</Link>
						<div className="hidden md:flex items-center gap-4">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
								className="text-slate-600 dark:text-slate-300 hover:text-purple-500 hover:bg-purple-500/10"
							>
								<Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
								<Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
								<span className="sr-only">Toggle theme</span>
							</Button>

							<nav className="flex items-center text-sm gap-6">
								<a
									href="/about-us"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									About
								</a>
								<a
									href="/features"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Features
								</a>
								<a
									href="/blogs"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Blogs
								</a>
								<a
									href="/contact-support"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Support
								</a>
							</nav>

							<Link href="/dashboard" target="_blank">
								<Button
									className=" bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors"
									variant="outline"
								>
									Launch App
								</Button>
							</Link>
						</div>
						<Button
							type="button"
							className="md:hidden"
							onClick={() => setToggleMobileMenu(true)}
						>
							<Menu />
						</Button>
					</div>
				</div>
			</header>
			<MobileHeader
				setToggleMobileMenu={setToggleMobileMenu}
				toggleMobileMenu={toggleMobileMenu}
				setTheme={setTheme}
				theme={theme}
			/>
		</>
	);
};

export default Header;
