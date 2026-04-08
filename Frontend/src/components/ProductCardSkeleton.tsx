export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-56 bg-gray-200" />
      <div className="p-6 space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="flex justify-between items-center pt-4">
          <div className="h-6 bg-gray-200 rounded w-20" />
          <div className="h-10 bg-gray-200 rounded-xl w-24" />
        </div>
      </div>
    </div>
  );
}
