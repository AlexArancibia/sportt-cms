// Revertir a la implementación original pero añadir un comentario para claridad
"use client"

import { useMainStore } from "@/stores/mainStore"
import { useEffect, useState } from "react"

export function useStoreInit() {
  const { fetchStores, setCurrentStore } = useMainStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeStore = async () => {
      try {
        console.log("Initializing store...")

        // Recuperar la tienda guardada en localStorage
        const savedStoreId = typeof window !== "undefined" ? localStorage.getItem("currentStoreId") : null
        console.log("Saved store ID from localStorage:", savedStoreId)

        // Cargar las tiendas disponibles primero
        console.log("Fetching available stores...")
        const stores = await fetchStores()
        console.log("Available stores:", stores)

        // Si hay una tienda guardada, seleccionarla
        if (savedStoreId) {
          console.log("Setting current store to:", savedStoreId)
          setCurrentStore(savedStoreId)
        } else if (stores.length > 0) {
          // Si no hay tienda guardada pero hay tiendas disponibles, seleccionar la primera
          console.log("No saved store, selecting first available store:", stores[0].id)
          setCurrentStore(stores[0].id)
        }

        setIsInitialized(true)
        console.log("Store initialization complete")
      } catch (error) {
        console.error("Error initializing store:", error)
        setIsInitialized(true)
      }
    }

    initializeStore()
  }, [fetchStores, setCurrentStore])

  return isInitialized
}
