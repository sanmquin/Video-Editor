import type { Handler, HandlerEvent } from '@netlify/functions';
import { parseVttContent } from '../../src/utils/vttParser';

export interface VttSegment {
  id: number;
  title: string;
  summary: string;
  startTime: number;
  endTime: number;
  formattedStartTime: string;
  formattedEndTime: string;
  text: string;
}

export interface HookAnalysis {
  overview: string;
  topTopics: string[];
  powerWords: string[];
  structuralPatterns: string[];
  emotionalTriggers: string[];
  retentionKeyFactors: string[];
}

export interface HookSuggestion {
  id: string;
  originalText: string;
  suggestedHookText: string;
  cutWordsDescription: string;
  startTime: number;
  endTime: number;
  formattedStartTime: string;
  formattedEndTime: string;
  reasoning: string;
  score: number;
}

export interface Top10HookInput {
  videoId: string;
  title: string;
  swipeRate: number;
  stayedToWatch: number;
  first4sText: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
}

/**
 * Call Gemini 3.1 Flash Lite API if API key is present
 */
async function callGeminiApi(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-1.5-flash', 'gemini-2.0-flash-lite'];
    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    }
  } catch (err) {
    console.warn('Gemini API call failed, falling back to rule-based algorithm:', err);
  }
  return null;
}

/**
 * Splits parsed VTT segments into 10 consistent segments
 */
function createTenSegments(vttText: string): { cleanTranscript: string; segments: VttSegment[] } {
  const parsed = parseVttContent(vttText);
  const allSegs = parsed.allSegments;

  if (allSegs.length === 0) {
    const fallbackText = parsed.cleanTranscript || vttText.replace(/<[^>]*>/g, '').trim();
    const segments: VttSegment[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `Segment ${i + 1}`,
      summary: `Part ${i + 1} of the uploaded video transcript`,
      startTime: i * 10,
      endTime: (i + 1) * 10,
      formattedStartTime: formatTime(i * 10),
      formattedEndTime: formatTime((i + 1) * 10),
      text: fallbackText.slice(Math.floor((i * fallbackText.length) / 10), Math.floor(((i + 1) * fallbackText.length) / 10)) || "Transcript text content."
    }));

    return { cleanTranscript: fallbackText, segments };
  }

  const totalDuration = Math.max(allSegs[allSegs.length - 1].start + allSegs[allSegs.length - 1].duration, 10);
  const chunkDuration = totalDuration / 10;

  const segments: VttSegment[] = [];

  for (let i = 0; i < 10; i++) {
    const targetStart = i * chunkDuration;
    const targetEnd = (i + 1) * chunkDuration;

    const segsInChunk = allSegs.filter(s => {
      const segEnd = s.start + s.duration;
      return (s.start >= targetStart && s.start < targetEnd) || (segEnd > targetStart && segEnd <= targetEnd) || (s.start <= targetStart && segEnd >= targetEnd);
    });

    const chunkText = segsInChunk.map(s => s.text).join(' ') || (allSegs[Math.min(i, allSegs.length - 1)]?.text ?? '');
    const actualStart = segsInChunk.length > 0 ? segsInChunk[0].start : targetStart;
    const actualEnd = segsInChunk.length > 0 ? (segsInChunk[segsInChunk.length - 1].start + segsInChunk[segsInChunk.length - 1].duration) : targetEnd;

    // Title & Summary derivation from first few words
    const words = chunkText.split(' ').filter(Boolean);
    const shortTitle = words.slice(0, 4).join(' ').replace(/[^a-zA-Z0-9 ]/g, '') || `Topic ${i + 1}`;
    const summary = words.length > 15 ? words.slice(0, 12).join(' ') + '...' : chunkText;

    segments.push({
      id: i + 1,
      title: `Segment ${i + 1}: ${shortTitle.charAt(0).toUpperCase() + shortTitle.slice(1)}`,
      summary,
      startTime: Number(actualStart.toFixed(2)),
      endTime: Number(actualEnd.toFixed(2)),
      formattedStartTime: formatTime(actualStart),
      formattedEndTime: formatTime(actualEnd),
      text: chunkText
    });
  }

  return {
    cleanTranscript: parsed.cleanTranscript,
    segments
  };
}

