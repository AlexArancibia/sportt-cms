'use server'

import { cookies } from 'next/headers'

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string

  try {
    // Simular una llamada a la API para enviar un enlace de inicio de sesión
    // En una implementación real, aquí enviarías un email con un enlace mágico
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simular delay de red

    // Usar la API de cookies de Next.js correctamente
    ;(await
      // Usar la API de cookies de Next.js correctamente
      cookies()).set('auth_email', email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 5 * 60, // 5 minutos, solo para demostración
      path: '/',
    })

    return { success: true, message: 'Check your email for the login link!' }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Failed to send login email' }
  }
}

