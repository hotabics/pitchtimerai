# Contributing to PitchPal

Thank you for your interest in contributing! This document provides guidelines for development.

## Getting Started

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use semantic Tailwind tokens from design system (never hardcode colors)
- Keep components small and focused

### Component Structure
```tsx
// Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Types
interface Props {
  title: string;
}

// Component
export const MyComponent = ({ title }: Props) => {
  return <div>{title}</div>;
};
```

### Commit Messages
Use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests

### Pull Requests
1. Create a feature branch from `main`
2. Make your changes
3. Update CHANGELOG.md with your changes
4. Submit a PR with clear description

## Project Structure

```
src/
├── components/     # React components
│   ├── ui/        # Shadcn UI components
│   ├── steps/     # Wizard step components
│   └── landing/   # Landing page components
├── hooks/         # Custom React hooks
├── lib/           # Utilities
├── pages/         # Route pages
└── integrations/  # Backend integrations

supabase/
└── functions/     # Edge functions
```

## After Making Changes

**Important**: After each code change, update `CHANGELOG.md` with:
- Version bump if significant
- Description under appropriate section (Added/Changed/Fixed/Removed)
- Date of change

## Questions?

Open an issue for questions or suggestions.
