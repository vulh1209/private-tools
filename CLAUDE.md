# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

## Architecture Overview

This is a Next.js 15.2.0 application using App Router with five specialized data conversion tools. The app follows a modular architecture where each tool is self-contained but shares common utilities and UI patterns.

### Core Application Structure

- **`src/app/page.tsx`**: Homepage with navigation cards to different tools
- **`src/app/layout.tsx`**: Root layout with theme provider and Geist font
- **`src/app/providers.tsx`**: Theme context with localStorage persistence
- **`src/app/utils/processing.ts`**: Centralized data processing utilities for all conversions

### Tool Organization

Each conversion tool follows the same pattern:
1. **JSON ↔ CSV/Excel**: Basic bidirectional conversion with type preservation
2. **Data Mapper**: Complex multi-file processor with reward calculations
3. **Data Mapper V2**: Visual drag-drop interface using react-xarrows
4. **Compare Files**: Side-by-side JSON comparison with delta calculations

### Key Dependencies and Their Roles

- **papaparse**: CSV parsing and generation - handles all CSV operations
- **xlsx**: Excel file processing - supports XLS and XLSX formats
- **react-dropzone**: File upload interface - used across all tools
- **react-xarrows**: Visual connections in data mapper v2

## Critical Data Processing Patterns

### Type Preservation System
The app has a sophisticated type preservation system for numeric strings (especially important for token IDs with leading zeros). Functions in `processing.ts` use `shouldPreserveAsString()` and `preserveDataTypes()` to maintain data integrity.

### Error Handling Convention
All tools follow the same error handling pattern:
- User-friendly error messages displayed in UI
- Detailed console logging for debugging
- Graceful fallbacks when parsing fails

### File Processing Pipeline
Standard workflow across all tools:
1. File upload via drag-drop or selection
2. Automatic format detection
3. Data parsing with error handling
4. Optional type preservation
5. Preview generation
6. Conversion processing
7. Automatic download generation

## Theme System Architecture

The app uses a custom theme system with:
- Context-based state management in `providers.tsx`
- CSS custom properties for seamless light/dark switching
- LocalStorage persistence with system preference detection
- `ThemeToggle` component used across all pages

## Component Patterns

### Shared UI Elements
- Consistent drag-drop zones with visual feedback
- Color-coded status messages (green/red)
- Responsive grid layouts
- Reset functionality on all tools

### Data Mapper V2 Specifics
Uses `react-xarrows` for visual field connections with:
- Memoized components for performance
- Recursive data structure processing
- Real-time connection visualization

## Important File Locations

- **Global utilities**: `src/app/utils/processing.ts`
- **Theme components**: `src/app/components/ThemeToggle.tsx`
- **Style configuration**: `src/app/globals.css` (uses Tailwind CSS v4)
- **Type definitions**: Inline TypeScript interfaces in `processing.ts`

## Development Notes

- All tools support both single and batch file processing
- Leading zero preservation is critical for token ID handling
- React 19 is used with Next.js 15.2.0 and Turbopack for development
- TypeScript is used throughout with comprehensive type coverage

## Note 
- Reply in Vietnamese
- Code & comment in English