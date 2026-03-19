type ModelSource = "cdn" | "local"

const modelSource = (import.meta.env.VITE_FACE_MODEL_SOURCE as ModelSource | undefined) ?? "cdn"

const LOCAL_BASE = "/models"

export function resolveMediaPipeWasmPath() {
  if (modelSource === "local") {
    return `${LOCAL_BASE}/mediapipe/wasm`
  }

  return "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
}

export function resolveMediaPipeModelPath() {
  if (modelSource === "local") {
    return `${LOCAL_BASE}/mediapipe/blaze_face_short_range.tflite`
  }

  return "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
}

export function resolveFaceApiModelsPath() {
  if (modelSource === "local") {
    return `${LOCAL_BASE}/face-api`
  }

  return "https://justadudewhohacks.github.io/face-api.js/models"
}

export function getModelSource() {
  return modelSource
}
