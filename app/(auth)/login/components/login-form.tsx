"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuthStore } from "@/stores/authStore"
import { motion, AnimatePresence } from "framer-motion"

export function LoginForm() {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [rememberMe, setRememberMe] = useState<boolean>(true)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const { login, loading, error } = useAuthStore()

  // Cargar email guardado de localStorage al iniciar
  useEffect(() => {
    const savedEmail = localStorage.getItem("email")
    if (savedEmail) setEmail(savedEmail)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    localStorage.setItem("email", email)
    await login(email, password)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="w-full h-full bg-[#0a192f]/90 backdrop-blur-sm p-6 md:p-8 rounded-r-lg flex items-center border-y border-r border-[#1e3a5f]/50">
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-medium text-white mb-2">Bienvenido</h2>
          <p className="text-gray-400 text-sm">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-300 flex items-center space-x-1.5">
              <Mail className="h-3.5 w-3.5" />
              <span>Email</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@ejemplo.com"
              required
              className="bg-[#112240] border-[#1e3a5f]/50 text-white placeholder-gray-500 focus:ring-emerald-500/30 focus:border-emerald-500/30 rounded-md h-10 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-gray-300 flex items-center space-x-1.5">
                <Lock className="h-3.5 w-3.5" />
                <span>Contraseña</span>
              </Label>
              <a href="#" className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                ¿Olvidaste?
              </a>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                className="bg-[#112240] border-[#1e3a5f]/50 text-white placeholder-gray-500 focus:ring-emerald-500/30 focus:border-emerald-500/30 rounded-md h-10 pr-10 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex items-center h-4">
              <Checkbox
                id="remember"
                className="h-4 w-4 border-[#1e3a5f]/50 rounded bg-[#112240] text-emerald-500"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(!!checked)}
              />
            </div>
            <div className="ml-2 text-sm">
              <Label htmlFor="remember" className="text-gray-300">
                Recordarme
              </Label>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-200 text-xs"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md text-sm px-4 transition-colors flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Iniciando...</span>
              </>
            ) : (
              <>
                <span>Iniciar sesión</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1e3a5f]/50"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[#0a192f] text-gray-400">O continuar con</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="inline-flex justify-center items-center py-2 px-3 border border-[#1e3a5f]/50 rounded-md bg-[#112240] text-xs font-medium text-gray-300 hover:bg-[#172d4e] transition-colors"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13 18.63 6.72 16.69 5.82 14.09H2.12V16.95C3.94 20.53 7.69 23 12 23Z"
                  fill="#34A853"
                />
                <path
                  d="M5.82 14.09C5.58 13.43 5.44 12.73 5.44 12C5.44 11.27 5.58 10.57 5.82 9.91V7.05H2.12C1.4 8.57 1 10.24 1 12C1 13.76 1.4 15.43 2.12 16.95L5.82 14.09Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.37C13.62 5.37 15.06 5.94 16.21 7.02L19.36 3.87C17.45 2.09 14.97 1 12 1C7.69 1 3.94 3.47 2.12 7.05L5.82 9.91C6.72 7.31 9.13 5.37 12 5.37Z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="inline-flex justify-center items-center py-2 px-3 border border-[#1e3a5f]/50 rounded-md bg-[#112240] text-xs font-medium text-gray-300 hover:bg-[#172d4e] transition-colors"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 16.9913 5.65686 21.1283 10.4375 21.8785V14.8906H7.89844V12H10.4375V9.79688C10.4375 7.29063 11.9305 5.90625 14.2146 5.90625C15.3084 5.90625 16.4531 6.10156 16.4531 6.10156V8.5625H15.1922C13.95 8.5625 13.5625 9.33334 13.5625 10.1242V12H16.3359L15.8926 14.8906H13.5625V21.8785C18.3431 21.1283 22 16.9913 22 12Z"
                  fill="#1877F2"
                />
                <path
                  d="M15.8926 14.8906L16.3359 12H13.5625V10.1242C13.5625 9.33334 13.95 8.5625 15.1922 8.5625H16.4531V6.10156C16.4531 6.10156 15.3084 5.90625 14.2146 5.90625C11.9305 5.90625 10.4375 7.29063 10.4375 9.79688V12H7.89844V14.8906H10.4375V21.8785C11.2871 22.0405 12.1629 22.0405 13.0125 21.8785V14.8906H15.8926Z"
                  fill="white"
                />
              </svg>
              Facebook
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            ¿No tienes una cuenta?{" "}
            <a href="#" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Crear ahora
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
