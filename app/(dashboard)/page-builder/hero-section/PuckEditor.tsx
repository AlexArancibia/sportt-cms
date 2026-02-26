"use client"

import { Puck } from "@puckeditor/core"
import "@puckeditor/core/dist/index.css"
import config from "@/lib/page-builder/puck-config"
import type { PuckData } from "@/lib/page-builder/types"

export function PuckEditor({
  data,
  onDataChange,
  onSave,
  saving,
  canSave = true,
}: {
  data: PuckData
  onDataChange: (data: PuckData) => void
  onSave: () => Promise<void>
  saving: boolean
  canSave?: boolean
}) {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Puck
        config={config}
        data={data as never}
        onChange={(d) => onDataChange(d as PuckData)}
        onPublish={async (d) => {
          onDataChange(d as PuckData)
          await onSave()
        }}
        renderHeaderActions={() => (
          <button
            type="button"
            onClick={() => onSave()}
            disabled={saving || !canSave}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        )}
        height="100%"
      />
    </div>
  )
}
