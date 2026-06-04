export default function CalendarLoading() {
  return (
    <div className="max-w-5xl animate-fade-in w-full">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-surface-raised rounded-lg animate-pulse" />
          <div className="h-9 w-16 bg-primary-600/30 rounded-lg animate-pulse" />
          <div className="h-9 w-9 bg-surface-raised rounded-lg animate-pulse" />
          <div className="h-6 w-32 bg-surface-raised rounded animate-pulse" />
        </div>
        <div className="flex items-center bg-surface-raised border border-border-light rounded-lg p-1">
          <div className="h-8 w-16 bg-surface-raised rounded-md animate-pulse" />
          <div className="h-8 w-16 bg-surface-raised rounded-md animate-pulse" />
          <div className="h-8 w-12 bg-surface-raised rounded-md animate-pulse" />
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="bg-surface-raised border border-border-light rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="py-2.5 text-center">
              <div className="h-3 w-8 bg-surface-overlay rounded mx-auto animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="border border-border/30 p-1.5 min-h-[80px] sm:min-h-[100px]">
              <div className="h-4 w-6 bg-surface-overlay rounded-full animate-pulse mb-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}