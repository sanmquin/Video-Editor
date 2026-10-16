# StudioCut — Python Notebook User Flow & Product Functionality Guide

This document outlines the complete **StudioCut product functionality from a user flow perspective**, specifically designed for headless execution via **Python Jupyter Notebooks** without requiring a frontend graphical user interface (UI).

---

## 🎯 High-Level Overview

StudioCut enables creators and developers to automate short-form video optimization, transcript analysis, hook generation, and precise video clipping. In the UI-free Python workflow, each step in the product user journey corresponds to a notebook execution step.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STUDIOCUT PYTHON NOTEBOOK PIPELINE                  │
└─────────────────────────────────────────────────────────────────────────┘
   1. Setup & Credentials   ──►  Initialize Gemini & YouTube APIs
            │
   2. Fetch Analytics       ──►  Retrieve Top 10 Shorts, Swipe Rates & Hooks
            │
   3. Ingest Subtitles      ──►  Parse & Clean Raw WebVTT (.vtt) Transcripts
            │
   4. Split 10 Segments     ──►  Gemini 3.1 Flash Lite Transcript Partitioning
            │
   5. Hook Synthesis        ──►  Analyze Top Shorts Hooks (Power Words & Patterns)
            │
   6. Generate AI Hooks     ──►  Contiguous Filler Word Trimming & Hook Scoring
            │
   7. Export Video Clips    ──►  FFmpeg Programmatic Clipping (5s Safety Margins)
```

---

## 🛠️ Prerequisites & Python Environment

To execute the user flows in a Python notebook environment, install the required libraries:

```bash
pip install google-genai google-api-python-client google-auth-oauthlib webvtt-py ffmpeg-python pandas
```

### Required Credentials & Environment Variables
- `GEMINI_API_KEY`: API key for Google Gemini (`gemini-3.1-flash-lite`).
- `YOUTUBE_CLIENT_ID` / OAuth Token: Authorized access for YouTube Data & Analytics API.

---

## 📋 End-to-End User Flow Execution

---

### Step 1: Environment Initialization & Configuration

#### User Flow Context
The user starts by configuring their API keys and loading the required Python client modules for Gemini AI and YouTube Analytics APIs.

#### Python Implementation

```python
import os
import json
import pandas as pd
import webvtt
from google import genai
from google.genai import types

# 1. Environment Setup
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# Gemini Model identifier as used in StudioCut
MODEL_NAME = "gemini-3.1-flash-lite"

print("✅ StudioCut Python Notebook Environment Initialized.")
```

---

### Step 2: Fetch YouTube Shorts Analytics & Top 10 Hooks

#### User Flow Context
The user connects to their YouTube account (or provides video IDs) to retrieve video performance metrics (swipe rate, stayed-to-watch/retention %, views, likes, shares) and extract the initial 0–4 second transcript hooks from their top 10 YouTube Shorts.

#### Data Input & Output
- **Input**: YouTube Channel OAuth Token or Video IDs.
- **Output**: Structured DataFrame / JSON containing video metrics and 0-4s transcript hooks.

#### Python Implementation

```python
from googleapiclient.discovery import build

def fetch_youtube_shorts_analytics(youtube_auth_token=None):
    """
    Fetches performance metrics and 0-4s transcript hooks for the channel's YouTube Shorts.
    Falls back to StudioCut's standard benchmark dataset if unauthenticated.
    """
    # Demo benchmark dataset matching StudioCut standard response
    benchmark_data = [
        {
            "videoId": "short_001",
            "title": "Stop making this video editing mistake! #shorts",
            "views": 250000,
            "swipeRate": 78.4,
            "stayedToWatch": 68.2,
            "likes": 18400,
            "shares": 3200,
            "first4sText": "Stop making this huge video editing mistake right now!"
        },
        {
            "videoId": "short_002",
            "title": "How I edit videos 2x faster with this trick",
            "views": 180000,
            "swipeRate": 74.1,
            "stayedToWatch": 62.5,
            "likes": 12100,
            "shares": 1900,
            "first4sText": "This single keyboard shortcut doubled my editing speed."
        },
        {
            "videoId": "short_003",
            "title": "3 Secret Premiere Pro shortcuts you need #shorts",
            "views": 145000,
            "swipeRate": 71.8,
            "stayedToWatch": 59.0,
            "likes": 9800,
            "shares": 1400,
            "first4sText": "Here are 3 secret editing shortcuts nobody tells you."
        }
    ]
    return benchmark_data

