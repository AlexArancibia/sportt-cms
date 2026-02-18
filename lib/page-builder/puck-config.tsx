"use client"

import React from "react"
import { Loader2 } from "lucide-react"
import type { Config } from "@puckeditor/core"
import { getImageUrl } from "@/lib/imageUtils"
import { uploadImageToR2 } from "@/lib/imageUpload"
import { useAuthStore } from "@/stores/authStore"
import { useShopSettings } from "@/hooks/useShopSettings"

type TextColorMode = "auto" | "light" | "dark"

type HeroTextContextValue = {
  isInsideHero: boolean
  heroAutoColor: "light" | "dark"
}

const HeroTextColorContext = React.createContext<HeroTextContextValue>({
  isInsideHero: false,
  heroAutoColor: "dark",
})

function useHeroTextContext() {
  return React.useContext(HeroTextColorContext)
}

function resolveTextColor(mode: TextColorMode | undefined, ctx: HeroTextContextValue): string {
  if (mode === "light") return "#ffffff"
  if (mode === "dark") return "#000000"

  if (!ctx.isInsideHero) return "#000000"

  return ctx.heroAutoColor === "light" ? "#ffffff" : "#000000"
}

const textColorField = {
  type: "select" as const,
  label: "Color de texto",
  options: [
    { label: "Automático", value: "auto" },
    { label: "Negro", value: "dark" },
    { label: "Blanco", value: "light" },
  ],
}

function computeHeroAutoColorFromImage(img: HTMLImageElement): "light" | "dark" {
  const canvas = document.createElement("canvas")
  canvas.width = 16
  canvas.height = 16
  const ctx = canvas.getContext("2d")
  if (!ctx) return "dark"

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    sum += 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const avg = sum / (data.length / 4)
  return avg > 160 ? "dark" : "light"
}

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

type HeroSectionProps = {
  src?: string
  alt?: string
  href?: string
  objectFit?: "cover" | "contain"
  content?: React.ComponentType
}

