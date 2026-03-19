import type {
  FaceDetectionStrategy,
  InferenceEngine,
} from "@/features/face-capture/domain/types"

type StrategyModule = {
  TensorFlowFaceDetectionStrategy?: new () => FaceDetectionStrategy
  MediaPipeFaceDetectionStrategy?: new () => FaceDetectionStrategy
  FaceApiDetectionStrategy?: new () => FaceDetectionStrategy
}

const moduleLoaders: Record<
  InferenceEngine,
  () => Promise<StrategyModule>
> = {
  tensorflow: () => import("@/features/face-capture/engines/tensorflow-strategy"),
  mediapipe: () => import("@/features/face-capture/engines/mediapipe-strategy"),
  faceapi: () => import("@/features/face-capture/engines/faceapi-strategy"),
}

const moduleCache = new Map<InferenceEngine, Promise<StrategyModule>>()

function getEngineModule(engine: InferenceEngine) {
  const cached = moduleCache.get(engine)
  if (cached) {
    return cached
  }

  const modulePromise = moduleLoaders[engine]()
  moduleCache.set(engine, modulePromise)
  return modulePromise
}

export async function preloadFaceDetectionEngine(engine: InferenceEngine) {
  await getEngineModule(engine)
}

export async function preloadAllDetectionEngines(except?: InferenceEngine) {
  const engines: InferenceEngine[] = ["tensorflow", "mediapipe", "faceapi"]
  await Promise.all(
    engines
      .filter((engine) => engine !== except)
      .map((engine) => preloadFaceDetectionEngine(engine))
  )
}

export async function createFaceDetectionStrategy(
  engine: InferenceEngine
): Promise<FaceDetectionStrategy> {
  switch (engine) {
    case "tensorflow": {
      const module = await getEngineModule(engine)
      if (!module.TensorFlowFaceDetectionStrategy) {
        throw new Error("Módulo TensorFlow não disponível.")
      }
      return new module.TensorFlowFaceDetectionStrategy()
    }

    case "mediapipe": {
      const module = await getEngineModule(engine)
      if (!module.MediaPipeFaceDetectionStrategy) {
        throw new Error("Módulo MediaPipe não disponível.")
      }
      return new module.MediaPipeFaceDetectionStrategy()
    }

    case "faceapi": {
      const module = await getEngineModule(engine)
      if (!module.FaceApiDetectionStrategy) {
        throw new Error("Módulo face-api.js não disponível.")
      }
      return new module.FaceApiDetectionStrategy()
    }

    default: {
      throw new Error(`Engine não suportada: ${engine}`)
    }
  }
}
