"use client"

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button 
      variant="ghost" 
      onClick={toggleTheme} 
 
      className="flex items-start justify-start gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 w-full"
    >
      {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
    </Button>
  )
}
