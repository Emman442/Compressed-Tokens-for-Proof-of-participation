"use client"
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
// import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import dynamic from "next/dynamic";
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then(mod=> mod.WalletMultiButton), {ssr: false}
);

const Header = () => {
  const pathname = usePathname();
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center mx-auto w-[90%]">
        <div className="mr-4 flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-(--solana-purple) to-(--solana-purple-dark)"></div>
          <span className="hidden font-bold sm:inline-block">
            VaultDrop
          </span>
        </div>
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6 overflow-x-auto">
          <Link
            href="/dashboard"
            className={cn(
              "text-sm font-medium transition-colors hover:text-(--solana-purple) whitespace-nowrap",
              isActive("/dashboard")
                ? "text-(--solana-purple)"
                : "text-(--muted-foreground)"
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/create-event"
            className={cn(
              "text-sm font-medium transition-colors hover:text-solana-purple whitespace-nowrap",
              isActive("/create-event")
                ? "text-(--solana-purple)"
                : "text-(--muted-foreground)"
            )}
          >
            Create Event
          </Link>
        </nav>
        <div className="ml-auto flex items-center space-x-4 custom-wallet-ui">
          <WalletMultiButton style={{height: "40px", borderRadius: "6px"}}/>
        </div>
      </div>
    </header>
  );
};

export default Header;
