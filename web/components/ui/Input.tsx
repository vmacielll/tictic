import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, type, ...props }, ref) => {
    const inputId = id || props.name
    const isPassword = type === 'password'
    const [showPassword, setShowPassword] = useState(false)

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
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-all
              bg-surface text-text-primary
              placeholder:text-text-muted
              focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/40
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isPassword ? 'pr-10' : ''}
              ${error ? 'border-danger/60' : 'border-border-light hover:border-border-light'}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} className="w-4 h-4" />
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-danger/80">{error}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'

export { Input }
