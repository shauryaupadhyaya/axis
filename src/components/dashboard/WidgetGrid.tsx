import { ReactNode } from "react";

export function WidgetGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">{children}</div>
  );
}

export function WidgetSlot({ span, children }: { span: 1 | 2; children: ReactNode }) {
  return <div className={span === 2 ? "lg:col-span-2" : "lg:col-span-1"}>{children}</div>;
}
