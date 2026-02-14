import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  const isInvalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true"

  return (
    <div
      data-slot="input"
      className={cn(
        "border-input dark:bg-input/30 flex h-9 w-full min-w-0 items-center justify-center rounded-md border bg-transparent px-3 shadow-xs transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        isInvalid &&
          "border-destructive ring-destructive/20 dark:ring-destructive/40",
        props.disabled && "pointer-events-none cursor-not-allowed opacity-50",
        className
      )}
    >
      <input
        ref={ref}
        type={type}
        data-slot="input-element"
        className={cn(
          "file:text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 selection:bg-primary selection:text-primary-foreground h-7 w-full min-w-0 bg-transparent text-inherit outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed"
        )}
        {...props}
      />
    </div>
  )
})

Input.displayName = "Input"

export { Input }
