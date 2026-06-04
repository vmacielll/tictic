export default function Loading() {
  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="space-y-4">
        <div className="h-8 w-32 bg-surface-raised rounded-lg animate-pulse" />
        <div className="h-4 w-48 bg-surface-raised rounded animate-pulse" />
        <div className="space-y-2 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-surface-raised rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}