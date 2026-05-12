import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import * as React from "react"

import { cn } from "@/lib/utils"

type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  size?: "sm" | "md"
  ariaLabel?: string
}

function Checkbox({
  className,
  size = "md",
  ariaLabel,
  ...props
}: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      aria-label={ariaLabel}
      className={cn(
        "peer inline-flex shrink-0 items-center justify-center rounded-md border-2 border-outline-variant bg-transparent text-white outline-none transition-all",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "h-6 w-6" : "h-5 w-5",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cn(
            "text-white transition-opacity",
            size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"
          )}
        >
          <path
            d="M20 6L9 17l-5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
export type { CheckboxProps }
