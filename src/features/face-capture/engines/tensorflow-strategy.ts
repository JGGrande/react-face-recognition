import * as faceDetection from "@tensorflow-models/face-detection"
import "@tensorflow/tfjs"

import type {
  DetectedFace,
  FaceDetectionResult,
  FaceDetectionStrategy,
  FaceKeypoint,
} from "@/features/face-capture/domain/types"
import { estimatePoseFromKeypoints, normalizeConfidence } from "@/features/face-capture/engines/utils"

export class TensorFlowFaceDetectionStrategy implements FaceDetectionStrategy {
  public readonly id = "tensorflow" as const

  private detector: faceDetection.FaceDetector | null = null

  public async init() {
    this.detector = await faceDetection.createDetector(
      faceDetection.SupportedModels.MediaPipeFaceDetector,
      {
        runtime: "tfjs",
        modelType: "short",
      }
    )
  }

  public async detect(videoElement: HTMLVideoElement): Promise<FaceDetectionResult> {
    if (!this.detector) {
      return {
        faces: [],
        frameWidth: videoElement.videoWidth,
        frameHeight: videoElement.videoHeight,
        timestamp: performance.now(),
      }
    }

    const predictions = await this.detector.estimateFaces(videoElement, {
      flipHorizontal: true,
    })

    const faces: DetectedFace[] = (predictions as unknown as Array<Record<string, unknown>>).map((prediction) => {
      const box = prediction.box as
        | { xMin?: number; yMin?: number; width?: number; height?: number }
        | undefined
      const keypoints = (prediction.keypoints as Array<Record<string, unknown>> | undefined) ?? []

      const normalizedKeypoints: FaceKeypoint[] = keypoints.map((point) => ({
        x: Number(point.x ?? 0),
        y: Number(point.y ?? 0),
        name: typeof point.name === "string" ? point.name : undefined,
      }))

      const boundingBox = {
        x: Number(box?.xMin ?? 0),
        y: Number(box?.yMin ?? 0),
        width: Number(box?.width ?? 0),
        height: Number(box?.height ?? 0),
      }

      return {
        boundingBox,
        confidence: normalizeConfidence(prediction.score),
        keypoints: normalizedKeypoints,
        pose: estimatePoseFromKeypoints(normalizedKeypoints, boundingBox),
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
    this.detector?.dispose()
    this.detector = null
  }
}
