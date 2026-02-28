"use client"

import { AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface NoPermissionScreenProps {
  title?: string
  message?: string
  backLabel?: string
  backHref?: string
}

export function NoPermissionScreen({
  title = "Sin acceso",
  message = "No tienes permiso para ver esta página. Si crees que deberías tener acceso, contacta al administrador de la tienda.",
  backLabel = "Volver",
  backHref = "/",
}: NoPermissionScreenProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-1 text-center">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-muted-foreground text-sm">{message}</p>
          </div>
          {backHref && (
            <Button variant="outline" asChild>
              <Link href={backHref}>{backLabel}</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
