export default function ProductCardSkeleton() {
  return (
    <div className="carte animate-pulse overflow-hidden" aria-hidden="true">
      <div className="aspect-[4/3] bg-nuit-700" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/4 rounded bg-nuit-700" />
        <div className="h-5 w-3/4 rounded bg-nuit-700" />
        <div className="h-3 w-full rounded bg-nuit-850" />
        <div className="flex items-center justify-between pt-4">
          <div className="h-6 w-20 rounded bg-nuit-700" />
          <div className="h-11 w-20 rounded-xl bg-nuit-700" />
        </div>
      </div>
    </div>
  );
}
