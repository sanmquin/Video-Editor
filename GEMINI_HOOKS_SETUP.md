# Gemini 3.1 Flash Lite - AI Hook Finder Setup & Architecture

This document provides setup instructions and workflow documentation for the **AI Hook Finder** feature powered by **Gemini 3.1 Flash Lite** (`gemini-3.1-flash-lite`).

---

## Overview

The AI Hook Finder helps video creators turn raw `.vtt` subtitles into high-retention video clips and short-form hooks.

### 5-Step Workflow Architecture

1. **VTT Subtitle Upload**:
   - The user uploads a standard WebVTT (`.vtt`) file.
2. **LLM Transcript Cleaning & 10 Segment Splitting**:
   - Gemini 3.1 Flash Lite cleans raw subtitle cues into fluent prose text.
   - Using timestamp boundaries and semantic context, the transcript is partitioned into **10 distinct segments**, each representing a cohesive topic/message.
3. **Top 10 YouTube Shorts Hook Analysis**:
   - Synthesizes performance metrics (swipe rate, retention percentage, stayed-to-watch ratio) from top 10 YouTube Shorts.
   - Extracts winning patterns: topic clusters, high-impact power words, structural templates, emotional triggers, and retention rules.
4. **Interactive Hook Generation (Contiguous Word Cuts)**:
   - When a segment is selected, Gemini 3.1 Flash Lite creates multiple hook options.
   - **Key Feature**: Hooks trim leading/contiguous filler words (hesitations, intro greetings) to jump straight into high-impact value statements.
   - Each option provides:
     - Suggested Hook Text
     - Description of Contiguous Words Trimmed
     - Target Timestamps (`startTime`, `endTime`)
     - Strategic Reasoning on why it holds retention
     - Hook Score (0–100)
5. **Local Video Clipping with 5-Second Margins**:
   - The user uploads/selects a local video file (`.mp4`, `.webm`, `.mov`).
   - The application calculates a target clip range with **5 seconds before and after**:
     $$\text{Clip Start} = \max(0, \text{Hook Start Time} - 5)$$
     $$\text{Clip End} = \text{Hook End Time} + 5$$
   - The video is trimmed and exported directly in-browser using HTML5 Canvas / MediaRecorder, with a preview player and download option.

---

## Setup & Configuration

### Environment Variables

Set the `GEMINI_API_KEY` in your environment or `.env` file (for Netlify functions / Vite server):

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Model Specifications

- **Model Identifier**: `gemini-3.1-flash-lite`
- **Fallback Models**: `gemini-1.5-flash`, `gemini-2.0-flash-lite`
- **Response Format**: `application/json` (Structured JSON Outputs)

---

## API Endpoints & Middleware

Netlify function handler: `/netlify/functions/find-hooks.ts`
Vite Dev Middleware: `vite.config.ts` handles `/.netlify/functions/find-hooks`.

### Actions Handled:
- `process_vtt`: Accepts `{ vttContent }`, returns cleaned transcript + 10 segments.
- `analyze_hooks`: Accepts `{ topHooks }`, returns hook analysis metrics.
- `suggest_hooks`: Accepts `{ segment, hookAnalysis }`, returns hook options with word cuts and reasoning.

---

## Testing & Verification

1. Start development server: `npm run dev`
2. Click **Find Hooks** in the top navigation header.
3. Click **"Or load sample demo VTT file"** or upload a `.vtt` file.
4. Select a segment, view AI suggested hooks with contiguous word cuts, and process a local video file with 5-second margins.
