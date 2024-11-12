import { Skeleton } from "@/components/ui/skeleton";

export function LoadingTeams() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-[200px] rounded-lg border border-border animate-pulse bg-muted" />
      ))}
    </div>
  );
}
