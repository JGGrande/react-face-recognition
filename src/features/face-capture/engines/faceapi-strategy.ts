import * as faceapi from "face-api.js"

import type {
  DetectedFace,
  FaceDetectionResult,
  FaceDetectionStrategy,
  FaceKeypoint,
} from "@/features/face-capture/domain/types"
import { resolveFaceApiModelsPath } from "@/features/face-capture/engines/model-config"
import { estimatePoseFromKeypoints, normalizeConfidence } from "@/features/face-capture/engines/utils"

function averagePoints(points: faceapi.Point[]) {
  const total = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y,
    }),
    { x: 0, y: 0 }
  )

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  }
}

export class FaceApiDetectionStrategy implements FaceDetectionStrategy {
  public readonly id = "faceapi" as const

  private isInitialized = false

  public async init() {
    if (this.isInitialized) {
      return
    }

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(resolveFaceApiModelsPath()),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(resolveFaceApiModelsPath()),
    ])

    this.isInitialized = true
  }

  public async detect(videoElement: HTMLVideoElement): Promise<FaceDetectionResult> {
    if (!this.isInitialized) {
      return {
        faces: [],
        frameWidth: videoElement.videoWidth,
        frameHeight: videoElement.videoHeight,
        timestamp: performance.now(),
      }
    }

    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.5,
    })

    const detections = await faceapi
      .detectAllFaces(videoElement, options)
      .withFaceLandmarks(true)

    const faces: DetectedFace[] = detections.map((detection) => {
      const box = detection.detection.box
      const landmarks = detection.landmarks

      const leftEye = averagePoints(landmarks.getLeftEye())
      const rightEye = averagePoints(landmarks.getRightEye())
      const nose = averagePoints(landmarks.getNose())

      const keypoints: FaceKeypoint[] = [
        { x: leftEye.x, y: leftEye.y, name: "left eye" },
        { x: rightEye.x, y: rightEye.y, name: "right eye" },
        { x: nose.x, y: nose.y, name: "nose tip" },
      ]

      const boundingBox = {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      }

      return {
        boundingBox,
        confidence: normalizeConfidence(detection.detection.score),
        keypoints,
        pose: estimatePoseFromKeypoints(keypoints, boundingBox),
      }
    })

    return {
      faces,
      frameWidth: videoElement.videoWidth,
      frameHeight: videoElement.videoHeight,
      timestamp: performance.now(),
    }
  }

  public async dispose() {
    this.isInitialized = false
  }
}
