import { useAuthStore } from '@/stores/authStore';

/**
 * Hook personalizado para acceder a la información de stores del usuario
 * Este hook proporciona acceso centralizado a:
 * - La lista de stores asociadas al usuario
 * - El store actualmente seleccionado
 * - Funciones para cambiar de store
 */
export const useStores = () => {
  const stores = useAuthStore((state) => state.stores);
  const currentStoreId = useAuthStore((state) => state.currentStoreId);
  const setCurrentStore = useAuthStore((state) => state.setCurrentStore);
  const getCurrentStore = useAuthStore((state) => state.getCurrentStore);

  return {
    stores,
    currentStoreId,
    currentStore: getCurrentStore(),
    setCurrentStore,
    hasStores: stores.length > 0,
  };
};

