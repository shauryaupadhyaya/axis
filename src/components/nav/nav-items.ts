import { Home, ListChecks, Calendar, BookOpen, HeartPulse, StickyNote, User } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/study", label: "Study", icon: BookOpen },
  { href: "/health", label: "Health", icon: HeartPulse },
] as const;

export const NAV_ITEMS_SECONDARY = [
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/profile", label: "Profile", icon: User },
] as const;
