"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from "next/image"

// Define proper types for the hero section styles
interface HeroSectionStyles {
  titleColor: string
  subtitleColor: string
  textAlign: string
  verticalAlign: string
  overlayType: "none" | "color" | "gradient"
  overlayColor: string
  overlayOpacity?: number
  overlayGradient: {
    colorStart: string
    colorEnd: string
    angle: number
  }
  overlayGradientStartOpacity?: number
  overlayGradientEndOpacity?: number
  buttonVariant: string
  buttonSize: string
  contentWidth: {
    mobile: string
    tablet: string
    desktop: string
  }
  contentPadding: {
    mobile: string
    tablet: string
    desktop: string
  }
  height: {
    mobile: string
    tablet: string
    desktop: string
  }
  titleSize: {
    mobile: string
    tablet: string
    desktop: string
  }
  subtitleSize: {
    mobile: string
    tablet: string
    desktop: string
  }
  textShadow: string
  animation: string
  backgroundPosition: string
  backgroundSize: string
  [key: string]: any // Add index signature to allow string indexing
}

interface HeroSectionPreviewProps {
  title: string
  subtitle?: string
  buttonText?: string
  buttonLink?: string
  backgroundImage?: string
  mobileBackgroundImage?: string
  backgroundVideo?: string
  mobileBackgroundVideo?: string
  styles?: Partial<HeroSectionStyles> | Record<string, any>
  deviceType: "mobile" | "tablet" | "desktop"
}

