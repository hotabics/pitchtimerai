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
   - Speech-to-text transcription analysis
   - Accuracy scoring with highlighted matches/misses
   - Filler word detection and breakdown
   - WPM and pacing feedback
   - Tone analysis (confident, nervous, rushed, etc.)
   - Practice history with trend charts

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Animation**: Framer Motion
- **Backend**: Supabase (Lovable Cloud)
- **AI/Voice**: ElevenLabs TTS/STT, Lovable AI
- **Charts**: Recharts
- **PDF**: jsPDF

---

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx        # Main post-generation dashboard
│   ├── SpeechCoach.tsx      # AI recording & analysis
│   ├── steps/               # Wizard step components
│   │   ├── Step1Hook.tsx    # Landing page
│   │   ├── Step2Audience.tsx # Audience selection
│   │   ├── Step7Generation.tsx # Final generation
│   │   └── tracks/          # Track-specific steps
│   ├── landing/             # Landing page components
│   └── ui/                  # shadcn/ui components
├── pages/
│   └── Index.tsx            # Main wizard orchestrator
├── lib/
│   └── tracks.ts            # Track configuration
└── hooks/                   # Custom React hooks

supabase/functions/
├── generate-speech/         # AI script generation
├── elevenlabs-tts/          # Text-to-speech
├── elevenlabs-stt/          # Speech-to-text
└── generate-pitch/          # Pitch generation
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

### `suggestion_analytics`
Tracks user interactions with AI suggestions for optimization.

---

## License

MIT

---

Built with ❤️ using [Lovable](https://lovable.dev)
