# PitchDeck AI

A mobile-first web app that gamifies the process of creating and practicing hackathon pitches. Built with React, TypeScript, and Tailwind CSS.

🔗 **Live Demo**: [pitchdeckai.lovable.app](https://pitchdeckai.lovable.app)

> ⚠️ **Public Demo Notice**: This is a public demo. All practice sessions and data are visible to everyone.

---

## Features

### 🎯 Smart Onboarding Wizard

**Dynamic Branching Logic** - The app adapts questions based on your audience selection:

| Track | Target Audience | Focus Areas |
|-------|-----------------|-------------|
| **Hackathon (The Jury)** | Tech & business judges | Innovation, technical merit, business model |
| **Hackathon (With Demo)** | Demo-focused presentations | Live demonstration flow, tech stack |
| **Investor Pitch** | VCs and angel investors | Market size, traction, financials |
| **Academic Defense** | Thesis committees | Methodology, literature, contributions |
| **Grandma Test** | Non-technical audience | Simple analogies, everyday benefits |

### ✍️ Practice Your Own Pitch (NEW in v1.2)

- **Custom script input** - Paste your own pitch script instead of generating one
- **Word count validation** - Max 450 words (~3 minutes at 130 WPM)
- **AI-powered script structuring** - Automatically parses your script into logical sections (Opening, Problem, Solution, etc.)
- **Seamless integration** - Works with all practice and coaching features

### 🚀 URL Scraping & Auto-Generate (NEW in v1.4)

**Magic Input with intelligent detection:**

- **Paste any URL** - Automatically extracts project name, problem, and solution
- **"Scanning Website..."** animation with visual feedback
- **Two CTAs**: "Customize Pitch" (wizard) or "Auto-Generate Pitch ⚡" (instant)
- **One-click generation** - Skips wizard entirely, jumps straight to Dashboard

### 🎬 Professional Teleprompter (NEW in v1.4)

**Full-screen teleprompter overlay during AI Coach recording:**

- Auto-scrolling with play/pause control
- Adjustable scroll speed slider
- "Reading Zone" indicator with gradient highlights
- Keyboard shortcuts: **Space** = toggle, **Escape** = cancel

### 📊 Real-Time Feedback HUD (NEW in v1.4)

**Heads-up display showing live analysis:**

- **Eye Contact** - Green "Locked On" / Red "Looking Away"
- **Audio Level** - Live microphone volume meter
- **Smile Detection** - Real-time expression feedback
- **System Status** - Recording timer and AI tracking status

### 🎯 Hackathon Jury Pitch Evaluation (v1.3)

**Automated pitch structure analysis specifically for hackathon tracks:**

- **Event Detection** - Identifies key pitch elements:
  - Problem statement articulation
  - Innovation/differentiation claims
  - Technical feasibility explanations
  - Business model mentions
  - Solution introductions

- **Visual Timeline** - Shows exactly where each event occurs in your recording
- **Primary Issue Selection** - Priority ranking with severity scoring
- **"Next Improvement" Coaching Card** - Evidence timestamps + actionable next steps
- **Word-level timestamps** - Precise event detection using STT

### ⏱️ Time-Slicer Technology

- **Sticky "Time Saved" counter** showing real-time savings vs manual prep
- **Precision timing engine** (130 WPM baseline) for accurate speech duration
- **Dynamic section weighting** based on track requirements

### 📝 AI-Powered Script Generation

- **Track-optimized prompts** for different audience types
- **Structured speech blocks** with timing markers
- **Visual cue suggestions** for slides and demos
- **One-click regeneration** with style modifiers (shorter, more technical, etc.)

### 🎙️ Practice Dashboard

Three integrated tabs for complete pitch preparation:

1. **Script View**
   - Time-blocked sections with visual cues
   - PDF export functionality
   - Voice selection for TTS playback

2. **Practice Mode (Teleprompter)**
   - Auto-scrolling teleprompter
   - Real-time progress tracking
   - Block-by-block navigation
   - Text-to-speech with ElevenLabs voices

3. **AI Speech Coach**
   - Voice recording with live waveform visualization
   - **Professional teleprompter overlay** with auto-scroll
   - **Real-time HUD** (eye contact, audio level, smile detection)
   - **Real-time face mesh tracking** with MediaPipe (cyan overlay)
   - Speech-to-text transcription analysis
   - Accuracy scoring with highlighted matches/misses
   - Filler word detection and breakdown
   - WPM and pacing feedback
   - Tone analysis (confident, nervous, rushed, etc.)
   - Practice history with trend charts
   - **Keyboard shortcuts** (Space, Escape)

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Animation**: Framer Motion
- **Backend**: Supabase (Lovable Cloud)
- **AI/Voice**: ElevenLabs TTS/STT, OpenAI Whisper, Lovable AI
- **Computer Vision**: MediaPipe Face Landmarker
- **Charts**: Recharts
- **PDF**: jsPDF

---

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx        # Main post-generation dashboard
│   ├── SpeechCoach.tsx      # AI recording & analysis
│   ├── ai-coach/            # AI Coach components
│   │   ├── AICoachPage.tsx      # Main orchestrator
│   │   ├── AICoachSetup.tsx     # Camera/mic permissions
│   │   ├── AICoachRecording.tsx # Recording with face mesh
│   │   ├── AICoachProcessing.tsx # Analysis pipeline
│   │   └── AICoachResults.tsx   # Results display
│   ├── steps/               # Wizard step components
│   │   ├── Step1Hook.tsx    # Landing page
│   │   ├── Step2Audience.tsx # Audience selection
│   │   ├── CustomScriptStep.tsx # Own script input
│   │   ├── Step7Generation.tsx # Final generation
│   │   └── tracks/          # Track-specific steps
│   ├── landing/             # Landing page components
│   └── ui/                  # shadcn/ui components
├── pages/
│   ├── Index.tsx            # Main wizard orchestrator
│   └── AdminAnalytics.tsx   # Usage analytics
├── services/
│   ├── openai.ts            # OpenAI API integration
│   ├── mediapipe.ts         # Face mesh detection
│   └── mockScraper.ts       # URL scraping simulation
├── stores/
│   └── aiCoachStore.ts      # AI Coach state management
├── lib/
│   └── tracks.ts            # Track configuration
└── hooks/                   # Custom React hooks

supabase/functions/
├── generate-speech/         # AI script generation
├── generate-pitch/          # Pitch generation
├── structure-script/        # Script parsing
├── evaluate-hackathon-jury-pitch/ # Pitch evaluation
├── generate-hackathon-jury-questions/ # Jury Q&A
├── elevenlabs-tts/          # Text-to-speech
├── elevenlabs-stt/          # Speech-to-text
└── get-analytics/           # Usage analytics
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Database Schema

### `practice_sessions`
Stores AI coach practice recordings with:
- Transcription and accuracy scores
- Filler word counts and breakdown
- WPM and tone analysis
- Session grouping for trend tracking
- **Pitch events JSON** (v1.3) - detected structure elements
- **Primary issue analysis** (v1.3) - improvement recommendations
- **Structured script JSON** (v1.2) - parsed script sections

### `suggestion_analytics`
Tracks user interactions with AI suggestions for optimization.

---

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed release notes.

---

## License

MIT

---

Built with ❤️ using [Lovable](https://lovable.dev)
