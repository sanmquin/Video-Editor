# WebVTT Parser & Deduplication Specification (`clip-cli`)

This document details the architecture, format nuances, deduplication logic, and best practices for parsing WebVTT (`.vtt`) subtitle files—specifically auto-generated transcripts exported from YouTube.

---

## 📖 1. Overview & WebVTT Format Nuances

### Standard WebVTT Format
The WebVTT (Web Video Text Tracks) format is a W3C standard for displaying timed text tracks (such as subtitles or captions). A typical standard WebVTT file consists of:
1. A mandatory `WEBVTT` header.
2. Optional `NOTE` or `STYLE` metadata blocks.
3. Timed cue blocks separated by blank lines:

```vtt
WEBVTT

00:00:01.000 --> 00:00:04.000
Welcome to StudioCut.

00:00:04.000 --> 00:00:08.000
In this video, we will learn video editing.
```

### ⚠️ YouTube Auto-Generated Transcripts & Rolling Buffer Windows
YouTube auto-generated subtitles differ significantly from manual static subtitles. YouTube streams auto-captions in **rolling buffer windows** (often 2–3 lines high) to provide real-time word-by-word visual feedback to viewers.

This introduces two distinct artifacts:
1. **Inline Word Timestamps (`<hh:mm:ss.mmm>`)**:
   YouTube embeds sub-second timestamps directly before individual words inside cue payload strings, e.g.:
   `Cuando<00:00:00.799> una<00:00:01.040> pareja<00:00:01.439> dice`
2. **Scrolling Window Word Duplications**:
   As the speaker speaks, YouTube creates a new cue block for every phrase chunk. Each new cue repeats the last line or trailing words from the previous cue before adding new words:

#### Example YouTube VTT Input:
```vtt
00:00:00.160 --> 00:00:02.270
Cuando<00:00:00.799> una<00:00:01.040> pareja<00:00:01.439> dice,<00:00:01.760> "Nunca<00:00:02.040> hemos

00:00:02.270 --> 00:00:02.280
Cuando una pareja dice, "Nunca hemos

00:00:02.280 --> 00:00:03.909
Cuando una pareja dice, "Nunca hemos tenido<00:00:02.560> un<00:00:02.760> problema."<00:00:03.480> O<00:00:03.560> se<00:00:03.719> están

00:00:03.909 --> 00:00:03.919
tenido un problema." O se están

00:00:03.919 --> 00:00:06.269
tenido un problema." O se están engañando<00:00:04.640> o<00:00:04.839> están<00:00:05.040> mintiendo.<00:00:05.759> Son<00:00:05.960> dos
```

Naive text extraction (`" ".join(cues)`) on the above snippet yields massive word repetitions:
> ❌ *Cuando una pareja dice, "Nunca hemos Cuando una pareja dice, "Nunca hemos Cuando una pareja dice, "Nunca hemos tenido un problema." O se están tenido un problema." O se están tenido un problema." O se están engañando o están mintiendo. Son dos*

---

## 🧠 2. Deduplication Algorithm Logic

To construct fluent, prose-quality text without word repetitions, StudioCut implements a **Word-Level Suffix-Prefix Overlap Matching Algorithm**.

### Step-by-Step Processing Pipeline

```
┌────────────────────────┐
│  Raw WebVTT Cue Lines  │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  1. Strip HTML & Inline│
│     Timestamps <...>   │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  2. Normalize Words    │
│     (Lowercase/Alpha)  │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  3. Suffix-Prefix      │
│     Overlap Search     │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  4. Append Only Newly  │
│     Emitted Words      │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Clean Full Transcript  │
└────────────────────────┘
```

### Algorithm Implementation Details

1. **Tag Stripping & Text Sanitization**:
   All inline timestamps `<hh:mm:ss.mmm>` and HTML voice/formatting tags (`<v Host>`, `<b>`, `<i>`) are removed via regular expression:
   ```python
   clean_text = re.sub(r'<[^>]*>', '', raw_text)
   clean_text = re.sub(r'\s+', ' ', clean_text).strip()
   ```

