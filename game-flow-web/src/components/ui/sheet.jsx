import * as React from "react"
import { cn } from "../../lib/utils"

const SheetContext = React.createContext(null)

export function Sheet({ children, open: controlledOpen, onOpenChange }) {
  const [localOpen, setLocalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : localOpen
  const setOpen = isControlled ? onOpenChange : setLocalOpen

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  )
}

export function SheetTrigger({ children, asChild, ...props }) {
  const { setOpen } = React.useContext(SheetContext)
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e)
        setOpen(true)
      },
      ...props
    })
  }

  return (
    <button type="button" onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  )
}

export function SheetContent({ side = "right", className, children, ...props }) {
  const { open, setOpen } = React.useContext(SheetContext)

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={() => setOpen(false)}
      />
      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 bottom-0 z-50 w-full max-w-[280px] bg-secondaryBg border-l border-defaultBorder p-6 shadow-xl flex flex-col justify-start animate-in slide-in-from-right duration-200",
          className
        )}
        {...props}
      >
        {/* Close Button */}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none text-primaryText h-8 w-8 flex items-center justify-center bg-neutral-800 rounded"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <span className="text-lg">✕</span>
        </button>
        <div className="mt-8 flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
export function SheetHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-2 text-left", className)} {...props} />
}
export function SheetTitle({ className, ...props }) {
  return <h3 className={cn("text-lg font-semibold text-primaryText", className)} {...props} />
}
