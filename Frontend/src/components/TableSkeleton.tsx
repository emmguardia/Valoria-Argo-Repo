interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export default function TableSkeleton({ rows = 10, cols = 5 }: TableSkeletonProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-t border-gray-100">
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div
                      className={`h-4 bg-gray-100 rounded ${
                        colIndex === 0 ? 'w-8' : colIndex === 1 ? 'w-28' : 'w-16'
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
