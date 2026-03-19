import { FaceCaptureCard } from "@/features/face-capture/ui/FaceCaptureCard"

export function App() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-5xl">
        <FaceCaptureCard />
      </div>
    </div>
  )
}

export default App