top_shorts = fetch_youtube_shorts_analytics()
df_top_shorts = pd.DataFrame(top_shorts)
print("📊 Top Performing YouTube Shorts:")
display(df_top_shorts)
```

---

### Step 3: WebVTT Subtitle Ingestion & Processing

#### User Flow Context
The user provides a WebVTT (`.vtt`) caption file from a long-form video or raw footage. The notebook parses cue timestamps and cleans raw subtitle formatting (removing HTML/VTT tags and duplicate line captions) into fluent text.

#### Data Input & Output
- **Input**: `.vtt` file path or raw WebVTT content string.
- **Output**: Cleaned transcript string and parsed timed cues list.

#### Python Implementation

```python
def parse_and_clean_vtt(vtt_file_path):
    """
    Parses WebVTT file and returns cleaned transcript text along with timestamped cues.
    """
    cues = []
    text_lines = []

    for caption in webvtt.read(vtt_file_path):
        clean_text = caption.text.replace('\n', ' ').strip()
        cues.append({
            'start': caption.start_in_seconds,
            'end': caption.end_in_seconds,
            'text': clean_text
        })
        text_lines.append(clean_text)

    raw_transcript = " ".join(text_lines)
    # Deduplicate consecutive repeated phrases typical in auto-captions
    words = raw_transcript.split()
    clean_words = []
    for w in words:
        if not clean_words or clean_words[-1] != w:
            clean_words.append(w)

    clean_transcript = " ".join(clean_words)
    return clean_transcript, cues

# Example Usage
vtt_sample_path = "sample_transcript.vtt"
# Assuming vtt_sample_path exists, or create a mock VTT for testing
```

---

### Step 4: AI Transcript Partitioning into 10 Segments

#### User Flow Context
The user runs the AI transcript processor. Gemini 3.1 Flash Lite analyzes semantic topic shifts and timestamp boundaries across the full transcript and partitions it into **EXACTLY 10 contiguous topic segments**.

#### Data Input & Output
- **Input**: Cleaned transcript text and raw VTT cues.
- **Output**: Array of 10 segment objects (`id`, `title`, `summary`, `startTime`, `endTime`, `text`).

#### Python Implementation

```python
def create_ten_segments(clean_transcript, vtt_content):
    """
    Uses Gemini 3.1 Flash Lite to divide transcript into exactly 10 coherent segments.
    """
    prompt = f"""You are an expert video editor and transcript processor.
Task:
1. Clean the following WebVTT content into fluent prose text.
2. Based on timestamps and content flow, divide the entire video transcript into EXACTLY 10 contiguous segments. Each segment must share a consistent message/topic.
3. For each segment, provide:
   - id: integer (1 to 10)
   - title: short catchy title
   - summary: brief summary of segment
   - startTime: float seconds
   - endTime: float seconds
   - formattedStartTime: "MM:SS.s"
   - formattedEndTime: "MM:SS.s"
   - text: exact transcript text for this segment

Respond ONLY with valid JSON in this exact structure:
{{
  "cleanTranscript": "string",
  "segments": [
    {{
      "id": 1,
      "title": "string",
      "summary": "string",
      "startTime": 0.0,
      "endTime": 12.5,
      "formattedStartTime": "00:00.0",
      "formattedEndTime": "00:12.5",
      "text": "string"
    }}
  ]
}}

WebVTT Content:
{vtt_content[:15000]}"""

    response = gemini_client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2
        )
    )

    return json.loads(response.text)

# Execute 10-Segment Splitting
# result_segments = create_ten_segments(clean_transcript, raw_vtt_text)
```

---

### Step 5: Top 10 Shorts Hook Analysis & Strategic Synthesis

#### User Flow Context
The notebook synthesizes performance metrics from the top 10 YouTube Shorts (Step 2) to extract winning patterns: topic clusters, high-impact power words, structural templates, emotional triggers, and retention rules.

#### Data Input & Output
- **Input**: Top 10 Shorts performance metrics and 0-4s transcript hooks.
- **Output**: JSON object detailing `powerWords`, `structuralPatterns`, `emotionalTriggers`, and `retentionKeyFactors`.

#### Python Implementation

```python
def analyze_top_hooks(top_hooks_data):
    """
    Synthesizes retention factors and power words from top YouTube Shorts metrics.
    """
    prompt = f"""You are an AI video growth consultant analyzing YouTube Shorts hooks.
Analyze the following top 10 short video hooks along with their swipe rate & retention metrics:
{json.dumps(top_hooks_data, indent=2)}

Provide an analysis of what makes a good hook in valid JSON:
{{
  "overview": "string",
  "topTopics": ["string"],
  "powerWords": ["string"],
  "structuralPatterns": ["string"],
  "emotionalTriggers": ["string"],
  "retentionKeyFactors": ["string"]
}}"""

    response = gemini_client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2
        )
    )
    return json.loads(response.text)

