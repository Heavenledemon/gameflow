import * as React from "react"
import { cn } from "../../lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryOrange/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
        {
          "bg-primaryOrange text-white hover:bg-orangeHover shadow-sm": variant === "default",
          "border border-orangeBorder bg-transparent hover:bg-softOrange text-primaryText": variant === "outline",
          "hover:bg-neutral-800 text-mutedText hover:text-primaryText": variant === "ghost",
          "bg-white text-black hover:bg-neutral-200": variant === "secondary",
        },
        {
          "h-10 px-4 py-2": size === "default",
          "h-8 rounded-md px-3 text-xs": size === "sm",
          "h-11 rounded-md px-8 text-base": size === "lg",
          "h-10 w-10 p-0": size === "icon",
        },
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
