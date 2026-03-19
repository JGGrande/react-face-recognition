export type InferenceEngine = "tensorflow" | "mediapipe" | "faceapi"

export type CaptureFlowState =
  | "idle"
  | "running"
  | "capturing"
  | "uploading"
  | "success"
  | "error"

export type CameraPermissionState = "idle" | "granted" | "denied"

export type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
}

export type FaceKeypoint = {
  x: number
  y: number
  name?: string
}

export type FacePose = {
  yaw: number
  pitch: number
  roll: number
}

export type DetectedFace = {
  boundingBox: BoundingBox
  confidence: number
  keypoints: FaceKeypoint[]
  pose: FacePose
}

export type FaceDetectionResult = {
  faces: DetectedFace[]
  frameWidth: number
  frameHeight: number
  timestamp: number
}

export type CaptureQualityState = {
  hasSingleFace: boolean
  isCentered: boolean
  hasIdealSize: boolean
  hasFrontalPose: boolean
  hasConfidence: boolean
  passedAll: boolean
}

export type FaceDetectionStrategy = {
  readonly id: InferenceEngine
  init: () => Promise<void>
  detect: (videoElement: HTMLVideoElement) => Promise<FaceDetectionResult>
  dispose: () => Promise<void>
}
