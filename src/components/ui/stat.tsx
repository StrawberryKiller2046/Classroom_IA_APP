import { cn } from "@/lib/utils"

export function StatStrip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <dl className={cn("grid grid-cols-2 divide-x divide-y rounded-xl border sm:divide-y-0", className)}>
      {children}
    </dl>
  )
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 sm:p-5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
