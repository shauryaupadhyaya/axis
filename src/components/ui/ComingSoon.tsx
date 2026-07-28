import { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
}

export function ComingSoon({ icon: Icon, title }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] px-10 text-center">
      <Icon size={48} strokeWidth={2} className="text-graphite mb-4" />
      <h1 className="text-h1 mb-2">{title}</h1>
      <p className="text-body text-graphite max-w-[320px]">
        This section is on the roadmap and isn&apos;t built yet.
      </p>
    </div>
  );
}
