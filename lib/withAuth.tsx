// lib/withAuth.tsx
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/router";
import { useEffect } from "react";
import React, { ComponentType } from "react";

export default function withAuth<T extends {}>(Component: ComponentType<T>) {
  return function ProtectedRoute(props: T) {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
      const token = localStorage.getItem("access_token");

      // No aplicar redirección si estamos en la página de login
      if (router.pathname === "/login") return;

      if (!isAuthenticated || !token) {
        router.push("/login"); // Redirige si no está autenticado
      }
    }, [isAuthenticated, router]);

    return <Component {...props} />;
  };
}
