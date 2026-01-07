# Changelog

All notable changes to PitchPal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-01-07

### Added
- **Hackathon Jury Pitch Evaluation Engine v1**: Automated pitch structure analysis for hackathon tracks
- Event detectors for: Problem statement, Innovation/Differentiation, Technical feasibility, Business model, Solution intro
- Primary issue selection with priority ranking and severity scoring
- "Next Improvement" coaching card with evidence timestamps and actionable next steps
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
