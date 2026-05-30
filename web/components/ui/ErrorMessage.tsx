interface ErrorMessageProps {
  message: string
  className?: string
}

export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  return (
    <div className={`mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger/90 ${className}`}>
      {message}
    </div>
  )
}
