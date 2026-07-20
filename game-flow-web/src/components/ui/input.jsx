import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border border-defaultBorder bg-secondaryBg px-4 py-2 text-sm text-primaryText placeholder:text-mutedText focus:outline-none focus:border-orangeBorder focus:ring-1 focus:ring-primaryOrange/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
