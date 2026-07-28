import Link from "next/link";
import { Card } from "@/components/ui/Card";

interface FocusCardProps {
  headline: string;
  metadata: string;
  ctaHref: string;
  ctaLabel: string;
}

export function FocusCard({ headline, metadata, ctaHref, ctaLabel }: FocusCardProps) {
  return (
    <Card variant="focus" className="mb-6">
      <p className="text-label text-tuscan mb-2">Next priority</p>
      <h2 className="text-h2">{headline}</h2>
      <p className="text-small text-graphite my-2 mb-4">{metadata}</p>
      <Link
        href={ctaHref}
        className="inline-flex items-center justify-center w-full sm:w-auto bg-carbon text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-graphite active:bg-tuscan active:text-carbon transition-fast focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-tuscan dark:bg-tuscan dark:text-carbon dark:hover:opacity-90"
      >
        {ctaLabel}
      </Link>
    </Card>
  );
}
