export default function PomodoroLoading() {
  return (
    <div className="max-w-4xl animate-fade-in">
      {/* Title skeleton */}
      <div className="mb-6">
        <div className="h-8 w-44 bg-surface-raised rounded-lg animate-pulse" />
        <div className="h-4 w-36 bg-surface-raised rounded mt-1 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-surface-raised border border-border-light rounded-xl p-6 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-surface-overlay animate-pulse mb-4" />
            <div className="h-6 w-24 bg-surface-overlay rounded animate-pulse mb-2" />
            <div className="h-10 w-28 bg-primary-600/30 rounded-lg animate-pulse" />
          </div>
        </div>
        {/* Sessions skeleton */}
        <div className="lg:col-span-2">
          <div className="bg-surface-raised border border-border-light rounded-xl p-6">
            <div className="h-6 w-36 bg-surface-overlay rounded animate-pulse mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-surface-overlay rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}