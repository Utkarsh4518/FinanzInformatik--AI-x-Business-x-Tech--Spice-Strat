export function LoadingSkeleton({
  lines = 4
}: {
  lines?: number;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 animate-pulse rounded-full bg-muted-surface"
          style={{ width: `${100 - index * 12}%` }}
        />
      ))}
    </div>
  );
}
