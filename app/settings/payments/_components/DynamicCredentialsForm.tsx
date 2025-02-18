import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Credential {
  key: string
  value: string
}

interface DynamicCredentialsFormProps {
  credentials?: Record<string, string>
  onChange: (credentials: Record<string, string>) => void
}

export function DynamicCredentialsForm({ credentials = {}, onChange }: DynamicCredentialsFormProps) {
  const [fields, setFields] = useState<Credential[]>(
    Object.entries(credentials).map(([key, value]) => ({ key, value })),
  )

  const addField = () => {
    setFields([...fields, { key: "", value: "" }])
  }

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index)
    setFields(newFields)
    updateCredentials(newFields)
  }

  const updateField = (index: number, field: "key" | "value", newValue: string) => {
    const newFields = fields.map((f, i) => (i === index ? { ...f, [field]: newValue } : f))
    setFields(newFields)
    updateCredentials(newFields)
  }

  const updateCredentials = (newFields: Credential[]) => {
    const newCredentials = newFields.reduce(
      (acc, { key, value }) => {
        if (key) acc[key] = value
        return acc
      },
      {} as Record<string, string>,
    )
    onChange(newCredentials)
  }

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div className="flex-1">
            <Label htmlFor={`key-${index}`} className="sr-only">
              Clave
            </Label>
            <Input
              id={`key-${index}`}
              placeholder="Clave"
              value={field.key}
              onChange={(e) => updateField(index, "key", e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor={`value-${index}`} className="sr-only">
              Valor
            </Label>
            <Input
              id={`value-${index}`}
              placeholder="Valor"
              value={field.value}
              onChange={(e) => updateField(index, "value", e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" size="icon" onClick={() => removeField(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addField}>
        <Plus className="h-4 w-4 mr-2" /> Añadir campo
      </Button>
    </div>
  )
}