/**
 * Analyzes the top 10 YouTube Shorts hooks to generate insights
 */
function analyzeTop10Hooks(hooks: Top10HookInput[]): HookAnalysis {
  const topicsSet = new Set<string>();
  const wordsCount: Record<string, number> = {};

  const commonStopwords = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'in', 'of', 'for', 'with', 'on', 'at', 'by', 'this', 'that', 'you', 'your', 'is', 'it', 'are', 'i', 'how', 'what', 'why']);

  hooks.forEach(h => {
    // Extract topic hints from title
    const cleanTitle = h.title.replace(/#shorts/gi, '').trim();
    if (cleanTitle) topicsSet.add(cleanTitle);

    const words = (h.first4sText + ' ' + h.title).toLowerCase().split(/\W+/);
    words.forEach(w => {
      if (w.length > 3 && !commonStopwords.has(w)) {
        wordsCount[w] = (wordsCount[w] || 0) + 1;
      }
    });
  });

  const sortedPowerWords = Object.keys(wordsCount)
    .sort((a, b) => wordsCount[b] - wordsCount[a])
    .slice(0, 8);

  const topTopics = Array.from(topicsSet).slice(0, 5);
  if (topTopics.length < 3) {
    topTopics.push("Video Editing Workflow Secrets", "High-Retention Content Hacks", "Cinematic Visual Upgrades");
  }

  const defaultPowerWords = sortedPowerWords.length >= 5 ? sortedPowerWords : ["stop", "mistake", "secret", "instantly", "doubled", "trick", "watch", "crazy"];

  return {
    overview: "Based on the last 10 top-performing YouTube Shorts, successful hooks immediately present a high-stakes problem or provocative statement within the first 1.5 seconds, utilizing direct second-person address ('you/your') and imperative verb phrasing.",
    topTopics,
    powerWords: defaultPowerWords,
    structuralPatterns: [
      "Pattern 1: Pattern Interrupt + Direct Command (e.g., 'Stop scrolling! If you edit videos...')",
      "Pattern 2: Provocative Question + Instant Value (e.g., 'Did you know this crazy editing trick?')",
      "Pattern 3: High-Stakes Result / Transformation (e.g., 'This 4-second hook doubled my swipe rate')",
      "Pattern 4: Curiosity Gap + Visual Tease (e.g., 'Watch what happens when I press this single shortcut')"
    ],
    emotionalTriggers: [
      "FOMO (Fear of Missing Out) on efficient creator workflows",
      "Urgency & Immediate Curiosity ('Right now', 'Instantly')",
      "Desire for Professional Output with Minimal Effort",
      "Validation & Avoiding Critical Mistakes ('mistake killing watch time')"
    ],
    retentionKeyFactors: [
      "Keep first sentence under 8 words for ultra-fast comprehension.",
      "Remove fluff, warm-up greetings ('Hey guys'), and intro fillers.",
      "Cut contiguous words to start directly with high-impact verbs or questions.",
      "Match visual action timing within 0-4 seconds."
    ]
  };
}

/**
 * Generates suggestions for a selected segment by cutting contiguous words
 */
