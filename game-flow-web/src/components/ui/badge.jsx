import * as React from "react"
import { cn } from "../../lib/utils"

function Badge({ className, variant = "default", ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
        {
          "border-transparent bg-primaryOrange text-white shadow": variant === "default",
          "border-orangeBorder bg-softOrange text-primaryOrange": variant === "outline",
          "border-transparent bg-neutral-800 text-neutral-200": variant === "secondary",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
