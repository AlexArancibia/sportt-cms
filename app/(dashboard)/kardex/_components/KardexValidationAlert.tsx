'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, XCircle, Info, CheckCircle2 } from 'lucide-react'
import type { KardexValidationResult, KardexValidationIssue, KardexValidationWarning } from './kardexValidation'

interface KardexValidationAlertProps {
  validation: KardexValidationResult
  variantId?: string
  onDismiss?: () => void
  compact?: boolean
}

export function KardexValidationAlert({ 
  validation, 
  variantId, 
  onDismiss,
  compact = false 
}: KardexValidationAlertProps) {
  const { isValid, issues, warnings } = validation
  const errors = issues.filter(i => i.type === 'error')
  const criticalIssues = errors.filter(i => i.severity === 'high')

  // Si no hay problemas, no mostrar nada (o mostrar un indicador positivo si se solicita)
  if (isValid && warnings.length === 0) {
    return null
  }

  // Si hay errores críticos, mostrar alerta de error
  if (criticalIssues.length > 0) {
    return (
      <Alert variant="destructive" className="mb-4">
        <XCircle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>Problemas de Integridad Detectados</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-destructive-foreground/70 hover:text-destructive-foreground"
            >
              ×
            </button>
          )}
        </AlertTitle>
        <AlertDescription className="space-y-2">
          <p className="font-medium">
            Se encontraron {criticalIssues.length} problema(s) crítico(s) en este kardex:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {criticalIssues.map((issue, index) => (
              <li key={index}>{issue.message}</li>
            ))}
          </ul>
          {errors.length > criticalIssues.length && (
            <p className="text-sm text-muted-foreground">
              Y {errors.length - criticalIssues.length} error(es) adicional(es)
            </p>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // Si hay errores no críticos o advertencias
  if (errors.length > 0 || warnings.length > 0) {
    return (
      <Alert variant={errors.length > 0 ? "destructive" : "default"} className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>
            {errors.length > 0 ? 'Problemas Detectados' : 'Advertencias'}
          </span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-foreground/70 hover:text-foreground"
            >
              ×
            </button>
          )}
        </AlertTitle>
        <AlertDescription className="space-y-2">
          {errors.length > 0 && (
            <div>
              <p className="font-medium mb-1">Errores:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.map((issue, index) => (
                  <li key={index}>{issue.message}</li>
                ))}
              </ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div>
              <p className="font-medium mb-1">Advertencias:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {warnings.map((warning, index) => (
                  <li key={index}>
                    {warning.message}
                    {warning.suggestion && (
                      <span className="text-muted-foreground block ml-4 mt-1">
                        💡 {warning.suggestion}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return null
}

/**
 * Componente compacto para mostrar indicadores de validación
 */
interface ValidationBadgeProps {
  validation: KardexValidationResult
  showCount?: boolean
}

export function ValidationBadge({ validation, showCount = true }: ValidationBadgeProps) {
  const errors = validation.issues.filter(i => i.type === 'error')
  const criticalIssues = errors.filter(i => i.severity === 'high')

  if (validation.isValid && validation.warnings.length === 0) {
    return (
      <Badge variant="outline" className="gap-1">
        <CheckCircle2 className="h-3 w-3 text-green-600" />
        Válido
      </Badge>
    )
  }

  if (criticalIssues.length > 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        {showCount && `${criticalIssues.length} `}Crítico
      </Badge>
    )
  }

  if (errors.length > 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        {showCount && `${errors.length} `}Error
      </Badge>
    )
  }

  if (validation.warnings.length > 0) {
    return (
      <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700">
        <Info className="h-3 w-3" />
        {showCount && `${validation.warnings.length} `}Advertencia
      </Badge>
    )
  }

  return null
}

