export default function ListDetailLoading() {
  return (
    <div className="max-w-2xl animate-fade-in">
      {/* Back link skeleton */}
      <div className="h-4 w-24 bg-surface-raised rounded animate-pulse mb-4" />
      {/* List header skeleton */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-4 h-4 bg-surface-raised rounded-full animate-pulse" />
        <div>
          <div className="h-7 w-40 bg-surface-raised rounded-lg animate-pulse" />
          <div className="h-4 w-20 bg-surface-raised rounded mt-1 animate-pulse" />
        </div>
      </div>
      {/* Task list skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-surface-raised rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}