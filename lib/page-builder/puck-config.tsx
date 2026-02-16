"use client"

import React from "react"
import { Loader2 } from "lucide-react"
import type { Config } from "@puckeditor/core"
import { getImageUrl } from "@/lib/imageUtils"
import { uploadImageToR2 } from "@/lib/imageUpload"
import { useAuthStore } from "@/stores/authStore"
import { useShopSettings } from "@/hooks/useShopSettings"

function ImageUploadField({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const currentStoreId = useAuthStore((s) => s.currentStoreId)
  const { data: shopSettings } = useShopSettings(currentStoreId ?? null)
  const shopId = shopSettings?.name ?? currentStoreId ?? "default-shop"
  const [uploading, setUploading] = React.useState(false)
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { success, fileUrl } = await uploadImageToR2(file, shopId)
      if (success && fileUrl) onChange(fileUrl)
    } finally {
      setUploading(false)
    }
  }
  return (
    <div className="space-y-2">
      <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="text-sm" />
      {uploading && (
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          <span>Subiendo imagen…</span>
        </div>
      )}
      {value && !uploading && (
        <img src={getImageUrl(value)} alt="" className="max-h-20 object-contain border rounded" />
      )}
    </div>
  )
}

function createImageUploadField() {
  return {
    type: "custom" as const,
    label: "Imagen",
    render: ImageUploadField,
  }
}

