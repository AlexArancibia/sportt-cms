import { AlertCircle } from "lucide-react"

interface SectionErrorHintProps {
  title: string
  messages?: string[]
}

export function SectionErrorHint({ title, messages }: SectionErrorHintProps) {
  if (!messages || messages.length === 0) {
    return null
  }

  return (
    <details className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-muted-foreground">
      <summary className="flex cursor-pointer items-center gap-2 font-medium text-destructive">
        <AlertCircle className="h-3.5 w-3.5" />
        {title}
      </summary>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </details>
  )
}

