"use client"

import { useEffect, useState, useRef } from "react"
import { useAuthStore } from "@/stores/authStore"
import { useStoresByOwner } from "@/hooks/store/useStoresByOwner"

export function useStoreInit() {
  const user = useAuthStore((s) => s.user)
  const setCurrentStore = useAuthStore((s) => s.setCurrentStore)
  const { data: stores = [], isFetched } = useStoresByOwner(user?.id ?? null)
  const [isInitialized, setIsInitialized] = useState(false)
  const appliedRef = useRef(false)

  useEffect(() => {
    if (!user?.id) {
      setIsInitialized(true)
      return
    }
    if (!isFetched || appliedRef.current) {
      if (isFetched) setIsInitialized(true)
      return
    }

    const savedStoreId = typeof window !== "undefined" ? localStorage.getItem("currentStoreId") : null
    if (savedStoreId && stores.some((store) => store.id === savedStoreId)) {
      setCurrentStore(savedStoreId)
    } else if (stores.length > 0) {
      setCurrentStore(stores[0].id)
    }
    appliedRef.current = true
    setIsInitialized(true)
  }, [user?.id, isFetched, stores, setCurrentStore])

  return isInitialized
}
