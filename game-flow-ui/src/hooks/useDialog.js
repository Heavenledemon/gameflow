import { useCallback, useState } from 'react'

export function useDialog(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen)
  return { open, show: useCallback(() => setOpen(true), []), hide: useCallback(() => setOpen(false), []), toggle: useCallback(() => setOpen((value) => !value), []) }
}

