export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">TickTick Clone</h1>
          <p className="mt-2 text-gray-600">Organize your life, one task at a time</p>
        </div>
        {children}
      </div>
    </div>
  )
}
