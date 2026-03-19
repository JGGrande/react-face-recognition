Aqui está o Documento de Requisitos do Produto (PRD) formatado em Markdown, estruturado com foco em arquitetura d
# Documento de Requisitos do Produto (PRD)
**Projeto:** PoC - Captura Facial Automatizada (Client-Side)
**Data:** 19 de Março de 2026
**Status:** Em Especificação

## 1. Visão Geral e Objetivo
O objetivo desta Prova de Conceito (PoC) é desenvolver uma aplicação React *client-side* capaz de acessar a webcam do usuário, detectar um rosto em tempo real e realizar a captura automática de uma foto somente quando padrões rigorosos de qualidade e posicionamento forem atendidos. 

Como o ecossistema de visão computacional em JavaScript possui múltiplas opções, esta PoC deve implementar e testar lado a lado as três principais bibliotecas do mercado: **TensorFlow.js (BlazeFace/Face Detection)**, **MediaPipe (Tasks Vision)** e **face-api.js**. O sistema permitirá a troca em tempo real entre esses motores de inferência para avaliação de performance, precisão e uso de recursos.

## 2. Escopo
* **In-scope:** Acesso à webcam, processamento de vídeo frame a frame, detecção facial, validação de critérios de qualidade da foto, captura automatizada, simulação de envio (Mock API) com estados de *loading*, e interface de seleção de motor de inferência.
* **Out-of-scope:** Reconhecimento facial (identidade) no client-side, persistência real em banco de dados, deploy em produção nesta fase.

## 3. Requisitos Funcionais (RF)
* **RF01 - Acesso à Câmera:** O sistema deve solicitar e obter permissão para acessar a câmera frontal do dispositivo do usuário.
* **RF02 - Alternância de Motores:** A interface deve conter controles (botões/abas) que permitam ao usuário alternar instantaneamente entre TensorFlow.js, MediaPipe e face-api.js.
* **RF03 - Feedback Visual:** O vídeo deve exibir um *overlay* (ex: *bounding box* ou malha facial) em tempo real, indicando se o rosto está sendo detectado e qual a biblioteca em uso.
* **RF04 - Critérios de Qualidade (Auto-Capture):** A captura só deve ser engatilhada automaticamente se as seguintes condições simultâneas forem mantidas por pelo menos 2 segundos:
    * Apenas *um* rosto detectado.
    * Rosto centralizado no quadro.
    * Tamanho adequado (rosto ocupa de 30% a 50% da área).
    * Rosto frontal (verificação de *yaw*, *pitch* e *roll* próximos a zero).
    * Score de confiança do modelo superior a 90%.
* **RF05 - Mock API e Estado de Carregamento:** Ao capturar a imagem, o sistema deve pausar a câmera, exibir um componente de *loading* claro, e realizar uma requisição simulada (Mock) de 2 a 3 segundos retornando um status de sucesso (200 OK).
* **RF06 - Reset da Captura:** Após o sucesso da requisição mock, o usuário deve ter a opção de tentar novamente, reiniciando o fluxo.

## 4. Requisitos Não Funcionais (RNF) e Arquitetura
* **RNF01 - Stack Tecnológica:** React (Vite ou Next.js), TypeScript.
* **RNF02 - Estilização e UI:** O projeto utilizará **shadcn/ui** combinado com Tailwind CSS. 
* **RNF03 - Performance:** O loop de processamento de imagem (`requestAnimationFrame`) não deve travar a *thread* principal da UI. A detecção deve rodar a pelo menos 20-30 FPS.
* **RNF04 - Padrões de Projeto (Arquitetura):** A implementação das bibliotecas deve seguir o padrão *Strategy*. Deve haver uma interface comum (ex: `FaceDetectionStrategy`) para que o componente React consuma os dados de detecção de forma agnóstica, independentemente se o MediaPipe ou o face-api.js está ativo.
* **RNF05 - Qualidade de Código:** O código deve ser estruturado prevendo fácil integração futura com ferramentas de análise estática (ex: SonarQube) e pipelines de CI/CD, mantendo alta cobertura de tipagem e separação de responsabilidades.

## 5. Instruções Específicas para IA / Desenvolvedor
Para manter a consistência do design system, as seguintes regras devem ser aplicadas na construção da interface:

1.  **Uso do shadcn/ui:** * Não crie componentes de UI do zero. 
    * **Comando Obrigatório:** Sempre que um novo elemento interativo for necessário, utilize a CLI oficial. Exemplo: `npx shadcn-ui@latest add button`, `npx shadcn-ui@latest add card`, `npx shadcn-ui@latest add tabs`, `npx shadcn-ui@latest add toast`, `npx shadcn-ui@latest add progress`.
2.  **Organização de Componentes:**
    * Use o componente `Tabs` ou `ToggleGroup` do shadcn para os botões de troca de biblioteca.
    * Use o componente `Card` para encapsular a área de vídeo e os feedbacks de status.
    * Use o componente `Toast` para exibir o resultado da Mock API (Sucesso/Falha).
3.  **Mock de Requisição:** Implementar uma função `submitFacePhotoMock(base64Image): Promise<Response>` que utiliza `setTimeout` para atrasar a resolução da Promise.

4. **Exibir resultado** Após a captura com sucesso o sistema deve exibir a imagem capturada em um modal.