export function HeroSectionPreview({
  title,
  subtitle,
  buttonText,
  buttonLink,
  backgroundImage,
  mobileBackgroundImage,
  backgroundVideo,
  mobileBackgroundVideo,
  styles = {},
  deviceType = "desktop",
}: HeroSectionPreviewProps) {
  // Actualizar el defaultStyles para incluir las propiedades de overlay correctamente
  const defaultStyles: HeroSectionStyles = {
    titleColor: "text-gray-900",
    subtitleColor: "text-gray-600",
    textAlign: "text-left",
    verticalAlign: "items-center",
    overlayColor: "rgba(0,0,0,0.4)",
    overlayType: "color",
    overlayOpacity: 0.4,
    overlayGradient: {
      colorStart: "rgba(0,0,0,0.4)",
      colorEnd: "rgba(0,0,0,0)",
      angle: 90,
    },
    overlayGradientStartOpacity: 0.4,
    overlayGradientEndOpacity: 0,
    buttonVariant: "default",
    buttonSize: "default",
    contentWidth: {
      mobile: "max-w-full",
      tablet: "max-w-2xl",
      desktop: "max-w-3xl",
    },
    contentPadding: {
      mobile: "py-8 px-4",
      tablet: "py-12 px-6",
      desktop: "py-16 px-8",
    },
    height: {
      mobile: "min-h-screen",
      tablet: "min-h-screen",
      desktop: "min-h-screen",
    },
    titleSize: {
      mobile: "text-[1.5em]",
      tablet: "text-[2em]",
      desktop: "text-[2.5em]",
    },
    subtitleSize: {
      mobile: "text-[0.875em]",
      tablet: "text-[1em]",
      desktop: "text-[1.125em]",
    },
    textShadow: "none",
    animation: "none",
    backgroundPosition: "bg-center",
    backgroundSize: "bg-cover",
  }

  // Merge default styles with provided styles
  const mergedStyles = {
    ...defaultStyles,
    ...styles,
    contentWidth: {
      ...defaultStyles.contentWidth,
      ...(styles.contentWidth || {}),
    },
    contentPadding: {
      ...defaultStyles.contentPadding,
      ...(styles.contentPadding || {}),
    },
    height: {
      ...defaultStyles.height,
      ...(styles.height || {}),
    },
    titleSize: {
      ...defaultStyles.titleSize,
      ...(styles.titleSize || {}),
    },
    subtitleSize: {
      ...defaultStyles.subtitleSize,
      ...(styles.subtitleSize || {}),
    },
    overlayGradient: {
      ...defaultStyles.overlayGradient,
      ...(styles.overlayGradient || {}),
    },
  }

  // Determine which background video/image to use based on device type
  let bgVideo = backgroundVideo
  let bgImage = backgroundImage
  if (deviceType === "mobile") {
    bgVideo = mobileBackgroundVideo || backgroundVideo
    bgImage = mobileBackgroundImage || backgroundImage
  }

  // Get the appropriate styles for the current device type
  const contentWidth = mergedStyles.contentWidth[deviceType]
  const contentPadding = mergedStyles.contentPadding[deviceType]
  const height = mergedStyles.height[deviceType]
  const titleSize = mergedStyles.titleSize[deviceType]
  const subtitleSize = mergedStyles.subtitleSize[deviceType]

  // Determine vertical alignment class
  let verticalAlignClass = "justify-center"
  if (mergedStyles.verticalAlign === "items-start") {
    verticalAlignClass = "justify-start"
  } else if (mergedStyles.verticalAlign === "items-end") {
    verticalAlignClass = "justify-end"
  }

  // Actualizar la función getOverlayOptions para manejar correctamente los valores de degradado
  const getOverlayOptions = () => {
    // Si no hay tipo de overlay o es "none", no mostrar overlay
    if (!mergedStyles.overlayType || mergedStyles.overlayType === "none") {
      return { type: "none" as const }
    }

    // Si es un degradado y tenemos la configuración
    if (mergedStyles.overlayType === "gradient" && mergedStyles.overlayGradient) {
      return {
        type: "gradient" as const,
        gradient: {
          colorStart: mergedStyles.overlayGradient.colorStart || "rgba(0,0,0,0.4)",
          colorEnd: mergedStyles.overlayGradient.colorEnd || "rgba(0,0,0,0)",
          angle: mergedStyles.overlayGradient.angle || 90,
        },
      }
    }

    // Si es un color simple
    return {
      type: "color" as const,
      color: mergedStyles.overlayColor || "rgba(0,0,0,0.4)",
    }
  }

  // Check if we have any content to display
  const hasContent = title || subtitle || (buttonText && buttonLink)

  // Escalar la altura personalizada para la previsualización
  let heightStyle = {}
  if (height !== "min-h-screen" && height.includes("min-h-[") && height.includes("px]")) {
    const heightValue = Number.parseInt(height.replace("min-h-[", "").replace("px]", ""))
    let scaleFactor = 1
    if (deviceType === "mobile") {
      scaleFactor = 667 / 1000
    } else if (deviceType === "tablet") {
      scaleFactor = 768 / 1000
    } else {
      scaleFactor = 640 / 1000
    }
    const scaledHeight = Math.round(heightValue * scaleFactor)
    heightStyle = { minHeight: `${scaledHeight}px` }
  }

  // Renderizar video de fondo si está disponible
  const renderBackgroundVideo = () => {
    if (!bgVideo) return null

    // Extraer el ID del video de YouTube si es una URL de YouTube
    const getYouTubeID = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
      const match = url.match(regExp)
      return match && match[2].length === 11 ? match[2] : null
    }

    const videoId = getYouTubeID(bgVideo)

    if (!videoId) return null

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="absolute w-[300%] h-[300%] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{ border: "none" }}
        />
      </div>
    )
  }

  return (
    <div className="w-full relative" style={height !== "min-h-screen" ? heightStyle : { height: "100%" }}>
      {/* Background Video or Image */}
      {bgVideo ? (
        <>
          {renderBackgroundVideo()}
          {/* Overlay para videos */}
          {mergedStyles.overlayType === "none" ? null : mergedStyles.overlayType === "gradient" &&
            mergedStyles.overlayGradient ? (
            <div
              className="absolute inset-0 z-10"
              style={{
                background: `linear-gradient(${mergedStyles.overlayGradient.angle}deg, ${mergedStyles.overlayGradient.colorStart}, ${mergedStyles.overlayGradient.colorEnd})`,
              }}
            />
          ) : (
            <div className="absolute inset-0 z-10" style={{ backgroundColor: mergedStyles.overlayColor }} />
          )}
        </>
      ) : bgImage ? (
        <>
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={bgImage || "/placeholder.svg"}
              alt="Background"
              fill
              className={cn(
                "object-cover",
                mergedStyles.backgroundPosition.replace("bg-", "object-"),
                mergedStyles.backgroundSize.replace("bg-", "object-"),
              )}
              priority
            />
          </div>
          {/* Overlay para imágenes */}
          {mergedStyles.overlayType === "none" ? null : mergedStyles.overlayType === "gradient" &&
            mergedStyles.overlayGradient ? (
            <div
              className="absolute inset-0 z-10"
              style={{
                background: `linear-gradient(${mergedStyles.overlayGradient.angle}deg, ${mergedStyles.overlayGradient.colorStart}, ${mergedStyles.overlayGradient.colorEnd})`,
              }}
            />
          ) : (
            <div className="absolute inset-0 z-10" style={{ backgroundColor: mergedStyles.overlayColor }} />
          )}
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900" />
          {/* No necesitamos overlay adicional para el fondo por defecto */}
        </>
      )}

      {/* Content container with vertical alignment - only render if there's content */}
      {hasContent && (
        <div className={cn("relative w-full h-full flex flex-col", verticalAlignClass, "z-20")}>
          <div className={cn("container mx-auto", contentPadding)}>
            <div
              className={cn(contentWidth, mergedStyles.textAlign, "w-full", {
                "mx-auto": mergedStyles.textAlign === "text-center",
                "ml-auto": mergedStyles.textAlign === "text-right",
              })}
            >
              {title && (
                <h1
                  className={cn(
                    "font-bold tracking-tight mb-4",
                    titleSize,
                    mergedStyles.titleColor,
                    mergedStyles.textShadow,
                    mergedStyles.animation,
                  )}
                  style={{ fontSize: titleSize.replace("text-[", "").replace("]", "") }}
                >
                  {title}
                </h1>
              )}

              {subtitle && (
                <p
                  className={cn(
                    "mb-6",
                    subtitleSize,
                    mergedStyles.subtitleColor,
                    mergedStyles.textShadow,
                    mergedStyles.animation,
                  )}
                  style={{ fontSize: subtitleSize.replace("text-[", "").replace("]", "") }}
                >
                  {subtitle}
                </p>
              )}

              {buttonText && buttonLink && (
                <div className={mergedStyles.animation}>
                  <Link href={buttonLink}>
                    <Button variant={mergedStyles.buttonVariant as any} size={mergedStyles.buttonSize as any}>
                      {buttonText}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
