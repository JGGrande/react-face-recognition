import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision"

import type {
  DetectedFace,
  FaceDetectionResult,
  FaceDetectionStrategy,
  FaceKeypoint,
} from "@/features/face-capture/domain/types"
import {
  resolveMediaPipeModelPath,
  resolveMediaPipeWasmPath,
} from "@/features/face-capture/engines/model-config"
import { estimatePoseFromKeypoints, normalizeConfidence } from "@/features/face-capture/engines/utils"

export class MediaPipeFaceDetectionStrategy implements FaceDetectionStrategy {
  public readonly id = "mediapipe" as const

  private detector: FaceDetector | null = null

  public async init() {
    const vision = await FilesetResolver.forVisionTasks(resolveMediaPipeWasmPath())

    this.detector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: resolveMediaPipeModelPath(),
      },
      runningMode: "VIDEO",
      minDetectionConfidence: 0.5,
    })
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

    const timestamp = performance.now()
    const detectionResult = this.detector.detectForVideo(videoElement, timestamp)

    const faces: DetectedFace[] = detectionResult.detections.map((detection) => {
      const box = detection.boundingBox
      const boundingBox = {
        x: box?.originX ?? 0,
        y: box?.originY ?? 0,
        width: box?.width ?? 0,
        height: box?.height ?? 0,
      }

      const keypoints: FaceKeypoint[] = detection.keypoints.map((keypoint) => ({
        x: keypoint.x * videoElement.videoWidth,
        y: keypoint.y * videoElement.videoHeight,
        name: keypoint.label,
      }))

      return {
        boundingBox,
        confidence: normalizeConfidence(detection.categories[0]?.score),
        keypoints,
        pose: estimatePoseFromKeypoints(keypoints, boundingBox),
      }
    })

    return {
      faces,
      frameWidth: videoElement.videoWidth,
      frameHeight: videoElement.videoHeight,
      timestamp,
    }
  }

  public async dispose() {
    this.detector?.close()
    this.detector = null
  }
}
