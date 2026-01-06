# Changelog

All notable changes to PitchPal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-06

### Added
- Manual editing for speech script sections in "Your Speech Is Ready" dashboard
- Inline edit mode with save/cancel functionality for each script block
- Auto-clear audio cache when script content is modified

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
