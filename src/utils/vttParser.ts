import type { TranscriptSegment } from '../../netlify/functions/youtube-analytics';

export interface ParsedVttResult {
  cleanTranscript: string;
  first4sSegments: TranscriptSegment[];
  first4sTranscriptJson: string;
  allSegments: TranscriptSegment[];
}

export interface TimedWord {
  word: string;
  start: number;
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
export function normalizeWord(word: string): string {
  return word.replace(/[^\w]/g, '').toLowerCase();
}

/**
 * Strips HTML tags (e.g. <v Host>, <b>, </i>, <c>) but keeps text content
 */
export function stripHtmlTags(rawText: string): string {
  return rawText.replace(/<\/?(?![\d:\.,]+>)[a-zA-Z][^>]*>/g, '').trim();
}

/**
 * Extracts timed words from a cue text containing optional inline timestamps <00:00:01.200>
 */
export function extractCueTimedWords(cueStart: number, rawText: string): TimedWord[] {
  const cleanTags = rawText.replace(/<\/?(?![\d:\.,]+>)[a-zA-Z][^>]*>/g, '');
  const pattern = /(<(?:\d{2}:)?\d{2}:\d{2}[\.,]\d{3}>)|([^\s<>]+)/g;

  let currentTime = cueStart;
  const timedWords: TimedWord[] = [];

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(cleanTags)) !== null) {
    const tsTag = match[1];
    const word = match[2];
    if (tsTag) {
      const tsStr = tsTag.replace('<', '').replace('>', '');
      currentTime = parseVttTimestamp(tsStr);
    } else if (word) {
      timedWords.push({ word, start: currentTime });
    }
  }

  return timedWords;
}

/**
 * Deduplicates YouTube rolling auto-captions across cues using word-level suffix-prefix overlap matching.
 */
export function deduplicateCueTexts(cueTexts: string[]): { cleanedSegments: string[]; fullTranscript: string } {
  const cumulativeWords: string[] = [];
  const cleanedSegments: string[] = [];

  for (const rawText of cueTexts) {
    const text = rawText.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
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
 * Parses WebVTT content string into structured transcript data with YouTube rolling auto-caption deduplication
 * and word-level timestamp tracking.
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

  const cumulativeTimedWords: TimedWord[] = [];
  const cleanedSegments: string[] = [];
  let lastCueEnd = 0.0;

  for (let i = 0; i < rawCues.length; i++) {
    const cue = rawCues[i];
    const rawText = cue.textLines.join(' ');
    const cueWords = extractCueTimedWords(cue.start, rawText);

    if (cueWords.length === 0) {
      cleanedSegments.push('');
      continue;
    }

    const normCueWords = cueWords.map(w => normalizeWord(w.word));
    let maxOverlap = 0;

    const maxLookback = Math.min(cumulativeTimedWords.length, 50);

    // 1. Suffix-prefix overlap matching with recent cumulative words
    for (let k = Math.min(cueWords.length, maxLookback); k >= 1; k--) {
      const prefix = normCueWords.slice(0, k);
      const suffix = cumulativeTimedWords.slice(-k).map(w => normalizeWord(w.word));
      let match = true;
      for (let j = 0; j < k; j++) {
        if (prefix[j] !== suffix[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        maxOverlap = k;
        break;
      }
    }

    // 2. Sub-phrase flash-cue check ONLY if cue start time overlaps or immediately follows last cue (e.g. <= lastCueEnd + 0.2)
    if (maxOverlap === 0 && cumulativeTimedWords.length > 0) {
      if (cue.start <= lastCueEnd + 0.2) {
        const normCum = cumulativeTimedWords.slice(-maxLookback).map(w => normalizeWord(w.word));
        for (let idx = 0; idx <= normCum.length - normCueWords.length; idx++) {
          let subMatch = true;
          for (let j = 0; j < normCueWords.length; j++) {
            if (normCum[idx + j] !== normCueWords[j]) {
              subMatch = false;
              break;
            }
          }
          if (subMatch) {
            maxOverlap = normCueWords.length;
            break;
          }
        }
      }
    }

    const newWords = cueWords.slice(maxOverlap);
    cumulativeTimedWords.push(...newWords);
    cleanedSegments.push(newWords.map(w => w.word).join(' '));
    lastCueEnd = Math.max(lastCueEnd, cue.end);
  }

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
  const cleanTranscript = cumulativeTimedWords.map(w => w.word).join(' ');

  return {
    cleanTranscript,
    first4sSegments,
    first4sTranscriptJson,
    allSegments: segments
  };
}
