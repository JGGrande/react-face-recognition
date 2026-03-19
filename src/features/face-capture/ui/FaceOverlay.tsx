import * as React from "react"

import type {
  CaptureQualityState,
  FaceDetectionResult,
  InferenceEngine,
} from "@/features/face-capture/domain/types"

type FaceOverlayProps = {
  detectionResult: FaceDetectionResult
  qualityState: CaptureQualityState
  engine: InferenceEngine
  mirrored?: boolean
}

export function FaceOverlay({
  detectionResult,
  qualityState,
  engine,
  mirrored = false,
}: FaceOverlayProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const frameWidth = detectionResult.frameWidth
    const frameHeight = detectionResult.frameHeight

    if (!frameWidth || !frameHeight) {
      const context = canvas.getContext("2d")
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    canvas.width = frameWidth
    canvas.height = frameHeight

    const context = canvas.getContext("2d")
    if (!context) {
      return
    }

    const rootStyles = window.getComputedStyle(document.documentElement)
    const primaryColor = rootStyles.getPropertyValue("--primary").trim()
    const mutedColor = rootStyles.getPropertyValue("--muted-foreground").trim()
    const foregroundColor = rootStyles.getPropertyValue("--foreground").trim()
    const backgroundColor = rootStyles.getPropertyValue("--background").trim()

    context.clearRect(0, 0, frameWidth, frameHeight)

    for (const face of detectionResult.faces) {
      const displayX = mirrored
        ? frameWidth - face.boundingBox.x - face.boundingBox.width
        : face.boundingBox.x

      context.lineWidth = 3
      context.strokeStyle = qualityState.passedAll ? primaryColor : mutedColor
      context.strokeRect(
        displayX,
        face.boundingBox.y,
        face.boundingBox.width,
        face.boundingBox.height
      )

      context.font = "14px sans-serif"
      context.fillStyle = foregroundColor
      context.fillText(
        `conf: ${(face.confidence * 100).toFixed(1)}%`,
        displayX,
        Math.max(16, face.boundingBox.y - 6)
      )
    }

    context.fillStyle = backgroundColor
    context.fillRect(10, 10, 220, 30)
    context.fillStyle = foregroundColor
    context.font = "13px sans-serif"
    context.fillText(`Engine: ${engine}`, 18, 30)
  }, [detectionResult, engine, mirrored, qualityState.passedAll])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  )
}
