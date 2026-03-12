import React from 'react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-(--color-text-primary)">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border px-4 py-3 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) outline-none transition-all ${
            error
              ? 'border-(--color-danger) focus:ring-2 focus:ring-(--color-danger)/20'
              : 'border-(--color-border) focus:border-(--color-brand) focus:ring-2 focus:ring-(--color-brand)/20'
          }`}
          {...props}
        />
        {error && <p className="text-xs text-(--color-danger)">{error}</p>}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

export default FormInput
