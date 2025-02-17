"use client"
import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export const useAuthInitializer = () => {
  const initializeAuth = useAuthStore(state => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
};

