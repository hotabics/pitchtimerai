# Changelog

All notable changes to PitchPal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0] - 2026-01-12

### Added
- **AI Juror Text-to-Speech**: ElevenLabs TTS integration for the Interrogation Room
  - Unique voice personalities for each juror type (Mentor, Reviewer, Shark)
  - Juror-specific opening lines spoken aloud
  - "Replay Question" button to hear questions again
- **Real Speech-to-Text Responses**: ElevenLabs STT for user answer transcription
  - Real-time recording with waveform visualization
  - AI-powered response analysis for relevance, clarity, confidence, and depth
- **Review My Answers Section**: New expandable section in the Verdict
  - Shows each question-response pair with individual scores
  - Detailed breakdowns (relevance, clarity, confidence, depth)
  - Per-question AI feedback
  - Word count and filler word tracking
- **Interrogation Session Storage**: Database persistence for progress tracking
  - New `interrogation_sessions` table stores all session data
  - Questions, responses, analyses, and verdict saved
  - User progress history for trend tracking
- **Dynamic AI Questions**: Real AI-generated questions via edge function
  - Context-aware questions based on pitch dossier data
  - Escalating intensity (low → medium → high)
  - Category-based questioning (Problem, Solution, Market, Risk, Traction)
- New edge functions: `generate-interrogation-questions`, `analyze-interrogation-response`

### Changed
- Interrogation Room now connected to real pitch data from Dashboard
- Verdict now includes full response history for review

## [1.8.0] - 2026-01-09

### Added
- **Blog / Resources Page**: SEO-optimized content hub at `/blog`
  - 4 demo articles with strategic titles for organic traffic
  - Category filtering (Hackathon, Startup, Public Speaking, Technology)
  - Featured hero article layout with full-width display
  - Responsive grid (1 col mobile, 3 cols desktop)
- **Article Reader View**: Full article pages at `/blog/:id`
  - Large cover images with editorial typography
  - Sticky table of contents sidebar
  - Social sharing buttons (Twitter, LinkedIn, Copy Link)
  - Bottom CTA banner linking to AI Coach
- **Rebranding**: Renamed from "PitchDeck AI" to "PitchPerfect"
  - Updated all pages, components, and edge functions
  - New branding across headers, footers, and meta tags

### Changed
- Navigation "Features" link now properly scrolls to section from any page
- Blog added to main navigation and footer links

## [1.7.0] - 2026-01-08

### Added
- **Slide Deck Builder**: Full presentation creation and management system
  - Create, edit, reorder, and delete slides with drag-and-drop
  - Speaker notes field for each slide (visible in edit mode, hidden during presentation)
  - Slide thumbnails with real-time preview
- **PowerPoint Export**: Export presentations as `.pptx` files
  - Full PptxGenJS integration with title, content, bullet points, and speaker notes
  - Theme-aware export with proper styling
- **Slide Theme Customization**: Apply visual themes across all slides
  - Preset themes: Default, Ocean, Forest, Sunset, Midnight, Lavender
  - Custom color schemes for backgrounds, text, and accents
  - Font style options (modern, classic, playful)
- **Slide Import**: Import slides from existing presentations
  - Support for JSON and PPTX file formats
  - Drag-and-drop file upload dialog
  - Merge imported slides with existing deck
- **AI Image Generation for Slides**: Auto-generate relevant visuals
  - Uses image keyword field to create contextual backgrounds
  - OpenAI DALL-E integration via edge function
  - Per-slide image generation with loading states
- **Bulk Image Generation**: Generate images for all slides at once
  - Progress tracking with slide count
  - Skips slides that already have images
- **Slide Transition Effects**: Smooth presentation animations
  - Four transition types: Fade, Slide, Zoom, None
  - Framer Motion powered animations
  - Per-presentation transition selection
- New components: `SlideDeck`, `SlideEditor`, `SlidePreview`, `SpeakerNotesPanel`
- New components: `ThemeSelector`, `TransitionSelector`, `BulkImageGenerator`
- New components: `SlideImportDialog`, `SlideImageGenerator`, `DraggableThumbnail`
- New services: `pptxExport.ts`, `slideImport.ts`, `slideAI.ts`
- New edge function: `generate-slide-image`
- New store: `slidesStore.ts` with Zustand for slide state management

## [1.6.0] - 2026-01-07

### Added
- **Lazy Registration & Pricing System**: Complete monetization flow with tiered access
  - Three plans: Free, Hackathon Pass (€2.99/48h), Founder Pro (€9.99/mo)
  - Mock payment flow with 2-second processing simulation
  - Plan persistence in localStorage via Zustand store
  - User plan badge in header (Free/48h Pass/Pro Member) with gradient styling
- **48h Pass Countdown Timer**: Real-time countdown in header
  - Shows remaining time (e.g., "47h 23m")
  - Amber styling for normal state, red pulsing when < 2 hours remaining
  - Automatic expiration warning toast
- **Premium Analysis Unlock**: Feature gating for paid users
  - Glassmorphism paywall overlay on AI Coach results (Columns 2 & 3)
  - "PREMIUM ANALYSIS" gold badge for paid users
  - Deep analysis access checks throughout the app
- **Conditional PDF Watermark**: "Created with PitchPerfect" watermark for free users only
- **Stripe Integration Ready**: Edge functions for checkout, subscription check, and customer portal
- New `/pricing` page with animated pricing cards
- New `src/stores/userStore.ts` for global user state management
- New `src/components/PassCountdown.tsx` countdown timer component
- New `src/components/paywall/PaywallOverlay.tsx` for feature gating

### Changed
- Header now shows plan status badge for all users
- Pricing cards show "✓ Active Plan" for current subscription

### Removed
- Getting Started Tutorial popup and floating button (simplified onboarding)

## [1.5.0] - 2026-01-07

### Added
- **Enhanced URL Scraping with Firecrawl JSON Extraction**: Production Firecrawl API with structured data extraction
  - Extracts: company name, tagline, problem, solution, target audience
  - Additional fields: key features, pricing info, tech stack, team info, traction
  - AI-powered prompt for comprehensive pitch data extraction
  - Automatic audience detection (Investors, Academic, Hackathon)
  - New `firecrawl-scrape` edge function with JSON schema
- New `src/lib/api/firecrawl.ts` API client with extended data types

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
