# Blind's Eye (PicTalk AI)

> AI-Powered Image Transcription for Enhanced Visual Accessibility

Blind's Eye is a local-first accessibility system designed to assist blind and visually impaired individuals by converting visual scenes into concise, speakable descriptions with ultra-low latency. The system streams textual descriptions in real time via Server-Sent Events (SSE) and reproduces audio using cross-platform speech synthesis with a universal browser Web Speech API fallback.

---

## Key Features

- **Real-Time Multimodal Transcription**: Streams concise, situationally relevant descriptions from vision-language models (e.g., LLaVA, Qwen2.5-VL) through Server-Sent Events for instant feedback.
- **Cross-Platform Speech Synthesis (TTS)**:
  - **Windows**: Native PowerShell `SpeechSynthesizer` generating standard WAV audio directly with zero third-party binaries.
  - **macOS**: Native `say` CLI audio synthesis with ffmpeg pipeline.
  - **Linux**: Supported via `espeak` / `espeak-ng`.
  - **Universal Fallback**: Built-in browser `window.speechSynthesis` (Web Speech API) across all devices and browsers.
- **Mobile Autoplay Recovery**: Detects browser audio autoplay policy restrictions (common on iOS Safari and mobile Chrome) and presents an intuitive, one-tap "Tap here to listen" recovery prompt.
- **Cross-Device Responsive Design**:
  - Flexible aspect-ratio container (`max-h-[340px] sm:max-h-[400px]`, `object-contain`) prevents cropping of mobile portrait (9:16) and square photos.
  - Viewport-fit cover and safe-area insets for notched screens and dynamic islands.
  - High-performance touch responsiveness (`-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`).
- **Accessible & Screen-Reader Ready**:
  - ARIA live region (`aria-live="polite"` and `role="status"`) for immediate screen reader announcement.
  - WCAG 2.5.5 / 2.5.8 compliant touch targets ($\ge$ 48px).
  - Clear keyboard focus indicators (`focus-visible`).
- **Format Support & Mobile Camera Capture**: Supports live camera capture alongside file selection for `.jpg`, `.jpeg`, `.png`, `.webp`, and `.heic`/`.heif` images.

---

## System Architecture

Managed with **pnpm workspaces** and **Turborepo**:

```text
Blind's Eye/
├── apps/
│   ├── api/                     # Hono-based Node.js backend API
│   │   ├── src/
│   │   │   ├── index.ts         # Routes (/describe, /speak, /signed-url, /health)
│   │   │   └── lib/
│   │   │       ├── ai.ts        # Vision-language stream formatters
│   │   │       ├── config.ts    # Typed environment configuration
│   │   │       ├── ollama.ts    # Ollama client instance
│   │   │       ├── openai.ts    # OpenAI client instance
│   │   │       └── tts.ts       # Cross-platform TTS synthesizers
│   │   └── scripts/             # Vision-language benchmarking scripts
│   └── web/                     # React Router v7 SPA frontend
│       ├── app/
│       │   ├── hooks/           # useCompletion, useStreamAudio, useServiceWorker
│       │   ├── routes/          # _index.tsx main interface
│       │   ├── utils/           # stream parser, http client, classname helper
│       │   ├── app.css          # Tailwind CSS v4 and responsive base layer
│       │   └── root.tsx         # Layout, hydration fallback, and error boundary
│       └── public/              # Service worker and static assets
├── paper/                       # Research paper (Typst) and references (BibTeX)
└── tests/                       # Automated cross-device compatibility test suite
```

---

## Getting Started

### Prerequisites

- **Node.js**: $\ge$ 18.0.0 (Node 20+ recommended)
- **pnpm**: $\ge$ 9.0.0
- **Ollama** (optional for local on-device vision model):
  ```bash
  ollama run llava:7b
  ```

### Installation

Clone the repository and install workspace dependencies:

```bash
git clone https://github.com/mahin1710/Blind-s-Eye.git
cd Blind-s-Eye
pnpm install
```

### Environment Configuration

Configure environment variables for web and api packages:

```bash
# Frontend
cp apps/web/.env.example apps/web/.env

# Backend
cp apps/api/.env.example apps/api/.env
```

| Variable          | Package | Default                  | Purpose                  |
| ----------------- | ------- | ------------------------ | ------------------------ |
| `VITE_API_URL`    | `web`   | `http://localhost:8080`  | Backend API base address |
| `PORT`            | `api`   | `8080`                   | Backend listening port   |
| `CORS_ORIGIN`     | `api`   | `*` (LAN auto-permitted) | Permitted CORS origin    |
| `OLLAMA_BASE_URL` | `api`   | `http://localhost:11434` | Ollama service endpoint  |

---

## Development & Production Workflows

### Start Development Servers

Run both the frontend and backend concurrently:

```bash
pnpm dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`

### Run Automated Tests

Execute the compatibility test suite:

```bash
pnpm test
```

### Type Checking

Verify TypeScript types across the entire monorepo:

```bash
pnpm check-types
```

### Production Build

Compile optimized production bundles:

```bash
pnpm build
```

---

## Cross-Device Compatibility Matrix

| Category             | Platform / Viewport                                       | Result   | Notes                                           |
| -------------------- | --------------------------------------------------------- | -------- | ----------------------------------------------- |
| **Desktop / Laptop** | Windows 10/11, macOS, Linux (1920×1080, 1366×768)         | **Pass** | Full keyboard, mouse, and screen reader support |
| **Smartphones**      | iPhone (iOS Safari), Android (Chrome, Samsung Internet)   | **Pass** | Verified at 360px, 390px, and 430px viewports   |
| **Tablets**          | iPad (iPadOS Safari), Android Tablets (Chrome)            | **Pass** | Verified in both portrait and landscape modes   |
| **Browsers**         | Chrome, Edge, Firefox, Safari, iOS Safari, Android Chrome | **Pass** | Cross-browser SSE streaming and audio fallbacks |
| **Backend & API**    | Hono API, Health Check, Cross-Platform TTS, CORS          | **Pass** | Dynamic LAN IP matching and WAV synthesis       |

---

## Authors & Research

Developed as part of research into AI-Powered Image Transcription for Enhanced Visual Accessibility at Independent University, Bangladesh (IUB).

- **Md. Mahedi Hasan Mahin** ([@mahin1710](https://github.com/mahin1710))
- Arik Chakma ([@arikko](https://github.com/arikko))
- Mehrab Bhuiyan
- Tasnim Jahan Urmi

---

## License

This project is licensed under the MIT License.
