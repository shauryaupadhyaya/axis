import { Sidebar } from "@/components/nav/Sidebar";
import { MobileTabBar } from "@/components/nav/MobileTabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <Sidebar />
      <main className="flex-1 md:pl-[60px] lg:pl-60 pb-[60px] md:pb-0">{children}</main>
      <MobileTabBar />
    </div>
  );
}
