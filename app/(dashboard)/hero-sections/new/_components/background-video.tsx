"use client"

import { useEffect, useRef, useState } from "react"
import YouTube from "react-youtube"
import type { YouTubeEvent, YouTubePlayer } from "react-youtube"

interface OverlayOptions {
  type: "none" | "color" | "gradient"
  color?: string
  gradient?: {
    colorStart: string
    colorEnd: string
    angle: number
  }
  opacity?: number
}

interface BackgroundVideoProps {
  videoUrl: string
  fallbackImage?: string
  className?: string
  overlay?: OverlayOptions
}

export function BackgroundVideo({
  videoUrl,
  fallbackImage,
  className,
  overlay = { type: "none", opacity: 0.4 },
}: BackgroundVideoProps) {
  const [isReady, setIsReady] = useState(false)
  const [videoId, setVideoId] = useState<string>("")
  const playerRef = useRef<YouTubePlayer>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Extract video ID from YouTube URL
    const extractVideoId = (url: string): string => {
      if (!url) return ""

      // Patrones comunes de URLs de YouTube
      const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/i,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/i,
        /^([a-zA-Z0-9_-]{11})$/, // ID directo
      ]

      for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match && match[1]) {
          return match[1]
        }
      }

      return ""
    }

    setVideoId(extractVideoId(videoUrl))
  }, [videoUrl])

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target
    // Asegurarnos de que el video está silenciado y se reproduce automáticamente
    event.target.mute()
    event.target.playVideo()

    // Establecer isReady después de un pequeño retraso
    setTimeout(() => {
      console.log("Video playback started")
      setIsReady(true)
    }, 300)
  }

  // Mejorar la función getOverlayStyle para manejar correctamente los valores de degradado
  const getOverlayStyle = () => {
    if (overlay.type === "none") {
      return {}
    }

    if (overlay.type === "color" && overlay.color) {
      return {
        backgroundColor: overlay.color,
      }
    }

    if (overlay.type === "gradient" && overlay.gradient) {
      const { colorStart, colorEnd, angle } = overlay.gradient
      return {
        background: `linear-gradient(${angle}deg, ${colorStart}, ${colorEnd})`,
      }
    }

    // Default fallback
    return { backgroundColor: "rgba(0, 0, 0, 0.4)" }
  }

  if (!videoId) return null

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className || ""}`}>
      {fallbackImage && !isReady && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      )}
      <div className="absolute inset-0 w-full h-full">
        <YouTube
          videoId={videoId}
          onReady={onReady}
          opts={{
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              enablejsapi: 1,
              fs: 0,
              iv_load_policy: 3, // Hide video annotations
              loop: 1,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
              showinfo: 0,
              mute: 1,
              playlist: videoId, // Required for looping
              cc_load_policy: 0, // Disable closed captions
              origin: typeof window !== "undefined" ? window.location.origin : "",
            },
            width: "100%",
            height: "100%",
          }}
          className={`absolute inset-0 w-full h-full pointer-events-none ${
            isReady ? "opacity-100" : "opacity-0"
          } transition-opacity duration-500`}
          iframeClassName="absolute inset-0 w-full h-full object-cover"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "100%",
            height: "100%",
            transform: "translate(-50%, -50%) scale(1.5)", // Escalar para cubrir todo el contenedor
            pointerEvents: "none",
          }}
        />
      </div>
      {/* Overlay personalizable */}
      <div className="absolute inset-0 pointer-events-none" style={getOverlayStyle()} />
    </div>
  )
}

