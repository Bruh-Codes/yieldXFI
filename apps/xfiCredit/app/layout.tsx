import { Poppins } from "next/font/google";
import "./globals.css";
import WagmiContextProvider from "@/components/WagmiContextProvider";
import { headers } from "next/headers";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import NextTopLoader from "nextjs-toploader";
const poppins = Poppins({
  variable: "--font-space-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} antialiased bg-background`}>
        <NextTopLoader
          showSpinner={false}
          color="#4338ca"
          initialPosition={0.04}
          crawlSpeed={300}
          height={2}
          crawl={true}
          easing="ease"
          speed={350}
          shadow="0 0 10px #4338ca,0 0 5px #4338ca"
          zIndex={9999}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <WagmiContextProvider cookies={cookies}>
            {children}
          </WagmiContextProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
