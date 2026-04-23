import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || props.name

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-all
            placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/40
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-danger/60' : 'border-border-light hover:border-border-light'}
            ${className}
          `}
          style={{
            backgroundColor: '#111111',
            color: '#fafafa',
            colorScheme: 'dark',
          }}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-danger/80">{error}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'

export { Input }
