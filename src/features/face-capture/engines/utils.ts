import type { BoundingBox, FaceKeypoint, FacePose } from "@/features/face-capture/domain/types"

const RAD_TO_DEG = 180 / Math.PI

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function normalizeConfidence(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clamp(value, 0, 1)
  }

  if (Array.isArray(value) && typeof value[0] === "number") {
    return clamp(value[0], 0, 1)
  }

  return 0
}

function pickNamedPoint(keypoints: FaceKeypoint[], names: string[]) {
  const named = keypoints.find((keypoint) => {
    if (!keypoint.name) {
      return false
    }

    return names.includes(keypoint.name.toLowerCase())
  })

  return named
}

function fallbackByIndex(keypoints: FaceKeypoint[], index: number) {
  if (index < 0 || index >= keypoints.length) {
    return null
  }

  return keypoints[index]
}

export function estimatePoseFromKeypoints(
  keypoints: FaceKeypoint[],
  boundingBox: BoundingBox
): FacePose {
  const leftEye =
    pickNamedPoint(keypoints, ["left eye", "left_eye", "lefteye"]) ??
    fallbackByIndex(keypoints, 0)
  const rightEye =
    pickNamedPoint(keypoints, ["right eye", "right_eye", "righteye"]) ??
    fallbackByIndex(keypoints, 1)
  const nose =
    pickNamedPoint(keypoints, ["nose tip", "nose", "nosetip"]) ??
    fallbackByIndex(keypoints, 2)

  if (!leftEye || !rightEye || !nose) {
    return { yaw: 999, pitch: 999, roll: 999 }
  }

  const eyeMidX = (leftEye.x + rightEye.x) / 2
  const eyeMidY = (leftEye.y + rightEye.y) / 2
  const eyeDistance = Math.max(Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y), 1)

  const yaw = clamp(((nose.x - eyeMidX) / (eyeDistance / 2)) * 25, -90, 90)
  const pitch = clamp(((nose.y - eyeMidY) / eyeDistance) * 20, -90, 90)

  const roll = clamp(
    Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * RAD_TO_DEG,
    -90,
    90
  )

  if (!Number.isFinite(yaw) || !Number.isFinite(pitch) || !Number.isFinite(roll)) {
    return { yaw: 999, pitch: 999, roll: 999 }
  }

  const isWithinBounds =
    nose.x >= boundingBox.x &&
    nose.x <= boundingBox.x + boundingBox.width &&
    nose.y >= boundingBox.y &&
    nose.y <= boundingBox.y + boundingBox.height

  if (!isWithinBounds) {
    return { yaw: 999, pitch: 999, roll: 999 }
  }

  return {
    yaw,
    pitch,
    roll,
  }
}