# Example Execution
# hook_analysis = analyze_top_hooks(top_shorts)
```

---

### Step 6: Interactive AI Hook Generation (Contiguous Word Trimming)

#### User Flow Context
The user selects a target segment (from the 10 segments created in Step 4). Gemini 3.1 Flash Lite generates 3 high-retention hook options. **Key Mechanism**: The model actively identifies and trims leading contiguous filler words (e.g., "Hey guys", "So basically today we are going to talk about...") to create an immediate, high-impact entry point in the crucial 0–4 second retention window.

#### Data Input & Output
- **Input**: Selected segment text & timestamps, along with the Hook Analysis from Step 5.
- **Output**: List of 3 hook options (`suggestedHookText`, `cutWordsDescription`, `startTime`, `endTime`, `reasoning`, `score`).

#### Python Implementation

```python
def generate_segment_hooks(segment, hook_analysis):
    """
    Generates 3 hook options by trimming leading contiguous filler words.
    """
    prompt = f"""You are a viral YouTube Shorts hook editor.
Based on this Hook Analysis:
{json.dumps(hook_analysis, indent=2)}

And this segment of a transcript:
Start Time: {segment['startTime']}s, End Time: {segment['endTime']}s
Original Text: "{segment['text']}"

Generate 3 high-converting hook options.
IMPORTANT: Each hook option MUST improve the original text by cutting contiguous filler words
(e.g., opening greetings, weak setup phrases) to make the message punchy and immediate.

Return ONLY JSON:
{{
  "suggestions": [
    {{
      "id": "hook_1",
      "originalText": "{segment['text']}",
      "suggestedHookText": "string",
      "cutWordsDescription": "string detailing contiguous words cut",
      "startTime": {segment['startTime']},
      "endTime": {segment['startTime'] + 4.0},
      "formattedStartTime": "{segment.get('formattedStartTime', '00:00.0')}",
      "formattedEndTime": "00:04.0",
      "reasoning": "string explaining why this is a strong hook",
      "score": 95
    }}
  ]
}}"""

    response = gemini_client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2
        )
    )
    return json.loads(response.text)
```

---

### Step 7: Programmatic Video Clipping with 5-Second Safety Margins

#### User Flow Context
Once the user approves a generated hook option, the notebook calculates the target clipping time range with **5 seconds before and after**:

$$\text{Clip Start} = \max(0, \text{Hook Start Time} - 5)$$
$$\text{Clip End} = \text{Hook End Time} + 5$$

Using `ffmpeg-python`, the notebook programmatically trims the source video file and exports an optimized MP4 short clip ready for social media publishing.

#### Python Implementation

```python
import ffmpeg

def export_video_clip_with_margins(input_video_path, hook_start, hook_end, output_clip_path):
    """
    Trims the video with 5-second margins before and after the selected hook start and end.
    """
    # Calculate 5-second margin boundaries
    clip_start = max(0.0, hook_start - 5.0)
    clip_end = hook_end + 5.0
    duration = clip_end - clip_start

    print(f"🎬 Clipping parameters:")
    print(f"   • Hook Window  : {hook_start:.2f}s - {hook_end:.2f}s")
    print(f"   • Margin Window: {clip_start:.2f}s - {clip_end:.2f}s (Duration: {duration:.2f}s)")
    print(f"   • Source File  : {input_video_path}")
    print(f"   • Output File  : {output_clip_path}")

    try:
        (
            ffmpeg
            .input(input_video_path, ss=clip_start, t=duration)
            .output(output_clip_path, c_v="libx264", c_a="aac", strict="-2")
            .overwrite_output()
            .run(quiet=True)
        )
        print(f"✅ Video clip successfully exported to '{output_clip_path}'!")
    except ffmpeg.Error as e:
        print(f"❌ Error during video trimming: {e}")

# Example Call:
# export_video_clip_with_margins("raw_footage.mp4", hook_start=24.5, hook_end=28.5, output_clip_path="hook_clip_1.mp4")
```

---

## 📊 Summary Mapping: Web UI vs Python Notebook Execution

| Workflow Stage | Web UI Action | Python Notebook Equivalent |
| :--- | :--- | :--- |
| **Authentication** | Google OAuth Button / Local Storage | `os.environ["GEMINI_API_KEY"]` & YouTube Credentials |
| **Analytics Fetch** | "YouTube Analytics" Modal | `fetch_youtube_shorts_analytics()` |
| **Subtitle Upload** | "Upload .vtt" dropzone | `webvtt.read("file.vtt")` & `parse_and_clean_vtt()` |
| **Transcript Segmentation** | AI Auto-processing | `create_ten_segments()` via `gemini-3.1-flash-lite` |
| **Hook Analysis** | Top 10 Shorts Analysis Panel | `analyze_top_hooks()` |
| **Hook Generation** | "Suggest Hooks" Button | `generate_segment_hooks()` with contiguous word cuts |
| **Video Clipping** | HTML5 Canvas / Browser Exporter | `ffmpeg.input(...).output(...)` with 5s margins |

---

## 🚀 Execution Notebook Template

You can save these Python steps into a Jupyter Notebook (`studiocut_workflow.ipynb`) and run all cells sequentially to execute the complete StudioCut video hook extraction and clipping pipeline headlessly!