const config: Config = {
  root: {
    render: ({ children }: { children: React.ReactNode }) => {
      return <div style={{ minHeight: 200, padding: 16 }}>{children}</div>
    },
  },
  components: {
    // —— Básico ——
    Heading: {
      label: "Título",
      fields: {
        text: { type: "text", label: "Texto" },
        level: {
          type: "select",
          label: "Nivel",
          options: [
            { label: "H1", value: "h1" },
            { label: "H2", value: "h2" },
            { label: "H3", value: "h3" },
            { label: "H4", value: "h4" },
            { label: "H5", value: "h5" },
            { label: "H6", value: "h6" },
          ],
        },
        fontSize: { type: "number", label: "Tamaño (px)", min: 10, max: 72 },
        lineHeight: { type: "number", label: "Line height (px)", min: 14, max: 80 },
      },
      defaultProps: {
        text: "Título",
        level: "h1",
        fontSize: 32,
        lineHeight: 40,
      },
      render: ({ text, level: Level, fontSize, lineHeight }) => {
        const Tag = (Level || "h1") as keyof JSX.IntrinsicElements
        return (
          <Tag style={{ fontSize: fontSize ? `${fontSize}px` : undefined, lineHeight: lineHeight ? `${lineHeight}px` : undefined }}>
            {text || ""}
          </Tag>
        )
      },
    },
    Text: {
      label: "Texto",
      fields: {
        content: { type: "textarea", label: "Contenido" },
        fontSize: { type: "number", label: "Tamaño (px)", min: 10, max: 24 },
      },
      defaultProps: { content: "Escribe aquí tu texto.", fontSize: 16 },
      render: ({ content, fontSize }) => (
        <p style={{ fontSize: fontSize ? `${fontSize}px` : undefined }}>{content || "Escribe aquí tu texto."}</p>
      ),
    },
    Image: {
      label: "Imagen",
      fields: {
        src: createImageUploadField(),
        alt: { type: "text", label: "Alt" },
        href: { type: "text", label: "Enlace (opcional)" },
        width: { type: "number", label: "Ancho (px)", min: 0, max: 1200 },
        height: { type: "number", label: "Alto (px)", min: 0, max: 800 },
        objectFit: {
          type: "select",
          label: "Object fit",
          options: [
            { label: "Cover", value: "cover" },
            { label: "Contain", value: "contain" },
          ],
        },
      },
      defaultProps: { src: "", alt: "", href: "", width: 0, height: 0, objectFit: "cover" },
      render: ({ src, alt, href, width, height, objectFit }) => {
        if (!src || src.trim() === "") {
          const placeholder = (
            <div
              style={{
                width: width || 200,
                height: height || 120,
                background: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#888",
                fontSize: 14,
              }}
            >
              Sube una imagen
            </div>
          )
          return href ? <a href={href}>{placeholder}</a> : placeholder
        }
        const img = (
          <img
            src={getImageUrl(src)}
            alt={alt || ""}
            style={{ width: width || undefined, height: height || undefined, objectFit: objectFit || "cover" }}
          />
        )
        return href ? <a href={href}>{img}</a> : img
      },
    },
    Button: {
      label: "Botón",
      fields: {
        label: { type: "text", label: "Texto" },
        href: { type: "text", label: "Enlace" },
        target: {
          type: "select",
          label: "Target",
          options: [
            { label: "Misma ventana", value: "_self" },
            { label: "Nueva ventana", value: "_blank" },
          ],
        },
      },
      defaultProps: { label: "Ver más", href: "#", target: "_self" },
      render: ({ label, href, target }) => (
        <a href={href || "#"} target={target || "_self"} rel={target === "_blank" ? "noopener noreferrer" : undefined}>
          {label || "Botón"}
        </a>
      ),
    },
    Link: {
      label: "Enlace",
      fields: {
        text: { type: "text", label: "Texto" },
        href: { type: "text", label: "URL" },
        target: {
          type: "select",
          label: "Target",
          options: [
            { label: "Misma ventana", value: "_self" },
            { label: "Nueva ventana", value: "_blank" },
          ],
        },
      },
      defaultProps: { text: "Enlace", href: "#", target: "_self" },
      render: ({ text, href, target }) => (
        <a href={href || "#"} target={target || "_self"} rel={target === "_blank" ? "noopener noreferrer" : undefined}>
          {text || "Enlace"}
        </a>
      ),
    },
    Spacer: {
      label: "Espaciador",
      fields: {
        height: { type: "number", label: "Altura (px)", min: 0, max: 200 },
      },
      defaultProps: { height: 24 },
      render: ({ height }) => <div style={{ height: height ? `${height}px` : 24 }} aria-hidden />,
    },
    Divider: {
      label: "Divisor",
      fields: {
        thickness: { type: "number", label: "Grosor (px)", min: 1, max: 8 },
      },
      defaultProps: { thickness: 1 },
      render: ({ thickness }) => (
        <hr style={{ borderWidth: thickness ? `${thickness}px` : 1, margin: "8px 0" }} />
      ),
    },
    // —— Intermedio ——
    Container: {
      label: "Contenedor",
      fields: {
        maxWidth: { type: "number", label: "Ancho máx (px)", min: 320, max: 1400 },
        paddingX: { type: "number", label: "Padding horizontal (px)", min: 0, max: 80 },
        paddingY: { type: "number", label: "Padding vertical (px)", min: 0, max: 80 },
        content: { type: "slot", label: "Contenido" },
      },
      defaultProps: { maxWidth: 1200, paddingX: 24, paddingY: 24, content: [] },
      render: ({ maxWidth, paddingX, paddingY, content: Content }) => (
        <div
          style={{
            maxWidth: maxWidth ? `${maxWidth}px` : undefined,
            paddingLeft: paddingX ? `${paddingX}px` : undefined,
            paddingRight: paddingX ? `${paddingX}px` : undefined,
            paddingTop: paddingY ? `${paddingY}px` : undefined,
            paddingBottom: paddingY ? `${paddingY}px` : undefined,
            margin: "0 auto",
          }}
        >
          {Content && <Content />}
        </div>
      ),
    },
    Flex: {
      label: "Flex",
      fields: {
        direction: {
          type: "select",
          label: "Dirección",
          options: [
            { label: "Fila", value: "row" },
            { label: "Columna", value: "column" },
          ],
        },
        gap: { type: "number", label: "Gap (px)", min: 0, max: 80 },
        align: {
          type: "select",
          label: "Alineación",
          options: [
            { label: "Inicio", value: "start" },
            { label: "Centro", value: "center" },
            { label: "Fin", value: "end" },
          ],
        },
        justify: {
          type: "select",
          label: "Justificar",
          options: [
            { label: "Inicio", value: "start" },
            { label: "Centro", value: "center" },
            { label: "Fin", value: "end" },
            { label: "Entre", value: "between" },
          ],
        },
        content: { type: "slot", label: "Contenido" },
      },
      defaultProps: { direction: "column", gap: 16, align: "start", justify: "start", content: [] },
      render: ({ direction, gap, align, justify, content: Content }) => (
        <div
          style={{
            display: "flex",
            flexDirection: direction || "column",
            gap: gap ? `${gap}px` : 16,
            alignItems: align === "start" ? "flex-start" : align === "end" ? "flex-end" : "center",
            justifyContent:
              justify === "start"
                ? "flex-start"
                : justify === "end"
                  ? "flex-end"
                  : justify === "between"
                    ? "space-between"
                    : "center",
          }}
        >
          {Content && <Content />}
        </div>
      ),
    },
    Grid: {
      label: "Grid",
      fields: {
        columns: { type: "number", label: "Columnas", min: 1, max: 12 },
        gap: { type: "number", label: "Gap (px)", min: 0, max: 48 },
        rowGap: { type: "number", label: "Row gap (px)", min: 0, max: 48 },
        content: { type: "slot", label: "Contenido" },
      },
      defaultProps: { columns: 3, gap: 16, rowGap: 16, content: [] },
      render: ({ columns, gap, rowGap, content: Content }) => (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns || 3}, 1fr)`,
            gap: gap ? `${gap}px` : 16,
            rowGap: rowGap ? `${rowGap}px` : 16,
          }}
        >
          {Content && <Content />}
        </div>
      ),
    },
    Card: {
      label: "Tarjeta",
      fields: {
        imageUrl: createImageUploadField(),
        title: { type: "text", label: "Título" },
        description: { type: "textarea", label: "Descripción" },
        linkUrl: { type: "text", label: "Enlace" },
        linkText: { type: "text", label: "Texto del enlace" },
      },
      defaultProps: { imageUrl: "", title: "", description: "", linkUrl: "", linkText: "Ver más" },
      render: ({ imageUrl, title, description, linkUrl, linkText }) => (
        <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          {imageUrl && (
            <img src={getImageUrl(imageUrl)} alt={title || ""} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 4 }} />
          )}
          {title && <h3 style={{ marginTop: 8 }}>{title}</h3>}
          {description && <p style={{ marginTop: 4, fontSize: 14 }}>{description}</p>}
          {linkUrl && (
            <a href={linkUrl} style={{ display: "inline-block", marginTop: 8 }}>
              {linkText || "Ver más"}
            </a>
          )}
        </div>
      ),
    },
    Section: {
      label: "Sección",
      fields: {
        id: { type: "text", label: "ID (ancla)" },
        title: { type: "text", label: "Título" },
        content: { type: "slot", label: "Contenido" },
      },
      defaultProps: { id: "", title: "", content: [] },
      render: ({ id, title, content: Content }) => (
        <section id={id || undefined}>
          {title && <h2 style={{ marginBottom: 16 }}>{title}</h2>}
          {Content && <Content />}
        </section>
      ),
    },
    Columns: {
      label: "Columnas",
      fields: {
        count: {
          type: "select",
          label: "Columnas",
          options: [
            { label: "2", value: "2" },
            { label: "3", value: "3" },
            { label: "4", value: "4" },
          ],
        },
        gap: { type: "number", label: "Gap (px)", min: 0, max: 48 },
        content: { type: "slot", label: "Contenido" },
      },
      defaultProps: { count: "2", gap: 24, content: [] },
      render: ({ count, gap, content: Content }) => (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Number(count) || 2}, 1fr)`,
            gap: gap ? `${gap}px` : 24,
          }}
        >
          {Content && <Content />}
        </div>
      ),
    },
    Carousel: {
      label: "Carrusel",
      fields: {
        autoplay: { type: "radio", label: "Autoplay", options: [{ label: "Sí", value: true }, { label: "No", value: false }] },
        interval: { type: "number", label: "Intervalo (ms)", min: 1000, max: 15000 },
        content: { type: "slot", label: "Contenido" },
      },
      defaultProps: { autoplay: false, interval: 5000, content: [] },
      render: ({ content: Content }) => (
        <div style={{ overflow: "auto", display: "flex", gap: 16 }}>
          {Content && <Content />}
        </div>
      ),
    },
    // —— Avanzado ——
    Background: {
      label: "Fondo",
      fields: {
        imageUrl: createImageUploadField(),
        mobileImageUrl: { type: "custom" as const, label: "Imagen móvil", render: () => <span className="text-muted-foreground text-sm">Opcional</span> },
        videoUrl: { type: "text", label: "Video (URL YouTube/Vimeo)" },
        content: { type: "slot", label: "Contenido" },
      },
      defaultProps: { imageUrl: "", mobileImageUrl: "", videoUrl: "", content: [] },
      render: ({ imageUrl, videoUrl, content: Content }) => (
        <div style={{ position: "relative", minHeight: 200 }}>
          {videoUrl ? (
            <div style={{ position: "absolute", inset: 0, background: "#111" }}>
              <span style={{ color: "#999" }}>Video: {videoUrl}</span>
            </div>
          ) : imageUrl ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${getImageUrl(imageUrl)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "#eee" }} />
          )}
          <div style={{ position: "relative", zIndex: 1, padding: 24 }}>
            {Content && <Content />}
          </div>
        </div>
      ),
    },
    ProductCollection: {
      label: "Colección de productos",
      fields: {
        collectionId: { type: "text", label: "ID de colección" },
      },
      defaultProps: { collectionId: "" },
      render: ({ collectionId }) => (
        <div style={{ padding: 16, border: "1px dashed #999" }}>
          Productos (collectionId: {collectionId || "—"})
        </div>
      ),
    },
    BlogList: {
      label: "Lista de blog",
      fields: {
        limit: { type: "number", label: "Límite", min: 1, max: 20 },
        type: { type: "text", label: "Tipo (opcional)" },
      },
      defaultProps: { limit: 5, type: "" },
      render: ({ limit, type }) => (
        <div style={{ padding: 16, border: "1px dashed #999" }}>
          Blog (limit: {limit ?? 5}
          {type ? `, type: ${type}` : ""})
        </div>
      ),
    },
  },
  categories: {
    basico: {
      title: "Básico",
      components: ["Heading", "Text", "Image", "Button", "Link", "Spacer", "Divider"],
    },
    intermedio: {
      title: "Intermedio",
      components: ["Container", "Flex", "Grid", "Card", "Section", "Columns", "Carousel"],
    },
    avanzado: {
      title: "Avanzado",
      components: ["Background", "ProductCollection", "BlogList"],
    },
  },
}

export default config
