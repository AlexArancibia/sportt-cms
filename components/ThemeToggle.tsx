"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Button variant="ghost" onClick={toggleTheme} className=" w-fit justify-start">
      {theme === "light" ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-400" />}

    </Button>
  )
}
