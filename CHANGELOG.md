# Changelog

All notable changes to PitchPal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2026-01-07

### Added
- **Real URL Scraping with Firecrawl**: Replaced mock scraper with production Firecrawl API
  - Extracts project name, problem, and solution from any website
  - Intelligent content parsing with keyword-based extraction
  - Automatic audience detection (Investors, Academic, Hackathon)
  - New `firecrawl-scrape` edge function for secure API calls
- **Getting Started Tutorial**: Interactive onboarding for first-time users
  - 6-step guided tour of key features
  - Progress dots with navigation
  - Persists completion state in localStorage
  - Skip option for returning users
- New `src/lib/api/firecrawl.ts` API client for Firecrawl integration
- New `GettingStartedTutorial.tsx` component with animations

## [1.4.0] - 2026-01-07

### Added
- **Professional Teleprompter Overlay**: Full-screen teleprompter during AI Coach recording
  - Auto-scrolling with play/pause control
  - Adjustable scroll speed slider
  - "Reading Zone" indicator with gradient highlights
  - Semi-transparent dark background for optimal readability
- **Real-Time Feedback HUD**: Heads-up display during recording
  - Eye contact detection (Locked On / Looking Away)
  - Live audio level meter
  - Smile detection indicator
  - System status with recording timer
- **Face Mesh Rendering Improvements**: Cyan high-tech mesh overlay with proper transparency
- **Keyboard Shortcuts**: Space to toggle teleprompter, Escape to cancel recording
- **URL Scraping & Magic Input**: Paste a URL to auto-extract project data
  - Intelligent input detection (URL vs text)
  - "Scanning Website..." animation with scraping
  - Auto-fill project name, problem, and solution fields
- **"Auto-Generate Pitch ⚡" Feature**: One-click instant pitch generation
  - Full-screen AI processing overlay with step animations
  - Skips wizard entirely and jumps to Dashboard
  - Randomly selects optimal track and tone
- New `mockScraper.ts` service for URL detection (fallback)
- New `AutoGenerateOverlay.tsx` component for instant generation flow

## [1.3.0] - 2026-01-07

### Added
- **Hackathon Jury Pitch Evaluation Engine v1**: Automated pitch structure analysis for hackathon tracks
- Event detectors for: Problem statement, Innovation/Differentiation, Technical feasibility, Business model, Solution intro
- Primary issue selection with priority ranking and severity scoring
- "Next Improvement" coaching card with evidence timestamps and actionable next steps
- **Visual pitch structure timeline** showing where each detected event occurs in the recording
- New `evaluate-hackathon-jury-pitch` edge function
- Database fields: `events_json`, `primary_issue_key`, `primary_issue_json`
- Word-level timestamps in STT for precise event detection

## [1.2.0] - 2026-01-06

### Added
- "Practice Your Own Pitch" entry path - users can now paste their own script
- Custom script input with word count and estimated time validation (max 3 min / 450 words)
- AI-powered script structuring into logical sections (Opening, Problem, Solution, etc.)
- New `structure-script` edge function for intelligent script parsing
- Database fields: `entry_mode`, `original_script_text`, `structured_script_json`

## [1.1.0] - 2026-01-06

### Added

## [1.0.0] - 2026-01-05

### Added
- **Smart Onboarding Wizard**: Multi-step wizard with track selection (Hackathon, Investor, Academic, Grandma, Peers)
- **Time-Slicer Technology**: Visual time allocation tool for balancing pitch sections
- **AI-Powered Script Generation**: Dynamic pitch script creation using AI models
- **Practice Dashboard**: View generated scripts with section breakdown
- **Practice Mode**: Record and practice delivering pitches
- **AI Speech Coach**: Real-time feedback on WPM, filler words, and delivery
- **Speech-to-Text**: ElevenLabs integration for transcription
- **Text-to-Speech**: Audio playback for generated scripts
- **Analytics Dashboard**: Admin view for tracking usage patterns
- **Suggestion Analytics**: Track which AI suggestions users select
- **Practice Sessions**: Store and review practice history

### Technical
- React + TypeScript + Vite setup
- Tailwind CSS with custom design system
- Supabase backend integration
- Edge functions for AI processing
- Rate limiting and input validation