2. **Suffix-Prefix Overlap Search**:
   For each new cue line with words $W = [w_1, w_2, \dots, w_m]$, we search for the largest integer $k \le m$ such that the prefix of $W$ of length $k$ matches the trailing suffix of length $k$ of the accumulated transcript $C = [c_1, c_2, \dots, c_n]$:
   $$\text{Normalized}(W[1 \dots k]) == \text{Normalized}(C[n-k+1 \dots n])$$

3. **Sub-phrase Repetition Detection**:
   If a cue line is a completely repeated sub-phrase already present at the end of the accumulated transcript (e.g., intermediate flash cue lines like `tenido un problema." O se están`), $k$ is set to $m$, and zero new words are added.

4. **Incremental Appending**:
   Only the newly introduced suffix words $W[k+1 \dots m]$ are appended to $C$.

#### Cleaned Result Example:
> ✅ *Cuando una pareja dice, "Nunca hemos tenido un problema." O se están engañando o están mintiendo. Son dos*

---

## 🛠️ 3. Python & TypeScript Implementation

### Python (Google Colab / `clip-cli`)
Located in `notebooks/clip-cli/vtt_parser.ipynb`:
```python
def normalize_word(word):
    return re.sub(r'[^\w]', '', word).lower()

def clean_cue_raw_text(raw_text):
    text = re.sub(r'<[^>]*>', '', raw_text)
    return re.sub(r'\s+', ' ', text).strip()

def deduplicate_cues(cues, cumulative_words):
    for cue in cues:
        cue_clean = clean_cue_raw_text(' '.join(cue['raw']))
        if not cue_clean: continue

        words = cue_clean.split()
        max_overlap = 0
        max_lookback = min(len(cumulative_words), 50)

        for k in range(1, len(words) + 1):
            prefix = [normalize_word(w) for w in words[:k]]
            for start in range(len(cumulative_words) - max_lookback, len(cumulative_words) - k + 1):
                if start < 0: continue
                suffix = [normalize_word(w) for w in cumulative_words[start:start+k]]
                if prefix == suffix and (start + k == len(cumulative_words)):
                    if k > max_overlap:
                        max_overlap = k

        # Sub-phrase match check
        if max_overlap == 0 and len(cumulative_words) > 0:
            norm_words = [normalize_word(w) for w in words]
            norm_cum = [normalize_word(w) for w in cumulative_words[-max_lookback:]]
            for i in range(len(norm_cum) - len(norm_words) + 1):
                if norm_cum[i:i+len(norm_words)] == norm_words:
                    max_overlap = len(words)
                    break

        new_words = words[max_overlap:]
        cumulative_words.extend(new_words)
        cue['incremental_clean'] = ' '.join(new_words)
```

### TypeScript (StudioCut Core Utility)
Located in `src/utils/vttParser.ts`:
```typescript
export function deduplicateCueTexts(cueTexts: string[]): { cleanedSegments: string[]; fullTranscript: string } { ... }
```

---

## 💡 4. YouTube Transcript Extraction Best Practices

When extracting YouTube transcripts programmatically or manually:
1. **Prefer Official YouTube Captions over Auto-Generated**: Manually uploaded CC tracks (`.vtt` or `.srt`) do not contain rolling buffer windows or inline timestamps.
2. **Always Strip Inline Timestamps First**: Inline tags like `<00:00:01.040>` disrupt string matching and word tokenization if not removed prior to comparison.
3. **Use Punctuation-Aware Normalization**: Compare normalized words (lowercase alphanumeric) to ensure punctuation marks like `"`, `,`, or `.` do not break overlap matching between cue lines.
4. **Preserve Cue Timestamps for Video Clipping**: Store the starting timestamp of the *first* cue that introduced a word chunk so video clipping engines (e.g. FFmpeg) maintain precise video-to-transcript alignment.
