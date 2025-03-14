"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { HeroSectionStyles } from "@/types/heroSection"

interface HeroSectionPreviewProps {
  title: string
  subtitle?: string
  buttonText?: string
  buttonLink?: string
  backgroundImage?: string
  mobileBackgroundImage?: string
  styles?: Record<string, any>
  deviceType?: "mobile" | "tablet" | "desktop"
}

export function HeroSectionPreview({
  title,
  subtitle,
  buttonText,
  buttonLink,
  backgroundImage,
  mobileBackgroundImage,
  styles = {},
  deviceType = "desktop",
}: HeroSectionPreviewProps) {
  // Default styles with Tailwind classes
  const defaultStyles: HeroSectionStyles = {
    titleColor: "text-gray-900",
    subtitleColor: "text-gray-600",
    textAlign: "text-left",
    verticalAlign: "items-center", // Ya está en centro por defecto
    overlayColor: "bg-white/0",
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
  }

  // Determine which background image to use based on device type
  let bgImage = backgroundImage
  if (deviceType === "mobile" && mobileBackgroundImage) {
    bgImage = mobileBackgroundImage
  } else if (deviceType === "tablet") {
    bgImage = backgroundImage // Tablet usa la misma imagen que desktop
  }

  const bgStyle = bgImage ? { backgroundImage: `url(${bgImage})` } : {}

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

  // Check if we have any content to display
  const hasContent = title || subtitle || (buttonText && buttonLink)

  // Escalar la altura personalizada para la previsualización
  let heightStyle = {}
  if (height !== "min-h-screen" && height.includes("min-h-[") && height.includes("px]")) {
    // Extraer el valor numérico de la altura
    const heightValue = Number.parseInt(height.replace("min-h-[", "").replace("px]", ""))

    // Calcular el factor de escala según el dispositivo
    let scaleFactor = 1
    if (deviceType === "mobile") {
      scaleFactor = 667 / 1000 // Escala para móvil (667px es la altura de previsualización)
    } else if (deviceType === "tablet") {
      scaleFactor = 768 / 1000 // Escala para tablet (768px es la altura de previsualización)
    } else {
      scaleFactor = 640 / 1000 // Escala para desktop (640px es la altura de previsualización)
    }

    // Aplicar la escala
    const scaledHeight = Math.round(heightValue * scaleFactor)
    heightStyle = { minHeight: `${scaledHeight}px` }
  }

  // Reemplaza el return con este código que mantiene la altura personalizada y restaura la alineación vertical
  return (
    <div className="w-full relative" style={height !== "min-h-screen" ? heightStyle : { height: "100%" }}>
      {/* Background */}
      <div
        className={cn("absolute inset-0 bg-no-repeat", mergedStyles.backgroundPosition, mergedStyles.backgroundSize)}
        style={bgStyle}
      >
        {/* Overlay to ensure text readability */}
        <div className={cn("absolute inset-0", mergedStyles.overlayColor)}></div>
      </div>

      {/* Fallback background if no images */}
      {!bgImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"></div>
      )}

      {/* Content container with vertical alignment - only render if there's content */}
      {hasContent && (
        <div className={cn(
          "relative w-full flex flex-col z-10", 
          verticalAlignClass,
          // Asegura que el contenedor interno tenga la altura completa
          height !== "min-h-screen" ? "absolute inset-0" : "h-full"
        )}>
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
                <div className={mergedStyles.animation} style={{ animationDelay: "0.1s" }}>
                  <Link href={buttonLink}>
                    <Button variant={mergedStyles.buttonVariant} size={mergedStyles.buttonSize}>
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

