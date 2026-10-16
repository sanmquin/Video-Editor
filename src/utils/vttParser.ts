import type { TranscriptSegment } from '../../netlify/functions/youtube-analytics';

export interface ParsedVttResult {
  cleanTranscript: string;
  first4sSegments: TranscriptSegment[];
  first4sTranscriptJson: string;
  allSegments: TranscriptSegment[];
}

/**
 * Converts timestamp string "00:01:23.456" or "01:23.456" to seconds float
 */
export function parseVttTimestamp(timestampStr: string): number {
  const clean = timestampStr.trim().replace(',', '.');
  const parts = clean.split(':');
  let seconds = 0;

  if (parts.length === 3) {
    seconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2]);
  } else if (parts.length === 2) {
    seconds = parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
  } else if (parts.length === 1) {
    seconds = parseFloat(parts[0]);
  }

  return isNaN(seconds) ? 0 : seconds;
}

/**
 * Normalizes a word string for comparison (lowercase, alphanumeric characters only)
 */
function normalizeWord(word: string): string {
  return word.replace(/[^\w]/g, '').toLowerCase();
}

/**
 * Strips HTML tags and inline timestamps (e.g. <00:00:01.200>, <v Host>, <b>)
 */
function cleanCueText(rawText: string): string {
  return rawText.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Deduplicates YouTube rolling auto-captions across cues using word-level suffix-prefix overlap matching.
 */
export function deduplicateCueTexts(cueTexts: string[]): { cleanedSegments: string[]; fullTranscript: string } {
  const cumulativeWords: string[] = [];
  const cleanedSegments: string[] = [];

  for (const rawText of cueTexts) {
    const text = cleanCueText(rawText);
    if (!text) {
      cleanedSegments.push('');
      continue;
    }

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      cleanedSegments.push('');
      continue;
    }

    let maxOverlap = 0;
    const maxLookback = Math.min(cumulativeWords.length, 50);

    // 1. Suffix-prefix overlap search
    for (let k = 1; k <= words.length; k++) {
      const prefix = words.slice(0, k).map(normalizeWord);
      for (let start = cumulativeWords.length - maxLookback; start <= cumulativeWords.length - k; start++) {
        if (start < 0) continue;
        const suffix = cumulativeWords.slice(start, start + k).map(normalizeWord);
        let match = true;
        for (let i = 0; i < k; i++) {
          if (prefix[i] !== suffix[i]) {
            match = false;
            break;
          }
        }
        if (match && start + k === cumulativeWords.length) {
          if (k > maxOverlap) {
            maxOverlap = k;
          }
        }
      }
    }

    // 2. Sub-phrase match if cue is completely repeated line inside recent cumulative words
    if (maxOverlap === 0 && cumulativeWords.length > 0) {
      const normWords = words.map(normalizeWord);
      const normCum = cumulativeWords.slice(-maxLookback).map(normalizeWord);
      for (let i = 0; i <= normCum.length - normWords.length; i++) {
        let subMatch = true;
        for (let j = 0; j < normWords.length; j++) {
          if (normCum[i + j] !== normWords[j]) {
            subMatch = false;
            break;
          }
        }
        if (subMatch) {
          maxOverlap = words.length;
          break;
        }
      }
    }

    const newWords = words.slice(maxOverlap);
    cumulativeWords.push(...newWords);
    cleanedSegments.push(newWords.join(' '));
  }

  return {
    cleanedSegments,
    fullTranscript: cumulativeWords.join(' ')
  };
}

/**
 * Parses WebVTT content string into structured transcript data with YouTube rolling auto-caption deduplication.
 */
export function parseVttContent(vttText: string): ParsedVttResult {
  const lines = vttText.split(/\r?\n/);
  const rawCues: { start: number; end: number; textLines: string[] }[] = [];

  let currentStart = -1;
  let currentEnd = -1;
  let currentTextLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('WEBVTT') || line.startsWith('NOTE') || line.startsWith('STYLE')) {
      continue;
    }

    if (line.includes('-->')) {
      if (currentStart >= 0 && currentTextLines.length > 0) {
        rawCues.push({
          start: currentStart,
          end: currentEnd,
          textLines: [...currentTextLines]
        });
        currentTextLines = [];
      }

      const [startStr, endStr] = line.split('-->').map(s => s.trim().split(' ')[0]);
      currentStart = parseVttTimestamp(startStr);
      currentEnd = parseVttTimestamp(endStr);
    } else if (currentStart >= 0 && line.length > 0 && !/^\d+$/.test(line)) {
      currentTextLines.push(line);
    }
  }

  if (currentStart >= 0 && currentTextLines.length > 0) {
    rawCues.push({
      start: currentStart,
      end: currentEnd,
      textLines: [...currentTextLines]
    });
  }

  const rawCueTexts = rawCues.map(c => c.textLines.join(' '));
  const { cleanedSegments, fullTranscript } = deduplicateCueTexts(rawCueTexts);

  const segments: TranscriptSegment[] = [];
  for (let i = 0; i < rawCues.length; i++) {
    const text = cleanedSegments[i];
    if (text) {
      segments.push({
        start: Number(rawCues[i].start.toFixed(2)),
        duration: Number((Math.max(0, rawCues[i].end - rawCues[i].start)).toFixed(2)),
        text
      });
    }
  }

  const first4sSegments = segments.filter(s => s.start < 4.0);
  const first4sTranscriptJson = JSON.stringify(first4sSegments);

  return {
    cleanTranscript: fullTranscript,
    first4sSegments,
    first4sTranscriptJson,
    allSegments: segments
  };
}
