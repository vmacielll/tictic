import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { children, variant = 'primary', isLoading = false, className = '', disabled, ...props },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed'

    const variantStyles = {
      primary: 'bg-primary-600 text-white hover:bg-primary-500 active:bg-primary-700 shadow-sm shadow-primary-600/20',
      secondary: 'bg-surface-raised text-text-primary border border-border-light hover:bg-surface-overlay',
      ghost: 'text-text-secondary hover:bg-surface-raised hover:text-text-primary',
      danger: 'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : null}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button }
