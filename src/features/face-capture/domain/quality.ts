import type { CaptureQualityState, FaceDetectionResult } from "@/features/face-capture/domain/types"

const CENTER_TOLERANCE_RATIO = 0.12
const MIN_FACE_AREA_RATIO = 0.3
const MAX_FACE_AREA_RATIO = 0.5
const MAX_YAW_DEGREES = 15
const MAX_PITCH_DEGREES = 15
const MAX_ROLL_DEGREES = 15
const MIN_CONFIDENCE = 0.9

export function evaluateCaptureQuality(
  detectionResult: FaceDetectionResult
): CaptureQualityState {
  if (detectionResult.faces.length !== 1) {
    return {
      hasSingleFace: false,
      isCentered: false,
      hasIdealSize: false,
      hasFrontalPose: false,
      hasConfidence: false,
      passedAll: false,
    }
  }

  const [face] = detectionResult.faces
  const frameCenterX = detectionResult.frameWidth / 2
  const frameCenterY = detectionResult.frameHeight / 2
  const faceCenterX = face.boundingBox.x + face.boundingBox.width / 2
  const faceCenterY = face.boundingBox.y + face.boundingBox.height / 2

  const centerDistanceX = Math.abs(faceCenterX - frameCenterX) / detectionResult.frameWidth
  const centerDistanceY = Math.abs(faceCenterY - frameCenterY) / detectionResult.frameHeight
  const isCentered =
    centerDistanceX <= CENTER_TOLERANCE_RATIO &&
    centerDistanceY <= CENTER_TOLERANCE_RATIO

  const faceAreaRatio =
    (face.boundingBox.width * face.boundingBox.height) /
    (detectionResult.frameWidth * detectionResult.frameHeight)
  const hasIdealSize =
    faceAreaRatio >= MIN_FACE_AREA_RATIO && faceAreaRatio <= MAX_FACE_AREA_RATIO

  const hasFrontalPose =
    Math.abs(face.pose.yaw) <= MAX_YAW_DEGREES &&
    Math.abs(face.pose.pitch) <= MAX_PITCH_DEGREES &&
    Math.abs(face.pose.roll) <= MAX_ROLL_DEGREES

  const hasConfidence = face.confidence >= MIN_CONFIDENCE

  return {
    hasSingleFace: true,
    isCentered,
    hasIdealSize,
    hasFrontalPose,
    hasConfidence,
    passedAll: isCentered && hasIdealSize && hasFrontalPose && hasConfidence,
  }
}
