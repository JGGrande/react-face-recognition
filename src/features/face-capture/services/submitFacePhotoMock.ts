export type FacePhotoMockResponse = {
  status: 200
  ok: true
  message: string
  submittedAt: string
  imageSizeBytes: number
}

function getBase64Size(base64Image: string) {
  const base64Payload = base64Image.split(",")[1] ?? ""
  return Math.ceil((base64Payload.length * 3) / 4)
}

export async function submitFacePhotoMock(
  base64Image: string
): Promise<FacePhotoMockResponse> {
  const delay = 2000 + Math.floor(Math.random() * 1000)

  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve({
        status: 200,
        ok: true,
        message: "Foto enviada com sucesso (Mock API).",
        submittedAt: new Date().toISOString(),
        imageSizeBytes: getBase64Size(base64Image),
      })
    }, delay)
  })
}
