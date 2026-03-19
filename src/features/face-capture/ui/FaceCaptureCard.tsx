import { CameraIcon, CircleCheckIcon, CircleXIcon, Loader2Icon, RefreshCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CaptureQualityState, InferenceEngine } from "@/features/face-capture/domain/types"
import { useFaceCaptureFlow } from "@/features/face-capture/hooks/useFaceCaptureFlow"
import { FaceOverlay } from "@/features/face-capture/ui/FaceOverlay"

type CriterionItemProps = {
  label: string
  passed: boolean
}

function CriterionItem({ label, passed }: CriterionItemProps) {
  return (
    <li className="flex items-center justify-between rounded-md border border-border px-2 py-1">
      <span>{label}</span>
      {passed ? (
        <CircleCheckIcon className="size-4 text-primary" />
      ) : (
        <CircleXIcon className="size-4 text-muted-foreground" />
      )}
    </li>
  )
}

function getEngineLabel(engine: InferenceEngine) {
  if (engine === "tensorflow") {
    return "TensorFlow.js"
  }

  if (engine === "mediapipe") {
    return "MediaPipe"
  }

  return "face-api.js"
}

function getFlowLabel(flowState: string) {
  switch (flowState) {
    case "running":
      return "Analisando rosto em tempo real"
    case "capturing":
      return "Capturando foto"
    case "uploading":
      return "Enviando imagem (Mock API)"
    case "success":
      return "Envio concluído com sucesso"
    case "error":
      return "Ocorreu um erro no fluxo"
    default:
      return "Aguardando inicialização"
  }
}

function criteria(qualityState: CaptureQualityState) {
  return [
    { label: "Apenas um rosto", passed: qualityState.hasSingleFace },
    { label: "Rosto centralizado", passed: qualityState.isCentered },
    { label: "Tamanho entre 30% e 50%", passed: qualityState.hasIdealSize },
    { label: "Pose frontal", passed: qualityState.hasFrontalPose },
    { label: "Confiança acima de 90%", passed: qualityState.hasConfidence },
  ]
}

export function FaceCaptureCard() {
  const {
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
  } = useFaceCaptureFlow()

  return (
    <>
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>PoC • Captura Facial Automatizada</CardTitle>
          <CardDescription>
            Engine ativa: {getEngineLabel(engine)} • {getFlowLabel(flowState)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs
            value={engine}
            onValueChange={(value) => switchEngine(value as InferenceEngine)}
          >
            <TabsList>
              <TabsTrigger value="tensorflow">TensorFlow.js</TabsTrigger>
              <TabsTrigger value="mediapipe">MediaPipe</TabsTrigger>
              <TabsTrigger value="faceapi">face-api.js</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-2">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted sm:aspect-video">
                <video
                  ref={videoRef}
                  className="h-full w-full -scale-x-100 object-cover"
                  muted
                  autoPlay
                  playsInline
                />

                <FaceOverlay
                  detectionResult={detectionResult}
                  qualityState={qualityState}
                  engine={engine}
                  mirrored
                />

                {isEngineLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-xs">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Loader2Icon className="size-4 animate-spin" />
                      Carregando engine...
                    </div>
                  </div>
                ) : null}

                {permission === "denied" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 p-4 text-center text-sm">
                    <p>Permissão da câmera negada.</p>
                    <Button onClick={() => void requestCamera()}>
                      <CameraIcon />
                      Tentar novamente
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Estabilidade para auto-captura (2s)</span>
                  <span>{holdProgress.toFixed(0)}%</span>
                </div>
                <Progress value={holdProgress} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Critérios de qualidade
              </p>
              <ul className="space-y-1.5 text-xs">
                {criteria(qualityState).map((criterion) => (
                  <CriterionItem
                    key={criterion.label}
                    label={criterion.label}
                    passed={criterion.passed}
                  />
                ))}
              </ul>
            </div>
          </div>

          {engineError ? (
            <p className="text-sm text-destructive">{engineError}</p>
          ) : null}
        </CardContent>

        <CardFooter className="justify-end gap-2">
          <Button variant="outline" onClick={() => void tryAgain()}>
            <RefreshCcwIcon />
            Reiniciar fluxo
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Captura concluída</DialogTitle>
            <DialogDescription>
              A imagem foi enviada com sucesso para a Mock API.
            </DialogDescription>
          </DialogHeader>

          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Resultado da captura facial"
              className="h-auto w-full rounded-lg border border-border"
            />
          ) : null}

          <DialogFooter>
            <Button onClick={() => void tryAgain()}>Tentar novamente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