function HeroSectionComponent({ src, alt, href, objectFit, content: Content }: HeroSectionProps) {
  const [heroAutoColor, setHeroAutoColor] = React.useState<"light" | "dark">("dark")

  React.useEffect(() => {
    if (!src || src.trim() === "") {
      setHeroAutoColor("dark")
      return
    }

    if (typeof window === "undefined") return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = getImageUrl(src)

    img.onload = () => {
      try {
        setHeroAutoColor(computeHeroAutoColorFromImage(img))
      } catch {
        setHeroAutoColor("dark")
      }
    }

    img.onerror = () => {
      setHeroAutoColor("dark")
    }
  }, [src])

  const hasImage = typeof src === "string" && src.trim() !== ""
  const fit = (objectFit as React.CSSProperties["objectFit"]) || "cover"

  const bg = hasImage ? (
    <img src={getImageUrl(src)} alt={alt || ""} style={{ width: "100%", height: "auto", objectFit: fit, display: "block" }} />
  ) : (
    <div style={{ background: "#eee", minHeight: 200 }} />
  )

  return (
    <HeroTextColorContext.Provider
      value={{
        isInsideHero: true,
        heroAutoColor: hasImage ? heroAutoColor : "dark",
      }}
    >
      <div style={{ position: "relative", width: "100%", overflow: "hidden", minHeight: "320px" }}>
        {href ? <a href={href}>{bg}</a> : bg}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "flex-start", height: "100%" }}>
          {Content && (
            <div style={{ alignSelf: "center", width: "100%", flexShrink: 0 }}>
              <Content />
            </div>
          )}
        </div>
      </div>
    </HeroTextColorContext.Provider>
  )
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
        textColorMode: textColorField,
      },
      defaultProps: {
        text: "Título",
        level: "h1",
        fontSize: 32,
        lineHeight: 40,
        textColorMode: "auto",
      },
      render: ({ text, level: Level, fontSize, lineHeight, textColorMode }) => {
        const Tag = (Level || "h1") as keyof React.JSX.IntrinsicElements
        return (
          <HeroTextColorContext.Consumer>
            {(ctx) => {
              const color = resolveTextColor(textColorMode, ctx)
              return (
                <Tag
                  style={{
                    fontSize: fontSize ? `${fontSize}px` : undefined,
                    lineHeight: lineHeight ? `${lineHeight}px` : undefined,
                    color,
                  }}
                >
                  {text || ""}
                </Tag>
              )
            }}
          </HeroTextColorContext.Consumer>
        )
      },
    },
    Text: {
      label: "Texto",
      fields: {
        content: { type: "textarea", label: "Contenido" },
        fontSize: { type: "number", label: "Tamaño (px)", min: 10, max: 24 },
        textColorMode: textColorField,
      },
      defaultProps: { content: "Escribe aquí tu texto.", fontSize: 16, textColorMode: "auto" },
      render: ({ content, fontSize, textColorMode }) => {
        return (
          <HeroTextColorContext.Consumer>
            {(ctx) => {
              const color = resolveTextColor(textColorMode, ctx)
              return (
                <p style={{ fontSize: fontSize ? `${fontSize}px` : undefined, color }}>
                  {content || "Escribe aquí tu texto."}
                </p>
              )
            }}
          </HeroTextColorContext.Consumer>
        )
      },
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
        textColorMode: textColorField,
      },
      defaultProps: { label: "Ver más", href: "#", target: "_self", textColorMode: "auto" },
      render: ({ label, href, target, textColorMode }) => {
        return (
          <HeroTextColorContext.Consumer>
            {(ctx) => {
              const color = resolveTextColor(textColorMode, ctx)
              return (
                <a
                  href={href || "#"}
                  target={target || "_self"}
                  rel={target === "_blank" ? "noopener noreferrer" : undefined}
                  style={{ color }}
                >
                  {label || "Botón"}
                </a>
              )
            }}
          </HeroTextColorContext.Consumer>
        )
      },
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
        textColorMode: textColorField,
      },
      defaultProps: { text: "Enlace", href: "#", target: "_self", textColorMode: "auto" },
      render: ({ text, href, target, textColorMode }) => {
        return (
          <HeroTextColorContext.Consumer>
            {(ctx) => {
              const color = resolveTextColor(textColorMode, ctx)
              return (
                <a
                  href={href || "#"}
                  target={target || "_self"}
                  rel={target === "_blank" ? "noopener noreferrer" : undefined}
                  style={{ color }}
                >
                  {text || "Enlace"}
                </a>
              )
            }}
          </HeroTextColorContext.Consumer>
        )
      },
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
        backgroundImage: createImageUploadField(),
        backgroundSize: {
          type: "select",
          label: "Ajuste imagen de fondo",
          options: [
            { label: "Completa (mostrar toda)", value: "contain" },
            { label: "Cubrir (puede recortar)", value: "cover" },
          ],
        },
        content: { type: "slot", label: "Contenido" },
      },
      defaultProps: { maxWidth: 1200, paddingX: 24, paddingY: 24, backgroundImage: "", backgroundSize: "contain", content: [] },
      render: ({ maxWidth, paddingX, paddingY, backgroundImage, backgroundSize, content: Content }) => {
        const containerStyle: React.CSSProperties = {
          maxWidth: maxWidth ? `${maxWidth}px` : undefined,
          paddingLeft: paddingX ? `${paddingX}px` : undefined,
          paddingRight: paddingX ? `${paddingX}px` : undefined,
          paddingTop: paddingY ? `${paddingY}px` : undefined,
          paddingBottom: paddingY ? `${paddingY}px` : undefined,
          margin: "0 auto",
          position: "relative",
        }
        const hasBgImage = backgroundImage && typeof backgroundImage === "string" && backgroundImage.trim() !== ""
        const bgImgUrl = hasBgImage ? getImageUrl(backgroundImage) : ""
        return (
          <div style={containerStyle}>
            {hasBgImage && bgImgUrl && (
              <img
                src={bgImgUrl}
                alt=""
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: (backgroundSize as React.CSSProperties["objectFit"]) || "contain",
                  objectPosition: "center",
                  zIndex: 0,
                }}
              />
            )}
            <div style={{ position: "relative", zIndex: 1, minHeight: hasBgImage ? 200 : undefined }}>
              {Content && <Content />}
            </div>
          </div>
        )
      },
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
      render: ({ direction, gap, align, justify, content: Content }) => {
        const dir = direction || "column"
        const gapPx = gap ? `${gap}px` : "16px"
        const alignItems = align === "start" ? "flex-start" : align === "end" ? "flex-end" : "center"
        const justifyContent =
          justify === "start" ? "flex-start" : justify === "end" ? "flex-end" : justify === "between" ? "space-between" : "center"
        const flexStyle = {
          display: "flex",
          flexDirection: dir,
          gap: gapPx,
          alignItems,
          justifyContent,
          "--pb-flex-gap": gapPx,
          "--pb-flex-align-items": alignItems,
          "--pb-flex-justify-content": justifyContent,
        } as React.CSSProperties
        return (
          <div data-page-builder-flex data-flex-direction={dir} style={flexStyle}>
            {Content && <Content />}
          </div>
        )
      },
    },
    Grid: {
      label: "Grid",
      fields: {
        columns: { type: "number", label: "Columnas", min: 1, max: 12 },
        columnGap: { type: "number", label: "Gap columnas (px)", min: 0, max: 48 },
        rowGap: { type: "number", label: "Gap filas (px)", min: 0, max: 48 },
        content: { type: "slot", label: "Contenido" },
      },
      defaultProps: { columns: 3, columnGap: 16, rowGap: 16, content: [] },
      render: ({ columns = 3, columnGap, rowGap, content: Content, ...rest }) => {
        const colGap = `${columnGap ?? (rest as { gap?: number }).gap ?? 16}px`
        const rGap = `${rowGap ?? 16}px`
        const gridStyle: React.CSSProperties = {
          display: "grid",
          gridTemplateColumns: "1fr",
          columnGap: colGap,
          rowGap: rGap,
          width: "100%",
          ["--pb-grid-columns" as string]: columns,
          ["--pb-grid-gap" as string]: colGap,
          ["--pb-grid-row-gap" as string]: rGap,
        }
        return (
          <div data-page-builder-grid style={gridStyle}>
            {Content && <Content />}
          </div>
        )
      },
    },
    Card: {
      label: "Tarjeta",
      fields: {
        imageUrl: createImageUploadField(),
        imageWidth: { type: "number", label: "Ancho (px)", min: 0, max: 1200 },
        imageHeight: { type: "number", label: "Alto (px)", min: 0, max: 800 },
        imageObjectFit: {
          type: "select",
          label: "Object fit",
          options: [
            { label: "Cover", value: "cover" },
            { label: "Contain", value: "contain" },
          ],
        },
        title: { type: "text", label: "Título" },
        description: { type: "textarea", label: "Descripción" },
        linkUrl: { type: "text", label: "Enlace" },
        linkText: { type: "text", label: "Texto del enlace" },
      },
      defaultProps: { imageUrl: "", imageWidth: 0, imageHeight: 160, imageObjectFit: "cover", title: "", description: "", linkUrl: "", linkText: "Ver más" },
      render: ({ imageUrl, imageWidth, imageHeight, imageObjectFit, title, description, linkUrl, linkText }) => {
        const fullHeight = !imageHeight
        const imgStyle = {
          width: imageWidth ? `${imageWidth}px` : "100%",
          height: fullHeight ? "100%" : `${imageHeight}px`,
          objectFit: imageObjectFit || "cover",
          borderRadius: 4,
          display: "block" as const,
        }
        const img = imageUrl && (
          fullHeight ? (
            <div style={{ flex: 1, minHeight: 120, overflow: "hidden", borderRadius: 4 }}>
              <img src={getImageUrl(imageUrl)} alt={title || ""} style={imgStyle} />
            </div>
          ) : (
            <img src={getImageUrl(imageUrl)} alt={title || ""} style={imgStyle} />
          )
        )
        return (
          <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, ...(fullHeight && { display: "flex", flexDirection: "column", height: "100%" }) }}>
            {img}
            {title && <h3 style={{ marginTop: 8 }}>{title}</h3>}
            {description && <p style={{ marginTop: 4, fontSize: 14 }}>{description}</p>}
            {linkUrl && (
              <a href={linkUrl} style={{ display: "inline-block", marginTop: 8 }}>
                {linkText || "Ver más"}
              </a>
            )}
          </div>
        )
      },
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
    HeroSection: {
      label: "Hero Section",
      fields: {
        src: createImageUploadField(),
        alt: { type: "text", label: "Alt" },
        href: { type: "text", label: "Enlace (opcional)" },
        objectFit: {
          type: "select",
          label: "Object fit",
          options: [
            { label: "Cover", value: "cover" },
            { label: "Contain", value: "contain" },
          ],
        },
        content: { type: "slot", label: "Contenido" },
      },
      defaultProps: { src: "", alt: "", href: "", objectFit: "cover", content: [] },
      render: (props) => <HeroSectionComponent {...(props as any)} />,
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
        column1: { type: "slot", label: "Columna 1" },
        column2: { type: "slot", label: "Columna 2" },
        column3: { type: "slot", label: "Columna 3" },
        column4: { type: "slot", label: "Columna 4" },
      },
      defaultProps: { count: "2", gap: 24, column1: [], column2: [], column3: [], column4: [] },
      render: ({ count, gap = 24, column1: C1, column2: C2, column3: C3, column4: C4 }) => {
        const n = Number(count) || 2
        const slots = [C1, C2, C3, C4].slice(0, n)
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${n}, 1fr)`,
              gap: `${gap}px`,
            }}
          >
            {slots.map((Slot, i) => (
              <div key={i}>{Slot && <Slot />}</div>
            ))}
          </div>
        )
      },
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
  },
  categories: {
    basico: {
      title: "Básico",
      components: ["Heading", "Text", "Image", "Button", "Link", "Spacer", "Divider"],
    },
    intermedio: {
      title: "Intermedio",
      components: ["Container", "Flex", "Grid", "Card", "Section", "HeroSection", "Columns", "Carousel"],
    },
  },
}

export default config
