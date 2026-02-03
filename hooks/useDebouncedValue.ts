import { useState, useEffect } from "react"

type UseDebouncedValueOptions = {
  /** Si es true, actualiza al instante cuando value es falsy (ej. string vacío) */
  instantWhenFalsy?: boolean
}

/**
 * Devuelve una versión debounced del valor. Se actualiza tras `delayMs` sin cambios.
 * Con instantWhenFalsy, al borrar/limpiar (value falsy) actualiza inmediatamente.
 */
export function useDebouncedValue<T>(
  value: T,
  delayMs: number,
  options?: UseDebouncedValueOptions
): T {
  const delay = options?.instantWhenFalsy && !value ? 0 : delayMs
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return debounced
}
