export default function SettingsLoading() {
  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <div className="h-8 w-24 bg-surface-raised rounded-lg animate-pulse" />
        <div className="h-4 w-48 bg-surface-raised rounded mt-1 animate-pulse" />
      </div>
      {/* Profile skeleton */}
      <div className="mb-8 p-6 bg-surface rounded-xl border border-border">
        <div className="h-5 w-16 bg-surface-raised rounded animate-pulse mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-surface-raised rounded-lg animate-pulse" />
          <div className="h-10 bg-surface-raised rounded-lg animate-pulse" />
        </div>
      </div>
      {/* Password skeleton */}
      <div className="mb-8 p-6 bg-surface rounded-xl border border-border">
        <div className="h-5 w-20 bg-surface-raised rounded animate-pulse mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-surface-raised rounded-lg animate-pulse" />
          <div className="h-10 bg-surface-raised rounded-lg animate-pulse" />
          <div className="h-10 bg-surface-raised rounded-lg animate-pulse" />
        </div>
      </div>
      {/* Danger skeleton */}
      <div className="p-6 bg-surface rounded-xl border border-danger/20">
        <div className="h-5 w-24 bg-surface-raised rounded animate-pulse mb-4" />
        <div className="h-10 w-36 bg-surface-raised rounded-lg animate-pulse" />
      </div>
    </div>
  )
}
