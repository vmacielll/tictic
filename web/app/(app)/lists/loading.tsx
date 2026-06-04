export default function ListsLoading() {
  return (
    <div className="max-w-2xl animate-fade-in">
      {/* Title skeleton */}
      <div className="mb-6">
        <div className="h-8 w-16 bg-surface-raised rounded-lg animate-pulse" />
        <div className="h-4 w-36 bg-surface-raised rounded mt-1 animate-pulse" />
      </div>
      {/* Form skeleton */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex-1 h-10 bg-surface-raised rounded-lg animate-pulse" />
        <div className="h-10 w-16 bg-primary-600/30 rounded-lg animate-pulse" />
      </div>
      {/* List items skeleton */}
      <div className="space-y-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-surface-raised rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}