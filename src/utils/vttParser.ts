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
 * Parses WebVTT content string into structured transcript data
 */
export function parseVttContent(vttText: string): ParsedVttResult {
  const lines = vttText.split(/\r?\n/);
  const segments: TranscriptSegment[] = [];

  let currentStart = -1;
  let currentEnd = -1;
  let currentTextLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip WEBVTT header, NOTE comments, or empty lines before timestamps
    if (line.startsWith('WEBVTT') || line.startsWith('NOTE') || line.startsWith('STYLE')) {
      continue;
    }

    // Check for timestamp line e.g. "00:00:01.200 --> 00:00:03.500"
    if (line.includes('-->')) {
      // If we have previous segment, push it
      if (currentStart >= 0 && currentTextLines.length > 0) {
        const text = currentTextLines.join(' ').replace(/<[^>]*>/g, '').trim();
        if (text) {
          segments.push({
            start: Number(currentStart.toFixed(2)),
            duration: Number((Math.max(0, currentEnd - currentStart)).toFixed(2)),
            text
          });
        }
        currentTextLines = [];
      }

      const [startStr, endStr] = line.split('-->').map(s => s.trim().split(' ')[0]);
      currentStart = parseVttTimestamp(startStr);
      currentEnd = parseVttTimestamp(endStr);
    } else if (currentStart >= 0 && line.length > 0 && !/^\d+$/.test(line)) {
      // Content line (ignore line numbers)
      currentTextLines.push(line);
    }
  }

  // Push last segment
  if (currentStart >= 0 && currentTextLines.length > 0) {
    const text = currentTextLines.join(' ').replace(/<[^>]*>/g, '').trim();
    if (text) {
      segments.push({
        start: Number(currentStart.toFixed(2)),
        duration: Number((Math.max(0, currentEnd - currentStart)).toFixed(2)),
        text
      });
    }
  }

  const cleanTranscript = segments.map(s => s.text).join(' ');
  const first4sSegments = segments.filter(s => s.start < 4.0);
  const first4sTranscriptJson = JSON.stringify(first4sSegments);

  return {
    cleanTranscript,
    first4sSegments,
    first4sTranscriptJson,
    allSegments: segments
  };
}
