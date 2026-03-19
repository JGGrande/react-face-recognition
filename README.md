# React Face Recognition PoC

PoC client-side para captura facial automática com três motores de inferência:
- TensorFlow.js
- MediaPipe Tasks Vision
- face-api.js

## Scripts

- `npm run dev`
- `npm run lint`
- `npm run build`

## Deploy no GitHub Pages

O workflow [deploy-github-pages.yml](.github/workflows/deploy-github-pages.yml) faz build e deploy automático para GitHub Pages a cada push na branch `main`.

Antes do primeiro deploy, configure no repositório:
- **Settings → Pages → Source**: `GitHub Actions`

## Estratégia de performance

- Code splitting por engine no build com `manualChunks`.
- Import dinâmico com cache para cada strategy.
- Preload em tempo ocioso dos motores não ativos para reduzir latência na troca.

## Estratégia de modelos (CDN ou local)

Por padrão os modelos são carregados via CDN. Para usar arquivos locais:

1. Crie `.env` na raiz com:

```bash
VITE_FACE_MODEL_SOURCE=local
```

2. Adicione os assets em `public/models`:

- `public/models/mediapipe/wasm/*`
- `public/models/mediapipe/blaze_face_short_range.tflite`
- `public/models/face-api/*` (arquivos dos modelos do face-api.js)

Para voltar ao CDN, remova a variável ou use `VITE_FACE_MODEL_SOURCE=cdn`.