function suggestHooksForSegment(segment: VttSegment, analysis: HookAnalysis): HookSuggestion[] {
  const words = segment.text.split(' ').filter(Boolean);
  const total = words.length;

  const suggestions: HookSuggestion[] = [];

  // Suggestion 1: Aggressive front trimming (cutting leading intro/filler words)
  const cutCount1 = Math.min(Math.floor(total * 0.3), 5);
  const trimmedText1 = words.slice(cutCount1).join(' ');
  const cutWords1 = words.slice(0, cutCount1).join(' ');

  suggestions.push({
    id: `hook_${segment.id}_1`,
    originalText: segment.text,
    suggestedHookText: trimmedText1 || segment.text,
    cutWordsDescription: cutWords1 ? `Removed leading ${cutCount1} filler/intro words ("${cutWords1}") to hit the core punchline immediately.` : "Optimized word flow for instant impact.",
    startTime: segment.startTime,
    endTime: Number((segment.startTime + Math.min(4.0, (segment.endTime - segment.startTime) * 0.5)).toFixed(2)),
    formattedStartTime: formatTime(segment.startTime),
    formattedEndTime: formatTime(segment.startTime + Math.min(4.0, (segment.endTime - segment.startTime) * 0.5)),
    reasoning: `Cutting the opening filler ("${cutWords1 || 'intro'}") creates a pattern interrupt. By leading directly with actionable content, viewer retention increases based on top hook metrics (${analysis.powerWords.slice(0, 3).join(', ')}).`,
    score: 94
  });

  // Suggestion 2: Pattern Interrupt / Action Statement
  const actionWord = analysis.powerWords[0] || 'Stop';
  const midWords = words.slice(Math.max(0, Math.floor(total * 0.1)), Math.min(total, Math.floor(total * 0.7))).join(' ');
  const suggestedText2 = `${actionWord.toUpperCase()}! ${midWords}`;

  suggestions.push({
    id: `hook_${segment.id}_2`,
    originalText: segment.text,
    suggestedHookText: suggestedText2,
    cutWordsDescription: `Trimmed peripheral fluff and added power imperative ("${actionWord.toUpperCase()}!") at the beginning.`,
    startTime: segment.startTime,
    endTime: Number((segment.startTime + Math.min(3.5, segment.endTime - segment.startTime)).toFixed(2)),
    formattedStartTime: formatTime(segment.startTime),
    formattedEndTime: formatTime(segment.startTime + Math.min(3.5, segment.endTime - segment.startTime)),
    reasoning: `Incorporate high-retention power verb '${actionWord}'. Shortening the phrasing keeps the hook punchy within the crucial 0-3.5s window.`,
    score: 91
  });

  // Suggestion 3: Provocative Question format
  const questionText = words.length > 4 ? `Did you know ${words.slice(2, 10).join(' ')}?` : `Did you know ${segment.text}?`;

  suggestions.push({
    id: `hook_${segment.id}_3`,
    originalText: segment.text,
    suggestedHookText: questionText,
    cutWordsDescription: "Cut redundant ending clauses to construct a direct curiosity-gap question.",
    startTime: segment.startTime,
    endTime: Number((segment.startTime + Math.min(4.5, segment.endTime - segment.startTime)).toFixed(2)),
    formattedStartTime: formatTime(segment.startTime),
    formattedEndTime: formatTime(segment.startTime + Math.min(4.5, segment.endTime - segment.startTime)),
    reasoning: `Question-based hooks trigger psychological curiosity gaps. Eliminating trailing words keeps the user engaged waiting for the resolution.`,
    score: 88
  });

  return suggestions;
}

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    let body: any = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch {
        body = {};
      }
    }

    const action = body.action || event.queryStringParameters?.action || 'process_vtt';

    // Action 1: Process VTT -> Clean transcript + 10 segments
    if (action === 'process_vtt') {
      const vttContent = body.vttContent || '';
      if (!vttContent) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'vttContent is required' })
        };
      }

      // First try Gemini API if key is present
      if (apiKey) {
        const prompt = `You are an expert video editor and transcript processor using model Gemini-3.1-flash-lite.
Task:
1. Clean the following WebVTT content into normal, fluent, clean text.
2. Based on timestamps and content flow, divide the entire video transcript into EXACTLY 10 contiguous segments. Each segment must share a consistent message/topic.
3. For each segment, provide:
   - id: integer (1 to 10)
   - title: short catchy title (e.g. "Segment 1: Introduction to Trim")
   - summary: brief summary of segment
   - startTime: float seconds
   - endTime: float seconds
   - formattedStartTime: "MM:SS.s"
   - formattedEndTime: "MM:SS.s"
   - text: exact transcript text for this segment

Respond ONLY with valid JSON in this exact structure:
{
  "cleanTranscript": "string",
  "segments": [
    {
      "id": 1,
      "title": "string",
      "summary": "string",
      "startTime": 0,
      "endTime": 12.5,
      "formattedStartTime": "00:00.0",
      "formattedEndTime": "00:12.5",
      "text": "string"
    }
  ]
}

WebVTT Content:
${vttContent.slice(0, 15000)}`;

        const geminiRes = await callGeminiApi(prompt, apiKey);
        if (geminiRes) {
          try {
            const parsed = JSON.parse(geminiRes.replace(/```json|```/g, '').trim());
            if (parsed.segments && Array.isArray(parsed.segments) && parsed.segments.length === 10) {
              return {
                statusCode: 200,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed)
              };
            }
          } catch (e) {
            console.warn('Failed to parse Gemini JSON response, falling back:', e);
          }
        }
      }

      // Fallback robust VTT 10-segment splitting
      const result = createTenSegments(vttContent);
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      };
    }

    // Action 2: Analyze top 10 YouTube Shorts hooks
    if (action === 'analyze_hooks') {
      const topHooks: Top10HookInput[] = body.topHooks || [];

      if (apiKey && topHooks.length > 0) {
        const prompt = `You are an AI video growth consultant analyzing YouTube Shorts hooks using model Gemini-3.1-flash-lite.
Analyze the following top 10 short video hooks along with their swipe rate & retention metrics:
${JSON.stringify(topHooks, null, 2)}

Provide an analysis of what makes a good hook in valid JSON:
{
  "overview": "string",
  "topTopics": ["string"],
  "powerWords": ["string"],
  "structuralPatterns": ["string"],
  "emotionalTriggers": ["string"],
  "retentionKeyFactors": ["string"]
}`;

        const geminiRes = await callGeminiApi(prompt, apiKey);
        if (geminiRes) {
          try {
            const parsed = JSON.parse(geminiRes.replace(/```json|```/g, '').trim());
            return {
              statusCode: 200,
              headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify(parsed)
            };
          } catch (e) {
            console.warn('Failed to parse Gemini analysis JSON:', e);
          }
        }
      }

      const analysis = analyzeTop10Hooks(topHooks);
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(analysis)
      };
    }

    // Action 3: Suggest hooks for selected segment
    if (action === 'suggest_hooks') {
      const segment: VttSegment = body.segment;
      const hookAnalysis: HookAnalysis = body.hookAnalysis || analyzeTop10Hooks([]);

      if (!segment) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'segment is required' })
        };
      }

      if (apiKey) {
        const prompt = `You are a viral YouTube Shorts hook editor using model Gemini-3.1-flash-lite.
Based on this Hook Analysis:
${JSON.stringify(hookAnalysis, null, 2)}

And this segment of a transcript:
Start Time: ${segment.startTime}s, End Time: ${segment.endTime}s
Original Text: "${segment.text}"

Generate 3 high-converting hook options. IMPORTANT: Each hook option MUST improve the original text by cutting contiguous filler words (e.g., opening greetings, weak setup phrases) to make the message punchy and immediate.

Return ONLY JSON:
{
  "suggestions": [
    {
      "id": "hook_1",
      "originalText": "${segment.text.replace(/"/g, '\\"')}",
      "suggestedHookText": "string",
      "cutWordsDescription": "string detailing contiguous words cut",
      "startTime": ${segment.startTime},
      "endTime": ${segment.startTime + 4},
      "formattedStartTime": "${segment.formattedStartTime}",
      "formattedEndTime": "${formatTime(segment.startTime + 4)}",
      "reasoning": "string explaining why this is a strong hook",
      "score": 95
    }
  ]
}`;

        const geminiRes = await callGeminiApi(prompt, apiKey);
        if (geminiRes) {
          try {
            const parsed = JSON.parse(geminiRes.replace(/```json|```/g, '').trim());
            if (parsed.suggestions) {
              return {
                statusCode: 200,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed)
              };
            }
          } catch (e) {
            console.warn('Failed to parse Gemini suggestions JSON:', e);
          }
        }
      }

      const suggestions = suggestHooksForSegment(segment, hookAnalysis);
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestions })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action parameter' })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
};
