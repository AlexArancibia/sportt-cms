"use client"

import { HeaderBar } from "@/components/HeaderBar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Layers, LayoutGrid } from "lucide-react"

const COMPONENTS = [
  { key: "hero-section", label: "Hero Section", path: "/page-builder/hero-section", description: "Contenido que se muestra encima del hero en la página de inicio." },
]

export default function PageBuilderPage() {
  return (
    <>
      <HeaderBar title="Page Builder" />
      <div className="p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Selecciona un componente para editar
            </CardTitle>
            <CardDescription>
              Elige el componente que quieres editar. Por ahora solo está disponible Hero Section.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {COMPONENTS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.path}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
