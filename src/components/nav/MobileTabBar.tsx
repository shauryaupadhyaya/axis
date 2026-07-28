"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav-items";

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] grid grid-cols-5 bg-linen dark:bg-bg border-t border-alabaster z-[999]">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-1 relative transition-fast",
              active ? "text-tuscan before:absolute before:top-0 before:left-2 before:right-2 before:h-0.5 before:bg-tuscan" : "text-graphite",
              active && "bg-tuscan/5"
            )}
          >
            <Icon size={20} strokeWidth={2} />
            <span className={cn("text-[10px]", active && "font-semibold")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
