'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthStore } from '@/stores/authStore'

export function LoginForm() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const { login, loading, error } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg md:mt-0 sm:max-w-md xl:p-0 border border-gray-700">
      <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
        <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-100 md:text-2xl">
          Sign in to your account
        </h1>
        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-300">Your email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              required
              className="bg-gray-700 bg-opacity-50 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-violet-500 focus:border-violet-500 w-full p-2.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-300">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              className="bg-gray-700 bg-opacity-50 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-violet-500 focus:border-violet-500 w-full p-2.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <Checkbox id="remember" className="w-4 h-4 border border-gray-600 rounded bg-gray-700 focus:ring-3 focus:ring-violet-500" />
              </div>
              <div className="ml-3 text-sm">
                <Label htmlFor="remember" className="text-gray-400">Remember me</Label>
              </div>
            </div>
            <a href="#" className="text-sm font-medium text-violet-400 hover:underline">Forgot password?</a>
          </div>
          <Button
            type="submit"
            className="w-full bg-violet-600 text-white hover:bg-violet-700 focus:ring-4 focus:outline-none focus:ring-violet-500 rounded-lg text-sm px-5 py-2.5 transition-colors duration-300"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </form>
      </div>
    </div>
  )
}

