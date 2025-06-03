"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { LoginForm } from "./components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#0f2e53] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-teal-600/10 mix-blend-screen filter blur-[80px] animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-emerald-600/10 mix-blend-screen filter blur-[90px] animate-float-delayed"></div>
        </div>
      </div>

      <Link
        href="/"
        className="absolute left-4 top-4 md:left-6 md:top-6 bg-[#112240]/70 backdrop-filter backdrop-blur rounded-md px-3 py-1.5 text-gray-300 hover:bg-opacity-90 transition-all duration-300 border border-[#1e3a5f]/50 z-10 text-sm"
      >
        <span className="font-medium">E-commerce</span>
      </Link>

      <div className="w-full max-w-4xl relative flex flex-col lg:flex-row rounded-lg overflow-hidden shadow-xl z-10">
        {/* Lado izquierdo - Información de marca */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-[#0f2e53] to-[#0a192f] p-6 md:p-8 rounded-l-lg border-y border-l border-[#1e3a5f]/50"
        >
          <div className="h-full flex flex-col justify-between">
            <div>
 
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-4 mt-10"
            >
              <h2 className="text-2xl font-medium text-white leading-tight">Panel de administración para tu negocio</h2>
              <p className="text-teal-100 text-sm">Accede a tu panel y gestiona productos en un solo lugar.</p>

              <div className="pt-4">
                <ul className="space-y-2 text-teal-100 text-xs">
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-emerald-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    Gestión de inventario
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-emerald-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    Análisis en tiempo real
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-emerald-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    Soporte 24/7
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Lado derecho - Formulario de login */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full lg:w-1/2"
        >
          <LoginForm />
        </motion.div>
      </div>
    </div>
  )
}
