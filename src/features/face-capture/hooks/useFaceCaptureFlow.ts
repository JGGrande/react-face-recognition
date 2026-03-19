import * as React from "react"
import { toast } from "sonner"

import { evaluateCaptureQuality } from "@/features/face-capture/domain/quality"
import type {
  CameraPermissionState,
  CaptureFlowState,
  CaptureQualityState,
  FaceDetectionResult,
  FaceDetectionStrategy,
  InferenceEngine,
} from "@/features/face-capture/domain/types"
import {
  createFaceDetectionStrategy,
  preloadAllDetectionEngines,
} from "@/features/face-capture/engines/factory"
import { submitFacePhotoMock } from "@/features/face-capture/services/submitFacePhotoMock"

const HOLD_DURATION_MS = 2000

const EMPTY_DETECTION: FaceDetectionResult = {
  faces: [],
  frameWidth: 0,
  frameHeight: 0,
  timestamp: 0,
}

const EMPTY_QUALITY: CaptureQualityState = {
  hasSingleFace: false,
  isCentered: false,
  hasIdealSize: false,
  hasFrontalPose: false,
  hasConfidence: false,
  passedAll: false,
}

function getUserMediaConstraints() {
  return {
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  } as const
}

export function useFaceCaptureFlow() {
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const strategyRef = React.useRef<FaceDetectionStrategy | null>(null)
  const rafRef = React.useRef<number | null>(null)
  const isProcessingRef = React.useRef(false)
  const holdStartRef = React.useRef<number | null>(null)
  const captureLockRef = React.useRef(false)

  const [engine, setEngine] = React.useState<InferenceEngine>("tensorflow")
  const [permission, setPermission] =
    React.useState<CameraPermissionState>("idle")
  const [flowState, setFlowState] = React.useState<CaptureFlowState>("idle")
  const [isEngineLoading, setIsEngineLoading] = React.useState(false)
  const [engineError, setEngineError] = React.useState<string | null>(null)
  const [detectionResult, setDetectionResult] =
    React.useState<FaceDetectionResult>(EMPTY_DETECTION)
  const [qualityState, setQualityState] =
    React.useState<CaptureQualityState>(EMPTY_QUALITY)
  const [holdProgress, setHoldProgress] = React.useState(0)
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null)
  const [isResultDialogOpen, setIsResultDialogOpen] = React.useState(false)

  const resetQuality = React.useCallback(() => {
    holdStartRef.current = null
    setHoldProgress(0)
    setQualityState(EMPTY_QUALITY)
  }, [])

  const clearLoop = React.useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const stopCamera = React.useCallback(() => {
    clearLoop()

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [clearLoop])

  const requestCamera = React.useCallback(async () => {
    try {
      setEngineError(null)
      setPermission("idle")

      const stream = await navigator.mediaDevices.getUserMedia(
        getUserMediaConstraints()
      )

      streamRef.current = stream
      const videoElement = videoRef.current
      if (!videoElement) {
        return
      }

      videoElement.srcObject = stream
      await videoElement.play()

      setPermission("granted")
      setFlowState("running")
    } catch {
      setPermission("denied")
      setFlowState("error")
      setEngineError(
        "Não foi possível acessar a câmera. Verifique as permissões do navegador."
      )
    }
  }, [])

  const captureAndSubmit = React.useCallback(async () => {
    if (captureLockRef.current) {
      return
    }

    captureLockRef.current = true
    setFlowState("capturing")

    const videoElement = videoRef.current
    if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
      captureLockRef.current = false
      setFlowState("error")
      setEngineError("Falha ao capturar frame da câmera.")
      return
    }

    const canvas = document.createElement("canvas")
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight

    const context = canvas.getContext("2d")
    if (!context) {
      captureLockRef.current = false
      setFlowState("error")
      setEngineError("Falha ao preparar o canvas para captura.")
      return
    }

    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
    const base64Image = canvas.toDataURL("image/jpeg", 0.92)
    setCapturedImage(base64Image)

    stopCamera()

    try {
      setFlowState("uploading")
      const response = await submitFacePhotoMock(base64Image)

      if (response.ok) {
        toast.success("Mock API", {
          description: `${response.message} (${Math.round(response.imageSizeBytes / 1024)} KB)`,
        })
        setFlowState("success")
        setIsResultDialogOpen(true)
      }
    } catch {
      setFlowState("error")
      setEngineError("Falha ao enviar a foto para a API mock.")
      toast.error("Erro no envio", {
        description: "Não foi possível concluir o envio mock da foto.",
      })
    } finally {
      captureLockRef.current = false
    }
  }, [stopCamera])

  React.useEffect(() => {
    void requestCamera()

    return () => {
      stopCamera()
      void strategyRef.current?.dispose()
      strategyRef.current = null
    }
  }, [requestCamera, stopCamera])

  React.useEffect(() => {
    if (permission !== "granted") {
      return
    }

    let isCancelled = false

    const loadStrategy = async () => {
      try {
        setIsEngineLoading(true)
        setEngineError(null)
        resetQuality()

        if (strategyRef.current) {
          await strategyRef.current.dispose()
        }

        const strategy = await createFaceDetectionStrategy(engine)
        if (isCancelled) {
          await strategy.dispose()
          return
        }

        await strategy.init()
        strategyRef.current = strategy
      } catch (error) {
        setEngineError(
          error instanceof Error
            ? error.message
            : "Não foi possível iniciar o motor de detecção."
        )
      } finally {
        setIsEngineLoading(false)
      }
    }

    void loadStrategy()

    return () => {
      isCancelled = true
    }
  }, [engine, permission, resetQuality])

  React.useEffect(() => {
    if (permission !== "granted" || isEngineLoading) {
      return
    }

    let timerId: ReturnType<typeof setTimeout> | null = null
    const runPreload = () => {
      void preloadAllDetectionEngines(engine)
    }

    if ("requestIdleCallback" in window) {
      const requestIdleCallback = window.requestIdleCallback as (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions
      ) => number
      const cancelIdleCallback = window.cancelIdleCallback as (
        handle: number
      ) => void

      const idleId = requestIdleCallback(() => {
        runPreload()
      })

      return () => {
        cancelIdleCallback(idleId)
      }
    }

    timerId = setTimeout(runPreload, 1200)

    return () => {
      if (timerId !== null) {
        clearTimeout(timerId)
      }
    }
  }, [engine, isEngineLoading, permission])

  React.useEffect(() => {
    if (permission !== "granted") {
      return
    }

    let isCancelled = false

    const processFrame = async () => {
      rafRef.current = window.requestAnimationFrame(processFrame)

      if (isCancelled || flowState !== "running") {
        return
      }

      if (isProcessingRef.current || isEngineLoading) {
        return
      }

      const videoElement = videoRef.current
      const strategy = strategyRef.current

      if (!videoElement || !strategy || videoElement.readyState < 2) {
        return
      }

      isProcessingRef.current = true

      try {
        const result = await strategy.detect(videoElement)
        setDetectionResult(result)

        const quality = evaluateCaptureQuality(result)
        setQualityState(quality)

        if (quality.passedAll) {
          if (holdStartRef.current === null) {
            holdStartRef.current = performance.now()
          }

          const elapsed = performance.now() - holdStartRef.current
          const progressValue = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100)
          setHoldProgress(progressValue)

          if (elapsed >= HOLD_DURATION_MS) {
            holdStartRef.current = null
            setHoldProgress(100)
            await captureAndSubmit()
          }
        } else {
          holdStartRef.current = null
          setHoldProgress(0)
        }
      } catch {
        setEngineError("Falha no processamento de detecção facial.")
      } finally {
        isProcessingRef.current = false
      }
    }

    rafRef.current = window.requestAnimationFrame(processFrame)

    return () => {
      isCancelled = true
      clearLoop()
    }
  }, [captureAndSubmit, clearLoop, flowState, isEngineLoading, permission])

  const switchEngine = React.useCallback((nextEngine: InferenceEngine) => {
    setEngine(nextEngine)
    resetQuality()
  }, [resetQuality])

  const tryAgain = React.useCallback(async () => {
    setIsResultDialogOpen(false)
    setCapturedImage(null)
    setDetectionResult(EMPTY_DETECTION)
    resetQuality()
    setFlowState("idle")
    captureLockRef.current = false

    stopCamera()
    await requestCamera()
  }, [requestCamera, resetQuality, stopCamera])

  return {
    engine,
    permission,
    flowState,
    isEngineLoading,
    engineError,
    detectionResult,
    qualityState,
    holdProgress,
    capturedImage,
    isResultDialogOpen,
    setIsResultDialogOpen,
    videoRef,
    switchEngine,
    requestCamera,
    tryAgain,
  }
}
