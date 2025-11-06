"use client"

import type React from "react"

import { useImageUpload, type UploadOptions } from "@/hooks/use-image-upload"
import { ImageIcon, X, Upload, Camera, FileImage, Plus, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useRef } from "react"
import Image from "next/image"

type UploadVariant = "default" | "minimal" | "gradient" | "rounded" | "compact" | "card" | "button" | "modern"

interface ImageUploadZoneProps {
  onImageUploaded?: (fileUrl: string, file: File) => void
  onError?: (error: string) => void
  currentImage?: string
  onRemoveImage?: () => void
  maxFileSize?: number
  allowedTypes?: string[]
  className?: string
  placeholder?: string
  showProgress?: boolean
  variant?: UploadVariant
}

export function ImageUploadZone({
  onImageUploaded,
  onError,
  currentImage,
  onRemoveImage,
  maxFileSize = 10,
  allowedTypes,
  className,
  placeholder = "Arrastra una imagen aquí o haz clic para seleccionar",
  showProgress = true,
  variant = "default",
}: ImageUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadOptions: UploadOptions = {
    onSuccess: onImageUploaded,
    onError,
    maxFileSize,
    allowedTypes,
  }

  const { uploadSingleImage, isUploading, uploadProgress } = useImageUpload(uploadOptions)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files[0]) {
      uploadSingleImage(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadSingleImage(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // Configuraciones de variantes mejoradas
  const variantConfigs = {
    default: {
      container: "border-2 border-dashed rounded-xl transition-all duration-300 hover:shadow-lg",
      dragOver: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 shadow-lg scale-[1.02]",
      normal:
        "border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-900/50",
      content: "p-8",
      icon: ImageIcon,
      iconSize: "h-12 w-12",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    minimal: {
      container: "border border-dashed rounded-lg transition-all duration-200 hover:shadow-md",
      dragOver: "border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-md",
      normal: "border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-900/30",
      content: "p-6",
      icon: Upload,
      iconSize: "h-8 w-8",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    gradient: {
      container:
        "border-2 border-dashed rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-orange-950/30 transition-all duration-300 hover:shadow-xl",
      dragOver:
        "border-purple-500 from-purple-100 via-pink-100 to-orange-100 dark:from-purple-900/50 dark:via-pink-900/50 dark:to-orange-900/50 shadow-xl scale-[1.02]",
      normal: "border-purple-200 dark:border-purple-800 hover:border-purple-400",
      content: "p-10",
      icon: Sparkles,
      iconSize: "h-16 w-16",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    rounded: {
      container: "border-2 border-dashed rounded-full aspect-square transition-all duration-300 hover:shadow-lg",
      dragOver: "border-teal-500 bg-teal-50 dark:bg-teal-950/20 shadow-lg scale-105",
      normal: "border-gray-300 dark:border-gray-600 hover:border-teal-400 hover:bg-gray-50 dark:hover:bg-gray-900/50",
      content: "p-8",
      icon: Camera,
      iconSize: "h-10 w-10",
      iconColor: "text-teal-600 dark:text-teal-400",
    },
    compact: {
      container: "border border-dashed rounded-lg transition-all duration-200 hover:shadow-sm",
      dragOver: "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 shadow-sm",
      normal: "border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-900/30",
      content: "p-4",
      icon: FileImage,
      iconSize: "h-6 w-6",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    card: {
      container:
        "border border-solid rounded-2xl shadow-sm bg-white dark:bg-gray-900 transition-all duration-300 hover:shadow-lg",
      dragOver: "border-rose-500 shadow-lg bg-rose-50 dark:bg-rose-950/20 scale-[1.02]",
      normal: "border-gray-200 dark:border-gray-700 hover:border-rose-400 hover:shadow-md",
      content: "p-8",
      icon: Plus,
      iconSize: "h-12 w-12",
      iconColor: "text-rose-600 dark:text-rose-400",
    },
    button: {
      container:
        "border-2 border-dashed rounded-xl bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-300 hover:shadow-md",
      dragOver: "border-amber-500 from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 shadow-md",
      normal:
        "border-gray-300 dark:border-gray-600 hover:border-amber-400 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-800 dark:hover:to-gray-700",
      content: "p-6",
      icon: Zap,
      iconSize: "h-8 w-8",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    modern: {
      container:
        "border border-solid rounded-3xl bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl",
      dragOver:
        "border-cyan-500 from-cyan-50 via-white to-cyan-50 dark:from-cyan-950/30 dark:via-slate-800 dark:to-cyan-950/30 shadow-xl scale-[1.01]",
      normal: "border-slate-200 dark:border-slate-700 hover:border-cyan-400 hover:shadow-lg",
      content: "p-10",
      icon: ImageIcon,
      iconSize: "h-14 w-14",
      iconColor: "text-cyan-600 dark:text-cyan-400",
    },
  }

  const config = variantConfigs[variant]
  const IconComponent = config.icon

  // Estilos específicos para cada variante mejorados
  const getVariantSpecificContent = () => {
    switch (variant) {
      case "minimal":
        return (
          <div className="flex items-center gap-4 text-center cursor-pointer">
            <div className="flex-shrink-0 p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <IconComponent className={cn(config.iconSize, config.iconColor)} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{placeholder}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Máximo {maxFileSize}MB • JPG, PNG, WebP</p>
            </div>
          </div>
        )

      case "gradient":
        return (
          <div className="flex flex-col items-center justify-center text-center cursor-pointer">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative p-6 rounded-full bg-white/80 dark:bg-black/20 backdrop-blur-sm border border-white/50 dark:border-gray-700/50">
                <IconComponent className={cn(config.iconSize, config.iconColor)} />
              </div>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-3">
              Subir Imagen
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">{placeholder}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Máximo {maxFileSize}MB • Formatos: JPG, PNG, WebP, GIF
            </p>
          </div>
        )

      case "rounded":
        return (
          <div className="flex flex-col items-center justify-center text-center cursor-pointer h-full">
            <div className="p-4 rounded-full bg-teal-100 dark:bg-teal-900/30 mb-3">
              <IconComponent className={cn(config.iconSize, config.iconColor)} />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Subir</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">imagen</p>
          </div>
        )

      case "compact":
        return (
          <div className="flex items-center gap-3 text-center cursor-pointer">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <IconComponent className={cn(config.iconSize, config.iconColor)} />
            </div>
            <div className="text-left">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Subir imagen</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Máx. {maxFileSize}MB</p>
            </div>
          </div>
        )

      case "card":
        return (
          <div className="flex flex-col items-center justify-center text-center cursor-pointer">
            <div className="relative mb-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 border border-rose-200 dark:border-rose-800">
                <IconComponent className={cn(config.iconSize, config.iconColor)} />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                <Plus className="w-3 h-3 text-white" />
              </div>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Añadir imagen</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{placeholder}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Máximo {maxFileSize}MB</p>
          </div>
        )

      case "button":
        return (
          <div className="flex items-center justify-center gap-3 text-center cursor-pointer">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-800">
              <IconComponent className={cn(config.iconSize, config.iconColor)} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Seleccionar archivo</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">o arrastra aquí • {maxFileSize}MB máx.</p>
            </div>
          </div>
        )

      case "modern":
        return (
          <div className="flex flex-col items-center justify-center text-center cursor-pointer">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative p-5 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-600 shadow-lg">
                <IconComponent className={cn(config.iconSize, config.iconColor)} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{placeholder}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">JPG</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">PNG</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">WebP</span>
              <span className="text-gray-400">•</span>
              <span>Máx. {maxFileSize}MB</span>
            </div>
          </div>
        )

      default:
        return (
          <div className="flex flex-col items-center justify-center text-center cursor-pointer">
            <div className="p-4 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 mb-4 border border-emerald-200 dark:border-emerald-800">
              <IconComponent className={cn(config.iconSize, config.iconColor)} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Subir imagen</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{placeholder}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Máximo {maxFileSize}MB • JPG, PNG, WebP, GIF</p>
          </div>
        )
    }
  }

  return (
    <div
      className={cn(
        "relative transition-all duration-300",
        config.container,
        isDragOver ? config.dragOver : config.normal,
        isUploading && "pointer-events-none opacity-60",
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {currentImage ? (
        <div className={cn("relative p-6", variant === "rounded" ? "aspect-square" : "aspect-video")}>
          <Image
            src={currentImage || "/placeholder.svg"}
            alt="Uploaded image"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn("object-contain p-2", variant === "rounded" ? "rounded-full" : "rounded-xl")}
            crossOrigin="anonymous"
          />
          {onRemoveImage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemoveImage()
              }}
              className={cn(
                "absolute top-3 right-3 bg-red-500 text-white p-2 hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl",
                variant === "rounded" ? "rounded-full" : "rounded-lg",
              )}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div className={config.content}>{getVariantSpecificContent()}</div>
      )}

      {isUploading && showProgress && (
        <div
          className={cn(
            "absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm flex items-center justify-center",
            variant === "rounded" ? "rounded-full" : "rounded-xl",
          )}
        >
          <div className="text-center">
            <div className="w-40 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 rounded-full shadow-sm"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Subiendo... {uploadProgress}%</p>
          </div>
        </div>
      )}
    </div>
  )
}
