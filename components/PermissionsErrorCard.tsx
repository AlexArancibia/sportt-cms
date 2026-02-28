"use client"

import { AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface PermissionsErrorCardProps {
  onRetry: () => void
  isRetrying?: boolean
}

export function PermissionsErrorCard({
  onRetry,
  isRetrying = false,
}: PermissionsErrorCardProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-1 text-center">
            <h2 className="text-lg font-semibold">No se pudieron cargar los permisos</h2>
            <p className="text-muted-foreground text-sm">
              Revisa tu conexión e intenta de nuevo. Si el problema continúa, contacta al administrador.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
