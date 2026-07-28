"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import { NAV_ITEMS, NAV_ITEMS_SECONDARY } from "./nav-items";
import { signOut } from "@/app/(auth)/actions";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "group hidden md:flex flex-col fixed left-0 top-0 h-screen z-[1000]",
        "w-[60px] md:hover:w-60 lg:w-60 overflow-hidden",
        "bg-linen dark:bg-bg border-r border-alabaster px-4 py-5 transition-[width] duration-140"
      )}
    >
      <Link href="/dashboard" className="flex items-center gap-3 mb-8 shrink-0">
        <Compass size={28} className="text-tuscan shrink-0" strokeWidth={2} />
        <span className="text-h3 whitespace-nowrap opacity-0 md:group-hover:opacity-100 lg:opacity-100 transition-opacity">
          AXIS
        </span>
      </Link>

      <nav className="flex flex-col gap-2 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-fast relative",
                active
                  ? "bg-carbon text-white font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-tuscan before:rounded-l-lg dark:bg-tuscan dark:text-carbon dark:before:hidden"
                  : "text-graphite hover:bg-bg hover:text-tuscan"
              )}
            >
              <Icon size={20} strokeWidth={2} className="shrink-0" />
              <span className="whitespace-nowrap opacity-0 md:group-hover:opacity-100 lg:opacity-100 transition-opacity">
                {label}
              </span>
            </Link>
          );
        })}

        <div className="mt-4 mb-1 px-3">
          <span className="text-[10px] uppercase tracking-wider text-graphite opacity-50 whitespace-nowrap opacity-0 md:group-hover:opacity-100 lg:opacity-100 transition-opacity">
            More
          </span>
        </div>

        {NAV_ITEMS_SECONDARY.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-fast",
                active
                  ? "bg-carbon text-white font-semibold dark:bg-tuscan dark:text-carbon"
                  : "text-graphite hover:bg-bg hover:text-tuscan"
              )}
            >
              <Icon size={20} strokeWidth={2} className="shrink-0" />
              <span className="whitespace-nowrap opacity-0 md:group-hover:opacity-100 lg:opacity-100 transition-opacity">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <form action={signOut}>
        <button
          type="submit"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-graphite hover:bg-bg hover:text-danger transition-fast w-full mt-auto"
        >
          <LogOut size={20} strokeWidth={2} className="shrink-0" />
          <span className="whitespace-nowrap opacity-0 md:group-hover:opacity-100 lg:opacity-100 transition-opacity">
            Sign out
          </span>
        </button>
      </form>
    </aside>
  );
}
